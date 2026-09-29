import { Router } from 'express';
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  acknowledgeArticle,
} from '../controllers/handbookController';

const router = Router();

router.get('/', getArticles);
router.post('/', createArticle);
router.get('/:id', getArticleById);
router.put('/:id', updateArticle);
router.post('/:id/acknowledge', acknowledgeArticle);

export default router;
