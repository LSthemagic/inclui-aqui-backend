# Exemplos de Requisições da API IncluiAqui

Este documento fornece exemplos de requisições HTTP para testar as rotas da API do backend IncluiAqui. Certifique-se de que o servidor esteja em execução (geralmente em `http://localhost:3333`).

## 🔑 Geração do JWT Secret

Para gerar um `JWT_SECRET` seguro para o seu arquivo `.env`, você pode usar o seguinte comando no terminal:

```bash
node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"
```

Este comando irá gerar uma string hexadecimal aleatória de 64 caracteres, que você deve usar como valor para a variável `JWT_SECRET` no seu arquivo `.env`.

Exemplo de saída:

```
4bc0fb87b4990de49ca180ee498ecd668da730af16faf61205bded7041782b98
```

Substitua o valor `supersecret-change-this-in-production-later` no seu `.env` por esta string gerada.

---

## 👤 Rotas de Usuário e Autenticação (`/api/users`)

### 1. Registrar um novo usuário (`POST /api/users`)

Cria uma nova conta de usuário no sistema. Opcionalmente, pode-se definir a `role` (papel) do usuário, mas por padrão será `USER`.

**Endpoint:** `POST http://localhost:3333/api/users`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Nome do Usuário",
  "email": "usuario@example.com",
  "password": "senhaSegura123",
  "role": "USER" // Opcional: pode ser "OWNER" ou "ADMIN"
}
```

**Exemplo de `curl`:**
```bash
curl -X POST \\
  http://localhost:3333/api/users \\
  -H "Content-Type: application/json" \\
  -d 
```json
{
    "name": "Nome do Usuário",
    "email": "usuario@example.com",
    "password": "senhaSegura123",
    "role": "USER"
}
```

### 2. Fazer login (`POST /api/users/login`)

Autentica um usuário e retorna um token JWT. Este token deve ser usado em requisições futuras que exigem autenticação.

**Endpoint:** `POST http://localhost:3333/api/users/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senhaSegura123"
}
```

**Exemplo de `curl`:**
```bash
curl -X POST \\
  http://localhost:3333/api/users/login \\
  -H "Content-Type: application/json" \\
  -d 
```json
{
    "email": "usuario@example.com",
    "password": "senhaSegura123"
}
```

**Resposta esperada (com o token JWT):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Nome do Usuário",
    "email": "usuario@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "avatarUrl": null,
    "createdAt": "2024-07-06T12:00:00.000Z",
    "updatedAt": "2024-07-06T12:00:00.000Z"
  }
}
```

### 3. Obter perfil do usuário logado (`GET /api/users/profile`)

Retorna os dados do usuário atualmente logado. Requer autenticação (token JWT).

**Endpoint:** `GET http://localhost:3333/api/users/profile`

**Headers:**
```
Authorization: Bearer <SEU_TOKEN_JWT>
```

**Exemplo de `curl`:**
```bash
curl -X GET \\
  http://localhost:3333/api/users/profile \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT>"
```

### 4. Atualizar perfil do usuário (`PUT /api/users/profile`)

Atualiza os dados do usuário logado. Requer autenticação (token JWT).

**Endpoint:** `PUT http://localhost:3333/api/users/profile`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <SEU_TOKEN_JWT>
```

**Body:**
```json
{
  "name": "Novo Nome do Usuário",
  "avatarUrl": "https://example.com/new-avatar.jpg" // Opcional: pode ser null para remover
}
```

**Exemplo de `curl`:**
```bash
curl -X PUT \\
  http://localhost:3333/api/users/profile \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT>" \\
  -d 
```json
{
    "name": "Novo Nome do Usuário",
    "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

### 5. Alterar senha (`PATCH /api/users/change-password`)

Altera a senha do usuário logado. Requer autenticação (token JWT).

**Endpoint:** `PATCH http://localhost:3333/api/users/change-password`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <SEU_TOKEN_JWT>
```

**Body:**
```json
{
  "currentPassword": "senhaAntiga123",
  "newPassword": "novaSenhaSegura456"
}
```

**Exemplo de `curl`:**
```bash
curl -X PATCH \\
  http://localhost:3333/api/users/change-password \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT>" \\
  -d 
```json
{
    "currentPassword": "senhaAntiga123",
    "newPassword": "novaSenhaSegura456"
}
```

### 6. Listar usuários (`GET /api/users`)

Lista todos os usuários. **Requer autenticação como `ADMIN`**.

**Endpoint:** `GET http://localhost:3333/api/users`

**Headers:**
```
Authorization: Bearer <SEU_TOKEN_JWT_ADMIN>
```

**Query Parameters (Opcionais):**
- `page`: Número da página (padrão: 1)
- `limit`: Limite de itens por página (padrão: 10)
- `search`: Termo de busca para nome ou email
- `role`: Filtrar por papel (USER, OWNER, ADMIN)
- `status`: Filtrar por status (ACTIVE, PENDING_VERIFICATION, BANNED)

**Exemplo de `curl` (com filtros):**
```bash
curl -X GET \\
  "http://localhost:3333/api/users?page=1&limit=5&search=maria&role=USER" \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT_ADMIN>"
```

### 7. Obter usuário por ID (`GET /api/users/:id`)

Retorna os dados de um usuário específico pelo ID. **Requer autenticação como `ADMIN`**.

**Endpoint:** `GET http://localhost:3333/api/users/:id`

**Headers:**
```
Authorization: Bearer <SEU_TOKEN_JWT_ADMIN>
```

**Exemplo de `curl`:**
```bash
curl -X GET \\
  http://localhost:3333/api/users/uuid-do-usuario \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT_ADMIN>"
```

### 8. Atualizar usuário por ID (`PUT /api/users/:id`)

Atualiza os dados de um usuário específico pelo ID. **Requer autenticação como `ADMIN`**.

**Endpoint:** `PUT http://localhost:3333/api/users/:id`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <SEU_TOKEN_JWT_ADMIN>
```

**Body:**
```json
{
  "name": "Nome Atualizado",
  "email": "email.atualizado@example.com",
  "role": "OWNER",
  "status": "ACTIVE"
}
```

**Exemplo de `curl`:**
```bash
curl -X PUT \\
  http://localhost:3333/api/users/uuid-do-usuario \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT_ADMIN>" \\
  -d 
```json
{
    "name": "Nome Atualizado",
    "email": "email.atualizado@example.com",
    "role": "OWNER",
    "status": "ACTIVE"
}
```

### 9. Deletar usuário por ID (`DELETE /api/users/:id`)

Remove um usuário do sistema pelo ID. **Requer autenticação como `ADMIN`**.

**Endpoint:** `DELETE http://localhost:3333/api/users/:id`

**Headers:**
```
Authorization: Bearer <SEU_TOKEN_JWT_ADMIN>
```

**Exemplo de `curl`:**
```bash
curl -X DELETE \\
  http://localhost:3333/api/users/uuid-do-usuario \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT_ADMIN>"
```




---

## 🏢 Rotas de Estabelecimento (`/api/establishments`)

### 1. Criar novo estabelecimento (`POST /api/establishments`)

Cria um novo estabelecimento. **Requer autenticação como `OWNER` ou `ADMIN`**.

**Endpoint:** `POST http://localhost:3333/api/establishments`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <SEU_TOKEN_JWT_OWNER_OU_ADMIN>
```

**Body:**
```json
{
  "name": "Café Acessível",
  "description": "Um café com mesas adaptadas e banheiro acessível.",
  "phone": "(11) 98765-4321",
  "category": "CAFE",
  "street": "Rua da Paz",
  "number": "100",
  "neighborhood": "Jardins",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01415-000",
  "latitude": -23.561356,
  "longitude": -46.656596,
  "coverImageUrl": "https://example.com/cafe-acessivel.jpg",
  "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyGZysgOQ"
}
```

**Exemplo de `curl`:**
```bash
curl -X POST \\
  http://localhost:3333/api/establishments \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT_OWNER_OU_ADMIN>" \\
  -d 
```json
{
    "name": "Café Acessível",
    "description": "Um café com mesas adaptadas e banheiro acessível.",
    "phone": "(11) 98765-4321",
    "category": "CAFE",
    "street": "Rua da Paz",
    "number": "100",
    "neighborhood": "Jardins",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01415-000",
    "latitude": -23.561356,
    "longitude": -46.656596,
    "coverImageUrl": "https://example.com/cafe-acessivel.jpg",
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyGZysgOQ"
}
```

### 2. Listar estabelecimentos (`GET /api/establishments`)

Lista todos os estabelecimentos com filtros opcionais.

**Endpoint:** `GET http://localhost:3333/api/establishments`

**Query Parameters (Opcionais):**
- `page`: Número da página (padrão: 1)
- `limit`: Limite de itens por página (padrão: 10)
- `search`: Termo de busca para nome, descrição ou bairro
- `category`: Filtrar por categoria (RESTAURANT, CAFE, STORE, etc.)
- `city`: Filtrar por cidade
- `state`: Filtrar por estado (ex: SP)
- `minRating`: Filtrar por avaliação mínima (1-5)
- `latitude`, `longitude`, `radius`: Buscar estabelecimentos próximos a uma coordenada (raio em km)

**Exemplo de `curl` (com filtros):**
```bash
curl -X GET \\
  "http://localhost:3333/api/establishments?page=1&limit=5&category=RESTAURANT&city=São Paulo&minRating=4"
```

**Exemplo de `curl` (busca por proximidade):**
```bash
curl -X GET \\
  "http://localhost:3333/api/establishments?latitude=-23.5505&longitude=-46.6333&radius=5&search=restaurante"
```

### 3. Obter estabelecimento por ID (`GET /api/establishments/:id`)

Retorna os dados completos de um estabelecimento, incluindo suas avaliações.

**Endpoint:** `GET http://localhost:3333/api/establishments/:id`

**Exemplo de `curl`:**
```bash
curl -X GET \\
  http://localhost:3333/api/establishments/uuid-do-estabelecimento
```

### 4. Atualizar estabelecimento (`PUT /api/establishments/:id`)

Atualiza os dados de um estabelecimento. **Requer autenticação como `OWNER` (do estabelecimento) ou `ADMIN`**.

**Endpoint:** `PUT http://localhost:3333/api/establishments/:id`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <SEU_TOKEN_JWT_OWNER_OU_ADMIN>
```

**Body (exemplo - campos opcionais):**
```json
{
  "description": "Novo texto de descrição do estabelecimento.",
  "phone": "(11) 12345-6789",
  "category": "STORE"
}
```

**Exemplo de `curl`:**
```bash
curl -X PUT \\
  http://localhost:3333/api/establishments/uuid-do-estabelecimento \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT_OWNER_OU_ADMIN>" \\
  -d 
```json
{
    "description": "Novo texto de descrição do estabelecimento.",
    "phone": "(11) 12345-6789",
    "category": "STORE"
}
```

### 5. Deletar estabelecimento (`DELETE /api/establishments/:id`)

Remove um estabelecimento do sistema. **Requer autenticação como `OWNER` (do estabelecimento) ou `ADMIN`**.

**Endpoint:** `DELETE http://localhost:3333/api/establishments/:id`

**Headers:**
```
Authorization: Bearer <SEU_TOKEN_JWT_OWNER_OU_ADMIN>
```

**Exemplo de `curl`:**
```bash
curl -X DELETE \\
  http://localhost:3333/api/establishments/uuid-do-estabelecimento \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT_OWNER_OU_ADMIN>"
```

### 6. Obter estabelecimentos do usuário logado (`GET /api/establishments/my/establishments`)

Lista os estabelecimentos que pertencem ao usuário logado. **Requer autenticação como `OWNER`**.

**Endpoint:** `GET http://localhost:3333/api/establishments/my/establishments`

**Headers:**
```
Authorization: Bearer <SEU_TOKEN_JWT_OWNER>
```

**Query Parameters (Opcionais):**
- `page`: Número da página (padrão: 1)
- `limit`: Limite de itens por página (padrão: 10)

**Exemplo de `curl`:**
```bash
curl -X GET \\
  "http://localhost:3333/api/establishments/my/establishments?page=1&limit=5" \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT_OWNER>"
```




---

## ⭐ Rotas de Avaliação (`/api/reviews`)

### 1. Criar nova avaliação (`POST /api/reviews`)

Cria uma nova avaliação para um estabelecimento. **Requer autenticação**.

**Endpoint:** `POST http://localhost:3333/api/reviews`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <SEU_TOKEN_JWT>
```

**Body:**
```json
{
  "establishmentId": "uuid-do-estabelecimento",
  "title": "Ótima experiência!",
  "rating": 5,
  "comment": "O local é muito acessível e o atendimento foi excelente."
}
```

**Exemplo de `curl`:**
```bash
curl -X POST \\
  http://localhost:3333/api/reviews \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT>" \\
  -d 
```json
{
    "establishmentId": "uuid-do-estabelecimento",
    "title": "Ótima experiência!",
    "rating": 5,
    "comment": "O local é muito acessível e o atendimento foi excelente."
}
```

### 2. Listar avaliações (`GET /api/reviews`)

Lista avaliações com filtros opcionais.

**Endpoint:** `GET http://localhost:3333/api/reviews`

**Query Parameters (Opcionais):**
- `page`: Número da página (padrão: 1)
- `limit`: Limite de itens por página (padrão: 10)
- `establishmentId`: Filtrar por ID do estabelecimento
- `userId`: Filtrar por ID do usuário que fez a avaliação
- `minRating`: Filtrar por avaliação mínima (1-5)
- `maxRating`: Filtrar por avaliação máxima (1-5)

**Exemplo de `curl` (com filtros):**
```bash
curl -X GET \\
  "http://localhost:3333/api/reviews?establishmentId=uuid-do-estabelecimento&minRating=4"
```

### 3. Obter avaliação por ID (`GET /api/reviews/:id`)

Retorna os dados de uma avaliação específica.

**Endpoint:** `GET http://localhost:3333/api/reviews/:id`

**Exemplo de `curl`:**
```bash
curl -X GET \\
  http://localhost:3333/api/reviews/uuid-da-avaliacao
```

### 4. Atualizar avaliação (`PUT /api/reviews/:id`)

Atualiza uma avaliação. **Requer autenticação como o autor da avaliação ou `ADMIN`**.

**Endpoint:** `PUT http://localhost:3333/api/reviews/:id`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <SEU_TOKEN_JWT>
```

**Body (exemplo - campos opcionais):**
```json
{
  "title": "Experiência excelente e melhorada!",
  "rating": 5,
  "comment": "Atualizei minha avaliação após uma nova visita. O local continua impecável."
}
```

**Exemplo de `curl`:**
```bash
curl -X PUT \\
  http://localhost:3333/api/reviews/uuid-da-avaliacao \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT>" \\
  -d 
```json
{
    "title": "Experiência excelente e melhorada!",
    "rating": 5,
    "comment": "Atualizei minha avaliação após uma nova visita. O local continua impecável."
}
```

### 5. Deletar avaliação (`DELETE /api/reviews/:id`)

Remove uma avaliação. **Requer autenticação como o autor da avaliação ou `ADMIN`**.

**Endpoint:** `DELETE http://localhost:3333/api/reviews/:id`

**Headers:**
```
Authorization: Bearer <SEU_TOKEN_JWT>
```

**Exemplo de `curl`:**
```bash
curl -X DELETE \\
  http://localhost:3333/api/reviews/uuid-da-avaliacao \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT>"
```

### 6. Obter estatísticas de avaliações de um estabelecimento (`GET /api/reviews/establishment/:establishmentId/stats`)

Retorna estatísticas das avaliações de um estabelecimento específico.

**Endpoint:** `GET http://localhost:3333/api/reviews/establishment/:establishmentId/stats`

**Exemplo de `curl`:**
```bash
curl -X GET \\
  http://localhost:3333/api/reviews/establishment/uuid-do-estabelecimento/stats
```

### 7. Obter avaliações do usuário logado (`GET /api/reviews/my/reviews`)

Lista as avaliações feitas pelo usuário logado. **Requer autenticação**.

**Endpoint:** `GET http://localhost:3333/api/reviews/my/reviews`

**Headers:**
```
Authorization: Bearer <SEU_TOKEN_JWT>
```

**Query Parameters (Opcionais):**
- `page`: Número da página (padrão: 1)
- `limit`: Limite de itens por página (padrão: 10)

**Exemplo de `curl`:**
```bash
curl -X GET \\
  "http://localhost:3333/api/reviews/my/reviews?page=1&limit=5" \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT>"
```




---

## 🗺️ Rotas do Google Places (`/api/places`)

### 1. Buscar estabelecimentos próximos (`GET /api/places/search-nearby`)

Busca estabelecimentos próximos a uma coordenada usando a API do Google Places.

**Endpoint:** `GET http://localhost:3333/api/places/search-nearby`

**Query Parameters (Obrigatórios):**
- `lat`: Latitude para o centro da busca
- `lng`: Longitude para o centro da busca
- `radius`: Raio de busca em metros (padrão: 1500)
- `keyword`: Termo de busca (ex: "restaurante", "farmácia")
- `type`: Tipo de estabelecimento (ex: restaurant, hospital, store) - Opcional

**Exemplo de `curl`:**
```bash
curl -X GET \\
  "http://localhost:3333/api/places/search-nearby?lat=-23.5505&lng=-46.6333&radius=5000&keyword=restaurante&type=restaurant"
```

### 2. Obter detalhes do estabelecimento (`GET /api/places/details/:placeId`)

Obtém detalhes completos de um estabelecimento pelo Place ID do Google.

**Endpoint:** `GET http://localhost:3333/api/places/details/:placeId`

**Exemplo de `curl`:**
```bash
curl -X GET \\
  http://localhost:3333/api/places/details/ChIJN1t_tDeuEmsRUsoyGZysgOQ
```

### 3. Geocoding - converter endereço em coordenadas (`GET /api/places/geocode`)

Converte um endereço textual em coordenadas geográficas.

**Endpoint:** `GET http://localhost:3333/api/places/geocode`

**Query Parameters (Obrigatório):**
- `address`: Endereço para converter (ex: "Avenida Paulista, 1000, São Paulo")

**Exemplo de `curl`:**
```bash
curl -X GET \\
  "http://localhost:3333/api/places/geocode?address=Avenida Paulista, 1000, São Paulo"
```

### 4. Reverse Geocoding - converter coordenadas em endereço (`GET /api/places/reverse-geocode`)

Converte coordenadas geográficas em um endereço textual.

**Endpoint:** `GET http://localhost:3333/api/places/reverse-geocode`

**Query Parameters (Obrigatórios):**
- `lat`: Latitude
- `lng`: Longitude

**Exemplo de `curl`:**
```bash
curl -X GET \\
  "http://localhost:3333/api/places/reverse-geocode?lat=-23.5505&lng=-46.6333"
```

### 5. Calcular distância entre dois pontos (`GET /api/places/distance`)

Calcula a distância em quilômetros entre duas coordenadas geográficas.

**Endpoint:** `GET http://localhost:3333/api/places/distance`

**Query Parameters (Obrigatórios):**
- `lat1`: Latitude do primeiro ponto
- `lng1`: Longitude do primeiro ponto
- `lat2`: Latitude do segundo ponto
- `lng2`: Longitude do segundo ponto

**Exemplo de `curl`:**
```bash
curl -X GET \\
  "http://localhost:3333/api/places/distance?lat1=-23.5505&lng1=-46.6333&lat2=-23.5613&lng2=-46.6565"
```

### 6. Obter URL de foto do Google Places (`GET /api/places/photo/:photoReference`)

Gera uma URL para acessar uma foto de um estabelecimento do Google Places, usando uma referência de foto.

**Endpoint:** `GET http://localhost:3333/api/places/photo/:photoReference`

**Query Parameters (Opcional):**
- `maxWidth`: Largura máxima da imagem (padrão: 400)

**Exemplo de `curl`:**
```bash
curl -X GET \\
  "http://localhost:3333/api/places/photo/CmRaAAAA_..." # Substitua por uma photoReference válida
```



