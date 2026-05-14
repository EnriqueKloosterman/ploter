import express from 'express';
import { getUserMe, updateTags } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router: express.Router = express.Router();

const updateTagsSchema = z.object({
  tags: z.array(z.object({
    tagId: z.string(),
    label: z.string(),
    color: z.string(),
  })),
});

router.get('/me', authMiddleware, getUserMe);
router.put('/me/library/tags', authMiddleware, validate(updateTagsSchema), updateTags);

export default router;
