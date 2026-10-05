// app/(admin)/admin/services/page.tsx
// Halaman daftar semua service lintas game
// API: GET /api/admin/services?gameId=xxx  (gameId opsional)
//      GET /api/admin/games                (untuk dropdown filter)
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  Plus,
  ExternalLink,
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
  game: { name: string; slug: string };
}

interface GameOption {
  id: string;
  name: string;
  pillBg: string | null;
  pillColor: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  BOSS_FIGHT: "Boss Fight",
  ITEM_HUNTING: "Item Hunting",
  GRINDING: "Grinding",
  NPC_QUEST: "NPC Quest",
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

const fmtRp = (n: number) => `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;

const fmtEst = (min: number | null, max: number | null) => {
  if (!min && !max) return "—";
  const f = (m: number) => (m >= 60 ? `${Math.round(m / 60)}j` : `${m}m`);
  if (min && max) return `${f(min)}–${f(max)}`;
  return f(min ?? max ?? 0);
};

// ─── ServiceModal (reuse dari game services page — inline ringkas) ───────────
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
  gameId: string;
};

const EMPTY: ServiceForm = {
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
  gameId: "",
};

function ServiceModal({
  mode,
  initial,
  games,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  initial: ServiceForm;
  games: GameOption[];
  onClose: () => void;
  onSave: (f: ServiceForm) => Promise<void>;
}) {
  const [form, setForm] = useState<ServiceForm>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ServiceForm>(k: K, v: ServiceForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.gameId) return;
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
            padding: "14px 18px",
            borderBottom: "1px solid #292929",
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
            {mode === "add" ? "Tambah Service" : "Edit Service"}
          </p>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#5B5B5B",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Game selector */}
          <Field label="Game *">
            <Dropdown
              value={form.gameId}
              onChange={(value) => set("gameId", value)}
              width="100%"
              placeholder="Pilih game..."
              options={[
                {
                  value: "",
                  label: "Pilih game...",
                },
                ...games.map((g) => ({
                  value: g.id,
                  label: g.name,
                })),
              ]}
            />
          </Field>

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

          {/* Name */}
          <Field label="Nama Paket *">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              style={iS}
              placeholder="e.g. Per boss (story)"
            />
          </Field>

          <Field label="Detail">
            <input
              value={form.detail}
              onChange={(e) => set("detail", e.target.value)}
              style={iS}
              placeholder="e.g. Margit, Godrick..."
            />
          </Field>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field label="Harga Satuan (Rp)">
              <input
                type="number"
                value={form.priceUnit}
                onChange={(e) => set("priceUnit", e.target.value)}
                style={iS}
                placeholder="20000"
              />
            </Field>
            <Field label="Label Satuan">
              <input
                value={form.priceUnitLabel}
                onChange={(e) => set("priceUnitLabel", e.target.value)}
                style={iS}
                placeholder="/ boss"
              />
            </Field>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field label="Harga Bundle (Rp)">
              <input
                type="number"
                value={form.priceBundle}
                onChange={(e) => set("priceBundle", e.target.value)}
                style={iS}
                placeholder="89000"
              />
            </Field>
            <Field label="Label Bundle">
              <input
                value={form.priceBundleLabel}
                onChange={(e) => set("priceBundleLabel", e.target.value)}
                style={iS}
                placeholder="Hemat 45%"
              />
            </Field>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field label="Est. Min (menit)">
              <input
                type="number"
                value={form.estimateMin}
                onChange={(e) => set("estimateMin", e.target.value)}
                style={iS}
                placeholder="30"
              />
            </Field>
            <Field label="Est. Max (menit)">
              <input
                type="number"
                value={form.estimateMax}
                onChange={(e) => set("estimateMax", e.target.value)}
                style={iS}
                placeholder="90"
              />
            </Field>
          </div>

          {/* Badge */}
          <Field label="Badge">
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <button
                onClick={() => set("badge", null)}
                style={{
                  ...badgeBtnS(
                    form.badge === null,
                    "#FFB800",
                    "rgba(255,184,0,0.1)",
                  ),
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
                      ...badgeBtnS(
                        form.badge === b,
                        BADGE_CONFIG[b].text,
                        BADGE_CONFIG[b].bg,
                      ),
                    }}
                  >
                    {BADGE_CONFIG[b].label}
                  </button>
                ),
              )}
            </div>
          </Field>

          {/* Active */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => set("isActive", !form.isActive)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
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
                fontSize: 12,
                color: "#FFFFFF",
              }}
            >
              {form.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>

        <div
          style={{
            padding: "12px 18px",
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
            disabled={busy || !form.name || !form.gameId}
            style={{
              ...saveS,
              opacity: busy || !form.name || !form.gameId ? 0.5 : 1,
              cursor:
                busy || !form.name || !form.gameId ? "not-allowed" : "pointer",
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
export default function AdminServicesPage() {
  const { showToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [games, setGames] = useState<GameOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState<string>("ALL");
  const [catFilter, setCatFilter] = useState<ServiceCategory | "ALL">("ALL");
  const [modal, setModal] = useState<{
    mode: "add" | "edit";
    svc?: Service;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const url =
        gameFilter !== "ALL"
          ? `/api/admin/services?gameId=${gameFilter}`
          : "/api/admin/services";
      const res = await fetch(url);
      const json = await res.json();
      setServices(json.data ?? json);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/games")
      .then((r) => r.json())
      .then((j) => setGames(j.data ?? j))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;

    const url =
      gameFilter !== "ALL"
        ? `/api/admin/services?gameId=${gameFilter}`
        : "/api/admin/services";

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Gagal mengambil services");
        }

        return res.json();
      })
      .then((json) => {
        if (!ignore) {
          setServices(json.data ?? json);
        }
      })
      .catch(() => {
        if (!ignore) {
          setServices([]);
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
  }, [gameFilter]);

  // Client-side filter for search + category
  const displayed = services.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.game.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "ALL" || s.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleToggle = async (svc: Service) => {
    setServices((p) =>
      p.map((s) => (s.id === svc.id ? { ...s, isActive: !s.isActive } : s)),
    );
    const res = await fetch(`/api/admin/services/${svc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !svc.isActive }),
    });
    if (!res.ok) {
      setServices((p) => p.map((s) => (s.id === svc.id ? svc : s)));
      showToast({ type: "error", title: "Gagal update" });
    }
  };

  const handleSave = async (form: ServiceForm, svcId?: string) => {
    const payload = {
      gameId: form.gameId,
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
    const res = await fetch(url, {
      method: svcId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      showToast({
        type: "error",
        title: "Gagal simpan",
        description: json.error,
      });
      throw new Error();
    }
    showToast({
      type: "sukses",
      title: svcId ? "Service diperbarui" : "Service ditambahkan!",
    });
    setModal(null);
    fetchServices();
  };

  const handleDelete = async (svc: Service) => {
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Gagal");
      }
      showToast({ type: "sukses", title: "Service dinonaktifkan" });
      setDeleteTarget(null);
      fetchServices();
    } catch (e: unknown) {
      showToast({
        type: "error",
        title: "Gagal",
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              flex: "1 1 180px",
              maxWidth: 240,
            }}
          >
            <Search size={13} color="#5B5B5B" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari service…"
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

          {/* Game filter */}
          <Dropdown
            value={gameFilter}
            onChange={(value) => {
              setLoading(true);
              setGameFilter(value);
            }}
            width={180}
            options={[
              {
                value: "ALL",
                label: "Semua game",
              },
              ...games.map((g) => ({
                value: g.id,
                label: g.name,
              })),
            ]}
          />

          {/* Category filter */}
          <Dropdown
            value={catFilter}
            onChange={(value) => setCatFilter(value as ServiceCategory | "ALL")}
            width={180}
            options={[
              {
                value: "ALL",
                label: "Semua kategori",
              },
              ...(Object.keys(CATEGORY_LABEL) as ServiceCategory[]).map(
                (c) => ({
                  value: c,
                  label: CATEGORY_LABEL[c],
                }),
              ),
            ]}
          />

          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#5B5B5B",
            }}
          >
            {displayed.length} service
          </span>

          <button
            onClick={() => setModal({ mode: "add" })}
            style={{ ...addBtnS, marginLeft: "auto" }}
            className="add-svc-btn"
          >
            <Plus size={13} /> Tambah Service
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
              gridTemplateColumns: "1fr 120px 120px 130px 70px 80px",
              padding: "9px 16px",
              borderBottom: "1px solid #1E1E1E",
            }}
          >
            {["Paket", "Game", "Harga Satuan", "Bundle", "Est.", ""].map(
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

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="sk"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton-pulse"
                    style={{
                      height: 50,
                      margin: "1px 16px",
                      borderRadius: 5,
                      background: "#1E1E1E",
                      marginBottom: 1,
                    }}
                  />
                ))}
              </motion.div>
            ) : displayed.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: "44px 0", textAlign: "center" }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "#5B5B5B",
                  }}
                >
                  Tidak ada service ditemukan
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="rows"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {displayed.map((svc) => (
                  <div
                    key={svc.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 120px 120px 130px 70px 80px",
                      padding: "11px 16px",
                      borderBottom: "1px solid #1E1E1E",
                      alignItems: "center",
                      opacity: svc.isActive ? 1 : 0.45,
                      transition: "opacity 0.2s",
                    }}
                    className="svc-row"
                  >
                    {/* Name */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
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
                              padding: "1px 5px",
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
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 10,
                          color: "#5B5B5B",
                          marginTop: 2,
                        }}
                      >
                        {CATEGORY_LABEL[svc.category]}
                        {svc.detail && ` · ${svc.detail}`}
                      </p>
                    </div>

                    {/* Game pill + link */}
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 11,
                          color: "#7E7D7D",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {svc.game.name}
                      </span>
                      <Link
                        href={ROUTES.admin.game(svc.gameId)}
                        style={{
                          color: "#5B5B5B",
                          display: "flex",
                          flexShrink: 0,
                        }}
                        className="game-ext-link"
                        title="Buka halaman game"
                      >
                        <ExternalLink size={10} />
                      </Link>
                    </div>

                    {/* Harga satuan */}
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        color: "#FFFFFF",
                      }}
                    >
                      {svc.priceUnit ? (
                        <>
                          {fmtRp(svc.priceUnit)}
                          <span style={{ color: "#5B5B5B", fontSize: 10 }}>
                            {svc.priceUnitLabel ? ` ${svc.priceUnitLabel}` : ""}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: "#292929" }}>—</span>
                      )}
                    </span>

                    {/* Bundle */}
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: svc.priceBundle ? 600 : 400,
                        color: svc.priceBundle ? "#FFB800" : "#292929",
                      }}
                    >
                      {svc.priceBundle ? fmtRp(svc.priceBundle) : "—"}
                    </span>

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
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => handleToggle(svc)}
                        style={iBtnS}
                        className="svc-icon-btn"
                        title={svc.isActive ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {svc.isActive ? (
                          <ToggleRight size={14} color="#00CC66" />
                        ) : (
                          <ToggleLeft size={14} color="#5B5B5B" />
                        )}
                      </button>
                      <button
                        onClick={() => setModal({ mode: "edit", svc })}
                        style={iBtnS}
                        className="svc-icon-btn"
                        title="Edit"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(svc)}
                        style={iBtnS}
                        className="svc-del-btn svc-icon-btn"
                        title="Hapus"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal add/edit */}
      <AnimatePresence>
        {modal && (
          <ServiceModal
            mode={modal.mode}
            games={games}
            initial={
              modal.svc
                ? {
                    category: modal.svc.category,
                    name: modal.svc.name,
                    detail: modal.svc.detail ?? "",
                    gameId: modal.svc.gameId,
                    priceUnit: modal.svc.priceUnit?.toString() ?? "",
                    priceUnitLabel: modal.svc.priceUnitLabel ?? "",
                    priceBundle: modal.svc.priceBundle?.toString() ?? "",
                    priceBundleLabel: modal.svc.priceBundleLabel ?? "",
                    estimateMin: modal.svc.estimateMin?.toString() ?? "",
                    estimateMax: modal.svc.estimateMax?.toString() ?? "",
                    badge: modal.svc.badge,
                    isActive: modal.svc.isActive,
                  }
                : EMPTY
            }
            onClose={() => setModal(null)}
            onSave={(f) => handleSave(f, modal.svc?.id)}
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
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              style={{
                maxWidth: 360,
                width: "100%",
                background: "#1E1E1E",
                border: "1px solid #FF3333",
                borderRadius: 14,
                padding: 20,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  marginBottom: 6,
                }}
              >
                Nonaktifkan &quot;{deleteTarget.name}&quot;?
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "#7E7D7D",
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                Service tidak dihapus dari database, hanya dinonaktifkan (soft
                delete).
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setDeleteTarget(null)} style={cancelS}>
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={deleteBusy}
                  style={{
                    ...saveS,
                    background: "#FF3333",
                    opacity: deleteBusy ? 0.6 : 1,
                  }}
                >
                  {deleteBusy ? "Memproses…" : "Nonaktifkan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .svc-row:hover { background: #0F0F0F !important; }
        .svc-icon-btn:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        .svc-del-btn:hover { border-color: #FF3333 !important; color: #FF3333 !important; }
        .add-svc-btn:hover { background: transparent !important; color: #FFB800 !important; }
        .game-ext-link:hover { color: #FFB800 !important; }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .skeleton-pulse{animation:pulse 1.4s ease-in-out infinite;}
      `}</style>
    </>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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

const badgeBtnS = (
  active: boolean,
  color: string,
  bg: string,
): React.CSSProperties => ({
  padding: "3px 9px",
  borderRadius: 5,
  fontFamily: "var(--font-body)",
  fontSize: 10,
  cursor: "pointer",
  border: "1px solid",
  transition: "all 0.12s",
  borderColor: active ? color : "#292929",
  background: active ? bg : "transparent",
  color: active ? color : "#5B5B5B",
});
const iS: React.CSSProperties = {
  width: "100%",
  background: "#292929",
  border: "1px solid #3A3A3A",
  borderRadius: 7,
  padding: "7px 9px",
  color: "#FFFFFF",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  outline: "none",
};
const iBtnS: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #292929",
  borderRadius: 5,
  cursor: "pointer",
  color: "#7E7D7D",
  padding: "4px 5px",
  display: "flex",
  alignItems: "center",
  transition: "border-color 0.15s, color 0.15s",
};
const addBtnS: React.CSSProperties = {
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
  height: 34,
  borderRadius: 7,
  border: "1px solid #292929",
  background: "transparent",
  color: "#7E7D7D",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  cursor: "pointer",
};
const saveS: React.CSSProperties = {
  flex: 1,
  height: 34,
  borderRadius: 7,
  border: "none",
  background: "#FFB800",
  color: "#0C0C0C",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};
