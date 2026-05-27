import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Cek env tersedia
const isConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Inisialisasi Redis — null jika belum dikonfigurasi (dev tanpa Upstash)
const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Helper buat limiter dengan config berbeda per endpoint
function createLimiter(requests: number, windowSeconds: number) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    analytics: true,
    prefix: "jokiwir_rl",
  });
}

// Konfigurasi per endpoint
export const rateLimiters = {
  // Login: 5 percobaan per 15 menit per IP
  login: createLimiter(5, 15 * 60),

  // Register: 3 akun per jam per IP
  register: createLimiter(3, 60 * 60),

  // Reset password: 3 request per jam per email
  resetPassword: createLimiter(3, 60 * 60),

  // Check username: 30 request per menit per IP (debounce wajar)
  checkUsername: createLimiter(30, 60),

  // Verify email: 5 request per jam per IP
  verifyEmail: createLimiter(5, 60 * 60),
} as const;

// Helper: jalankan rate limit check
// Return: { success: true } atau { success: false, retryAfter: number }
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ success: boolean; retryAfter?: number }> {
  // Jika Redis belum dikonfigurasi (dev), skip rate limiting
  if (!limiter) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[RateLimit] Upstash belum dikonfigurasi — rate limit dilewati",
      );
    }
    return { success: true };
  }

  const result = await limiter.limit(identifier);

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    return { success: false, retryAfter };
  }

  return { success: true };
}
