'use server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// lib/auth.ts
export type Session = {
  [x: string]: any;
  userId: number;
  role: 'admin' | 'user';
};

const secretKey = process.env.JWT_SECRET || 'your-secret-key';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await decrypt(token);
  if (!payload || typeof payload.userId !== 'number') return null;
  return { userId: payload.userId, role: payload.role };
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session'); // كيمسح الـ cookie اللي سميتو session
  redirect('/login'); // بعد ما يمسح الـ cookie، يوجه المستخدم لصفحة تسجيل الدخول
}
