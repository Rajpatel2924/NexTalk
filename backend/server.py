from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
import base64
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone

from auth_utils import (
    hash_password, verify_password, create_token, decode_token, get_current_user_id
)
from ws_manager import ws_manager


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# FastAPI
app = FastAPI(title="NexTalk API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger("nextalk")


# ----------------- helpers -----------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "name": u["name"],
        "email": u["email"],
        "avatar": u.get("avatar"),
        "bio": u.get("bio", ""),
        "isOnline": ws_manager.is_online(u["id"]),
        "lastSeen": u.get("lastSeen"),
    }


# ----------------- models -----------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileIn(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None  # data URL or remote URL


class ChangePasswordIn(BaseModel):
    oldPassword: str
    newPassword: str


class CreateConversationIn(BaseModel):
    type: Literal["private", "group"]
    participantIds: List[str]
    name: Optional[str] = None
    avatar: Optional[str] = None


class UpdateGroupIn(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None


class SendMessageIn(BaseModel):
    conversationId: str
    content: str = ""
    messageType: Literal["text", "image", "video", "file", "audio"] = "text"
    attachmentUrl: Optional[str] = None
    attachmentName: Optional[str] = None
    replyToMessageId: Optional[str] = None


class EditMessageIn(BaseModel):
    content: str


class ReactIn(BaseModel):
    emoji: str


# ----------------- AUTH -----------------
@api.post("/auth/register")
async def register(payload: RegisterIn):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": new_id(),
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password": hash_password(payload.password),
        "avatar": None,
        "bio": "",
        "lastSeen": now_iso(),
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_token(user["id"])
    return {"token": token, "user": public_user(user)}


@api.post("/auth/login")
async def login(payload: LoginIn):
    u = await db.users.find_one({"email": payload.email.lower()})
    if not u or not verify_password(payload.password, u["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(u["id"])
    return {"token": token, "user": public_user(u)}


@api.get("/auth/me")
async def me(user_id: str = Depends(get_current_user_id)):
    u = await db.users.find_one({"id": user_id})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return public_user(u)


@api.patch("/auth/profile")
async def update_profile(payload: UpdateProfileIn, user_id: str = Depends(get_current_user_id)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updatedAt"] = now_iso()
    if update:
        await db.users.update_one({"id": user_id}, {"$set": update})
    u = await db.users.find_one({"id": user_id})
    return public_user(u)


@api.post("/auth/change-password")
async def change_password(payload: ChangePasswordIn, user_id: str = Depends(get_current_user_id)):
    u = await db.users.find_one({"id": user_id})
    if not u or not verify_password(payload.oldPassword, u["password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"password": hash_password(payload.newPassword), "updatedAt": now_iso()}},
    )
    return {"ok": True}


# ----------------- USERS -----------------
@api.get("/users/search")
async def search_users(q: str = "", user_id: str = Depends(get_current_user_id)):
    q = (q or "").strip()
    query = {"id": {"$ne": user_id}}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.users.find(query, {"_id": 0, "password": 0}).limit(30).to_list(30)
    return [public_user(d) for d in docs]


@api.get("/users/{uid}")
async def get_user(uid: str, user_id: str = Depends(get_current_user_id)):
    u = await db.users.find_one({"id": uid})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return public_user(u)


# ----------------- CONVERSATIONS -----------------
async def _enrich_conversation(conv: dict, user_id: str) -> dict:
    participants = await db.users.find(
        {"id": {"$in": conv["participantIds"]}}, {"_id": 0, "password": 0}
    ).to_list(100)
    last_msg = await db.messages.find_one(
        {"conversationId": conv["id"], "deletedFor": {"$ne": user_id}},
        sort=[("createdAt", -1)],
    )
    if last_msg:
        last_msg.pop("_id", None)

    unread = await db.messages.count_documents({
        "conversationId": conv["id"],
        "senderId": {"$ne": user_id},
        "readBy": {"$ne": user_id},
    })

    pinned_by = conv.get("pinnedBy", []) or []
    archived_by = conv.get("archivedBy", []) or []

    return {
        "id": conv["id"],
        "type": conv["type"],
        "name": conv.get("name"),
        "avatar": conv.get("avatar"),
        "participants": [public_user(p) for p in participants],
        "admins": conv.get("admins", []),
        "lastMessage": last_msg,
        "unreadCount": unread,
        "isPinned": user_id in pinned_by,
        "isArchived": user_id in archived_by,
        "createdAt": conv.get("createdAt"),
        "updatedAt": conv.get("updatedAt"),
    }


@api.get("/conversations")
async def list_conversations(user_id: str = Depends(get_current_user_id)):
    convs = await db.conversations.find(
        {"participantIds": user_id}, {"_id": 0}
    ).to_list(500)
    enriched = [await _enrich_conversation(c, user_id) for c in convs]
    # sort by last message time desc, pinned first
    def sort_key(c):
        last = c.get("lastMessage") or {}
        ts = last.get("createdAt") or c.get("updatedAt") or ""
        return (not c.get("isPinned"), -1 * (ts and 1 or 0), ts)
    enriched.sort(key=lambda c: ((not c.get("isPinned")), (c.get("lastMessage") or {}).get("createdAt") or c.get("updatedAt") or ""), reverse=False)
    # second sort to put recent first
    enriched.sort(
        key=lambda c: (c.get("lastMessage") or {}).get("createdAt") or c.get("updatedAt") or "",
        reverse=True,
    )
    enriched.sort(key=lambda c: not c.get("isPinned"))
    return enriched


@api.post("/conversations")
async def create_conversation(
    payload: CreateConversationIn, user_id: str = Depends(get_current_user_id)
):
    participant_ids = list({*payload.participantIds, user_id})
    if payload.type == "private":
        if len(participant_ids) != 2:
            raise HTTPException(400, "Private chat must have exactly 2 participants")
        # Find existing private conversation
        existing = await db.conversations.find_one({
            "type": "private",
            "participantIds": {"$all": participant_ids, "$size": 2},
        }, {"_id": 0})
        if existing:
            return await _enrich_conversation(existing, user_id)

    conv = {
        "id": new_id(),
        "type": payload.type,
        "name": payload.name,
        "avatar": payload.avatar,
        "participantIds": participant_ids,
        "admins": [user_id] if payload.type == "group" else [],
        "pinnedBy": [],
        "archivedBy": [],
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    await db.conversations.insert_one(conv)
    enriched = await _enrich_conversation(conv, user_id)
    # notify participants
    await ws_manager.broadcast_to_users(
        participant_ids, {"type": "conversation_created", "conversation": enriched}
    )
    return enriched


@api.get("/conversations/{cid}")
async def get_conversation(cid: str, user_id: str = Depends(get_current_user_id)):
    conv = await db.conversations.find_one({"id": cid, "participantIds": user_id}, {"_id": 0})
    if not conv:
        raise HTTPException(404, "Conversation not found")
    return await _enrich_conversation(conv, user_id)


@api.patch("/conversations/{cid}")
async def update_group(cid: str, payload: UpdateGroupIn, user_id: str = Depends(get_current_user_id)):
    conv = await db.conversations.find_one({"id": cid})
    if not conv or user_id not in conv["participantIds"]:
        raise HTTPException(404, "Conversation not found")
    if conv["type"] != "group":
        raise HTTPException(400, "Only groups can be edited")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updatedAt"] = now_iso()
    await db.conversations.update_one({"id": cid}, {"$set": update})
    conv = await db.conversations.find_one({"id": cid}, {"_id": 0})
    return await _enrich_conversation(conv, user_id)


@api.post("/conversations/{cid}/members/{uid}")
async def add_member(cid: str, uid: str, user_id: str = Depends(get_current_user_id)):
    conv = await db.conversations.find_one({"id": cid})
    if not conv or conv["type"] != "group" or user_id not in conv.get("admins", []):
        raise HTTPException(403, "Not allowed")
    await db.conversations.update_one(
        {"id": cid}, {"$addToSet": {"participantIds": uid}, "$set": {"updatedAt": now_iso()}}
    )
    conv = await db.conversations.find_one({"id": cid}, {"_id": 0})
    enriched = await _enrich_conversation(conv, user_id)
    await ws_manager.broadcast_to_users(conv["participantIds"], {"type": "conversation_updated", "conversation": enriched})
    return enriched


@api.delete("/conversations/{cid}/members/{uid}")
async def remove_member(cid: str, uid: str, user_id: str = Depends(get_current_user_id)):
    conv = await db.conversations.find_one({"id": cid})
    if not conv or conv["type"] != "group":
        raise HTTPException(404, "Group not found")
    if user_id != uid and user_id not in conv.get("admins", []):
        raise HTTPException(403, "Not allowed")
    await db.conversations.update_one(
        {"id": cid},
        {"$pull": {"participantIds": uid, "admins": uid}, "$set": {"updatedAt": now_iso()}},
    )
    conv = await db.conversations.find_one({"id": cid}, {"_id": 0})
    if conv:
        await ws_manager.broadcast_to_users(conv["participantIds"] + [uid], {"type": "conversation_updated", "conversationId": cid})
    return {"ok": True}


@api.post("/conversations/{cid}/pin")
async def pin_conversation(cid: str, user_id: str = Depends(get_current_user_id)):
    await db.conversations.update_one({"id": cid}, {"$addToSet": {"pinnedBy": user_id}})
    return {"ok": True}


@api.delete("/conversations/{cid}/pin")
async def unpin_conversation(cid: str, user_id: str = Depends(get_current_user_id)):
    await db.conversations.update_one({"id": cid}, {"$pull": {"pinnedBy": user_id}})
    return {"ok": True}


@api.post("/conversations/{cid}/archive")
async def archive_conversation(cid: str, user_id: str = Depends(get_current_user_id)):
    await db.conversations.update_one({"id": cid}, {"$addToSet": {"archivedBy": user_id}})
    return {"ok": True}


@api.delete("/conversations/{cid}/archive")
async def unarchive_conversation(cid: str, user_id: str = Depends(get_current_user_id)):
    await db.conversations.update_one({"id": cid}, {"$pull": {"archivedBy": user_id}})
    return {"ok": True}


@api.delete("/conversations/{cid}")
async def delete_conversation(cid: str, user_id: str = Depends(get_current_user_id)):
    # soft-delete for this user: pull from participants, also mark messages deleted for them
    conv = await db.conversations.find_one({"id": cid})
    if not conv:
        raise HTTPException(404, "Not found")
    await db.conversations.update_one({"id": cid}, {"$pull": {"participantIds": user_id}})
    await db.messages.update_many(
        {"conversationId": cid}, {"$addToSet": {"deletedFor": user_id}}
    )
    return {"ok": True}


# ----------------- MESSAGES -----------------
def _msg_out(m: dict) -> dict:
    m.pop("_id", None)
    return m


@api.get("/messages/{cid}")
async def list_messages(
    cid: str,
    user_id: str = Depends(get_current_user_id),
    before: Optional[str] = None,
    limit: int = 50,
):
    conv = await db.conversations.find_one({"id": cid, "participantIds": user_id})
    if not conv:
        raise HTTPException(404, "Conversation not found")
    query = {"conversationId": cid, "deletedFor": {"$ne": user_id}}
    if before:
        query["createdAt"] = {"$lt": before}
    cursor = db.messages.find(query, {"_id": 0}).sort("createdAt", -1).limit(limit)
    msgs = await cursor.to_list(limit)
    msgs.reverse()
    return msgs


@api.get("/messages/{cid}/search")
async def search_messages(cid: str, q: str, user_id: str = Depends(get_current_user_id)):
    conv = await db.conversations.find_one({"id": cid, "participantIds": user_id})
    if not conv:
        raise HTTPException(404, "Conversation not found")
    cursor = db.messages.find(
        {
            "conversationId": cid,
            "deletedFor": {"$ne": user_id},
            "content": {"$regex": q, "$options": "i"},
        },
        {"_id": 0},
    ).sort("createdAt", -1).limit(50)
    return await cursor.to_list(50)


@api.post("/messages")
async def send_message(payload: SendMessageIn, user_id: str = Depends(get_current_user_id)):
    conv = await db.conversations.find_one({"id": payload.conversationId, "participantIds": user_id})
    if not conv:
        raise HTTPException(404, "Conversation not found")
    msg = {
        "id": new_id(),
        "conversationId": payload.conversationId,
        "senderId": user_id,
        "content": payload.content,
        "messageType": payload.messageType,
        "attachmentUrl": payload.attachmentUrl,
        "attachmentName": payload.attachmentName,
        "replyToMessageId": payload.replyToMessageId,
        "isEdited": False,
        "isDeleted": False,
        "deletedFor": [],
        "reactions": {},  # emoji -> [user_ids]
        "deliveredTo": [user_id],
        "readBy": [user_id],
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    await db.messages.insert_one(msg)
    await db.conversations.update_one(
        {"id": payload.conversationId}, {"$set": {"updatedAt": now_iso()}}
    )
    out = _msg_out({**msg})
    # broadcast to all participants
    online_participants = [p for p in conv["participantIds"] if ws_manager.is_online(p) and p != user_id]
    if online_participants:
        # automatically mark delivered for online participants
        await db.messages.update_one(
            {"id": msg["id"]},
            {"$addToSet": {"deliveredTo": {"$each": online_participants}}},
        )
        out["deliveredTo"] = list(set(out["deliveredTo"] + online_participants))

    await ws_manager.broadcast_to_users(
        conv["participantIds"], {"type": "message_new", "message": out}
    )
    return out


@api.patch("/messages/{mid}")
async def edit_message(mid: str, payload: EditMessageIn, user_id: str = Depends(get_current_user_id)):
    msg = await db.messages.find_one({"id": mid})
    if not msg or msg["senderId"] != user_id:
        raise HTTPException(403, "Not allowed")
    await db.messages.update_one(
        {"id": mid},
        {"$set": {"content": payload.content, "isEdited": True, "updatedAt": now_iso()}},
    )
    msg = await db.messages.find_one({"id": mid}, {"_id": 0})
    conv = await db.conversations.find_one({"id": msg["conversationId"]})
    await ws_manager.broadcast_to_users(
        conv["participantIds"], {"type": "message_updated", "message": msg}
    )
    return msg


@api.delete("/messages/{mid}")
async def delete_message(mid: str, user_id: str = Depends(get_current_user_id)):
    msg = await db.messages.find_one({"id": mid})
    if not msg:
        raise HTTPException(404, "Not found")
    if msg["senderId"] != user_id:
        raise HTTPException(403, "Not allowed")
    await db.messages.update_one(
        {"id": mid},
        {"$set": {"isDeleted": True, "content": "", "attachmentUrl": None, "updatedAt": now_iso()}},
    )
    conv = await db.conversations.find_one({"id": msg["conversationId"]})
    updated = await db.messages.find_one({"id": mid}, {"_id": 0})
    await ws_manager.broadcast_to_users(
        conv["participantIds"], {"type": "message_updated", "message": updated}
    )
    return {"ok": True}


@api.post("/messages/{mid}/react")
async def react_message(mid: str, payload: ReactIn, user_id: str = Depends(get_current_user_id)):
    msg = await db.messages.find_one({"id": mid})
    if not msg:
        raise HTTPException(404, "Not found")
    reactions = msg.get("reactions", {}) or {}
    # toggle
    users = list(reactions.get(payload.emoji, []))
    if user_id in users:
        users.remove(user_id)
    else:
        users.append(user_id)
    if users:
        reactions[payload.emoji] = users
    else:
        reactions.pop(payload.emoji, None)
    await db.messages.update_one({"id": mid}, {"$set": {"reactions": reactions, "updatedAt": now_iso()}})
    updated = await db.messages.find_one({"id": mid}, {"_id": 0})
    conv = await db.conversations.find_one({"id": msg["conversationId"]})
    await ws_manager.broadcast_to_users(
        conv["participantIds"], {"type": "message_updated", "message": updated}
    )
    return updated


@api.post("/messages/{cid}/read")
async def mark_read(cid: str, user_id: str = Depends(get_current_user_id)):
    conv = await db.conversations.find_one({"id": cid, "participantIds": user_id})
    if not conv:
        raise HTTPException(404, "Conversation not found")
    await db.messages.update_many(
        {"conversationId": cid, "readBy": {"$ne": user_id}},
        {"$addToSet": {"readBy": user_id, "deliveredTo": user_id}},
    )
    await ws_manager.broadcast_to_users(
        conv["participantIds"],
        {"type": "messages_read", "conversationId": cid, "userId": user_id, "at": now_iso()},
    )
    return {"ok": True}


# ----------------- FILE UPLOAD -----------------
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@api.post("/upload")
async def upload_file(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    # Store inline as a data URL for simplicity (sufficient for portfolio demo, no external deps).
    # For large files, switch to object storage.
    raw = await file.read()
    if len(raw) > 5 * 1024 * 1024:  # 5MB cap
        raise HTTPException(400, "File too large (max 5MB)")
    b64 = base64.b64encode(raw).decode("utf-8")
    mime = file.content_type or "application/octet-stream"
    data_url = f"data:{mime};base64,{b64}"
    return {
        "url": data_url,
        "name": file.filename,
        "size": len(raw),
        "mime": mime,
    }


# ----------------- WebSocket -----------------
@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        user_id = decode_token(token)
    except Exception:
        await websocket.close(code=4401)
        return

    await websocket.accept()
    await ws_manager.connect(user_id, websocket)

    # set lastSeen and notify others of presence
    await db.users.update_one({"id": user_id}, {"$set": {"lastSeen": now_iso()}})
    # broadcast presence to user's contacts (anyone sharing a conversation)
    convs = await db.conversations.find({"participantIds": user_id}, {"participantIds": 1}).to_list(500)
    contact_ids = set()
    for c in convs:
        for pid in c.get("participantIds", []):
            if pid != user_id:
                contact_ids.add(pid)
    await ws_manager.broadcast_to_users(
        list(contact_ids),
        {"type": "presence", "userId": user_id, "isOnline": True, "lastSeen": now_iso()},
    )

    try:
        while True:
            data = await websocket.receive_text()
            try:
                event = json.loads(data)
            except Exception:
                continue
            etype = event.get("type")

            if etype == "typing":
                cid = event.get("conversationId")
                is_typing = bool(event.get("isTyping"))
                conv = await db.conversations.find_one({"id": cid, "participantIds": user_id})
                if not conv:
                    continue
                others = [p for p in conv["participantIds"] if p != user_id]
                await ws_manager.broadcast_to_users(
                    others,
                    {
                        "type": "typing",
                        "conversationId": cid,
                        "userId": user_id,
                        "isTyping": is_typing,
                    },
                )
            elif etype == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.exception("WS error: %s", e)
    finally:
        await ws_manager.disconnect(user_id, websocket)
        await db.users.update_one({"id": user_id}, {"$set": {"lastSeen": now_iso()}})
        if not ws_manager.is_online(user_id):
            await ws_manager.broadcast_to_users(
                list(contact_ids),
                {
                    "type": "presence",
                    "userId": user_id,
                    "isOnline": False,
                    "lastSeen": now_iso(),
                },
            )


# ----------------- health -----------------
@api.get("/")
async def root():
    return {"name": "NexTalk API", "ok": True}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.conversations.create_index("id", unique=True)
    await db.conversations.create_index("participantIds")
    await db.messages.create_index("id", unique=True)
    await db.messages.create_index([("conversationId", 1), ("createdAt", -1)])
    log.info("NexTalk startup complete")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
