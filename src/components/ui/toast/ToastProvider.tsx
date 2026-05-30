"use client";

import { useToastStore } from "./toastStore";
import { Toast } from "./Toast";

export function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: "auto" }}>
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
}
