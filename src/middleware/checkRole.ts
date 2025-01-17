import { Request, Response, NextFunction } from 'express';

type UserRole = 'MANAGER' | 'EMPLOYEE';

export const checkRole = (roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!roles.includes(req.user.role as UserRole)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
}; 