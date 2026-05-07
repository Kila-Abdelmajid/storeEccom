import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { attestation } = body;

  const cookieStore = await cookies();
  const challengeCookie = cookieStore.get('webauthn_challenge');
  if (!challengeCookie) {
    return NextResponse.json({ error: 'No challenge found' }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: attestation,
      expectedChallenge: challengeCookie.value,
      expectedOrigin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      expectedRPID: process.env.NODE_ENV === 'production'
        ? new URL(process.env.NEXT_PUBLIC_BASE_URL || '').hostname
        : 'localhost',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  const { verified, registrationInfo } = verification;
  if (!verified || !registrationInfo) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  const { credential } = registrationInfo;
  const credentialID = credential.id; // Uint8Array
  const credentialPublicKey = credential.publicKey; // Uint8Array
  const counter = credential.counter; // number

  // Store as base64url strings
  const credentialIdBase64Url = Buffer.from(credentialID).toString('base64url');
  const publicKeyBase64Url = Buffer.from(credentialPublicKey).toString('base64url');

  await sql`
    INSERT INTO passkeys (userid, credentialid, publickey, counter, devicename)
    VALUES (${session.userId}, ${credentialIdBase64Url}, ${publicKeyBase64Url}, ${counter}, 'Face ID / Passkey')
  `;

  cookieStore.delete('webauthn_challenge');

  return NextResponse.json({ success: true });
}