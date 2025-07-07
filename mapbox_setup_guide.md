# Guia de Configuração do Mapbox para o Projeto IncluiAqui

Este guia detalha como configurar o Mapbox para substituir o Google Maps no backend do projeto IncluiAqui.

## 1. Criando uma Conta e Obtendo o Access Token

### 1.1. Criar Conta no Mapbox

1. Acesse [mapbox.com](https://www.mapbox.com/)
2. Clique em "Sign up" para criar uma conta gratuita
3. Preencha os dados solicitados (email, senha, etc.)
4. Confirme seu email

### 1.2. Obter o Access Token

1. Após fazer login, acesse sua [página de conta](https://account.mapbox.com/)
2. Na seção "Access tokens", você verá um token padrão já criado
3. Copie o token padrão ou crie um novo token específico para o projeto:
   - Clique em "Create a token"
   - Dê um nome descritivo (ex: "IncluiAqui Backend")
   - Mantenha os escopos padrão selecionados
   - Clique em "Create token"

### 1.3. Configurar no Projeto

Edite o arquivo `.env` do seu projeto e substitua a linha do Google Maps:

```env
# Substitua esta linha:
# GOOGLE_MAPS_API_KEY="your-google-maps-api-key-here"

# Por esta:
MAPBOX_ACCESS_TOKEN="seu-access-token-aqui"
```

## 2. APIs do Mapbox Utilizadas

O projeto IncluiAqui utilizará as seguintes APIs do Mapbox:

### 2.1. Geocoding API
- **Forward Geocoding**: Converte endereços em coordenadas
- **Reverse Geocoding**: Converte coordenadas em endereços
- **Endpoint**: `https://api.mapbox.com/geocoding/v5/mapbox.places/`

### 2.2. Search Box API (para busca de locais)
- **Suggest**: Fornece sugestões de busca
- **Retrieve**: Obtém detalhes completos de um local
- **Endpoint**: `https://api.mapbox.com/search/searchbox/v1/`

## 3. Limites do Plano Gratuito

O plano gratuito do Mapbox inclui:
- **50.000 requisições de geocoding por mês**
- **50.000 requisições de search por mês**
- **50.000 map loads por mês**

Isso é suficiente para desenvolvimento e projetos pequenos/médios.

## 4. Próximos Passos

Agora vamos adaptar o código do `googleMapsService.js` para usar as APIs do Mapbox.

