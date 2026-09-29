import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export class HandbookService {
  static async getArticles(category?: string, targetRole?: string) {
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (targetRole) {
      where.target_roles = { has: targetRole };
    }
    return await prisma.handbookArticle.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  static async getArticleById(id: string) {
    const article = await prisma.handbookArticle.findUnique({
      where: { id },
      include: { acknowledgements: true },
    });
    if (!article) throw new AppError(404, 'Article not found');
    return article;
  }

  static async createArticle(data: { title: string; category: string; content: string; targetRoles: string[]; status: string }) {
    return await prisma.handbookArticle.create({
      data: {
        title: data.title,
        category: data.category,
        content: data.content,
        target_roles: data.targetRoles,
        status: data.status,
      },
    });
  }

  static async updateArticle(id: string, data: Partial<{ title: string; category: string; content: string; targetRoles: string[]; status: string }>) {
    const article = await prisma.handbookArticle.findUnique({ where: { id } });
    if (!article) throw new AppError(404, 'Article not found');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.targetRoles !== undefined) updateData.target_roles = data.targetRoles;
    if (data.status !== undefined) updateData.status = data.status;

    return await prisma.handbookArticle.update({
      where: { id },
      data: updateData,
    });
  }

  static async acknowledgeArticle(articleId: string, userId: string) {
    const article = await prisma.handbookArticle.findUnique({ where: { id: articleId } });
    if (!article) throw new AppError(404, 'Article not found');

    const existing = await prisma.articleAcknowledgement.findFirst({
      where: { article_id: articleId, user_id: userId },
    });

    if (existing) {
      return existing; // Already acknowledged
    }

    return await prisma.articleAcknowledgement.create({
      data: {
        article_id: articleId,
        user_id: userId,
      },
    });
  }
}
