import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { exportHtml, exportFountain, exportDocx, exportPdf, exportEpub, exportHtmlPlayable } from '../controllers/export/index.js';

const router: IRouter = Router();

router.use(authMiddleware);

router.get('/:projectId/html', exportHtml);
router.get('/:projectId/html-playable', exportHtmlPlayable);
router.get('/:projectId/fountain', exportFountain);
router.get('/:projectId/docx', exportDocx);
router.get('/:projectId/pdf', exportPdf);
router.get('/:projectId/epub', exportEpub);

export default router;
