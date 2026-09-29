import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { validate } from '../middlewares/validate';
import { createUserSchema, updateUserSchema } from '../schemas/userSchema';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// To support GET /api/users/roles if the frontend expects it under users
router.get('/roles', authenticateJWT, requireRole(['manager']), UserController.getRoles);

router.get('/', authenticateJWT, requireRole(['manager']), UserController.getUsers);
router.get('/:id', authenticateJWT, requireRole(['manager']), UserController.getUser);
router.post('/', authenticateJWT, requireRole(['manager']), validate(createUserSchema), UserController.createUser);
router.put('/:id', authenticateJWT, requireRole(['manager']), validate(updateUserSchema), UserController.updateUser);

export default router;

// Export an additional router for /api/roles if the user mounts it in app.ts later
export const rolesRouter = Router();
rolesRouter.get('/', authenticateJWT, requireRole(['manager']), UserController.getRoles);
