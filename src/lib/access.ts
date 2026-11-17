import { User } from 'firebase/auth';

export const ADMIN_EMAIL = 'adiofem.99@gmail.com';

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function isAdminUser(user?: User | null): boolean {
  if (!user) return false;
  return Boolean(user.emailVerified && isAdminEmail(user.email));
}
