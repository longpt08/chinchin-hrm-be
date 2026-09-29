import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

// Helper to parse time string (HH:mm or HH:mm:ss) into a Date for Prisma @db.Time
const parseTime = (timeStr: string) => {
  const withSeconds = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`1970-01-01T${withSeconds}Z`);
};

// Helper to format Date back to HH:mm string for frontend
const formatTime = (date: Date) => {
  return date.toISOString().substring(11, 16);
};

export class ShiftService {
  async getTemplates() {
    const templates = await prisma.shiftTemplate.findMany({
      orderBy: { order: 'asc' },
    });
    return templates.map(t => ({
      id: t.id,
      name: t.name,
      startTime: formatTime(t.start_time),
      endTime: formatTime(t.end_time),
      allowedLateMinutes: t.allowed_late_minutes,
      isActive: t.is_active,
      order: t.order
    }));
  }

  async createTemplate(data: { name: string; startTime: string; endTime: string; allowedLateMinutes?: number; isActive?: boolean; order?: number }) {
    const template = await prisma.shiftTemplate.create({
      data: {
        name: data.name,
        start_time: parseTime(data.startTime),
        end_time: parseTime(data.endTime),
        allowed_late_minutes: data.allowedLateMinutes ?? 0,
        is_active: data.isActive ?? true,
        order: data.order ?? 0,
      },
    });
    return {
      ...template,
      startTime: formatTime(template.start_time),
      endTime: formatTime(template.end_time),
    };
  }

  async updateTemplate(id: string, data: { name?: string; startTime?: string; endTime?: string; allowedLateMinutes?: number; isActive?: boolean; order?: number }) {
    const template = await prisma.shiftTemplate.findUnique({ where: { id } });
    if (!template) throw new AppError('Template not found', 404);

    const updated = await prisma.shiftTemplate.update({
      where: { id },
      data: {
        name: data.name,
        start_time: data.startTime ? parseTime(data.startTime) : undefined,
        end_time: data.endTime ? parseTime(data.endTime) : undefined,
        allowed_late_minutes: data.allowedLateMinutes,
        is_active: data.isActive,
        order: data.order,
      },
    });
    return {
      ...updated,
      startTime: formatTime(updated.start_time),
      endTime: formatTime(updated.end_time),
    };
  }

  async getShifts(dateFrom?: string, dateTo?: string, userId?: string, status?: string) {
    const where: any = {};
    if (dateFrom && dateTo) {
      where.date = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      };
    } else if (dateFrom) {
      where.date = { gte: new Date(dateFrom) };
    } else if (dateTo) {
      where.date = { lte: new Date(dateTo) };
    }
    
    if (userId) where.user_id = userId;
    if (status) where.status = status;

    const shifts = await prisma.shift.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return shifts.map(s => ({
      id: s.id,
      userId: s.user_id,
      templateId: s.template_id,
      date: s.date.toISOString().split('T')[0],
      startTime: formatTime(s.start_time),
      endTime: formatTime(s.end_time),
      status: s.status,
    }));
  }

  async registerShifts(userId: string, shifts: Array<{ date: string; templateId: string; startTime: string; endTime: string }>) {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const createdShifts = await prisma.$transaction(
      shifts.map(shift => prisma.shift.create({
        data: {
          user_id: userId,
          template_id: shift.templateId,
          date: new Date(shift.date),
          start_time: parseTime(shift.startTime),
          end_time: parseTime(shift.endTime),
          status: 'draft',
        }
      }))
    );

    return createdShifts.map(s => ({
      id: s.id,
      userId: s.user_id,
      templateId: s.template_id,
      date: s.date.toISOString().split('T')[0],
      startTime: formatTime(s.start_time),
      endTime: formatTime(s.end_time),
      status: s.status,
    }));
  }

  async publishShift(id: string) {
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift) throw new AppError('Shift not found', 404);

    const published = await prisma.shift.update({
      where: { id },
      data: { status: 'published' },
    });

    return {
      id: published.id,
      userId: published.user_id,
      templateId: published.template_id,
      date: published.date.toISOString().split('T')[0],
      startTime: formatTime(published.start_time),
      endTime: formatTime(published.end_time),
      status: published.status,
    };
  }
}
