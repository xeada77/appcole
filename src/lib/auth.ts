'use server';

import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from './db';
import { verifyPassword, SESSION_COOKIE_NAME, SESSION_MAX_AGE, UserSession } from './auth-crypto';

/**
 * Crea unha nova sesión segura para o usuario e gárdaa en SQLite e na cookie HTTP-only.
 */
export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(sessionId, userId, expiresAt);

  // Detectar se a petición procede dunha conexión HTTPS (ex: Cloudflare Tunnel)
  let isHttps = false;
  try {
    const headerStore = await headers();
    const proto = headerStore.get('x-forwarded-proto');
    const referer = headerStore.get('referer');
    isHttps = proto === 'https' || (referer ? referer.startsWith('https://') : false);
  } catch {
    isHttps = false;
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return sessionId;
}

/**
 * Obtén o usuario actual a partir da sesión activa.
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionId) return null;

    const db = getDb();
    const now = new Date().toISOString();

    const row = db.prepare(`
      SELECT u.id, u.email, u.name, s.expires_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(sessionId) as { id: string; email: string; name: string | null; expires_at: string } | undefined;

    if (!row) {
      return null;
    }

    if (row.expires_at < now) {
      // Sesión expirada: limpar
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      name: row.name,
    };
  } catch (err) {
    console.error('Erro ao verificar sesión actual:', err);
    return null;
  }
}

/**
 * Server Action para validar as credenciais do usuario e iniciar sesión.
 */
export async function loginAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = (formData.get('password') as string) || '';

  if (!email || !password) {
    return { error: 'Por favor, introduce o correo electrónico e o contrasinal.' };
  }

  try {
    const db = getDb();
    const user = db.prepare(`
      SELECT id, email, password_hash, salt, name
      FROM users
      WHERE email = ? COLLATE NOCASE
    `).get(email) as { id: string; email: string; password_hash: string; salt: string; name: string | null } | undefined;

    if (!user) {
      return { error: 'Credenciais incorrectas. Comproba o usuario e o contrasinal.' };
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return { error: 'Credenciais incorrectas. Comproba o usuario e o contrasinal.' };
    }

    await createSession(user.id);
  } catch (err) {
    console.error('Erro durante o inicio de sesión:', err);
    return { error: 'Ocorreu un erro inesperado no servidor. Téntao de novo.' };
  }

  redirect('/');
}

/**
 * Server Action para pechar a sesión do usuario.
 */
export async function logoutAction(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionId) {
      const db = getDb();
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
      cookieStore.delete(SESSION_COOKIE_NAME);
    }
  } catch (err) {
    console.error('Erro ao pechar sesión:', err);
  }

  redirect('/login');
}
