"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Star,
  BarChart2,
} from "lucide-react";

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

interface DashboardData {
  summary: {
    totalOrders: number;
    ordersThisMonth: number;
    orderGrowth: number;
    revenueThisMonth: number;
    revenueGrowth: number;
    totalUsers: number;
    activeJoki: number;
    avgRating: number;
    totalReviews: number;
  };
  ordersByStatus: { status: OrderStatus; count: number }[];
  revenueByGame: {
    gameName: string;
    _sum: { priceSnapshot: number | null };
    _count: number;
  }[];
  topServices: {
    serviceName: string;
    gameName: string;
    _count: number;
    _sum: { priceSnapshot: number | null };
  }[];
  orderVolumeByDay: { date: string; count: number }[];
}

// Helpers
const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "#7E7D7D",
  AWAITING: "#FFB800",
  ASSIGNED: "#0077FF",
  IN_PROGRESS: "#FF8800",
  COMPLETED: "#00CC66",
  DONE: "#00FF2F",
  CANCELLED: "#FF3333",
  REFUNDED: "#CC44FF",
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

/** Isi hari yang tidak ada order dengan count 0 (30 hari terakhir) */
function fillDays(data: { date: string; count: number }[]) {
  const map: Record<string, number> = {};
  data.forEach((d) => (map[d.date] = d.count));
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: map[key] ?? 0 };
  });
}

// Sub-components

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  growth?: number;
  delay: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  growth,
  delay,
}: StatCardProps) {
  const hasGrowth = growth !== undefined;
  const positive = (growth ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      style={{
        background: "#0C0C0C",
        border: "1px solid #1E1E1E",
        borderRadius: 16,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent line top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, #FFB800 0%, transparent 60%)",
        }}
      />

      {/* Icon + label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#1E1E1E",
            border: "1px solid #292929",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={17} color="#FFB800" />
        </div>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "#7E7D7D",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          color: "#FFFFFF",
          letterSpacing: 1,
          lineHeight: 1,
        }}
      >
        {value}
      </p>

      {/* Sub / growth */}
      {(sub || hasGrowth) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {hasGrowth && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 700,
                color: positive ? "#00CC66" : "#FF3333",
              }}
            >
              {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(growth!)}%
            </span>
          )}
          {sub && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "#5B5B5B",
              }}
            >
              {sub}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

/** SVG bar chart untuk order volume per hari */
function VolumeChart({ data }: { data: { date: string; count: number }[] }) {
  const filled = fillDays(data);
  const maxCount = Math.max(...filled.map((d) => d.count), 1);
  const W = 600;
  const H = 120;
  const BAR_W = Math.floor((W - 40) / filled.length) - 2;
  const BAR_AREA_H = H - 24;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", minWidth: 320, height: "auto" }}
        preserveAspectRatio="none"
      >
        {/* Gridlines */}
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={20}
            y1={BAR_AREA_H * (1 - t)}
            x2={W - 10}
            y2={BAR_AREA_H * (1 - t)}
            stroke="#1E1E1E"
            strokeWidth={1}
          />
        ))}

        {/* Bars */}
        {filled.map((d, i) => {
          const barH = Math.max(
            (d.count / maxCount) * BAR_AREA_H,
            d.count > 0 ? 3 : 0,
          );
          const x = 20 + i * (BAR_W + 2);
          const y = BAR_AREA_H - barH;

          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx={2}
                fill="#FFB800"
                fillOpacity={d.count > 0 ? 0.85 : 0.1}
              />
              {/* Count label on hover not feasible in pure SVG static, skip */}
            </g>
          );
        })}

        {/* X-axis: only show 5 date labels */}
        {[0, 7, 14, 21, 29].map((i) => {
          const d = filled[i];
          if (!d) return null;
          const label = d.date.slice(5); // MM-DD
          const x = 20 + i * (BAR_W + 2) + BAR_W / 2;
          return (
            <text
              key={i}
              x={x}
              y={H - 4}
              textAnchor="middle"
              fontFamily="var(--font-body)"
              fontSize={9}
              fill="#5B5B5B"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/** Horizontal bar untuk revenue per game */
function RevenueBar({
  name,
  value,
  max,
  count,
}: {
  name: string;
  value: number;
  max: number;
  count: number;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "#FFFFFF",
            fontWeight: 500,
          }}
        >
          {name}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 10,
              color: "#5B5B5B",
            }}
          >
            {count} order
          </span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#FFB800",
              fontWeight: 700,
            }}
          >
            {fmt(value)}
          </span>
        </div>
      </div>
      <div
        style={{
          height: 5,
          background: "#1E1E1E",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            height: "100%",
            background: "#FFB800",
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
}

// Main Page
export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Gagal memuat data");
        return r.json();
      })
      .then((res) => setData(res.data ?? res))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error || !data)
    return (
      <div
        style={{
          padding: "40px 0",
          textAlign: "center",
          fontFamily: "var(--font-body)",
          color: "#FF3333",
          fontSize: 14,
        }}
      >
        {error ?? "Data tidak tersedia"}
      </div>
    );

  const {
    summary,
    ordersByStatus,
    revenueByGame,
    topServices,
    orderVolumeByDay,
  } = data;
  const maxRevGame = Math.max(
    ...revenueByGame.map((g) => g._sum.priceSnapshot ?? 0),
    1,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        <StatCard
          icon={Package}
          label="Order Bulan Ini"
          value={summary.ordersThisMonth.toLocaleString("id-ID")}
          sub="vs bulan lalu"
          growth={summary.orderGrowth}
          delay={0}
        />
        <StatCard
          icon={BarChart2}
          label="Revenue Bulan Ini"
          value={fmt(summary.revenueThisMonth)}
          sub="vs bulan lalu"
          growth={summary.revenueGrowth}
          delay={0.06}
        />
        <StatCard
          icon={Users}
          label="Total User"
          value={summary.totalUsers.toLocaleString("id-ID")}
          sub="user aktif"
          delay={0.12}
        />
        <StatCard
          icon={Zap}
          label="Joki Aktif"
          value={summary.activeJoki.toString()}
          sub="sedang mengerjakan"
          delay={0.18}
        />
        <StatCard
          icon={Star}
          label="Rating"
          value={`${summary.avgRating}/5`}
          sub={`${summary.totalReviews} review`}
          delay={0.24}
        />
      </div>

      {/* ── Row 2: Chart + Status ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 14,
        }}
      >
        {/* Volume chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.28 }}
          style={{
            background: "#0C0C0C",
            border: "1px solid #1E1E1E",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
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
              Volume Order
            </p>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "#5B5B5B",
              }}
            >
              30 hari terakhir
            </span>
          </div>
          <VolumeChart data={orderVolumeByDay} />
        </motion.div>

        {/* Status distribution */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.32 }}
          style={{
            background: "#0C0C0C",
            border: "1px solid #1E1E1E",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 700,
              color: "#FFFFFF",
              marginBottom: 14,
            }}
          >
            Distribusi Status
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ordersByStatus
              .sort((a, b) => b.count - a.count)
              .map((s) => (
                <div
                  key={s.status}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 7 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: STATUS_COLOR[s.status] ?? "#5B5B5B",
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        color: "#7E7D7D",
                      }}
                    >
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#FFFFFF",
                    }}
                  >
                    {s.count}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* ── Row 3: Revenue per Game + Top Services ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {/* Revenue per game */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.36 }}
          style={{
            background: "#0C0C0C",
            border: "1px solid #1E1E1E",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 700,
              color: "#FFFFFF",
              marginBottom: 16,
            }}
          >
            Revenue per Game
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {revenueByGame.map((g) => (
              <RevenueBar
                key={g.gameName}
                name={g.gameName}
                value={g._sum.priceSnapshot ?? 0}
                max={maxRevGame}
                count={g._count}
              />
            ))}
            {revenueByGame.length === 0 && (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "#5B5B5B",
                }}
              >
                Belum ada data
              </p>
            )}
          </div>
        </motion.div>

        {/* Top services */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
          style={{
            background: "#0C0C0C",
            border: "1px solid #1E1E1E",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 700,
              color: "#FFFFFF",
              marginBottom: 14,
            }}
          >
            Top 5 Layanan
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {topServices.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 0",
                  borderBottom:
                    i < topServices.length - 1 ? "1px solid #1E1E1E" : "none",
                }}
              >
                {/* Rank */}
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    color: i === 0 ? "#FFB800" : "#292929",
                    width: 22,
                    flexShrink: 0,
                    textAlign: "center",
                  }}
                >
                  {i + 1}
                </span>
                {/* Service info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#FFFFFF",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.serviceName}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      color: "#5B5B5B",
                    }}
                  >
                    {s.gameName}
                  </p>
                </div>
                {/* Count */}
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#FFB800",
                    flexShrink: 0,
                  }}
                >
                  {typeof s._count === "number"
                    ? s._count
                    : ((s._count as Record<string, number>)["serviceId"] ??
                      0)}{" "}
                  <span style={{ color: "#5B5B5B", fontWeight: 400 }}>
                    order
                  </span>
                </span>
              </div>
            ))}
            {topServices.length === 0 && (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "#5B5B5B",
                }}
              >
                Belum ada data
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Skeleton
function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-pulse"
            style={{
              height: 110,
              borderRadius: 16,
              background: "#1E1E1E",
            }}
          />
        ))}
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}
      >
        <div
          className="skeleton-pulse"
          style={{ height: 180, borderRadius: 16, background: "#1E1E1E" }}
        />
        <div
          className="skeleton-pulse"
          style={{ height: 180, borderRadius: 16, background: "#1E1E1E" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div
          className="skeleton-pulse"
          style={{ height: 200, borderRadius: 16, background: "#1E1E1E" }}
        />
        <div
          className="skeleton-pulse"
          style={{ height: 200, borderRadius: 16, background: "#1E1E1E" }}
        />
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .skeleton-pulse { animation: pulse 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
