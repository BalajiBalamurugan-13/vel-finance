from fastapi import APIRouter
from backend.db import supabase
from backend.schemas import ExpenseCreate
from datetime import date

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("/add")
def add_expense(data: ExpenseCreate):
    expense = data.dict()

    # 1️⃣ existing logic
    res = supabase.table("expenses").insert(expense).execute()

    # 2️⃣ ADD THIS (NEW)
    try:
        supabase.table("cashbook").insert({
            "amount": data.amount,
            "type": "debit",
            "source": "expense",
            "date": data.date
        }).execute()
    except Exception as e:
        print("Cashbook expense error:", e)

    return res.data


@router.get("/today")
def get_today_expense():

    today = date.today().isoformat()

    res = supabase.table("expenses") \
        .select("*") \
        .eq("date", today) \
        .execute()

    expenses = res.data

    total_expense = sum(e["amount"] for e in expenses)

    return {
        "date": today,
        "total_expense": total_expense,
        "expenses": expenses
    }