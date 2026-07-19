import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/authGuard';

export const getOrganizationTree = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profiles = await prisma.employeeProfile.findMany({
      where: { 
        deleted_at: null,
        user: { role: { not: 'SUPER_ADMIN' } }
      },
      select: { id: true, name: true, designation: true, profile_image: true, reporting_manager_id: true }
    });

    const map = new Map();
    profiles.forEach(emp => map.set(emp.id, { ...emp, direct_reports: [] }));
    
    const tree: any[] = [];
    map.forEach(emp => {
      if (emp.reporting_manager_id && map.has(emp.reporting_manager_id)) {
        map.get(emp.reporting_manager_id).direct_reports.push(emp);
      } else {
        tree.push(emp);
      }
    });

    res.status(200).json({ data: tree });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organization tree' });
  }
};

export const getReporters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reporters = await prisma.employeeProfile.findMany({
      where: { reporting_manager_id: req.params.id as string, deleted_at: null },
      select: { id: true, name: true, designation: true, profile_image: true }
    });
    res.status(200).json({ data: reporters });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reporters' });
  }
};

export const assignManager = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.params.id;
    const { reporting_manager_id } = req.body;

    if (employeeId === reporting_manager_id) {
      res.status(400).json({ message: 'Employee cannot report to themselves' });
      return;
    }

    let currentManagerId = reporting_manager_id;
    while (currentManagerId) {
      if (currentManagerId === employeeId) {
        res.status(400).json({ message: 'Circular reporting detected' });
        return;
      }
      const manager = await prisma.employeeProfile.findUnique({
        where: { id: currentManagerId },
        select: { reporting_manager_id: true }
      });
      currentManagerId = manager?.reporting_manager_id;
    }

    const updated = await prisma.employeeProfile.update({
      where: { id: employeeId as string },
      data: { reporting_manager_id }
    });

    res.status(200).json({ message: 'Manager assigned successfully', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning manager' });
  }
};
