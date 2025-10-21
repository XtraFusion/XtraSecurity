import { z } from "zod"

// Login form schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Profile form schema
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  location: z.string().optional(),
  timezone: z.string(),
  company: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  phone: z.string().optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// Project security settings schema
export const projectSecuritySettingsSchema = z.object({
  accessLevel: z.enum(['private', 'team', 'public'], {
    required_error: "Please select an access level",
  }),
  securityLevel: z.enum(['low', 'medium', 'high'], {
    required_error: "Please select a security level",
  }),
  twoFactorRequired: z.boolean().default(false),
  passwordMinLength: z.number().min(8).max(128).default(8),
  passwordRequireSpecialChars: z.boolean().default(false),
  passwordRequireNumbers: z.boolean().default(false),
  passwordExpiryDays: z.number().min(0).max(365).default(90),
  ipRestrictions: z.array(z.object({
    ip: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, "Please enter a valid IP address"),
    description: z.string().max(100, "Description must be less than 100 characters").optional()
  })).default([])
})

export type ProjectSecuritySettingsData = z.infer<typeof projectSecuritySettingsSchema>

// Team invitation form schema
export const teamInviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["viewer", "developer", "admin"], {
    required_error: "Please select a role",
  }),
  department: z.string().optional(),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
})

export type TeamInviteFormData = z.infer<typeof teamInviteSchema>

// Password change form schema
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>

// API key creation form schema
export const apiKeySchema = z.object({
  name: z.string().min(1, "API key name is required").max(50, "Name must be less than 50 characters"),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
  expiresIn: z.enum(["never", "30", "90", "365"]),
})

export type ApiKeyFormData = z.infer<typeof apiKeySchema>

// Secret form schema
export const secretSchema = z.object({
  key: z
    .string()
    .min(1, "Secret key is required")
    .regex(/^[A-Z_][A-Z0-9_]*$/, "Key must be uppercase letters, numbers, and underscores only"),
  value: z.string().min(1, "Secret value is required"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
  environment: z.enum(["development", "staging", "production"]),
})

export type SecretFormData = z.infer<typeof secretSchema>
