import prisma from '../config/database.js';

export function setupAuth(fastify) {
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
      
      const user = await prisma.user.findUnique({ 
        where: { id: request.user.sub },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true
        }
      });
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      if (user.status !== 'ACTIVE') {
        throw new Error('Usuário inativo');
      }
      
      request.loggedUser = user;

    } catch (err) {
      reply.code(401).send({ 
        error: 'Unauthorized',
        message: 'Token inválido ou expirado',
        details: err.message 
      });
    }
  });

  // Middleware para verificar se o usuário é proprietário
  fastify.decorate('authenticateOwner', async function (request, reply) {
    await fastify.authenticate(request, reply);
    
    if (request.loggedUser.role !== 'OWNER' && request.loggedUser.role !== 'ADMIN') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Acesso negado. Apenas proprietários podem acessar este recurso.'
      });
    }
  });

  // Middleware para verificar se o usuário é admin
  fastify.decorate('authenticateAdmin', async function (request, reply) {
    await fastify.authenticate(request, reply);
    
    if (request.loggedUser.role !== 'ADMIN') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Acesso negado. Apenas administradores podem acessar este recurso.'
      });
    }
  });
}

