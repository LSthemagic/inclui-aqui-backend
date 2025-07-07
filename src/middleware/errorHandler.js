export const errorHandler = (error, request, reply) => {
  const { validation, validationContext } = error;

  // Erro de validação do Zod
  if (validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Dados inválidos fornecidos',
      details: validation,
      context: validationContext
    });
  }

  // Erro de autenticação JWT
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token de autorização não fornecido'
    });
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token de autorização inválido'
    });
  }

  // Erro do Prisma
  if (error.code === 'P2002') {
    return reply.status(409).send({
      error: 'Conflict',
      message: 'Recurso já existe',
      details: error.meta
    });
  }

  if (error.code === 'P2025') {
    return reply.status(404).send({
      error: 'Not Found',
      message: 'Recurso não encontrado'
    });
  }

  // Erro de arquivo muito grande
  if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
    return reply.status(413).send({
      error: 'Payload Too Large',
      message: 'Arquivo muito grande. Tamanho máximo permitido: 5MB'
    });
  }

  // Log do erro para debug
  request.log.error(error);

  // Erro genérico
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Erro interno do servidor'
  });
};

