# Exemplos de Uso das Rotas com Mapbox

Agora que o backend foi migrado para usar o Mapbox, aqui estão exemplos de como testar as novas funcionalidades.

## 🔧 Configuração Inicial

1. **Obtenha seu Access Token do Mapbox:**
   - Acesse [mapbox.com](https://www.mapbox.com/)
   - Crie uma conta gratuita
   - Vá para [account.mapbox.com](https://account.mapbox.com/)
   - Copie seu token padrão ou crie um novo

2. **Configure no projeto:**
   ```bash
   # Edite o arquivo .env
   MAPBOX_ACCESS_TOKEN="pk.eyJ1IjoiU0VVX1VTVUFSSU8iLCJhIjoiY2xrZGZnaDU2MDA..."
   ```

## 📍 Exemplos de Requisições

### 1. Buscar Estabelecimentos Próximos

```bash
curl -X GET \
  "http://localhost:3333/api/places/search-nearby?lat=-23.5505&lng=-46.6333&radius=5000&keyword=restaurante"
```

### 2. Geocoding (Endereço → Coordenadas)

```bash
curl -X GET \
  "http://localhost:3333/api/places/geocode?address=Avenida Paulista, 1000, São Paulo"
```

### 3. Reverse Geocoding (Coordenadas → Endereço)

```bash
curl -X GET \
  "http://localhost:3333/api/places/reverse-geocode?lat=-23.5505&lng=-46.6333"
```

### 4. Calcular Distância

```bash
curl -X GET \
  "http://localhost:3333/api/places/distance?lat1=-23.5505&lng1=-46.6333&lat2=-23.5613&lng2=-46.6565"
```

### 5. Buscar Sugestões (Autocomplete)

```bash
curl -X GET \
  "http://localhost:3333/api/places/suggestions?q=shopping&lat=-23.5505&lng=-46.6333"
```

### 6. Obter URL de Mapa Estático

```bash
curl -X GET \
  "http://localhost:3333/api/places/static-map?lat=-23.5505&lng=-46.6333&zoom=15&width=400&height=300"
```

### 7. Obter Detalhes de um Local

```bash
curl -X GET \
  "http://localhost:3333/api/places/details/MAPBOX_ID_AQUI"
```

## 🔄 Principais Mudanças

### Antes (Google Maps):
- `googlePlaceId` → Agora é `mapboxId`
- `photos` com `photoReference` → Não disponível no Mapbox (use mapas estáticos)
- Endpoint `/photo/:photoReference` → Substituído por `/static-map`

### Agora (Mapbox):
- ✅ Busca de locais mais rápida
- ✅ Geocoding preciso
- ✅ Sugestões para autocomplete
- ✅ Mapas estáticos personalizáveis
- ✅ 50.000 requisições gratuitas por mês

## 🎯 Benefícios da Migração

1. **Sem necessidade de conta de faturamento** para começar
2. **50.000 requisições gratuitas** por mês
3. **APIs mais modernas** e bem documentadas
4. **Melhor performance** em muitos casos
5. **Mapas personalizáveis** com estilos únicos

## 📚 Documentação

- **Swagger/OpenAPI**: `http://localhost:3333/docs`
- **Mapbox Docs**: [docs.mapbox.com](https://docs.mapbox.com/)
- **Search API**: [docs.mapbox.com/api/search/](https://docs.mapbox.com/api/search/)
- **Geocoding API**: [docs.mapbox.com/api/search/geocoding/](https://docs.mapbox.com/api/search/geocoding/)

