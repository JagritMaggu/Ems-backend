import { Response, NextFunction } from 'express';
import { AuthRequest } from './authGuard';

export const selfGuard = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const targetId = req.params.id;

  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized: User not found' });
    return;
  }

  // req.params.id is now the EmployeeProfile ID. 
  // We need to check if the current user's profile ID matches req.params.id
  const userProfileId = req.user.employee_profile?.id;

  if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'HR_MANAGER' || userProfileId === targetId) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: You can only access your own profile' });
  }
};
