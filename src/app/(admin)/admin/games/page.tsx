// app/(admin)/admin/games/page.tsx
// API: GET/POST /api/admin/games | PATCH/DELETE /api/admin/games/[id]
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/config/routes";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Game {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  note: string | null;
  pillBg: string | null;
  pillColor: string | null;
  coverUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count: { services: number; orderItems: number };
}

type GameFormData = {
  name: string;
  slug: string;
  description: string;
  note: string;
  pillBg: string;
  pillColor: string;
  isActive: boolean;
};

const EMPTY_FORM: GameFormData = {
  name: "",
  slug: "",
  description: "",
  note: "",
  pillBg: "#1E1E1E",
  pillColor: "#FFB800",
  isActive: true,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

// ─── GameCard ─────────────────────────────────────────────────────────────────
function GameCard({
  game,
  index,
  total,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  game: Game;
  index: number;
  total: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      style={{
        background: "#0C0C0C",
        border: `1px solid ${game.isActive ? "#1E1E1E" : "#292929"}`,
        borderRadius: 16,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: game.isActive ? 1 : 0.55,
        transition: "opacity 0.2s, border-color 0.2s",
      }}
    >
      {/* Sort handles */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="sort-btn"
          style={{ ...sortBtnStyle, opacity: index === 0 ? 0.2 : 1 }}
        >
          <ChevronUp size={13} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index >= total - 1}
          className="sort-btn"
          style={{ ...sortBtnStyle, opacity: index >= total - 1 ? 0.2 : 1 }}
        >
          <ChevronDown size={13} />
        </button>
      </div>

      {/* Pill + name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              background: game.pillBg ?? "#1E1E1E",
              color: game.pillColor ?? "#FFB800",
            }}
          >
            {game.name}
          </span>
          {!game.isActive && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 10,
                color: "#FF3333",
                border: "1px solid #FF3333",
                borderRadius: 4,
                padding: "1px 6px",
              }}
            >
              NONAKTIF
            </span>
          )}
        </div>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "#5B5B5B",
          }}
        >
          {game._count.services} service &nbsp;·&nbsp; {game._count.orderItems}{" "}
          order total
        </p>
        {game.note && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "#5B5B5B",
              marginTop: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {game.note}
          </p>
        )}
      </div>

      {/* Actions */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
      >
        {/* Services link */}
        <Link
          href={ROUTES.admin.game(game.id)}
          style={{
            padding: "5px 12px",
            borderRadius: 7,
            border: "1px solid #292929",
            color: "#7E7D7D",
            fontSize: 11,
            fontFamily: "var(--font-body)",
            textDecoration: "none",
            transition: "border-color 0.15s, color 0.15s",
          }}
          className="game-link-btn"
        >
          Services
        </Link>
        {/* Toggle */}
        <button
          onClick={onToggle}
          className="icon-btn"
          style={{
            ...iconBtnStyle,
            color: game.isActive ? "#00CC66" : "#5B5B5B",
          }}
          title={game.isActive ? "Nonaktifkan" : "Aktifkan"}
        >
          {game.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
        </button>
        {/* Edit */}
        <button
          onClick={onEdit}
          className="icon-btn"
          style={iconBtnStyle}
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        {/* Delete */}
        <button
          onClick={onDelete}
          className="icon-btn delete-btn"
          style={{ ...iconBtnStyle, color: "#5B5B5B" }}
          title="Nonaktifkan/Hapus"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

const sortBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "#5B5B5B",
  padding: 2,
  display: "flex",
  alignItems: "center",
  borderRadius: 4,
  transition: "color 0.15s",
};
const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #292929",
  borderRadius: 7,
  cursor: "pointer",
  color: "#7E7D7D",
  padding: "5px 7px",
  display: "flex",
  alignItems: "center",
  transition: "border-color 0.15s, color 0.15s",
};

// ─── GameModal ───────────────────────────────────────────────────────────────
function GameModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  initial: GameFormData;
  onClose: () => void;
  onSave: (data: GameFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<GameFormData>(initial);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof GameFormData, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.slug) return;
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
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#1E1E1E",
          border: "1px solid #292929",
          borderRadius: 20,
          overflow: "hidden",
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
            {mode === "add" ? "Tambah Game" : "Edit Game"}
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

        {/* Body */}
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <Field label="Nama Game *">
            <input
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (mode === "add") set("slug", toSlug(e.target.value));
              }}
              style={inputStyle}
              placeholder="e.g. Elden Ring"
            />
          </Field>

          <Field label="Slug *">
            <input
              value={form.slug}
              onChange={(e) => set("slug", toSlug(e.target.value))}
              style={inputStyle}
              placeholder="e.g. elden-ring"
            />
          </Field>

          <Field label="Deskripsi">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical", height: "auto" }}
              placeholder="Deskripsi singkat game"
            />
          </Field>

          <Field label="Catatan (ditampilkan di atas tabel harga)">
            <input
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              style={inputStyle}
              placeholder="e.g. Game paling populer di seri ini"
            />
          </Field>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Warna BG Pill">
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="color"
                  value={form.pillBg}
                  onChange={(e) => set("pillBg", e.target.value)}
                  style={{
                    width: 36,
                    height: 32,
                    padding: 2,
                    borderRadius: 6,
                    border: "1px solid #292929",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                />
                <input
                  value={form.pillBg}
                  onChange={(e) => set("pillBg", e.target.value)}
                  style={{ ...inputStyle, flex: 1, fontFamily: "monospace" }}
                />
              </div>
            </Field>
            <Field label="Warna Teks Pill">
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="color"
                  value={form.pillColor}
                  onChange={(e) => set("pillColor", e.target.value)}
                  style={{
                    width: 36,
                    height: 32,
                    padding: 2,
                    borderRadius: 6,
                    border: "1px solid #292929",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                />
                <input
                  value={form.pillColor}
                  onChange={(e) => set("pillColor", e.target.value)}
                  style={{ ...inputStyle, flex: 1, fontFamily: "monospace" }}
                />
              </div>
            </Field>
          </div>

          {/* Preview pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "#5B5B5B",
              }}
            >
              Preview:
            </span>
            <span
              style={{
                padding: "3px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "var(--font-body)",
                background: form.pillBg,
                color: form.pillColor,
              }}
            >
              {form.name || "Nama Game"}
            </span>
          </div>

          {/* Active toggle */}
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
                <ToggleRight size={24} color="#00CC66" />
              ) : (
                <ToggleLeft size={24} color="#5B5B5B" />
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

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #292929",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <button onClick={onClose} style={cancelBtnStyle}>
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy || !form.name || !form.slug}
            style={{
              ...saveBtnStyle,
              opacity: busy || !form.name || !form.slug ? 0.5 : 1,
              cursor:
                busy || !form.name || !form.slug ? "not-allowed" : "pointer",
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
export default function AdminGamesPage() {
  const { showToast } = useToast();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    mode: "add" | "edit";
    game?: Game;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Game | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/games");
      const json = await res.json();
      setGames(json.data ?? json);
    } catch {
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    fetch("/api/admin/games")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          setGames(json.data ?? json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setGames([]);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Toggle isActive
  const handleToggle = async (game: Game) => {
    // Optimistic
    setGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, isActive: !g.isActive } : g)),
    );
    try {
      const res = await fetch(`/api/admin/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !game.isActive }),
      });
      if (!res.ok) throw new Error();
      showToast({
        type: "sukses",
        title: `${game.name} ${game.isActive ? "dinonaktifkan" : "diaktifkan"}`,
      });
    } catch {
      setGames((prev) =>
        prev.map((g) =>
          g.id === game.id ? { ...g, isActive: game.isActive } : g,
        ),
      );
      showToast({ type: "error", title: "Gagal update status" });
    }
  };

  // Move sort order
  const handleMove = async (index: number, dir: "up" | "down") => {
    const next = [...games];
    const swap = dir === "up" ? index - 1 : index + 1;
    [next[index], next[swap]] = [next[swap], next[index]];
    setGames(next);
    // Persist both sort orders
    await Promise.all([
      fetch(`/api/admin/games/${next[index].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: index }),
      }),
      fetch(`/api/admin/games/${next[swap].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: swap }),
      }),
    ]);
  };

  // Save (add/edit)
  const handleSave = async (data: GameFormData, gameId?: string) => {
    const url = gameId ? `/api/admin/games/${gameId}` : "/api/admin/games";
    const method = gameId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      showToast({
        type: "error",
        title: "Gagal menyimpan",
        description: json.error,
      });
      throw new Error(json.error);
    }
    showToast({
      type: "sukses",
      title: gameId ? "Game diperbarui" : "Game ditambahkan!",
    });
    setModal(null);
    fetchGames();
  };

  // Soft delete
  const handleDelete = async (game: Game) => {
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/games/${game.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Gagal");
      }
      showToast({ type: "sukses", title: `${game.name} dinonaktifkan` });
      setDeleteTarget(null);
      fetchGames();
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

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "#5B5B5B",
            }}
          >
            {games.length} game terdaftar
          </p>
          <button
            onClick={() => setModal({ mode: "add" })}
            style={addBtnStyle}
            className="add-btn"
          >
            <Plus size={14} /> Tambah Game
          </button>
        </div>

        {/* Game list */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-pulse"
                style={{ height: 76, borderRadius: 16, background: "#1E1E1E" }}
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {games.map((game, i) => (
                <GameCard
                  key={game.id}
                  game={game}
                  index={i}
                  total={games.length}
                  onToggle={() => handleToggle(game)}
                  onEdit={() => setModal({ mode: "edit", game })}
                  onDelete={() => setDeleteTarget(game)}
                  onMoveUp={() => handleMove(i, "up")}
                  onMoveDown={() => handleMove(i, "down")}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <GameModal
            mode={modal.mode}
            initial={
              modal.game
                ? {
                    name: modal.game.name,
                    slug: modal.game.slug,
                    description: modal.game.description ?? "",
                    note: modal.game.note ?? "",
                    pillBg: modal.game.pillBg ?? "#1E1E1E",
                    pillColor: modal.game.pillColor ?? "#FFB800",
                    isActive: modal.game.isActive,
                  }
                : EMPTY_FORM
            }
            onClose={() => setModal(null)}
            onSave={(data) => handleSave(data, modal.game?.id)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
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
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: "100%",
                maxWidth: 380,
                background: "#1E1E1E",
                border: "1px solid #FF3333",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  marginBottom: 8,
                }}
              >
                Nonaktifkan &quot;{deleteTarget.name}&quot;?
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "#7E7D7D",
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}
              >
                Game tidak akan dihapus dari database, hanya dinonaktifkan.
                Tidak bisa dilakukan jika masih ada order aktif.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setDeleteTarget(null)}
                  style={cancelBtnStyle}
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={deleteBusy}
                  style={{
                    ...saveBtnStyle,
                    background: "#FF3333",
                    opacity: deleteBusy ? 0.6 : 1,
                  }}
                >
                  {deleteBusy ? "Memproses…" : "Ya, Nonaktifkan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .add-btn:hover { background: transparent !important; color: #FFB800 !important; }
        .icon-btn:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        .delete-btn:hover { border-color: #FF3333 !important; color: #FF3333 !important; }
        .sort-btn:hover { color: #FFB800 !important; }
        .game-link-btn:hover { border-color: #FFB800 !important; color: #FFB800 !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .skeleton-pulse { animation: pulse 1.4s ease-in-out infinite; }
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
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "#5B5B5B",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
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
const addBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 14px",
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
const cancelBtnStyle: React.CSSProperties = {
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
const saveBtnStyle: React.CSSProperties = {
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
