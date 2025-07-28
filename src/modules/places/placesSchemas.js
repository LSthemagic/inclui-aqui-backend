import { z } from 'zod';

export const searchNearbyQuerySchema = z.object({
  lat: z.coerce.number()
    .min(-90, 'Latitude deve estar entre -90 e 90')
    .max(90, 'Latitude deve estar entre -90 e 90')
    .describe('Latitude para o centro da busca'),
  lng: z.coerce.number()
    .min(-180, 'Longitude deve estar entre -180 e 180')
    .max(180, 'Longitude deve estar entre -180 e 180')
    .describe('Longitude para o centro da busca'),
  radius: z.coerce.number()
    .int()
    .positive('Raio deve ser um número positivo')
    .max(50000, 'Raio máximo é 50km')
    .default(1500)
    .describe('Raio de busca em metros'),
  keyword: z.string()
    .min(2, 'Palavra-chave deve ter pelo menos 2 caracteres')
    .max(100, 'Palavra-chave deve ter no máximo 100 caracteres')
    .describe('Termo de busca, ex: "restaurante", "farmácia"'),
  type: z.string()
    .optional()
    .describe('Tipo de estabelecimento (ex: restaurant, hospital, store)')
});

export const geocodeQuerySchema = z.object({
  address: z.string()
    .min(5, 'Endereço deve ter pelo menos 5 caracteres')
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .describe('Endereço para converter em coordenadas')
});

export const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number()
    .min(-90, 'Latitude deve estar entre -90 e 90')
    .max(90, 'Latitude deve estar entre -90 e 90'),
  lng: z.coerce.number()
    .min(-180, 'Longitude deve estar entre -180 e 180')
    .max(180, 'Longitude deve estar entre -180 e 180')
});

export const placeDetailsParamsSchema = z.object({
  placeId: z.string()
    .min(1, 'Place ID é obrigatório')
    .describe('ID único do Google Places')
});

export const placeResponseSchema = z.object({
  placeId: z.string().describe('Identificador único do Google Places'),
  name: z.string().describe('Nome oficial do estabelecimento'),
  address: z.string().describe('Endereço do estabelecimento'),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).describe('Coordenadas geográficas'),
  rating: z.number().optional().describe('Avaliação agregada do Google'),
  userRatingsTotal: z.number().optional().describe('Total de avaliações no Google'),
  types: z.array(z.string()).optional().describe('Tipos de estabelecimento'),
  priceLevel: z.number().optional().describe('Nível de preço (0-4)'),
  photos: z.array(z.object({
    photoReference: z.string(),
    width: z.number(),
    height: z.number()
  })).optional().describe('Fotos do estabelecimento')
});

export const placeDetailsResponseSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  address: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  rating: z.number().optional(),
  userRatingsTotal: z.number().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  openingHours: z.object({
    openNow: z.boolean(),
    weekdayText: z.array(z.string())
  }).nullable().optional(),
  photos: z.array(z.object({
    photoReference: z.string(),
    width: z.number(),
    height: z.number()
  })).optional(),
  types: z.array(z.string()).optional(),
  priceLevel: z.number().optional(),
  accessibility: z.object({
    entrance: z.boolean().optional().describe('Entrada acessível para cadeirantes'),
    restroom: z.boolean().optional().describe('Entrada acessível para cadeirantes'),
    seating: z.boolean().optional().describe('Entrada acessível para cadeirantes'),
    parking: z.boolean().optional().describe('Entrada acessível para cadeirantes'),  }).optional().describe('Recursos de acessibilidade do estabelecimento')

});

export const geocodeResponseSchema = z.object({
  formattedAddress: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  placeId: z.string(),
  addressComponents: z.array(z.object({
    longName: z.string(),
    shortName: z.string(),
    types: z.array(z.string())
  }))
});

