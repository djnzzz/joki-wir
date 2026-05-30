"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface AuthPanelProps {
  /** "login": panel di kanan | "register": panel di kiri */
  mode: "login" | "register";
  children: React.ReactNode;
}

export function AuthPanel({ mode, children }: AuthPanelProps) {
  return (
    <motion.div
      key={mode}
      initial={{
        scaleX: 0,
        originX: mode === "login" ? 0 : 1,
      }}
      animate={{ scaleX: 1 }}
      exit={{
        scaleX: 0,
        originX: mode === "login" ? 1 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 28,
      }}
      style={{
        background: "#FFB800",
        borderRadius: "var(--radius-box)",
        width: "100%",
        height: "100%",
        minHeight: 760,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 48px",
        position: "relative",
        overflow: "visible",
        transformOrigin: mode === "login" ? "left" : "right",
      }}
    >
      {/* Content fade in setelah panel terbuka */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
        style={{ width: "100%", textAlign: "left" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Konten dalam panel kuning — konsisten di login & register */
export function AuthPanelContent() {
  return (
    <div>
      {/* Label atas */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 800,
          fontSize: "clamp(18px, 3vw, 36px)",
          color: "#1E1E1E",
          marginBottom: 16,
          lineHeight: 1.2,
        }}
      >
        Halo! Selamat Datang di
      </p>

      {/* Logo Jokiwir */}
      <JokiwirLogo />

      {/* Tagline */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: "clamp(14px, 2vw, 18px)",
          color: "#1E1E1E",
          marginTop: 24,
          lineHeight: 1.5,
          maxWidth: 480,
        }}
      >
        Layanan jasa joki game Action RPG profesional
        <br />
        sebagai solusi frustrasi gaming mu.
      </p>
    </div>
  );
}

/** Logo Jokiwir */
function JokiwirLogo() {
  return (
    <Image
      src="/logo/jokiwir.png"
      alt="Jokiwir Logo"
      width={450}
      height={100}
      priority
    />
  );
}
