import { useMemo, useState } from "react";
import DetailDrawer from "../DetailDrawer";
import CollectionCard from "../CollectionCard";

function CollectionDrawer({
    open,
    onClose,
    collections
}) {

    const [search, setSearch] = useState("");

    const totalCollected = collections.reduce(
        (sum, payment) => sum + payment.amount,
        0
    );

    const filteredCollections = useMemo(() => {

        const query = search.toLowerCase();

        return collections.filter((payment) =>
            payment.customer_name.toLowerCase().includes(query) ||
            payment.customer_id.toString().includes(query) ||
            payment.address.toLowerCase().includes(query)
        );

    }, [collections, search]);

    return (
        <DetailDrawer
            open={open}
            title="Today's Collections"
            onClose={onClose}
            subtitle={`👥 ${collections.length} Customers Paid • 💰 ₹${totalCollected}`}
            headers={[]}
        >

            {/* Search Box */}

            <div className="mb-5">

                <input
                    type="text"
                    placeholder="🔍 Search by ID, Name or Place..."
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
                        focus:border-green-500
                    "
                />

            </div>
            <div
                className="grid gap-2 px-2 mb-3 text-xs font-semibold text-slate-400 uppercase"
                style={{ gridTemplateColumns: "55px 80px 1fr 80px" }}
            >
                <div>ID</div>
                <div>Name</div>
                <div>Place</div>
                <div className="text-right">Amount</div>
            </div>

            {/* Empty State */}

            {filteredCollections.length === 0 ? (

                <div className="text-center text-gray-400 py-10">
                    No matching collections found.
                </div>

            ) : (

                filteredCollections.map((payment) => (
                    <CollectionCard
                        key={payment.created_at}
                        payment={payment}
                    />
                ))

            )}

        </DetailDrawer>
    );
}

export default CollectionDrawer;    