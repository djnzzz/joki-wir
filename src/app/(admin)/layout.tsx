"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/layouts/AdminSidebar";
import { AdminTopbar } from "@/components/layouts/AdminTopbar";

const W_EXPANDED = 248;
const W_COLLAPSED = 68;
const BREAKPOINT = 768; // px — titik pisah mobile/desktop

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    return localStorage.getItem("jokiwir-admin-sidebar") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.innerWidth < BREAKPOINT;
  });

  // Detect mobile & listen resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < BREAKPOINT;

      setIsMobile(mobile);

      if (!mobile) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;

      localStorage.setItem("jokiwir-admin-sidebar", String(next));

      return next;
    });
  };

  const marginLeft = isMobile ? 0 : collapsed ? W_COLLAPSED : W_EXPANDED;

  return (
    <div style={{ minHeight: "100dvh", background: "#000000" }}>
      {/* ── Sidebar ── */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />

      {/* ── Main content: topbar + page content ── */}
      <div
        style={{
          marginLeft,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <AdminTopbar
          onMobileMenuToggle={() => setMobileOpen((o) => !o)}
          collapsed={collapsed}
          isMobile={isMobile}
        />

        <main
          style={{
            flex: 1,
            padding: "24px 28px",
            minWidth: 0,
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
