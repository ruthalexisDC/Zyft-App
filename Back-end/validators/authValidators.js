import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters"),
  }),

  params: z.object({}),

  query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),

    password: z
      .string()
      .min(1, "Password is required")
      .max(128, "Password cannot exceed 128 characters"),
  }),

  params: z.object({}),

  query: z.object({}),
});

export const exchangeSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .min(1, "Code is required"),
  }),

  params: z.object({}),

  query: z.object({}),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
  }),

  params: z.object({}),

  query: z.object({}),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string()
      .trim()
      .min(1, "Reset token is required"),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters"),
  }),

  params: z.object({}),

  query: z.object({}),
});

// POST /auth/verify-email (SEND the verification email) carries no payload —
// the user is identified by the access token. It previously reused
// verifyEmailSchema, which demands body.token, so every request got a 400.
export const sendVerifyEmailSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({}),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z
      .string()
      .trim()
      .min(1, "Verification token is required"),
  }),

  params: z.object({}),

  query: z.object({}),
});