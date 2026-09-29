import { Request, Response, NextFunction } from 'express';
import { TimeLogService } from '../services/timeLogService';
import { saveBase64Image } from '../utils/upload';
import { AppError } from '../utils/AppError';

export const clockIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, photoBase64 } = req.body;
    let photoUrl = undefined;

    if (!userId) {
      throw new AppError('userId is required', 400);
    }

    if (photoBase64) {
      photoUrl = saveBase64Image(photoBase64, 'timelog');
    } else if (req.file) {
      photoUrl = req.file.path.split('\\').join('/');
    }

    const timeLog = await TimeLogService.clockIn(userId, photoUrl);

    res.status(201).json({
      success: true,
      message: 'Clocked in successfully',
      data: timeLog,
    });
  } catch (error) {
    next(error);
  }
};

export const clockOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, photoBase64 } = req.body;
    let photoUrl = undefined;

    if (!userId) {
      throw new AppError('userId is required', 400);
    }

    if (photoBase64) {
      photoUrl = saveBase64Image(photoBase64, 'timelog');
    } else if (req.file) {
      photoUrl = req.file.path.split('\\').join('/');
    }

    const timeLog = await TimeLogService.clockOut(userId, photoUrl);

    res.status(201).json({
      success: true,
      message: 'Clocked out successfully',
      data: timeLog,
    });
  } catch (error) {
    next(error);
  }
};

export const getTimeLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const timeLogs = await TimeLogService.getTimeLogs({
      startDate: startDate as string,
      endDate: endDate as string,
      userId: userId as string,
    });

    res.status(200).json({
      success: true,
      data: timeLogs,
    });
  } catch (error) {
    next(error);
  }
};
