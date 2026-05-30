"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { type ToastItem, type ToastType, useToastStore } from "./toastStore";

// Konfigurasi warna per type
const TOAST_CONFIG: Record<
  ToastType,
  { panel: string; circle: string; icon: React.ReactNode }
> = {
  sukses: {
    panel: "#00FF2F",
    circle: "#00FF2F",
    icon: <Check size={18} color="#fff" strokeWidth={3} />,
  },
  error: {
    panel: "#FF0000",
    circle: "#FF0000",
    icon: <X size={18} color="#fff" strokeWidth={3} />,
  },
  info: {
    panel: "#0077FF",
    circle: "#0077FF",
    icon: (
      <span
        style={{
          color: "#fff",
          fontFamily: "var(--font-body)",
          fontWeight: 800,
          fontSize: 20,
          lineHeight: 1,
        }}
      >
        i
      </span>
    ),
  },
  warning: {
    panel: "#FFB800",
    circle: "#FFB800",
    icon: (
      <span
        style={{
          color: "#fff",
          fontFamily: "var(--font-body)",
          fontWeight: 800,
          fontSize: 20,
          lineHeight: 1,
        }}
      >
        !
      </span>
    ),
  },
};

// Circumference lingkaran SVG (r=22 → 2πr ≈ 138.2)
const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ToastProps {
  toast: ToastItem;
}

export function Toast({ toast }: ToastProps) {
  const remove = useToastStore((s) => s.remove);
  const config = TOAST_CONFIG[toast.type];
  const duration = toast.duration ?? 4000;

  // Track progress untuk stroke animation
  const [progress, setProgress] = useState(0); // 0 → 1
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const [visible, setVisible] = useState(true);

  // Animasi stroke & auto-dismiss
  useEffect(() => {
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Auto dismiss
        setVisible(false);
        setTimeout(() => remove(toast.id), 300);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration, toast.id, remove]);

  const handleClose = () => {
    cancelAnimationFrame(rafRef.current);
    setVisible(false);
    setTimeout(() => remove(toast.id), 300);
  };

  // stroke-dashoffset: CIRCUMFERENCE (empty) → 0 (full) as progress 0→1
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          style={{
            position: "relative",
            width: 420,
            maxWidth: "calc(100vw - 32px)",
            height: 96,
            background: "#292929",
            borderRadius: 15,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {/* Side panel warna */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 11,
              height: "100%",
              background: config.panel,
              borderRadius: "15px 0 0 15px",
            }}
          />

          {/* Icon circle */}
          <div
            style={{
              marginLeft: 30,
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: config.circle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {config.icon}
          </div>

          {/* Teks */}
          <div style={{ flex: 1, marginLeft: 14, marginRight: 12 }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 16,
                color: "#FFFFFF",
                lineHeight: 1.2,
              }}
            >
              {toast.title}
            </p>
            {toast.description && (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 400,
                  fontSize: 13,
                  color: "#7E7D7D",
                  marginTop: 3,
                  lineHeight: 1.3,
                }}
              >
                {toast.description}
              </p>
            )}
          </div>

          {/* Timer circle + close button */}
          <div
            style={{
              position: "relative",
              width: 50,
              height: 50,
              marginRight: 14,
              flexShrink: 0,
              cursor: "pointer",
            }}
            onClick={handleClose}
          >
            {/* SVG timer ring */}
            <svg
              width={50}
              height={50}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: "rotate(-90deg)",
              }}
            >
              {/* Track */}
              <circle
                cx={25}
                cy={25}
                r={RADIUS}
                fill="none"
                stroke="#7E7D7D"
                strokeWidth={3}
                strokeOpacity={0.4}
              />
              {/* Progress */}
              <circle
                cx={25}
                cy={25}
                r={RADIUS}
                fill="none"
                stroke="#7E7D7D"
                strokeWidth={3}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            {/* X icon di tengah */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={14} color="#7E7D7D" strokeWidth={2.5} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
