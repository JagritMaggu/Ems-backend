import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/authGuard';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, activeUsers, inactiveUsers, departmentGroups] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'Active' } }),
      prisma.user.count({ where: { status: 'Inactive' } }),
      prisma.employeeProfile.groupBy({
        by: ['department'],
        where: { deleted_at: null, department: { not: null } },
        _count: { department: true }
      })
    ]);

    const departmentCount = departmentGroups.length;

    res.status(200).json({
      data: {
        totalEmployees: totalUsers,
        activeEmployees: activeUsers,
        inactiveEmployees: inactiveUsers,
        departmentCount,
        departmentDistribution: departmentGroups.map(g => ({
          department: g.department,
          count: g._count.department
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};
