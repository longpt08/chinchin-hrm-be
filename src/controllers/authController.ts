import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, password, pin, role } = req.body;
      const credential = role === 'manager' ? password : pin;
      
      const result = await AuthService.login(phone, credential, role);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
