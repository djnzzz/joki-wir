"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  UserCheck,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
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
  category: string;
  priceSnapshot: number;
  quantity: number;
}

interface ProgressLog {
  id: string;
  step: string;
  note: string | null;
  proofUrl: string | null;
  createdAt: string;
  joki: { name: string };
}

interface Review {
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
  voucherCode: string | null;
  gameAccount: string | null;
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  assignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  doneAt: string | null;
  user: { id: string; name: string; email: string };
  joki: { id: string; name: string; email: string } | null;
  items: OrderItem[];
  payment: {
    status: PaymentStatus;
    amount: number;
    paidAt: string | null;
  } | null;
  progress: ProgressLog[];
  review: Review | null;
  chatRoom: { id: string; isOpen: boolean } | null;
}

interface JokiUser {
  id: string;
  name: string;
  email: string;
  _count: { jokiOrders: number };
}

// Constants
const STATUS_COLOR: Record<
  OrderStatus,
  { bg: string; text: string; border: string }
> = {
  PENDING: { bg: "rgba(126,125,125,0.1)", text: "#7E7D7D", border: "#292929" },
  AWAITING: { bg: "rgba(255,184,0,0.1)", text: "#FFB800", border: "#FFB800" },
  ASSIGNED: { bg: "rgba(0,119,255,0.1)", text: "#0077FF", border: "#0077FF" },
  IN_PROGRESS: {
    bg: "rgba(255,136,0,0.1)",
    text: "#FF8800",
    border: "#FF8800",
  },
  COMPLETED: { bg: "rgba(0,204,102,0.1)", text: "#00CC66", border: "#00CC66" },
  DONE: { bg: "rgba(0,255,47,0.08)", text: "#00FF2F", border: "#00FF2F" },
  CANCELLED: { bg: "rgba(255,51,51,0.1)", text: "#FF3333", border: "#FF3333" },
  REFUNDED: { bg: "rgba(204,68,255,0.1)", text: "#CC44FF", border: "#CC44FF" },
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

// State machine: apa yang bisa dilakukan admin dari status ini
const ADMIN_ACTIONS: Partial<
  Record<
    OrderStatus,
    {
      label: string;
      to: OrderStatus;
      variant: "primary" | "danger" | "success";
    }[]
  >
> = {
  PENDING: [{ label: "Batalkan Order", to: "CANCELLED", variant: "danger" }],
  AWAITING: [{ label: "Batalkan Order", to: "CANCELLED", variant: "danger" }],
  ASSIGNED: [
    { label: "Mulai Pengerjaan", to: "IN_PROGRESS", variant: "primary" },
  ],
  IN_PROGRESS: [
    { label: "Tandai Selesai", to: "COMPLETED", variant: "success" },
  ],
  COMPLETED: [{ label: "Konfirmasi Done", to: "DONE", variant: "success" }],
  CANCELLED: [{ label: "Proses Refund", to: "REFUNDED", variant: "primary" }],
};

// Helpers
const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// Sub-components
function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#0C0C0C",
        border: "1px solid #1E1E1E",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid #1E1E1E",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          {title}
        </p>
        {action}
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        padding: "7px 0",
        borderBottom: "1px solid #0F0F0F",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: "#5B5B5B",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: "#FFFFFF",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Main Page
export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { showToast } = useToast();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [jokiList, setJokiList] = useState<JokiUser[]>([]);
  const [selJoki, setSelJoki] = useState<string>("");
  const [jokiOpen, setJokiOpen] = useState(false);

  const [assigning, setAssigning] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const reloadOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const json = await res.json();
      setOrder(json.data ?? json);
    } catch {
      setOrder(null);
    }
  };

  // Fetch joki list (untuk dropdown assign)
  useEffect(() => {
    fetch("/api/admin/joki?active=true")
      .then((r) => r.json())
      .then((json) => {
        const body = json.data ?? json;
        setJokiList(body.joki ?? body.users ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const json = await res.json();

        if (!mounted) return;

        setOrder(json.data ?? json);
      } catch {
        if (!mounted) return;
        setOrder(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadOrder();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Assign joki
  const handleAssign = async () => {
    if (!selJoki) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jokiId: selJoki }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal assign joki");
      showToast({ type: "sukses", title: "Joki berhasil di-assign!" });
      setJokiOpen(false);
      await reloadOrder();
    } catch (e: unknown) {
      showToast({
        type: "error",
        title: "Gagal assign",
        description: e instanceof Error ? e.message : "Terjadi kesalahan",
      });
    } finally {
      setAssigning(false);
    }
  };

  // Update order status
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal update status");
      showToast({
        type: "sukses",
        title: `Status diubah ke ${STATUS_LABEL[newStatus]}`,
      });
      await reloadOrder();
    } catch (e: unknown) {
      showToast({
        type: "error",
        title: "Gagal update status",
        description: e instanceof Error ? e.message : "Terjadi kesalahan",
      });
    } finally {
      setStatusBusy(false);
      setConfirmCancel(false);
    }
  };

  // Render loading
  if (loading) return <DetailSkeleton />;
  if (!order)
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "#5B5B5B",
            fontSize: 14,
          }}
        >
          Order tidak ditemukan.
        </p>
        <Link
          href={ROUTES.admin.orders}
          style={{
            color: "#FFB800",
            fontSize: 13,
            fontFamily: "var(--font-body)",
          }}
        >
          ← Kembali ke daftar order
        </Link>
      </div>
    );

  const sc = STATUS_COLOR[order.status];
  const actions = ADMIN_ACTIONS[order.status] ?? [];

  const selectedJoki = jokiList.find((j) => j.id === selJoki);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Back + Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <Link
          href={ROUTES.admin.orders}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#7E7D7D",
            textDecoration: "none",
            padding: "7px 12px",
            border: "1px solid #292929",
            borderRadius: 8,
            transition: "color 0.15s, border-color 0.15s",
            flexShrink: 0,
          }}
          className="back-btn"
        >
          <ArrowLeft size={14} /> Kembali
        </Link>

        {/* Order number + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                color: "#FFFFFF",
                letterSpacing: 1,
              }}
            >
              {order.orderNumber}
            </h2>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                background: sc.bg,
                border: `1px solid ${sc.border}`,
                color: sc.text,
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              {STATUS_LABEL[order.status]}
            </span>

            {/* Chat shortcut */}
            {order.chatRoom && (
              <Link
                href={ROUTES.admin.chat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  border: "1px solid #292929",
                  borderRadius: 8,
                  color: "#5B5B5B",
                  fontSize: 11,
                  fontFamily: "var(--font-body)",
                  textDecoration: "none",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                className="chat-link"
              >
                <MessageSquare size={12} /> Chat
              </Link>
            )}
          </div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#5B5B5B",
              marginTop: 4,
            }}
          >
            Dibuat {fmtDate(order.createdAt)}
          </p>
        </div>
      </div>

      {/* ── Main Grid: left (detail) + right (actions) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* ── Left Column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Order items */}
          <SectionCard title="Layanan Dipesan">
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {order.items.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom:
                      i < order.items.length - 1 ? "1px solid #1E1E1E" : "none",
                    gap: 12,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {item.serviceName}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        color: "#5B5B5B",
                        marginTop: 2,
                      }}
                    >
                      {item.gameName} · {item.category}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#FFB800",
                      flexShrink: 0,
                    }}
                  >
                    {fmt(item.priceSnapshot)}
                  </span>
                </div>
              ))}

              {/* Subtotal / diskon / total */}
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid #1E1E1E",
                }}
              >
                <InfoRow label="Subtotal" value={fmt(order.subtotal)} />
                {order.discountAmount > 0 && (
                  <InfoRow
                    label={`Diskon${order.voucherCode ? ` (${order.voucherCode})` : ""}`}
                    value={
                      <span style={{ color: "#00CC66" }}>
                        -{fmt(order.discountAmount)}
                      </span>
                    }
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0 0",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#FFFFFF",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 18,
                      color: "#FFB800",
                    }}
                  >
                    {fmt(order.finalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Progress log */}
          <SectionCard title={`Progress Log (${order.progress.length})`}>
            {order.progress.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "#5B5B5B",
                }}
              >
                Belum ada log progress dari joki.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  position: "relative",
                  paddingLeft: 20,
                }}
              >
                {/* Timeline line */}
                <div
                  style={{
                    position: "absolute",
                    left: 6,
                    top: 6,
                    bottom: 6,
                    width: 1,
                    background: "#1E1E1E",
                  }}
                />

                {order.progress.map((p) => (
                  <div key={p.id} style={{ position: "relative" }}>
                    {/* Timeline dot */}
                    <div
                      style={{
                        position: "absolute",
                        left: -20,
                        top: 5,
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#FFB800",
                        border: "2px solid #0C0C0C",
                      }}
                    />
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#FFFFFF",
                      }}
                    >
                      {p.step}
                    </p>
                    {p.note && (
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 11,
                          color: "#7E7D7D",
                          marginTop: 2,
                        }}
                      >
                        {p.note}
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginTop: 4,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 10,
                          color: "#5B5B5B",
                        }}
                      >
                        {p.joki.name} · {fmtDate(p.createdAt)}
                      </span>
                      {p.proofUrl && (
                        <a
                          href={p.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10,
                            color: "#0077FF",
                            fontFamily: "var(--font-body)",
                            textDecoration: "none",
                          }}
                        >
                          <ImageIcon size={10} /> Lihat bukti
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Review */}
          {order.review && (
            <SectionCard title="Review User">
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 16,
                      color: i < order.review!.rating ? "#FFB800" : "#292929",
                    }}
                  >
                    ★
                  </span>
                ))}
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "#5B5B5B",
                    marginLeft: 6,
                  }}
                >
                  {fmtDate(order.review.createdAt)}
                </span>
              </div>
              {order.review.comment && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "#FFFFFF",
                    lineHeight: 1.5,
                  }}
                >
                  {order.review.comment}
                </p>
              )}
            </SectionCard>
          )}
        </div>

        {/* ── Right Column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Customer info */}
          <SectionCard title="Customer">
            <InfoRow label="Nama" value={order.user.name} />
            <InfoRow label="Email" value={order.user.email} />
          </SectionCard>

          {/* Joki info */}
          <SectionCard title="Joki">
            {order.joki ? (
              <>
                <InfoRow label="Nama" value={order.joki.name} />
                <InfoRow label="Email" value={order.joki.email} />
              </>
            ) : (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "#5B5B5B",
                }}
              >
                Belum di-assign
              </p>
            )}
          </SectionCard>

          {/* Assign Joki — hanya saat AWAITING */}
          {order.status === "AWAITING" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "rgba(255,184,0,0.06)",
                border: "1px solid rgba(255,184,0,0.3)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid rgba(255,184,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <UserCheck size={15} color="#FFB800" />
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#FFB800",
                  }}
                >
                  Assign Joki
                </p>
              </div>

              <div
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {/* Dropdown */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setJokiOpen((o) => !o)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "#1E1E1E",
                      border: "1px solid #292929",
                      borderRadius: 8,
                      cursor: "pointer",
                      color: selJoki ? "#FFFFFF" : "#5B5B5B",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                    }}
                  >
                    <span>
                      {selJoki
                        ? `${selectedJoki?.name ?? "—"} (${selectedJoki?._count?.jokiOrders ?? 0} aktif)`
                        : "Pilih joki…"}
                    </span>
                    <motion.span
                      animate={{ rotate: jokiOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={14} color="#5B5B5B" />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {jokiOpen && (
                      <>
                        <div
                          style={{ position: "fixed", inset: 0, zIndex: 10 }}
                          onClick={() => setJokiOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            left: 0,
                            right: 0,
                            background: "#1E1E1E",
                            border: "1px solid #292929",
                            borderRadius: 8,
                            zIndex: 20,
                            maxHeight: 200,
                            overflowY: "auto",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                          }}
                        >
                          {jokiList.length === 0 && (
                            <div
                              style={{
                                padding: "12px",
                                fontFamily: "var(--font-body)",
                                fontSize: 12,
                                color: "#5B5B5B",
                              }}
                            >
                              Tidak ada joki tersedia
                            </div>
                          )}
                          {jokiList.map((j) => (
                            <button
                              key={j.id}
                              onClick={() => {
                                setSelJoki(j.id);
                                setJokiOpen(false);
                              }}
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "9px 12px",
                                background:
                                  selJoki === j.id
                                    ? "rgba(255,184,0,0.1)"
                                    : "transparent",
                                border: "none",
                                cursor: "pointer",
                                textAlign: "left",
                                borderBottom: "1px solid #292929",
                                transition: "background 0.12s",
                              }}
                              className="joki-opt"
                            >
                              <span
                                style={{
                                  fontFamily: "var(--font-body)",
                                  fontSize: 12,
                                  color: "#FFFFFF",
                                }}
                              >
                                {j.name}
                              </span>
                              <span
                                style={{
                                  fontFamily: "var(--font-body)",
                                  fontSize: 11,
                                  color: "#5B5B5B",
                                }}
                              >
                                {j._count?.jokiOrders ?? 0} aktif
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Assign button */}
                <button
                  onClick={handleAssign}
                  disabled={!selJoki || assigning}
                  style={{
                    width: "100%",
                    height: 42,
                    borderRadius: 8,
                    border: "none",
                    background: !selJoki || assigning ? "#292929" : "#FFB800",
                    color: !selJoki || assigning ? "#5B5B5B" : "#0C0C0C",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: !selJoki || assigning ? "not-allowed" : "pointer",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {assigning ? "Mengassign…" : "Assign Joki"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Payment info */}
          <SectionCard title="Pembayaran">
            <InfoRow
              label="Status"
              value={
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 600,
                    color:
                      order.payment?.status === "PAID"
                        ? "#00CC66"
                        : order.payment?.status === "FAILED"
                          ? "#FF3333"
                          : "#FFB800",
                  }}
                >
                  {order.payment?.status ?? "—"}
                </span>
              }
            />
            <InfoRow
              label="Nominal"
              value={fmt(order.payment?.amount ?? order.finalAmount)}
            />
            <InfoRow
              label="Dibayar"
              value={fmtDate(order.payment?.paidAt ?? null)}
            />
          </SectionCard>

          {/* Timeline */}
          <SectionCard title="Timeline">
            {[
              { label: "Dibuat", value: order.createdAt },
              { label: "Dibayar", value: order.paidAt },
              { label: "Di-assign", value: order.assignedAt },
              { label: "Dimulai", value: order.startedAt },
              { label: "Selesai", value: order.completedAt },
              { label: "Dikonfirmasi", value: order.doneAt },
            ].map((t) => (
              <InfoRow
                key={t.label}
                label={t.label}
                value={
                  <span style={{ color: t.value ? "#FFFFFF" : "#292929" }}>
                    {fmtDate(t.value)}
                  </span>
                }
              />
            ))}
          </SectionCard>

          {/* Game account / notes */}
          {(order.gameAccount || order.notes) && (
            <SectionCard title="Info Tambahan">
              {order.gameAccount && (
                <div style={{ marginBottom: 10 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      color: "#5B5B5B",
                      marginBottom: 4,
                    }}
                  >
                    Game Account
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "#FFFFFF",
                      background: "#1E1E1E",
                      padding: "8px 10px",
                      borderRadius: 6,
                      wordBreak: "break-all",
                    }}
                  >
                    {order.gameAccount}
                  </p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      color: "#5B5B5B",
                      marginBottom: 4,
                    }}
                  >
                    Catatan
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "#FFFFFF",
                      lineHeight: 1.5,
                    }}
                  >
                    {order.notes}
                  </p>
                </div>
              )}
            </SectionCard>
          )}

          {/* Admin action buttons */}
          {(actions.length > 0 || order.status === "AWAITING") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {actions.map((a) => {
                const isCancel = a.to === "CANCELLED";
                /*const isPrimary =
                  a.variant === "primary" || a.variant === "success";*/

                if (isCancel && !confirmCancel) {
                  return (
                    <button
                      key={a.to}
                      onClick={() => setConfirmCancel(true)}
                      disabled={statusBusy}
                      style={{
                        width: "100%",
                        height: 40,
                        borderRadius: 8,
                        border: "1px solid #FF3333",
                        background: "transparent",
                        color: "#FF3333",
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: statusBusy ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        opacity: statusBusy ? 0.5 : 1,
                        transition: "background 0.15s",
                      }}
                      className="cancel-btn"
                    >
                      <AlertTriangle size={13} /> {a.label}
                    </button>
                  );
                }

                if (isCancel && confirmCancel) {
                  return (
                    <div
                      key={a.to}
                      style={{
                        background: "rgba(255,51,51,0.08)",
                        border: "1px solid rgba(255,51,51,0.3)",
                        borderRadius: 10,
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          color: "#FF3333",
                          fontWeight: 600,
                        }}
                      >
                        Yakin batalkan order ini?
                      </p>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleStatusUpdate("CANCELLED")}
                          disabled={statusBusy}
                          style={{
                            flex: 1,
                            height: 34,
                            borderRadius: 6,
                            border: "none",
                            background: "#FF3333",
                            color: "#FFFFFF",
                            fontFamily: "var(--font-body)",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: statusBusy ? "not-allowed" : "pointer",
                          }}
                        >
                          {statusBusy ? "…" : "Ya, batalkan"}
                        </button>
                        <button
                          onClick={() => setConfirmCancel(false)}
                          style={{
                            flex: 1,
                            height: 34,
                            borderRadius: 6,
                            border: "1px solid #292929",
                            background: "transparent",
                            color: "#7E7D7D",
                            fontFamily: "var(--font-body)",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={a.to}
                    onClick={() => handleStatusUpdate(a.to)}
                    disabled={statusBusy}
                    style={{
                      width: "100%",
                      height: 40,
                      borderRadius: 8,
                      border: "none",
                      background:
                        a.variant === "success" ? "#00CC66" : "#FFB800",
                      color: "#0C0C0C",
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: statusBusy ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      opacity: statusBusy ? 0.6 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {statusBusy ? (
                      "Memproses…"
                    ) : a.variant === "success" ? (
                      <>
                        <CheckCircle2 size={13} /> {a.label}
                      </>
                    ) : (
                      a.label
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Styles ── */}
      <style>{`
        .back-btn:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        .chat-link:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        .joki-opt:hover { background: rgba(255,184,0,0.08) !important; }
        .cancel-btn:hover { background: rgba(255,51,51,0.08) !important; }
        @media (max-width: 900px) {
          [style*="grid-template-columns: 1fr 320px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// Skeleton
function DetailSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="sp" style={{ height: 40, width: 200, borderRadius: 8 }} />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="sp" style={{ height: 200, borderRadius: 16 }} />
          <div className="sp" style={{ height: 120, borderRadius: 16 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="sp" style={{ height: 90, borderRadius: 16 }} />
          <div className="sp" style={{ height: 140, borderRadius: 16 }} />
        </div>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .sp { background: #1E1E1E; animation: pulse 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
