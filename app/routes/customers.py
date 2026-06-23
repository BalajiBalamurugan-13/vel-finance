from fastapi import APIRouter
from app.db import supabase
from app.schemas import CustomerCreate

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/add")
def add_customer(data: CustomerCreate):

    customer = data.dict()
    loan_amount = customer.get("loan_amount") or 0
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

        if customer.get("loan_given", True):

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
    res = supabase.table("customers").select("customer_id,name").execute()
    return res.data

@router.delete("/delete/{customer_id}")
def delete_customer(customer_id: int):
    try:
        # delete transactions first
        supabase.table("transactions") \
            .delete() \
            .eq("customer_id", customer_id) \
            .execute()
        # delete cashbook entries
        supabase.table("cashbook") \
            .delete() \
            .eq("reference_id", str(customer_id)) \
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
    
@router.put("/activate-loan/{customer_id}")
def activate_loan(customer_id: int):

    try:

        # Get customer
        res = supabase.table("customers") \
            .select("*") \
            .eq("customer_id", customer_id) \
            .execute()

        if not res.data:
            return {"error": "Customer not found"}

        customer = res.data[0]

        # Already active
        if customer.get("loan_given"):
            return {"error": "Loan already activated"}

        # Update customer
        update_res = supabase.table("customers") \
            .update({"loan_given": True}) \
            .eq("customer_id", customer_id) \
            .execute()

        print("UPDATE RESULT:", update_res.data)

        verify = supabase.table("customers") \
            .select("customer_id,loan_given") \
            .eq("customer_id", customer_id) \
            .execute()

        print("VERIFY:", verify.data)

        # Create cashbook debit
        actual_given = (
            (customer.get("loan_amount") or 0)
            - (customer.get("interest") or 0)
        )

        supabase.table("cashbook").insert({
            "amount": actual_given,
            "type": "debit",
            "source": "loan",
            "reference_id": str(customer_id)
        }).execute()

        return {"message": "Loan activated successfully"}

    except Exception as e:
        return {"error": str(e)}