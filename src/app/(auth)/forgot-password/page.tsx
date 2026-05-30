"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { AuthInput } from "@/components/ui/AuthInput";
import { AuthButton } from "@/components/ui/AuthButton";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/config/routes";

const schema = z.object({
  email: z.string().email("Format email tidak valid"),
});
type ForgotForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const email = useWatch({
    control,
    name: "email",
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await fetch(ROUTES.api.auth.resetPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      // Selalu sukses di backend (anti-enumeration)
      setSent(true);
      showToast({
        type: "info",
        title: "Email terkirim",
        description: "Cek inbox kamu untuk link reset password.",
      });
    } catch {
      showToast({
        type: "error",
        title: "Gagal",
        description: "Periksa koneksi internet.",
      });
    } finally {
      setLoading(false);
    }
  };

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
        {/* Back link */}
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
          <ArrowLeft size={16} />
          Kembali ke Login
        </Link>

        {/* Icon */}
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
          <Mail size={24} color="#FFB800" />
        </div>

        {!sent ? (
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
              Lupa Password?
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
              Masukkan email kamu dan kami akan kirimkan link untuk reset
              password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: 20 }}>
                <AuthInput
                  icon="mail"
                  placeholder="Masukkan email kamu"
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <AuthButton
                variant="filled"
                type="submit"
                loading={loading}
                disabled={!email}
              >
                Kirim Link Reset
              </AuthButton>
            </form>
          </>
        ) : (
          /* State setelah email terkirim */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 26,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Cek Email Kamu
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
              Kami sudah mengirimkan link reset password ke{" "}
              <span style={{ color: "#FFB800", fontWeight: 700 }}>{email}</span>
              . Link berlaku selama 1 jam.
            </p>

            <AuthButton variant="outline" onClick={() => setSent(false)}>
              Kirim ulang
            </AuthButton>

            <p style={{ textAlign: "center", marginTop: 16 }}>
              <Link
                href={ROUTES.login}
                style={{
                  color: "#FFB800",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                }}
                className="auth-link"
              >
                Kembali ke Login
              </Link>
            </p>
          </motion.div>
        )}
      </motion.div>

      <style>{`.auth-link:hover { color: #FFFFFF !important; }`}</style>
    </div>
  );
}
