from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Group, GroupMember, User
from app.schemas import (
    GroupCreate, GroupUpdate, GroupResponse, GroupMemberResponse,
    GroupListResponse, GroupPublicInfo,
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/groups", tags=["groups"])


@router.post("/", response_model=GroupResponse)
def create_group(
    data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = Group(
        name=data.name,
        description=data.description,
        created_by=current_user.id,
    )
    db.add(group)
    db.flush()

    member = GroupMember(group_id=group.id, user_id=current_user.id)
    db.add(member)
    db.commit()
    db.refresh(group)

    return _build_group_response(group)


@router.get("/", response_model=list[GroupListResponse])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memberships = (
        db.query(GroupMember)
        .filter(GroupMember.user_id == current_user.id)
        .all()
    )
    group_ids = [m.group_id for m in memberships]
    groups = db.query(Group).filter(Group.id.in_(group_ids)).order_by(Group.created_at.desc()).all()

    result = []
    for g in groups:
        result.append(GroupListResponse(
            id=g.id,
            name=g.name,
            description=g.description,
            invite_code=g.invite_code,
            member_count=len(g.members),
            created_at=g.created_at,
        ))
    return result


@router.get("/invite/{invite_code}/info", response_model=GroupPublicInfo)
def get_group_public_info(invite_code: str, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.invite_code == invite_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    return GroupPublicInfo(
        id=group.id,
        name=group.name,
        description=group.description,
        member_count=len(group.members),
        members=[m.user.name for m in group.members],
    )


@router.post("/invite/{invite_code}/join", response_model=GroupResponse)
def join_group(
    invite_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = db.query(Group).filter(Group.invite_code == invite_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    existing = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group.id, GroupMember.user_id == current_user.id)
        .first()
    )
    if existing:
        return _build_group_response(group)

    member = GroupMember(group_id=group.id, user_id=current_user.id)
    db.add(member)
    db.commit()
    db.refresh(group)

    return _build_group_response(group)


@router.get("/{group_id}", response_model=GroupResponse)
def get_group(
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

    return _build_group_response(group)


@router.put("/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: str,
    data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if group.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el creador puede editar el grupo")

    if data.name is not None:
        group.name = data.name
    if data.description is not None:
        group.description = data.description

    db.commit()
    db.refresh(group)
    return _build_group_response(group)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if group.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el creador puede eliminar el grupo")

    db.delete(group)
    db.commit()


def _build_group_response(group: Group) -> GroupResponse:
    members = [
        GroupMemberResponse(
            id=m.id,
            user_id=m.user.id,
            user_name=m.user.name,
            user_email=m.user.email,
            joined_at=m.joined_at,
        )
        for m in group.members
    ]
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        invite_code=group.invite_code,
        created_by=group.created_by,
        created_at=group.created_at,
        members=members,
    )
