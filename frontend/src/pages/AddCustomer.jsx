import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCustomer } from "../services/customerService";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

function AddCustomer() {
  const navigate = useNavigate();
  const inputStyles = `
  w-full
  rounded-xl
  border
  border-slate-600
  bg-slate-800
  px-4
  py-4
  text-white
  text-base
  placeholder:text-slate-500
  transition-all
  duration-200
  focus:outline-none
  focus:ring-2
  focus:ring-emerald-500
  focus:border-transparent
  `;

  const labelStyles =
    "block text-sm font-medium text-slate-300 mb-2";
  const [formData, setFormData] = useState({
      customer_id: "",
      name: "",
      phone: "",
      address: "",
      selling_price: "",
      advance_amount: "",
      interest: "",
      loan_amount: "",
      loan_date: "",
      due_date: "",
      type: "Furniture",
      loan_given: true,
      
    });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

    function calculateLoanDetails(
      loanAmount,
      manualInterest,
      advanceAmount,
      loanDate,
      type
  ) {
    const amount = Number(loanAmount) || 0;

    let interest = 0;
    let dailyCollection = 0;
    let dueDate = "";

    if (type === "DL") {
      if (amount > 0) {
        interest = Math.round((amount * 12) / 100 + 50);
      }

      dailyCollection =
        amount > 0
          ? amount / 100
          : 0;

      if (loanDate) {
        const date = new Date(loanDate);
        date.setDate(date.getDate() + 100);

        dueDate = date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }

    } 
    else {

      const sellingPrice = Number(loanAmount) || 0;
      const advance = Number(advanceAmount) || 0;

      interest = Number(manualInterest) || 0;

      const purchaseCost =
          sellingPrice > 0
              ? sellingPrice - interest
              : 0;

      const remainingAmount =
          sellingPrice > 0
              ? sellingPrice - advance
              : 0;

      return {
          interest,
          purchaseCost,
          remainingAmount,
          dailyCollection,
          dueDate,
      };
  }

  const netGiven =
      amount > 0
          ? amount - interest
          : 0;

  return {
      interest,
      netGiven,
      dailyCollection,
      dueDate,
  };
  }
  const loan = calculateLoanDetails(
    formData.type === "Furniture"
        ? formData.selling_price
        : formData.loan_amount,
    formData.interest,
    formData.advance_amount,
    formData.loan_date,
    formData.type
);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({
    ...prev,
    [name]: "",
    }));
  }
  async function handleSubmit() {

  setErrors({});

  // Customer ID
  if (Number(formData.customer_id) <= 0) {

    setErrors({
        customer_id: "Enter a valid Customer ID",
    });

    return;
}

  // Name
  if (!formData.name.trim()) {
    setErrors({
        name: "Customer Name is required",
    });
    return;
  }

  // Phone
  if (!formData.phone.trim()) {

    setErrors({
        phone: "Phone Number is required",
    });

    return;
}

  if (formData.phone.length < 10) {

    setErrors({
        phone: "Enter a valid 10-digit Phone Number",
    });

    return;
}

  // Loan Amount / Selling Price
  const enteredAmount =
    formData.type === "Furniture"
        ? Number(formData.selling_price)
        : Number(formData.loan_amount);

  if (enteredAmount <= 0) {
    toast.error(
      formData.type === "DL"
        ? "Loan Amount is required"
        : "Selling Price is required"
    );
    return;
  }

  // Loan Date / Delivery Date
  if (!formData.loan_date) {
    toast.error(
      formData.type === "DL"
        ? "Loan Date is required"
        : "Delivery Date is required"
    );
    return;
  }

  // Furniture Validation
  if (formData.type === "Furniture") {

    if (Number(formData.interest) <= 0) {
      toast.error("Profit must be greater than zero");
      return;
    }

    if (
        Number(formData.interest) >=
        Number(formData.selling_price)
    ) {
      toast.error("Profit cannot be greater than Selling Price");
      return;
    }

    if (!formData.due_date) {
      toast.error("Expected Completion is required");
      return;
    }
  }

  setLoading(true);

try {
  await addCustomer({
    customer_id: Number(formData.customer_id),
    name: formData.name,
    phone: formData.phone,
    address: formData.address,
    interest: loan.interest,
    selling_price:
    formData.type === "Furniture"
        ? Number(formData.selling_price)
        : null,
    advance_amount:
    formData.type === "Furniture"
        ? Number(formData.advance_amount)
        : 0,
    loan_amount:
    formData.type === "Furniture"
        ? Number(formData.selling_price) - Number(formData.advance_amount)
        : Number(formData.loan_amount),
    loan_date: formData.loan_date,
    due_date: formData.due_date,
    type: formData.type,
    loan_given:
      formData.type === "DL"
        ? formData.loan_given
        : true,
  });

  toast.success("Customer added successfully");
  navigate("/customers");

} catch (error) {
  console.error(error);

  const message =
    error.response?.data?.detail ||
    error.response?.data?.error ||
    "Failed to add customer";

  toast.error(message);

} finally {
  setLoading(false);
}
}

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 pb-10">
      <h1 className="text-2xl font-bold mb-6">Add Customer</h1>

      <div className="
bg-slate-900
border
border-slate-800
rounded-2xl
p-6
space-y-6
shadow-lg
">
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={inputStyles}
        >
          <option value="Furniture">Furniture</option>
          <option value="DL">DL</option>
       </select>

       <div>
        <label className={labelStyles}>
          Customer ID <span className="text-red-400">*</span>
        </label>

        <input
          type="number"
          onWheel={(e) => e.target.blur()}
          inputMode="numeric"
          name="customer_id"
          placeholder="Enter customer ID"
          value={formData.customer_id}
          onChange={handleChange}
          className={inputStyles}
        />
        {errors.customer_id && (
              <p className="mt-2 text-sm text-red-400">
                  {errors.customer_id}
              </p>
          )}
      </div>

      <div>
          <label className={labelStyles}>
              Customer Name <span className="text-red-400">*</span>
          </label>

          <input
              type="text"
              name="name"
              placeholder="Enter customer name"
              value={formData.name}
              onChange={handleChange}
              className={inputStyles}
          />
          {errors.name && (
              <p className="mt-2 text-sm text-red-400">
                  {errors.name}
              </p>
          )}
      </div>

      <div>
        <label className={labelStyles}>
            Phone Number <span className="text-red-400">*</span>
        </label>

        <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            name="phone"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");

              if (value.length <= 10) {
                  setFormData((prev) => ({
                      ...prev,
                      phone: value,
                  }));

                  setErrors((prev) => ({
                      ...prev,
                      phone: "",
                  }));
              }
          }}
            className={inputStyles}
        />
        {errors.phone && (
            <p className="mt-2 text-sm text-red-400">
                {errors.phone}
            </p>
        )}
    </div>

    <div>
        <label className={labelStyles}>
            Address
        </label>

        <textarea
            rows={4}
            name="address"
            placeholder="Enter address"
            value={formData.address}
            onChange={handleChange}
            className={inputStyles}
        />
    </div>

        {formData.type === "Furniture" ? (

        <div>
            <label className={labelStyles}>
                Selling Price <span className="text-red-400">*</span>
            </label>

            <input
                type="number"
                onWheel={(e) => e.target.blur()}
                inputMode="numeric"
                name="selling_price"
                placeholder="Enter selling price"
                value={formData.selling_price}
                onChange={handleChange}
                className={inputStyles}
            />
        </div>

    ) : (

        <div>
            <label className={labelStyles}>
                Loan Amount <span className="text-red-400">*</span>
            </label>

            <input
                type="number"
                onWheel={(e) => e.target.blur()}
                inputMode="numeric"
                name="loan_amount"
                placeholder="Enter loan amount"
                value={formData.loan_amount}
                onChange={handleChange}
                className={inputStyles}
            />
        </div>

    )}
        {formData.type === "Furniture" && (
        <div>
            <label className={labelStyles}>
                Profit <span className="text-red-400">*</span>
            </label>

            <input
                type="number"
                onWheel={(e) => e.target.blur()}
                inputMode="numeric"
                name="interest"
                placeholder="Enter profit"
                value={formData.interest}
                onChange={handleChange}
                className={inputStyles}
            />
        </div>
        )}

        {formData.type === "Furniture" && (
        <div>
            <label className={labelStyles}>
                Advance Received
            </label>

            <input
                type="number"
                onWheel={(e) => e.target.blur()}
                inputMode="numeric"
                name="advance_amount"
                placeholder="Enter advance amount"
                value={formData.advance_amount}
                onChange={handleChange}
                className={inputStyles}
            />
        </div>
        )}
        {formData.type === "Furniture" && (
          <div
            className="
              bg-slate-800/60
              border
              border-slate-700
              rounded-2xl
              p-5
              shadow-md
            "
          >
            <h3 className="text-lg font-semibold text-white">
                Order Summary
            </h3>

            <div className="border-t border-slate-700 my-4"></div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">
                  Purchase Cost
              </span>
              <span className="text-lg font-bold text-white">
                  ₹{loan.purchaseCost}
              </span>
          </div>

          <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">
                  Remaining Balance
              </span>
              <span className="text-lg font-bold text-emerald-400">
                  ₹{loan.remainingAmount}
              </span>
          </div>
          </div>
        )}
        <div>
        <label className={labelStyles}>
            {formData.type === "DL"
                ? <>Loan Date <span className="text-red-400">*</span></>
                : <>Delivery Date <span className="text-red-400">*</span></>}
        </label>

        <input
            type="date"
            name="loan_date"
            value={formData.loan_date}
            onChange={handleChange}
            className={`${inputStyles} color-scheme-dark`}
        />
      </div>

        {formData.type === "DL" ? (

        <div
  className="
    bg-slate-800/60
    border
    border-slate-700
    rounded-2xl
    p-6
    shadow-md
    space-y-5
  "
>

          <h3 className="text-xl font-bold text-white">
              Loan Summary
          </h3>

          <div className="border-t border-slate-700"></div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-400">
                Interest (12% + ₹50)
            </span>
            <span className="text-lg font-bold text-white">
              ₹{loan.interest}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-400">
                Net Given
            </span>
            <span className="text-lg font-bold text-emerald-400">
              ₹{loan.netGiven}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-400">
                Daily Collection
            </span>
            <span className="text-lg font-bold text-blue-400">
              ₹{loan.dailyCollection}/day
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-700 pt-5 mt-2">
            <span className="text-slate-400">
                Due Date
            </span>
            <span className="text-lg font-semibold text-white">
              {loan.dueDate || "-"}
            </span>
          </div>

        </div>

      ) : (

        <div>
            <label className={labelStyles}>
                Expected Completion <span className="text-red-400">*</span>
            </label>

            <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className={`${inputStyles} color-scheme-dark`}
            />
        </div>

      )}

        {formData.type === "DL" && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
            type="checkbox"
            className="
                h-5
                w-5
                rounded
                border-slate-600
                text-emerald-500
                focus:ring-emerald-500
            "
              name="loan_given"
              checked={formData.loan_given}
              onChange={handleChange}
            />
            <span className="text-white font-medium">
                Loan Given
            </span>
          </label>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full rounded-xl py-4 text-white font-semibold tracking-wide transition-all duration-200 ${
            loading
              ? "bg-slate-600 cursor-wait"
              : "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] shadow-lg"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Saving...
            </span>
          ) : (
            "Save Customer"
          )}
        </button>

      </div>
    </div>
  );
}

export default AddCustomer;