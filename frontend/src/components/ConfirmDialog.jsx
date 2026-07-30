function ConfirmDialog({
    open,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel
}) {

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">

            <div className="bg-[#182238] rounded-2xl p-6 w-full max-w-sm mx-auto border border-slate-800 shadow-2xl space-y-4">

                <h2 className="text-xl font-bold text-white">
                    {title}
                </h2>

                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {message}
                </p>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">

                    <button
                        onClick={onCancel}
                        className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition active:scale-[0.98]"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition active:scale-[0.98] shadow-md shadow-rose-950/30"
                    >
                        {confirmText}
                    </button>

                </div>

            </div>

        </div>
    );
}

export default ConfirmDialog;