# SecureChat

A secure real-time chat app combining WhatsApp and Snapchat features.

## Features

| Feature | Inspired by |
|---------|------------|
| End-to-end encryption (RSA-OAEP + AES-GCM) | Signal / WhatsApp |
| Disappearing messages (5s → 24h timers) | Snapchat |
| Read receipts (✓ sent · ✓✓ delivered · ✓✓ read) | WhatsApp |
| Online / Last seen status | WhatsApp |
| Real-time typing indicators | WhatsApp |
| User search | Both |

## Tech Stack

- **Backend** — Node.js · Express · Socket.io · MongoDB (Mongoose) · JWT
- **Frontend** — React (Vite) · Tailwind CSS · Web Crypto API · Socket.io-client

## Prerequisites

- Node.js 18+
- MongoDB running locally on port 27017 (or set `MONGODB_URI` in `backend/.env`)

## Setup

### Backend

```bash
cd backend
cp .env.example .env   # edit JWT_SECRET before going to production
npm install
npm run dev            # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # runs on http://localhost:5173
```

Open http://localhost:5173 in two different browsers (or incognito windows) to test two users chatting.

## How E2EE works

1. On **register / first login**, the browser generates an RSA-OAEP 2048-bit key pair using the Web Crypto API.
2. The **public key** is stored on the server. The **private key** stays in `localStorage` — it never leaves the device.
3. When sending a message, it is encrypted with a fresh AES-GCM-256 key. That AES key is then RSA-encrypted twice: once for the recipient's public key, once for the sender's own public key (so the sender can read their own sent messages).
4. The server stores only ciphertext. Even if the database is compromised, messages cannot be read.

> **Note:** Private keys are stored in `localStorage`. Clearing browser data or logging in on a new device means old messages will show `[Encrypted]` — this is intentional for security.
