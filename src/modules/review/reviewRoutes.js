import { z } from 'zod';
import prisma from '../../config/database.js';
import { 
  createReviewSchema, 
  updateReviewSchema,
  reviewResponseSchema,
  reviewListResponseSchema,
  reviewStatsSchema
} from './reviewSchemas.js';
import { paginationSchema, idSchema } from '../../utils/validation.js';

export async function reviewRoutes(fastify) {
  // Criar review
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Reviews'],
      summary: 'Criar nova avaliação',
      description: 'Cria uma nova avaliação para um estabelecimento',
      security: [{ bearerAuth: [] }],
      body: createReviewSchema,
      response: { 
        201: reviewResponseSchema,
        404: z.object({ error: z.string(), message: z.string() }),
        409: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { establishmentId, title, rating, comment } = request.body;
    const ownerId = request.loggedUser.id;

    // Verificar se o estabelecimento existe
    const establishment = await prisma.establishment.findUnique({
      where: { id: establishmentId },
      select: { id: true, name: true, category: true }
    });

    if (!establishment) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Estabelecimento não encontrado'
      });
    }

    // Verificar se o usuário já avaliou este estabelecimento
    const existingReview = await prisma.review.findFirst({
      where: {
        establishmentId,
        ownerId
      }
    });

    if (existingReview) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'Você já avaliou este estabelecimento. Use PUT para atualizar sua avaliação.'
      });
    }

    const review = await prisma.review.create({
      data: {
        title,
        rating,
        comment,
        establishmentId,
        ownerId
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        establishment: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    return reply.status(201).send(review);
  });

  // Listar reviews com filtros
  fastify.get('/', {
    schema: {
      tags: ['Reviews'],
      summary: 'Listar avaliações',
      description: 'Lista avaliações com filtros opcionais',
      querystring: paginationSchema.extend({
        establishmentId: z.string().uuid().optional(),
        userId: z.string().uuid().optional(),
        minRating: z.coerce.number().int().min(1).max(5).optional(),
        maxRating: z.coerce.number().int().min(1).max(5).optional()
      }),
      response: { 
        200: reviewListResponseSchema 
      }
    }
  }, async (request, reply) => {
    const { 
      page, 
      limit, 
      establishmentId, 
      userId, 
      minRating, 
      maxRating 
    } = request.query;
    
    const skip = (page - 1) * limit;

    const where = {
      ...(establishmentId && { establishmentId }),
      ...(userId && { ownerId: userId }),
      ...(minRating && { rating: { gte: minRating } }),
      ...(maxRating && { rating: { lte: maxRating } }),
      ...(minRating && maxRating && { 
        rating: { 
          gte: minRating, 
          lte: maxRating 
        } 
      })
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          establishment: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.review.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return reply.send({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  });

  // Obter review por ID
  fastify.get('/:id', {
    schema: {
      tags: ['Reviews'],
      summary: 'Obter avaliação por ID',
      description: 'Retorna os dados de uma avaliação específica',
      params: idSchema,
      response: { 
        200: reviewResponseSchema,
        404: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        establishment: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    if (!review) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Avaliação não encontrada'
      });
    }

    return reply.send(review);
  });

  // Atualizar review
  fastify.put('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Reviews'],
      summary: 'Atualizar avaliação',
      description: 'Atualiza uma avaliação (apenas o autor ou admin)',
      security: [{ bearerAuth: [] }],
      params: idSchema,
      body: updateReviewSchema,
      response: { 
        200: reviewResponseSchema,
        403: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const updateData = request.body;
    const userId = request.loggedUser.id;
    const userRole = request.loggedUser.role;

    // Verificar se a review existe
    const review = await prisma.review.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!review) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Avaliação não encontrada'
      });
    }

    // Verificar permissão (apenas o autor ou admin)
    if (review.ownerId !== userId && userRole !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Você não tem permissão para atualizar esta avaliação'
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        establishment: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    return reply.send(updatedReview);
  });

  // Deletar review
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Reviews'],
      summary: 'Deletar avaliação',
      description: 'Remove uma avaliação (apenas o autor ou admin)',
      security: [{ bearerAuth: [] }],
      params: idSchema,
      response: { 
        200: z.object({ message: z.string() }),
        403: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const userId = request.loggedUser.id;
    const userRole = request.loggedUser.role;

    // Verificar se a review existe
    const review = await prisma.review.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!review) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Avaliação não encontrada'
      });
    }

    // Verificar permissão (apenas o autor ou admin)
    if (review.ownerId !== userId && userRole !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Você não tem permissão para deletar esta avaliação'
      });
    }

    await prisma.review.delete({
      where: { id }
    });

    return reply.send({ message: 'Avaliação deletada com sucesso' });
  });

  // Obter estatísticas de reviews de um estabelecimento
  fastify.get('/establishment/:establishmentId/stats', {
    schema: {
      tags: ['Reviews'],
      summary: 'Estatísticas de avaliações',
      description: 'Retorna estatísticas das avaliações de um estabelecimento',
      params: z.object({
        establishmentId: z.string().uuid('ID do estabelecimento deve ser um UUID válido')
      }),
      response: { 
        200: reviewStatsSchema,
        404: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { establishmentId } = request.params;

    // Verificar se o estabelecimento existe
    const establishment = await prisma.establishment.findUnique({
      where: { id: establishmentId },
      select: { id: true }
    });

    if (!establishment) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Estabelecimento não encontrado'
      });
    }

    // Buscar todas as reviews do estabelecimento
    const reviews = await prisma.review.findMany({
      where: { establishmentId },
      select: { rating: true }
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // Calcular distribuição de ratings
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    return reply.send({
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Arredondar para 1 casa decimal
      ratingDistribution
    });
  });

  // Obter reviews do usuário logado
  fastify.get('/my/reviews', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Reviews'],
      summary: 'Minhas avaliações',
      description: 'Lista as avaliações do usuário logado',
      security: [{ bearerAuth: [] }],
      querystring: paginationSchema,
      response: { 
        200: reviewListResponseSchema 
      }
    }
  }, async (request, reply) => {
    const { page, limit } = request.query;
    const skip = (page - 1) * limit;
    const ownerId = request.loggedUser.id;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { ownerId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          establishment: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.review.count({ where: { ownerId } })
    ]);

    const totalPages = Math.ceil(total / limit);

    return reply.send({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  });
}

