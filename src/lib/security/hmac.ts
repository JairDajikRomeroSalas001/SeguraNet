import 'server-only';
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { getSecret } from './kms';

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map(k => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`)
    .join(',')}}`;
}

export function signHmac(payload: unknown): string {
  const key = getSecret('hmac-signing-key');
  return createHmac('sha256', key).update(canonicalize(payload)).digest('base64');
}

export function verifyHmac(payload: unknown, signature: string): boolean {
  const expected = signHmac(payload);
  const a = Buffer.from(expected, 'base64');
  const b = Buffer.from(signature, 'base64');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}
