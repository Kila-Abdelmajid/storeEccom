// lib/auth.ts
'use server';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type Session = {
  userId: number;
  role: 'admin' | 'user';
};

const secretKey = process.env.JWT_SECRET || 'your-secret-key';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: Session) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return {
      userId: payload.userId as number,
      role: payload.role as 'admin' | 'user',
    };
  } catch {
    return null;
  }
}

export async function createSession(payload: Session) {
  const token = await encrypt(payload);
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return await decrypt(token);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}