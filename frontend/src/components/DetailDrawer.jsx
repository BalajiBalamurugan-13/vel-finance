import logoWatermark from "../assets/Vel finance logo white.png";

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
                relative
                overflow-hidden
            ">

                {/* Subtle Centered Background Watermark with Golden Glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
                    <div className="absolute w-60 h-60 rounded-full bg-amber-500/[0.08] blur-[60px] pointer-events-none" />
                    <img
                        src={logoWatermark}
                        alt=""
                        className="w-72 h-72 max-w-[70%] max-h-[70%] object-contain opacity-[0.20] select-none pointer-events-none transform -translate-x-[2%] translate-y-[2%] filter drop-shadow-[0_0_30px_rgba(245,158,11,0.5)] drop-shadow-[0_0_60px_rgba(217,119,6,0.3)]"
                    />
                </div>

                {/* Header */}

                {title || subtitle ? (

                    <div className="p-6 border-b border-slate-800 relative z-10">

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

                <div className="flex-1 overflow-y-auto px-6 pb-6 relative z-10">

                    {children}

                </div>

            </div>

        </div>

    );

}

export default DetailDrawer;