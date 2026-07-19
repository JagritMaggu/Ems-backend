import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { hashPassword } from '../utils/hash';
import { AuthRequest } from '../middlewares/authGuard';
import { Prisma } from '@prisma/client';

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, department, designation, salary, joining_date, role, reporting_manager_id } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ message: 'Email, password, and name are required' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    let profile_image_url = undefined;
    if (req.file) {
      profile_image_url = `/uploads/${req.file.filename}`;
    }

    const password_hash = await hashPassword(password);

    // Create both User and EmployeeProfile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password_hash, role }
      });
      const profile = await tx.employeeProfile.create({
        data: { 
          user_id: user.id, 
          name, 
          phone, 
          department, 
          designation, 
          salary: salary ? Number(salary) : null, 
          joining_date: joining_date ? new Date(joining_date) : null, 
          reporting_manager_id: reporting_manager_id === "" ? null : reporting_manager_id, 
          profile_image: profile_image_url 
        }
      });
      return { user, profile };
    });

    res.status(201).json({ message: 'Employee created successfully', data: result.profile });
  } catch (error: any) {
    console.error('CREATE ERROR:', error);
    res.status(500).json({ message: 'Error creating employee', error: error.message || error.toString() });
  }
};

export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, department, role, status, sortBy = 'created_at', sortOrder = 'desc', page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.EmployeeProfileWhereInput = { 
      deleted_at: null,
      user: { role: { not: 'SUPER_ADMIN' } }
    };

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { user: { email: { contains: String(search), mode: 'insensitive' } } }
      ];
    }
    if (department) where.department = String(department);
    
    // Additional filters on relation
    if (role || status) {
      if (role) (where.user as any).role = role;
      if (status) (where.user as any).status = String(status);
    }

    const [profiles, total] = await Promise.all([
      prisma.employeeProfile.findMany({
        where,
        skip,
        take,
        // Sort by joining_date natively, or by user created_at
        orderBy: sortBy === 'created_at' ? { user: { created_at: sortOrder as any } } : { [String(sortBy)]: sortOrder },
        include: { user: { select: { email: true, role: true, status: true } } }
      }),
      prisma.employeeProfile.count({ where })
    ]);

    res.status(200).json({ data: profiles, meta: { total, page: Number(page), limit: take } });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees' });
  }
};

export const getEmployeeById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.employeeProfile.findUnique({
      where: { id: req.params.id as string, deleted_at: null },
      include: { 
        user: { select: { email: true, role: true, status: true } },
        reporting_manager: { select: { id: true, name: true } } 
      }
    });

    if (!profile) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.status(200).json({ data: profile });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee' });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password, ...updateData } = req.body;
    
    const profile = await prisma.employeeProfile.findUnique({ where: { id: req.params.id as string }, select: { user_id: true, user: { select: { role: true } } } });
    if (!profile) return;

    if (req.file) {
        updateData.profile_image = `/uploads/${req.file.filename}`;
    }

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.employee_profile?.id === req.params.id) {
      const allowedUpdates = ['name', 'phone', 'profile_image'];
      const filteredData: any = {};
      Object.keys(updateData).forEach((key) => {
        if (allowedUpdates.includes(key)) filteredData[key] = updateData[key];
      });
      
      const updatedProfile = await prisma.employeeProfile.update({ where: { id: req.params.id as string }, data: filteredData });
      if (password) await prisma.user.update({ where: { id: profile.user_id }, data: { password_hash: await hashPassword(password) } });
      
      res.status(200).json({ message: 'Profile updated', data: updatedProfile });
      return;
    }
    // Admin full update - Validate Circular Reporting
    // If user is HR_MANAGER, they cannot edit another HR_MANAGER or SUPER_ADMIN (but they can edit themselves)
    if (req.user?.role === 'HR_MANAGER' && (profile as any).user.role !== 'EMPLOYEE' && req.params.id !== req.user.employee_profile?.id) {
      res.status(403).json({ message: 'HR Managers can only edit Employees or themselves' });
      return;
    }

    if (updateData.reporting_manager_id) {
      if (updateData.reporting_manager_id === req.params.id) {
        res.status(400).json({ message: 'Employee cannot report to themselves' });
        return;
      }
      
      let currentManagerId = updateData.reporting_manager_id;
      const visited = new Set<string>();
      
      while (currentManagerId) {
        if (currentManagerId === req.params.id || visited.has(currentManagerId)) {
          res.status(400).json({ message: 'Circular reporting detected. Cannot assign this manager.' });
          return;
        }
        visited.add(currentManagerId);
        
        const managerProfile = await prisma.employeeProfile.findUnique({
          where: { id: currentManagerId },
          select: { reporting_manager_id: true }
        });
        currentManagerId = managerProfile?.reporting_manager_id;
      }
    } else if (updateData.reporting_manager_id === "") {
        updateData.reporting_manager_id = null;
    }

    if (updateData.salary) updateData.salary = Number(updateData.salary);
    if (updateData.joining_date) updateData.joining_date = new Date(updateData.joining_date);

    const updatedProfile = await prisma.employeeProfile.update({ where: { id: req.params.id as string }, data: updateData });
    if (password) await prisma.user.update({ where: { id: profile.user_id }, data: { password_hash: await hashPassword(password) } });

    res.status(200).json({ message: 'Employee updated', data: updatedProfile });
  } catch (error: any) {
    console.error('UPDATE ERROR:', error);
    res.status(500).json({ message: 'Error updating employee', error: error.message || error.toString() });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.employeeProfile.findUnique({ where: { id: req.params.id as string }, select: { user_id: true } });
    if (!profile) return;

    await prisma.$transaction([
      prisma.employeeProfile.update({ where: { id: req.params.id as string }, data: { deleted_at: new Date() } }),
      prisma.user.update({ where: { id: profile.user_id }, data: { status: 'Inactive' } })
    ]);

    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee' });
  }
};

export const bulkCreateEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employees = req.body;
    if (!Array.isArray(employees) || employees.length === 0) {
      res.status(400).json({ message: 'Invalid payload, expected array of employees' });
      return;
    }

    const defaultPasswordHash = await hashPassword('password123');

    await prisma.$transaction(async (tx) => {
      for (const emp of employees) {
        const user = await tx.user.create({
          data: { email: emp.email, password_hash: defaultPasswordHash, role: emp.role || 'EMPLOYEE' }
        });
        await tx.employeeProfile.create({
          data: {
            user_id: user.id,
            name: emp.name,
            phone: emp.phone || null,
            department: emp.department || null,
            designation: emp.designation || null,
            salary: emp.salary ? Number(emp.salary) : null,
            joining_date: emp.joining_date ? new Date(emp.joining_date) : new Date()
          }
        });
      }
    });

    res.status(201).json({ message: `${employees.length} employees created successfully` });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Error bulk importing employees' });
  }
};

