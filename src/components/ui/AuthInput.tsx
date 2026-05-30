"use client";

import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";

type IconName = "user" | "mail" | "lock";

const ICONS: Record<IconName, React.ReactNode> = {
  user: <User size={20} color="#5B5B5B" />,
  mail: <Mail size={20} color="#5B5B5B" />,
  lock: <Lock size={20} color="#5B5B5B" />,
};

interface AuthInputProps {
  icon: IconName;
  placeholder: string;
  type?: "text" | "email" | "password";
  showToggle?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  name?: string;
  autoComplete?: string;
  disabled?: boolean;
  /** Anak elemen di bawah input (untuk strength meter / warning box) */
  below?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  function AuthInput(
    {
      icon,
      placeholder,
      type = "text",
      showToggle = false,
      error,
      below,
      disabled,
      ...rest
    },
    ref,
  ) {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const inputType =
      type === "password" ? (showPassword ? "text" : "password") : type;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      rest.onChange?.(e);
    };

    return (
      <div style={{ width: "100%" }}>
        {/* Input wrapper */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 50,
            borderBottom: `2px solid ${error ? "#FF0000" : "#FFB800"}`,
            transition: "border-color 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Icon kiri */}
          <span
            style={{ flexShrink: 0, display: "flex", alignItems: "center" }}
          >
            {ICONS[icon]}
          </span>

          {/* Input field */}
          <input
            ref={ref}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
            {...rest}
            onChange={handleChange}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              rest.onBlur?.(e);
            }}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-body)",
              fontSize: 16,
              fontWeight: 400,
              color: hasValue || isFocused ? "#FFFFFF" : "#5B5B5B",
              transition: "color 0.2s",
              cursor: disabled ? "not-allowed" : "text",
              opacity: disabled ? 0.5 : 1,
            }}
          />

          {/* Show/hide password toggle */}
          {showToggle && type === "password" && (
            <motion.button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              whileTap={{ scale: 0.75, rotate: showPassword ? -20 : 20 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                padding: 2,
              }}
            >
              {showPassword ? (
                <EyeOff size={20} color="#5B5B5B" />
              ) : (
                <Eye size={20} color="#5B5B5B" />
              )}
            </motion.button>
          )}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -4 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ overflow: "hidden" }}
            >
              <div
                style={{
                  marginTop: 6,
                  padding: "6px 10px",
                  background: "#1A0000",
                  border: "1px solid #FF0000",
                  borderRadius: 8,
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "#FF0000",
                }}
              >
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slot bawah input (strength meter, username warning, dll) */}
        <AnimatePresence>
          {below && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ overflow: "hidden" }}
            >
              {below}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
