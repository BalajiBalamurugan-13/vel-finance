import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  FiMapPin,
  FiPlus,
  FiArrowUp,
  FiArrowDown,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiCornerDownRight,
} from "react-icons/fi";
import { GripVertical } from "lucide-react";
import PageHeader from "../components/PageHeader";
import {
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  reorderPlaces,
  updatePlaceSession,
} from "../services/placeService";
import { useLanguage } from "../context/LanguageContext";

function PlaceManagement() {
  const { t } = useLanguage();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSession, setNewSession] = useState("morning");
  const [filterSession, setFilterSession] = useState("all");
  const [togglingId, setTogglingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  // Drag and Drop States
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const touchCurrentIdx = useRef(null);

  // Quick Move Modal State
  const [moveModalPlace, setMoveModalPlace] = useState(null);
  const [targetPos, setTargetPos] = useState("");

  async function loadPlaces() {
    setLoading(true);
    try {
      const data = await getPlaces();
      setPlaces(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load places.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaces();
  }, []);

  // ── Persist Reorder ────────────────────────────────────────────────────────
  async function persistOrder(updatedPlaces) {
    setSaving(true);
    const items = updatedPlaces.map((p, i) => ({ id: p.id, priority: i }));
    try {
      await reorderPlaces(items);
      toast.success(t("places.reorder_success") || "வரிசை சேமிக்கப்பட்டது!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reorder places.");
      await loadPlaces();
    } finally {
      setSaving(false);
    }
  }

  // ── Add ──────────────────────────────────────────────────────────────────
  async function handleAdd() {
    const name = newName.trim();
    if (!name) {
      toast.error("Place name cannot be empty.");
      return;
    }
    setAdding(true);
    try {
      const maxPriority =
        places.length > 0 ? Math.max(...places.map((p) => p.priority)) : -1;
      await createPlace({ name, priority: maxPriority + 1, session: newSession });
      setNewName("");
      toast.success(`"${name}" (${newSession === "evening" ? (t("places.evening") || "மாலை") : (t("places.morning") || "காலை")}) added.`);
      await loadPlaces();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add place.");
    } finally {
      setAdding(false);
    }
  }

  // ── 1-Click Toggle Session (Morning <-> Evening) ──────────────────────────
  async function handleToggleSession(place) {
    const nextSession = place.session === "evening" ? "morning" : "evening";
    setTogglingId(place.id);
    // Optimistic update
    setPlaces((prev) =>
      prev.map((p) => (p.id === place.id ? { ...p, session: nextSession } : p))
    );
    try {
      await updatePlaceSession(place.id, nextSession);
      const label = nextSession === "evening" ? (t("places.evening") || "மாலை") : (t("places.morning") || "காலை");
      toast.success(`${place.name} → ${label}`);
    } catch (err) {
      console.error("Failed to toggle session:", err);
      toast.error("Failed to update session.");
      await loadPlaces();
    } finally {
      setTogglingId(null);
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────
  function startEdit(place) {
    setEditingId(place.id);
    setEditName(place.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function commitEdit(place) {
    const name = editName.trim();
    if (!name) {
      toast.error("Place name cannot be empty.");
      return;
    }
    if (name === place.name) {
      cancelEdit();
      return;
    }
    setSaving(true);
    try {
      await updatePlace(place.id, { name });
      toast.success("Place renamed.");
      cancelEdit();
      await loadPlaces();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to rename place.");
    } finally {
      setSaving(false);
    }
  }

  // ── Move Up / Down Single Steps ──────────────────────────────────────────
  async function moveUp(index) {
    if (index === 0) return;
    const updated = [...places];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setPlaces(updated);
    await persistOrder(updated);
  }

  async function moveDown(index) {
    if (index === places.length - 1) return;
    const updated = [...places];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setPlaces(updated);
    await persistOrder(updated);
  }

  // ── Move to Exact Position (Direct Shuffle) ───────────────────────────────
  function openMoveModal(place, index) {
    setMoveModalPlace({ ...place, currentIndex: index });
    setTargetPos(String(index + 1));
  }

  async function handleMoveToPosition(customTarget) {
    if (!moveModalPlace) return;
    const fromIdx = moveModalPlace.currentIndex;
    const dest = customTarget !== undefined ? customTarget : parseInt(targetPos, 10);

    if (isNaN(dest) || dest < 1 || dest > places.length) {
      toast.error(`Please enter a valid position between 1 and ${places.length}`);
      return;
    }

    const toIdx = dest - 1;
    if (fromIdx === toIdx) {
      setMoveModalPlace(null);
      return;
    }

    const updated = [...places];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);

    setPlaces(updated);
    setMoveModalPlace(null);
    await persistOrder(updated);
    toast.success(`"${moved.name}" ➔ #${dest}-க்கு நகர்த்தப்பட்டது!`);
  }

  // ── Desktop Drag and Drop ────────────────────────────────────────────────
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedIdx(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    setDragOverIdx(index);

    // Live array shuffle during drag
    setPlaces((prev) => {
      const updated = [...prev];
      const [item] = updated.splice(draggedIdx, 1);
      updated.splice(index, 0, item);
      setDraggedIdx(index);
      return updated;
    });
  };

  const handleDragEnd = async () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
    await persistOrder(places);
  };

  // ── Mobile Touch Drag ────────────────────────────────────────────────────
  const handleTouchStart = (e, index) => {
    touchCurrentIdx.current = index;
    setDraggedIdx(index);
    setIsTouchDragging(true);
  };

  const handleTouchMove = (e) => {
    if (touchCurrentIdx.current === null) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = elem?.closest("[data-place-index]");

    if (row) {
      const targetIndex = parseInt(row.getAttribute("data-place-index"), 10);
      if (!isNaN(targetIndex) && targetIndex !== touchCurrentIdx.current) {
        setPlaces((prev) => {
          const updated = [...prev];
          const [moved] = updated.splice(touchCurrentIdx.current, 1);
          updated.splice(targetIndex, 0, moved);
          touchCurrentIdx.current = targetIndex;
          setDraggedIdx(targetIndex);
          return updated;
        });
      }
    }
  };

  const handleTouchEnd = async () => {
    if (touchCurrentIdx.current !== null) {
      touchCurrentIdx.current = null;
      setDraggedIdx(null);
      setIsTouchDragging(false);
      await persistOrder(places);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(place) {
    const confirmed = window.confirm(
      `Delete "${place.name}"? This will fail if any customers are assigned to this place.`
    );
    if (!confirmed) return;
    setSaving(true);
    try {
      await deletePlace(place.id);
      toast.success(`"${place.name}" deleted.`);
      await loadPlaces();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Cannot delete place.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-xl mx-auto px-0 sm:px-4 py-4 sm:py-6 pb-12">
      <PageHeader
        title={t("places.title")}
        subtitle={t("places.subtitle")}
      />

      {/* Add new place */}
      <div className="bg-[#182238] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <label className="text-sm font-medium text-slate-300">
            {t("places.add_place")}
          </label>
          {/* Morning / Evening Selector for new place */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => setNewSession("morning")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                newSession === "morning"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🌅</span>
              <span>{t("places.morning")}</span>
            </button>
            <button
              type="button"
              onClick={() => setNewSession("evening")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                newSession === "evening"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🌇</span>
              <span>{t("places.evening")}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={t("places.search_placeholder")}
            className="min-w-0 flex-1 bg-[#0f172a] border border-slate-700/80 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="shrink-0 flex items-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-xl px-3.5 sm:px-5 py-2.5 sm:py-3 font-semibold text-sm sm:text-base text-white transition-all active:scale-95"
          >
            <FiPlus size={17} />
            <span>{adding ? t("common.loading") : t("places.save")}</span>
          </button>
        </div>
      </div>

      {/* Quick Shuffle / Reorder Hint Banner */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 mb-4 flex items-center justify-between gap-3 text-xs text-emerald-200">
        <div className="flex items-center gap-2">
          <span className="text-base">↕️</span>
          <span>{t("places.drag_hint")}</span>
        </div>
        {saving && (
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse text-[11px] font-medium">
            {t("places.saving_order")}
          </span>
        )}
      </div>

      {/* Places list */}
      <div className="bg-[#182238] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <FiMapPin size={16} className="text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-200">
              {t("places.priority")}
            </span>
          </div>

          {/* Session Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => setFilterSession("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterSession === "all"
                  ? "bg-slate-700 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📋 {t("places.all_sessions")} ({places.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSession("morning")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterSession === "morning"
                  ? "bg-sky-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-sky-300"
              }`}
            >
              🌅 {t("places.morning")} ({places.filter((p) => (p.session || "morning") === "morning").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSession("evening")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterSession === "evening"
                  ? "bg-amber-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-amber-300"
              }`}
            >
              🌇 {t("places.evening")} ({places.filter((p) => p.session === "evening").length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-400 text-sm py-8 px-5">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : places.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">
            No places yet. Add the first one above.
          </div>
        ) : (
          (() => {
            const displayedPlaces = places.filter((p) =>
              filterSession === "all" ? true : (p.session || "morning") === filterSession
            );

            if (displayedPlaces.length === 0) {
              return (
                <div className="px-5 py-8 text-center text-slate-400 text-sm">
                  {filterSession === "evening"
                    ? `${t("places.evening")} - ஊர்கள் ஏதும் ஒதுக்கப்படவில்லை`
                    : `${t("places.morning")} - ஊர்கள் ஏதும் ஒதுக்கப்படவில்லை`}
                </div>
              );
            }

            return (
              <ul
                className="divide-y divide-slate-800/80"
                onTouchMove={filterSession === "all" ? handleTouchMove : undefined}
                onTouchEnd={filterSession === "all" ? handleTouchEnd : undefined}
              >
                {displayedPlaces.map((place) => {
                  const fullIdx = places.findIndex((p) => p.id === place.id);
                  const isBeingDragged = draggedIdx === fullIdx;

                  return (
                    <li
                      key={place.id}
                      data-place-index={fullIdx}
                      draggable={filterSession === "all" && editingId !== place.id}
                      onDragStart={(e) => handleDragStart(e, fullIdx)}
                      onDragOver={(e) => handleDragOver(e, fullIdx)}
                      onDragEnd={handleDragEnd}
                      className={`
                        flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-3.5 min-w-0 transition-all duration-150 select-none
                        ${
                          isBeingDragged
                            ? "bg-slate-800/90 border-y-2 border-emerald-500/80 scale-[1.01] shadow-2xl z-20 opacity-95"
                            : "hover:bg-slate-800/50"
                        }
                      `}
                    >
                      {/* Touch / Mouse Drag Handle */}
                      <div
                        onTouchStart={(e) => filterSession === "all" && handleTouchStart(e, fullIdx)}
                        title={filterSession === "all" ? t("places.drag_hint") : t("places.all_sessions")}
                        className={`p-1 -ml-1 rounded-lg shrink-0 transition-colors ${
                          filterSession === "all"
                            ? "cursor-grab active:cursor-grabbing text-slate-500 hover:text-emerald-400 touch-none"
                            : "text-slate-600 cursor-not-allowed opacity-40"
                        }`}
                      >
                        <GripVertical size={18} />
                      </div>

                      {/* Interactive Priority Number Badge (Click to Jump Directly) */}
                      <button
                        type="button"
                        onClick={() => openMoveModal(place, fullIdx)}
                        title={`${t("places.move_to")} (Click to move anywhere)`}
                        className="
                          min-w-[28px] sm:min-w-[32px] h-7 px-1.5 rounded-lg
                          bg-slate-800/90 hover:bg-emerald-600/30 hover:border-emerald-500/50
                          border border-slate-700/70 text-slate-300 hover:text-emerald-300
                          font-bold text-xs flex items-center justify-center gap-0.5
                          transition-all active:scale-95 shrink-0 shadow-sm
                        "
                      >
                        <span>{fullIdx + 1}</span>
                      </button>

                      {/* Name / Edit Input */}
                      {editingId === place.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit(place);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="min-w-0 flex-1 bg-[#0f172a] border border-slate-600 rounded-lg px-2.5 sm:px-3 py-1.5 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <span
                          onClick={() => openMoveModal(place, fullIdx)}
                          className="min-w-0 flex-1 text-white font-medium text-sm sm:text-base truncate cursor-pointer hover:text-emerald-300 transition-colors"
                          title={place.name}
                        >
                          {place.name}
                        </span>
                      )}

                      {/* Action buttons & 1-Click Session Badge */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Session Toggle Badge */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSession(place);
                          }}
                          disabled={togglingId === place.id}
                          title={place.session === "evening" ? t("places.switch_to_morning") : t("places.switch_to_evening")}
                          className={`
                            px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 shrink-0
                            ${
                              place.session === "evening"
                                ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 hover:border-amber-400 shadow-sm"
                                : "bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 hover:border-sky-400 shadow-sm"
                            }
                            active:scale-95 cursor-pointer
                          `}
                        >
                          <span className="text-xs">{place.session === "evening" ? "🌇" : "🌅"}</span>
                          <span>{place.session === "evening" ? t("places.evening") : t("places.morning")}</span>
                        </button>

                        {editingId === place.id ? (
                          <>
                            <button
                              onClick={() => commitEdit(place)}
                              disabled={saving}
                              title="Save name"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition shrink-0"
                            >
                              <FiCheck size={14} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              title="Cancel"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 transition shrink-0"
                            >
                              <FiX size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(place)}
                            title="Rename"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition shrink-0"
                          >
                            <FiEdit2 size={13} />
                          </button>
                        )}

                        {/* Quick Move To Position Button */}
                        <button
                          onClick={() => openMoveModal(place, fullIdx)}
                          title={t("places.move_to")}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/20 transition shrink-0"
                        >
                          <FiCornerDownRight size={13} />
                        </button>

                        {/* Move Up 1 Step */}
                        <button
                          onClick={() => moveUp(fullIdx)}
                          disabled={fullIdx === 0 || saving}
                          title="Move up 1"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition shrink-0"
                        >
                          <FiArrowUp size={13} />
                        </button>

                        {/* Move Down 1 Step */}
                        <button
                          onClick={() => moveDown(fullIdx)}
                          disabled={fullIdx === places.length - 1 || saving}
                          title="Move down 1"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition shrink-0"
                        >
                          <FiArrowDown size={13} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(place)}
                          disabled={saving}
                          title="Delete"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-20 disabled:cursor-not-allowed transition shrink-0"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            );
          })()
        )}
      </div>

      {places.length > 0 && (
        <p className="mt-4 text-xs text-slate-500 text-center">
          {t("places.drag_hint")}
        </p>
      )}

      {/* ── Direct "Move to Position" Modal ────────────────────────────── */}
      {moveModalPlace && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#182238] border border-slate-700/80 rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => setMoveModalPlace(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2 text-emerald-400 text-sm font-semibold">
              <FiMapPin size={16} />
              <span>{t("places.move_to")}</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1 truncate">
              {moveModalPlace.name}
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              தற்போதைய வரிசை:{" "}
              <strong className="text-amber-400 font-bold">
                #{moveModalPlace.currentIndex + 1}
              </strong>{" "}
              (மொத்தம்: {places.length} ஊர்கள்)
            </p>

            {/* Quick One-Click Action Chips */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleMoveToPosition(1)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500/50 border border-slate-700 text-slate-200 hover:text-emerald-300 font-semibold text-xs transition active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <span>{t("places.top")}</span>
              </button>

              <button
                type="button"
                onClick={() => handleMoveToPosition(places.length)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <span>{t("places.bottom")}</span>
              </button>

              {moveModalPlace.currentIndex >= 5 && (
                <button
                  type="button"
                  onClick={() =>
                    handleMoveToPosition(moveModalPlace.currentIndex + 1 - 5)
                  }
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition active:scale-95"
                >
                  ⬆️ 5 இடங்கள் மேலே
                </button>
              )}

              {moveModalPlace.currentIndex <= places.length - 6 && (
                <button
                  type="button"
                  onClick={() =>
                    handleMoveToPosition(moveModalPlace.currentIndex + 1 + 5)
                  }
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition active:scale-95"
                >
                  ⬇️ 5 இடங்கள் கீழே
                </button>
              )}
            </div>

            {/* Direct Number Input */}
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t("places.move_to_position")} (1 - {places.length})
            </label>

            <div className="flex gap-2 mb-5">
              <input
                type="number"
                min="1"
                max={places.length}
                autoFocus
                value={targetPos}
                onChange={(e) => setTargetPos(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMoveToPosition()}
                placeholder="எ.கா: 2"
                className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-2.5 text-white font-bold text-base text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMoveModalPlace(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => handleMoveToPosition()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5"
              >
                <span>{t("places.move")}</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaceManagement;
