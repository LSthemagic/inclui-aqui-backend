import { z } from 'zod';
import prisma from '../../config/database.js';
import { 
  createEstablishmentSchema, 
  updateEstablishmentSchema,
  establishmentResponseSchema,
  establishmentListResponseSchema,
  establishmentSearchSchema
} from './establishmentSchemas.js';
import { paginationSchema, idSchema } from '../../utils/validation.js';

export async function establishmentRoutes(fastify) {
  // Criar estabelecimento
  fastify.post('/', {
    preHandler: [fastify.authenticateOwner],
    schema: {
      tags: ['Establishments'],
      summary: 'Criar novo estabelecimento',
      description: 'Cria um novo estabelecimento (apenas proprietários)',
      security: [{ bearerAuth: [] }],
      body: createEstablishmentSchema,
      response: { 
        201: establishmentResponseSchema,
        409: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const ownerId = request.loggedUser.id;
    const establishmentData = request.body;

    // Verificar se já existe um estabelecimento com o mesmo Google Place ID
    if (establishmentData.googlePlaceId) {
      const existingEstablishment = await prisma.establishment.findUnique({
        where: { googlePlaceId: establishmentData.googlePlaceId }
      });

      if (existingEstablishment) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Estabelecimento já cadastrado com este Google Place ID'
        });
      }
    }

    const establishment = await prisma.establishment.create({
      data: {
        ...establishmentData,
        ownerId
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviews: {
          include: {
            owner: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { reviews: true }
        }
      }
    });

    return reply.status(201).send(establishment);
  });

  // Listar estabelecimentos com filtros e busca
  fastify.get('/', {
    schema: {
      tags: ['Establishments'],
      summary: 'Listar estabelecimentos',
      description: 'Lista estabelecimentos com filtros opcionais',
      querystring: paginationSchema.merge(establishmentSearchSchema),
      response: { 
        200: establishmentListResponseSchema 
      }
    }
  }, async (request, reply) => {
    const { 
      page, 
      limit, 
      search, 
      category, 
      city, 
      state, 
      minRating,
      latitude,
      longitude,
      radius 
    } = request.query;
    
    const skip = (page - 1) * limit;

    // Construir filtros
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { neighborhood: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(category && { category }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(state && { state })
    };

    // Se coordenadas foram fornecidas, calcular distância
    let orderBy = { createdAt: 'desc' };
    if (latitude && longitude) {
      // Para PostgreSQL com extensão PostGIS, você poderia usar:
      // ST_DWithin(ST_MakePoint(longitude, latitude), ST_MakePoint(longitude, latitude), radius * 1000)
      // Por simplicidade, vamos usar ordenação por distância aproximada
      orderBy = [
        {
          // Ordenar por distância aproximada (fórmula simples)
          // Em produção, use PostGIS ou similar para cálculos precisos
          latitude: 'asc'
        },
        { createdAt: 'desc' }
      ];
    }

    const [establishments, total] = await Promise.all([
      prisma.establishment.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviews: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5 // Limitar reviews na listagem
          },
          _count: {
            select: { reviews: true }
          }
        },
        skip,
        take: limit,
        orderBy
      }),
      prisma.establishment.count({ where })
    ]);

    // Filtrar por rating mínimo se especificado
    let filteredEstablishments = establishments;
    if (minRating) {
      filteredEstablishments = establishments.filter(establishment => {
        if (establishment.reviews.length === 0) return false;
        const avgRating = establishment.reviews.reduce((sum, review) => sum + review.rating, 0) / establishment.reviews.length;
        return avgRating >= minRating;
      });
    }

    // Calcular score de acessibilidade baseado nas avaliações
    const establishmentsWithScore = filteredEstablishments.map(establishment => {
      let accessibilityScore = null;
      if (establishment.reviews.length > 0) {
        accessibilityScore = establishment.reviews.reduce((sum, review) => sum + review.rating, 0) / establishment.reviews.length;
        accessibilityScore = Math.round(accessibilityScore * 10) / 10; // Arredondar para 1 casa decimal
      }
      
      return {
        ...establishment,
        accessibilityScore
      };
    });

    const totalPages = Math.ceil(total / limit);

    return reply.send({
      establishments: establishmentsWithScore,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  });

  // Obter estabelecimento por ID
  fastify.get('/:id', {
    schema: {
      tags: ['Establishments'],
      summary: 'Obter estabelecimento por ID',
      description: 'Retorna os dados completos de um estabelecimento',
      params: idSchema,
      response: { 
        200: establishmentResponseSchema,
        404: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;

    const establishment = await prisma.establishment.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviews: {
          include: {
            owner: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { reviews: true }
        }
      }
    });

    if (!establishment) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Estabelecimento não encontrado'
      });
    }

    // Calcular score de acessibilidade
    let accessibilityScore = null;
    if (establishment.reviews.length > 0) {
      accessibilityScore = establishment.reviews.reduce((sum, review) => sum + review.rating, 0) / establishment.reviews.length;
      accessibilityScore = Math.round(accessibilityScore * 10) / 10;
    }

    return reply.send({
      ...establishment,
      accessibilityScore
    });
  });

  // Atualizar estabelecimento
  fastify.put('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Establishments'],
      summary: 'Atualizar estabelecimento',
      description: 'Atualiza um estabelecimento (apenas o proprietário ou admin)',
      security: [{ bearerAuth: [] }],
      params: idSchema,
      body: updateEstablishmentSchema,
      response: { 
        200: establishmentResponseSchema,
        403: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const updateData = request.body;
    const userId = request.loggedUser.id;
    const userRole = request.loggedUser.role;

    // Verificar se o estabelecimento existe
    const establishment = await prisma.establishment.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!establishment) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Estabelecimento não encontrado'
      });
    }

    // Verificar permissão (apenas o proprietário ou admin)
    if (establishment.ownerId !== userId && userRole !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Você não tem permissão para atualizar este estabelecimento'
      });
    }

    const updatedEstablishment = await prisma.establishment.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviews: {
          include: {
            owner: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { reviews: true }
        }
      }
    });

    // Calcular score de acessibilidade
    let accessibilityScore = null;
    if (updatedEstablishment.reviews.length > 0) {
      accessibilityScore = updatedEstablishment.reviews.reduce((sum, review) => sum + review.rating, 0) / updatedEstablishment.reviews.length;
      accessibilityScore = Math.round(accessibilityScore * 10) / 10;
    }

    return reply.send({
      ...updatedEstablishment,
      accessibilityScore
    });
  });

  // Deletar estabelecimento
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Establishments'],
      summary: 'Deletar estabelecimento',
      description: 'Remove um estabelecimento (apenas o proprietário ou admin)',
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

    // Verificar se o estabelecimento existe
    const establishment = await prisma.establishment.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!establishment) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Estabelecimento não encontrado'
      });
    }

    // Verificar permissão (apenas o proprietário ou admin)
    if (establishment.ownerId !== userId && userRole !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Você não tem permissão para deletar este estabelecimento'
      });
    }

    await prisma.establishment.delete({
      where: { id }
    });

    return reply.send({ message: 'Estabelecimento deletado com sucesso' });
  });

  // Obter estabelecimentos do usuário logado
  fastify.get('/my/establishments', {
    preHandler: [fastify.authenticateOwner],
    schema: {
      tags: ['Establishments'],
      summary: 'Obter meus estabelecimentos',
      description: 'Lista os estabelecimentos do usuário logado',
      security: [{ bearerAuth: [] }],
      querystring: paginationSchema,
      response: { 
        200: establishmentListResponseSchema 
      }
    }
  }, async (request, reply) => {
    const { page, limit } = request.query;
    const skip = (page - 1) * limit;
    const ownerId = request.loggedUser.id;

    const [establishments, total] = await Promise.all([
      prisma.establishment.findMany({
        where: { ownerId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviews: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          _count: {
            select: { reviews: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.establishment.count({ where: { ownerId } })
    ]);

    // Calcular score de acessibilidade
    const establishmentsWithScore = establishments.map(establishment => {
      let accessibilityScore = null;
      if (establishment.reviews.length > 0) {
        accessibilityScore = establishment.reviews.reduce((sum, review) => sum + review.rating, 0) / establishment.reviews.length;
        accessibilityScore = Math.round(accessibilityScore * 10) / 10;
      }
      
      return {
        ...establishment,
        accessibilityScore
      };
    });

    const totalPages = Math.ceil(total / limit);

    return reply.send({
      establishments: establishmentsWithScore,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  });
}

