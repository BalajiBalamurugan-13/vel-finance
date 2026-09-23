import { useMemo, useState } from "react";
import DetailDrawer from "../DetailDrawer";
import CollectionCard from "../CollectionCard";
import { useLanguage } from "../../context/LanguageContext";

function CollectionDrawer({
    open,
    onClose,
    collections
}) {
    const { t } = useLanguage();
    const [search, setSearch] = useState("");

    const totalCollected = (collections || []).reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
    );

    const filteredCollections = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) return collections || [];

        return (collections || []).filter((payment) =>
            (payment.customer_name && payment.customer_name.toLowerCase().includes(query)) ||
            (payment.customer_id && payment.customer_id.toString().includes(query)) ||
            (payment.address && payment.address.toLowerCase().includes(query))
        );

    }, [collections, search]);

    return (
        <DetailDrawer
            open={open}
            title={t("dashboard.recent_collections")}
            onClose={onClose}
            subtitle={`👥 ${(collections || []).length} ${t("daily_collection.collected_count")} • 💰 ₹${totalCollected.toLocaleString("en-IN")}`}
            headers={[]}
        >

            {/* Search Box */}
            <div className="mb-5">
                <input
                    type="text"
                    placeholder={t("customers.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="
                        w-full
                        bg-slate-900
                        border
                        border-slate-700
                        rounded-lg
                        px-4
                        py-3
                        text-white
                        placeholder:text-slate-500
                        focus:outline-none
                        focus:border-emerald-500
                    "
                />
            </div>
            <div
                className="grid gap-2 px-2 mb-3 text-xs font-semibold text-slate-400 uppercase"
                style={{ gridTemplateColumns: "55px 80px 1fr 80px" }}
            >
                <div>{t("dashboard.customer_id")}</div>
                <div>{t("dashboard.name")}</div>
                <div>{t("customers.place")}</div>
                <div className="text-right">{t("dashboard.amount")}</div>
            </div>

            {/* Empty State */}
            {filteredCollections.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                    {t("dashboard.no_collections_yet")}
                </div>
            ) : (
                filteredCollections.map((payment) => (
                    <CollectionCard
                        key={payment.created_at || payment.id}
                        payment={payment}
                    />
                ))
            )}

        </DetailDrawer>
    );
}

export default CollectionDrawer;