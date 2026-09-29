import { Router } from 'express';
import { clockIn, clockOut, getTimeLogs } from '../controllers/timeLogController';
import { upload } from '../utils/upload';

const router = Router();

// Clock in - optionally accepts 'photo' file or photoBase64 in body
router.post('/clock-in', upload.single('photo'), clockIn);

// Clock out - optionally accepts 'photo' file or photoBase64 in body
router.post('/clock-out', upload.single('photo'), clockOut);

// Get time logs (can filter by userId, startDate, endDate)
router.get('/', getTimeLogs);

export default router;
