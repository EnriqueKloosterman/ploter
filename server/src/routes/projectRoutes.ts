import express from 'express';
import { getProjectById, updateProject, getAllProjects, createProject, deleteProject } from '../controllers/projectController.js';
import { validate } from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema, projectIdParamSchema } from '../middleware/schemas.js';
import { authMiddleware } from '../middleware/auth.js';

const router: express.Router = express.Router();

router.get('/', authMiddleware, getAllProjects);
router.post('/', authMiddleware, validate(createProjectSchema), createProject);
router.get('/:projectId', authMiddleware, validate(projectIdParamSchema, 'params'), getProjectById);
router.put('/:projectId', authMiddleware, validate(projectIdParamSchema, 'params'), validate(updateProjectSchema), updateProject);
router.delete('/:projectId', authMiddleware, validate(projectIdParamSchema, 'params'), deleteProject);

export default router;
