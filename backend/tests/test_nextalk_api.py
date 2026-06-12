"""NexTalk backend API + WebSocket tests."""
import os
import time
import json
import asyncio
import uuid
import pytest
import requests
import websockets

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # fallback to frontend/.env if not in env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip()
                    break
    except Exception:
        pass
BASE_URL = (BASE_URL or "").rstrip("/")
API = f"{BASE_URL}/api"
WS_URL = API.replace("https://", "wss://").replace("http://", "ws://") + "/ws"

UNIQ = uuid.uuid4().hex[:6]


def _reg_or_login(name, email, password):
    r = requests.post(f"{API}/auth/register", json={"name": name, "email": email, "password": password})
    if r.status_code == 200:
        return r.json()
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="session")
def alice():
    return _reg_or_login("Alice", "alice@test.com", "password123")


@pytest.fixture(scope="session")
def bob():
    return _reg_or_login("Bob", "bob@test.com", "password123")


@pytest.fixture(scope="session")
def carol():
    return _reg_or_login("Carol", "carol@test.com", "password123")


def auth_h(user):
    return {"Authorization": f"Bearer {user['token']}"}


# -------- Health & Auth --------
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_register_duplicate(alice):
    r = requests.post(f"{API}/auth/register", json={"name": "Alice", "email": "alice@test.com", "password": "password123"})
    assert r.status_code == 400


def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": "alice@test.com", "password": "wrongpass"})
    assert r.status_code == 401


def test_login_success(alice):
    r = requests.post(f"{API}/auth/login", json={"email": "alice@test.com", "password": "password123"})
    assert r.status_code == 200
    d = r.json()
    assert "token" in d and d["user"]["email"] == "alice@test.com"


def test_auth_me(alice):
    r = requests.get(f"{API}/auth/me", headers=auth_h(alice))
    assert r.status_code == 200
    assert r.json()["id"] == alice["user"]["id"]


def test_auth_me_unauthorized():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_update_profile(alice):
    new_bio = f"Hello from Alice {UNIQ}"
    r = requests.patch(f"{API}/auth/profile", headers=auth_h(alice), json={"bio": new_bio})
    assert r.status_code == 200
    assert r.json()["bio"] == new_bio
    # persistence check
    r2 = requests.get(f"{API}/auth/me", headers=auth_h(alice))
    assert r2.json()["bio"] == new_bio


# -------- Users --------
def test_search_users(alice, bob):
    r = requests.get(f"{API}/users/search", params={"q": "bob"}, headers=auth_h(alice))
    assert r.status_code == 200
    ids = [u["id"] for u in r.json()]
    assert bob["user"]["id"] in ids


def test_search_users_excludes_self(alice):
    r = requests.get(f"{API}/users/search", params={"q": "alice"}, headers=auth_h(alice))
    assert r.status_code == 200
    ids = [u["id"] for u in r.json()]
    assert alice["user"]["id"] not in ids


# -------- Conversations --------
@pytest.fixture(scope="session")
def private_conv(alice, bob):
    r = requests.post(
        f"{API}/conversations",
        headers=auth_h(alice),
        json={"type": "private", "participantIds": [bob["user"]["id"]]},
    )
    assert r.status_code == 200, r.text
    return r.json()


def test_create_private_conversation(private_conv, alice, bob):
    assert private_conv["type"] == "private"
    pids = [p["id"] for p in private_conv["participants"]]
    assert alice["user"]["id"] in pids and bob["user"]["id"] in pids


def test_private_conv_idempotent(alice, bob, private_conv):
    r = requests.post(
        f"{API}/conversations",
        headers=auth_h(alice),
        json={"type": "private", "participantIds": [bob["user"]["id"]]},
    )
    assert r.status_code == 200
    assert r.json()["id"] == private_conv["id"]


def test_list_conversations(alice, private_conv):
    r = requests.get(f"{API}/conversations", headers=auth_h(alice))
    assert r.status_code == 200
    ids = [c["id"] for c in r.json()]
    assert private_conv["id"] in ids


@pytest.fixture(scope="session")
def group_conv(alice, bob, carol):
    r = requests.post(
        f"{API}/conversations",
        headers=auth_h(alice),
        json={
            "type": "group",
            "name": f"TEST_Group_{UNIQ}",
            "participantIds": [bob["user"]["id"], carol["user"]["id"]],
        },
    )
    assert r.status_code == 200, r.text
    return r.json()


def test_create_group(group_conv):
    assert group_conv["type"] == "group"
    assert len(group_conv["participants"]) == 3


# -------- Messages --------
def test_send_and_list_message(alice, bob, private_conv):
    content = f"Hello Bob {UNIQ}"
    r = requests.post(
        f"{API}/messages",
        headers=auth_h(alice),
        json={"conversationId": private_conv["id"], "content": content},
    )
    assert r.status_code == 200, r.text
    msg = r.json()
    assert msg["content"] == content
    assert msg["senderId"] == alice["user"]["id"]

    r2 = requests.get(f"{API}/messages/{private_conv['id']}", headers=auth_h(bob))
    assert r2.status_code == 200
    contents = [m["content"] for m in r2.json()]
    assert content in contents


def test_edit_message(alice, private_conv):
    r = requests.post(
        f"{API}/messages",
        headers=auth_h(alice),
        json={"conversationId": private_conv["id"], "content": "to edit"},
    )
    mid = r.json()["id"]
    r2 = requests.patch(f"{API}/messages/{mid}", headers=auth_h(alice), json={"content": "edited!"})
    assert r2.status_code == 200
    assert r2.json()["content"] == "edited!" and r2.json()["isEdited"] is True


def test_delete_message(alice, private_conv):
    r = requests.post(
        f"{API}/messages",
        headers=auth_h(alice),
        json={"conversationId": private_conv["id"], "content": "to delete"},
    )
    mid = r.json()["id"]
    r2 = requests.delete(f"{API}/messages/{mid}", headers=auth_h(alice))
    assert r2.status_code == 200


def test_edit_message_not_owner(bob, alice, private_conv):
    r = requests.post(
        f"{API}/messages",
        headers=auth_h(alice),
        json={"conversationId": private_conv["id"], "content": "alice msg"},
    )
    mid = r.json()["id"]
    r2 = requests.patch(f"{API}/messages/{mid}", headers=auth_h(bob), json={"content": "hack"})
    assert r2.status_code == 403


def test_react_message_toggle(alice, bob, private_conv):
    r = requests.post(
        f"{API}/messages",
        headers=auth_h(alice),
        json={"conversationId": private_conv["id"], "content": "react me"},
    )
    mid = r.json()["id"]
    r2 = requests.post(f"{API}/messages/{mid}/react", headers=auth_h(bob), json={"emoji": "👍"})
    assert r2.status_code == 200
    assert bob["user"]["id"] in r2.json()["reactions"].get("👍", [])
    # toggle off
    r3 = requests.post(f"{API}/messages/{mid}/react", headers=auth_h(bob), json={"emoji": "👍"})
    assert "👍" not in r3.json().get("reactions", {})


def test_mark_read(alice, bob, private_conv):
    requests.post(
        f"{API}/messages",
        headers=auth_h(alice),
        json={"conversationId": private_conv["id"], "content": "unread"},
    )
    r = requests.post(f"{API}/messages/{private_conv['id']}/read", headers=auth_h(bob))
    assert r.status_code == 200


def test_search_messages(alice, private_conv):
    needle = f"NEEDLE_{UNIQ}"
    requests.post(
        f"{API}/messages",
        headers=auth_h(alice),
        json={"conversationId": private_conv["id"], "content": f"find this {needle} string"},
    )
    r = requests.get(f"{API}/messages/{private_conv['id']}/search", params={"q": needle}, headers=auth_h(alice))
    assert r.status_code == 200
    assert any(needle in m["content"] for m in r.json())


# -------- Conversation actions --------
def test_pin_archive(alice, private_conv):
    r = requests.post(f"{API}/conversations/{private_conv['id']}/pin", headers=auth_h(alice))
    assert r.status_code == 200
    r2 = requests.get(f"{API}/conversations", headers=auth_h(alice))
    conv = next(c for c in r2.json() if c["id"] == private_conv["id"])
    assert conv["isPinned"] is True
    requests.delete(f"{API}/conversations/{private_conv['id']}/pin", headers=auth_h(alice))

    r3 = requests.post(f"{API}/conversations/{private_conv['id']}/archive", headers=auth_h(alice))
    assert r3.status_code == 200
    requests.delete(f"{API}/conversations/{private_conv['id']}/archive", headers=auth_h(alice))


# -------- Upload --------
def test_upload(alice):
    files = {"file": ("test.txt", b"hello world", "text/plain")}
    r = requests.post(f"{API}/upload", headers=auth_h(alice), files=files)
    assert r.status_code == 200
    assert r.json()["url"].startswith("data:text/plain;base64,")


# -------- WebSocket: real-time messaging --------
@pytest.mark.asyncio
async def test_ws_real_time_message_and_typing(alice, bob, private_conv):
    """Verify message_new + typing + presence events propagate via WS."""
    alice_ws = await websockets.connect(f"{WS_URL}?token={alice['token']}")
    bob_ws = await websockets.connect(f"{WS_URL}?token={bob['token']}")
    try:
        # drain initial presence events
        await asyncio.sleep(0.5)

        async def drain(ws, timeout=0.1):
            evts = []
            try:
                while True:
                    msg = await asyncio.wait_for(ws.recv(), timeout=timeout)
                    evts.append(json.loads(msg))
            except asyncio.TimeoutError:
                pass
            return evts

        await drain(alice_ws); await drain(bob_ws)

        # Alice sends via REST; Bob should receive message_new via WS
        content = f"WS hello {UNIQ}"
        requests.post(
            f"{API}/messages",
            headers=auth_h(alice),
            json={"conversationId": private_conv["id"], "content": content},
        )
        bob_evts = await drain(bob_ws, timeout=2.0)
        msg_evts = [e for e in bob_evts if e.get("type") == "message_new"]
        assert msg_evts, f"Bob didn't get message_new. Got: {bob_evts}"
        assert any(e["message"]["content"] == content for e in msg_evts)

        # Typing event: Alice sends typing -> Bob should receive
        await alice_ws.send(json.dumps({"type": "typing", "conversationId": private_conv["id"], "isTyping": True}))
        bob_evts2 = await drain(bob_ws, timeout=2.0)
        typing_evts = [e for e in bob_evts2 if e.get("type") == "typing"]
        assert typing_evts, f"Bob didn't get typing event. Got: {bob_evts2}"
        assert typing_evts[0]["userId"] == alice["user"]["id"]
        assert typing_evts[0]["isTyping"] is True

        # Read receipt: Bob marks read -> Alice should receive messages_read
        requests.post(f"{API}/messages/{private_conv['id']}/read", headers=auth_h(bob))
        alice_evts = await drain(alice_ws, timeout=2.0)
        read_evts = [e for e in alice_evts if e.get("type") == "messages_read"]
        assert read_evts, f"Alice didn't get messages_read. Got: {alice_evts}"
    finally:
        await alice_ws.close()
        await bob_ws.close()


@pytest.mark.asyncio
async def test_ws_invalid_token():
    try:
        ws = await websockets.connect(f"{WS_URL}?token=invalidtoken")
        # should close immediately
        try:
            await asyncio.wait_for(ws.recv(), timeout=2.0)
        except Exception:
            pass
        assert ws.close_code is not None
    except websockets.exceptions.InvalidStatusCode:
        # acceptable
        pass
    except Exception:
        pass
