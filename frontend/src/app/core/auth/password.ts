import { DEMO_ACCOUNTS, PBKDF2_ITERATIONS } from './credentials.config';
import { DemoAccount } from './auth.models';

const b64ToBytes = (b64: string): Uint8Array => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function pbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Used for unknown usernames so a miss costs the same as a wrong password.
const DUMMY_SALT = new Uint8Array(16);

/** Verifies a username/password pair against the stored PBKDF2 hashes (WebCrypto). */
export async function verifyCredentials(username: string, password: string): Promise<DemoAccount | null> {
  const account = DEMO_ACCOUNTS.find((a) => a.username === username.trim().toLowerCase());
  const derived = await pbkdf2(password, account ? b64ToBytes(account.salt) : DUMMY_SALT);
  if (!account) return null;
  return constantTimeEqual(derived, b64ToBytes(account.hash)) ? account : null;
}

/** 256-bit random session token (hex). */
export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
