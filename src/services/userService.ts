import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export class UserService {
  static async getAllUsers(activeOnly: boolean = false) {
    const whereClause = activeOnly ? { is_active: true, is_fired: false } : {};
    
    const users = await prisma.user.findMany({
      where: whereClause,
      include: { role: true },
      orderBy: { name: 'asc' }
    });

    return users.map(u => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      role: u.role.name,
      roleId: u.role_id,
      employmentType: u.employment_type,
      contractType: u.contract_type,
      onboardDate: u.onboard_date,
      baseSalary: u.base_salary,
      probationSalary: u.probation_salary,
      isActive: u.is_active,
      avatarUrl: u.avatar_url
    }));
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role.name,
      roleId: user.role_id,
      employmentType: user.employment_type,
      contractType: user.contract_type,
      onboardDate: user.onboard_date,
      baseSalary: user.base_salary,
      probationSalary: user.probation_salary,
      isActive: user.is_active,
      avatarUrl: user.avatar_url
    };
  }

  static async createUser(data: any) {
    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) {
      throw new AppError('Phone number already in use', 400);
    }

    const defaultPassword = 'chinchinxinhxinh';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        role_id: data.roleId,
        employment_type: data.employmentType,
        contract_type: data.contractType,
        onboard_date: data.onboardDate,
        base_salary: data.baseSalary,
        probation_salary: data.probationSalary,
        password_hash: passwordHash,
        is_active: true,
        is_fired: false
      },
      include: { role: true }
    });

    return this.getUserById(user.id);
  }

  static async updateUser(id: string, data: any) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (data.phone && data.phone !== user.phone) {
      const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) {
        throw new AppError('Phone number already in use', 400);
      }
    }

    const updateData: any = {
      ...(data.name && { name: data.name }),
      ...(data.phone && { phone: data.phone }),
      ...(data.roleId && { role_id: data.roleId }),
      ...(data.employmentType && { employment_type: data.employmentType }),
      ...(data.contractType && { contract_type: data.contractType }),
      ...(data.onboardDate && { onboard_date: data.onboardDate }),
      ...(data.baseSalary !== undefined && { base_salary: data.baseSalary }),
      ...(data.probationSalary !== undefined && { probation_salary: data.probationSalary }),
    };

    if (data.isActive !== undefined) {
      updateData.is_active = data.isActive;
      if (data.isActive === false) {
        updateData.is_fired = true; // Soft delete / fire logic
      } else {
        updateData.is_fired = false;
      }
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    });

    return this.getUserById(id);
  }

  static async getRoles() {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' }
    });
    return roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description
    }));
  }
}
