import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { badRequest, created, handleError } from "@/lib/api-response";
import { sendVerificationEmail } from "@/lib/email";

// Validasi input register
const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung huruf kapital")
    .regex(/[0-9]/, "Password harus mengandung angka"),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Parse & validasi body
    const body = await request.json();
    const data = registerSchema.parse(body);

    // 2. Cek email sudah terdaftar
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existing) {
      return badRequest("Email sudah terdaftar");
    }

    // 3. Hash password (cost factor 12 = balance keamanan vs performa)
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 4. Buat user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: "USER",
      },
      select: { id: true, email: true, name: true },
    });

    // 5. Buat token verifikasi email (berlaku 24 jam)
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });

    // 6. Kirim email verifikasi (non-blocking — tidak await)
    sendVerificationEmail({ name: user.name, email: user.email, token }).catch(
      (err) => console.error("[Email Error]", err),
    );

    // 7. Return sukses — JANGAN return passwordHash ke client
    return created({
      message: "Registrasi berhasil. Cek email untuk verifikasi akun.",
      userId: user.id,
    });
  } catch (error) {
    return handleError(error);
  }
}
