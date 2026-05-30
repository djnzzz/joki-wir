"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
import { AuthInput } from "@/components/ui/AuthInput";
import { AuthButton } from "@/components/ui/AuthButton";
import {
  PasswordStrength,
  getPasswordStrength,
} from "@/components/ui/PasswordStrength";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/config/routes";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Harus ada huruf kapital")
      .regex(/[0-9]/, "Harus ada angka"),
    confirmPassword: z.string().min(1, "Wajib diisi"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const newPassword = useWatch({
    control,
    name: "newPassword",
  });
  const passwordStrength = getPasswordStrength(newPassword ?? "");

  const onSubmit = async (data: ResetForm) => {
    if (!token || !email) {
      showToast({
        type: "error",
        title: "Link tidak valid",
        description: "Minta link reset baru.",
      });
      return;
    }
    if (passwordStrength < 3) {
      showToast({
        type: "warning",
        title: "Password terlalu lemah",
        description: "Buat password yang lebih kuat.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(ROUTES.api.auth.resetPassword, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword: data.newPassword }),
      });

      const result = await res.json();

      if (!res.ok) {
        showToast({
          type: "error",
          title: "Gagal",
          description: result.error ?? "Link sudah expired.",
        });
        return;
      }

      setDone(true);
      showToast({
        type: "sukses",
        title: "Password berhasil diubah!",
        description: "Silakan login dengan password baru.",
      });
      setTimeout(() => router.push(ROUTES.login), 2500);
    } catch {
      showToast({
        type: "error",
        title: "Koneksi gagal",
        description: "Periksa koneksi internet.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Tidak ada token/email → tampilkan error
  if (!token || !email) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#0C0C0C",
          border: "3px solid #1E1E1E",
          borderRadius: "var(--radius-box)",
          padding: "48px 40px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#FF0000",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            marginBottom: 20,
          }}
        >
          Link tidak valid atau sudah expired.
        </p>
        <Link
          href={ROUTES.forgotPassword}
          style={{
            color: "#FFB800",
            fontFamily: "var(--font-body)",
            fontWeight: 700,
          }}
        >
          Minta link baru
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        background: "#0C0C0C",
        border: "3px solid #1E1E1E",
        borderRadius: "var(--radius-box)",
        padding: "48px 40px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Link
          href={ROUTES.login}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "#7E7D7D",
            textDecoration: "none",
            marginBottom: 28,
            transition: "color 0.2s",
          }}
          className="auth-link"
        >
          <ArrowLeft size={16} /> Kembali ke Login
        </Link>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#1E1E1E",
            border: "2px solid #FFB800",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Lock size={24} color="#FFB800" />
        </div>

        {!done ? (
          <>
            <h1
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 26,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Buat Password Baru
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                color: "#7E7D7D",
                marginBottom: 28,
                lineHeight: 1.6,
              }}
            >
              Password baru harus berbeda dari password sebelumnya.
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  marginBottom: 20,
                }}
              >
                <AuthInput
                  icon="lock"
                  placeholder="Password baru"
                  type="password"
                  showToggle
                  autoComplete="new-password"
                  error={errors.newPassword?.message}
                  below={
                    newPassword ? (
                      <PasswordStrength password={newPassword} />
                    ) : null
                  }
                  {...register("newPassword")}
                />
                <AuthInput
                  icon="lock"
                  placeholder="Konfirmasi password baru"
                  type="password"
                  showToggle
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
              </div>

              <AuthButton
                variant="filled"
                type="submit"
                loading={loading}
                disabled={passwordStrength < 3}
              >
                Simpan Password Baru
              </AuthButton>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 26,
                color: "#00FF2F",
                marginBottom: 8,
              }}
            >
              Password Berhasil Diubah!
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                color: "#7E7D7D",
                lineHeight: 1.6,
              }}
            >
              Kamu akan diarahkan ke halaman login...
            </p>
          </motion.div>
        )}
      </motion.div>

      <style>{`.auth-link:hover { color: #FFFFFF !important; }`}</style>
    </div>
  );
}
