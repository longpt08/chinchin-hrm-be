import { prisma } from '../config/prisma';

export class FundService {
  static async getPunishmentTemplates() {
    return await prisma.punishmentTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async getFundLogs() {
    return await prisma.fundLog.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  static async createFundLog(data: { type: string; amount: number; description?: string }) {
    return await prisma.fundLog.create({
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description,
      },
    });
  }
}
