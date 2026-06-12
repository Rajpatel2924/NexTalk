<div align="center">

# 🚀 NexTalk

### Real-Time Messaging Platform

Connect. Communicate. Instantly.

<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" />
<img src="https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js" />
<img src="https://img.shields.io/badge/PostgreSQL-Prisma-blue?style=for-the-badge&logo=postgresql" />
<img src="https://img.shields.io/badge/Socket.IO-RealTime-black?style=for-the-badge&logo=socket.io" />
<img src="https://img.shields.io/badge/Auth-JWT%20%7C%20Google%20OAuth-orange?style=for-the-badge" />

---

### ⚡ A Production-Ready Real-Time Chat Platform

NexTalk is a modern full-stack messaging application inspired by WhatsApp, Telegram, and Discord. Built with scalable architecture and real-time communication technologies, it delivers seamless messaging, typing indicators, read receipts, online presence tracking, media sharing, and group conversations.

</div>

---

## ✨ Features

### 💬 Real-Time Messaging

- Instant one-to-one messaging
- Real-time message synchronization
- Infinite chat history
- Message search
- Edit messages
- Delete messages
- Reply to messages
- Forward messages
- Emoji support
- Message reactions

### ⌨️ Typing Indicators

- Real-time typing detection
- Typing status updates
- Automatic timeout handling
- Multi-user typing support

### ✅ Read Receipts

- Sent status
- Delivered status
- Read status
- Real-time updates
- Read timestamps

### 🟢 Online Presence

- Online/Offline status
- Last seen tracking
- Active now indicators
- Presence synchronization
- Automatic disconnect handling

### 👥 Group Chats

- Create groups
- Group avatars
- Admin management
- Member management
- Group chat history

### 📁 Media Sharing

- Image uploads
- Video uploads
- Document sharing
- Drag & drop uploads
- Media previews
- Download support

### 🔔 Notifications

- In-app notifications
- Browser notifications
- Mention alerts
- New message alerts

### 🎨 Modern User Experience

- Dark Mode
- Light Mode
- Mobile Responsive
- Tablet Optimized
- Desktop Friendly
- Modern UI Components

---

## 🏗️ System Architecture

```text
┌─────────────────────┐
│     Frontend        │
│ Next.js + Tailwind  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      API Layer      │
│ Express + Prisma    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     PostgreSQL      │
│     Database        │
└─────────────────────┘

           ▲
           │
┌─────────────────────┐
│     Socket.IO       │
│ Real-Time Engine    │
└─────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|----------|
| Next.js 15 | React Framework |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| ShadCN UI | UI Components |
| Zustand | State Management |
| React Hook Form | Form Handling |

### Backend

| Technology | Purpose |
|------------|----------|
| Node.js | Runtime |
| Express.js | API Framework |
| Prisma | ORM |
| PostgreSQL | Database |
| Socket.IO | Real-Time Communication |
| JWT | Authentication |

### Cloud & DevOps

| Technology | Purpose |
|------------|----------|
| Cloudinary | File Storage |
| Docker | Containerization |
| Vercel | Frontend Hosting |
| Railway | Backend Hosting |

---

## 📂 Project Structure

```bash
NexTalk/
│
├── client/
│   ├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── store/
│   └── utils/
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── sockets/
│   │   └── validators/
│   │
│   └── prisma/
│
├── docs/
├── docker/
├── README.md
└── docker-compose.yml
```

---

## ⚙️ Environment Variables

### Backend

```env
PORT=5000

DATABASE_URL=

JWT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CLIENT_URL=http://localhost:3000
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:5000

NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/NexTalk.git

cd NexTalk
```

### Install Dependencies

#### Frontend

```bash
cd client

npm install
```

#### Backend

```bash
cd server

npm install
```

---

## 🗄️ Database Setup

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Migrations

```bash
npx prisma migrate dev
```

### Seed Database

```bash
npx prisma db seed
```

---

## ▶️ Running the Application

### Start Backend

```bash
cd server

npm run dev
```

### Start Frontend

```bash
cd client

npm run dev
```

Application URLs:

```bash
Frontend: http://localhost:3000

Backend: http://localhost:5000
```

---

## 🔌 Socket Events

### User Presence

```javascript
user_online
user_offline
```

### Messaging

```javascript
send_message
receive_message
```

### Typing Status

```javascript
typing_start
typing_stop
```

### Read Receipts

```javascript
message_delivered
message_read
```

### Chat Rooms

```javascript
join_chat
leave_chat
```

---

## 🔒 Security Features

- JWT Authentication
- Google OAuth
- Password Hashing (bcrypt)
- Input Validation
- XSS Protection
- CORS Configuration
- Secure File Uploads
- API Rate Limiting
- Environment Variable Protection

---

## 📈 Scalability Features

- Socket.IO Architecture
- Message Pagination
- Database Indexing
- Lazy Loading
- Optimized Queries
- Redis Ready
- Horizontal Scaling Ready

---

## 🧪 Testing

Run all tests:

```bash
npm test
```

Run backend tests:

```bash
npm run test:server
```

Run frontend tests:

```bash
npm run test:client
```

---

## 📸 Screenshots

### Authentication

_Add Login Screenshot Here_

### Chat Interface

_Add Chat Screenshot Here_

### Group Messaging

_Add Group Chat Screenshot Here_

### Dark Mode

_Add Dark Mode Screenshot Here_

---

## 🚀 Future Enhancements

- Voice Calling
- Video Calling
- Screen Sharing
- AI Smart Replies
- Message Translation
- End-to-End Encryption
- Scheduled Messages
- Message Pinning
- Community Channels

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch

```bash
git checkout -b feature/amazing-feature
```

3. Commit changes

```bash
git commit -m "Add amazing feature"
```

4. Push changes

```bash
git push origin feature/amazing-feature
```

5. Open a Pull Request

---

## 📊 Project Highlights

- Production-Ready Architecture
- Real-Time WebSocket Communication
- Modern Full-Stack Development
- Secure Authentication System
- Scalable Backend Design
- Professional UI/UX
- Industry Standard Folder Structure

---

## 👨‍💻 Author

**Raj Patel**

Software Engineer | Full Stack Developer

GitHub: https://github.com/Rajpatel2924

---

## ⭐ Support

If you found this project useful, please consider giving it a star.

⭐ Star the repository

🍴 Fork the repository

📢 Share with others

---

<div align="center">

### NexTalk

Real-Time Messaging Platform

Built with ❤️ using Next.js, Socket.IO, PostgreSQL, Prisma & TypeScript

</div>
