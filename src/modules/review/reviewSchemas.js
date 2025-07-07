import { z } from 'zod';
import { ratingSchema } from '../../utils/validation.js';

const reviewCore = {
  title: z.string()
    .max(100, 'Título deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  rating: ratingSchema,
  comment: z.string()
    .max(2000, 'Comentário deve ter no máximo 2000 caracteres')
    .trim()
    .optional(),
};

export const createReviewSchema = z.object({
  ...reviewCore,
  establishmentId: z.string().uuid('ID do estabelecimento deve ser um UUID válido')
});

export const updateReviewSchema = z.object({
  title: reviewCore.title,
  rating: reviewCore.rating.optional(),
  comment: reviewCore.comment,
});

export const reviewResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  ownerId: z.string().uuid(),
  establishmentId: z.string().uuid(),
  owner: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatarUrl: z.string().url().nullable()
  }).optional(),
  establishment: z.object({
    id: z.string().uuid(),
    name: z.string(),
    category: z.string()
  }).optional()
});

export const reviewListResponseSchema = z.object({
  reviews: z.array(reviewResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

export const reviewStatsSchema = z.object({
  totalReviews: z.number(),
  averageRating: z.number(),
  ratingDistribution: z.object({
    1: z.number(),
    2: z.number(),
    3: z.number(),
    4: z.number(),
    5: z.number()
  })
});

