import { z } from 'zod';
import { coordinatesSchema, phoneSchema, zipCodeSchema } from '../../utils/validation.js';

const EstablishmentCategory = z.enum([
  'RESTAURANT', 
  'CAFE', 
  'STORE', 
  'HOTEL', 
  'SERVICE', 
  'LEISURE', 
  'HEALTH', 
  'OTHER'
]);

const establishmentCore = {
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres')
    .trim(),
  description: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .trim()
    .optional(),
  phone: z.string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .trim()
    .optional(),
  category: EstablishmentCategory.default('OTHER'),
  street: z.string()
    .max(200, 'Rua deve ter no máximo 200 caracteres')
    .trim()
    .optional(),
  number: z.string()
    .max(20, 'Número deve ter no máximo 20 caracteres')
    .trim()
    .optional(),
  neighborhood: z.string()
    .max(100, 'Bairro deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  city: z.string()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .trim(),
  state: z.string()
    .length(2, 'Estado deve ter exatamente 2 caracteres')
    .toUpperCase(),
  zipCode: z.string()
    .max(10, 'CEP deve ter no máximo 10 caracteres')
    .trim()
    .optional(),
  latitude: z.number()
    .min(-90, 'Latitude deve estar entre -90 e 90')
    .max(90, 'Latitude deve estar entre -90 e 90'),
  longitude: z.number()
    .min(-180, 'Longitude deve estar entre -180 e 180')
    .max(180, 'Longitude deve estar entre -180 e 180'),
  coverImageUrl: z.string()
    .url('URL da imagem deve ser válida')
    .optional(),
  googlePlaceId: z.string()
    .max(100, 'Google Place ID deve ter no máximo 100 caracteres')
    .optional(),
};

export const createEstablishmentSchema = z.object({
  ...establishmentCore,
});

export const updateEstablishmentSchema = z.object({
  name: establishmentCore.name.optional(),
  description: establishmentCore.description,
  phone: establishmentCore.phone,
  category: establishmentCore.category.optional(),
  street: establishmentCore.street,
  number: establishmentCore.number,
  neighborhood: establishmentCore.neighborhood,
  city: establishmentCore.city.optional(),
  state: establishmentCore.state.optional(),
  zipCode: establishmentCore.zipCode,
  latitude: establishmentCore.latitude.optional(),
  longitude: establishmentCore.longitude.optional(),
  coverImageUrl: establishmentCore.coverImageUrl,
  googlePlaceId: establishmentCore.googlePlaceId,
});

export const establishmentResponseSchema = z.object({
  id: z.string().uuid(),
  ...establishmentCore,
  accessibilityScore: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  ownerId: z.string().uuid(),
  owner: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email()
  }).optional(),
  reviews: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().nullable(),
    comment: z.string().nullable(),
    rating: z.number().int().min(1).max(5),
    createdAt: z.date(),
    owner: z.object({
      id: z.string().uuid(),
      name: z.string()
    })
  })).optional(),
  _count: z.object({
    reviews: z.number()
  }).optional()
});

export const establishmentListResponseSchema = z.object({
  establishments: z.array(establishmentResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

export const establishmentSearchSchema = z.object({
  search: z.string().optional(),
  category: EstablishmentCategory.optional(),
  city: z.string().optional(),
  state: z.string().length(2).toUpperCase().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(0.1).max(50).default(10).optional() // em km
});

