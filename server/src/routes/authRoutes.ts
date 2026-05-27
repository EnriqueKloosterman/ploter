import express from 'express';
import { register, login, forgotPassword, resetPassword, me } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router: express.Router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', authMiddleware, me);

export default router;
