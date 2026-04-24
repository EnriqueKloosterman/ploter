import express from 'express';
import { getProjectById, updateProject, getAllProjects, createProject, deleteProject } from '../controllers/projectController.js';

const router: express.Router = express.Router();

router.get('/', getAllProjects);
router.post('/', createProject);
router.get('/:projectId', getProjectById);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);

export default router;
