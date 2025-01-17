export {};

type UserRole = 'MANAGER' | 'EMPLOYEE';

declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
    }
  }
} 