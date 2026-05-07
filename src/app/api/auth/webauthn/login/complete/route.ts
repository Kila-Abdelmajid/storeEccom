import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import sql from '@/lib/db';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json();
  const { assertion } = body;

  const cookieStore = await cookies();
  const challengeCookie = cookieStore.get('webauthn_login_challenge');
  const userIdCookie = cookieStore.get('webauthn_userId');
  if (!challengeCookie || !userIdCookie) {
    return NextResponse.json({ error: 'No challenge found' }, { status: 400 });
  }

  const expectedChallenge = challengeCookie.value;
  const userId = parseInt(userIdCookie.value);
  const credentialIdBase64 = assertion.id;

  const passkey = await sql`SELECT * FROM passkeys WHERE userid = ${userId} AND credentialid = ${credentialIdBase64}`;
  if (!passkey.length) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 400 });
  }
  const credential = passkey[0];

  let verification;
  try {
    // حل المشكلة: استخدام as any لتجاوز التحقق الصارم للـ TypeScript
    verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge,
      expectedOrigin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      expectedRPID: process.env.NODE_ENV === 'production' 
        ? new URL(process.env.NEXT_PUBLIC_BASE_URL || '').hostname 
        : 'localhost',
      authenticator: {
        credentialPublicKey: Buffer.from(credential.publickey, 'base64'),
        credentialID: Buffer.from(credential.credentialid, 'base64'),
        counter: credential.counter,
      },
    } as any); // هنا الحل
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  await sql`UPDATE passkeys SET counter = ${verification.authenticationInfo.newCounter} WHERE id = ${credential.id}`;
  const [user] = await sql`SELECT role FROM users WHERE userid = ${userId}`;
  const sessionToken = await encrypt({ userId, role: user.role });

  cookieStore.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  cookieStore.delete('webauthn_login_challenge');
  cookieStore.delete('webauthn_userId');

  return NextResponse.json({ success: true, role: user.role, userId });
}