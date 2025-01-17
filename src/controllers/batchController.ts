import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { notificationService } from '../services/notification';
import { redisService } from '../services/redis';
import { searchService } from '../services/search';
import { ValidationError } from '../utils/errors';

const prisma = new PrismaClient();

interface BatchOperation {
  objectIds: string[];
  targetRoomId?: string;
  reason?: string;
  status?: string;
  tags?: string[];
  quantity?: number;
  action: 'MOVE' | 'DELETE' | 'TRANSIT' | 'TAG' | 'UPDATE_QUANTITY' | 'ARCHIVE';
}

export class BatchController {
  private async validateObjects(tx: Prisma.TransactionClient, objectIds: string[]) {
    const objects = await tx.object.findMany({
      where: { id: { in: objectIds } },
      include: { room: true }
    });

    if (objects.length !== objectIds.length) {
      const found = new Set(objects.map((o: { id: string }) => o.id));
      const missing = objectIds.filter(id => !found.has(id));
      throw new ValidationError(`Objects not found: ${missing.join(', ')}`);
    }

    return objects;
  }

  private async validateRoom(tx: Prisma.TransactionClient, roomId: string) {
    const room = await tx.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      throw new ValidationError(`Room not found: ${roomId}`);
    }

    return room;
  }

  async executeBatchOperation(req: Request, res: Response) {
    const operation: BatchOperation = req.body;
    const userId = req.user!.id;

    try {
      const result = await prisma.$transaction(async (tx: any) => {
        // Validate objects first
        const objects = await this.validateObjects(tx, operation.objectIds);

        switch (operation.action) {
          case 'MOVE':
            return await this.batchMove(tx, objects, operation, userId);
          case 'DELETE':
            return await this.batchDelete(tx, objects, operation, userId);
          case 'TRANSIT':
            return await this.batchTransit(tx, objects, operation, userId);
          case 'TAG':
            return await this.batchTag(tx, objects, operation, userId);
          case 'UPDATE_QUANTITY':
            return await this.batchUpdateQuantity(tx, objects, operation, userId);
          case 'ARCHIVE':
            return await this.batchArchive(tx, objects, operation, userId);
          default:
            throw new ValidationError('Invalid batch operation');
        }
      });

      // Invalidate relevant caches
      await this.invalidateCaches(operation);
      // Notify about the batch operation
      await notificationService.notifyBatchOperation({
        action: operation.action,
        items: operation.objectIds,
        userId,
        details: operation
      });

      res.json(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Server error' });
      }
    }
  }

  private async batchMove(tx: Prisma.TransactionClient, objects: any[], operation: BatchOperation, userId: string) {
    const targetRoom = await this.validateRoom(tx, operation.targetRoomId!);

    return Promise.all(objects.map(async (obj) => {
      const updated = await tx.object.update({
        where: { id: obj.id },
        data: {
          roomId: targetRoom.id,
          updatedAt: new Date(),
          status: 'MOVED' 
        }
      });

      await tx.history.create({
        data: {
          objectId: obj.id,
          userId,
          action: 'MOVE',
          details: {
            fromRoomId: obj.roomId,
            toRoomId: targetRoom.id,
            reason: operation.reason
          }
        }
      });

      return updated;
    }));
  }

  private async batchDelete(
    tx: Prisma.TransactionClient,
    objects: any[],
    operation: BatchOperation,
    userId: string
  ) {
    const { reason } = operation;

    // Create final history entries before deletion
    await tx.history.createMany({
      data: objects.map(obj => ({
        objectId: obj.id,
        userId,
        action: 'DELETE',
        details: reason || 'Batch deletion'
      }))
    });

    // Delete objects
    await tx.object.deleteMany({
      where: { id: { in: objects.map(obj => obj.id) } }
    });

    return { message: `Successfully deleted ${objects.length} objects` };
  }

  private async batchTransit(
    tx: Prisma.TransactionClient,
    objects: any[],
    operation: BatchOperation,
    userId: string
  ) {
    // Get transit room
    const transitRoom = await tx.room.findFirst({
      where: { isTransit: true }
    });

    if (!transitRoom) {
      throw new ValidationError('Transit room not found');
    }

    // Move objects to transit room
    await Promise.all(objects.map(async (obj) => {
      await tx.object.update({
        where: { id: obj.id },
        data: {
          roomId: transitRoom.id,
          status: 'IN_TRANSIT'
        }
      });

      await tx.history.create({
        data: {
          objectId: obj.id,
          userId,
          action: 'TRANSIT',
          details: operation.reason || 'Moved to transit'
        }
      });
    }));

    return { message: `Successfully moved ${objects.length} objects to transit` };
  }

  private async batchTag(
    tx: Prisma.TransactionClient,
    objects: any[],
    operation: BatchOperation,
    userId: string
  ) {
    const { tags = [], action: tagAction = 'ADD' } = operation;

    await Promise.all(objects.map(async (obj) => {
      const currentTags = obj.tags || [];
      const newTags = tagAction === 'ADD' 
        ? [...new Set([...currentTags, ...tags])]
        : currentTags.filter((t: string) => !tags.includes(t));

      await tx.object.update({
        where: { id: obj.id },
        data: { tags: newTags }
      });

      await tx.history.create({
        data: {
          objectId: obj.id,
          userId,
          action: 'TAG',
          details: `${tagAction === 'ADD' ? 'Added' : 'Removed'} tags: ${tags.join(', ')}`
        }
      });
    }));

    return { message: `Successfully ${tagAction.toLowerCase()}ed tags to ${objects.length} objects` };
  }

  private async batchUpdateQuantity(
    tx: Prisma.TransactionClient,
    objects: any[],
    operation: BatchOperation,
    userId: string
  ) {
    const { quantity } = operation;

    await Promise.all(objects.map(async (obj) => {
      await tx.object.update({
        where: { id: obj.id },
        data: { quantity }
      });

      await tx.history.create({
        data: {
          objectId: obj.id,
          userId,
          action: 'UPDATE_QUANTITY',
          details: `Updated quantity to ${quantity}`
        }
      });
    }));

    return { message: `Successfully updated quantity for ${objects.length} objects` };
  }

  private async batchArchive(
    tx: Prisma.TransactionClient,
    objects: any[],
    operation: BatchOperation,
    userId: string
  ) {
    await Promise.all(objects.map(async (obj) => {
      await tx.object.update({
        where: { id: obj.id },
        data: { status: 'ARCHIVED' }
      });

      await tx.history.create({
        data: {
          objectId: obj.id,
          userId,
          action: 'ARCHIVE',
          details: operation.reason || 'Object archived'
        }
      });
    }));

    return { message: `Successfully archived ${objects.length} objects` };
  }

  // Similar implementations for other batch operations...

  private async invalidateCaches(operation: BatchOperation) {
    const patterns = new Set<string>();

    // Add relevant cache patterns based on operation
    if (operation.targetRoomId) {
      patterns.add(`room:${operation.targetRoomId}:*`);
    }

    operation.objectIds.forEach(id => {
      patterns.add(`object:${id}:*`);
    });

    patterns.add('search:*');
    patterns.add('recent:*');

    // Invalidate all relevant patterns
    await Promise.all(
      Array.from(patterns).map(pattern => redisService.invalidatePattern(pattern))
    );
  }
}

export const batchController = new BatchController(); 