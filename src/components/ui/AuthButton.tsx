"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface AuthButtonProps {
  variant: "filled" | "outline";
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function AuthButton({
  variant,
  children,
  onClick,
  type = "button",
  loading = false,
  disabled = false,
  fullWidth = true,
}: AuthButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === "filled") {
    return (
      <motion.button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        style={{
          position: "relative",
          width: fullWidth ? "100%" : "auto",
          height: 50,
          borderRadius: "var(--radius-button)",
          border: "2px solid #FFB800",
          background: isDisabled ? "transparent" : "#FFB800",
          cursor: isDisabled ? "not-allowed" : "pointer",
          fontFamily: "var(--font-body)",
          fontSize: 16,
          fontWeight: 700,
          color: isDisabled ? "#FFB800" : "#1E1E1E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          overflow: "hidden",
          transition: "background 0.3s, color 0.3s",
          opacity: isDisabled ? 0.6 : 1,
        }}
        className="auth-btn-filled"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {children}

        <style>{`
          .auth-btn-filled:not(:disabled):hover {
            background: transparent !important;
            color: #FFB800 !important;
          }
        `}</style>
      </motion.button>
    );
  }

  // Outline variant — fill sweep dari kanan ke kiri
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      style={{
        position: "relative",
        width: fullWidth ? "100%" : "auto",
        height: 50,
        borderRadius: "var(--radius-button)",
        border: "2px solid #FFB800",
        background: "transparent",
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-body)",
        fontSize: 16,
        fontWeight: 700,
        color: "#FFB800",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        overflow: "hidden",
        opacity: isDisabled ? 0.5 : 1,
      }}
      className="auth-btn-outline"
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      <span className="auth-btn-outline-content">{children}</span>

      <style>{`
        .auth-btn-outline {
          transition: color 0.35s;
        }
        .auth-btn-outline::before {
          content: "";
          position: absolute;
          inset: 0;
          background: #FFB800;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.35s ease;
          z-index: 0;
          border-radius: 8px;
        }
        .auth-btn-outline:not(:disabled):hover::before {
          transform: scaleX(1);
          transform-origin: right;
        }
        .auth-btn-outline:not(:disabled):hover {
          color: #FFFFFF !important;
        }
        .auth-btn-outline-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </motion.button>
  );
}
