import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import projectRoutes from './routes/projectRoutes.js';
import snapshotRoutes from './routes/snapshotRoutes.js';
// Validar variables de entorno
dotenv.config();
const app = express();
// Middlewares
app.use(cors());
app.use(express.json());
// Conexión a Base de datos (Placeholder)
connectDB();
// Rutas API
app.use('/api/projects', projectRoutes);
app.use('/api/snapshots', snapshotRoutes);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'PlotWeaver API running.' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map