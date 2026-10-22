import { Role } from '../models';

export interface DemoAccount {
  username: string;
  role: Role;
  /** base64, 16 random bytes */
  salt: string;
  /** base64 PBKDF2-SHA256 output (32 bytes) */
  hash: string;
}

export interface Session {
  token: string;
  username: string;
  role: Role;
  expiresAt: number;
}

export const SESSION_KEY = 'loomline.session';
