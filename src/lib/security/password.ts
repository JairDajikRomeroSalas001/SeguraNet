import 'server-only';
import argon2 from 'argon2';
import { getSecret } from './kms';

const OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

export async function hashPassword(password: string): Promise<string> {
  const pepper = getSecret('argon2-pepper');
  return argon2.hash(password + pepper, OPTIONS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const pepper = getSecret('argon2-pepper');
    return await argon2.verify(hash, password + pepper);
  } catch {
    return false;
  }
}
