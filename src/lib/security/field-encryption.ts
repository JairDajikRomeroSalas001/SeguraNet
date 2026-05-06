import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { getSecretAsBytes } from './kms';

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const bytes = getSecretAsBytes('aes-master-key');
  if (bytes.length !== 32) {
    throw new Error(`AES_MASTER_KEY debe ser de 32 bytes (recibido: ${bytes.length}). openssl rand -hex 32`);
  }
  return bytes;
}

export function encryptField(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

export function decryptField(encoded: string): string {
  if (!encoded) return encoded;
  try {
    const key = getKey();
    const data = Buffer.from(encoded, 'base64');
    const iv = data.subarray(0, IV_LEN);
    const tag = data.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ciphertext = data.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    // Datos legacy/no cifrados: devolver tal cual
    return encoded;
  }
}

export function encryptOptional(s: string | null | undefined): string {
  return s ? encryptField(s) : '';
}

export function decryptOptional(s: string | null | undefined): string {
  return s ? decryptField(s) : '';
}
