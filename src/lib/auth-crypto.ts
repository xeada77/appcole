import crypto from 'node:crypto';

export const SESSION_COOKIE_NAME = 'appcole_session';
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 días en segundos

export interface UserSession {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Xera un hash seguro para o contrasinal usando scrypt con salt aleatorio.
 */
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

/**
 * Verifica se un contrasinal coincide co hash gardado usando comparación en tempo constante.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}
