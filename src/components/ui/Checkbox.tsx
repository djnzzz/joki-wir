"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  error?: string;
}

export function Checkbox({
  checked,
  onChange,
  children,
  error,
}: CheckboxProps) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          cursor: "pointer",
        }}
        onClick={() => onChange(!checked)}
      >
        {/* Box */}
        <motion.div
          whileTap={{ scale: 0.8 }}
          transition={{ type: "spring", stiffness: 600, damping: 15 }}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            border: `2px solid ${checked ? "#FFB800" : "#5B5B5B"}`,
            background: checked ? "#FFB800" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
            transition: "border-color 0.2s, background 0.2s",
          }}
        >
          <AnimatePresence>
            {checked && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 20 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
              >
                <Check size={13} color="#1E1E1E" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Label */}
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#7E7D7D",
            lineHeight: 1.5,
            userSelect: "none",
          }}
        >
          {children}
        </span>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#FF0000",
              marginTop: 4,
              overflow: "hidden",
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
