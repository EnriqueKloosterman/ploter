import Snapshot from '../models/Snapshot.js';
import Project from '../models/Project.js';

// POST /api/snapshots/:projectId
export const createSnapshot = async (req: any, res: any) => {
  try {
    const { projectId } = req.params;
    const { description } = req.body;

    const project = await Project.findOne({ 'metadata.projectId': projectId });
    if (!project) {
      return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
    }

    // Spec-Driven Development: El Snapshot guarda un clon del Data
    const newSnapshot = await Snapshot.create({
      projectId: project._id,
      description: description || `Copia autogenerada ${new Date().toISOString()}`,
      projectData: project.toObject()
    });

    res.status(201).json({ status: 'success', data: newSnapshot });
  } catch (error: any) {
    console.error("Error creating snapshot:", error);
    res.status(500).json({ status: 'error', message: 'Fallo guardando el Snapshot' });
  }
};

// GET /api/snapshots/:projectId
export const getSnapshots = async (req: any, res: any) => {
  try {
    const { projectId } = req.params;
    
    // Primero buscar el Project para obtener el ObjectId interno
    const project = await Project.findOne({ 'metadata.projectId': projectId });
    if(!project) {
        return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
    }

    const snapshots = await Snapshot.find({ projectId: project._id }).sort({ createdAt: -1 });

    res.json({ status: 'success', data: snapshots });
  } catch (error: any) {
    console.error("Error fetching snapshots:", error);
    res.status(500).json({ status: 'error', message: 'Fallo solicitando Snapshots' });
  }
};
