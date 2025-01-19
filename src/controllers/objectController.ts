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

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Create object with proper category enum value
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
            userId: req.user!.id,
            details: 'Object created'
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

    console.log('Object created successfully:', object);
    res.status(201).json(object);
  } catch (error) {
    console.error('Error creating object:', error);
    res.status(400).json({ 
      error: 'Failed to create object',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getObjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectId } = req.params;

    const object = await prisma.object.findUnique({
      where: { id: objectId }
    });
    if (!object) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }

    res.json(object);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch object' });
  }
};

export const updateObject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectId } = req.params;
    const { name, category, quantity, description } = req.body;

    const object = await prisma.object.update({
      where: { id: objectId },
      data: {
        name,
        category,
        quantity,
        description,
        history: {
          create: {
            action: 'UPDATE',
            userId: req.user!.id,
            details: 'Object updated'
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

    res.json(object);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteObject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectId } = req.params;
    const { reason } = req.body;

    // Create final history entry before deletion
    await prisma.history.create({
      data: {
        objectId,
        userId: req.user!.id,
        action: 'DELETE',
        details: reason || 'Object deleted'
      }
    });

    await prisma.object.delete({
      where: { id: objectId }
    });

    res.json({ message: 'Object deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const moveObject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { objectId } = req.params;
    const { roomId, reason } = req.body;

    // Check if target room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      res.status(404).json({ error: 'Target room not found' });
      return;
    }

    const object = await prisma.object.update({
      where: { id: objectId },
      data: {
        roomId,
        history: {
          create: {
            action: 'MOVE',
            userId: req.user!.id,
            details: reason || `Moved to ${room.name}`
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

    res.json(object);
  } catch (error) {
    res.status(400).json({ error: 'Failed to move object' });
  }
};

export const createVariant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalObjectId } = req.params;
    const { name, description, quantity, roomId, category } = req.body;

    // Get original object
    const originalObject = await prisma.object.findUnique({
      where: { id: originalObjectId },
      include: { variants: true }
    });

    if (!originalObject) {
      res.status(404).json({ error: 'Original object not found' });
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
            userId: req.user!.id,
            details: `Created as variant of ${originalObject.name}`
          }
        }
      }
    });

    // Notify via WebSocket
    wsService.getInstance().notifyObjectUpdate(roomId, {
      action: 'VARIANT_CREATED',
      object: variant
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

    // Get transit room
    const transitRoom = await prisma.room.findFirst({
      where: { isTransit: true }
    });

    if (!transitRoom) {
      res.status(404).json({ error: 'Transit room not found' });
      return;
    }

    const object = await prisma.object.update({
      where: { id: objectId },
      data: {
        roomId: transitRoom.id,
        history: {
          create: {
            action: 'TRANSIT',
            userId: req.user!.id,
            details: reason
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

    res.json(object);
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
