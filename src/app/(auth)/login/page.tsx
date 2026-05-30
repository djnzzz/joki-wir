"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AuthInput } from "@/components/ui/AuthInput";
import { AuthButton } from "@/components/ui/AuthButton";
import { AuthPanel, AuthPanelContent } from "@/components/ui/AuthPanel";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/config/routes";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Baca query param dari verify-email redirect
  const verified = searchParams.get("verified");
  const errorParam = searchParams.get("error");

  // Tampilkan toast dari redirect
  useEffect(() => {
    if (verified === "true") {
      showToast({
        type: "sukses",
        title: "Email terverifikasi!",
        description: "Akun kamu sudah terdaftar. Silakan login.",
      });
    }

    if (errorParam) {
      showToast({
        type: "error",
        title: "Verifikasi gagal",
        description: decodeURIComponent(errorParam),
      });
    }
  }, [verified, errorParam, showToast]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const watchedValues = useWatch({
    control,
  });
  const allFilled = !!(watchedValues?.email && watchedValues?.password);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result) {
        showToast({
          type: "error",
          title: "Gagal login",
          description: "Terjadi kesalahan. Coba lagi.",
        });
        return;
      }

      if (result.error) {
        if (result.error === "RATE_LIMITED" || result.error.includes("RATE")) {
          showToast({
            type: "warning",
            title: "Terlalu banyak percobaan",
            description: "Coba lagi beberapa menit lagi.",
          });
        } else {
          showToast({
            type: "error",
            title: "Login gagal",
            description: "Email atau password salah.",
          });
        }
        return;
      }

      // Sukses — fetch session untuk baca role
      showToast({
        type: "sukses",
        title: "Login berhasil!",
        description: "Selamat datang kembali.",
      });

      // Redirect berdasarkan callbackUrl atau default
      const callbackUrl = searchParams.get("callbackUrl");
      if (callbackUrl) {
        router.push(decodeURIComponent(callbackUrl));
      } else {
        // Fetch session setelah signIn
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        const role = session?.user?.role;

        if (role === "ADMIN") router.push(ROUTES.admin.dashboard);
        else if (role === "JOKI") router.push(ROUTES.joki.dashboard);
        else router.push(ROUTES.home);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await signIn("google", {
      callbackUrl: ROUTES.home, // middleware akan redirect sesuai role
    });
  };

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
          .auth-panel-col { min-height: 200px; }
          .auth-vertical-title { display: none !important; }
        }
      `}</style>

      {/* ── Outer box ── */}
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
        {/* Vertical Title */}
        <VerticalTitleFilled text="LOGIN" side="left" />
        <VerticalTitleOutline text="LOGIN" side="left" />

        {/* ── Kolom kiri: Form ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 40px 56px 80px",
            order: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
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
              Selamat Datang Kembali!
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
              Masukkan detail berikut untuk mengakses akunmu
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
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
                  placeholder="Masukkan password"
                  type="password"
                  showToggle
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register("password")}
                />
              </div>

              <div style={{ textAlign: "right", margin: "14px 0 22px" }}>
                <Link
                  href={ROUTES.forgotPassword}
                  className="auth-link"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#FFB800",
                    textDecoration: "none",
                  }}
                >
                  Lupa Password?
                </Link>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <AuthButton
                  variant="filled"
                  type="submit"
                  loading={loading}
                  disabled={!allFilled}
                >
                  Login
                </AuthButton>
                <Divider />
                <AuthButton
                  variant="outline"
                  loading={googleLoading}
                  onClick={handleGoogleLogin}
                >
                  <GoogleIcon /> Login dengan Google
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
              Belum punya akun?{" "}
              <Link
                href={ROUTES.register}
                className="auth-link"
                style={{
                  color: "#FFB800",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Register
              </Link>
            </p>
          </motion.div>
        </div>

        {/* ── Kolom kanan: Panel kuning ── */}
        <div className="auth-panel-col" style={{ order: 2 }}>
          <AnimatePresence mode="wait">
            <AuthPanel mode="login" key="login-panel">
              <AuthPanelContent />
            </AuthPanel>
          </AnimatePresence>
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
          top: 315,
          left: -10,
          fontFamily: "var(--font-display)",
          fontSize,
          fontWeight: 400,
          color: "#FFB800",
          letterSpacing: 2,
          whiteSpace: "nowrap",
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
          top: 315,
          left: -10,
          fontFamily: "var(--font-display)",
          fontSize,
          fontWeight: 400,
          color: "transparent",
          WebkitTextStroke: "2px #FFB800",
          letterSpacing: 2,
          whiteSpace: "nowrap",
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
