import streamlit as st
import requests
from datetime import date
import time

# ✅ MUST BE FIRST STREAMLIT CALL
st.set_page_config(page_title="VEL Finance", layout="wide")

# 🎨 UI STYLE
st.markdown("""
<style>
.block-container {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
}
.stButton>button {
    width: 100%;
    border-radius: 10px;
    height: 45px;
    font-weight: bold;
}
.stTextInput>div>div>input {
    border-radius: 8px;
}
</style>
""", unsafe_allow_html=True)
st.markdown("""
<style>
.metric-card {
    background: #1e1e1e;
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0px 2px 6px rgba(0,0,0,0.3);
}
</style>
""", unsafe_allow_html=True)

API_BASE = "https://velfinance.onrender.com"
# ================= HELPERS =================

def fetch_with_retry(url):

    for _ in range(3):
        try:
            res = requests.get(url, timeout=30)

            if res.status_code == 200:
                return res.json()

        except Exception as e:
            print("ERROR:", e)
            time.sleep(3)

    return None


@st.cache_data(ttl=60)
def get_customers_cached():
    return fetch_with_retry(f"{API_BASE}/customers/")


@st.cache_data(ttl=30)
def get_dashboard_data():
    return fetch_with_retry(f"{API_BASE}/transactions/dashboard")


@st.cache_data(ttl=60)
def get_cash_balance():
    return fetch_with_retry(f"{API_BASE}/transactions/cash-balance")


@st.cache_data(ttl=60)
def get_expected_profit():
    return fetch_with_retry(f"{API_BASE}/transactions/expected-profit")

@st.cache_data(ttl=30)
def get_history_data(selected_date):
    return fetch_with_retry(f"{API_BASE}/transactions/summary-by-date/{selected_date}")

@st.cache_data(ttl=60)
def get_profit_by_category():
    return fetch_with_retry(f"{API_BASE}/transactions/profit-by-category")

@st.cache_data(ttl=60)
def get_outstanding_data():
    return fetch_with_retry(f"{API_BASE}/transactions/outstanding-by-type")

@st.cache_data(ttl=60)
def get_profit_summary():
    return fetch_with_retry(f"{API_BASE}/transactions/profit-summary")


if "customers" not in st.session_state:
    st.session_state["customers"] = get_customers_cached()


def is_online():
    try:
        requests.get(f"{API_BASE}/health", timeout=3)
        return True
    except:
        return False
    
# ================= SIDEBAR =================
page = st.sidebar.selectbox("Menu", [
    "Dashboard",
    "View Customer",
    "Add Customer",
    "Add Expense",
    "History",
    "Business Summary"
])

st.title("Welcome to VEL Finance ")

if "msg" in st.session_state:
    st.success(st.session_state["msg"])
    del st.session_state["msg"]

if is_online():
    st.success("🟢 Online Mode")
else:
    st.error("🔴 No Internet / Server Down")

# ================= DASHBOARD =================
if page == "Dashboard":
    st.markdown("## 📊 Today Summary")
    with st.spinner("Loading data..."):
        data = get_dashboard_data()
    if not data:
        st.error("⚠️ Server busy, try again")
        st.stop()

    if "error" in data:
        st.warning("⚠️ Server busy, try again")
        st.stop()

    summary = data.get("summary", {})
    not_paid = data.get("not_paid", [])
    gaps = data.get("gaps", [])


    col1, col2, col3= st.columns(3)

    col1.metric("💰 Collected", f"₹{summary.get('total_collected', 0)}")
    col2.metric("💸 Expense", f"₹{summary.get('total_expense', 0)}")
    col3.metric("📊 Net", f"₹{summary.get('net_amount', 0)}")
    st.divider()

    st.markdown("### ⚠️ Not Paid Today")

    if not_paid:
        for c in not_paid:
            st.warning(f"{c['customer_id']} - {c['name']}")
    else:
        st.success("All paid today ✅")

# ================= ADD EXPENSE =================
if page == "Add Expense":

    st.markdown("## 💸 Add Expense")

    amount = st.number_input("Amount", step=10, min_value=0, value=None, placeholder="Enter amount")
    note = st.text_input("Note", placeholder="Enter expense note")

    if st.button("➕ ADD EXPENSE", use_container_width=True):

        if amount <= 0 or not note.strip():
            st.error("Enter valid amount")
            st.stop()

        try:
            with st.spinner("Processing..."):
                res = requests.post(
                    f"{API_BASE}/expenses/add",
                    json={
                        "amount": int(amount),
                        "note": note,
                        "date": str(date.today())
                    },
                    timeout=5
                )

            if res.status_code == 200:
                st.cache_data.clear()
                st.success(f"Expense added ₹{amount}")
            else:
                st.error("❌ Failed to add expense")

        except Exception as e:
            if "timeout" in str(e).lower():
                st.warning("⚠️ Server slow, but expense may be saved")
            else:
                st.error("❌ Connection error")


# ================= VIEW CUSTOMER =================
if page == "View Customer":
  
    st.markdown("## 🔍 Customer Details")

    customers = st.session_state.get("customers", [])

    if not customers:
        st.error("Failed to load customers")
        st.stop()

    search = (st.text_input("Search Customer") or "").strip()

    filtered = [
        c for c in customers
        if search.lower() in c["name"].lower()
    ]

    options = {
        f"{c['customer_id']} - {c['name']}": c["customer_id"]
        for c in filtered
    }

    if options:
        selected = st.selectbox("Select Customer", list(options.keys()))
        cid = options[selected]
    else:
        st.warning("⚠️ No customers found")
        st.stop()

    # ✅ MUST BE HERE (NOT inside else)
    data = fetch_with_retry(f"{API_BASE}/transactions/customer/{cid}")

    if data:
        st.markdown("## 👤 Customer Profile")

        col1, col2, col3 = st.columns(3)

        col1.metric(
            "💰 Balance",
            f"₹{data.get('balance', 0)}"
        )

        col2.metric(
            "💵 Loan Amount",
            f"₹{data.get('loan_amount', 0)}"
        )

        col3.metric(
            "💸 Net Given",
            f"₹{data.get('net_given', 0)}"
        )

        st.divider()

        st.write(f"👤 Name: {data['name']}")
        st.write(f"📞 Phone: {data['phone']}")
        st.write(f"📍 Address: {data.get('address', '-')}")
        st.write(f"🏷️ Category: {data.get('type', '-')}")
        st.write(f"📅 Due Date: {data.get('due_date', '-')}")

        if st.button("🗑️ Delete Customer"):
            st.session_state[f"confirm_delete_{cid}"] = True

        if st.session_state.get(f"confirm_delete_{cid}"):
            st.warning("Are you sure you want to delete this customer?")

            col1, col2 = st.columns(2)

            with col1:
                if st.button("✅ Yes, Delete"):
                    try:
                        res = requests.delete(f"{API_BASE}/customers/delete/{cid}")
                        data = res.json()

                        if res.status_code == 200 and "message" in data:
                            st.cache_data.clear()
                            st.success("Customer deleted successfully")
                            st.session_state[f"confirm_delete_{cid}"] = False
                            st.session_state["customers"] = fetch_with_retry(f"{API_BASE}/customers/")
                        else:
                            st.error(data.get("error", "Delete failed"))

                    except Exception as e:
                        st.error(f"Error: {e}")

            with col2:
                if st.button("❌ Cancel"):
                    st.session_state[f"confirm_delete_{cid}"] = False

        st.markdown("### 💸 Quick Payment")

        amount = st.number_input("Amount", step=10, min_value=0, value=None, placeholder="Enter amount")
        payment_date = st.date_input(
            "Payment Date",
            value=date.today(),
            max_value=date.today(),
            key=f"payment_date_{cid}"
        )

        payment_key = f"payment_done_{cid}"

        if payment_key not in st.session_state:
            st.session_state[payment_key] = False

        if st.button("Pay Now", disabled=st.session_state[payment_key]):

            if not amount or amount <= 0:
                st.error("Enter valid amount")
                st.stop()

            st.session_state[payment_key] = True

            try:
                with st.spinner("Processing..."):
                    res = requests.post(
                        f"{API_BASE}/transactions/add",
                        json={
                            "customer_id": cid,
                            "amount_paid": int(amount),
                            "payment_date": str(payment_date)
                        }
                    )

                if res.status_code == 200:
                    st.cache_data.clear()
                    st.success("Payment added")
                    st.session_state[payment_key] = False
                    st.session_state["customers"] = fetch_with_retry(f"{API_BASE}/customers/")
                else:
                    st.session_state[payment_key] = False
                    st.error("Failed")

            except Exception as e:
                st.session_state[payment_key] = False
                st.error(f"Error: {e}")

        st.markdown("### 💵 Transactions")
        transactions = data.get("transactions") or data.get("data") or []

        if not transactions:
            st.info("No transactions found")
        else:
            for t in transactions:
                st.write(f"₹{t.get('amount_paid', 0)} → {t.get('payment_date', '-')}")
    else:
        st.error("Error loading data")


# ================= ADD CUSTOMER =================
if page == "Add Customer":
    
    st.markdown("## ➕ Add Customer")   

    with st.form("customer_form", clear_on_submit=True):

        customer_id = st.text_input("Customer ID")
        name = st.text_input("Name")
        customer_type = st.selectbox("Customer Type",["Furniture", "DL", "DPL"])
        loan_given = True
        if customer_type == "DL":
            loan_given = st.radio(
                "Loan Status",
                ["Given", "Not Given"],
                horizontal=True
            ) == "Given"
        phone = st.text_input("Phone")
        address = st.text_input("Address")
        interest = st.number_input("Interest", min_value=0, step=1)
        loan_amount = st.number_input("Loan Amount", min_value=0, value=None, placeholder="Enter amount")

        loan_date = st.date_input("Loan Date")
        due_date = st.date_input("Due Date")

        submitted = st.form_submit_button("✅ ADD CUSTOMER")

        if submitted:

            if not all([customer_id, name, phone, address]):
                st.error("Fill all fields")
                st.stop()

            if loan_amount is None or loan_amount <= 0:
                st.error("Enter valid loan amount")
                st.stop()
                
            try:
                with st.spinner("Processing..."):
                    res = requests.post(
                        f"{API_BASE}/customers/add",
                        json={
                            "customer_id": int(customer_id),
                            "name": name,
                            "phone": phone,
                            "address": address,
                            "interest": int(interest) if interest else 0,
                            "loan_amount": int(loan_amount),
                            "loan_date": str(loan_date),
                            "due_date": str(due_date),
                            "type": customer_type,
                            "loan_given": loan_given
                        },
                        timeout=5
                    )

                if res.status_code == 200:
                    st.session_state["customers"] = fetch_with_retry(f"{API_BASE}/customers/")
                    st.cache_data.clear()
                    st.success(f"Customer {name} added")
                else:
                    st.error(res.text)

            except Exception as e:
                if "timeout" in str(e).lower():
                    st.warning("⚠️ Server slow, but data may be saved")
                else:
                    st.error("❌ Connection error")


# ================= HISTORY =================
if page == "History":

    st.markdown("## 📅 Date-wise Summary")

    selected_date = st.date_input("Select Date")

    # Convert to string (IMPORTANT)
    selected_date_str = str(selected_date)

    data = get_history_data(selected_date_str)

    if not data:
        st.error("Failed to load summary")
        st.stop()

    # 🔹 Top Summary
    col1, col2, col3 = st.columns(3)

    col1.metric("💰 Collection", f"₹{data['collection']}")
    col2.metric("💸 Expense", f"₹{data['expense']}")
    col3.metric("📊 Net", f"₹{data['net']}")

    st.divider()

    # 🔹 Transactions
    st.markdown("### 💵 Transactions")

    if not data["transactions"]:
        st.info("No transactions for this date")
    else:
        for t in data["transactions"]:
            st.write(f"₹{t.get('amount_paid', 0)} → {t.get('payment_date', '-')}")

    st.divider()

    # 🔹 Expenses
    st.markdown("### 🧾 Expenses")

    if not data["expenses"]:
        st.info("No expenses for this date")
    else:
        for e in data["expenses"]:
            st.write(f"₹{e.get('amount', 0)} → {e.get('note', '-')}")

    # ================= BUSINESS SUMMARY =================
if page == "Business Summary":

    st.markdown("## 💰 Business Center")
    tab1, tab2, tab3 = st.tabs([
        "💰 Cash",
        "📈 Profit",
        "⚠️ Risk",
    ])
    with tab1:

        st.markdown("### 💰 Cash Status")
        cash = get_cash_balance()

        if cash:

            col1, col2 = st.columns(2)

            col1.metric(
                "💵 Available Cash",
                f"₹{cash.get('cash_balance', 0)}"
            )

            col2.metric(
                "💰 Total Collection",
                f"₹{cash.get('total_collection', 0)}"
            )

            st.divider()

            col3, col4 = st.columns(2)

            col3.metric(
                "📤 Total Loan Given",
                f"₹{cash.get('total_loan_given', 0)}"
            )

            col4.metric(
                "💸 Total Expense",
                f"₹{cash.get('total_expense', 0)}"
            )

        else:
            st.error("Failed to load cash data")
    with tab2:

        st.markdown("### 📈 Profit Overview")

        data = get_profit_summary()

        if not data:
            st.error("Failed to load data")
            st.stop()

        if "error" in data:
            st.error(data["error"])
            st.stop()

        col1, col2, col3 = st.columns(3)

        col1.metric(
            "📤 Total Loan Given",
            f"₹{data.get('total_given', 0)}"
        )

        col2.metric(
            "💰 Total Collected",
            f"₹{data.get('total_collected', 0)}"
        )

        col3.metric(
            "📈 Profit",
            f"₹{data.get('profit', 0)}"
        )

        # ✅ CATEGORY PROFIT (FIXED POSITION)
        st.markdown("### 📊 Profit by Category")

        data = get_profit_by_category()

        if not data:
            st.error("Failed to load category data")
        else:
            cols = st.columns(max(len(data), 1))

            for i, item in enumerate(data):
                category = item.get("category", "Unknown")
                given = item.get("total_given", 0)
                collected = item.get("total_collected", 0)
                profit = item.get("profit", 0)

                # 🔥 Color logic
                color = "red" if profit < 0 else "green"

                with cols[i]:
                    st.markdown(f"### {category}")
                    st.metric("💸 Given", f"₹{given}")
                    st.metric("💰 Collected", f"₹{collected}")
                    st.markdown(
                        f"<h3 style='color:{color}'>Profit: ₹{profit}</h3>",
                        unsafe_allow_html=True
                    )
    with tab3:

        st.markdown("## ⚠️ Risk Overview")
        st.markdown("### 💰 Outstanding by Category")

        outstanding = get_outstanding_data()

        if outstanding:

            col1, col2, col3, col4 = st.columns(4)

            col1.metric(
                "🪑 Furniture",
                f"₹{outstanding.get('Furniture', 0)}"
            )

            col2.metric(
                "📦 DL",
                f"₹{outstanding.get('DL', 0)}"
            )

            col3.metric(
                "🏢 DPL",
                f"₹{outstanding.get('DPL', 0)}"
            )

            col4.metric(
                "💰 Total",
                f"₹{outstanding.get('Total', 0)}"
            )

        else:
            st.error("Failed to load outstanding data")

            st.divider()

        st.markdown("### 🚨 Payment Gaps")

        dashboard = get_dashboard_data()

        gaps = dashboard.get("gaps", []) if dashboard else []

        if gaps:

            for c in gaps:

                if c.get("last_paid") == "Never":

                    st.error(
                        f"{c['customer_id']} - {c['name']} ❗ Never Paid"
                    )

                else:

                    st.warning(
                        f"{c['customer_id']} - {c['name']} | {c['gap_days']} days gap"
                    )

        else:
            st.success("No payment gaps ✅")
