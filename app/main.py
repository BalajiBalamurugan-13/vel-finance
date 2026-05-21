from fastapi import FastAPI
from app.routes import customers, transactions, expenses

app = FastAPI()

app.include_router(customers.router)
app.include_router(transactions.router)
app.include_router(expenses.router)

@app.get("/")
def root():
    return {"message": "VEL Finance Running"}

@app.get("/health")
@app.head("/health")
def health():
    return {"status": "ok"}