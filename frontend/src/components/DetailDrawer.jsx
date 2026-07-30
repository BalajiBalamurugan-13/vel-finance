function DetailDrawer({
    open,
    onClose,
    title,
    subtitle,
    headers = [],
    children
}) {

    if (!open) return null;

    return (

        <div className="fixed inset-0 bg-black/40 z-50">

            <div className="
                absolute
                right-0
                top-0
                h-full
                w-full md:w-full sm:w-[700px]
                bg-[#111827]
                border-l
                border-slate-800
                flex
                flex-col
                shadow-2xl
            ">

                {/* Header */}

                {title || subtitle ? (

                    <div className="p-6 border-b border-slate-800">

                        <div className="flex justify-between items-center">

                            <div>

                                {title && (
                                    <h2 className="text-2xl font-bold text-white">
                                        {title}
                                    </h2>
                                )}

                                {subtitle && (
                                    <p className="text-slate-400 text-sm mt-1">
                                        {subtitle}
                                    </p>
                                )}

                            </div>

                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
                                aria-label="Close drawer"
                            >
                                ✕
                            </button>

                        </div>

                        {headers.length > 0 && (

                            <div
                                className="grid mt-6 text-sm font-semibold text-slate-400"
                                style={{
                                    gridTemplateColumns: `repeat(${headers.length}, minmax(0,1fr))`
                                }}
                            >

                                {headers.map((header) => (
                                    <div key={header}>{header}</div>
                                ))}

                            </div>

                        )}

                    </div>

                ) : (

                    <div className="flex justify-end p-4 border-b border-slate-800">
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
                            aria-label="Close drawer"
                        >
                            ✕
                        </button>
                    </div>

                )}

                {/* Scrollable Content */}

                <div className="flex-1 overflow-y-auto px-6 pb-6">

                    {children}

                </div>

            </div>

        </div>

    );

}

export default DetailDrawer;