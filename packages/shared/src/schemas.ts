import { z } from "zod";

/**
 * Standard Phone Schema:
 * Valid Indian 10-digit mobile starting with digits 6-9
 */
export const PhoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian mobile number starting with 6-9");

/**
 * Login OTP Schema: 6 numeric digits (DEC-13)
 */
export const LoginOtpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Login OTP must be exactly 6 digits");

/**
 * Ride-start OTP Schema: 4 numeric digits (DEC-13)
 */
export const RideStartOtpSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "Ride start OTP must be exactly 4 digits");

/**
 * Unified API Error Envelope
 */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.record(z.string(), z.array(z.string())).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Auth Requests & Responses
 */
export const SendOtpRequestSchema = z.object({
  phone: PhoneSchema,
  role: z.enum(["passenger", "driver"]).default("passenger"),
});

export const VerifyOtpRequestSchema = z.object({
  phone: PhoneSchema,
  otp: LoginOtpSchema,
  role: z.enum(["passenger", "driver"]).default("passenger"),
});

export const AdminLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});

export const AdminMfaRequestSchema = z.object({
  email: z.string().email(),
  totpCode: z.string().regex(/^\d{6}$/, "TOTP code must be 6 digits"),
});

/**
 * Quote Request & Booking Schemas
 */
export const QuoteRequestSchema = z.object({
  pickup: z.object({
    label: z.string().min(1),
    sublabel: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    placeId: z.string().optional(),
  }),
  drop: z.object({
    label: z.string().min(1),
    sublabel: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    placeId: z.string().optional(),
  }),
  vehicleClass: z.enum(["hatchback", "sedan", "suv", "innova", "tempo"]),
  mode: z.enum(["one_way", "round_trip", "local"]),
  scheduledAt: z.string().datetime().optional(),
});

export const CreateBookingRequestSchema = z.object({
  quoteId: z.string().min(1),
  paymentOption: z.enum(["deposit", "full"]),
  idempotencyKey: z.string().min(1),
});
