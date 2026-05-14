import type { Request, Response } from 'express';
import Project from '../models/Project.js';
import User from '../models/User.js';
import type { AuthRequest } from '../middleware/auth.js';

type ProjectUpdatePayload = Record<string, unknown>;

const pickProjectUpdateFields = (payload: ProjectUpdatePayload) => {
  const allowedUpdate: ProjectUpdatePayload = {};

  if (typeof payload['metadata.title'] === 'string') {
    allowedUpdate['metadata.title'] = payload['metadata.title'];
  }

  if (payload.metadata && typeof payload.metadata === 'object' && payload.metadata !== null) {
    const metadata = payload.metadata as Record<string, unknown>;
    if (typeof metadata.title === 'string') {
      allowedUpdate['metadata.title'] = metadata.title;
    }
  }

  if (Array.isArray(payload.characters)) {
    allowedUpdate.characters = payload.characters;
  }

  if (Array.isArray(payload.characterRelations)) {
    allowedUpdate.characterRelations = payload.characterRelations;
  }

  if (payload.canvas && typeof payload.canvas === 'object' && payload.canvas !== null) {
    allowedUpdate.canvas = payload.canvas;
  }

  if (payload.chapterManager && typeof payload.chapterManager === 'object' && payload.chapterManager !== null) {
    allowedUpdate.chapterManager = payload.chapterManager;
  }

  return allowedUpdate;
};

// GET /api/projects/:projectId
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }
    const project = await Project.findOne({ 'metadata.projectId': projectId, authorId: authReq.user.userId });

    if (!project) {
      return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
    }

    res.json({
      status: 'success',
      data: project
    });
  } catch (error) {
    console.error('Error Fetching Project: ', error);
    res.status(500).json({ status: 'error', message: 'Error retrieving project' });
  }
};

// PUT /api/projects/:projectId
export const updateProject = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }
    const updateData = pickProjectUpdateFields(req.body as ProjectUpdatePayload);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No hay campos permitidos para actualizar'
      });
    }

    updateData['metadata.lastModified'] = new Date();

    const project = await Project.findOneAndUpdate(
      { 'metadata.projectId': projectId, authorId: authReq.user.userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
    }

    res.json({
      status: 'success',
      data: project
    });
  } catch (error) {
    console.error('Error Updating Project: ', error);
    res.status(500).json({ status: 'error', message: 'Fallo al actualizar proyecto' });
  }
};

// DELETE /api/projects/:projectId
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }
    const project = await Project.findOneAndDelete({ 'metadata.projectId': projectId, authorId: authReq.user.userId });

    if (!project) {
      return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
    }

    res.json({
      status: 'success',
      message: 'Proyecto eliminado con exito'
    });
  } catch (error) {
    console.error('Error Deleting Project: ', error);
    res.status(500).json({ status: 'error', message: 'Fallo al eliminar proyecto' });
  }
};

// GET /api/projects
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }
    const projects = await Project.find(
      { authorId: authReq.user.userId },
      'metadata.projectId metadata.title metadata.lastModified metadata.createdAt'
    ).sort({ 'metadata.lastModified': -1 });

    res.json({
      status: 'success',
      data: projects
    });
  } catch (error) {
    console.error('Error Fetching Projects List: ', error);
    res.status(500).json({ status: 'error', message: 'Error retrieving projects' });
  }
};

// POST /api/projects
export const createProject = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }
    const { title } = req.body as { title?: string };

    const user = await User.findById(authReq.user.userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    const newProjectId = `proj_${Date.now()}`;
    const newProject = await Project.create({
      authorId: user._id,
      metadata: {
        projectId: newProjectId,
        title: title || 'Historia sin titulo'
      },
      characters: [],
      characterRelations: [],
      canvas: {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: [],
        edges: []
      },
      chapterManager: {
        chapters: []
      },
    });

    res.status(201).json({
      status: 'success',
      data: newProject
    });
  } catch (error) {
    console.error('Error Creating Project: ', error);
    res.status(500).json({ status: 'error', message: 'Fallo al crear el proyecto' });
  }
};
