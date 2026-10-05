// app/(admin)/admin/games/[id]/page.tsx
//
// ⚠️  REQUIRES (belum dikonfirmasi ada):
//   GET  /api/admin/services?gameId=xxx  → list services + filter
//   POST /api/admin/services             → create service
//   PATCH /api/admin/services/[id]       → update service
//   DELETE /api/admin/services/[id]      → delete service
//
//   Jika endpoint services belum ada, data services di-load dari
//   GET /api/admin/games/[id] yang sudah include services.
//   Tombol add/edit/delete akan call /api/admin/services/*
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import Dropdown from "@/components/ui/Dropdown";
import { ROUTES } from "@/config/routes";

// ─── Types ───────────────────────────────────────────────────────────────────
type ServiceCategory = "BOSS_FIGHT" | "ITEM_HUNTING" | "GRINDING" | "NPC_QUEST";
type BadgeType = "SAVE" | "POPULAR" | "RARE" | "SECRET" | null;

interface Service {
  id: string;
  gameId: string;
  category: ServiceCategory;
  name: string;
  detail: string | null;
  priceUnit: number | null;
  priceUnitLabel: string | null;
  priceBundle: number | null;
  priceBundleLabel: string | null;
  estimateMin: number | null;
  estimateMax: number | null;
  badge: BadgeType;
  isActive: boolean;
  sortOrder: number;
}

interface GameDetail {
  id: string;
  name: string;
  slug: string;
  pillBg: string | null;
  pillColor: string | null;
  isActive: boolean;
  services: Service[];
  _count?: { services: number; orderItems: number };
}

type ServiceForm = {
  category: ServiceCategory;
  name: string;
  detail: string;
  priceUnit: string;
  priceUnitLabel: string;
  priceBundle: string;
  priceBundleLabel: string;
  estimateMin: string;
  estimateMax: string;
  badge: BadgeType;
  isActive: boolean;
};

const EMPTY_SVC: ServiceForm = {
  category: "BOSS_FIGHT",
  name: "",
  detail: "",
  priceUnit: "",
  priceUnitLabel: "",
  priceBundle: "",
  priceBundleLabel: "",
  estimateMin: "",
  estimateMax: "",
  badge: null,
  isActive: true,
};

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  BOSS_FIGHT: "Boss Fight",
  ITEM_HUNTING: "Item Hunting",
  GRINDING: "Grinding",
  NPC_QUEST: "NPC Quest & Ending",
};

const BADGE_CONFIG: Record<
  NonNullable<BadgeType>,
  { bg: string; text: string; label: string }
> = {
  SAVE: { bg: "#EAF3DE", text: "#27500A", label: "Hemat" },
  POPULAR: { bg: "#FAEEDA", text: "#633806", label: "Populer" },
  RARE: { bg: "#FCEBEB", text: "#791F1F", label: "Rare" },
  SECRET: { bg: "#E8EAF6", text: "#283593", label: "Secret" },
};

const fmtRp = (n: number) => new Intl.NumberFormat("id-ID").format(n);

const fmtEst = (min: number | null, max: number | null) => {
  if (!min && !max) return "—";
  const fmt = (m: number) =>
    m >= 60 ? `${Math.round(m / 60)} jam` : `${m} mnt`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  return fmt(min ?? max ?? 0);
};

// ─── ServiceRow ──────────────────────────────────────────────────────────────
function ServiceRow({
  svc,
  onEdit,
  onDelete,
  onToggle,
}: {
  svc: Service;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 120px 130px 80px 80px",
        gap: 0,
        padding: "11px 16px",
        borderBottom: "1px solid #1E1E1E",
        alignItems: "center",
        opacity: svc.isActive ? 1 : 0.45,
        transition: "opacity 0.2s",
      }}
      className="svc-row"
    >
      {/* Name + detail + badge */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 500,
              color: "#FFFFFF",
            }}
          >
            {svc.name}
          </p>
          {svc.badge && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 4,
                fontFamily: "var(--font-body)",
                background: BADGE_CONFIG[svc.badge].bg,
                color: BADGE_CONFIG[svc.badge].text,
              }}
            >
              {BADGE_CONFIG[svc.badge].label}
            </span>
          )}
        </div>
        {svc.detail && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "#5B5B5B",
              marginTop: 2,
            }}
          >
            {svc.detail}
          </p>
        )}
      </div>

      {/* Harga satuan */}
      <div>
        {svc.priceUnit ? (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 600,
              color: "#FFFFFF",
            }}
          >
            Rp {fmtRp(svc.priceUnit)}
            {svc.priceUnitLabel && (
              <span style={{ color: "#5B5B5B", fontWeight: 400 }}>
                {" "}
                {svc.priceUnitLabel}
              </span>
            )}
          </p>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "#292929",
            }}
          >
            —
          </span>
        )}
      </div>

      {/* Harga bundle */}
      <div>
        {svc.priceBundle ? (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 600,
              color: "#FFB800",
            }}
          >
            Rp {fmtRp(svc.priceBundle)}
            {svc.priceBundleLabel && (
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 10,
                  color: "#5B5B5B",
                  fontWeight: 400,
                  display: "block",
                }}
              >
                {svc.priceBundleLabel}
              </span>
            )}
          </p>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "#292929",
            }}
          >
            —
          </span>
        )}
      </div>

      {/* Estimasi */}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "#7E7D7D",
        }}
      >
        {fmtEst(svc.estimateMin, svc.estimateMax)}
      </span>

      {/* Actions */}
      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
        <button
          onClick={onToggle}
          style={iconBtnS}
          className="svc-icon-btn"
          title={svc.isActive ? "Nonaktifkan" : "Aktifkan"}
        >
          {svc.isActive ? (
            <ToggleRight size={15} color="#00CC66" />
          ) : (
            <ToggleLeft size={15} color="#5B5B5B" />
          )}
        </button>
        <button
          onClick={onEdit}
          style={iconBtnS}
          className="svc-icon-btn"
          title="Edit"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={onDelete}
          style={iconBtnS}
          className="svc-delete-btn svc-icon-btn"
          title="Hapus"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

const iconBtnS: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #292929",
  borderRadius: 6,
  cursor: "pointer",
  color: "#7E7D7D",
  padding: "4px 6px",
  display: "flex",
  alignItems: "center",
  transition: "border-color 0.15s, color 0.15s",
};

// ─── ServiceModal ─────────────────────────────────────────────────────────────
function ServiceModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  initial: ServiceForm;
  onClose: () => void;
  onSave: (data: ServiceForm) => Promise<void>;
}) {
  const [form, setForm] = useState<ServiceForm>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ServiceForm>(k: K, v: ServiceForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name) return;
    setBusy(true);
    try {
      await onSave(form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        overflowY: "auto",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#1E1E1E",
          border: "1px solid #292929",
          borderRadius: 20,
          overflow: "hidden",
          margin: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #292929",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            {mode === "add" ? "Tambah Service" : "Edit Service"}
          </p>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#5B5B5B",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Category */}
          <Field label="Kategori *">
            <Dropdown
              value={form.category}
              onChange={(value) => set("category", value as ServiceCategory)}
              width="100%"
              options={(Object.keys(CATEGORY_LABEL) as ServiceCategory[]).map(
                (c) => ({
                  value: c,
                  label: CATEGORY_LABEL[c],
                }),
              )}
            />
          </Field>

          {/* Name + detail */}
          <Field label="Nama Paket *">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              style={inputS}
              placeholder="e.g. Per boss (story)"
            />
          </Field>
          <Field label="Detail / Deskripsi kecil">
            <input
              value={form.detail}
              onChange={(e) => set("detail", e.target.value)}
              style={inputS}
              placeholder="e.g. Margit, Godrick, Rennala..."
            />
          </Field>

          {/* Harga satuan */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field label="Harga Satuan (Rp)">
              <input
                type="number"
                value={form.priceUnit}
                onChange={(e) => set("priceUnit", e.target.value)}
                style={inputS}
                placeholder="20000"
                min={0}
              />
            </Field>
            <Field label="Label Satuan">
              <input
                value={form.priceUnitLabel}
                onChange={(e) => set("priceUnitLabel", e.target.value)}
                style={inputS}
                placeholder="/ set, / boss"
              />
            </Field>
          </div>

          {/* Harga bundle */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field label="Harga Bundle (Rp)">
              <input
                type="number"
                value={form.priceBundle}
                onChange={(e) => set("priceBundle", e.target.value)}
                style={inputS}
                placeholder="89000"
                min={0}
              />
            </Field>
            <Field label="Label Bundle">
              <input
                value={form.priceBundleLabel}
                onChange={(e) => set("priceBundleLabel", e.target.value)}
                style={inputS}
                placeholder="Hemat 45%, all DLC boss"
              />
            </Field>
          </div>

          {/* Estimasi */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field label="Est. Min (menit)">
              <input
                type="number"
                value={form.estimateMin}
                onChange={(e) => set("estimateMin", e.target.value)}
                style={inputS}
                placeholder="30"
                min={0}
              />
            </Field>
            <Field label="Est. Max (menit)">
              <input
                type="number"
                value={form.estimateMax}
                onChange={(e) => set("estimateMax", e.target.value)}
                style={inputS}
                placeholder="90"
                min={0}
              />
            </Field>
          </div>

          {/* Badge */}
          <Field label="Badge">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                onClick={() => set("badge", null)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor: form.badge === null ? "#FFB800" : "#292929",
                  background:
                    form.badge === null ? "rgba(255,184,0,0.1)" : "transparent",
                  color: form.badge === null ? "#FFB800" : "#5B5B5B",
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Tidak ada
              </button>
              {(Object.keys(BADGE_CONFIG) as NonNullable<BadgeType>[]).map(
                (b) => (
                  <button
                    key={b}
                    onClick={() => set("badge", b)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid",
                      borderColor:
                        form.badge === b ? BADGE_CONFIG[b].text : "#292929",
                      background:
                        form.badge === b ? BADGE_CONFIG[b].bg : "transparent",
                      color:
                        form.badge === b ? BADGE_CONFIG[b].text : "#5B5B5B",
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    {BADGE_CONFIG[b].label}
                  </button>
                ),
              )}
            </div>
          </Field>

          {/* Active */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => set("isActive", !form.isActive)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
              }}
            >
              {form.isActive ? (
                <ToggleRight size={22} color="#00CC66" />
              ) : (
                <ToggleLeft size={22} color="#5B5B5B" />
              )}
            </button>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "#FFFFFF",
              }}
            >
              {form.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>

        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #292929",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <button onClick={onClose} style={cancelS}>
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy || !form.name}
            style={{
              ...saveS,
              opacity: busy || !form.name ? 0.5 : 1,
              cursor: busy || !form.name ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminGameServicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { showToast } = useToast();

  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | "ALL">(
    "ALL",
  );
  const [modal, setModal] = useState<{
    mode: "add" | "edit";
    svc?: Service;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchGame = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/games/${id}`);
      const json = await res.json();
      setGame(json.data ?? json);
    } catch {
      setGame(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch(`/api/admin/games/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          console.error("GET game detail gagal:", res.status, json);
          throw new Error(json.error ?? "Gagal mengambil data game");
        }
        return json;
      })
      .then((json) => {
        if (!ignore) {
          setGame(json.data ?? json);
        }
      })
      .catch((error) => {
        console.error("fetchGame:", error);
        if (!ignore) {
          setGame(null);
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
  }, [id]);

  const handleToggleSvc = async (svc: Service) => {
    // Optimistic
    setGame((prev) =>
      prev
        ? {
            ...prev,
            services: prev.services.map((s) =>
              s.id === svc.id ? { ...s, isActive: !s.isActive } : s,
            ),
          }
        : prev,
    );
    const res = await fetch(`/api/admin/services/${svc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !svc.isActive }),
    });
    if (!res.ok) {
      setGame((prev) =>
        prev
          ? {
              ...prev,
              services: prev.services.map((s) => (s.id === svc.id ? svc : s)),
            }
          : prev,
      );
      showToast({ type: "error", title: "Gagal update" });
    }
  };

  const handleSaveSvc = async (form: ServiceForm, svcId?: string) => {
    const payload = {
      gameId: id,
      category: form.category,
      name: form.name,
      detail: form.detail || null,
      priceUnit: form.priceUnit ? parseInt(form.priceUnit) : null,
      priceUnitLabel: form.priceUnitLabel || null,
      priceBundle: form.priceBundle ? parseInt(form.priceBundle) : null,
      priceBundleLabel: form.priceBundleLabel || null,
      estimateMin: form.estimateMin ? parseInt(form.estimateMin) : null,
      estimateMax: form.estimateMax ? parseInt(form.estimateMax) : null,
      badge: form.badge,
      isActive: form.isActive,
    };

    const url = svcId ? `/api/admin/services/${svcId}` : "/api/admin/services";
    const method = svcId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      showToast({
        type: "error",
        title: "Gagal menyimpan",
        description: json.error,
      });
      throw new Error();
    }
    showToast({
      type: "sukses",
      title: svcId ? "Service diperbarui" : "Service ditambahkan!",
    });
    setModal(null);
    fetchGame();
  };

  const handleDeleteSvc = async (svc: Service) => {
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Gagal");
      }
      showToast({ type: "sukses", title: "Service dihapus" });
      setDeleteTarget(null);
      fetchGame();
    } catch (e: unknown) {
      showToast({
        type: "error",
        title: "Gagal hapus",
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading) return <ServicesSkeleton />;
  if (!game)
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "#5B5B5B",
            fontSize: 14,
          }}
        >
          Game tidak ditemukan.
        </p>
        <Link
          href={ROUTES.admin.games}
          style={{
            color: "#FFB800",
            fontFamily: "var(--font-body)",
            fontSize: 13,
          }}
        >
          ← Kembali
        </Link>
      </div>
    );

  const allCategories = Array.from(
    new Set(game.services.map((s) => s.category)),
  );
  const filtered =
    activeCategory === "ALL"
      ? game.services
      : game.services.filter((s) => s.category === activeCategory);

  // Group by category for display
  const grouped = filtered.reduce<Record<string, Service[]>>((acc, s) => {
    const key = s.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Back + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href={ROUTES.admin.games}
            className="back-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#7E7D7D",
              textDecoration: "none",
              padding: "6px 10px",
              border: "1px solid #292929",
              borderRadius: 7,
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            <ArrowLeft size={13} /> Games
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontFamily: "var(--font-body)",
                background: game.pillBg ?? "#1E1E1E",
                color: game.pillColor ?? "#FFB800",
              }}
            >
              {game.name}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "#5B5B5B",
              }}
            >
              {game.services.length} service
            </span>
          </div>
          <button
            onClick={() => setModal({ mode: "add" })}
            style={{ ...addS, marginLeft: "auto" }}
            className="add-svc-btn"
          >
            <Plus size={13} /> Tambah Service
          </button>
        </div>

        {/* Category filter tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["ALL", ...allCategories] as (ServiceCategory | "ALL")[]).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "1px solid",
                  borderColor: activeCategory === cat ? "#FFB800" : "#292929",
                  background:
                    activeCategory === cat
                      ? "rgba(255,184,0,0.1)"
                      : "transparent",
                  color: activeCategory === cat ? "#FFB800" : "#7E7D7D",
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: activeCategory === cat ? 700 : 400,
                  transition: "all 0.15s",
                }}
              >
                {cat === "ALL" ? "Semua" : CATEGORY_LABEL[cat]}
              </button>
            ),
          )}
        </div>

        {/* Tables grouped by category */}
        {(Object.keys(grouped) as ServiceCategory[]).map((cat) => (
          <div
            key={cat}
            style={{
              background: "#0C0C0C",
              border: "1px solid #1E1E1E",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* Category header */}
            <div
              style={{
                padding: "10px 16px",
                background: "#0C0C0C",
                borderBottom: "1px solid #1E1E1E",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "#5B5B5B",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {CATEGORY_LABEL[cat]}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  color: "#5B5B5B",
                }}
              >
                {grouped[cat].length} item
              </span>
            </div>

            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 130px 80px 80px",
                padding: "8px 16px",
                borderBottom: "1px solid #1E1E1E",
              }}
            >
              {["Paket", "Harga Satuan", "Bundle", "Estimasi", ""].map(
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
            {grouped[cat].map((svc) => (
              <ServiceRow
                key={svc.id}
                svc={svc}
                onEdit={() => setModal({ mode: "edit", svc })}
                onDelete={() => setDeleteTarget(svc)}
                onToggle={() => handleToggleSvc(svc)}
              />
            ))}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "#5B5B5B",
              }}
            >
              Belum ada service di kategori ini.
            </p>
          </div>
        )}
      </div>

      {/* Service Modal */}
      <AnimatePresence>
        {modal && (
          <ServiceModal
            mode={modal.mode}
            initial={
              modal.svc
                ? {
                    category: modal.svc.category,
                    name: modal.svc.name,
                    detail: modal.svc.detail ?? "",
                    priceUnit: modal.svc.priceUnit?.toString() ?? "",
                    priceUnitLabel: modal.svc.priceUnitLabel ?? "",
                    priceBundle: modal.svc.priceBundle?.toString() ?? "",
                    priceBundleLabel: modal.svc.priceBundleLabel ?? "",
                    estimateMin: modal.svc.estimateMin?.toString() ?? "",
                    estimateMax: modal.svc.estimateMax?.toString() ?? "",
                    badge: modal.svc.badge,
                    isActive: modal.svc.isActive,
                  }
                : EMPTY_SVC
            }
            onClose={() => setModal(null)}
            onSave={(data) => handleSaveSvc(data, modal.svc?.id)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              style={{
                maxWidth: 360,
                width: "100%",
                background: "#1E1E1E",
                border: "1px solid #FF3333",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  marginBottom: 6,
                }}
              >
                Hapus &quot;{deleteTarget.name}&quot;?
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "#7E7D7D",
                  marginBottom: 18,
                }}
              >
                Service yang sudah ada di order tidak terpengaruh (snapshot
                harga tersimpan).
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setDeleteTarget(null)} style={cancelS}>
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteSvc(deleteTarget)}
                  disabled={deleteBusy}
                  style={{
                    ...saveS,
                    background: "#FF3333",
                    opacity: deleteBusy ? 0.6 : 1,
                  }}
                >
                  {deleteBusy ? "Menghapus…" : "Hapus"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .back-btn:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        .add-svc-btn:hover { background: transparent !important; color: #FFB800 !important; }
        .svc-row:hover { background: #0F0F0F !important; }
        .svc-icon-btn:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        .svc-delete-btn:hover { border-color: #FF3333 !important; color: #FF3333 !important; }
      `}</style>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "#5B5B5B",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ServicesSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="sp" style={{ height: 40, width: 260, borderRadius: 8 }} />
      <div className="sp" style={{ height: 280, borderRadius: 16 }} />
      <div className="sp" style={{ height: 160, borderRadius: 16 }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}.sp{background:#1E1E1E;animation:pulse 1.4s ease-in-out infinite;}`}</style>
    </div>
  );
}

const inputS: React.CSSProperties = {
  width: "100%",
  background: "#292929",
  border: "1px solid #3A3A3A",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#FFFFFF",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  outline: "none",
};
const addS: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  padding: "6px 12px",
  background: "#FFB800",
  border: "2px solid #FFB800",
  borderRadius: 8,
  color: "#0C0C0C",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  transition: "background 0.2s, color 0.2s",
};
const cancelS: React.CSSProperties = {
  flex: 1,
  height: 36,
  borderRadius: 8,
  border: "1px solid #292929",
  background: "transparent",
  color: "#7E7D7D",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  cursor: "pointer",
};
const saveS: React.CSSProperties = {
  flex: 1,
  height: 36,
  borderRadius: 8,
  border: "none",
  background: "#FFB800",
  color: "#0C0C0C",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};
