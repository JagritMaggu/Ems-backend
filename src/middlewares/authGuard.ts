import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/prisma';

export interface AuthRequest extends Request {
  user?: any;
}

export const authGuard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true, employee_profile: { select: { id: true } } }
    });

    if (!user) {
      res.status(401).json({ message: 'Unauthorized: User not found' });
      return;
    }

    if (user.status !== 'Active') {
      res.status(403).json({ message: 'Forbidden: Account is inactive' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error in auth guard' });
  }
};
