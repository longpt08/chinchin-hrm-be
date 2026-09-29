import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { loginSchema } from '../schemas/authSchema';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);

export default router;
