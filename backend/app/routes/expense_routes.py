from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Group, GroupMember, Expense, ExpenseSplit, User, SplitType
from app.schemas import ExpenseCreate, ExpenseResponse, ExpenseSplitResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/groups/{group_id}/expenses", tags=["expenses"])


def _check_membership(group_id: str, user_id: str, db: Session) -> Group:
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    is_member = any(m.user_id == user_id for m in group.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="No sos miembro de este grupo")
    return group


@router.post("/", response_model=ExpenseResponse)
def create_expense(
    group_id: str,
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = _check_membership(group_id, current_user.id, db)
    member_ids = [m.user_id for m in group.members]

    if data.paid_by not in member_ids:
        raise HTTPException(status_code=400, detail="El pagador no es miembro del grupo")

    expense = Expense(
        group_id=group_id,
        description=data.description,
        amount=data.amount,
        paid_by=data.paid_by,
        split_type=data.split_type,
    )
    db.add(expense)
    db.flush()

    if data.split_type == SplitType.EQUAL:
        share = round(data.amount / len(member_ids), 2)
        for uid in member_ids:
            split = ExpenseSplit(expense_id=expense.id, user_id=uid, amount=share)
            db.add(split)
    elif data.split_type == SplitType.PERCENTAGE:
        for s in data.splits:
            if s.user_id not in member_ids:
                raise HTTPException(status_code=400, detail=f"Usuario {s.user_id} no es miembro")
            amount = round(data.amount * s.percentage / 100, 2)
            split = ExpenseSplit(expense_id=expense.id, user_id=s.user_id, amount=amount)
            db.add(split)
    elif data.split_type == SplitType.EXACT:
        total_splits = sum(s.amount for s in data.splits)
        if abs(total_splits - data.amount) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"La suma de los montos ({total_splits}) no coincide con el total ({data.amount})",
            )
        for s in data.splits:
            if s.user_id not in member_ids:
                raise HTTPException(status_code=400, detail=f"Usuario {s.user_id} no es miembro")
            split = ExpenseSplit(expense_id=expense.id, user_id=s.user_id, amount=s.amount)
            db.add(split)

    db.commit()
    db.refresh(expense)
    return _build_expense_response(expense, db)


@router.get("/", response_model=list[ExpenseResponse])
def list_expenses(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_membership(group_id, current_user.id, db)
    expenses = (
        db.query(Expense)
        .filter(Expense.group_id == group_id)
        .order_by(Expense.created_at.desc())
        .all()
    )
    return [_build_expense_response(e, db) for e in expenses]


@router.delete("/{expense_id}")
def delete_expense(
    group_id: str,
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_membership(group_id, current_user.id, db)
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.group_id == group_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    db.delete(expense)
    db.commit()
    return {"detail": "Gasto eliminado"}


def _build_expense_response(expense: Expense, db: Session) -> ExpenseResponse:
    payer = db.query(User).filter(User.id == expense.paid_by).first()
    splits = []
    for s in expense.splits:
        user = db.query(User).filter(User.id == s.user_id).first()
        splits.append(ExpenseSplitResponse(
            id=s.id,
            user_id=s.user_id,
            user_name=user.name if user else "Desconocido",
            amount=s.amount,
        ))
    return ExpenseResponse(
        id=expense.id,
        group_id=expense.group_id,
        description=expense.description,
        amount=expense.amount,
        paid_by=expense.paid_by,
        paid_by_name=payer.name if payer else "Desconocido",
        split_type=expense.split_type,
        created_at=expense.created_at,
        splits=splits,
    )
