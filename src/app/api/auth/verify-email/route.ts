import { z } from "zod";
import prisma from "@/lib/prisma";
import { badRequest, handleError, ok } from "@/lib/api-response";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

const verifySchema = z.object({
  token: z.string().min(1, "Token tidak valid"),
  email: z.string().email(),
});

// GET /api/auth/verify-email?token=xxx&email=xxx
// Dipanggil saat user klik link di email
export async function GET(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const rl = await checkRateLimit(rateLimiters.verifyEmail, `verify:${ip}`);
    if (!rl.success) {
      return badRequest("Terlalu banyak percobaan. Coba lagi nanti.");
    }

    const { searchParams } = new URL(request.url);
    const data = verifySchema.parse({
      token: searchParams.get("token"),
      email: searchParams.get("email"),
    });

    // Cari token di database
    const verToken = await prisma.verificationToken.findUnique({
      where: { token: data.token },
    });

    // Validasi: token ada, email cocok, belum expired
    if (!verToken || verToken.identifier !== data.email) {
      return badRequest("Token tidak valid");
    }
    if (verToken.expires < new Date()) {
      // Hapus token expired
      await prisma.verificationToken.delete({ where: { token: data.token } });
      return badRequest("Token sudah expired. Minta ulang verifikasi.");
    }

    // Update user: tandai email sudah terverifikasi
    await prisma.user.update({
      where: { email: data.email },
      data: { emailVerified: new Date() },
    });

    // Hapus token — one-time use
    await prisma.verificationToken.delete({ where: { token: data.token } });

    return ok({ message: "Email berhasil diverifikasi. Silakan login." });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/auth/verify-email — kirim ulang email verifikasi
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = z.object({ email: z.string().email() }).parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true },
    });

    // Selalu return 200 untuk mencegah email enumeration attack
    if (!user || user.emailVerified) {
      return ok({
        message: "Jika email terdaftar, link verifikasi sudah dikirim.",
      });
    }

    // Hapus token lama jika ada
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    // Buat token baru
    const { randomBytes } = await import("crypto");
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const { sendVerificationEmail } = await import("@/lib/email");
    sendVerificationEmail({ name: user.name || "", email, token }).catch(
      (err) => console.error("[Email Error]", err),
    );

    return ok({
      message: "Jika email terdaftar, link verifikasi sudah dikirim.",
    });
  } catch (error) {
    return handleError(error);
  }
}
