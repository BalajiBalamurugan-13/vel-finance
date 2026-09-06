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
    place_id: Optional[int] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    due_date: Optional[str] = None
    place_id: Optional[int] = None


class TransactionCreate(BaseModel):
    customer_id: int
    amount_paid: int
    payment_date: str


class ExpenseCreate(BaseModel):
    amount: int
    note: str
    date: str


class PlaceCreate(BaseModel):
    name: str
    priority: int = 0


class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    priority: Optional[int] = None


class PlaceReorderItem(BaseModel):
    id: int
    priority: int


class PlaceReorder(BaseModel):
    items: list[PlaceReorderItem]
