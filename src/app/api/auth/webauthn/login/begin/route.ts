// app/api/auth/webauthn/login/begin/route.ts
import { NextResponse } from 'next/server';
import { generateAuthenticationOptions, type AuthenticatorTransportFuture } from '@simplewebauthn/server';
import sql from '@/lib/db';

export async function POST(req: Request) {
  const { email } = await req.json();

  const user = await sql`SELECT userid FROM users WHERE email = ${email}`;
  if (!user.length) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userId = user[0].userid;
  const passkeys = await sql`SELECT credentialid FROM passkeys WHERE userid = ${userId}`;
  const allowCredentials: { id: string; type: 'public-key'; transports?: AuthenticatorTransportFuture[] }[] = passkeys.map(k => ({
    id: k.credentialid,
    type: 'public-key',
    transports: ['internal', 'hybrid'],
  }));

  const rpID = process.env.NODE_ENV === 'production'
    ? new URL(process.env.NEXT_PUBLIC_BASE_URL || '').hostname
    : 'localhost';

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred',
  });

  const cookieStore = await import('next/headers').then(m => m.cookies());
  cookieStore.set('webauthn_login_challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5,
  });
  cookieStore.set('webauthn_userId', userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5,
  });

  return NextResponse.json(options);
}