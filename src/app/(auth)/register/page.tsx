"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AuthInput } from "@/components/ui/AuthInput";
import { AuthButton } from "@/components/ui/AuthButton";
import { AuthPanel, AuthPanelContent } from "@/components/ui/AuthPanel";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  PasswordStrength,
  getPasswordStrength,
} from "@/components/ui/PasswordStrength";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/config/routes";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, "Username minimal 3 karakter")
      .max(30, "Username maksimal 30 karakter")
      .regex(/^[a-zA-Z0-9_]+$/, "Hanya boleh huruf, angka, dan underscore"),
    email: z.string().email("Format email tidak valid"),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Harus ada huruf kapital")
      .regex(/[0-9]/, "Harus ada angka"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
    agreeToTerms: z.literal(true, {
      message: "Kamu harus menyetujui syarat & ketentuan",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    available: boolean | null;
    reason: string | null;
  }>({
    available: null,
    reason: null,
  });

  const [checkingUsername, setCheckingUsername] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: { agreeToTerms: undefined as unknown as true },
  });

  const watchedName = useWatch({
    control,
    name: "name",
  });

  const watchedPassword = useWatch({
    control,
    name: "password",
  });

  const watchedValues = useWatch({
    control,
  });

  const passwordStrength = getPasswordStrength(watchedPassword ?? "");

  // Semua field terisi + terms dicentang + username available + password kuat
  const canSubmit =
    !!(
      watchedValues.name &&
      watchedValues.email &&
      watchedValues.password &&
      watchedValues.confirmPassword &&
      watchedValues.agreeToTerms
    ) &&
    usernameStatus.available !== false &&
    passwordStrength >= 3;

  const shouldCheckUsername = !!watchedName && watchedName.length >= 3;

  // Debounce check username
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Reset jika username belum valid dicek
      if (!shouldCheckUsername) {
        setUsernameStatus({
          available: null,
          reason: null,
        });
        return;
      }

      setCheckingUsername(true);

      try {
        const res = await fetch(
          `${ROUTES.api.auth.checkUsername}?username=${encodeURIComponent(watchedName)}`,
        );

        const data = await res.json();

        setUsernameStatus({
          available: data.data.available,
          reason: data.data.reason,
        });
      } catch {
        setUsernameStatus({
          available: null,
          reason: null,
        });
      } finally {
        setCheckingUsername(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [watchedName, shouldCheckUsername]);

  const onSubmit = async (data: RegisterForm) => {
    if (passwordStrength < 3) {
      showToast({
        type: "warning",
        title: "Password terlalu lemah",
        description: "Buat password yang lebih kuat untuk melanjutkan.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(ROUTES.api.auth.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        showToast({
          type: "error",
          title: "Registrasi gagal",
          description: result.error ?? "Terjadi kesalahan.",
        });
        return;
      }

      showToast({
        type: "sukses",
        title: "Registrasi berhasil!",
        description: "Cek email kamu untuk verifikasi akun.",
      });

      // Redirect ke login setelah 2 detik
      setTimeout(() => router.push(ROUTES.login), 2000);
    } catch {
      showToast({
        type: "error",
        title: "Koneksi gagal",
        description: "Periksa koneksi internet kamu.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: ROUTES.home });
  };

  // Username warning box
  const usernameWarning =
    shouldCheckUsername &&
    !checkingUsername &&
    usernameStatus.available === false ? (
      <div
        style={{
          marginTop: 8,
          padding: "6px 10px",
          background: "#1A0000",
          border: "1px solid #FF0000",
          borderRadius: 8,
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "#FF0000",
        }}
      >
        {usernameStatus.reason ?? "Username sudah digunakan"}
      </div>
    ) : null;

  // Password strength slot
  const passwordStrengthSlot = watchedPassword ? (
    <PasswordStrength password={watchedPassword} />
  ) : null;

  return (
    <>
      <style>{`
        .auth-link:hover { color: #FFFFFF !important; }
        .auth-link { transition: color 0.2s; }
        @media (max-width: 900px) {
          .auth-layout {
            grid-template-columns: 1fr !important;
            min-height: unset !important;
          }

          .auth-vertical-title {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="auth-layout"
        style={{
          width: "100%",
          maxWidth: 1250,
          background: "#0C0C0C",
          border: "3px solid #1E1E1E",
          borderRadius: "var(--radius-box)",
          overflow: "visible",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: 720,
          position: "relative",
        }}
      >
        <VerticalTitleFilled text="REGISTER" side="right" />
        <VerticalTitleOutline text="REGISTER" side="right" />

        {/* Kolom kiri */}
        <div style={{ order: 1 }}>
          <AnimatePresence mode="wait">
            <AuthPanel mode="register" key="register-panel">
              <AuthPanelContent />
            </AuthPanel>
          </AnimatePresence>
        </div>

        {/* Kolom kanan */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 80px 56px 40px",
            order: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              width: "100%",
              maxWidth: 460,
              background: "#1E1E1E",
              border: "3px solid #292929",
              borderRadius: "var(--radius-box)",
              padding: "40px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: "clamp(12px, 2vw, 24px)",
                color: "#FFFFFF",
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              Selamat Datang!
            </h1>

            <p
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 400,
                fontSize: 14,
                color: "#7E7D7D",
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              Buat akun dan jelajahi layanan kami
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <AuthInput
                  icon="user"
                  placeholder="Buat username"
                  type="text"
                  autoComplete="username"
                  error={errors.name?.message}
                  below={usernameWarning}
                  {...register("name")}
                />

                <AuthInput
                  icon="mail"
                  placeholder="Masukkan email"
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register("email")}
                />

                <AuthInput
                  icon="lock"
                  placeholder="Buat password"
                  type="password"
                  showToggle
                  autoComplete="new-password"
                  error={errors.password?.message}
                  below={passwordStrengthSlot}
                  {...register("password")}
                />

                <AuthInput
                  icon="lock"
                  placeholder="Konfirmasi password"
                  type="password"
                  showToggle
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />

                <Controller
                  name="agreeToTerms"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={!!field.value}
                      onChange={(v) => field.onChange(v || undefined)}
                      error={errors.agreeToTerms?.message}
                    >
                      Saya menyetujui
                      <Link
                        href={ROUTES.terms}
                        style={{ color: "#FFB800", fontWeight: 700 }}
                        className="auth-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Syarat & Ketentuan
                      </Link>
                      dan
                      <Link
                        href={ROUTES.privacy}
                        style={{ color: "#FFB800", fontWeight: 700 }}
                        className="auth-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Kebijakan Privasi
                      </Link>
                      yang berlaku
                    </Checkbox>
                  )}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginTop: 22,
                }}
              >
                <AuthButton
                  variant="filled"
                  type="submit"
                  loading={loading}
                  disabled={!canSubmit}
                >
                  Register
                </AuthButton>

                <Divider />

                <AuthButton
                  variant="outline"
                  loading={googleLoading}
                  onClick={handleGoogleRegister}
                >
                  <GoogleIcon />
                  Register dengan Google
                </AuthButton>
              </div>
            </form>

            <p
              style={{
                textAlign: "center",
                marginTop: 24,
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "#7E7D7D",
              }}
            >
              Sudah punya akun?{" "}
              <Link
                href={ROUTES.login}
                style={{
                  color: "#FFB800",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
                className="auth-link"
              >
                Login
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function VerticalTitleFilled({
  text,
  side,
}: {
  text: string;
  side: "left" | "right";
}) {
  const isLeft = side === "left";
  const fontSize = "clamp(60px, 7.5vw, 110px)";
  const rotation = isLeft ? "rotate(-90deg)" : "rotate(90deg)";
  const origin = isLeft ? "top left" : "top right";
  return (
    <div
      className="auth-vertical-title"
      style={{
        position: "absolute",
        left: isLeft ? 28 : undefined,
        right: !isLeft ? 28 : undefined,
        top: 60,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: isLeft ? 300 : 420,
          left: isLeft ? -10 : undefined,
          right: !isLeft ? -10 : undefined,
          fontFamily: "var(--font-display)",
          fontSize,
          fontWeight: 400,
          color: "#FFB800",
          letterSpacing: 2,
          whiteSpace: "nowrap",
          userSelect: "none",
          transform: rotation,
          transformOrigin: origin,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function VerticalTitleOutline({
  text,
  side,
}: {
  text: string;
  side: "left" | "right";
}) {
  const isLeft = side === "left";
  const fontSize = "clamp(60px, 7.5vw, 110px)";
  const rotation = isLeft ? "rotate(-90deg)" : "rotate(90deg)";
  const origin = isLeft ? "top left" : "top right";
  return (
    <div
      className="auth-vertical-title"
      style={{
        position: "absolute",
        left: isLeft ? 28 : undefined,
        right: !isLeft ? 28 : undefined,
        top: 60,
        zIndex: 3,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: isLeft ? 300 : 420,
          left: isLeft ? -10 : undefined,
          right: !isLeft ? -10 : undefined,
          fontFamily: "var(--font-display)",
          fontSize,
          fontWeight: 400,
          color: "transparent",
          WebkitTextStroke: "2px #FFB800",
          letterSpacing: 2,
          whiteSpace: "nowrap",
          userSelect: "none",
          transform: rotation,
          transformOrigin: origin,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "4px 0",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "#7E7D7D" }} />
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "#7E7D7D",
        }}
      >
        atau
      </span>
      <div style={{ flex: 1, height: 1, background: "#7E7D7D" }} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
