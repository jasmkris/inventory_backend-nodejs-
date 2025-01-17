import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PAGE_SIZE = 20;

interface QueryParams {
  startDate?: string;
  endDate?: string;
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE' | 'TRANSIT';
  userId?: string;
  roomId?: string;
  page?: string;
  limit?: string;
}

export const getGlobalHistory = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      action,
      userId,
      roomId,
      page = '1',
      limit = String(DEFAULT_PAGE_SIZE)
    }: QueryParams = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where: any = {};
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (roomId) where.object = { roomId };

    // Get total count for pagination
    const total = await prisma.history.count({ where });

    // Get paginated results
    const history = await prisma.history.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        object: {
          select: {
            id: true,
            name: true,
            room: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    res.json({
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getRoomHistory = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const {
      startDate,
      endDate,
      page = '1',
      limit = String(DEFAULT_PAGE_SIZE)
    }: QueryParams = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where: any = {
      object: { roomId }
    };
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    // Get total count for pagination
    const total = await prisma.history.count({ where });

    const history = await prisma.history.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        object: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    res.json({
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const {
      startDate,
      endDate,
      page = '1',
      limit = String(DEFAULT_PAGE_SIZE)
    }: QueryParams = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where: any = { userId };
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    // Get total count for pagination
    const total = await prisma.history.count({ where });

    const history = await prisma.history.findMany({
      where,
      include: {
        object: {
          select: {
            id: true,
            name: true,
            room: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    res.json({
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getHistoryStats = async (req: Request, res: Response) => {
  try {
    // Get action counts
    const actionCounts = await prisma.history.groupBy({
      by: ['action'],
      _count: true
    });

    // Get recent activity
    const recentActivity = await prisma.history.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        object: {
          select: {
            name: true,
            room: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Get most active users
    const activeUsers = await prisma.history.groupBy({
      by: ['userId'],
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 5
    });

    // Get most modified objects
    const modifiedObjects = await prisma.history.groupBy({
      by: ['objectId'],
      _count: true,
      orderBy: {
        _count: {
          objectId: 'desc'
        }
      },
      take: 5
    });

    res.json({
      actionCounts,
      recentActivity,
      activeUsers,
      modifiedObjects
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}; 