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
                border-slate-700
                flex
                flex-col
            ">

                {/* Header */}

                {title || subtitle ? (

                    <div className="p-6 border-b border-slate-700">

                        <div className="flex justify-between items-center">

                            <div>

                                {title && (
                                    <h2 className="text-2xl font-bold">
                                        {title}
                                    </h2>
                                )}

                                {subtitle && (
                                    <p className="text-gray-400 text-sm mt-2">
                                        {subtitle}
                                    </p>
                                )}

                            </div>

                            <button
                                onClick={onClose}
                                className="text-2xl hover:text-red-400 transition"
                            >
                                ✕
                            </button>

                        </div>

                        {headers.length > 0 && (

                            <div
                                className="grid mt-6 text-sm font-semibold text-gray-400"
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

                    <div className="flex justify-end p-3">
                        <button
                            onClick={onClose}
                            className="text-2xl hover:text-red-400 transition"
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