from fastapi import APIRouter
from fastapi import HTTPException
from backend.db import supabase
from backend.schemas import CustomerCreate, CustomerUpdate, CustomerActivate
from datetime import datetime, timedelta
import json

router = APIRouter(prefix="/customers", tags=["Customers"])

def get_closed_customer_ids() -> set:
    try:
        res = (
            supabase.table("app_settings")
            .select("key")
            .like("key", "closed_loan_%")
            .execute()
        )
        ids = set()
        for r in (res.data or []):
            k = r.get("key", "")
            if k.startswith("closed_loan_"):
                try:
                    ids.add(int(k.replace("closed_loan_", "")))
                except ValueError:
                    pass
        return ids
    except Exception:
        return set()


@router.post("/add")
def add_customer(data: CustomerCreate):

    customer = data.dict()
    if customer.get("type") == "Furniture":

        selling_price = customer.get("selling_price") or 0
        advance_amount = customer.get("advance_amount") or 0

        loan_amount = selling_price - advance_amount

    else:

        loan_amount = customer.get("loan_amount") or 0
    if not customer.get("customer_id") or customer["customer_id"] <= 0:
        return {"error": "Valid Customer ID is required"}
    if not customer.get("name") or not customer["name"].strip():
        return {"error": "Customer name is required"}
    phone = str(customer.get("phone") or "")

    if len(phone) < 10:
        return {"error": "Valid phone number is required"}
    # DL Business Rule
    if customer.get("type") == "DL":
        interest = int((loan_amount * 12 / 100) + 100)

    # Furniture Business Rule
    else:
        interest = int(customer.get("interest") or 0)
        if interest <= 0:
            return {"error": "Profit must be greater than 0"}

    customer["interest"] = interest

    customer["net_given"] = loan_amount - interest

    if loan_amount <= 0:
        return {
            "error":
            "Loan Amount must be greater than 0"
            if customer["type"] == "DL"
            else "Selling Price must be greater than 0"
        }

    actual_given = loan_amount - interest

    if actual_given <= 0:
        return {
            "error": "Profit cannot be greater than or equal to Selling Price"
        }

    customer["net_given"] = actual_given
    customer["loan_amount"] = loan_amount
    if customer["type"] == "Furniture":
        customer["selling_price"] = selling_price
        customer["advance_amount"] = advance_amount

    if customer.get("loan_given", True):
        if not customer.get("loan_date"):
            return {
                "error":
                "Loan Date is required"
                if customer["type"] == "DL"
                else "Delivery Date is required"
            }
        
        if customer["type"] == "Furniture":
            if not customer.get("due_date"):
                return {"error": "Expected Completion is required"}

        # Auto Due Date for DL
        if customer.get("type") == "DL":
            loan_date = customer.get("loan_date")
            if loan_date:
                due_date = (
                    datetime.strptime(loan_date, "%Y-%m-%d")
                    + timedelta(days=100)
                )
                customer["due_date"] = due_date.strftime("%Y-%m-%d")
    else:
        customer["loan_date"] = None
        customer["due_date"] = None

    # ✅ Check duplicate Customer ID (for BOTH DL & Furniture)
    print("Checking Customer ID:", customer["customer_id"])

    existing = (
        supabase.table("customers")
        .select("customer_id")
        .eq("customer_id", customer["customer_id"])
        .execute()
    )

    print("Existing Customer:", existing.data)
    print("Incoming:", customer["customer_id"], type(customer["customer_id"]))
    print("DB Result:", existing.data)

    if existing.data:
        raise HTTPException(
            status_code=400,
            detail="Customer ID already exists"
        )

    # ✅ Insert customer (for BOTH DL & Furniture)
    res = (
        supabase.table("customers")
        .insert(customer)
        .execute()
    )

    try:
        inserted_customer = res.data[0] if res.data else {}
        loan_date = customer.get("loan_date")  # Use actual loan date, not today

        if customer.get("loan_given", True):
            if customer["type"] == "Furniture":
                # Advance received
                if advance_amount > 0:
                    supabase.table("cashbook").insert({
                        "amount": advance_amount,
                        "type": "credit",
                        "source": "advance",
                        "reference_id": str(inserted_customer["customer_id"]),
                        "date": loan_date
                    }).execute()

                # Purchase payment
                supabase.table("cashbook").insert({
                    "amount": actual_given,
                    "type": "debit",
                    "source": "purchase",
                    "reference_id": str(inserted_customer["customer_id"]),
                    "date": loan_date
                }).execute()

            else:
                supabase.table("cashbook").insert({
                    "amount": actual_given,
                    "type": "debit",
                    "source": "loan",
                    "reference_id": str(inserted_customer["customer_id"]),
                    "date": loan_date
                }).execute()

    except Exception as e:
        print("Cashbook loan error:", e)

    return res.data

@router.get("/")
def get_customers():

    res = (
        supabase.table("customers")
        .select("""
            customer_id,
            name,
            address,
            loan_given,
            loan_date,
            ready_to_close,
            loan_amount,
            type,
            place_id,
            places(id, name, priority)
        """)
        .execute()
    )

    # Fetch transactions to calculate authoritative total_paid and balance per customer
    PAGE_SIZE = 1000
    all_txns = []
    page = 0
    while True:
        batch = (
            supabase.table("transactions")
            .select("customer_id, amount_paid")
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
            .execute()
            .data or []
        )
        all_txns.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        page += 1

    paid_map = {}
    for t in all_txns:
        cid = t.get("customer_id")
        if cid is not None:
            paid_map[cid] = paid_map.get(cid, 0) + (t.get("amount_paid", 0) or 0)

    closed_ids = get_closed_customer_ids()

    customers = []
    for c in (res.data or []):
        place_info = c.pop("places", None) or {}
        c["place_name"] = place_info.get("name")
        c["place_priority"] = place_info.get("priority")
        cid = c.get("customer_id")
        paid = paid_map.get(cid, 0)
        bal = (c.get("loan_amount") or 0) - paid
        is_closed = cid in closed_ids
        c["total_paid"] = paid
        c["balance"] = bal
        c["is_closed"] = is_closed
        if is_closed:
            c["status"] = "CLOSED"
        elif not c.get("loan_given", True):
            c["status"] = "PENDING"
        elif bal <= 0:
            c["status"] = "COMPLETED"
        else:
            c["status"] = "ACTIVE"
        customers.append(c)

    return customers

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
def activate_loan(customer_id: int, data: CustomerActivate):

    try:

        loan_date = (data.loan_date or "").strip()
        if not loan_date:
            raise HTTPException(status_code=400, detail="Loan Given Date is required")

        # Get customer
        res = (
            supabase.table("customers")
            .select("*")
            .eq("customer_id", customer_id)
            .execute()
        )

        if not res.data:
            raise HTTPException(status_code=400, detail="Customer not found")

        customer = res.data[0]

        # Already active check
        if customer.get("loan_given"):
            raise HTTPException(status_code=400, detail="Loan already activated")

        # Calculate / Validate Due Date
        if customer.get("type") == "DL":
            try:
                due_date_obj = datetime.strptime(loan_date, "%Y-%m-%d") + timedelta(days=100)
                due_date = due_date_obj.strftime("%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid Loan Given Date format. Use YYYY-MM-DD.")
        else:
            # Furniture: manual loan_date and manual due_date selected by user
            due_date = (data.due_date or "").strip()
            if not due_date:
                raise HTTPException(status_code=400, detail="Due Date is required for Furniture activation")
            try:
                datetime.strptime(loan_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid Loan Given Date format. Use YYYY-MM-DD.")
            try:
                datetime.strptime(due_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid Due Date format. Use YYYY-MM-DD.")

        # Update customer
        update_res = (
            supabase.table("customers")
            .update({
                "loan_given": True,
                "loan_date": loan_date,
                "due_date": due_date
            })
            .eq("customer_id", customer_id)
            .execute()
        )

        if not update_res.data:
            raise HTTPException(status_code=400, detail="Failed to update customer status")

        # Post cashbook entries with rollback protection
        inserted_cashbook_ids = []
        try:
            if customer.get("type") == "Furniture":
                selling_price = customer.get("selling_price") or 0
                advance_amount = customer.get("advance_amount") or 0
                interest = customer.get("interest") or 0
                loan_amount = customer.get("loan_amount") or (selling_price - advance_amount)
                actual_given = loan_amount - interest

                if advance_amount > 0:
                    adv_res = supabase.table("cashbook").insert({
                        "amount": advance_amount,
                        "type": "credit",
                        "source": "advance",
                        "reference_id": str(customer_id),
                        "date": loan_date  # Use actual loan date, not today
                    }).execute()
                    if adv_res.data:
                        inserted_cashbook_ids.extend([item["id"] for item in adv_res.data if "id" in item])

                pur_res = supabase.table("cashbook").insert({
                    "amount": actual_given,
                    "type": "debit",
                    "source": "purchase",
                    "reference_id": str(customer_id),
                    "date": loan_date  # Use actual loan date, not today
                }).execute()
                if pur_res.data:
                    inserted_cashbook_ids.extend([item["id"] for item in pur_res.data if "id" in item])

            else:
                loan_amount = customer.get("loan_amount") or 0
                interest = customer.get("interest") or 0
                actual_given = loan_amount - interest

                debit_res = supabase.table("cashbook").insert({
                    "amount": actual_given,
                    "type": "debit",
                    "source": "loan",
                    "reference_id": str(customer_id),
                    "date": loan_date  # Use actual loan date, not today
                }).execute()
                if debit_res.data:
                    inserted_cashbook_ids.extend([item["id"] for item in debit_res.data if "id" in item])

        except Exception as cb_err:
            # Rollback: revert customer status and delete newly created cashbook entries only
            supabase.table("customers").update({
                "loan_given": False,
                "loan_date": None,
                "due_date": customer.get("due_date") if customer.get("type") == "Furniture" else None
            }).eq("customer_id", customer_id).execute()

            if inserted_cashbook_ids:
                for cb_id in inserted_cashbook_ids:
                    supabase.table("cashbook").delete().eq("id", cb_id).execute()

            raise HTTPException(
                status_code=500,
                detail=f"Failed to post cashbook entry: {str(cb_err)}. Customer activation rolled back."
            )

        return {"message": "Loan activated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.put("/close-loan/{customer_id}")
def close_loan(customer_id: int):

    try:

        customer = (
            supabase.table("customers")
            .select("customer_id,ready_to_close,loan_amount")
            .eq("customer_id", customer_id)
            .execute()
        )

        if not customer.data:
            return {"error": "Customer not found"}

        # State change to CLOSED without deleting the customer or transactions!
        # This preserves payment history, transactions, and cash accounting records.
        now = datetime.utcnow().isoformat() + "Z"
        supabase.table("app_settings").upsert({
            "key": f"closed_loan_{customer_id}",
            "value": json.dumps({"closed_at": now})
        }).execute()

        # Keep ready_to_close as True in customer record
        supabase.table("customers").update({
            "ready_to_close": True
        }).eq("customer_id", customer_id).execute()

        return {
            "message": "Loan closed successfully",
            "customer_id": customer_id,
            "is_closed": True
        }

    except Exception as e:

        return {"error": str(e)}

@router.put("/reopen-loan/{customer_id}")
def reopen_loan(customer_id: int):

    try:

        supabase.table("app_settings").delete().eq(
            "key", f"closed_loan_{customer_id}"
        ).execute()

        return {
            "message": "Loan reopened successfully",
            "customer_id": customer_id,
            "is_closed": False
        }

    except Exception as e:

        return {"error": str(e)}
    
@router.put("/update/{customer_id}")
def update_customer(customer_id: int, data: CustomerUpdate):

    try:

        update_data = data.dict(exclude_unset=True)

        if not update_data:
            return {"error": "No fields to update"}

        # Fetch current customer record to detect changes
        curr_res = (
            supabase.table("customers")
            .select("*")
            .eq("customer_id", customer_id)
            .execute()
        )
        if not curr_res.data:
            return {"error": "Customer not found"}

        curr = curr_res.data[0]
        curr_type = curr.get("type") or "DL"
        curr_loan_given = curr.get("loan_given", True)
        curr_loan_amount = curr.get("loan_amount") or 0
        curr_loan_date = curr.get("loan_date")

        new_loan_amount = update_data.get("loan_amount")
        new_loan_date = update_data.get("loan_date")

        # 1. If loan_amount changed:
        if new_loan_amount is not None and new_loan_amount != curr_loan_amount:
            if curr_type == "DL":
                new_interest = int((new_loan_amount * 12 / 100) + 100)
                new_net_given = new_loan_amount - new_interest
                update_data["interest"] = new_interest
                update_data["net_given"] = new_net_given
            elif curr_type == "Furniture":
                curr_interest = curr.get("interest") or 0
                new_net_given = new_loan_amount - curr_interest
                update_data["net_given"] = new_net_given

            # Recalculate balance and ready_to_close
            txns = (
                supabase.table("transactions")
                .select("amount_paid")
                .eq("customer_id", customer_id)
                .execute()
            )
            total_paid = sum(t.get("amount_paid", 0) for t in (txns.data or []))
            new_balance = new_loan_amount - total_paid
            update_data["ready_to_close"] = (new_balance <= 0)

        # 2. If loan_date changed for DL and due_date was not explicitly provided:
        if new_loan_date and new_loan_date != curr_loan_date and curr_type == "DL" and "due_date" not in update_data:
            try:
                due_date_obj = datetime.strptime(new_loan_date, "%Y-%m-%d") + timedelta(days=100)
                update_data["due_date"] = due_date_obj.strftime("%Y-%m-%d")
            except Exception:
                pass

        # 3. Synchronize Cashbook if customer loan was already disbursed (loan_given == True)
        if curr_loan_given:
            cb_source = "loan" if curr_type == "DL" else "purchase"
            cb_update = {}
            if "net_given" in update_data:
                cb_update["amount"] = update_data["net_given"]
            if new_loan_date:
                cb_update["date"] = new_loan_date

            if cb_update:
                try:
                    supabase.table("cashbook").update(cb_update).match({
                        "reference_id": str(customer_id),
                        "source": cb_source
                    }).execute()
                except Exception as cb_err:
                    print("Cashbook update error on customer edit:", cb_err)

        res = (
            supabase.table("customers")
            .update(update_data)
            .eq("customer_id", customer_id)
            .execute()
        )

        if not res.data:
            return {"error": "Failed to update customer"}

        return {
            "message": "Customer updated successfully",
            "customer": res.data[0]
        }

    except Exception as e:
        return {"error": str(e)}