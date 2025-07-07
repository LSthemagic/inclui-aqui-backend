import { z } from 'zod';

const UserRole = z.enum(['USER', 'OWNER', 'ADMIN']);
const UserStatus = z.enum(['ACTIVE', 'PENDING_VERIFICATION', 'BANNED']);

export const createUserSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: z.string({ required_error: 'Email é obrigatório' })
    .email('Forneça um formato de email válido')
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
  role: UserRole.optional().default('USER')
});

export const loginSchema = z.object({
  email: z.string()
    .email('Email deve ter um formato válido')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Senha é obrigatória')
});

export const updateUserSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  avatarUrl: z.string().url('URL do avatar deve ser válida').nullable().optional(),
  role: UserRole.optional(),
  status: UserStatus.optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .max(100, 'Nova senha deve ter no máximo 100 caracteres')
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: UserRole,
  status: UserStatus,
  avatarUrl: z.string().url().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const userListResponseSchema = z.object({
  users: z.array(userResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

export const tokenResponseSchema = z.object({
  token: z.string(),
  user: userResponseSchema
});

