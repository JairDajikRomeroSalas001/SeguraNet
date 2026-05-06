import 'server-only';
import { BaseClient, ExternalApiError } from './base-client';
import { getSecret } from '@/lib/security/kms';

export interface ReniecResult {
  valid: boolean;
  dni: string;
  fullName: string | null;
  source: 'reniec' | 'cache' | 'mock';
}

interface ReniecApiResponse {
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
}

const cache = new Map<string, { value: ReniecResult; expiry: number }>();
const TTL_MS = 30 * 60 * 1000;

class ReniecClient extends BaseClient {
  async lookup(dni: string): Promise<ReniecApiResponse> {
    const apiKey = getSecret('reniec-api-key');
    return this.request<ReniecApiResponse>(`/v1/dni/${encodeURIComponent(dni)}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    });
  }
}

const client = new ReniecClient({
  name: 'RENIEC',
  baseUrl: process.env.RENIEC_API_URL ?? 'https://api.reniec.gob.pe',
  timeoutMs: 8000,
  maxRetries: 2,
});

const MOCK: Record<string, string> = {
  '12345678': 'JUAN PEREZ MENDOZA',
  '87654321': 'MARIA LOPEZ GARCIA',
};

export async function validateDni(dni: string): Promise<ReniecResult> {
  if (!/^\d{8}$/.test(dni)) {
    return { valid: false, dni, fullName: null, source: 'reniec' };
  }
  const cached = cache.get(dni);
  if (cached && cached.expiry > Date.now()) {
    return { ...cached.value, source: 'cache' };
  }

  if (process.env.ENABLE_RENIEC_VALIDATION !== 'true') {
    const result: ReniecResult = {
      valid: dni in MOCK,
      dni,
      fullName: MOCK[dni] ?? null,
      source: 'mock',
    };
    cache.set(dni, { value: result, expiry: Date.now() + TTL_MS });
    return result;
  }

  try {
    const r = await client.lookup(dni);
    const fullName = [r.apellidoPaterno, r.apellidoMaterno, r.nombres]
      .filter(Boolean).join(' ').toUpperCase().trim();
    const result: ReniecResult = { valid: !!fullName, dni, fullName: fullName || null, source: 'reniec' };
    cache.set(dni, { value: result, expiry: Date.now() + TTL_MS });
    return result;
  } catch (err) {
    if (err instanceof ExternalApiError && err.status === 404) {
      const result: ReniecResult = { valid: false, dni, fullName: null, source: 'reniec' };
      cache.set(dni, { value: result, expiry: Date.now() + TTL_MS });
      return result;
    }
    throw err;
  }
}
