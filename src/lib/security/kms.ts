import 'server-only';

const ENV_MAP: Record<string, string> = {
  'aes-master-key': 'AES_MASTER_KEY',
  'hmac-signing-key': 'HMAC_SIGNING_KEY',
  'jwt-signing-key': 'JWT_SECRET',
  'argon2-pepper': 'ARGON2_PEPPER',
  'reniec-api-key': 'RENIEC_API_KEY',
};

export function getSecret(name: string): string {
  const envVar = ENV_MAP[name] ?? name.toUpperCase().replace(/-/g, '_');
  const value = process.env[envVar];
  if (!value) throw new Error(`Variable de entorno '${envVar}' no configurada (secreto: ${name})`);
  return value;
}

export function getSecretAsBytes(name: string): Buffer {
  const raw = getSecret(name);
  if (/^[0-9a-fA-F]+$/.test(raw) && raw.length % 2 === 0) {
    return Buffer.from(raw, 'hex');
  }
  return Buffer.from(raw, 'utf8');
}
