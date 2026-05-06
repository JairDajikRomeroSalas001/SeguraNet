import 'server-only';
import { prisma } from '@/lib/prisma';

interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
  blockSeconds?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function checkRateLimit(cfg: RateLimitConfig): Promise<RateLimitResult> {
  const now = new Date();
  const key = cfg.key;

  return prisma.$transaction(async tx => {
    const state = await tx.rateLimit.findUnique({ where: { key } });

    if (state?.blockedUntil && state.blockedUntil.getTime() > now.getTime()) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((state.blockedUntil.getTime() - now.getTime()) / 1000),
      };
    }

    const windowExpired =
      !state || state.windowStart.getTime() + cfg.windowSeconds * 1000 < now.getTime();
    const nextCount = windowExpired ? 1 : state!.count + 1;

    if (nextCount > cfg.limit) {
      const blockMs = (cfg.blockSeconds ?? cfg.windowSeconds) * 1000;
      const blockedUntil = new Date(now.getTime() + blockMs);
      await tx.rateLimit.upsert({
        where: { key },
        create: { key, count: nextCount, windowStart: state?.windowStart ?? now, blockedUntil },
        update: { count: nextCount, blockedUntil },
      });
      return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil(blockMs / 1000) };
    }

    await tx.rateLimit.upsert({
      where: { key },
      create: { key, count: nextCount, windowStart: now, blockedUntil: null },
      update: {
        count: nextCount,
        windowStart: windowExpired ? now : state!.windowStart,
        blockedUntil: null,
      },
    });
    return { allowed: true, remaining: cfg.limit - nextCount, retryAfterSeconds: 0 };
  });
}

export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

export const RATE_LIMITS = {
  login: (ipOrUser: string) => ({
    key: `login:${ipOrUser}`,
    limit: Number(process.env.RATE_LIMIT_LOGIN_ATTEMPTS ?? 5),
    windowSeconds: 15 * 60,
    blockSeconds: Number(process.env.RATE_LIMIT_LOGIN_BLOCK_MINUTES ?? 30) * 60,
  }),
  api: (uid: string) => ({
    key: `api:${uid}`,
    limit: Number(process.env.RATE_LIMIT_API_PER_MINUTE ?? 100),
    windowSeconds: 60,
  }),
};
