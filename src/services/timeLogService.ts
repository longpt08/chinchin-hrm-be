import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export class TimeLogService {
  static async clockIn(userId: string, photoUrl?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const lastLog = await prisma.timeLog.findFirst({
      where: { user_id: userId },
      orderBy: { timestamp: 'desc' },
    });

    if (lastLog && lastLog.log_type === 'IN') {
      throw new AppError('Already clocked in. Please clock out first.', 400);
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        user_id: userId,
        log_type: 'IN',
        timestamp: new Date(),
        photo_url: photoUrl,
      },
    });

    return timeLog;
  }

  static async clockOut(userId: string, photoUrl?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const lastLog = await prisma.timeLog.findFirst({
      where: { user_id: userId },
      orderBy: { timestamp: 'desc' },
    });

    if (!lastLog || lastLog.log_type === 'OUT') {
      throw new AppError('Cannot clock out. Please clock in first.', 400);
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        user_id: userId,
        log_type: 'OUT',
        timestamp: new Date(),
        photo_url: photoUrl,
      },
    });

    return timeLog;
  }

  static async getTimeLogs(filters: { startDate?: string; endDate?: string; userId?: string }) {
    const where: any = {};

    if (filters.userId) {
      where.user_id = filters.userId;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.timestamp.lte = new Date(filters.endDate);
      }
    }

    const timeLogs = await prisma.timeLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
          },
        },
      },
    });

    return timeLogs;
  }
}
