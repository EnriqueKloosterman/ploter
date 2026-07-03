import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Snapshot from '../models/Snapshot.js';
import Project from '../models/Project.js';
import type { IProject } from '../models/Project.js';

const MAX_SNAPSHOTS_PER_PROJECT = 50;

// POST /api/snapshots/:projectId
export const createSnapshot = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const { description } = req.body;
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }

    const project = await Project.findOne({ 'metadata.projectId': projectId, authorId: req.user.userId });
    if (!project) {
      return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
    }

    const snapshotCount = await Snapshot.countDocuments({ projectId: project._id });
    if (snapshotCount >= MAX_SNAPSHOTS_PER_PROJECT) {
      return res.status(400).json({
        status: 'error',
        message: `Limite de ${MAX_SNAPSHOTS_PER_PROJECT} snapshots alcanzado. Elimine algunos antes de crear uno nuevo.`,
      });
    }

    const newSnapshot = await Snapshot.create({
      projectId: project._id,
      description: description || `Copia autogenerada ${new Date().toISOString()}`,
      projectData: project.toObject()
    });

    res.status(201).json({ status: 'success', data: newSnapshot });
  } catch (error) {
    console.error("Error creating snapshot:", error);
    res.status(500).json({ status: 'error', message: 'Fallo guardando el Snapshot' });
  }
};

// POST /api/snapshots/restore/:snapshotId
export const restoreSnapshot = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }

    const snapshot = await Snapshot.findById(String(req.params.snapshotId));
    if (!snapshot) {
      return res.status(404).json({ status: 'error', message: 'Snapshot no encontrado' });
    }

    const project = await Project.findOne({ _id: snapshot.projectId, authorId: req.user.userId });
    if (!project) {
      return res.status(404).json({ status: 'error', message: 'Proyecto no encontrado o no autorizado' });
    }

    const data = snapshot.projectData;
    if (data.metadata) project.metadata = data.metadata as IProject['metadata'];
    if (data.characters) project.characters = data.characters;
    if (data.canvas) project.canvas = data.canvas as IProject['canvas'];
    if (data.chapterManager) project.chapterManager = data.chapterManager as IProject['chapterManager'];

    await project.save();

    res.json({ status: 'success', message: 'Snapshot restaurado correctamente', data: project });
  } catch (error) {
    console.error('Error restoring snapshot:', error);
    res.status(500).json({ status: 'error', message: 'Fallo al restaurar el snapshot' });
  }
};

// GET /api/snapshots/:projectId
export const getSnapshots = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }

    const project = await Project.findOne({ 'metadata.projectId': projectId, authorId: req.user.userId });
    if (!project) {
        return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
    }

    const snapshots = await Snapshot.find({ projectId: project._id }).sort({ createdAt: -1 });

    res.json({ status: 'success', data: snapshots });
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    res.status(500).json({ status: 'error', message: 'Fallo solicitando Snapshots' });
  }
};
