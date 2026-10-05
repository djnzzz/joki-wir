// app/(admin)/admin/joki/page.tsx
//
// ⚠️  CATATAN: GET /api/admin/joki saat ini return shape yang terpotong:
//   { joki: [{ id, name, email, _count: { jokiOrders } }] }
//   Untuk enable kolom isActive/isBanned, API perlu return field tersebut.
//   Kode ini sudah siap — akan otomatis tampil jika API menambahkan field tsb.
//
// API: GET /api/admin/joki | PATCH /api/admin/joki/[id]
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  ShieldBan,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  UserPlus,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/config/routes";

// ─── Types ───────────────────────────────────────────────────────────────────
interface JokiUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isActive?: boolean;
  isBanned?: boolean;
  createdAt?: string;
  _count: { jokiOrders: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ─── JokiRow ──────────────────────────────────────────────────────────────────
function JokiRow({
  joki,
  onToggleActive,
  onToggleBan,
}: {
  joki: JokiUser;
  onToggleActive: () => void;
  onToggleBan: () => void;
}) {
  const isActive = joki.isActive ?? true;
  const isBanned = joki.isBanned ?? false;
  const activeOrders = joki._count.jokiOrders;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 100px 80px 80px 110px 44px",
        padding: "12px 16px",
        borderBottom: "1px solid #1E1E1E",
        alignItems: "center",
        opacity: isBanned ? 0.5 : 1,
        transition: "opacity 0.2s",
      }}
      className="joki-row"
    >
      {/* Identity */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Avatar initial */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              flexShrink: 0,
              background: isBanned
                ? "#292929"
                : isActive
                  ? "rgba(255,184,0,0.15)"
                  : "#1E1E1E",
              border: `1px solid ${isBanned ? "#FF3333" : isActive ? "#FFB800" : "#292929"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontSize: 14,
              color: isBanned ? "#FF3333" : isActive ? "#FFB800" : "#5B5B5B",
            }}
          >
            {joki.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 600,
                color: "#FFFFFF",
              }}
            >
              {joki.name}
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "#5B5B5B",
              }}
            >
              {joki.email}
            </p>
          </div>
        </div>
      </div>

      {/* Active orders */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Zap size={12} color={activeOrders > 0 ? "#FFB800" : "#292929"} />
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            fontWeight: activeOrders > 0 ? 700 : 400,
            color: activeOrders > 0 ? "#FFB800" : "#5B5B5B",
          }}
        >
          {activeOrders}
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "#5B5B5B",
          }}
        >
          aktif
        </span>
      </div>

      {/* Status badge */}
      <div>
        <span
          style={{
            display: "inline-block",
            padding: "3px 8px",
            borderRadius: 12,
            fontFamily: "var(--font-body)",
            fontSize: 10,
            fontWeight: 600,
            background: isBanned
              ? "rgba(255,51,51,0.12)"
              : isActive
                ? "rgba(0,204,102,0.1)"
                : "rgba(126,125,125,0.1)",
            color: isBanned ? "#FF3333" : isActive ? "#00CC66" : "#7E7D7D",
          }}
        >
          {isBanned ? "BANNED" : isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {/* Joined date */}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "#5B5B5B",
        }}
      >
        {fmtDate(joki.createdAt)}
      </span>

      {/* Actions */}
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        {/* Toggle active */}
        <button
          onClick={onToggleActive}
          style={iconBtnS}
          className="joki-icon-btn"
          title={isActive ? "Nonaktifkan" : "Aktifkan"}
        >
          {isActive ? (
            <ToggleRight size={16} color="#00CC66" />
          ) : (
            <ToggleLeft size={16} color="#5B5B5B" />
          )}
        </button>
        {/* Ban/Unban */}
        <button
          onClick={onToggleBan}
          style={{ ...iconBtnS, color: isBanned ? "#FF3333" : "#5B5B5B" }}
          className={
            isBanned
              ? "joki-unban-btn joki-icon-btn"
              : "joki-ban-btn joki-icon-btn"
          }
          title={isBanned ? "Unban" : "Ban"}
        >
          {isBanned ? <ShieldCheck size={14} /> : <ShieldBan size={14} />}
        </button>
      </div>

      {/* Detail link */}
      <Link
        href={ROUTES.admin.jokiDetail(joki.id)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 7,
          border: "1px solid #292929",
          color: "#7E7D7D",
          textDecoration: "none",
          transition: "border-color 0.15s, color 0.15s",
        }}
        className="joki-detail-btn"
      >
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}

const iconBtnS: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #292929",
  borderRadius: 6,
  cursor: "pointer",
  color: "#7E7D7D",
  padding: "5px 6px",
  display: "flex",
  alignItems: "center",
  transition: "border-color 0.15s, color 0.15s",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminJokiPage() {
  const { showToast } = useToast();
  const [jokiList, setJokiList] = useState<JokiUser[]>([]);
  // const [filtered,  setFiltered]  = useState<JokiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "BANNED"
  >("ALL");

  const fetchJoki = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/joki");
      const json = await res.json();
      const body = json.data ?? json;
      setJokiList(body.joki ?? body.users ?? []);
    } catch {
      setJokiList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/joki")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Gagal mengambil data joki");
        }
        return res.json();
      })
      .then((json) => {
        if (!ignore) {
          const body = json.data ?? json;
          setJokiList(body.joki ?? body.users ?? []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setJokiList([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Filter + search
  const filtered = useMemo(() => {
    let list = [...jokiList];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          j.name.toLowerCase().includes(q) || j.email.toLowerCase().includes(q),
      );
    }
    if (filter === "ACTIVE") {
      list = list.filter((j) => j.isActive && !j.isBanned);
    }
    if (filter === "INACTIVE") {
      list = list.filter((j) => !j.isActive);
    }
    if (filter === "BANNED") {
      list = list.filter((j) => j.isBanned);
    }
    return list;
  }, [jokiList, search, filter]);

  const handlePatch = async (
    joki: JokiUser,
    patch: { isActive?: boolean; isBanned?: boolean },
  ) => {
    // Optimistic update
    setJokiList((prev) =>
      prev.map((j) => (j.id === joki.id ? { ...j, ...patch } : j)),
    );
    try {
      const res = await fetch(`/api/admin/joki/${joki.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      const label =
        patch.isActive !== undefined
          ? patch.isActive
            ? "Joki diaktifkan"
            : "Joki dinonaktifkan"
          : patch.isBanned
            ? "Joki di-ban"
            : "Joki di-unban";
      showToast({ type: "sukses", title: label });
    } catch {
      // Rollback
      setJokiList((prev) => prev.map((j) => (j.id === joki.id ? joki : j)));
      showToast({ type: "error", title: "Gagal update" });
    }
  };

  // Stats
  const total = jokiList.length;
  const active = jokiList.filter((j) => j.isActive && !j.isBanned).length;
  const busy = jokiList.filter((j) => j._count.jokiOrders > 0).length;
  const banned = jokiList.filter((j) => j.isBanned).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Stat cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}
      >
        {[
          { label: "Total Joki", value: total, color: "#FFFFFF" },
          { label: "Aktif", value: active, color: "#00CC66" },
          { label: "Sedang kerja", value: busy, color: "#FFB800" },
          { label: "Banned", value: banned, color: "#FF3333" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              background: "#0C0C0C",
              border: "1px solid #1E1E1E",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "#5B5B5B",
                marginTop: 4,
              }}
            >
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div
        style={{
          background: "#0C0C0C",
          border: "1px solid #1E1E1E",
          borderRadius: 14,
          padding: "12px 14px",
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "#1E1E1E",
            border: "1px solid #292929",
            borderRadius: 8,
            padding: "6px 10px",
            flex: "1 1 200px",
            maxWidth: 260,
          }}
        >
          <Search size={13} color="#5B5B5B" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / email…"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#FFFFFF",
              width: "100%",
            }}
          />
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", gap: 5 }}>
          {(["ALL", "ACTIVE", "INACTIVE", "BANNED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: filter === f ? "#FFB800" : "#292929",
                background:
                  filter === f ? "rgba(255,184,0,0.1)" : "transparent",
                color: filter === f ? "#FFB800" : "#7E7D7D",
                fontFamily: "var(--font-body)",
                fontSize: 11,
                cursor: "pointer",
                fontWeight: filter === f ? 700 : 400,
                transition: "all 0.15s",
              }}
            >
              {f === "ALL"
                ? "Semua"
                : f === "ACTIVE"
                  ? "Aktif"
                  : f === "INACTIVE"
                    ? "Nonaktif"
                    : "Banned"}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchJoki}
          style={{
            background: "transparent",
            border: "1px solid #292929",
            borderRadius: 8,
            padding: "6px 9px",
            cursor: "pointer",
            color: "#5B5B5B",
            display: "flex",
            marginLeft: "auto",
          }}
          className="refresh-btn"
        >
          <RefreshCw size={13} />
        </button>
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
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 100px 80px 80px 110px 44px",
            padding: "9px 16px",
            borderBottom: "1px solid #1E1E1E",
          }}
        >
          {["Joki", "Order Aktif", "Status", "Bergabung", "Aksi", ""].map(
            (h, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "#5B5B5B",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </span>
            ),
          )}
        </div>

        {/* Rows */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="sk"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-pulse"
                  style={{
                    height: 54,
                    margin: "1px 16px",
                    borderRadius: 6,
                    background: "#1E1E1E",
                    marginBottom: 1,
                  }}
                />
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: "48px 0", textAlign: "center" }}
            >
              <UserPlus
                size={28}
                color="#292929"
                style={{ margin: "0 auto 10px" }}
              />
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "#5B5B5B",
                }}
              >
                Tidak ada joki ditemukan
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="rows"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {filtered.map((joki) => (
                <JokiRow
                  key={joki.id}
                  joki={joki}
                  onToggleActive={() =>
                    handlePatch(joki, { isActive: !(joki.isActive ?? true) })
                  }
                  onToggleBan={() =>
                    handlePatch(joki, { isBanned: !(joki.isBanned ?? false) })
                  }
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .joki-row:hover { background: #0F0F0F !important; }
        .joki-icon-btn:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        .joki-ban-btn:hover { border-color: #FF3333 !important; color: #FF3333 !important; }
        .joki-unban-btn:hover { border-color: #00CC66 !important; color: #00CC66 !important; }
        .joki-detail-btn:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        .refresh-btn:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .skeleton-pulse{animation:pulse 1.4s ease-in-out infinite;}
      `}</style>
    </div>
  );
}
