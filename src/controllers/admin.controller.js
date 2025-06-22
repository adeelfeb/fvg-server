import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isFrozen: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const freezeUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.update({
      where: { id },
      data: { isFrozen: true }
    });
    
    res.json({ message: 'User account frozen', user });
  } catch (error) {
    console.error('Freeze user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unfreezeUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.update({
      where: { id },
      data: { isFrozen: false }
    });
    
    res.json({ message: 'User account unfrozen', user });
  } catch (error) {
    console.error('Unfreeze user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};