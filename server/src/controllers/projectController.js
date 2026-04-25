import Project from '../models/Project.js';
import User from '../models/User.js';
const pickProjectUpdateFields = (payload) => {
    const allowedUpdate = {};
    if (typeof payload['metadata.title'] === 'string') {
        allowedUpdate['metadata.title'] = payload['metadata.title'];
    }
    if (payload.metadata && typeof payload.metadata === 'object' && payload.metadata !== null) {
        const metadata = payload.metadata;
        if (typeof metadata.title === 'string') {
            allowedUpdate['metadata.title'] = metadata.title;
        }
    }
    if (Array.isArray(payload.characters)) {
        allowedUpdate.characters = payload.characters;
    }
    if (payload.canvas && typeof payload.canvas === 'object' && payload.canvas !== null) {
        allowedUpdate.canvas = payload.canvas;
    }
    if (payload.chapterManager && typeof payload.chapterManager === 'object' && payload.chapterManager !== null) {
        allowedUpdate.chapterManager = payload.chapterManager;
    }
    if (payload.trashBin && typeof payload.trashBin === 'object' && payload.trashBin !== null) {
        allowedUpdate.trashBin = payload.trashBin;
    }
    return allowedUpdate;
};
// GET /api/projects/:projectId
export const getProjectById = async (req, res) => {
    try {
        const projectId = String(req.params.projectId);
        const project = await Project.findOne({ 'metadata.projectId': projectId });
        if (!project) {
            return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
        }
        res.json({
            status: 'success',
            data: project
        });
    }
    catch (error) {
        console.error('Error Fetching Project: ', error);
        res.status(500).json({ status: 'error', message: 'Error retrieving project' });
    }
};
// PUT /api/projects/:projectId
export const updateProject = async (req, res) => {
    try {
        const projectId = String(req.params.projectId);
        const updateData = pickProjectUpdateFields(req.body);
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No hay campos permitidos para actualizar'
            });
        }
        updateData['metadata.lastModified'] = new Date();
        const project = await Project.findOneAndUpdate({ 'metadata.projectId': projectId }, { $set: updateData }, { new: true, runValidators: true });
        if (!project) {
            return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
        }
        res.json({
            status: 'success',
            data: project
        });
    }
    catch (error) {
        console.error('Error Updating Project: ', error);
        res.status(500).json({ status: 'error', message: 'Fallo al actualizar proyecto' });
    }
};
// DELETE /api/projects/:projectId
export const deleteProject = async (req, res) => {
    try {
        const projectId = String(req.params.projectId);
        const project = await Project.findOneAndDelete({ 'metadata.projectId': projectId });
        if (!project) {
            return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
        }
        res.json({
            status: 'success',
            message: 'Proyecto eliminado con exito'
        });
    }
    catch (error) {
        console.error('Error Deleting Project: ', error);
        res.status(500).json({ status: 'error', message: 'Fallo al eliminar proyecto' });
    }
};
// GET /api/projects
export const getAllProjects = async (_req, res) => {
    try {
        const projects = await Project.find({}, 'metadata.projectId metadata.title metadata.lastModified metadata.createdAt').sort({ 'metadata.lastModified': -1 });
        res.json({
            status: 'success',
            data: projects
        });
    }
    catch (error) {
        console.error('Error Fetching Projects List: ', error);
        res.status(500).json({ status: 'error', message: 'Error retrieving projects' });
    }
};
// POST /api/projects
export const createProject = async (req, res) => {
    try {
        const { title } = req.body;
        let user = await User.findOne({ authorId: 'auth_9921' });
        if (!user) {
            user = await User.create({
                authorId: 'auth_9921',
                name: 'Enrique',
                globalSettings: { theme: 'dark', canvasGrid: true },
                authorLibrary: {
                    globalTags: [],
                    globalCharacters: []
                }
            });
        }
        const newProjectId = `proj_${Date.now()}`;
        const newProject = await Project.create({
            authorId: user._id,
            metadata: {
                projectId: newProjectId,
                title: title || 'Historia sin titulo'
            },
            characters: [],
            canvas: {
                viewport: { x: 0, y: 0, zoom: 1 },
                nodes: [],
                edges: []
            },
            chapterManager: {
                chapters: []
            },
            trashBin: { nodes: [], edges: [] }
        });
        res.status(201).json({
            status: 'success',
            data: newProject
        });
    }
    catch (error) {
        console.error('Error Creating Project: ', error);
        res.status(500).json({ status: 'error', message: 'Fallo al crear el proyecto' });
    }
};
//# sourceMappingURL=projectController.js.map