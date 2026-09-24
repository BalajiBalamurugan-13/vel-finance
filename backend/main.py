from fastapi import FastAPI
from backend.routes import customers, transactions, expenses, places
from fastapi.middleware.cors import CORSMiddleware

backend = FastAPI()
backend.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "https://velfinace.netlify.app",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

backend.include_router(customers.router)
backend.include_router(transactions.router)
backend.include_router(expenses.router)
backend.include_router(places.router)

@backend.get("/")
def root():
    return {"message": "VEL Finance Running"}

@backend.get("/health")
@backend.head("/health")
def health():
    return {"status": "ok"}
