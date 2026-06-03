"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Gamepad2,
  ListChecks,
  Users2,
  UserCog,
  Star,
  Ticket,
  Bell,
  MessageSquare,
  FileText,
  BarChart3,
  ChevronLeft,
} from "lucide-react";
import Image from "next/image";
import { ROUTES } from "@/config/routes";

// Types
interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface MenuGroup {
  label: string | null;
  items: MenuItem[];
}

// Menu Data
const MENU: MenuGroup[] = [
  {
    label: null,
    items: [
      {
        href: ROUTES.admin.dashboard,
        icon: LayoutDashboard,
        label: "Dashboard",
      },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: ROUTES.admin.orders, icon: Package, label: "Orders" },
      { href: ROUTES.admin.joki, icon: Users2, label: "Joki" },
    ],
  },
  {
    label: "Katalog",
    items: [
      { href: ROUTES.admin.games, icon: Gamepad2, label: "Games" },
      { href: ROUTES.admin.services, icon: ListChecks, label: "Services" },
    ],
  },
  {
    label: "Pengguna",
    items: [
      { href: ROUTES.admin.users, icon: UserCog, label: "Users" },
      { href: ROUTES.admin.reviews, icon: Star, label: "Reviews" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: ROUTES.admin.vouchers, icon: Ticket, label: "Vouchers" },
      { href: ROUTES.admin.notifications, icon: Bell, label: "Notifikasi" },
      { href: ROUTES.admin.chat, icon: MessageSquare, label: "Chat" },
      { href: ROUTES.admin.content, icon: FileText, label: "Content" },
      { href: ROUTES.admin.analytics, icon: BarChart3, label: "Analytics" },
    ],
  },
];

// Lebar sidebar
const W_EXPANDED = 248;
const W_COLLAPSED = 68;

// Props
interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  isMobile: boolean;
}

// Component
export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  isMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // Active check: dashboard hanya exact match, sisanya prefix
  const isActive = (href: string) =>
    href === ROUTES.admin.dashboard
      ? pathname === href
      : pathname.startsWith(href);

  // Mode collapsed hanya berlaku di desktop
  const showCollapsed = collapsed && !isMobile;

  return (
    <>
      {/* ── Mobile Backdrop ── */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            key="sb-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onMobileClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              zIndex: 40,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile ? (mobileOpen ? 0 : -W_EXPANDED) : 0,
          width: isMobile
            ? W_EXPANDED
            : showCollapsed
              ? W_COLLAPSED
              : W_EXPANDED,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100dvh",
          background: "#0C0C0C",
          borderRight: "1px solid #1E1E1E",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          willChange: "width, transform",
        }}
      >
        {/* ── Logo ── */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            borderBottom: "1px solid #1E1E1E",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <AnimatePresence mode="wait">
            {showCollapsed ? (
              <motion.div
                key="logo-short"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  src="/logo/jw.png"
                  alt="JW"
                  width={36}
                  height={36}
                  priority
                  style={{
                    objectFit: "contain",
                    userSelect: "none",
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  width: "100%",
                  marginLeft: -8,
                }}
              >
                <Image
                  src="/logo/jokiwir.png"
                  alt="JokiWir"
                  width={170}
                  height={48}
                  priority
                  style={{
                    objectFit: "contain",
                    userSelect: "none",
                  }}
                />
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    color: "#5B5B5B",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginTop: 2,
                    userSelect: "none",
                  }}
                >
                  Admin Panel
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Navigation ── */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "8px 0",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {MENU.map((group, gi) => (
            <div key={gi}>
              {/* Group separator */}
              {group.label && (
                <div
                  style={{
                    padding: showCollapsed ? "6px 0" : "10px 0 4px",
                  }}
                >
                  {showCollapsed ? (
                    <div
                      style={{
                        height: 1,
                        background: "#1E1E1E",
                        margin: "0 12px",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 10,
                        fontWeight: 500,
                        color: "#5B5B5B",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "0 16px",
                        whiteSpace: "nowrap",
                        userSelect: "none",
                      }}
                    >
                      {group.label}
                    </span>
                  )}
                </div>
              )}

              {/* Items */}
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <div
                    key={item.href}
                    style={{ position: "relative", padding: "2px 8px" }}
                    className="sb-item-wrap"
                  >
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      className={`sb-link${active ? " sb-active" : ""}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: showCollapsed ? "11px 0" : "10px 12px",
                        borderRadius: 10,
                        textDecoration: "none",
                        background: active ? "#1E1E1E" : "transparent",
                        color: active ? "#FFB800" : "#7E7D7D",
                        borderLeft:
                          active && !showCollapsed
                            ? "3px solid #FFB800"
                            : "3px solid transparent",
                        justifyContent: showCollapsed ? "center" : "flex-start",
                        transition:
                          "background 0.15s, color 0.15s, border-color 0.15s",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      <Icon
                        size={18}
                        strokeWidth={active ? 2.5 : 1.8}
                        style={{ flexShrink: 0 }}
                      />

                      <AnimatePresence>
                        {!showCollapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: 13,
                              fontWeight: active ? 700 : 400,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>

                    {/* Tooltip — hanya saat collapsed desktop */}
                    {showCollapsed && (
                      <span className="sb-tooltip" role="tooltip">
                        {item.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Collapse Toggle — Desktop only ── */}
        {!isMobile && (
          <div
            style={{
              borderTop: "1px solid #1E1E1E",
              padding: "10px 8px",
              flexShrink: 0,
            }}
          >
            <button
              onClick={onToggleCollapse}
              className="sb-collapse-btn"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: showCollapsed ? "center" : "flex-start",
                gap: 10,
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                color: "#5B5B5B",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <motion.span
                animate={{ rotate: showCollapsed ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{ display: "flex", flexShrink: 0 }}
              >
                <ChevronLeft size={16} />
              </motion.span>

              <AnimatePresence>
                {!showCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Tutup Menu
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        )}
      </motion.aside>

      {/* ── Styles ── */}
      <style>{`
        /* Hover states */
        .sb-link:hover:not(.sb-active) {
          background: #1E1E1E !important;
          color: #FFFFFF !important;
        }
        .sb-collapse-btn:hover {
          background: #1E1E1E !important;
          color: #FFFFFF !important;
        }

        /* Hide scrollbar webkit */
        aside nav::-webkit-scrollbar {
          display: none;
        }

        /* Tooltip */
        .sb-tooltip {
          position: absolute;
          left: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
          background: #1E1E1E;
          border: 1px solid #292929;
          color: #FFFFFF;
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s;
          z-index: 100;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
        }
        .sb-item-wrap:hover .sb-tooltip {
          opacity: 1;
        }
      `}</style>
    </>
  );
}
