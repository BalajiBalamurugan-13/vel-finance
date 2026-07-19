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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">

            <div className="bg-slate-900 rounded-xl p-6 w-[420px] border border-slate-700">

                <h2 className="text-xl font-bold mb-3">
                    {title}
                </h2>

                <p className="text-gray-400 whitespace-pre-line">
                    {message}
                </p>

                <div className="flex justify-end gap-3 mt-8">

                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700"
                    >
                        {confirmText}
                    </button>

                </div>

            </div>

        </div>
    );
}

export default ConfirmDialog;