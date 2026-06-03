"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Package,
} from "lucide-react";
import { ROUTES } from "@/config/routes";

// Types
type OrderStatus =
  | "PENDING"
  | "AWAITING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DONE"
  | "CANCELLED"
  | "REFUNDED";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

interface OrderItem {
  id: string;
  serviceName: string;
  gameName: string;
  priceSnapshot: number;
  quantity: number;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  finalAmount: number;
  createdAt: string;
  paidAt: string | null;
  user: { id: string; name: string; email: string };
  joki: { id: string; name: string } | null;
  items: OrderItem[];
  payment: { status: PaymentStatus; snapToken: string | null } | null;
}

interface OrderMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Constants
const STATUS_TABS: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "AWAITING", label: "Awaiting" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

const STATUS_COLOR: Record<OrderStatus, { bg: string; text: string }> = {
  PENDING: { bg: "rgba(126,125,125,0.15)", text: "#7E7D7D" },
  AWAITING: { bg: "rgba(255,184,0,0.15)", text: "#FFB800" },
  ASSIGNED: { bg: "rgba(0,119,255,0.15)", text: "#0077FF" },
  IN_PROGRESS: { bg: "rgba(255,136,0,0.15)", text: "#FF8800" },
  COMPLETED: { bg: "rgba(0,204,102,0.15)", text: "#00CC66" },
  DONE: { bg: "rgba(0,255,47,0.12)", text: "#00FF2F" },
  CANCELLED: { bg: "rgba(255,51,51,0.15)", text: "#FF3333" },
  REFUNDED: { bg: "rgba(204,68,255,0.15)", text: "#CC44FF" },
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  AWAITING: "Awaiting",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DONE: "Done",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const PAY_COLOR: Record<PaymentStatus, string> = {
  PENDING: "#7E7D7D",
  PAID: "#00CC66",
  FAILED: "#FF3333",
  EXPIRED: "#FF8800",
  REFUNDED: "#CC44FF",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

/*const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });*/

// StatusBadge
function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_COLOR[status] ?? { bg: "#1E1E1E", text: "#7E7D7D" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        background: c.bg,
        fontFamily: "var(--font-body)",
        fontSize: 11,
        fontWeight: 600,
        color: c.text,
        whiteSpace: "nowrap",
        letterSpacing: "0.03em",
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// Main Page
export default function AdminOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [meta, setMeta] = useState<OrderMeta>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const activeTab = (searchParams.get("status") ?? "ALL") as
    | OrderStatus
    | "ALL";
  const currentPage = parseInt(searchParams.get("page") ?? "1");

  // Sync URL params on change
  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null) params.delete(k);
        else params.set(k, v);
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);
      params.set("page", String(currentPage));
      params.set("limit", "15");
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const json = await res.json();
      const body = json.data ?? json;
      setOrders(body.orders ?? []);
      setMeta(body.meta ?? { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, search]);

  useEffect(() => {
    const load = async () => {
      await fetchOrders();
    };

    load();
  }, [fetchOrders]);

  // Search — debounce 400 ms
  useEffect(() => {
    const t = setTimeout(() => {
      updateParams({ search: search || null, page: "1" });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Filter Bar ── */}
      <div
        style={{
          background: "#0C0C0C",
          border: "1px solid #1E1E1E",
          borderRadius: 16,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#1E1E1E",
            border: "1px solid #292929",
            borderRadius: 8,
            padding: "7px 12px",
            flex: "1 1 200px",
            maxWidth: 280,
          }}
        >
          <Search size={14} color="#5B5B5B" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. order…"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "#FFFFFF",
              width: "100%",
            }}
          />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchOrders}
          style={{
            background: "transparent",
            border: "1px solid #292929",
            borderRadius: 8,
            padding: "7px 10px",
            cursor: "pointer",
            color: "#5B5B5B",
            display: "flex",
            alignItems: "center",
          }}
          className="orders-icon-btn"
        >
          <RefreshCw size={14} />
        </button>

        {/* Total badge */}
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "#5B5B5B",
            marginLeft: "auto",
          }}
        >
          {meta.total} order
        </span>
      </div>

      {/* ── Status Tabs ── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 2,
          scrollbarWidth: "none",
        }}
      >
        {STATUS_TABS.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() =>
                updateParams({
                  status: tab.value === "ALL" ? null : tab.value,
                  page: "1",
                })
              }
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1px solid ${active ? "#FFB800" : "#292929"}`,
                background: active ? "#FFB800" : "transparent",
                color: active ? "#0C0C0C" : "#7E7D7D",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: active ? 700 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div
        style={{
          background: "#0C0C0C",
          border: "1px solid #1E1E1E",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr 1fr 110px 100px 100px 44px",
            gap: 0,
            padding: "10px 16px",
            borderBottom: "1px solid #1E1E1E",
            background: "#0C0C0C",
          }}
        >
          {[
            "No. Order",
            "Customer",
            "Layanan",
            "Status",
            "Bayar",
            "Nominal",
            "",
          ].map((h, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 500,
                color: "#5B5B5B",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <AnimatePresence mode="wait">
          {loading ? (
            <TableSkeleton key="skeleton" />
          ) : orders.length === 0 ? (
            <EmptyState key="empty" />
          ) : (
            <motion.div
              key="rows"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {orders.map((order, i) => (
                <div
                  key={order.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 1fr 1fr 110px 100px 100px 44px",
                    gap: 0,
                    padding: "12px 16px",
                    borderBottom:
                      i < orders.length - 1 ? "1px solid #1E1E1E" : "none",
                    alignItems: "center",
                    transition: "background 0.12s",
                  }}
                  className="order-row"
                >
                  {/* Order number */}
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "#FFB800",
                      fontWeight: 600,
                    }}
                  >
                    {order.orderNumber}
                  </span>

                  {/* Customer */}
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {order.user.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        color: "#5B5B5B",
                      }}
                    >
                      {order.user.email}
                    </p>
                  </div>

                  {/* Layanan (items preview) */}
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        color: "#FFFFFF",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {order.items[0]?.serviceName ?? "—"}
                    </p>
                    {order.items.length > 1 && (
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 11,
                          color: "#5B5B5B",
                        }}
                      >
                        +{order.items.length - 1} lainnya
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        color: "#5B5B5B",
                      }}
                    >
                      {order.items[0]?.gameName}
                    </p>
                  </div>

                  {/* Order status */}
                  <StatusBadge status={order.status} />

                  {/* Payment status */}
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      fontWeight: 600,
                      color: PAY_COLOR[order.payment?.status ?? "PENDING"],
                    }}
                  >
                    {order.payment?.status ?? "—"}
                  </span>

                  {/* Amount */}
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#FFFFFF",
                    }}
                  >
                    {fmt(order.finalAmount)}
                  </span>

                  {/* Action */}
                  <Link
                    href={ROUTES.admin.order(order.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      border: "1px solid #292929",
                      color: "#7E7D7D",
                      textDecoration: "none",
                      transition: "border-color 0.15s, color 0.15s",
                    }}
                    className="order-view-btn"
                  >
                    <Eye size={14} />
                  </Link>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Pagination ── */}
      {meta.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#5B5B5B",
            }}
          >
            Hal. {meta.page} / {meta.totalPages} &nbsp;·&nbsp; {meta.total}{" "}
            total
          </span>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              disabled={meta.page <= 1}
              onClick={() => updateParams({ page: String(meta.page - 1) })}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 10px",
                background: "transparent",
                border: "1px solid #292929",
                borderRadius: 8,
                cursor: meta.page <= 1 ? "not-allowed" : "pointer",
                color: meta.page <= 1 ? "#292929" : "#7E7D7D",
                gap: 4,
                fontFamily: "var(--font-body)",
                fontSize: 12,
              }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => updateParams({ page: String(meta.page + 1) })}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 10px",
                background: "transparent",
                border: "1px solid #292929",
                borderRadius: 8,
                cursor:
                  meta.page >= meta.totalPages ? "not-allowed" : "pointer",
                color: meta.page >= meta.totalPages ? "#292929" : "#7E7D7D",
                gap: 4,
                fontFamily: "var(--font-body)",
                fontSize: 12,
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        .order-row:hover { background: #0F0F0F !important; }
        .order-view-btn:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        .orders-icon-btn:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        nav div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

// Helpers
function TableSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-pulse"
          style={{
            height: 52,
            margin: "1px 16px",
            borderRadius: 6,
            background: "#1E1E1E",
            marginBottom: i < 7 ? 1 : 0,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .skeleton-pulse { animation: pulse 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        padding: "52px 0",
        textAlign: "center",
      }}
    >
      <Package size={32} color="#292929" style={{ margin: "0 auto 10px" }} />
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "#5B5B5B",
        }}
      >
        Tidak ada order ditemukan
      </p>
    </motion.div>
  );
}
