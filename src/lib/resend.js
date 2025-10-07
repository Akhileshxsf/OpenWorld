import { Resend } from 'resend';

// Resend client (use VITE_RESEND_API_KEY for client-side, but prefer server-side for security)
export const resendClient = new Resend(import.meta.env.VITE_RESEND_API_KEY);

// Sender config from env (fallback to defaults if not set)
export const sender = {
  name: import.meta.env.VITE_EMAIL_NAME || 'OpenWorld',
  email: import.meta.env.VITE_EMAIL_FROM || 'noreply@openworldtradetime.com',
};