import 'dotenv/config';
import fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rotas
import { userRoutes } from './modules/user/userRoutes.js';
import { establishmentRoutes } from './modules/establishment/establishmentRoutes.js';
import { placesRoutes } from './modules/places/placesRoutes.js';
import { reviewRoutes } from './modules/review/reviewRoutes.js';

// Importar middlewares
import { setupAuth } from './utils/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
});

// Configurar compiladores Zod
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Configuração de CORS
app.register(fastifyCors, { 
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
});

// Configuração JWT
app.register(fastifyJwt, { 
  secret: process.env.JWT_SECRET || 'supersecret-change-this-in-production-later'
});

// Configuração para upload de arquivos
app.register(fastifyMultipart, {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  }
});

// Servir arquivos estáticos
app.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'uploads'),
  prefix: '/uploads/'
});

// Swagger / OpenAPI Documentation
app.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'IncluiAqui API',
      description: 'Backend API para o projeto IncluiAqui - Sistema de avaliação de acessibilidade para estabelecimentos.',
      version: '1.0.0',
      contact: {
        name: 'IncluiAqui Team',
        email: 'contato@incluiaqui.com'
      }
    },
    host: 'localhost:3333',
    schemes: ['http', 'https'],
    consumes: ['application/json', 'multipart/form-data'],
    produces: ['application/json'],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: "Digite 'Bearer' seguido de um espaço e então seu token JWT."
      },
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
});

app.register(fastifySwaggerUI, { 
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayOperationId: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    displayRequestDuration: true
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
});

// Registrar middleware de autenticação
setupAuth(app);

// Registrar middleware de tratamento de erros
app.setErrorHandler(errorHandler);

// Health check
app.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  };
});

// Registrar rotas da API
app.register(userRoutes, { prefix: '/api/users' });
app.register(establishmentRoutes, { prefix: '/api/establishments' });
app.register(placesRoutes, { prefix: '/api/places' });
app.register(reviewRoutes, { prefix: '/api/reviews' });

// Rota 404
app.setNotFoundHandler(async (request, reply) => {
  reply.code(404).send({
    error: 'Not Found',
    message: 'Rota não encontrada',
    statusCode: 404
  });
});

// Inicializar servidor
const start = async () => {
  try {
    const port = parseInt(process.env.PORT) || 4444;
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    
    console.log('🚀 Servidor HTTP rodando em http://localhost:4444');
    console.log('📚 Documentação da API disponível em http://localhost:4444/docs');
    console.log('💚 Health check disponível em http://localhost:4444/health');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

