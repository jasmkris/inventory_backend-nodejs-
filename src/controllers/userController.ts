import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        role: true,
        isVerified: true
      }
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, currentPassword, newPassword } = req.body;

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;

    // If changing password, verify current password
    if (newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id }
      });

      const isMatch = await bcrypt.compare(currentPassword, user!.password);
      if (!isMatch) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        role: true
      }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
};

export const uploadPhoto = async (req: Request & { file?: Express.Multer.File }, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { photoUrl },
      select: {
        id: true,
        photoUrl: true
      }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Upload failed' });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch users' });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Role update failed' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    await prisma.user.delete({
      where: { id: userId }
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Delete failed' });
  }
}; 

export const approveUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
      select: { id: true, isVerified: true }
    });
    console.log(updatedUser, 'updatedUser');
    
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Approval failed' });
  }
};

export const rejectUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    await prisma.user.delete({
      where: { id: userId }
    });

    res.status(200).json({ message: 'User rejected successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Rejection failed' });
  }
};

export const revokeUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: false },
      select: { id: true, isVerified: true }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Revocation failed' });
  }
};

