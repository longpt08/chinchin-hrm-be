import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      // Could accept a query param like ?activeOnly=true if needed
      const activeOnly = req.query.activeOnly === 'true';
      const users = await UserService.getAllUsers(activeOnly);
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.updateUser(id, req.body);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await UserService.getRoles();
      res.status(200).json(roles);
    } catch (error) {
      next(error);
    }
  }
}
