import express from 'express';
import { createSnapshot, getSnapshots } from '../controllers/snapshotController.js';
const router = express.Router();
router.post('/:projectId', createSnapshot);
router.get('/:projectId', getSnapshots);
export default router;
//# sourceMappingURL=snapshotRoutes.js.map