import express from 'express';
import { createSnapshot, getSnapshots, restoreSnapshot } from '../controllers/snapshotController.js';
import { validate } from '../middleware/validate.js';
import { createSnapshotSchema, projectIdParamSchema } from '../middleware/schemas.js';
import { authMiddleware } from '../middleware/auth.js';
import { z } from 'zod';

const router: express.Router = express.Router();

const snapshotIdParamSchema = z.object({ snapshotId: z.string().min(1) });

router.post('/restore/:snapshotId', authMiddleware, validate(snapshotIdParamSchema, 'params'), restoreSnapshot);
router.post('/:projectId', authMiddleware, validate(projectIdParamSchema, 'params'), validate(createSnapshotSchema), createSnapshot);
router.get('/:projectId', authMiddleware, validate(projectIdParamSchema, 'params'), getSnapshots);

export default router;
