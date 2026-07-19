import DetailDrawer from "../DetailDrawer";

function NetDrawer({
    open,
    onClose,
    summary
}) {

    const net = summary.net_amount;
    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    return (

        <DetailDrawer
            open={open}
            onClose={onClose}
            title="Today's Net Summary"
            subtitle={today}
        >

            <div className="space-y-6 mt-8">

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">

                    <div className="flex justify-between items-center">

                        <span className="text-gray-400">
                            💰 Total Collections
                        </span>

                        <span className="text-2xl font-bold text-green-400">
                            ₹{summary.total_collected}
                        </span>

                    </div>

                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">

                    <div className="flex justify-between items-center">

                        <span className="text-gray-400">
                            💸 Total Expenses
                        </span>

                        <span className="text-2xl font-bold text-red-400">
                            ₹{summary.total_expense}
                        </span>

                    </div>

                </div>
                <hr className="border-slate-700 my-10" />

                <div
                    className={`
                        rounded-xl
                        p-8
                        text-center
                        border
                        ${
                            net >= 0
                                ? "border-green-500 bg-green-500/10"
                                : "border-red-500 bg-red-500/10"
                        }
                    `}
                >

                    <p className="text-gray-400 text-lg">

                        {net >= 0 ? "Today's Profit" : "Today's Loss"}

                    </p>

                    <h1
                        className={`
                            text-4xl md:text-5xl
                            font-bold
                            mt-4
                            ${
                                net >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                            }
                        `}
                    >
                        ₹{Math.abs(net)}
                    </h1>

                    <p
                        className={`
                            mt-4
                            font-medium
                            ${
                                net >= 0
                                    ? "text-green-300"
                                    : "text-red-300"
                            }
                        `}
                    >
                        {net >= 0
                            ? "🟢 Business is in Profit"
                            : "🔴 Business is in Loss"}
                    </p>

                </div>

            </div>

        </DetailDrawer>

    );

}

export default NetDrawer;