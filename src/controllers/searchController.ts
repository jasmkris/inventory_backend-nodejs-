import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_PAGE_SIZE = 20;

export const searchObjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, category, roomId, status, minQuantity, maxQuantity, lastModified, page = '1', limit = String(DEFAULT_PAGE_SIZE) } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    // Build where clause
    const where: any = {
      OR: [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { tags: { hasSome: [q as string] } }
      ]
    };

    if (category) where.category = category;
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;
    if (minQuantity) where.quantity = { gte: parseInt(minQuantity as string) };
    if (maxQuantity) where.quantity = { ...where.quantity, lte: parseInt(maxQuantity as string) };
    if (lastModified) {
      const date = new Date(lastModified as string);
      where.updatedAt = { gte: date };
    }

    const [total, objects] = await Promise.all([
      prisma.object.count({ where }),
      prisma.object.findMany({
        where,
        include: {
          room: true,
          history: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          variants: {
            select: {
              id: true,
              name: true,
              roomId: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      })
    ]);

    const result = {
      data: objects,
      pagination: {
        total,
        page: parseInt(page as string),
        pageSize: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const searchRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, page = '1', limit = String(DEFAULT_PAGE_SIZE) } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where = {
      OR: [
        { 
          name: { 
            contains: q as string, 
            mode: 'insensitive' 
          } 
        },
        { 
          description: { 
            contains: q as string, 
            mode: 'insensitive' 
          } 
        }
      ]
    } as const satisfies { OR: ({ name: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } })[] };

    const [total, rooms] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        include: {
          _count: {
            select: { objects: true }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit as string)
      })
    ]);

    res.json({
      data: rooms,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const globalSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, type = 'all' } = req.query;

    const results: any = {};

    if (type === 'all' || type === 'object') {
      results.objects = await prisma.object.findMany({
        where: {
          OR: [
            { name: { contains: q as string, mode: 'insensitive' } },
            { description: { contains: q as string, mode: 'insensitive' } }
          ]
        },
        include: {
          room: true
        },
        take: 5
      });
    }

    if (type === 'all' || type === 'room') {
      results.rooms = await prisma.room.findMany({
        where: {
          OR: [
            { name: { contains: q as string, mode: 'insensitive' } },
            { description: { contains: q as string, mode: 'insensitive' } }
          ]
        },
        include: {
          _count: {
            select: { objects: true }
          }
        },
        take: 5
      });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSearchSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, type = 'object' } = req.query;

    if (type === 'object') {
      const suggestions = await prisma.object.findMany({
        where: {
          name: { startsWith: q as string, mode: 'insensitive' }
        },
        select: {
          name: true,
          category: true
        },
        distinct: ['name'],
        take: 5
      });
      res.json(suggestions);
    } else {
      const suggestions = await prisma.room.findMany({
        where: {
          name: { startsWith: q as string, mode: 'insensitive' }
        },
        select: {
          name: true
        },
        take: 5
      });
      res.json(suggestions);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}; 