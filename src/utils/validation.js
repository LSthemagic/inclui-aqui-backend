import { z } from 'zod';

// Schemas de validação comuns
export const idSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

// Validação de email
export const emailSchema = z.string().email('Email deve ter um formato válido');

// Validação de senha
export const passwordSchema = z.string()
  .min(6, 'Senha deve ter pelo menos 6 caracteres')
  .max(100, 'Senha deve ter no máximo 100 caracteres');

// Validação de telefone brasileiro
export const phoneSchema = z.string()
  .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX');

// Validação de CEP brasileiro
export const zipCodeSchema = z.string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato XXXXX-XXX');

// Validação de rating
export const ratingSchema = z.number().int().min(1).max(5);

// Função para validar se uma string é um UUID válido
export const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Função para sanitizar strings
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/\s+/g, ' ');
};

// Função para validar coordenadas
export const isValidCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

