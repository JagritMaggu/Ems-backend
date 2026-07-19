import { Router } from 'express';
import { getOrganizationTree, getReporters, assignManager } from '../controllers/organization.controller';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';

const router = Router();

router.use(authGuard);

router.get('/tree', getOrganizationTree);
router.get('/:id/reporters', getReporters);
router.patch('/:id/manager', roleGuard(['SUPER_ADMIN', 'HR_MANAGER']), assignManager);

export default router;
