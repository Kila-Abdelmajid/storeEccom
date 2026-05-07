import { NextResponse } from 'next/server';
import { generateRegistrationOptions, type AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await sql`SELECT email, firstname, lastname FROM users WHERE userid = ${session.userId}`;
  if (!user.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const userIdBuffer = new TextEncoder().encode(session.userId.toString());
  const userName = user[0].email;
  const displayName = `${user[0].firstname} ${user[0].lastname}`;

  const existingCredentials = await sql`SELECT credentialid FROM passkeys WHERE userid = ${session.userId}`;
  const excludeCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = existingCredentials.map(c => ({
    id: c.credentialid,
    transports: ['internal', 'hybrid'],
  }));

  const rpID = process.env.NODE_ENV === 'production'
    ? new URL(process.env.NEXT_PUBLIC_BASE_URL || '').hostname
    : 'localhost';

  const options = await generateRegistrationOptions({
    rpName: 'ABDO STORE',
    rpID,
    userID: userIdBuffer,
    userName,
    userDisplayName: displayName,
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'discouraged', // ✅ key change
    },
  });

  const cookieStore = await import('next/headers').then(m => m.cookies());
  cookieStore.set('webauthn_challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5,
  });

  return NextResponse.json(options);
}