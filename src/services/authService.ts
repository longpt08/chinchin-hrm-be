import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export class AuthService {
  static async login(phone: string, passwordOrPin: string, roleInput: 'manager' | 'employee') {
    const user = await prisma.user.findUnique({
      where: { phone },
      include: { role: true }
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.is_active || user.is_fired) {
      throw new AppError('User is no longer active', 403);
    }

    // Role check logic: For simplicity, assume roles are named 'manager' or 'employee'
    // If you need more complex mapping, you might do that here.
    const userRoleName = user.role.name.toLowerCase();
    
    // Some basic check to ensure they are logging in to the right portal
    if (roleInput === 'manager' && userRoleName !== 'manager' && userRoleName !== 'admin') {
       throw new AppError('Not authorized for manager portal', 403);
    }

    const isValid = await bcrypt.compare(passwordOrPin, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { userId: user.id, roleName: userRoleName },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: userRoleName,
        roleId: user.role_id,
        avatarUrl: user.avatar_url,
      }
    };
  }
}
