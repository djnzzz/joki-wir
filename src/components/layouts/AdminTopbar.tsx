"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { ROUTES } from "@/config/routes";

// Page Title Map
const PAGE_TITLES: Record<string, string> = {
  [ROUTES.admin.dashboard]: "Dashboard",
  [ROUTES.admin.orders]: "Manajemen Order",
  [ROUTES.admin.games]: "Manajemen Game",
  [ROUTES.admin.services]: "Manajemen Service",
  [ROUTES.admin.joki]: "Manajemen Joki",
  [ROUTES.admin.users]: "Manajemen User",
  [ROUTES.admin.vouchers]: "Voucher & Promo",
  [ROUTES.admin.reviews]: "Moderasi Review",
  [ROUTES.admin.notifications]: "Broadcast Notifikasi",
  [ROUTES.admin.chat]: "Chat Monitor",
  [ROUTES.admin.content]: "Content Management",
  [ROUTES.admin.analytics]: "Analytics",
};

function resolveTitle(pathname: string): string {
  // Exact match
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Dynamic subroutes
  if (pathname.startsWith(ROUTES.admin.orders + "/")) return "Detail Order";
  if (pathname.startsWith(ROUTES.admin.games + "/")) return "Detail Game";
  if (pathname.startsWith(ROUTES.admin.joki + "/")) return "Detail Joki";
  if (pathname.startsWith(ROUTES.admin.users + "/")) return "Detail User";
  return "Admin Panel";
}

// Props
interface AdminTopbarProps {
  onMobileMenuToggle: () => void;
  collapsed: boolean;
  isMobile: boolean;
}

// Component
export function AdminTopbar({
  onMobileMenuToggle,
  collapsed,
  isMobile,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropOpen, setDropOpen] = useState(false);

  const title = resolveTitle(pathname);
  const name = session?.user?.name ?? "Admin";
  const email = session?.user?.email ?? "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <header
      style={{
        height: 64,
        background: "#0C0C0C",
        borderBottom: "1px solid #1E1E1E",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 14,
        position: "sticky",
        top: 0,
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      {/* ── Mobile hamburger ── */}
      {isMobile && (
        <button
          onClick={onMobileMenuToggle}
          className="topbar-icon-btn"
          style={{
            background: "transparent",
            border: "1px solid #292929",
            borderRadius: 8,
            cursor: "pointer",
            color: "#7E7D7D",
            display: "flex",
            alignItems: "center",
            padding: 6,
            transition: "border-color 0.2s, color 0.2s",
            flexShrink: 0,
          }}
        >
          <Menu size={18} />
        </button>
      )}

      {/* ── Page title ── */}
      <h1
        style={{
          flex: 1,
          fontFamily: "var(--font-display)",
          fontSize: 20,
          color: "#FFFFFF",
          letterSpacing: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
          userSelect: "none",
        }}
      >
        {title}
      </h1>

      {/* ── User button ── */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setDropOpen((o) => !o)}
          className="topbar-user-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "transparent",
            border: "1px solid #292929",
            borderRadius: 10,
            padding: "6px 10px",
            cursor: "pointer",
            transition: "border-color 0.2s",
          }}
        >
          {/* Avatar circle */}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#FFB800",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontSize: 15,
              color: "#0C0C0C",
              flexShrink: 0,
              userSelect: "none",
            }}
          >
            {initial}
          </div>

          {/* Name + role — tersembunyi di mobile */}
          {!isMobile && (
            <div style={{ textAlign: "left" }}>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 10,
                  color: "#FFB800",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Admin
              </p>
            </div>
          )}

          {/* Chevron */}
          <motion.span
            animate={{ rotate: dropOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex" }}
          >
            <ChevronDown size={13} color="#5B5B5B" />
          </motion.span>
        </button>

        {/* ── Dropdown ── */}
        <AnimatePresence>
          {dropOpen && (
            <>
              {/* Backdrop klik untuk tutup */}
              <div
                style={{ position: "fixed", inset: 0, zIndex: 29 }}
                onClick={() => setDropOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 210,
                  background: "#1E1E1E",
                  border: "1px solid #292929",
                  borderRadius: 12,
                  overflow: "hidden",
                  zIndex: 30,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}
              >
                {/* User info */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #292929",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#FFFFFF",
                    }}
                  >
                    {name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      color: "#5B5B5B",
                      marginTop: 2,
                    }}
                  >
                    {email}
                  </p>
                </div>

                {/* Logout */}
                <button
                  onClick={() => {
                    setDropOpen(false);
                    signOut({ callbackUrl: ROUTES.login });
                  }}
                  className="topbar-logout-btn"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 14px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#FF4444",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 500,
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Styles ── */}
      <style>{`
        .topbar-icon-btn:hover {
          border-color: #FFB800 !important;
          color: #FFB800 !important;
        }
        .topbar-user-btn:hover {
          border-color: #FFB800 !important;
        }
        .topbar-logout-btn:hover {
          background: rgba(255, 68, 68, 0.1) !important;
        }
      `}</style>
    </header>
  );
}
