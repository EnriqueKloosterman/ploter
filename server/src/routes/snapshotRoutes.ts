import express from 'express';
import { createSnapshot, getSnapshots } from '../controllers/snapshotController.js';

const router: express.Router = express.Router();

router.post('/:projectId', createSnapshot);
router.get('/:projectId', getSnapshots);

export default router;
