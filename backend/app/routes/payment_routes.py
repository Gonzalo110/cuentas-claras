from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Payment, Group, GroupMember, User
from app.schemas import PaymentCreate, PaymentResponse, MercadoPagoPreference
from app.auth import get_current_user
from app.config import get_settings
import mercadopago

router = APIRouter(prefix="/api/payments", tags=["payments"])
settings = get_settings()


@router.post("/", response_model=PaymentResponse)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = db.query(Group).filter(Group.id == data.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    payment = Payment(
        group_id=data.group_id,
        from_user_id=current_user.id,
        to_user_id=data.to_user_id,
        amount=data.amount,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return _build_payment_response(payment, db)


@router.post("/{payment_id}/settle", response_model=PaymentResponse)
def settle_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    payment.is_settled = True
    payment.settled_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)

    return _build_payment_response(payment, db)


@router.post("/{payment_id}/mercadopago", response_model=MercadoPagoPreference)
def create_mercadopago_preference(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    if payment.from_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el deudor puede generar el link de pago")

    to_user = db.query(User).filter(User.id == payment.to_user_id).first()

    sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
    preference_data = {
        "items": [
            {
                "title": f"Pago de deuda a {to_user.name}",
                "quantity": 1,
                "unit_price": payment.amount,
                "currency_id": "ARS",
            }
        ],
        "back_urls": {
            "success": f"{settings.FRONTEND_URL}/payment/success/{payment_id}",
            "failure": f"{settings.FRONTEND_URL}/payment/failure/{payment_id}",
            "pending": f"{settings.FRONTEND_URL}/payment/pending/{payment_id}",
        },
        "auto_return": "approved",
        "notification_url": f"{settings.BACKEND_URL}/api/payments/webhook",
        "external_reference": payment_id,
    }

    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]

    payment.mercadopago_preference_id = preference["id"]
    db.commit()

    return MercadoPagoPreference(
        preference_id=preference["id"],
        init_point=preference["init_point"],
        payment_id=payment.id,
    )


@router.post("/webhook")
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()

    if body.get("type") == "payment":
        sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
        mp_payment = sdk.payment().get(body["data"]["id"])

        if mp_payment["status"] == 200:
            mp_data = mp_payment["response"]
            if mp_data["status"] == "approved":
                payment_id = mp_data.get("external_reference")
                if payment_id:
                    payment = db.query(Payment).filter(Payment.id == payment_id).first()
                    if payment:
                        payment.is_settled = True
                        payment.settled_at = datetime.utcnow()
                        payment.mercadopago_payment_id = str(mp_data["id"])
                        db.commit()

    return {"status": "ok"}


@router.get("/group/{group_id}", response_model=list[PaymentResponse])
def list_group_payments(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payments = (
        db.query(Payment)
        .filter(Payment.group_id == group_id)
        .order_by(Payment.created_at.desc())
        .all()
    )
    return [_build_payment_response(p, db) for p in payments]


def _build_payment_response(payment: Payment, db: Session) -> PaymentResponse:
    from_user = db.query(User).filter(User.id == payment.from_user_id).first()
    to_user = db.query(User).filter(User.id == payment.to_user_id).first()
    return PaymentResponse(
        id=payment.id,
        group_id=payment.group_id,
        from_user_id=payment.from_user_id,
        from_user_name=from_user.name if from_user else "Desconocido",
        to_user_id=payment.to_user_id,
        to_user_name=to_user.name if to_user else "Desconocido",
        amount=payment.amount,
        is_settled=payment.is_settled,
        settled_at=payment.settled_at,
        created_at=payment.created_at,
    )
