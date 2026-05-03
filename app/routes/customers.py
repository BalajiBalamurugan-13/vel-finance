from fastapi import APIRouter
from app.db import supabase
from app.schemas import CustomerCreate

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/add")
def add_customer(data: CustomerCreate):

    customer = data.dict()
    loan_amount = customer.get("net_given") or 0
    interest = customer.get("interest") or 0

    if loan_amount <= 0:
        return {"error": "Loan amount must be greater than 0"}

    actual_given = loan_amount - interest

    if actual_given < 0:
        return {"error": "Interest cannot be greater than loan amount"}

    customer["net_given"] = actual_given
    customer["loan_amount"] = loan_amount

    res = supabase.table("customers").insert(customer).execute()

    try:
        inserted_customer = res.data[0] if res.data else {}

        supabase.table("cashbook").insert({
            "amount": actual_given,
            "type": "debit",
            "source": "loan",
            "reference_id": str(inserted_customer.get("customer_id"))
        }).execute()

    except Exception as e:
        print("Cashbook loan error:", e)

    return res.data


@router.get("/")
def get_customers():
    res = supabase.table("customers").select("*").execute()
    return res.data

from datetime import date

@router.get("/not-paid-today")
def get_not_paid_today():

    today = date.today().isoformat()

    # 1. Get all customers
    customers_res = supabase.table("customers").select("*").execute()
    customers = customers_res.data

    # 2. Get today's transactions
    txn_res = supabase.table("transactions") \
        .select("customer_id") \
        .eq("payment_date", today) \
        .execute()

    paid_customer_ids = {t["customer_id"] for t in txn_res.data}

    # 3. Find customers not paid today
    not_paid = [
        c for c in customers
        if c["customer_id"] not in paid_customer_ids
    ]

    return not_paid

@router.get("/payment-gaps")
def get_payment_gaps():

    from datetime import date

    today = date.today()

    # 1. Get all customers
    customers_res = supabase.table("customers").select("*").execute()
    customers = customers_res.data

    result = []

    for c in customers:
        cid = c["customer_id"]

        # 2. Get latest transaction
        txn_res = supabase.table("transactions") \
            .select("payment_date") \
            .eq("customer_id", cid) \
            .order("payment_date", desc=True) \
            .limit(1) \
            .execute()

        if txn_res.data:
            last_paid_str = txn_res.data[0]["payment_date"]

            # Handle date safely
            if isinstance(last_paid_str, str):
                last_paid = date.fromisoformat(last_paid_str)
            else:
                last_paid = last_paid_str

            gap_days = (today - last_paid).days

            # Show only if gap > 1
            if gap_days >= 3:
                result.append({
                    "customer_id": cid,
                    "name": c["name"],
                    "last_paid": str(last_paid),
                    "gap_days": gap_days
                })

        else:
            # Never paid
            result.append({
                "customer_id": cid,
                "name": c["name"],
                "last_paid": "Never",
                "gap_days": -1,
                "status": "Never Paid"
            })

    return result

@router.delete("/delete/{customer_id}")
def delete_customer(customer_id: int):
    try:
        # delete transactions first
        supabase.table("transactions") \
            .delete() \
            .eq("customer_id", customer_id) \
            .execute()

        # delete customer
        res = supabase.table("customers") \
            .delete() \
            .eq("customer_id", customer_id) \
            .execute()

        if not res.data:
            return {"error": "Customer not found or already deleted"}

        return {"message": "Customer deleted successfully"}

    except Exception as e:
        return {"error": str(e)}