import { Request, Response, NextFunction } from 'express';
import { HandbookService } from '../services/handbookService';
import { z } from 'zod';

const handbookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  content: z.string().min(1, "Content is required"),
  targetRoles: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']),
});

export const getArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, targetRole } = req.query;
    const articles = await HandbookService.getArticles(
      category as string | undefined,
      targetRole as string | undefined
    );
    res.status(200).json(articles);
  } catch (error) {
    next(error);
  }
};

export const getArticleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await HandbookService.getArticleById(req.params.id);
    res.status(200).json(article);
  } catch (error) {
    next(error);
  }
};

export const createArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = handbookSchema.parse(req.body);
    const article = await HandbookService.createArticle(validatedData);
    res.status(201).json(article);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
    }
    next(error);
  }
};

export const updateArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = handbookSchema.partial().parse(req.body);
    const article = await HandbookService.updateArticle(req.params.id, validatedData);
    res.status(200).json(article);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
    }
    next(error);
  }
};

export const acknowledgeArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Attempt to extract userId from token via req.user if auth middleware is in place
    // Fallback to req.body.userId if token extraction is not available
    const userId = (req as any).user?.id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. User ID not found." });
    }
    const ack = await HandbookService.acknowledgeArticle(req.params.id, userId);
    res.status(200).json(ack);
  } catch (error) {
    next(error);
  }
};
