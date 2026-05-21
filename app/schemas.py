from pydantic import BaseModel

class CustomerCreate(BaseModel):
    customer_id: int
    name: str
    phone: str
    address: str
    interest: int
    loan_amount: int
    loan_date: str
    due_date: str
    type: str

class TransactionCreate(BaseModel):
    customer_id: int
    amount_paid: int   
    payment_date: str

class ExpenseCreate(BaseModel):
    amount: int
    note: str
    date: str