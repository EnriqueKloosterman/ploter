import type { Response } from 'express';
import User from '../models/User.js';
import type { AuthRequest } from '../middleware/auth.js';

export const getUserMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }
    res.json({ status: 'success', data: user });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener usuario' });
  }
};

export const updateTags = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }
    user.authorLibrary.globalTags = req.body.tags;
    await user.save();
    res.json({ status: 'success', data: user });
  } catch (error) {
    console.error('Error updating tags:', error);
    res.status(500).json({ status: 'error', message: 'Error al actualizar tags' });
  }
};
