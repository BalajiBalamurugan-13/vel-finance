import DetailDrawer from "../DetailDrawer";
import { useLanguage } from "../../context/LanguageContext";

function NetDrawer({
    open,
    onClose,
    summary
}) {
    const { t } = useLanguage();
    const net = summary?.net_amount || 0;
    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    return (
        <DetailDrawer
            open={open}
            onClose={onClose}
            title={t("dashboard.net_today")}
            subtitle={today}
        >

            <div className="space-y-6 mt-8">

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">

                    <div className="flex justify-between items-center">

                        <span className="text-gray-400">
                            💰 {t("dashboard.collected_today")}
                        </span>

                        <span className="text-2xl font-bold text-green-400">
                            ₹{(summary?.total_collected || 0).toLocaleString("en-IN")}
                        </span>

                    </div>

                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">

                    <div className="flex justify-between items-center">

                        <span className="text-gray-400">
                            💸 {t("dashboard.expense_today")}
                        </span>

                        <span className="text-2xl font-bold text-red-400">
                            ₹{(summary?.total_expense || 0).toLocaleString("en-IN")}
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
                        {net >= 0 ? t("dashboard.net_today") : "இன்றைய நஷ்டம்"}
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
                        ₹{Math.abs(net).toLocaleString("en-IN")}
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
                            ? "🟢 நிகர வரவு லாபத்தில் உள்ளது"
                            : "🔴 நிகர வரவு குறைவில் உள்ளது"}
                    </p>

                </div>

            </div>

        </DetailDrawer>

    );

}

export default NetDrawer;