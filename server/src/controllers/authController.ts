import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };

    if (!email || !password || !name) {
      return res.status(400).json({ status: 'error', message: 'Email, password y nombre son requeridos' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'El email ya esta registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const authorId = `auth_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const user = await User.create({
      authorId,
      name,
      email,
      password: hashedPassword,
      globalSettings: { theme: 'dark', canvasGrid: true },
      authorLibrary: { globalTags: [], globalCharacters: [] }
    });

    const token = generateToken({
      userId: String(user._id),
      authorId: user.authorId,
      email: user.email!
    });

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          _id: user._id,
          authorId: user.authorId,
          name: user.name,
          email: user.email,
          globalSettings: user.globalSettings,
          authorLibrary: user.authorLibrary
        }
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ status: 'error', message: 'Error al registrar usuario' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email y password son requeridos' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ status: 'error', message: 'Credenciales invalidas' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ status: 'error', message: 'Credenciales invalidas' });
    }

    const token = generateToken({
      userId: String(user._id),
      authorId: user.authorId,
      email: user.email!
    });

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          _id: user._id,
          authorId: user.authorId,
          name: user.name,
          email: user.email,
          globalSettings: user.globalSettings,
          authorLibrary: user.authorLibrary
        }
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ status: 'error', message: 'Error al iniciar sesion' });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email es requerido' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ status: 'success', message: 'Si el email existe, recibiras un enlace de recuperacion' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;
    console.log('--- PASSWORD RESET LINK ---');
    console.log(resetLink);
    console.log('---------------------------');

    res.json({ status: 'success', message: 'Si el email existe, recibiras un enlace de recuperacion', resetLink });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ status: 'error', message: 'Error al procesar la solicitud' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params as { token: string };
    const { password } = req.body as { password?: string };

    if (!password || password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'La contrasena debe tener al menos 6 caracteres' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Enlace invalido o expirado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    delete (user as any).resetPasswordToken;
    delete (user as any).resetPasswordExpires;
    await user.save();

    res.json({ status: 'success', message: 'Contrasena actualizada correctamente' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ status: 'error', message: 'Error al restablecer la contrasena' });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    res.json({
      status: 'success',
      data: {
        _id: user._id,
        authorId: user.authorId,
        name: user.name,
        email: user.email,
        globalSettings: user.globalSettings,
        authorLibrary: user.authorLibrary
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener usuario' });
  }
};
