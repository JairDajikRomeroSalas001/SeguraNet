import 'server-only';

interface ClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  maxRetries?: number;
  name: string;
}

interface CircuitState {
  failures: number;
  openedAt: number | null;
}

export class ExternalApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ExternalApiError';
  }
}

const FAILURE_THRESHOLD = 5;
const OPEN_MS = 30_000;

export class BaseClient {
  private readonly circuit: CircuitState = { failures: 0, openedAt: null };

  constructor(protected readonly opts: ClientOptions) {}

  private circuitOpen(): boolean {
    if (this.circuit.openedAt == null) return false;
    if (Date.now() - this.circuit.openedAt > OPEN_MS) {
      this.circuit.openedAt = null;
      this.circuit.failures = 0;
      return false;
    }
    return true;
  }

  private recordFailure(): void {
    this.circuit.failures += 1;
    if (this.circuit.failures >= FAILURE_THRESHOLD) {
      this.circuit.openedAt = Date.now();
    }
  }

  private recordSuccess(): void {
    this.circuit.failures = 0;
    this.circuit.openedAt = null;
  }

  protected async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (this.circuitOpen()) {
      throw new ExternalApiError(503, `${this.opts.name}: circuit-breaker abierto`);
    }
    const url = `${this.opts.baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    const timeoutMs = this.opts.timeoutMs ?? 10_000;
    const maxRetries = this.opts.maxRetries ?? 2;

    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) {
          if (res.status >= 500 && attempt < maxRetries) {
            await sleep(2 ** attempt * 200);
            continue;
          }
          this.recordFailure();
          throw new ExternalApiError(res.status, `${this.opts.name}: HTTP ${res.status}`);
        }
        const data = (await res.json()) as T;
        this.recordSuccess();
        return data;
      } catch (err) {
        clearTimeout(timer);
        lastError = err;
        if (err instanceof ExternalApiError) throw err;
        if (attempt < maxRetries) {
          await sleep(2 ** attempt * 200);
          continue;
        }
        this.recordFailure();
      }
    }
    throw new ExternalApiError(503, `${this.opts.name}: ${(lastError as Error)?.message ?? 'falló'}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
