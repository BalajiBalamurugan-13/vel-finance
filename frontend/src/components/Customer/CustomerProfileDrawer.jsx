import { useEffect, useState } from "react";
import DetailDrawer from "../DetailDrawer";
import { addPayment } from "../../services/transactionService";
import { toast } from "react-toastify";
import ConfirmDialog from "../ConfirmDialog";
import {
    deleteCustomer,
    activateLoan,
    updateCustomer,
    closeLoan
} from "../../services/customerService";
import { getPlaces } from "../../services/placeService";
import logoWatermark from "../../assets/Vel finance logo white.png";


function CustomerProfileDrawer({
    open,
    onClose,
    customer,
    refreshCustomer,
    refreshCustomers
})  {
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showCloseLoanDialog, setShowCloseLoanDialog] = useState(false);
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [activateLoanDate, setActivateLoanDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [activateDueDate, setActivateDueDate] = useState("");
    const [activating, setActivating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [places, setPlaces] = useState([]);

    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        address: "",
        due_date: "",
        place_id: ""
    });

    useEffect(() => {
        getPlaces()
            .then((data) => {
                setPlaces(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("[CustomerProfileDrawer] getPlaces failed:", err);
                setPlaces([]);
            });
    }, []);

    useEffect(() => {

        if (customer) {

            setEditForm({
                name: customer.name || "",
                phone: customer.phone || "",
                address: customer.address || "",
                due_date: customer.due_date || "",
                place_id: customer.place_id ?? ""
            });

        }

    }, [customer]);

    if (!customer) {
        console.log(customer);
        console.log("Reached Quick Payment");
        return (

            <DetailDrawer
                open={open}
                onClose={onClose}
                title="Loading..."
                subtitle="Fetching customer details..."
                headers={[]}
            >

                <div className="py-20 text-center text-gray-400">

                    Loading customer...

                </div>

            </DetailDrawer>

        );

    }
    async function handlePayment() {

        if (!amount || Number(amount) <= 0) {
            toast.warning("Please enter a valid amount.");
            return;
        }

        try {

            await addPayment({
            customer_id: customer.customer_id,
            amount_paid: Number(amount),
            payment_date: paymentDate
        });

        // Reload latest customer details
        await refreshCustomer(customer.customer_id, false);

        setAmount("");
        setPaymentDate(new Date().toISOString().split("T")[0]);
        toast.success("Payment collected successfully!");
        

        } catch (error) {

            console.error(error);

            toast.error("Failed to collect payment.");

        }

    }
    async function handleDelete() {

        try {

            await deleteCustomer(customer.customer_id);

            toast.success("Customer deleted successfully!");

            await refreshCustomers();

            setShowDeleteDialog(false);

            onClose();

        } catch (error) {

            console.error(error);

            toast.error("Failed to delete customer.");

        }

    }
    async function handleCloseLoan() {

        try {

            await closeLoan(customer.customer_id);

            toast.success("Loan closed successfully!");

            await refreshCustomers();

            setShowCloseLoanDialog(false);

            onClose();

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.error ||
                "Failed to close loan."
            );

        }

    }
    async function handleConfirmActivateLoan() {

        if (!activateLoanDate) {
            toast.warning("Please select a valid Loan Given Date.");
            return;
        }

        if (customer.type === "Furniture" && !activateDueDate) {
            toast.warning("Please select a valid Due Date.");
            return;
        }

        setActivating(true);
        try {

            const payload = {
                loan_date: activateLoanDate,
                ...(customer.type === "Furniture" ? { due_date: activateDueDate } : {})
            };

            await activateLoan(customer.customer_id, payload);

            toast.success("Loan activated successfully!");

            setShowActivateModal(false);

            await refreshCustomer(customer.customer_id, false);
            if (refreshCustomers) {
                await refreshCustomers();
            }

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.error ||
                "Failed to activate loan."
            );

        } finally {
            setActivating(false);
        }

    }
    async function handleUpdateCustomer() {

        try {

            // Build explicit payload so place_id (even null) is sent to backend
            const updatePayload = {
                name:     editForm.name,
                phone:    editForm.phone,
                address:  editForm.address,
                due_date: editForm.due_date || undefined,
                place_id: editForm.place_id !== "" && editForm.place_id !== null && editForm.place_id !== undefined
                    ? Number(editForm.place_id)
                    : null,
            };
            await updateCustomer(
                customer.customer_id,
                updatePayload
            );

            toast.success("Customer updated successfully!");

            setIsEditing(false);

            await refreshCustomer(customer.customer_id, false);
            if (refreshCustomers) {
                await refreshCustomers();
            }

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.error ||
                "Failed to update customer."
            );

        }

}
    const loanAmount = customer.loan_amount || 0;

    const totalPaid = customer.total_paid || 0;

    const balance = customer.balance || 0;

    const progress =
        loanAmount > 0
            ? Math.min((totalPaid / loanAmount) * 100, 100)
            : 0;

    return (

        <DetailDrawer
            open={open}
            onClose={onClose}
            title=""
            subtitle=""
            headers={[]}
        >
    <div className="space-y-4">
        <div className="
            relative
            bg-[#182238]
            border
            border-slate-800
            rounded-2xl
            p-5
            shadow-lg
            overflow-hidden
        ">
            {/* Subtle Centered Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
                <img
                    src={logoWatermark}
                    alt=""
                    className="w-56 h-56 max-w-[70%] max-h-[70%] object-contain opacity-[0.14] select-none pointer-events-none transform -translate-x-[4.5%] translate-y-[2%]"
                />
            </div>

            <div className="relative z-10 space-y-4">

   

    {isEditing ? (

        <div className="space-y-4">

            <div>
                <label className="text-sm text-slate-300">
                    Name
                </label>

                <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                        setEditForm({
                            ...editForm,
                            name: e.target.value
                        })
                    }
                    className="w-full mt-1 bg-[#0f172a] border border-slate-700/80 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
            </div>

            <div>
                <label className="text-sm text-slate-400">
                    Phone
                </label>

                <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) =>
                        setEditForm({
                            ...editForm,
                            phone: e.target.value
                        })
                    }
                    className="w-full mt-1 bg-[#0f172a] border border-slate-700/80 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
            </div>

            <div>
                <label className="text-sm text-slate-400">
                    Address
                </label>

                <textarea
                    rows={2}
                    value={editForm.address}
                    onChange={(e) =>
                        setEditForm({
                            ...editForm,
                            address: e.target.value
                        })
                    }
                    className="w-full mt-1 bg-[#0f172a] border border-slate-700/80 rounded-xl px-3.5 py-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
            </div>

            <div>
                <label className="text-sm text-slate-400">
                    Due Date
                </label>

                <input
                    type="date"
                    value={editForm.due_date}
                    onChange={(e) =>
                        setEditForm({
                            ...editForm,
                            due_date: e.target.value
                        })
                    }
                    className="w-full mt-1 bg-[#0f172a] border border-slate-700/80 rounded-xl px-3.5 py-3 text-white color-scheme-dark focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
            </div>

            <div>
                <label className="text-sm text-slate-400">Place</label>
                <select
                    value={editForm.place_id ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, place_id: e.target.value ? Number(e.target.value) : "" })}
                    className="w-full mt-1 bg-[#0f172a] border border-slate-700/80 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                    <option value="">Not Assigned</option>
                    {places.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
            </div>

        </div>

    ) : (

        <div className="space-y-4">

            <div className="flex justify-between items-center">
                <span className="text-slate-400">Name</span>
                <span className="font-semibold text-white text-lg">{customer.name}</span>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-slate-400">Customer ID</span>
                <span className="font-semibold text-white text-lg">{customer.customer_id}</span>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-slate-400">Phone</span>
                <span className="font-semibold text-white text-lg">{customer.phone || "-"}</span>
            </div>

            <div className="flex justify-between items-start gap-6">
                <span className="text-slate-400 shrink-0">
                    Address
                </span>

                <span className="text-right text-slate-200 break-words max-w-[65%]">
                    {customer.address || "-"}
                </span>
            </div>

            {customer.loan_date && (
                <div className="flex justify-between items-center">
                    <span className="text-slate-400">Loan Date</span>
                    <span className="text-slate-200">{customer.loan_date}</span>
                </div>
            )}

            <div className="flex justify-between items-center">
                <span className="text-slate-400">Due Date</span>
                <span>{customer.due_date || "-"}</span>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-slate-400">Place</span>
                <span className="font-medium text-slate-200">{customer.place_name || "Not Assigned"}</span>
            </div>

        </div>

    )}

    </div>
</div>

        <div className="grid grid-cols-3 gap-3">

            <div className="bg-[#111827] border border-slate-800 rounded-xl py-3 px-4 text-center">
                <p className="text-xs text-slate-400 font-medium">
                    Loan
                </p>

                <p className="text-lg lg:text-xl font-bold text-white mt-1">
                    ₹{customer.loan_amount}
                </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl py-3 px-4 text-center">
                <p className="text-xs text-slate-400 font-medium">
                    Paid
                </p>

                <p className="text-lg lg:text-xl font-bold text-emerald-400 mt-1">
                    ₹{customer.total_paid}
                </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl py-3 px-4 text-center">
                <p className="text-xs text-slate-400 font-medium">
                    Balance
                </p>

                <p className="text-lg lg:text-xl font-bold text-amber-400 mt-1">
                    ₹{customer.balance}
                </p>
            </div>

        </div>

        <div className="flex justify-center">

            <span
                className={`
                    inline-flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    rounded-full
                    text-sm
                    font-semibold
                    ${
                        !customer.loan_given
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : customer.status === "OVERDUE"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : customer.balance === 0
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }
                `}
            >
                {!customer.loan_given
                    ? "🟡 Loan Not Activated"
                    : customer.status === "OVERDUE"
                    ? `🔴 ${customer.overdue_days} Days Overdue`
                    : customer.balance === 0
                    ? "🎉 Loan Completed"
                    : "🟢 Active Loan"}
            </span>

        </div>
        
        {customer.loan_given && !customer.ready_to_close && (
        <div className="
            bg-[#182238]
            border
            border-slate-800
            rounded-2xl
            p-5
            shadow-lg
            space-y-4
        ">

            <h3 className="text-lg font-semibold text-white">
                💸 Quick Payment
            </h3>

            {/* Amount */}

            <div>

                <label className="block text-slate-300 text-sm font-medium mb-2">
                    Amount
                </label>

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2 mb-2.5">
                    {[50, 100, 150, 200, 250].map((amt) => (
                        <button
                            key={amt}
                            type="button"
                            onClick={() => setAmount(String(amt))}
                            className={`
                                flex-1 min-w-[52px] py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center
                                ${Number(amount) === amt
                                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40"
                                    : "bg-[#0f172a] text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white active:scale-95"
                                }
                            `}
                        >
                            ₹{amt}
                        </button>
                    ))}
                </div>

                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="
                        w-full
                        bg-[#0f172a]
                        border
                        border-slate-700/80
                        rounded-xl
                        px-4
                        py-3.5
                        text-white
                        placeholder:text-slate-500
                        focus:outline-none
                        focus:ring-2
                        focus:ring-emerald-500
                        focus:border-transparent
                        transition-all
                    "
                />

            </div>

            {/* Payment Date */}

            <div>

                <label className="block text-slate-300 text-sm font-medium mb-2">
                    Collection Date
                </label>

                <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="
                        w-full
                        bg-[#0f172a]
                        border
                        border-slate-700/80
                        rounded-xl
                        px-4
                        py-3.5
                        text-white
                        color-scheme-dark
                        focus:outline-none
                        focus:ring-2
                        focus:ring-emerald-500
                        focus:border-transparent
                        transition-all
                    "
                />

            </div>

            {/* Button */}

            <button
                onClick={handlePayment}
                className="
                    w-full
                    bg-emerald-600
                    hover:bg-emerald-500
                    active:scale-[0.98]
                    rounded-xl
                    py-3.5
                    font-semibold
                    text-white
                    shadow-lg
                    shadow-emerald-950/40
                    transition-all
                "
            >
                Collect Payment
            </button>

        </div>
        )}

        <div className="
            bg-[#182238]
            border
            border-slate-800
            rounded-2xl
            p-5
            shadow-lg
        ">

            <h3 className="text-lg font-semibold text-white mb-3">
                📊 Loan Progress
            </h3>

            <div className="flex justify-between text-sm mb-2">

                <span className="text-slate-300 font-medium">
                    ₹{totalPaid} Paid
                </span>

                <span className="text-emerald-400 font-semibold">
                    {progress.toFixed(0)}%
                </span>

            </div>

            <div className="w-full bg-[#0f172a] rounded-full h-3 overflow-hidden border border-slate-800">

                <div
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{
                        width: `${progress}%`
                    }}
                />

            </div>

            <div className="flex justify-between mt-3 text-xs text-slate-400">

                <span>
                    Loan ₹{loanAmount}
                </span>

                <span>
                    Balance ₹{balance}
                </span>

            </div>

        </div>


        {!customer.loan_given && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl py-3.5 px-4">

            <p className="text-amber-400 font-semibold mb-2 text-sm">
                ⚠️ Loan has not been activated yet.
            </p>

            <button
                onClick={() => {
                    setActivateLoanDate(new Date().toISOString().split("T")[0]);
                    setActivateDueDate(customer.due_date || "");
                    setShowActivateModal(true);
                }}
                className="
                    w-full
                    bg-amber-500
                    hover:bg-amber-600
                    rounded-xl
                    py-3
                    font-semibold
                    text-slate-950
                    transition
                "
            >
                💰 Activate Loan
            </button>

        </div>

    )}
        
        {customer.loan_given && (
        <div className="
            bg-[#182238]
            border
            border-slate-800
            rounded-2xl
            p-5
            shadow-lg
        ">

            <h3 className="text-lg font-semibold text-white mb-4">
                💳 Payment History
            </h3>

            {customer.transactions.length === 0 ? (

                <div className="text-slate-400 text-sm">
                    No payments yet.
                </div>

            ) : (

                (customer.transactions || [])
                .slice()
                .reverse()
                .map((txn, index) => (

                    <div
                        key={index}
                        className="
                        flex
                        justify-between
                        items-center
                        py-3
                        border-b
                        border-slate-800
                        last:border-0
                        "
                    >
                     <>
                        <span className="font-semibold text-emerald-400">
                            ₹{txn.amount_paid}
                        </span>

                        <span className="text-sm text-slate-400">
                            {new Date(txn.payment_date).toLocaleDateString("en-IN")}
                        </span>
                    </>   
                    </div>

            ))

            )}

        </div>
        )}
        <div className="mt-2">

            {customer.ready_to_close ? (

                <button
                    onClick={() => setShowCloseLoanDialog(true)}
                    className="
                        w-full
                        bg-emerald-600
                        hover:bg-emerald-500
                        active:scale-[0.98]
                        rounded-xl
                        py-3.5
                        font-semibold
                        text-white
                        shadow-lg
                        transition-all
                    "
                >
                    ✅ Close Loan
                </button>

            ) : (

                <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="
                        w-full
                        bg-rose-600
                        hover:bg-rose-500
                        active:scale-[0.98]
                        rounded-xl
                        py-3.5
                        font-semibold
                        text-white
                        shadow-lg
                        transition-all
                    "
                >
                    🗑 Delete Customer
                </button>

            )}

        </div>
        <div className="mt-3">

        {isEditing ? (

            <div className="flex gap-2">

                <button
                    onClick={handleUpdateCustomer}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-white font-semibold shadow-md active:scale-[0.98] transition-all"
                >
                    Save
                </button>

                <button
                    onClick={() => {
                        setIsEditing(false);

                        setEditForm({
                            name: customer.name || "",
                            phone: customer.phone || "",
                            address: customer.address || "",
                            due_date: customer.due_date || ""
                        });
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-slate-300 font-semibold active:scale-[0.98] transition-all"
                >
                    Cancel
                </button>

            </div>

        ) : (

            <button
                onClick={() => setIsEditing(true)}
                className="
                    w-full
                    bg-sky-600
                    hover:bg-sky-500
                    active:scale-[0.98]
                    rounded-xl
                    py-3.5
                    font-semibold
                    text-white
                    shadow-lg
                    transition-all
                "
            >
                ✏️ Edit
            </button>

        )}

    </div>
    </div>
    <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Customer?"
        message={
    `Deleting this customer will permanently remove:

    • Customer profile
    • Payment history
    • Transaction records

    This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
    />
    <ConfirmDialog
        open={showCloseLoanDialog}
        title="Close Completed Loan?"
        message={`
    This customer has completed all payments.

    Closing the loan will:

    • Delete Customer
    • Delete Payment History
    • Delete Transactions

    Cashbook entries will be kept.

    Do you want to continue?
    `}
        confirmText="Close Loan"
        cancelText="Cancel"
        onCancel={() => setShowCloseLoanDialog(false)}
        onConfirm={handleCloseLoan}
    />

    {showActivateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
            <div className="relative bg-[#182238] rounded-2xl p-6 w-full max-w-sm mx-auto border border-slate-800 shadow-2xl overflow-hidden">
                {/* Subtle Centered Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
                    <img
                        src={logoWatermark}
                        alt=""
                        className="w-60 h-60 max-w-[65%] max-h-[65%] object-contain opacity-[0.14] select-none pointer-events-none transform -translate-x-[4.5%] translate-y-[2%]"
                    />
                </div>

                {/* Modal Content */}
                <div className="relative z-10 space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        💰 Activate Loan
                    </h2>

                    <p className="text-slate-300 text-sm leading-relaxed">
                        {customer.type === "Furniture"
                            ? "Enter the loan dates before activation."
                            : "Enter the date on which the loan was actually given."}
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Loan Given Date <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="date"
                            value={activateLoanDate}
                            onChange={(e) => setActivateLoanDate(e.target.value)}
                            className="w-full bg-[#0f172a] border border-slate-700/80 rounded-xl px-4 py-3.5 text-white color-scheme-dark focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {customer.type === "Furniture" && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Due Date <span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="date"
                                value={activateDueDate}
                                onChange={(e) => setActivateDueDate(e.target.value)}
                                className="w-full bg-[#0f172a] border border-slate-700/80 rounded-xl px-4 py-3.5 text-white color-scheme-dark focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            disabled={activating}
                            onClick={() => setShowActivateModal(false)}
                            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition active:scale-[0.98] disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={activating || !activateLoanDate || (customer.type === "Furniture" && !activateDueDate)}
                            onClick={handleConfirmActivateLoan}
                            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold transition active:scale-[0.98] shadow-md shadow-amber-950/30 disabled:opacity-50 flex items-center gap-2"
                        >
                            {activating ? (
                                <>
                                    <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                                    Activating...
                                </>
                            ) : (
                                "Activate Loan"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )}
</DetailDrawer>

    );
}

export default CustomerProfileDrawer;
