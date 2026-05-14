import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { seedDefaultUser } from './config/seed.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import snapshotRoutes from './routes/snapshotRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

// Validación de .env
const REQUIRED_ENV_VARS = ['MONGO_URI'] as const;
const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  console.error('   Copie server/.env.example a server/.env y complete los valores.');
  process.exit(1);
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'plotweaver-dev-secret-key-change-in-production') {
  console.warn('⚠️  JWT_SECRET no configurado — usando valor por defecto (inseguro en producción)');
}

const app = express();

// Seguridad
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({ origin: allowedOrigins }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Demasiadas solicitudes, intente de nuevo en 15 minutos.' },
});
app.use(limiter);

// Body parsing con límite explícito
app.use(express.json({ limit: '5mb' }));

connectDB()
  .then(() => seedDefaultUser())
  .catch((error) => {
    console.error('❌ No se pudo conectar a MongoDB:', (error instanceof Error) ? error.message : error);
    console.error('   Asegúrese de que MongoDB esté corriendo (mongodb://localhost:27017/plotweaver)');
    process.exit(1);
  });

// Rutas API — auth routes van antes que el resto (no requieren authMiddleware)
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/snapshots', snapshotRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'PlotWeaver API running.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
