from fastapi import APIRouter
from backend.db import supabase
from backend.schemas import TransactionCreate
from datetime import date
from datetime import datetime, timedelta
from time import perf_counter



router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/add")
def add_transaction(data: TransactionCreate):
    transaction = data.dict()

    # 1️⃣ Insert transaction (existing logic)
    res = supabase.table("transactions").insert(transaction).execute()

    # 2️⃣ ADD THIS BLOCK (NEW — cash tracking)
    try:
        supabase.table("cashbook").insert({
            "amount": data.amount_paid,
            "type": "credit",
            "source": "collection",
            "reference_id": str(data.customer_id),
            "date": data.payment_date
        }).execute()
    except Exception as e:
        print("Cashbook error:", e)

    # Check if loan is completed

    customer = (
        supabase.table("customers")
        .select("loan_amount")
        .eq("customer_id", data.customer_id)
        .execute()
    )

    if customer.data:

        loan_amount = customer.data[0]["loan_amount"]

        payments = (
            supabase.table("transactions")
            .select("amount_paid")
            .eq("customer_id", data.customer_id)
            .execute()
        )

        total_collected = sum(
            payment.get("amount_paid", 0)
            for payment in payments.data
        )

        if total_collected >= loan_amount:

            supabase.table("customers") \
                .update({
                    "ready_to_close": True
                }) \
                .eq("customer_id", data.customer_id) \
                .execute()
    return res.data


@router.get("/customer/{customer_id}")
def get_customer_balance(customer_id: int):
    # 1. Get customer
    customer_res = supabase.table("customers") \
        .select("*") \
        .eq("customer_id", customer_id) \
        .execute()

    if not customer_res.data:
        return {"error": "Customer not found"}

    customer = customer_res.data[0]

    # 2. Get transactions
    txn_res = supabase.table("transactions") \
        .select("amount_paid,payment_date") \
        .eq("customer_id", customer_id) \
        .execute()

    transactions = txn_res.data

    # 3. Total paid (SAFE)
    total_paid = sum(t.get("amount_paid", 0) or 0 for t in transactions)

    # 4. Balance
    balance = (customer.get("loan_amount") or 0) - total_paid

    # 5. Overdue calculation
    today = date.today()

    due_date_raw = customer.get("due_date")

    if due_date_raw:
        try:
            if isinstance(due_date_raw, str):
                due_date = date.fromisoformat(due_date_raw)
            else:
                due_date = due_date_raw
        except:
            due_date = None
    else:
        due_date = None

    if due_date and today > due_date:
        overdue_days = (today - due_date).days
        status = "OVERDUE"
    else:
        overdue_days = 0
        status = "ON TIME"

    return {
    "customer_id": customer_id,
    "name": customer.get("name"),
    "phone": customer.get("phone"),
    "address": customer.get("address"),
    "interest": customer.get("interest"),
    "type": customer.get("type"),
    "loan_given": customer.get("loan_given"),
    "ready_to_close": customer.get("ready_to_close"),   # <-- ADD THIS
    "loan_amount": customer.get("loan_amount"),
    "net_given": customer.get("net_given"),
    "loan_date": customer.get("loan_date"),
    "due_date": customer.get("due_date"),
    "total_paid": total_paid,
    "balance": balance,
    "status": status,
    "overdue_days": overdue_days,
    "transactions": transactions
}

@router.get("/daily-summary")
def get_daily_summary():
    today = date.today().isoformat()

    try:
        # 1. Get today's transactions
        t_res = supabase.table("transactions") \
            .select("amount_paid")  \
            .eq("payment_date", today) \
            .execute()

        transactions = t_res.data if t_res.data else []

        total_collected = sum(
            t.get("amount_paid", 0) for t in transactions
        )

        # 2. Get today's expenses
        e_res = supabase.table("expenses") \
            .select("amount") \
            .eq("date", today) \
            .execute()

        expenses = e_res.data if e_res.data else []

        total_expense = sum(
            e.get("amount", 0) for e in expenses
        )

        # 3. Calculate net
        net_amount = total_collected - total_expense

        # ✅ FINAL RETURN (ALL VALUES)
        return {
            "date": today,
            "total_collected": total_collected,
            "total_expense": total_expense,
            "net_amount": net_amount,
        }

    except Exception as e:
        return {
            "error": str(e)
        }
def get_collections_by_date(selected_date: str):
    today = selected_date

    try:
        res = (
            supabase.table("transactions")
            .select("""
                amount_paid,
                customer_id,
                created_at,
                customers(name,address)
            """)
            .eq("payment_date", today)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )

        collections = []

        for item in res.data or []:
            collections.append({
                "customer_id": item["customer_id"],
                "customer_name": item["customers"]["name"],
                "address": item["customers"]["address"],
                "amount": item["amount_paid"],
                "created_at": item["created_at"]
            })

        return collections

    except Exception as e:
        return {"error": str(e)}
    
@router.get("/summary-by-date/{selected_date}")
def summary_by_date(selected_date: str):
    try:
        # Transactions
        t_res = supabase.table("transactions") \
            .select("*") \
            .eq("payment_date", selected_date) \
            .execute()

        transactions = get_collections_by_date(selected_date)
        total_collection = sum(
            t.get("amount", 0)
            for t in transactions
        )

        # Expenses
        e_res = supabase.table("expenses") \
            .select("*") \
            .eq("date", selected_date) \
            .execute()

        expenses = []

        for item in e_res.data or []:

            expenses.append({
                "id": item["id"],
                "amount": item["amount"],
                "note": item["note"],
                "created_at": item["created_at"]
            })
        total_expense = sum(e.get("amount", 0) for e in expenses)

        return {
            "date": selected_date,
            "collection": total_collection,
            "expense": total_expense,
            "net": total_collection - total_expense,
            "transactions": transactions,
            "expenses": expenses
        }

    except Exception as e:
        return {"error": str(e)}

def get_not_paid_logic():
    today = date.today().isoformat()

    customers = supabase.table("customers") \
    .select("customer_id,name,address,loan_given") \
    .execute().data or []

    txns = supabase.table("transactions") \
        .select("customer_id") \
        .eq("payment_date", today) \
        .execute().data or []

    paid_today = set(t["customer_id"] for t in txns)

    not_paid = []

    for c in customers:
        if not c.get("loan_given", True):
            continue
        if c["customer_id"] not in paid_today:
            not_paid.append({
                "customer_id": c["customer_id"],
                "name": c["name"],
                "address": c.get("address", "")
            })

    return not_paid

def get_gaps_logic():
    today = date.today()

    customers = supabase.table("customers") \
    .select("customer_id,name,loan_given") \
    .execute().data or []

    all_txns = supabase.table("transactions") \
    .select("customer_id,payment_date") \
    .execute().data or []

    txn_map = {}
    for t in all_txns:
        cid = t["customer_id"]
        txn_map.setdefault(cid, []).append(t)

    gaps = []

    for c in customers:
        if not c.get("loan_given", True):
            continue
        transactions = txn_map.get(c["customer_id"], [])

        if not transactions:
            gaps.append({
                "customer_id": c["customer_id"],
                "name": c["name"],
                "last_paid": "Never"
            })
            continue

        last_payment = max(
            date.fromisoformat(t["payment_date"]) for t in transactions
        )

        gap_days = (today - last_payment).days

        if gap_days > 1:
            gaps.append({
                "customer_id": c["customer_id"],
                "name": c["name"],
                "gap_days": gap_days,
                "last_paid": str(last_payment)
            })

    return gaps
@router.get("/dashboard")
def get_dashboard():

    start = perf_counter()

    t = perf_counter()
    summary = get_daily_summary()
    print("Summary:", perf_counter() - t)

    t = perf_counter()
    cash = get_cash_balance()
    print("Cash:", perf_counter() - t)

    t = perf_counter()
    not_paid = get_not_paid_logic()
    print("Not Paid:", perf_counter() - t)

    t = perf_counter()
    today_collections = get_collections_by_date(
        date.today().isoformat()
    )
    print("Collections:", perf_counter() - t)

    t = perf_counter()
    today_expenses = get_today_expenses()
    print("Expenses:", perf_counter() - t)

    print("TOTAL:", perf_counter() - start)

    return {
        "summary": summary,
        "cash": cash,
        "not_paid": not_paid,
        "today_collections": today_collections,
        "today_expenses": today_expenses
    }


@router.get("/outstanding-by-type")
def outstanding_by_type():

    try:

        # Customers
        cust_res = supabase.table("customers") \
            .select("customer_id,loan_amount,type,loan_given") \
            .execute()

        customers = cust_res.data or []

        # Transactions
        txn_res = supabase.table("transactions") \
            .select("customer_id,amount_paid") \
            .execute()

        transactions = txn_res.data or []

        paid_map = {}

        for t in transactions:
            cid = t.get("customer_id")

            paid_map[cid] = (
                paid_map.get(cid, 0)
                + (t.get("amount_paid", 0) or 0)
            )

        result = {
            "Furniture": 0,
            "DL": 0,
            "DPL": 0,
            "Total": 0
        }

        for c in customers:
            if not c.get("loan_given", True):
                continue

            cid = c.get("customer_id")

            customer_type = c.get("type") or "DL"

            paid = paid_map.get(cid, 0)

            balance = (
                (c.get("loan_amount") or 0)
                - paid
            )

            result[customer_type] += balance
            result["Total"] += balance

        return result

    except Exception as e:
        return {"error": str(e)}

@router.get("/profit-summary")
def profit_summary():
    try:
        res = supabase.rpc("get_profit_summary").execute()

        if res.data:
            return res.data[0]

        return {
            "total_given": 0,
            "total_collected": 0,
            "profit": 0
        }

    except Exception as e:
        return {"error": str(e)}

@router.get("/profit-by-category")
def profit_by_category():
    try:
        res = supabase.rpc("get_profit_by_category").execute()

        if res.data:
            return res.data

        return []
    except Exception as e:
        return {"error": str(e)}
    
@router.get("/cash-balance")
def get_cash_balance():

    try:

        res = (
            supabase.table("cashbook")
            .select("amount,type,source")
            .execute()
        )

        data = res.data or []

        total_investment = sum(
            int(x.get("amount", 0))
            for x in data
            if x.get("source") == "investment"
        )

        total_collection = sum(
            int(x.get("amount", 0))
            for x in data
            if x.get("source") == "collection"
        )

        total_advance = sum(
            int(x.get("amount", 0))
            for x in data
            if x.get("source") == "advance"
        )

        total_loan_given = sum(
            int(x.get("amount", 0))
            for x in data
            if x.get("source") == "loan"
        )

        total_purchase = sum(
            int(x.get("amount", 0))
            for x in data
            if x.get("source") == "purchase"
        )

        total_expense = sum(
            int(x.get("amount", 0))
            for x in data
            if x.get("source") == "expense"
        )

        cash_balance = (
            total_investment
            + total_collection
            + total_advance
            - total_loan_given
            - total_purchase
            - total_expense
        )

        return {
            "cash_balance": cash_balance,
            "total_investment": total_investment,
            "total_collection": total_collection,
            "total_advance": total_advance,
            "total_loan_given": total_loan_given,
            "total_purchase": total_purchase,
            "total_expense": total_expense
        }

    except Exception as e:
        return {"error": str(e)}

@router.get("/cashbook")
def get_cashbook():

    try:

        res = (
            supabase.table("cashbook")
            .select("*")
            .order("date", desc=True)
            .execute()
        )

        return res.data or []

    except Exception as e:
        return {"error": str(e)}    
    
@router.get("/expected-profit")
def expected_profit():
    try:

        res = supabase.table("customers") \
            .select("interest,loan_given") \
            .execute()

        customers = res.data or []

        total_profit = sum(
            c.get("interest", 0) or 0
            for c in customers
            if c.get("loan_given", True)
        )

        return {
            "expected_profit": total_profit
        }

    except Exception as e:
        return {"error": str(e)}
    
def get_today_expenses():
    today = date.today().isoformat()

    try:
        res = (
            supabase.table("expenses")
            .select("id, amount, note, created_at")
            .eq("date", today)
            .order("created_at", desc=True)
            .execute()
        )

        return res.data or []

    except Exception as e:
        return {"error": str(e)}

@router.get("/business-summary")
def business_summary():
    try:

        # ----------------------------
        # Cash Balance
        # ----------------------------
        cash = get_cash_balance()
        
        # ----------------------------
        # Today's Summary
        # ----------------------------
        today = get_daily_summary()

        # ----------------------------
        # Expected Profit
        # ----------------------------
        expected = expected_profit()

        # ----------------------------
        # Customers
        # ----------------------------
        customers = supabase.table("customers") \
            .select("customer_id, loan_amount, loan_given") \
            .execute()

        customers = customers.data or []
        total_customers = len(customers)


        # ----------------------------
        # Transactions
        # ----------------------------
        txns = supabase.table("transactions") \
            .select("customer_id, amount_paid") \
            .execute()

        txns = txns.data or []

        paid_map = {}

        for txn in txns:
            cid = txn["customer_id"]
            paid_map[cid] = paid_map.get(cid, 0) + (
                txn.get("amount_paid", 0) or 0
            )

        outstanding = 0
        active_loans = 0
    
        for customer in customers:

            if not customer.get("loan_given", True):
                continue

            loan_amount = customer.get("loan_amount", 0)
            collected = paid_map.get(customer["customer_id"], 0)

            outstanding += max(loan_amount - collected, 0)

            active_loans += 1

        return {
            "available_cash": cash.get("cash_balance", 0),
            "today_collection": today.get("total_collected", 0),
            "today_expense": today.get("total_expense", 0),
            "outstanding": outstanding,
            "expected_profit": expected.get("expected_profit", 0),
            "active_loans": active_loans,
            "total_customers": total_customers
        }

    except Exception as e:
        return {"error": str(e)}

def calculate_cash_flow(selected_date: str):

    today = selected_date

    data = (
        supabase.table("cashbook")
        .select("amount,source,type,date")
        .execute()
        .data or []
    )

    today_entries = []
    previous_entries = []

    for entry in data:

        entry_date = entry["date"][:10]

        if entry_date == today:
            today_entries.append(entry)
        elif entry_date < today:
            previous_entries.append(entry)

    def balance(entries):

        total = 0

        for item in entries:
            if item["type"] == "credit":
                total += item["amount"]
            else:
                total -= item["amount"]

        return total

    opening_cash = balance(previous_entries)
    investments = sum(
        x["amount"]
        for x in today_entries
        if x["source"] == "investment"
    )

    collections = sum(
        x["amount"]
        for x in today_entries
        if x["source"] == "collection"
    )

    advances = sum(
        x["amount"]
        for x in today_entries
        if x["source"] == "advance"
    )

    purchases = sum(
        x["amount"]
        for x in today_entries
        if x["source"] == "purchase"
    )

    loans = sum(
        x["amount"]
        for x in today_entries
        if x["source"] == "loan"
    )

    expenses = sum(
        x["amount"]
        for x in today_entries
        if x["source"] == "expense"
    )

    closing_cash = (
        opening_cash
        + investments
        + collections
        + advances
        - purchases
        - loans
        - expenses
    )

    return {
        "opening_cash": opening_cash,
        "investments": investments,
        "collections": collections,
        "advances": advances,
        "purchases": purchases,
        "loans": loans,
        "expenses": expenses,
        "closing_cash": closing_cash
    }

@router.get("/cash-flow/{selected_date}")
def cash_flow(selected_date: str):

    try:
        return calculate_cash_flow(selected_date)

    except Exception as e:
        return {"error": str(e)}


@router.get("/cash-flow")
def get_today_cash_flow():

    return calculate_cash_flow(date.today().isoformat())  