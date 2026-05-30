"use client";

import { motion } from "framer-motion";

export type StrengthLevel = 0 | 1 | 2 | 3 | 4 | 5;

interface StrengthConfig {
  label: string;
  color: string;
  segments: number; // berapa segmen yang aktif dari 5
}

const STRENGTH_MAP: Record<StrengthLevel, StrengthConfig> = {
  0: { label: "", color: "#5B5B5B", segments: 0 },
  1: { label: "Password sangat lemah!", color: "#FF0000", segments: 1 },
  2: { label: "Password lemah", color: "#FF6B00", segments: 2 },
  3: { label: "Password cukup kuat", color: "#FFB800", segments: 3 },
  4: { label: "Password kuat", color: "#7DD87D", segments: 4 },
  5: { label: "Password sangat kuat!", color: "#00FF2F", segments: 5 },
};

export function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 5) as StrengthLevel;
}

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const level = getPasswordStrength(password);
  if (!password) return null;

  const config = STRENGTH_MAP[level];

  return (
    <div
      style={{
        marginTop: 8,
        padding: "8px 12px",
        background: "#1A1A1A",
        border: `1px solid ${config.color}33`,
        borderRadius: 8,
      }}
    >
      {/* Segmen barometer */}
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              background: i < config.segments ? config.color : "#292929",
            }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
            }}
          />
        ))}
      </div>

      {/* Label */}
      <motion.p
        key={config.label}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12,
          fontWeight: 600,
          color: config.color,
        }}
      >
        {config.label}
      </motion.p>
    </div>
  );
}
