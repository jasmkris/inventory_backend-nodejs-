import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { notificationService } from '../services/notification';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;
    const selfieFile = req.file;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Split fullName
    const [firstName, ...lastNameParts] = fullName.trim().split(' ');
    const lastName = lastNameParts.join(' ');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let role = 'EMPLOYEE';
    let verified = false;
    const isAdmin = email === 'admin@admin.com';
    if (isAdmin) {
      role = 'MANAGER';
      verified = true;
    }
    // Create user with photo URL if file was uploaded
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName: lastName || '',
        photoUrl: selfieFile ? `/uploads/profiles/${selfieFile.filename}` : null,
        role: role as UserRole,
        isVerified: verified
      }
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Send notification to admin
    const adminEmail = 'admin@admin.com';
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (adminUser) {
      const notification = {
        type: 'NEW_USER_REGISTRATION',
        message: `New user registration: ${fullName} (${email})`,
        details: {
          userId: user.id,
          email: user.email,
          fullName: `${user.firstName} ${user.lastName}`,
          timestamp: new Date()
        }
      };

      // Send via WebSocket
      await notificationService.notify({
        userId: adminUser.id,
        ...notification
      });
    }

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user === null) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    if (!user.isVerified) {
      res.status(401).json({ error: 'User is not verified \n Please wait for admin approval' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        image: user.photoUrl
      },
      token
    });
  } catch (error) {
    res.status(400).json({ error: 'Login failed' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Update user
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { isVerified: true }
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
}; 