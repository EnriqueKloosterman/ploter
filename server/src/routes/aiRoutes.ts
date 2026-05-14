import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { suggestPlot, generateNames, findPlotHoles, summarize } from '../controllers/ai/index.js';

const router: IRouter = Router();

router.use(authMiddleware);

router.post('/:projectId/suggest-plot', suggestPlot);
router.post('/:projectId/generate-names', generateNames);
router.post('/:projectId/plot-holes', findPlotHoles);
router.post('/:projectId/summarize', summarize);

export default router;
