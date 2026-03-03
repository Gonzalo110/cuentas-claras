from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from app.models import SplitType


# --- Auth ---
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# --- Groups ---
class GroupCreate(BaseModel):
    name: str
    description: str = ""


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class GroupMemberResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    joined_at: datetime


class GroupResponse(BaseModel):
    id: str
    name: str
    description: str
    invite_code: str
    created_by: str
    created_at: datetime
    members: list[GroupMemberResponse] = []

    class Config:
        from_attributes = True


class GroupListResponse(BaseModel):
    id: str
    name: str
    description: str
    invite_code: str
    member_count: int
    created_at: datetime


# --- Expenses ---
class ExpenseSplitCreate(BaseModel):
    user_id: str
    amount: float = 0
    percentage: float = 0


class ExpenseCreate(BaseModel):
    description: str
    amount: float
    paid_by: str
    split_type: SplitType = SplitType.EQUAL
    splits: list[ExpenseSplitCreate] = []


class ExpenseSplitResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    amount: float

    class Config:
        from_attributes = True


class ExpenseResponse(BaseModel):
    id: str
    group_id: str
    description: str
    amount: float
    paid_by: str
    paid_by_name: str
    split_type: SplitType
    created_at: datetime
    splits: list[ExpenseSplitResponse] = []

    class Config:
        from_attributes = True


# --- Balances ---
class DebtItem(BaseModel):
    from_user_id: str
    from_user_name: str
    to_user_id: str
    to_user_name: str
    amount: float


class BalanceResponse(BaseModel):
    user_id: str
    user_name: str
    balance: float


class GroupBalances(BaseModel):
    balances: list[BalanceResponse]
    simplified_debts: list[DebtItem]


# --- Payments ---
class PaymentCreate(BaseModel):
    group_id: str
    to_user_id: str
    amount: float


class PaymentResponse(BaseModel):
    id: str
    group_id: str
    from_user_id: str
    from_user_name: str
    to_user_id: str
    to_user_name: str
    amount: float
    is_settled: bool
    settled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MercadoPagoPreference(BaseModel):
    preference_id: str
    init_point: str
    payment_id: str


# --- Invite ---
class GroupPublicInfo(BaseModel):
    id: str
    name: str
    description: str
    member_count: int
    members: list[str]
