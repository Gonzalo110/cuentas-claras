from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import defaultdict
from app.database import get_db
from app.models import Group, GroupMember, Expense, Payment, User
from app.schemas import GroupBalances, BalanceResponse, DebtItem
from app.auth import get_current_user

router = APIRouter(prefix="/api/groups/{group_id}/balances", tags=["balances"])


@router.get("/", response_model=GroupBalances)
def get_balances(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    is_member = any(m.user_id == current_user.id for m in group.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="No sos miembro de este grupo")

    return _calculate_balances(group, db)


def _calculate_balances(group: Group, db: Session) -> GroupBalances:
    member_map = {}
    for m in group.members:
        user = db.query(User).filter(User.id == m.user_id).first()
        member_map[m.user_id] = user.name if user else "Desconocido"

    # Calculate net balance for each member
    net = defaultdict(float)
    for expense in group.expenses:
        net[expense.paid_by] += expense.amount
        for split in expense.splits:
            net[split.user_id] -= split.amount

    # Account for settled payments
    payments = (
        db.query(Payment)
        .filter(Payment.group_id == group.id, Payment.is_settled == True)
        .all()
    )
    for p in payments:
        net[p.from_user_id] += p.amount
        net[p.to_user_id] -= p.amount

    balances = [
        BalanceResponse(
            user_id=uid,
            user_name=member_map.get(uid, "Desconocido"),
            balance=round(net.get(uid, 0), 2),
        )
        for uid in member_map
    ]

    simplified = _simplify_debts(net, member_map)

    return GroupBalances(balances=balances, simplified_debts=simplified)


def _simplify_debts(net: dict, member_map: dict) -> list[DebtItem]:
    """Minimize the number of transfers needed to settle all debts."""
    debtors = []  # (user_id, amount_owed)
    creditors = []  # (user_id, amount_owed_to)

    for uid, balance in net.items():
        if balance < -0.01:
            debtors.append([uid, -balance])
        elif balance > 0.01:
            creditors.append([uid, balance])

    debtors.sort(key=lambda x: -x[1])
    creditors.sort(key=lambda x: -x[1])

    debts = []
    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        debtor_id, debt_amount = debtors[i]
        creditor_id, credit_amount = creditors[j]

        transfer = min(debt_amount, credit_amount)
        if transfer > 0.01:
            debts.append(DebtItem(
                from_user_id=debtor_id,
                from_user_name=member_map.get(debtor_id, "Desconocido"),
                to_user_id=creditor_id,
                to_user_name=member_map.get(creditor_id, "Desconocido"),
                amount=round(transfer, 2),
            ))

        debtors[i][1] -= transfer
        creditors[j][1] -= transfer

        if debtors[i][1] < 0.01:
            i += 1
        if creditors[j][1] < 0.01:
            j += 1

    return debts
