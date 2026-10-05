"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type DropdownOption = {
  value: string;
  label: string;
};

type AdminDropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  width?: number | string;
  placeholder?: string;
};

export default function AdminDropdown({
  value,
  options,
  onChange,
  width = 180,
  placeholder = "Pilih...",
}: AdminDropdownProps) {
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  return (
    <div
      style={{
        position: "relative",
        width,
      }}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          height: 34,
          padding: "0 10px",
          background: "#1E1E1E",
          border: "1px solid #292929",
          borderRadius: 8,
          color: "#FFFFFF",
          fontFamily: "var(--font-body)",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: selected ? "#FFFFFF" : "#5B5B5B",
          }}
        >
          {selected?.label ?? placeholder}
        </span>

        {/* Chevron */}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            display: "flex",
            flexShrink: 0,
          }}
        >
          <ChevronDown size={13} color="#5B5B5B" />
        </motion.span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 29,
              }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{
                opacity: 0,
                y: -6,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -6,
                scale: 0.97,
              }}
              transition={{
                duration: 0.15,
                ease: "easeOut",
              }}
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                width: "100%",
                background: "#1E1E1E",
                border: "1px solid #292929",
                borderRadius: 12,
                overflow: "hidden",
                zIndex: 30,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              <div
                style={{
                  maxHeight: 280,
                  overflowY: "auto",
                  padding: 5,
                }}
              >
                {options.map((option) => {
                  const active = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      style={{
                        width: "100%",
                        border: "none",
                        background: active
                          ? "rgba(255,184,0,0.08)"
                          : "transparent",
                        color: active ? "#FFB800" : "#FFFFFF",
                        borderRadius: 8,
                        padding: "8px 10px",
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "background 0.15s, color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "#292929";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
