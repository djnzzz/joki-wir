import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { badRequest, handleError, ok } from "@/lib/api-response";
import { sendPasswordResetEmail } from "@/lib/email";

// POST: minta reset password
// Body: { email }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = z.object({ email: z.string().email() }).parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    // Selalu 200 — cegah email enumeration
    if (!user) {
      return ok({ message: "Jika email terdaftar, link reset sudah dikirim." });
    }

    // Hapus token reset lama
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${email}` },
    });

    // Buat token baru berlaku 1 jam
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: { identifier: `reset:${email}`, token, expires },
    });

    sendPasswordResetEmail({ name: user.name, email, token }).catch((err) =>
      console.error("[Email Error]", err),
    );

    return ok({ message: "Jika email terdaftar, link reset sudah dikirim." });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH: konfirmasi reset — set password baru
// Body: { token, email, newPassword }
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const data = z
      .object({
        token: z.string().min(1),
        email: z.string().email(),
        newPassword: z
          .string()
          .min(8, "Password minimal 8 karakter")
          .regex(/[A-Z]/, "Harus ada huruf kapital")
          .regex(/[0-9]/, "Harus ada angka"),
      })
      .parse(body);

    // Cari & validasi token
    const verToken = await prisma.verificationToken.findUnique({
      where: { token: data.token },
    });

    if (
      !verToken ||
      verToken.identifier !== `reset:${data.email}` ||
      verToken.expires < new Date()
    ) {
      return badRequest("Token tidak valid atau sudah expired");
    }

    // Hash password baru
    const passwordHash = await bcrypt.hash(data.newPassword, 12);

    // Update password user
    await prisma.user.update({
      where: { email: data.email },
      data: { passwordHash },
    });

    // Hapus token — one-time use
    await prisma.verificationToken.delete({ where: { token: data.token } });

    return ok({ message: "Password berhasil diubah. Silakan login." });
  } catch (error) {
    return handleError(error);
  }
}
