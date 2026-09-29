import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export class PayrollService {
  static async calculateMonthly(month: number, year: number, userId?: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const userWhere = userId ? { id: userId, is_active: true } : { is_active: true };
    const users = await prisma.user.findMany({ where: userWhere });

    const results = [];

    for (const user of users) {
      // 1. Fetch time logs
      const timeLogs = await prisma.timeLog.findMany({
        where: {
          user_id: user.id,
          timestamp: { gte: startDate, lte: endDate },
        },
        orderBy: { timestamp: 'asc' },
      });

      // 1b. Fetch published shifts to match with logs
      const shifts = await prisma.shift.findMany({
        where: {
          user_id: user.id,
          status: 'published',
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
      });

      // Calculate total hours and match with shifts
      let totalHours = 0;
      let lastIn: Date | null = null;
      const uniqueDays = new Set<string>();

      for (const log of timeLogs) {
        if (log.log_type === 'IN') {
          lastIn = log.timestamp;
          uniqueDays.add(log.timestamp.toISOString().split('T')[0]);
        } else if (log.log_type === 'OUT' && lastIn) {
          const durationMs = log.timestamp.getTime() - lastIn.getTime();
          totalHours += durationMs / (1000 * 60 * 60);
          lastIn = null; // Reset
        }
      }

      const totalDays = uniqueDays.size;

      // 2. Fetch salary adjustments
      const adjustments = await prisma.salaryAdjustment.findMany({
        where: {
          user_id: user.id,
          date: { gte: startDate, lte: endDate },
        },
      });

      let allowances = 0;
      let punishments = 0;
      let advances = 0;

      adjustments.forEach((adj) => {
        const amount = Number(adj.amount);
        if (adj.type === 'allowance') allowances += amount;
        else if (adj.type === 'punishment') punishments += amount;
        else if (adj.type === 'advance') advances += amount;
      });

      // 3. Calculate Base Salary component based on employment type
      let calculatedBaseSalary = 0;
      const userBase = Number(user.base_salary);
      if (user.employment_type === 'Part-time') {
        calculatedBaseSalary = userBase * totalHours;
      } else {
        // Full-time: Assuming base_salary is the monthly salary
        // Can be prorated based on totalDays vs expected shifts, simplified here
        calculatedBaseSalary = userBase;
      }

      const finalTotal = calculatedBaseSalary + allowances - punishments - advances;

      results.push({
        userId: user.id,
        userName: user.name,
        month,
        year,
        baseSalary: userBase,
        calculatedBaseSalary,
        totalHours: Number(totalHours.toFixed(2)),
        totalDays,
        publishedShiftsCount: shifts.length,
        allowances,
        punishments,
        advances,
        finalTotal,
        adjustments,
      });
    }

    return results;
  }

  static async addAdjustment(data: { userId: string; type: string; amount: number; date: Date; description?: string }) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new AppError('User not found', 404);

    const adjustment = await prisma.salaryAdjustment.create({
      data: {
        user_id: data.userId,
        type: data.type,
        amount: data.amount,
        date: data.date,
        description: data.description,
      },
    });

    return adjustment;
  }

  static async getAdjustments(filters: { userId?: string; month?: number; year?: number }) {
    const where: any = {};
    if (filters.userId) where.user_id = filters.userId;
    
    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
      where.date = { gte: startDate, lte: endDate };
    }

    return prisma.salaryAdjustment.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      }
    });
  }

  static async savePayslip(userId: string, month: number, year: number) {
    const calculations = await this.calculateMonthly(month, year, userId);
    if (calculations.length === 0) {
      throw new AppError('User not found or calculation failed', 404);
    }
    const calc = calculations[0];

    const payslip = await prisma.payslip.create({
      data: {
        user_id: calc.userId,
        month: calc.month,
        year: calc.year,
        base_salary: calc.calculatedBaseSalary,
        total_hours: calc.totalHours,
        allowances: calc.allowances,
        punishments: calc.punishments,
        advances: calc.advances,
        final_total: calc.finalTotal,
        status: 'draft',
      },
    });

    return payslip;
  }

  static async getPayslips(filters: { userId?: string; month?: number; year?: number }) {
    const where: any = {};
    if (filters.userId) where.user_id = filters.userId;
    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = filters.year;

    return prisma.payslip.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        user: { select: { id: true, name: true } },
      }
    });
  }
}
