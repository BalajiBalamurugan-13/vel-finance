import { useState } from "react";
import { completeMigration } from "../../services/dashboardService";
import { toast } from "react-toastify";
import ConfirmDialog from "../ConfirmDialog";

function MigrationBanner({ onMigrationComplete, currentBalance }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await completeMigration();
      toast.success("Initial migration completed successfully!");
      setShowConfirm(false);
      if (onMigrationComplete) onMigrationComplete();
    } catch (error) {
      const message =
        error.response?.data?.detail || "Migration failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const formattedBalance = currentBalance != null
    ? `₹${Math.abs(currentBalance).toLocaleString("en-IN")}`
    : "...";

  const confirmMessage =
    `This action will finalize the initial customer migration.\n\n` +
    `What happens:\n` +
    `• All existing customer data will be preserved as-is.\n` +
    `• Customer balances, IDs, and collection records remain unchanged.\n` +
    `• Available Cash will be reset to ₹0 as the operational starting point.\n` +
    `• Future loans, collections, and expenses will follow normal accounting.\n\n` +
    `Current distorted balance: ${currentBalance < 0 ? "-" : ""}${formattedBalance}\n\n` +
    `This action cannot be undone. Only proceed if all existing customers have been migrated and their balances verified.`;

  return (
    <>
      <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">⚠️</span>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-amber-300">
              Migration In Progress
            </h3>

            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Existing customers are being migrated from the physical notebook.
              Available Cash is currently showing a distorted value because
              the system is counting historical loans as current cash outflows.
            </p>

            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Once all customers have been migrated and their balances
              match the physical notebook, press the button below to
              finalize the migration and begin normal operations.
            </p>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading}
              className="mt-4 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all duration-200 active:scale-[0.98] shadow-md"
            >
              Complete Initial Migration
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Complete Initial Migration"
        message={confirmMessage}
        confirmText={loading ? "Processing..." : "Yes, Complete Migration"}
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => !loading && setShowConfirm(false)}
      />
    </>
  );
}

export default MigrationBanner;
