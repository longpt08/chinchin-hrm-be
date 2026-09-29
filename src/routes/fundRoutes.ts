import { Router } from 'express';
import {
  getPunishmentTemplates,
  getFundLogs,
  createFundLog,
} from '../controllers/fundController';

const router = Router();

// These routes assume mounting at a generic API prefix or at `/api`.
// The integration guide expects `/api/punishments/templates` and `/api/funds/logs`.
// If this router is mounted at `/api` in app.ts:
router.get('/punishments/templates', getPunishmentTemplates);
router.get('/funds/logs', getFundLogs);
router.post('/funds/logs', createFundLog);

export default router;
