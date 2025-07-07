import { z } from 'zod';
import bcrypt from 'bcrypt';
import prisma from '../../config/database.js';
import { 
  createUserSchema, 
  loginSchema, 
  updateUserSchema,
  changePasswordSchema,
  userResponseSchema,
  userListResponseSchema,
  tokenResponseSchema
} from './userSchemas.js';
import { paginationSchema, idSchema } from '../../utils/validation.js';

export async function userRoutes(fastify) {
  // Registrar um novo usuário
  fastify.post('/', {
    schema: {
      tags: ['Users & Auth'],
      summary: 'Registrar um novo usuário',
      description: 'Cria uma nova conta de usuário no sistema',
      body: createUserSchema,
      response: { 
        201: userResponseSchema,
        409: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { name, email, password, role } = request.body;
    
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return reply.status(409).send({ 
        error: 'Conflict',
        message: 'Email já está em uso' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword,
        role: role || 'USER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return reply.status(201).send(user);
  });

  // Login
  fastify.post('/login', {
    schema: {
      tags: ['Users & Auth'],
      summary: 'Fazer login',
      description: 'Autentica um usuário e retorna um token JWT',
      body: loginSchema,
      response: { 
        200: tokenResponseSchema,
        401: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return reply.status(401).send({ 
        error: 'Unauthorized',
        message: 'Credenciais inválidas' 
      });
    }

    if (user.status !== 'ACTIVE') {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Conta inativa. Entre em contato com o suporte.'
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return reply.status(401).send({ 
        error: 'Unauthorized',
        message: 'Credenciais inválidas' 
      });
    }

    const token = fastify.jwt.sign({ sub: user.id }, { expiresIn: '7d' });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return reply.status(200).send({ 
      token,
      user: userWithoutPassword
    });
  });

  // Obter perfil do usuário logado
  fastify.get('/profile', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users & Auth'],
      summary: 'Obter perfil do usuário',
      description: 'Retorna os dados do usuário logado',
      security: [{ bearerAuth: [] }],
      response: { 
        200: userResponseSchema 
      }
    }
  }, async (request, reply) => {
    return reply.send(request.loggedUser);
  });

  // Atualizar perfil do usuário
  fastify.put('/profile', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users & Auth'],
      summary: 'Atualizar perfil do usuário',
      description: 'Atualiza os dados do usuário logado',
      security: [{ bearerAuth: [] }],
      body: updateUserSchema,
      response: { 
        200: userResponseSchema 
      }
    }
  }, async (request, reply) => {
    const { name, avatarUrl } = request.body;
    const userId = request.loggedUser.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return reply.send(updatedUser);
  });

  // Alterar senha
  fastify.patch('/change-password', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users & Auth'],
      summary: 'Alterar senha',
      description: 'Altera a senha do usuário logado',
      security: [{ bearerAuth: [] }],
      body: changePasswordSchema,
      response: { 
        200: z.object({ message: z.string() }),
        400: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body;
    const userId = request.loggedUser.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Senha atual incorreta'
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return reply.send({ message: 'Senha alterada com sucesso' });
  });

  // Listar usuários (apenas admin)
  fastify.get('/', {
    preHandler: [fastify.authenticateAdmin],
    schema: {
      tags: ['Users & Auth'],
      summary: 'Listar usuários',
      description: 'Lista todos os usuários (apenas administradores)',
      security: [{ bearerAuth: [] }],
      querystring: paginationSchema.extend({
        search: z.string().optional(),
        role: z.enum(['USER', 'OWNER', 'ADMIN']).optional(),
        status: z.enum(['ACTIVE', 'PENDING_VERIFICATION', 'BANNED']).optional()
      }),
      response: { 
        200: userListResponseSchema 
      }
    }
  }, async (request, reply) => {
    const { page, limit, search, role, status } = request.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(role && { role }),
      ...(status && { status })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return reply.send({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  });

  // Obter usuário por ID (apenas admin)
  fastify.get('/:id', {
    preHandler: [fastify.authenticateAdmin],
    schema: {
      tags: ['Users & Auth'],
      summary: 'Obter usuário por ID',
      description: 'Retorna os dados de um usuário específico (apenas administradores)',
      security: [{ bearerAuth: [] }],
      params: idSchema,
      response: { 
        200: userResponseSchema,
        404: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Usuário não encontrado'
      });
    }

    return reply.send(user);
  });

  // Atualizar usuário (apenas admin)
  fastify.put('/:id', {
    preHandler: [fastify.authenticateAdmin],
    schema: {
      tags: ['Users & Auth'],
      summary: 'Atualizar usuário',
      description: 'Atualiza os dados de um usuário específico (apenas administradores)',
      security: [{ bearerAuth: [] }],
      params: idSchema,
      body: updateUserSchema,
      response: { 
        200: userResponseSchema,
        404: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const updateData = request.body;

    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return reply.send(updatedUser);
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Usuário não encontrado'
        });
      }
      throw error;
    }
  });

  // Deletar usuário (apenas admin)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticateAdmin],
    schema: {
      tags: ['Users & Auth'],
      summary: 'Deletar usuário',
      description: 'Remove um usuário do sistema (apenas administradores)',
      security: [{ bearerAuth: [] }],
      params: idSchema,
      response: { 
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;

    try {
      await prisma.user.delete({
        where: { id }
      });

      return reply.send({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Usuário não encontrado'
        });
      }
      throw error;
    }
  });
}

