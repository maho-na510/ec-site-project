import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Password validation schema
 * Minimum 8 characters, at least one letter and one number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Admin password validation schema
 * Stronger requirements: min 12 characters, letter, number, special char
 */
export const adminPasswordSchema = z
  .string()
  .min(12, 'Admin password must be at least 12 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Phone number validation (US format)
 */
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\(\)]+$/, 'Invalid phone number format')
  .min(10, 'Phone number must be at least 10 digits');

/**
 * Postal code validation (US format)
 */
export const postalCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code format (e.g., 12345 or 12345-6789)');

/**
 * Product price validation
 */
export const priceSchema = z
  .number()
  .positive('Price must be positive')
  .max(999999, 'Price is too large');

/**
 * Stock quantity validation
 */
export const stockSchema = z
  .number()
  .int('Stock must be a whole number')
  .min(0, 'Stock cannot be negative');

/**
 * Login form validation schema
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

/**
 * User registration form validation schema
 */
export const registerFormSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    passwordConfirmation: z.string(),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().min(2, 'State is required'),
    postalCode: postalCodeSchema,
    phoneNumber: phoneSchema,
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords do not match',
    path: ['passwordConfirmation'],
  });

/**
 * Product form validation schema
 */
export const productFormSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: priceSchema,
  categoryId: z.number().positive('Category is required'),
  initialStock: stockSchema,
  isActive: z.boolean().default(true),
});

/**
 * Checkout form validation schema
 */
export const checkoutFormSchema = z.object({
  shippingAddress: z.string().min(5, 'Address must be at least 5 characters'),
  shippingCity: z.string().min(2, 'City must be at least 2 characters'),
  shippingState: z.string().min(2, 'State is required'),
  shippingPostalCode: postalCodeSchema,
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal']),
});
