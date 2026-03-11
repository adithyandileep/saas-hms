import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.token;
  if (!token) {
     res.status(401).json({ message: 'Unauthorized: No token provided' });
     return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
     res.status(401).json({ message: 'Unauthorized: Invalid token' });
     return;
  }

  req.user = decoded;
  next();
};

export const requireRoles = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
       res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
       return;
    }
    next();
  };
};
