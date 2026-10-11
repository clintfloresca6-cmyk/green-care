import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(200),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(200).optional(),
  location: z.string().optional(),
  photo_url: z.string().optional(),
  photo: z.string().max(15_000_000).optional(),
})