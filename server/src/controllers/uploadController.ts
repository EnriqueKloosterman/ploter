import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No se envio ningun archivo' });
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({
      status: 'success',
      data: { url, width: 0, height: 0 },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ status: 'error', message: 'Error al subir el archivo' });
  }
};
