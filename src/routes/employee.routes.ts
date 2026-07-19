import { Router } from 'express';
import { createEmployee, getEmployees, getEmployeeById, updateEmployee, deleteEmployee, bulkCreateEmployees } from '../controllers/employee.controller';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';
import { selfGuard } from '../middlewares/selfGuard';

const router = Router();

router.use(authGuard);

router.post('/', roleGuard(['SUPER_ADMIN', 'HR_MANAGER']), createEmployee);
router.post('/bulk', roleGuard(['SUPER_ADMIN', 'HR_MANAGER']), bulkCreateEmployees);
router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.put('/:id', selfGuard, updateEmployee);
router.delete('/:id', roleGuard(['SUPER_ADMIN']), deleteEmployee);

export default router;
