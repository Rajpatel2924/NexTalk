# NexTalk – Real-Time Messaging Platform – PRD

> Connect. Communicate. Instantly.

## 1. Original Problem Statement (verbatim, summary)
Build a production-ready full-stack real-time messaging platform inspired by WhatsApp, Telegram, and Discord, supporting 1:1 + group chat, typing indicators, read receipts, online presence, media sharing, notifications, modern auth, and dark mode. Originally requested Next.js + Express + PostgreSQL + Prisma + Socket.IO. Implemented on this environment using **React + FastAPI + MongoDB + native WebSockets** (functionally equivalent).

## 2. Architecture
- **Frontend**: React 19 (CRA + craco), Tailwind CSS, ShadCN UI, framer-motion, zustand state, axios, sonner toast.
- **Backend**: FastAPI + motor (MongoDB), JWT (PyJWT) + bcrypt password hashing, native FastAPI WebSocket at `/api/ws?token=…`.
- **Real-time**: Singleton `WSManager` in `ws_manager.py` broadcasts `message_new`, `message_updated`, `typing`, `presence`, `messages_read`, `conversation_created` events.
- **Storage**: MongoDB collections: `users`, `conversations`, `messages` (no Participants/MessageStatus tables — collapsed into `participantIds`, `deliveredTo`, `readBy` arrays on documents for simplicity and performance).
- **File upload**: `/api/upload` returns inline base64 data URL (5MB cap). Easy swap to object storage later.

## 3. User Personas
- **Individual user**: signs up, finds contacts, messages 1:1.
- **Group owner / admin**: creates groups, adds/removes members.
- **Group member**: chats, reacts, replies, edits/deletes their own messages.

## 4. Core Requirements (static)
- Auth: register / login / profile / password change.
- 1:1 + Group chat with real-time delivery.
- Typing indicators.
- Read receipts (sent/delivered/read ticks).
- Online presence + last seen.
- Media upload (image / video / file).
- Message edit / delete / reply / react.
- Chat search + message search.
- Pin / Archive / Delete chat.
- Profile + avatar upload.
- Dark mode.
- Responsive (mobile → desktop).

## 5. Implemented (✅ as of 2026-06-12)
- Marketing landing page (`/`) with hero, bento features grid, CTA.
- `/login` and `/register` pages (split-screen pastel theme).
- Authenticated chat app at `/app`:
  - 3-column responsive layout (sidebar + main + slide-in panels).
  - Chat sidebar with search, unread badges, pin/archive/delete menu, new chat + new group buttons, dark-mode toggle.
  - 1:1 + Group conversations.
  - Real-time messages via FastAPI WebSocket (auto-reconnect with 2.5s backoff + 25s ping).
  - Typing indicator with 3-bouncing-dots animation, auto-clear after 2.5s.
  - Read receipts: ✓ sent, ✓✓ delivered, ✓✓ (sky) read.
  - Online presence dot + “Active now” / “Last seen X ago”.
  - Message edit, delete (soft, with "deleted" placeholder), reply (with quoted preview), reactions (toggle).
  - Emoji picker (35 emojis grid).
  - Media upload: image, video, file (paperclip + drag input).
  - Message search inside conversation.
  - Group info panel (members list, admin crown, add/remove members, leave group, media gallery).
  - Profile panel: name, bio, avatar (upload), change password, sign out.
- Backend (24/24 pytest passing): full REST + WS coverage.

## 6. Deferred / Backlog
### P1 (high value, not blocking)
- [ ] Browser push notifications (Web Push API + service worker).
- [ ] Forgot password / email-based reset.
- [ ] Google OAuth (Emergent-managed) sign-in.
- [ ] Voice messages.
- [ ] Forward message (UI button exists, currently toasts "coming soon").
- [ ] Object-storage backend for uploads (replace base64 data URL).

### P2 (polish)
- [ ] Chat wallpapers picker.
- [ ] Scheduled messages.
- [ ] User block / report.
- [ ] Swagger / OpenAPI documentation page.
- [ ] Docker compose + GitHub Actions CI.
- [ ] Mention notifications + Notification Center route.
- [ ] Redis Socket.IO adapter equivalent (broadcast across multi-pod).

## 7. Known Minor Issues (non-blocking)
- React StrictMode double-mount logs a transient "WebSocket closed before connection established" warning — connection still succeeds.
- File uploads stored as inline base64 (intentional, per defaults chosen).

## 8. Next Action Items
1. Onboard real users; collect feedback on UX & missing flows.
2. Add forgot-password flow (P1).
3. Swap inline base64 upload for object storage when traffic grows.
4. Add Swagger docs.
