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
    const [isEditing, setIsEditing] = useState(false);

    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        address: "",
        due_date: ""
    });
    useEffect(() => {

        if (customer) {

            setEditForm({
                name: customer.name || "",
                phone: customer.phone || "",
                address: customer.address || "",
                due_date: customer.due_date || ""
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
    async function handleActivateLoan() {

        try {

            await activateLoan(customer.customer_id);

            toast.success("Loan activated successfully!");

            await refreshCustomer(customer.customer_id, false);

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.error ||
                "Failed to activate loan."
            );

        }

    }
    async function handleUpdateCustomer() {

        try {

            await updateCustomer(
                customer.customer_id,
                editForm
            );

            toast.success("Customer updated successfully!");

            setIsEditing(false);

            await refreshCustomer(customer.customer_id, false);

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
            bg-[#24324A]
            rounded-2xl
            px-5
            py-5
            shadow-xl
            ring-1
            ring-slate-500/40
        ">

   

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
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
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
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
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
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white resize-none"
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
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
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

            <div className="flex justify-between items-center">
                <span className="text-slate-400">Due Date</span>
                <span>{customer.due_date || "-"}</span>
            </div>

        </div>

    )}

</div>

        <div className="grid grid-cols-3 gap-3">

            <div className="bg-[#192338]
border
border-slate-700 rounded-xl py-3 px-4 text-center">
                <p className="text-xs text-slate-400">
                    Loan
                </p>

                <p className="text-lg lg:text-xl font-bold text-white mt-2">
                    ₹{customer.loan_amount}
                </p>
            </div>

            <div className="bg-[#192338]
border
border-slate-700 rounded-xl py-3 px-4 text-center">
                <p className="text-xs text-slate-400">
                    Paid
                </p>

                <p className="text-lg lg:text-xl font-bold text-emerald-400 mt-2">
                    ₹{customer.total_paid}
                </p>
            </div>

            <div className="bg-[#192338]
                border
                border-slate-700 rounded-xl py-3 px-4 text-center">
                <p className="text-xs text-slate-400">
                    Balance
                </p>

                <p className="text-lg lg:text-xl font-bold text-orange-400 mt-2">
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
                            ? "bg-yellow-500/20 text-yellow-400"
                            : customer.status === "OVERDUE"
                            ? "bg-red-500/20 text-red-400"
                            : customer.balance === 0
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-green-500/20 text-green-400"
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
            bg-[#111827]
            border
            border-slate-800
            rounded-2xl
            p-5
        ">

            <h3 className="text-lg font-semibold mb-4">
                💸 Quick Payment
            </h3>

            {/* Amount */}

            <div className="mb-2">

                <label className="block text-gray-400 mb-2">
                    Amount
                </label>

                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="
                        w-full
                        bg-slate-800
                        border
                        border-slate-700
                        rounded-lg
                        px-4
                        py-2
                        text-white
                        focus:outline-none
                        focus:border-green-500
                    "
                />

            </div>

            {/* Payment Date */}

            <div className="mb-4">

                <label className="block text-gray-400 mb-2">
                    Collection Date
                </label>

                <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="
                        w-full
                        bg-slate-800
                        border
                        border-slate-700
                        rounded-lg
                        px-4
                        py-2
                        text-white
                        focus:outline-none
                        focus:border-green-500
                    "
                />

            </div>

            {/* Button */}

            <button
                onClick={handlePayment}
                className="
                    w-full
                    bg-green-600
                    hover:bg-green-700
                    rounded-lg
                    py-2
                    font-semibold
                    transition
                "
            >
                Collect Payment
            </button>

        </div>
        )}

        <div className="
    bg-[#111827]
    border
    border-slate-800
    rounded-2xl
    p-5
">

            <h3 className="text-lg font-semibold mb-2">
                📊 Loan Progress
            </h3>

            <div className="flex justify-between text-sm mb-2">

                <span>
                    ₹{totalPaid} Paid
                </span>

                <span>
                    {progress.toFixed(0)}%
                </span>

            </div>

            <div className="w-full bg-slate-700 rounded-full h-3">

                <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{
                        width: `${progress}%`
                    }}
                />

            </div>

            <div className="flex justify-between mt-3 text-gray-400">

                <span>
                    Loan ₹{loanAmount}
                </span>

                <span>
                    Balance ₹{balance}
                </span>

            </div>

        </div>


        {customer.type === "DL" && !customer.loan_given && (
        <div className="bg-amber-500/10 border border-amber-500 rounded-xl py-3 px-4">

            <p className="text-amber-400 font-semibold mb-2">
                ⚠️ Loan has not been activated yet.
            </p>

            <button
                onClick={handleActivateLoan}
                className="
                    w-full
                    bg-amber-500
                    hover:bg-amber-600
                    rounded-lg
                    py-2
                    font-semibold
                    transition
                "
            >
                💰 Activate Loan
            </button>

        </div>

    )}
        
        {customer.loan_given && (
        <div className="
    bg-[#111827]
    border
    border-slate-800
    rounded-2xl
    p-5
">

            <h3 className="text-lg font-semibold mb-4">
                💳 Payment History
            </h3>

            {customer.transactions.length === 0 ? (

                <div className="text-gray-400">
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
                        bg-green-600
                        hover:bg-green-700
                        rounded-lg
                        py-2
                        font-semibold
                        transition
                    "
                >
                    ✅ Close Loan
                </button>

            ) : (

                <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="
                        w-full
                        bg-red-600
                        hover:bg-red-700
                        rounded-lg
                        py-2
                        font-semibold
                        transition
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
                    className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-sm"
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
                    className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm"
                >
                    Cancel
                </button>

            </div>

        ) : (

            <button
                onClick={() => setIsEditing(true)}
                className="
w-full
bg-blue-600
hover:bg-blue-700
rounded-lg
py-2
font-semibold
transition
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
</DetailDrawer>

    );
}

export default CustomerProfileDrawer;