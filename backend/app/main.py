from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.config import get_settings
from app.routes import auth_routes, group_routes, expense_routes, balance_routes, payment_routes

settings = get_settings()

app = FastAPI(title="Cuentas Claras API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_routes.router)
app.include_router(group_routes.router)
app.include_router(expense_routes.router)
app.include_router(balance_routes.router)
app.include_router(payment_routes.router)


@app.get("/")
def root():
    return {"message": "Cuentas Claras API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
