import { Request, Response } from 'express';
import { Category, PrismaClient } from '@prisma/client';
import wsService from '../services/wsService';

const prisma = new PrismaClient();

export const createObject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category, quantity, roomId, description } = req.body;
    console.log('Creating object with data:', {
      name,
      category,
      quantity,
      roomId,
      description,
      userId: req.user?.id
    });

    // Validate category enum
    if (!Object.values(Category).includes(category)) {
      res.status(400).json({ error: `Invalid category. Must be one of: ${Object.values(Category).join(', ')}` });
      return;
    }
    // Get room and user data
    const [room, user] = await Promise.all([
      prisma.room.findUnique({ where: { id: roomId } }),
      prisma.user.findUnique({ where: { id: req.user!.id } })
    ]);
    
    if (!room || !user) {
      res.status(404).json({ error: 'Room or user not found' });
      return;
    }

    const object = await prisma.object.create({
      data: {
        name,
        category: category as Category,
        quantity: parseInt(quantity),
        description,
        roomId,
        history: {
          create: {
            action: 'CREATE',
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            objectName: name,
            roomName: room.name,
            details: `${name} created in ${room.name}`
          }
        }
      },
      include: {
        room: true,
        history: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.status(201).json(object);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create object' });
  }
};

export const getObjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectId } = req.params;

    const object = await prisma.object.findUnique({
      where: { id: objectId },
      include: {
        room: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!object) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }

    res.json(object);
  } catch (error) {
    console.error('Error fetching object:', error);
    res.status(500).json({ error: 'Failed to fetch object' });
  }
};

export const updateObject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectId } = req.params;
    const { name, category, quantity, description, roomId } = req.body;

    const [existingObject, user, room] = await Promise.all([
      prisma.object.findUnique({
        where: { id: objectId },
        include: { room: true }
      }),
      prisma.user.findUnique({ where: { id: req.user!.id } }),
      roomId ? prisma.room.findUnique({ where: { id: roomId } }) : null
    ]);

    if (!existingObject || !user) {
      res.status(404).json({ error: 'Object or user not found' });
      return;
    }

    const object = await prisma.object.update({
      where: { id: objectId },
      data: {
        name,
        category,
        quantity,
        description,
        roomId,
        history: {
          create: {
            action: 'UPDATE',
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            objectName: name || existingObject.name,
            roomName: room?.name || existingObject.room.name,
            details: `${existingObject.name} updated to ${quantity} from ${existingObject.quantity}`
          }
        }
      },
      include: {
        room: true,
        history: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    console.log(object, 'object updateObject');
    res.status(200).json({ message: 'Object updated successfully', object });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const removeObjectQuantity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectId } = req.params;
    const { quantity, deleteNote } = req.body;
    console.log(quantity, deleteNote, 'removeObjectQuantity');
    // Get object and user data
    const [object, user] = await Promise.all([
      prisma.object.findUnique({
        where: { id: objectId },
        include: { room: true }
      }),
      prisma.user.findUnique({ where: { id: req.user!.id } })
    ]);

    if (!object || !user) {
      res.status(404).json({ error: 'Object or user not found' });
      return;
    }

    // Check if quantity is valid
    if (quantity > object.quantity) {
      res.status(400).json({ error: 'Insufficient quantity' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Update object quantity
      await tx.object.update({
        where: { id: objectId },
        data: { quantity: object.quantity - quantity }
      });

      // Create history entry
      await tx.history.create({
        data: {
          action: 'REMOVE',
          objectId: object.id,
          userId: user.id,
          objectName: object.name,
          userName: `${user.firstName} ${user.lastName}`,
          roomName: object.room.name,
          details: `Removed ${quantity} ${object.name} from ${object.room.name} - ${deleteNote}`
        }
      });
    });

    res.json({ message: 'Quantity removed successfully' });
  } catch (error) {
    console.error('Remove quantity operation failed:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteObject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectIds } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await Promise.all(objectIds.map(async (id: string) => {
      const object = await prisma.object.findUnique({
        where: { id },
        include: { room: true }
      });

      if (object) {
        // Create final history entry
        await prisma.history.create({
          data: {
            action: 'DELETE',
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            objectId: id,
            objectName: object.name,
            roomName: object.room.name,
            details: `${object.name} deleted from ${object.room.name}`
          }
        });

        // Delete the object
        await prisma.object.delete({
          where: { id }
        });
      }
    }));

    res.status(200).json({ message: 'Objects deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteAllObjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    
    // Get all objects with room info
    const objectsInRoom = await prisma.object.findMany({
      where: { roomId },
      include: { room: true }
    });

    if (!user || objectsInRoom.length === 0) {
      res.status(200).json({ message: 'No objects found in this room' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Create deletion history entries for all objects
      await tx.history.createMany({
        data: objectsInRoom.map(obj => ({
          objectId: obj.id,
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          objectName: obj.name,
          roomName: obj.room.name,
          action: 'DELETE',
          details: `${obj.name} deleted from ${obj.room.name}`
        }))
      });

      // Delete all objects in the room
      await tx.object.deleteMany({
        where: { roomId }
      });
    });

    res.status(200).json({
      message: 'All objects deleted successfully',
      deletedCount: objectsInRoom.length
    });
  } catch (error) {
    console.error('Delete operation failed:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const moveObject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectId } = req.params;
    const { roomId, quantity } = req.body;

    // Get all required data
    const [sourceObject, targetRoom, user] = await Promise.all([
      prisma.object.findUnique({ where: { id: objectId }, include: { room: true } }),
      prisma.room.findUnique({ where: { id: roomId } }),
      prisma.user.findUnique({ where: { id: req.user!.id } })
    ]);

    if (!sourceObject || !targetRoom || !user) {
      res.status(404).json({ error: 'Object, room, or user not found' });
      return;
    }

    // Check if quantity is valid
    if (quantity > sourceObject.quantity) {
      res.status(400).json({ error: 'Insufficient quantity' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Find existing object in target room
      const existingTargetObject = await tx.object.findFirst({
        where: {
          name: sourceObject.name,
          roomId: roomId,
          category: sourceObject.category
        }
      });

      // Update source object quantity
      await tx.object.update({
        where: { id: objectId },
        data: { quantity: sourceObject.quantity - quantity }
      });

      if (existingTargetObject) {
        // Update existing object in target room
        await tx.object.update({
          where: { id: existingTargetObject.id },
          data: { quantity: existingTargetObject.quantity + quantity }
        });
      } else {
        // Create new object in target room
        await tx.object.create({
          data: {
            name: sourceObject.name,
            category: sourceObject.category,
            description: sourceObject.description,
            quantity: quantity,
            roomId: roomId
          }
        });
      }

      // Create history entry
      await tx.history.create({
        data: {
          action: 'MOVE',
          objectId: sourceObject.id,
          userId: user.id,
          objectName: sourceObject.name,
          userName: `${user.firstName} ${user.lastName}`,
          roomName: targetRoom.name,
          details: `${quantity} ${sourceObject.name} moved from ${sourceObject.room.name} to ${targetRoom.name}`
        }
      });
    });

    res.status(200).json({ message: 'Object moved successfully' });
  } catch (error) {
    console.error('Move operation failed:', error);
    res.status(400).json({ error: 'Failed to move object' });
  }
};

export const updateObjectQuantity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectId } = req.params;
    const { quantity } = req.body;

    console.log(objectId, quantity, 'updateObjectQuantity');
    
    await prisma.object.update({
      where: { id: objectId },
      data: { quantity }
    });

    const updatedObject = await prisma.object.findUnique({
      where: { id: objectId },
      include: { room: true }
    });

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    await prisma.history.create({
      data: {
        action: 'UPDATE',
        objectId: objectId,
        userId: user!.id,
        userName: `${user!.firstName} ${user!.lastName}`,
        objectName: updatedObject!.name,
        roomName: updatedObject!.room.name,
        details: `${updatedObject!.name} updated quantity to ${quantity} from ${updatedObject!.quantity}`
      }
    });

    res.status(200).json({ message: 'Object quantity updated successfully', object: updatedObject });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update object quantity' });
  }
};

export const createVariant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalObjectId } = req.params;
    const { name, description, quantity, roomId, category } = req.body;

    const [originalObject, user] = await Promise.all([
      prisma.object.findUnique({
        where: { id: originalObjectId },
        include: { variants: true, room: true }
      }),
      prisma.user.findUnique({ where: { id: req.user!.id } })
    ]);

    if (!originalObject || !user) {
      res.status(404).json({ error: 'Original object or user not found' });
      return;
    }

    // Create variant
    const variant = await prisma.object.create({
      data: {
        name: name || originalObject.name,
        description: description || originalObject.description,
        quantity,
        roomId,
        category: category || originalObject.category,
        parentId: originalObjectId,
        history: {
          create: {
            action: 'CREATE',
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            objectName: name || originalObject.name,
            roomName: originalObject.room.name,
            details: `Created as variant of ${originalObject.name}`
          }
        }
      }
    });

    res.status(201).json(variant);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create variant' });
  }
};

export const transitObject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectId } = req.params;
    const { reason } = req.body;

    const [transitRoom, object, user] = await Promise.all([
      prisma.room.findFirst({ where: { isTransit: true } }),
      prisma.object.findUnique({
        where: { id: objectId },
        include: { room: true }
      }),
      prisma.user.findUnique({ where: { id: req.user!.id } })
    ]);

    if (!transitRoom || !object || !user) {
      res.status(404).json({ error: 'Transit room, object, or user not found' });
      return;
    }

    const updatedObject = await prisma.object.update({
      where: { id: objectId },
      data: {
        roomId: transitRoom.id,
        history: {
          create: {
            action: 'TRANSIT',
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            objectName: object.name,
            roomName: transitRoom.name,
            details: `${object.name} moved to transit from ${object.room.name}. Reason: ${reason}`
          }
        }
      },
      include: {
        room: true,
        history: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.status(200).json({ message: 'Object updated successfully', object: updatedObject });
  } catch (error) {
    res.status(400).json({ error: 'Failed to transit object' });
  }
};

export const getObjectHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectId } = req.params;

    const history = await prisma.history.findMany({
      where: { objectId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAllObjects = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all objects with their rooms
    const objects = await prisma.object.findMany({
      include: {
        room: {
          select: {
            id: true,
            name: true
          }
        },
        history: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Format the response
    const formattedObjects = objects.map(object => ({
      ...object,
      roomName: object.room.name, // Add room name to object
      // room: undefined // Remove full room object if not needed
    }));

    res.json(formattedObjects);
  } catch (error) {
    console.error('Error fetching objects:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
