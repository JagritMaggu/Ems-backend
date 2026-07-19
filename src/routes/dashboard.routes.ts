import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

router.use(authGuard);
router.get('/stats', getDashboardStats);

export default router;
