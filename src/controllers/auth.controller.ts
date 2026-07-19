import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee_profile: { select: { name: true } } }
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.status !== 'Active') {
      res.status(403).json({ message: 'Account is inactive' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ id: user.id, role: user.role });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.employee_profile?.name || 'Super Admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  // If using cookies, we would clear the cookie here.
  // With pure JWT in headers, logout is mostly handled client-side by dropping the token.
  res.status(200).json({ message: 'Logout successful' });
};
