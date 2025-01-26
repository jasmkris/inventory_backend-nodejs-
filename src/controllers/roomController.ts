import { Request, Response } from 'express';
import { Category, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, isTransit } = req.body;

    // Check if a room with the same name exists
    const existingRoom = await prisma.room.findFirst({
      where: { name }
    });

    if (existingRoom) {
      res.status(400).json({ error: 'Room with this name already exists' });
      return;
    }

    // Create new room
    const room = await prisma.room.create({
      data: {
        name,
        description,
        isTransit: isTransit || false
      }
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create room' });
  }
};

export const getAllRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const where = search ? {
      OR: [
        {
          name: {
            contains: search as string,
            mode: 'insensitive' as const
          }
        },
        {
          description: {
            contains: search as string,
            mode: 'insensitive' as const
          }
        }
      ]
    } : {};

    const rooms = await prisma.room.findMany({
      where,
      include: {
        _count: {
          select: { objects: true }
        }
      }
    });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

export const getRoomById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        _count: {
          select: { objects: true }
        }
      }
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
};

export const getRoomObjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { search, category } = req.query;

    const where = {
      roomId,
      ...(category ? { category: category as Category } : {}),
      ...(search ? {
        OR: [
          {
            name: {
              contains: search as string,
              mode: 'insensitive' as const
            }
          },
          {
            description: {
              contains: search as string,
              mode: 'insensitive' as const
            }
          }
        ]
      } : {})
    };

    const objects = await prisma.object.findMany({
      where,
      include: {
        room: true
      }
    });

    res.json(objects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room objects' });
  }
};

export const updateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { name, description, isTransit } = req.body;

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Check if it's the transit room
    if (room.isTransit) {
      res.status(400).json({ error: 'Cannot modify transit room' });
      return;
    }

    // If name is being updated, check for duplicates
    if (name && name !== room.name) {
      const existingRoom = await prisma.room.findFirst({
        where: { name }
      });

      if (existingRoom) {
        res.status(400).json({ error: 'Room with this name already exists' });
        return;
      }
    }

    // Update room
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        name,
        description,
        isTransit
      }
    });

    res.json(updatedRoom);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update room' });
  }
};

export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    // Check if room exists and is not transit room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        _count: {
          select: { objects: true }
        }
      }
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    if (room.isTransit) {
      res.status(400).json({ error: 'Cannot delete transit room' });
      return;
    }

    // Check if room has objects
    if (room._count.objects > 0) {
      res.status(400).json({
        error: 'Cannot delete room with objects. Please move or delete objects first.'
      });
      return;
    }

    // Delete room
    await prisma.room.delete({
      where: { id: roomId }
    });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete room' });
  }
}; 