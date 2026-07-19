from pydantic import BaseModel
from typing import Optional

class CustomerCreate(BaseModel):
    customer_id: int
    name: str
    phone: str
    address: str
    selling_price: int | None = None
    advance_amount: int = 0
    interest: int
    loan_amount: int
    loan_date: str
    due_date: str
    type: str
    loan_given: bool = True

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    due_date: Optional[str] = None

class TransactionCreate(BaseModel):
    customer_id: int
    amount_paid: int   
    payment_date: str

class ExpenseCreate(BaseModel):
    amount: int
    note: str
    date: str