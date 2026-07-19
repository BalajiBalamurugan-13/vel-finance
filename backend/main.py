from fastapi import FastAPI
from backend.routes import customers, transactions, expenses
from fastapi.middleware.cors import CORSMiddleware

backend = FastAPI()
backend.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

backend.include_router(customers.router)
backend.include_router(transactions.router)
backend.include_router(expenses.router)

@backend.get("/")
def root():
    return {"message": "VEL Finance Running"}

@backend.get("/health")
@backend.head("/health")
def health():
    return {"status": "ok"}