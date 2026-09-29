import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import timeLogRoutes from './routes/timeLogRoutes';
import shiftRoutes from './routes/shiftRoutes';
import payrollRoutes from './routes/payrollRoutes';
import handbookRoutes from './routes/handbookRoutes';
import fundRoutes from './routes/fundRoutes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use('/uploads', express.static(env.UPLOAD_DIR));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/time-logs', timeLogRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/handbook', handbookRoutes);
app.use('/api', fundRoutes);

// Error Handling
app.use(errorHandler);

export default app;
