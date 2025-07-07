# IncluiAqui Backend

Backend API para o projeto IncluiAqui - Sistema de avaliação de acessibilidade para estabelecimentos.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Fastify** - Framework web rápido e eficiente
- **Prisma** - ORM moderno para banco de dados
- **PostgreSQL** - Banco de dados relacional
- **Zod** - Validação de schemas
- **JWT** - Autenticação via tokens
- **Bcrypt** - Hash de senhas
- **Google Maps API** - Integração com serviços de mapas
- **Nodemon** - Desenvolvimento com hot reload

## 📋 Funcionalidades

### Autenticação e Usuários
- ✅ Registro de usuários
- ✅ Login com JWT
- ✅ Perfis de usuário (USER, OWNER, ADMIN)
- ✅ Gerenciamento de perfil
- ✅ Alteração de senha
- ✅ Upload de avatar

### Estabelecimentos
- ✅ Cadastro de estabelecimentos
- ✅ Listagem com filtros e busca
- ✅ Geolocalização
- ✅ Categorização
- ✅ Integração com Google Places
- ✅ Upload de imagens

### Avaliações
- ✅ Sistema de avaliações (1-5 estrelas)
- ✅ Comentários detalhados
- ✅ Estatísticas de avaliações
- ✅ Cálculo de score de acessibilidade

### Google Maps Integration
- ✅ Busca de estabelecimentos próximos
- ✅ Detalhes de estabelecimentos
- ✅ Geocoding e Reverse Geocoding
- ✅ Cálculo de distâncias
- ✅ Fotos dos estabelecimentos

### Recursos Adicionais
- ✅ Documentação automática (Swagger)
- ✅ Validação robusta de dados
- ✅ Tratamento de erros
- ✅ Logs estruturados
- ✅ Upload de arquivos
- ✅ CORS configurado
- ✅ Health check

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 12+
- Conta no Google Cloud (para Maps API)

### 1. Clone o repositório
\`\`\`bash
git clone <repository-url>
cd inclui-aqui-backend
\`\`\`

### 2. Instale as dependências
\`\`\`bash
npm install
\`\`\`

### 3. Configure as variáveis de ambiente
Copie o arquivo \`.env.example\` para \`.env\` e configure:

\`\`\`env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/inclui_aqui_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Server
PORT=3333
HOST=0.0.0.0

# Google Maps API
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Upload
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880
\`\`\`

### 4. Configure o banco de dados
\`\`\`bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate

# (Opcional) Executar seed
npm run db:seed
\`\`\`

### 5. Inicie o servidor
\`\`\`bash
# Desenvolvimento (com Nodemon)
npm run dev

# Produção
npm start
\`\`\`

## 📚 Documentação da API

Após iniciar o servidor, acesse:
- **Swagger UI**: http://localhost:3333/docs
- **Health Check**: http://localhost:3333/health

## 🗂️ Estrutura do Projeto

\`\`\`
src/
├── config/
│   └── database.js          # Configuração do Prisma
├── middleware/
│   └── errorHandler.js      # Tratamento de erros
├── modules/
│   ├── user/               # Módulo de usuários
│   │   ├── userRoutes.js
│   │   └── userSchemas.js
│   ├── establishment/      # Módulo de estabelecimentos
│   │   ├── establishmentRoutes.js
│   │   └── establishmentSchemas.js
│   ├── review/            # Módulo de avaliações
│   │   ├── reviewRoutes.js
│   │   └── reviewSchemas.js
│   └── places/            # Módulo Google Places
│       ├── placesRoutes.js
│       └── placesSchemas.js
├── services/
│   ├── googleMapsService.js # Integração Google Maps
│   └── uploadService.js     # Serviço de upload
├── utils/
│   ├── auth.js             # Utilitários de autenticação
│   ├── validation.js       # Validações comuns
│   └── helpers.js          # Funções auxiliares
└── server.js               # Servidor principal
\`\`\`

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

\`\`\`
Authorization: Bearer <seu-jwt-token>
\`\`\`

### Níveis de Acesso
- **USER**: Usuário comum (pode avaliar estabelecimentos)
- **OWNER**: Proprietário (pode cadastrar estabelecimentos)
- **ADMIN**: Administrador (acesso total)

## 📊 Banco de Dados

### Modelos Principais

#### User
- id, name, email, password
- role (USER, OWNER, ADMIN)
- status (ACTIVE, PENDING_VERIFICATION, BANNED)
- avatarUrl, timestamps

#### Establishment
- id, name, description, phone, category
- Endereço completo + coordenadas
- googlePlaceId, coverImageUrl
- accessibilityScore (calculado)
- ownerId, timestamps

#### Review
- id, title, comment, rating (1-5)
- establishmentId, ownerId
- timestamps

## 🌍 Google Maps Integration

### APIs Utilizadas
- **Places Nearby Search**: Buscar estabelecimentos próximos
- **Place Details**: Detalhes completos de estabelecimentos
- **Geocoding**: Converter endereços em coordenadas
- **Places Photos**: Fotos dos estabelecimentos

### Configuração
1. Ative as APIs no Google Cloud Console
2. Crie uma chave de API
3. Configure no arquivo \`.env\`

## 📁 Upload de Arquivos

### Categorias Suportadas
- **avatars**: Fotos de perfil dos usuários
- **establishments**: Imagens dos estabelecimentos
- **temp**: Arquivos temporários

### Formatos Aceitos
- JPEG, JPG, PNG, WebP
- Tamanho máximo: 5MB

## 🧪 Scripts Disponíveis

\`\`\`bash
npm run dev          # Desenvolvimento com Nodemon
npm start            # Produção
npm run db:generate  # Gerar cliente Prisma
npm run db:migrate   # Executar migrações
npm run db:studio    # Interface visual do banco
npm run db:seed      # Executar seed (se disponível)
\`\`\`

## 🔧 Configuração de Produção

### Variáveis de Ambiente Importantes
\`\`\`env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="strong-secret-key"
GOOGLE_MAPS_API_KEY="your-api-key"
\`\`\`

### Recomendações
- Use um banco PostgreSQL dedicado
- Configure logs estruturados
- Implemente rate limiting
- Use HTTPS em produção
- Configure backup do banco

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit suas mudanças (\`git commit -m 'Add some AmazingFeature'\`)
4. Push para a branch (\`git push origin feature/AmazingFeature\`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte:
- Email: contato@incluiaqui.com
- Issues: [GitHub Issues](https://github.com/seu-usuario/inclui-aqui-backend/issues)

---

Desenvolvido com ❤️ para tornar o mundo mais acessível.

