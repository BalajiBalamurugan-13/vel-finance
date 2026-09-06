import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FiMapPin, FiPlus, FiArrowUp, FiArrowDown, FiTrash2, FiEdit2, FiCheck, FiX } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { getPlaces, createPlace, updatePlace, deletePlace, reorderPlaces } from "../services/placeService";

function PlaceManagement() {
  const [places, setPlaces]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [newName, setNewName]     = useState("");
  const [adding, setAdding]       = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName]   = useState("");

  async function loadPlaces() {
    setLoading(true);
    try {
      const data = await getPlaces();
      setPlaces(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load places.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPlaces(); }, []);

  // ── Add ──────────────────────────────────────────────────────────────────

  async function handleAdd() {
    const name = newName.trim();
    if (!name) { toast.error("Place name cannot be empty."); return; }
    setAdding(true);
    try {
      // New place gets priority = max existing priority + 1
      const maxPriority = places.length > 0
        ? Math.max(...places.map((p) => p.priority))
        : -1;
      await createPlace({ name, priority: maxPriority + 1 });
      setNewName("");
      toast.success(`"${name}" added.`);
      await loadPlaces();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add place.");
    } finally {
      setAdding(false);
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
    if (!name) { toast.error("Place name cannot be empty."); return; }
    if (name === place.name) { cancelEdit(); return; }
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

  // ── Reorder ───────────────────────────────────────────────────────────────

  async function moveUp(index) {
    if (index === 0) return;
    const updated = [...places];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Re-assign sequential priorities starting from 0
    const items = updated.map((p, i) => ({ id: p.id, priority: i }));
    setSaving(true);
    try {
      await reorderPlaces(items);
      await loadPlaces();
    } catch (err) {
      toast.error("Failed to reorder places.");
    } finally {
      setSaving(false);
    }
  }

  async function moveDown(index) {
    if (index === places.length - 1) return;
    const updated = [...places];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    const items = updated.map((p, i) => ({ id: p.id, priority: i }));
    setSaving(true);
    try {
      await reorderPlaces(items);
      await loadPlaces();
    } catch (err) {
      toast.error("Failed to reorder places.");
    } finally {
      setSaving(false);
    }
  }

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
    <div className="w-full max-w-xl mx-auto px-0 sm:px-4 py-4 sm:py-6 pb-10">
      <PageHeader
        title="Manage Places"
        subtitle="Add places and set the order in which your father visits them for daily collection."
      />

      {/* Add new place */}
      <div className="bg-[#182238] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-5">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Add New Place
        </label>
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Place name…"
            className="min-w-0 flex-1 bg-[#0f172a] border border-slate-700/80 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="shrink-0 flex items-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-xl px-3.5 sm:px-5 py-2.5 sm:py-3 font-semibold text-sm sm:text-base text-white transition-all active:scale-95"
          >
            <FiPlus size={17} />
            <span>{adding ? "Adding…" : "Add"}</span>
          </button>
        </div>
      </div>

      {/* Places list */}
      <div className="bg-[#182238] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 flex items-center gap-2">
          <FiMapPin size={16} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-200 truncate">
            Collection Route Order
          </span>
          <span className="ml-auto text-xs text-slate-400 shrink-0">
            {places.length} place{places.length !== 1 ? "s" : ""}
          </span>
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
          <ul className="divide-y divide-slate-800">
            {places.map((place, idx) => (
              <li key={place.id} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-3.5 min-w-0">
                {/* Priority number */}
                <span className="w-5 sm:w-6 text-center text-xs font-bold text-slate-500 select-none shrink-0">
                  {idx + 1}
                </span>

                {/* Name / edit field */}
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
                  <span className="min-w-0 flex-1 text-white font-medium text-sm sm:text-base truncate" title={place.name}>
                    {place.name}
                  </span>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
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

                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0 || saving}
                    title="Move up"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition shrink-0"
                  >
                    <FiArrowUp size={13} />
                  </button>

                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === places.length - 1 || saving}
                    title="Move down"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition shrink-0"
                  >
                    <FiArrowDown size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(place)}
                    disabled={saving}
                    title="Delete"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-25 disabled:cursor-not-allowed transition shrink-0"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {places.length > 0 && (
        <p className="mt-4 text-xs text-slate-500 text-center">
          Use the arrows to set the daily collection route order. Row 1 is visited first.
        </p>
      )}
    </div>
  );
}

export default PlaceManagement;
