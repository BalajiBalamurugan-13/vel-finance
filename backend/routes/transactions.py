from fastapi import APIRouter, HTTPException
from backend.db import supabase
from backend.schemas import TransactionCreate, InvestmentCreate
from datetime import date
from datetime import datetime, timedelta
from time import perf_counter
from backend.routes.customers import get_closed_customer_ids



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
        .select("*, places(id, name, priority)") \
        .eq("customer_id", customer_id) \
        .execute()

    if not customer_res.data:
        return {"error": "Customer not found"}

    customer = customer_res.data[0]
    place_info = customer.get("places") or {}

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

    closed_ids = get_closed_customer_ids()
    is_closed = customer_id in closed_ids

    if is_closed:
        overdue_days = 0
        status = "CLOSED"
    elif not customer.get("loan_given", True):
        overdue_days = 0
        status = "PENDING"
    elif balance <= 0 or customer.get("ready_to_close"):
        overdue_days = 0
        status = "COMPLETED"
    elif due_date and today > due_date:
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
    "ready_to_close": customer.get("ready_to_close") or is_closed or (balance <= 0),
    "is_closed": is_closed,
    "loan_amount": customer.get("loan_amount"),
    "net_given": customer.get("net_given"),
    "loan_date": customer.get("loan_date"),
    "due_date": customer.get("due_date"),
    "place_id": customer.get("place_id"),
    "place_name": place_info.get("name"),
    "place_priority": place_info.get("priority"),
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
        PAGE_SIZE = 1000
        all_txns = []
        page = 0
        while True:
            batch = (
                supabase.table("transactions")
                .select("""
                    amount_paid,
                    customer_id,
                    created_at,
                    customers(name,address)
                """)
                .eq("payment_date", today)
                .order("created_at", desc=True)
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
                .execute()
                .data or []
            )
            all_txns.extend(batch)
            if len(batch) < PAGE_SIZE:
                break
            page += 1

        collections = []

        for item in all_txns:
            cust = item.get("customers") or {}
            collections.append({
                "customer_id": item["customer_id"],
                "customer_name": cust.get("name") or f"Customer #{item['customer_id']}",
                "address": cust.get("address") or "-",
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

@router.get("/daily-sheet/{selected_date}")
def get_daily_sheet(selected_date: str):
    try:
        cur_date_obj = datetime.strptime(selected_date, "%Y-%m-%d")
        yesterday_date = (cur_date_obj - timedelta(days=1)).strftime("%Y-%m-%d")

        # 1. Fetch places ordered by priority
        places_res = (
            supabase.table("places")
            .select("id, name, priority")
            .order("priority")
            .execute()
        )
        places = places_res.data or []

        # 2. Fetch all customers
        cust_res = (
            supabase.table("customers")
            .select("""
                customer_id,
                name,
                phone,
                address,
                loan_given,
                loan_date,
                loan_amount,
                type,
                place_id,
                places(id, name, priority)
            """)
            .execute()
        )
        all_customers = cust_res.data or []

        # 3. Fetch transactions with pagination
        PAGE_SIZE = 1000
        all_txns = []
        page = 0
        while True:
            batch = (
                supabase.table("transactions")
                .select("id, customer_id, amount_paid, payment_date")
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
                .execute()
                .data or []
            )
            all_txns.extend(batch)
            if len(batch) < PAGE_SIZE:
                break
            page += 1

        paid_map = {}
        today_paid_map = {}
        today_tx_id_map = {}
        yesterday_paid_map = {}
        last_payment_map = {}

        for t in all_txns:
            cid = t.get("customer_id")
            amt = t.get("amount_paid", 0) or 0
            pdate = t.get("payment_date")
            tid = t.get("id")

            if cid is None:
                continue

            paid_map[cid] = paid_map.get(cid, 0) + amt

            if pdate == selected_date:
                today_paid_map[cid] = today_paid_map.get(cid, 0) + amt
                today_tx_id_map[cid] = tid

            if pdate == yesterday_date:
                yesterday_paid_map[cid] = yesterday_paid_map.get(cid, 0) + amt

            # Most recent payment strictly before selected_date
            if pdate and pdate < selected_date:
                curr_last = last_payment_map.get(cid)
                if not curr_last or pdate > curr_last["date"]:
                    last_payment_map[cid] = {"date": pdate, "amount": amt}

        closed_ids = get_closed_customer_ids()

        active_sheet_customers = []
        total_collected = 0
        collected_count = 0
        total_expected_daily = 0

        for c in all_customers:
            cid = c.get("customer_id")
            today_paid = today_paid_map.get(cid, 0)
            today_tx_id = today_tx_id_map.get(cid)
            is_closed = cid in closed_ids

            # Closed customers: omit unless they paid on selected_date
            if is_closed and today_paid == 0:
                continue

            if not c.get("loan_given", True) and today_paid == 0:
                continue

            # Must be disbursed before selected_date (repayment begins D+1) unless paid today
            loan_date = c.get("loan_date")
            if loan_date and loan_date >= selected_date and today_paid == 0:
                continue

            place_info = c.pop("places", None) or {}
            c["place_name"] = place_info.get("name")
            c["place_priority"] = place_info.get("priority") if place_info.get("priority") is not None else 999

            loan_amount = c.get("loan_amount") or 0
            total_paid = paid_map.get(cid, 0)
            balance = loan_amount - total_paid

            yesterday_paid = yesterday_paid_map.get(cid, 0)
            last_prior = last_payment_map.get(cid)

            # Include if balance > 0 OR they paid today (e.g. loan finished today)
            if balance <= 0 and today_paid == 0:
                continue

            daily_installment = 0
            if c.get("type") == "DL":
                daily_installment = round(loan_amount / 100) if loan_amount > 0 else 0
            else:
                daily_installment = 0

            c["balance"] = balance
            c["total_paid"] = total_paid
            c["daily_installment"] = daily_installment
            c["today_paid"] = today_paid
            c["today_tx_id"] = today_tx_id
            c["yesterday_paid"] = yesterday_paid
            c["last_payment_date"] = last_prior["date"] if last_prior else None
            c["last_payment_amount"] = last_prior["amount"] if last_prior else None
            c["is_closed"] = is_closed

            if today_paid > 0:
                collected_count += 1
                total_collected += today_paid
            total_expected_daily += daily_installment

            active_sheet_customers.append(c)

        # Sort customers: by place priority ASC, then place_name, then customer_id ASC
        active_sheet_customers.sort(
            key=lambda x: (
                x.get("place_priority", 999),
                x.get("place_name") or "",
                x.get("customer_id", 0)
            )
        )

        return {
            "date": selected_date,
            "yesterday_date": yesterday_date,
            "places": places,
            "customers": active_sheet_customers,
            "summary": {
                "total_customers": len(active_sheet_customers),
                "collected_count": collected_count,
                "total_collected": total_collected,
                "total_expected_daily": total_expected_daily
            }
        }
    except Exception as e:
        return {"error": str(e)}

@router.delete("/delete/{transaction_id}")
def delete_transaction(transaction_id: int):
    try:
        tx_res = (
            supabase.table("transactions")
            .select("*")
            .eq("id", transaction_id)
            .execute()
        )
        if not tx_res.data:
            return {"error": "Transaction not found"}

        tx = tx_res.data[0]
        cid = str(tx.get("customer_id"))
        pdate = tx.get("payment_date")
        amt = tx.get("amount_paid")

        # Delete cashbook entry matching this collection
        supabase.table("cashbook").delete().match({
            "type": "credit",
            "source": "collection",
            "reference_id": cid,
            "date": pdate,
            "amount": amt
        }).execute()

        # Delete transaction
        supabase.table("transactions").delete().eq("id", transaction_id).execute()

        return {"message": "Transaction deleted successfully"}
    except Exception as e:
        return {"error": str(e)}


def get_not_paid_logic():
    today = date.today().isoformat()

    customers = supabase.table("customers") \
        .select("customer_id,name,address,loan_given,ready_to_close") \
        .execute().data or []

    closed_ids = get_closed_customer_ids()

    txns = supabase.table("transactions") \
        .select("customer_id") \
        .eq("payment_date", today) \
        .execute().data or []

    paid_today = set(t["customer_id"] for t in txns)

    not_paid = []

    for c in customers:
        cid = c.get("customer_id")
        if not c.get("loan_given", True):
            continue
        if cid in closed_ids:
            continue
        if c.get("ready_to_close"):
            continue

        if cid not in paid_today:
            not_paid.append({
                "customer_id": cid,
                "name": c["name"],
                "address": c.get("address", "")
            })

    return not_paid

def get_gaps_logic():
    today = date.today()

    customers = supabase.table("customers") \
        .select("customer_id,name,loan_given,ready_to_close") \
        .execute().data or []

    closed_ids = get_closed_customer_ids()

    all_txns = supabase.table("transactions") \
        .select("customer_id,payment_date") \
        .execute().data or []

    txn_map = {}
    for t in all_txns:
        cid = t["customer_id"]
        txn_map.setdefault(cid, []).append(t)

    gaps = []

    for c in customers:
        cid = c.get("customer_id")
        if not c.get("loan_given", True):
            continue
        if cid in closed_ids:
            continue
        if c.get("ready_to_close"):
            continue

        transactions = txn_map.get(cid, [])

        if not transactions:
            gaps.append({
                "customer_id": cid,
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
                "customer_id": cid,
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

        PAGE_SIZE = 1000
        customers = []
        page = 0
        while True:
            batch = (
                supabase.table("customers")
                .select("customer_id,loan_amount,type,loan_given")
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
                .execute()
                .data or []
            )
            customers.extend(batch)
            if len(batch) < PAGE_SIZE:
                break
            page += 1

        transactions = []
        page = 0
        while True:
            batch = (
                supabase.table("transactions")
                .select("customer_id,amount_paid")
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
                .execute()
                .data or []
            )
            transactions.extend(batch)
            if len(batch) < PAGE_SIZE:
                break
            page += 1

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

        closed_ids = get_closed_customer_ids()

        for c in customers:
            cid = c.get("customer_id")
            if not c.get("loan_given", True) or cid in closed_ids:
                continue

            customer_type = c.get("type") or "DL"

            paid = paid_map.get(cid, 0)

            balance = max((c.get("loan_amount") or 0) - paid, 0)

            result[customer_type] += balance
            result["Total"] += balance

        return result

    except Exception as e:
        return {"error": str(e)}

@router.get("/outstanding-details")
def get_outstanding_details():
    try:
        PAGE_SIZE = 1000

        # 1. Fetch active customers
        customers = []
        page = 0
        while True:
            batch = (
                supabase.table("customers")
                .select("customer_id,loan_amount,type,loan_given,place_id")
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
                .execute()
                .data or []
            )
            customers.extend(batch)
            if len(batch) < PAGE_SIZE:
                break
            page += 1

        # 2. Fetch transactions (paginated)
        transactions = []
        page = 0
        while True:
            batch = (
                supabase.table("transactions")
                .select("customer_id,amount_paid")
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
                .execute()
                .data or []
            )
            transactions.extend(batch)
            if len(batch) < PAGE_SIZE:
                break
            page += 1

        # 3. Fetch places
        places = supabase.table("places").select("id,name,priority").order("priority").execute().data or []
        place_map = {p["id"]: p for p in places}

        # Initialize place_summary with all registered places from places table
        place_summary = {}
        for p in places:
            pname = p.get("name") or "மற்றவை"
            place_summary[pname] = {
                "place_id": p.get("id"),
                "place_name": pname,
                "priority": p.get("priority", 999),
                "count": 0,
                "loan_amount": 0,
                "paid_amount": 0,
                "outstanding": 0
            }

        # 4. Map collected payments per customer
        paid_map = {}
        for t in transactions:
            cid = t.get("customer_id")
            if cid is not None:
                paid_map[cid] = paid_map.get(cid, 0) + (t.get("amount_paid", 0) or 0)

        # 5. Type metadata
        type_labels = {
            "DL": {"name": "Daily Loan (DL)", "icon": "📅", "color": "amber"},
            "Furniture": {"name": "Furniture Loan", "icon": "🛋️", "color": "blue"},
            "DPL": {"name": "Daily Period Loan (DPL)", "icon": "⏳", "color": "purple"}
        }

        type_summary = {}

        total_active_loans = 0
        total_loan_amount = 0
        total_paid_amount = 0
        total_outstanding = 0

        closed_ids = get_closed_customer_ids()

        for c in customers:
            cid = c.get("customer_id")
            if not c.get("loan_given", True) or cid in closed_ids:
                continue

            loan_amt = c.get("loan_amount", 0) or 0
            paid = paid_map.get(cid, 0)
            bal = max(loan_amt - paid, 0)

            if bal <= 0:
                continue

            c_type = c.get("type") or "DL"
            pid = c.get("place_id")
            p_obj = place_map.get(pid, {})
            pname = p_obj.get("name") or "மற்றவை"
            priority = p_obj.get("priority", 999)

            total_active_loans += 1
            total_loan_amount += loan_amt
            total_paid_amount += paid
            total_outstanding += bal

            # Group by type
            if c_type not in type_summary:
                meta = type_labels.get(c_type, {"name": c_type, "icon": "📁", "color": "slate"})
                type_summary[c_type] = {
                    "type": c_type,
                    "name": meta["name"],
                    "icon": meta["icon"],
                    "color": meta["color"],
                    "count": 0,
                    "loan_amount": 0,
                    "paid_amount": 0,
                    "outstanding": 0
                }
            type_summary[c_type]["count"] += 1
            type_summary[c_type]["loan_amount"] += loan_amt
            type_summary[c_type]["paid_amount"] += paid
            type_summary[c_type]["outstanding"] += bal

            # Group by place
            if pname not in place_summary:
                place_summary[pname] = {
                    "place_id": pid,
                    "place_name": pname,
                    "priority": priority,
                    "count": 0,
                    "loan_amount": 0,
                    "paid_amount": 0,
                    "outstanding": 0
                }
            place_summary[pname]["count"] += 1
            place_summary[pname]["loan_amount"] += loan_amt
            place_summary[pname]["paid_amount"] += paid
            place_summary[pname]["outstanding"] += bal

        # Calculate percentages
        for item in type_summary.values():
            item["percentage"] = round((item["outstanding"] / total_outstanding * 100), 1) if total_outstanding > 0 else 0
            item["repaid_percentage"] = round((item["paid_amount"] / item["loan_amount"] * 100), 1) if item["loan_amount"] > 0 else 0

        for item in place_summary.values():
            item["percentage"] = round((item["outstanding"] / total_outstanding * 100), 1) if total_outstanding > 0 else 0
            item["repaid_percentage"] = round((item["paid_amount"] / item["loan_amount"] * 100), 1) if item["loan_amount"] > 0 else 0

        by_type = sorted(type_summary.values(), key=lambda x: x["outstanding"], reverse=True)
        by_place = sorted(place_summary.values(), key=lambda x: x["outstanding"], reverse=True)

        return {
            "total": {
                "count": total_active_loans,
                "loan_amount": total_loan_amount,
                "paid_amount": total_paid_amount,
                "outstanding": total_outstanding,
                "places_count": len(by_place)
            },
            "by_type": by_type,
            "by_place": by_place
        }

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

        # Supabase enforces a server-side 1000-row limit.
        # Cashbook has grown beyond 1000 entries, so we must paginate
        # to ensure ALL entries (including migration_offset) are included.
        PAGE_SIZE = 1000
        data = []
        page = 0
        while True:
            batch = (
                supabase.table("cashbook")
                .select("amount,type,source,date")
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
                .execute()
                .data or []
            )
            data.extend(batch)
            if len(batch) < PAGE_SIZE:
                break
            page += 1

        today_str = date.today().isoformat()
        operational_data = [
            x for x in data
            if not x.get("date") or str(x.get("date"))[:10] <= today_str
        ]

        total_investment = sum(
            int(x.get("amount", 0))
            for x in operational_data
            if x.get("source") == "investment"
        )

        total_collection = sum(
            int(x.get("amount", 0))
            for x in operational_data
            if x.get("source") == "collection"
        )

        total_advance = sum(
            int(x.get("amount", 0))
            for x in operational_data
            if x.get("source") == "advance"
        )

        total_loan_given = sum(
            int(x.get("amount", 0))
            for x in operational_data
            if x.get("source") == "loan"
        )

        total_purchase = sum(
            int(x.get("amount", 0))
            for x in operational_data
            if x.get("source") == "purchase"
        )

        total_expense = sum(
            int(x.get("amount", 0))
            for x in operational_data
            if x.get("source") == "expense"
        )

        # Migration offset: internal accounting adjustment (not user-facing)
        total_migration_offset = 0
        for x in operational_data:
            if x.get("source") == "migration_offset":
                if x.get("type") == "credit":
                    total_migration_offset += int(x.get("amount", 0))
                else:
                    total_migration_offset -= int(x.get("amount", 0))

        cash_balance = (
            total_investment
            + total_collection
            + total_advance
            + total_migration_offset
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

        # Paginate to bypass Supabase 1000-row server-side limit
        PAGE_SIZE = 1000
        all_rows = []
        page = 0
        while True:
            batch = (
                supabase.table("cashbook")
                .select("*")
                .order("date", desc=True)
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
                .execute()
                .data or []
            )
            all_rows.extend(batch)
            if len(batch) < PAGE_SIZE:
                break
            page += 1

        return all_rows

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
        PAGE_SIZE = 1000
        customers = []
        page = 0
        while True:
            batch = (
                supabase.table("customers")
                .select("customer_id, loan_amount, loan_given")
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
                .execute()
                .data or []
            )
            customers.extend(batch)
            if len(batch) < PAGE_SIZE:
                break
            page += 1

        total_customers = len(customers)

        # ----------------------------
        # Transactions
        # ----------------------------
        txns = []
        page = 0
        while True:
            batch = (
                supabase.table("transactions")
                .select("customer_id, amount_paid")
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
                .execute()
                .data or []
            )
            txns.extend(batch)
            if len(batch) < PAGE_SIZE:
                break
            page += 1

        paid_map = {}

        for txn in txns:
            cid = txn["customer_id"]
            paid_map[cid] = paid_map.get(cid, 0) + (
                txn.get("amount_paid", 0) or 0
            )

        closed_ids = get_closed_customer_ids()
        outstanding = 0
        active_loans = 0
    
        for customer in customers:
            cid = customer.get("customer_id")
            if not customer.get("loan_given", True):
                continue
            if cid in closed_ids:
                continue

            loan_amount = customer.get("loan_amount", 0) or 0
            collected = paid_map.get(cid, 0)
            bal = max(loan_amount - collected, 0)

            if bal <= 0:
                continue

            outstanding += bal
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

    # Supabase enforces a server-side 1000-row limit — paginate to get all rows.
    PAGE_SIZE = 1000
    data = []
    page = 0
    while True:
        batch = (
            supabase.table("cashbook")
            .select("amount,source,type,date")
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
            .execute()
            .data or []
        )
        data.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        page += 1


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

    # Migration offset: silently include in closing_cash (not a user-facing line item)
    migration_offset = 0
    for x in today_entries:
        if x["source"] == "migration_offset":
            if x["type"] == "credit":
                migration_offset += x["amount"]
            else:
                migration_offset -= x["amount"]

    closing_cash = (
        opening_cash
        + investments
        + collections
        + advances
        + migration_offset
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


# ============================================================
# MIGRATION & INVESTMENT ENDPOINTS
# ============================================================

@router.get("/migration-status")
def get_migration_status():
    """Check whether the one-time initial migration has been completed."""
    try:
        res = (
            supabase.table("app_settings")
            .select("key,value")
            .in_("key", ["migration_completed", "migration_offset_amount"])
            .execute()
        )
        settings = {row["key"]: row["value"] for row in (res.data or [])}

        if "migration_completed" in settings:
            return {
                "completed": True,
                "completed_at": settings["migration_completed"],
                "offset_amount": int(settings.get("migration_offset_amount", 0)),
            }

        return {
            "completed": False,
            "completed_at": None,
            "offset_amount": None,
        }
    except Exception:
        # Table may not exist yet
        return {
            "completed": False,
            "completed_at": None,
            "offset_amount": None,
        }


@router.post("/complete-migration")
def complete_migration():
    """
    Finalize or recalibrate the migration offset to bring Available Cash to exactly ₹0.
    Can be run initially or recalibrated when migration data entry has finished.
    """
    try:
        cash = get_cash_balance()
        if "error" in cash:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to calculate balance: {cash['error']}",
            )
        current_balance = cash["cash_balance"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate balance: {e}",
        )

    now = datetime.utcnow().isoformat() + "Z"
    today_str = date.today().isoformat()
    yesterday_str = (date.today() - timedelta(days=1)).isoformat()
    offset_date = f"{yesterday_str}T23:59:59"

    # If already exactly 0, nothing to offset
    if current_balance == 0:
        return {
            "message": "Available Cash is already ₹0. Migration is completely balanced.",
            "offset_amount": 0,
            "current_balance": 0
        }

    offset_amount = abs(current_balance)
    offset_type = "credit" if current_balance < 0 else "debit"

    # Check if there is an existing migration_offset in cashbook
    existing_offset = (
        supabase.table("cashbook")
        .select("id, amount, type")
        .eq("source", "migration_offset")
        .execute()
        .data or []
    )

    if existing_offset:
        # Update existing offset row to incorporate the adjustment
        first = existing_offset[0]
        old_contrib = first["amount"] if first["type"] == "credit" else -first["amount"]
        new_contrib = old_contrib + (offset_amount if offset_type == "credit" else -offset_amount)
        new_type = "credit" if new_contrib >= 0 else "debit"
        new_amt = abs(new_contrib)

        supabase.table("cashbook").update({
            "amount": new_amt,
            "type": new_type,
            "date": offset_date
        }).eq("id", first["id"]).execute()

        final_offset_amount = new_amt
    else:
        # Insert a new migration offset
        supabase.table("cashbook").insert({
            "amount": offset_amount,
            "type": offset_type,
            "source": "migration_offset",
            "reference_id": f"migration_{now}",
            "date": offset_date
        }).execute()
        final_offset_amount = offset_amount

    # Update app_settings
    supabase.table("app_settings").upsert({
        "key": "migration_completed",
        "value": now
    }).execute()

    supabase.table("app_settings").upsert({
        "key": "migration_offset_amount",
        "value": str(final_offset_amount)
    }).execute()

    return {
        "message": "Initial migration completed successfully. Available Cash is now ₹0.",
        "offset_amount": final_offset_amount,
        "offset_type": offset_type,
        "completed_at": now,
    }


@router.post("/add-investment")
def add_investment(data: InvestmentCreate):
    """Add a permanent investment (cash inflow) to the business."""
    if data.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Investment amount must be greater than zero.",
        )

    if not data.date:
        raise HTTPException(
            status_code=400,
            detail="Investment date is required.",
        )

    try:
        entry = (
            supabase.table("cashbook")
            .insert(
                {
                    "amount": data.amount,
                    "type": "credit",
                    "source": "investment",
                    "reference_id": data.note or None,
                    "date": data.date,
                }
            )
            .execute()
        )

        if not entry.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to record investment.",
            )

        return {
            "message": "Investment recorded successfully",
            "amount": data.amount,
            "date": data.date,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record investment: {e}",
        )