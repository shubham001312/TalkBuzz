# 🚀 TalkBuzz — Master Project Plan
**Created by Buzz** | Founder & CEO: Shubham Mallick (shubham.mallick1440@gmail.com)
**App Type:** Web-Based Real-Time Chat & Messaging Application
**Architecture:** Lightweight, Encrypted, WhatsApp/Telegram-style Messenger

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Technology Stack](#-technology-stack)
3. [Architecture Overview](#-architecture-overview)
4. [Phase-by-Phase Development Plan](#-phase-by-phase-development-plan)
5. [Feature List (All Modules)](#-feature-list)
6. [Security & Encryption Plan](#-security--encryption-plan)
7. [Admin System Design](#-admin-system-design)
8. [Database Schema](#-database-schema)
9. [File Structure](#-file-structure)
10. [Performance & Caching Strategy](#-performance--caching-strategy)
11. [Push Notification System](#-push-notification-system)
12. [Deployment & Launch Guide Reference](#-deployment--launch-guide-reference)
13. [Open Source / GitHub Safety Checklist](#-open-source--github-safety-checklist)
14. [Things You Mentioned + What Was Added](#-things-you-mentioned--what-was-added)

---

## 1. Project Overview

**TalkBuzz** is a lightweight, end-to-end encrypted, web-based messaging application inspired by WhatsApp and Telegram. It supports real-time chat, media sharing (files saved to user's local storage, not server), group messaging, admin dashboard, and push notifications — all built to run on minimal network bandwidth (functional at 50 KB/s).

- **App Name:** TalkBuzz
- **Company/Creator:** Buzz
- **Permanent Admin / Founder & CEO:** shubham.mallick1440@gmail.com
- **Deployment:** Web-based (PWA — Progressive Web App)
- **Design:** Dual-color (two-tone), minimal, clean UI
- **Languages Used:** HTML, CSS (frontend) · Python (backend/API) · C (encryption/core utilities) · Ruby (helper scripts/automation) · JavaScript (frontend logic, PWA, WebSockets)

---

## 2. Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| **Frontend** | HTML5 + CSS3 + Vanilla JS | Minimal, no heavy frameworks = small size |
| **PWA** | Service Workers + Web App Manifest | Offline support, installable, push notifications |
| **Backend API** | Python (Flask / FastAPI) | Lightweight, fast REST API |
| **Real-time Messaging** | WebSockets (Python `websockets` lib) | Low-latency, full-duplex chat |
| **Encryption Core** | C (libsodium bindings via Python CFFI) | Blazing fast E2E encryption |
| **Automation / Scripts** | Ruby | Build scripts, admin tools, deployment helpers |
| **Database** | SQLite (dev) / PostgreSQL (production) | Small footprint, reliable |
| **Cache Layer** | Redis (or in-memory dict in Python) | Fast session + message token cache |
| **Auth** | JWT tokens + bcrypt password hashing | Stateless, secure |
| **Push Notifications** | Web Push API + VAPID keys | Free, browser-native push notifications |
| **Media Handling** | File System Access API (browser-native) | Files go directly to user storage, no server storage |

---

## 3. Architecture Overview

```
[Browser / PWA]
      |
      |-- HTTPS --> [Python API Server (Flask/FastAPI)]
      |                     |
      |-- WSS -----> [WebSocket Server (Python)]
      |                     |
      |                 [Redis Cache]
      |                     |
      |               [PostgreSQL DB]
      |
      |-- Web Push --> [VAPID Push Service] --> [Browser Notification]
      |
      |-- File Save --> [User's LOCAL Device Storage] (no server upload for media)
```

### Message Flow (Token-Split Design for Low Bandwidth)
```
Message typed by User A
       |
       v
[Split into small tokens/chunks (max ~1KB each)]
       |
       v
[Encrypt each token with E2E key (libsodium/NaCl)]
       |
       v
[Send over WebSocket]
       |
       v
[Server relays — does NOT store content, only metadata]
       |
       v
[User B receives tokens → reassembles → decrypts → displays]
```

---

## 4. Phase-by-Phase Development Plan

---

### Phase 0 — Setup & Scaffolding
**Goal:** Project structure, tooling, repo setup, config files

- 0.1 — Create GitHub repository (`talkbuzz`)
- 0.2 — Set up `.env.example` file (NO real secrets committed)
- 0.3 — Create `.gitignore` (exclude `.env`, `*.key`, `__pycache__`, `node_modules`, DB files)
- 0.4 — Set up project folder structure
- 0.5 — Write `README.md` (project description, setup guide, license)
- 0.6 — Choose open-source license (MIT or Apache 2.0 recommended)
- 0.7 — Set up Python virtual environment (`venv`)
- 0.8 — Install core dependencies (`requirements.txt`)
- 0.9 — Compile C encryption utility (`gcc`, link libsodium)
- 0.10 — Write Ruby `setup.rb` helper script for first-time installation

---

### Phase 1 — Database & Models
**Goal:** Design and implement all database tables

- 1.1 — Design schema (see Section 8)
- 1.2 — Create `models.py` (SQLAlchemy ORM models)
- 1.3 — Write migration scripts (`alembic` for PostgreSQL)
- 1.4 — Seed the database with founder/admin account (`shubham.mallick1440@gmail.com`)
- 1.5 — Write C utility: `db_hash.c` — fast bcrypt-compatible hash check at system level
- 1.6 — Test DB connections and basic CRUD

---

### Phase 2 — Authentication System
**Goal:** Secure, real-time sign-up / sign-in with JWT

- 2.1 — Build `/auth/signup` endpoint (Python/Flask)
  - Accept: email, password, display name, phone (optional), profile photo (optional)
  - Validate email format, password strength
  - Hash password with **bcrypt** (Python `passlib`)
  - Store user in DB
  - Request notification + storage permission on first signup
  - Send welcome email (optional, using SMTP — credentials in `.env` only)
- 2.2 — Build `/auth/login` endpoint
  - Verify credentials
  - Issue JWT (access token 15min) + refresh token (7 days)
  - Tokens stored in httpOnly cookie (NOT localStorage — security)
- 2.3 — Build `/auth/logout` endpoint (invalidate refresh token)
- 2.4 — Build `/auth/refresh` endpoint (auto-renew access token)
- 2.5 — Implement Google OAuth2 sign-in (optional — via `authlib`)
- 2.6 — On new signup: collect user profile info
  - Display name
  - Username (unique @handle)
  - Profile picture upload
  - Status/bio (optional)
  - Notification permission prompt
  - Storage permission prompt (for media save)
- 2.7 — Implement **account recovery** (email OTP for password reset)
- 2.8 — Build frontend: Login page, Signup page (dual-color minimal UI)
- 2.9 — Test full auth flow

---

### Phase 3 — Core Chat Engine
**Goal:** Real-time WebSocket chat with E2E encryption and low-bandwidth token splitting

- 3.1 — Set up Python WebSocket server (`websockets` or `socket.io` via Flask-SocketIO)
- 3.2 — Implement **connection management**
  - User connects → authenticated via JWT
  - Map user_id → WebSocket connection
  - Handle disconnect / reconnect gracefully
- 3.3 — Implement **message tokenization** (C utility)
  - Write `tokenize.c` — splits message strings into ~512-byte chunks
  - Each chunk gets sequence number and message ID
  - Compile to shared library, call from Python via `ctypes`
- 3.4 — Implement **E2E Encryption** (C utility + Python bridge)
  - Write `encrypt.c` using libsodium's `crypto_box` (Curve25519 + XSalsa20 + Poly1305)
  - Each user has a keypair (public key stored on server, private key NEVER leaves browser)
  - Messages encrypted in-browser using Web Crypto API (subtle crypto)
  - Server only relays ciphertext — cannot read messages
- 3.5 — Implement **1-on-1 chat**
  - Message send/receive
  - Delivery status (sent ✓, delivered ✓✓, read ✓✓ blue)
  - Message history stored encrypted in DB
  - Typing indicator
  - Online/Last seen status
- 3.6 — Implement **message features**
  - Reply to message (quote)
  - Delete message (for me / for everyone)
  - Star/bookmark messages
  - Copy text
  - Emoji reactions
  - Forward message
- 3.7 — Implement **message search** (per-chat search)
- 3.8 — Build chat UI (WhatsApp-style bubbles, dual-color theme)

---

### Phase 4 — Media Sharing (User Storage, Not Server)
**Goal:** Share photos/videos that save directly to user's device

- 4.1 — Use **File System Access API** (browser-native) to let users pick save directory
- 4.2 — On receiving media:
  - Media is sent as binary blob over WebSocket (chunked)
  - Browser receives all chunks
  - Browser prompts user (or auto-saves to pre-selected folder) using File System API
  - File is saved directly on user's device
  - No copy retained on server (server only relays binary stream)
- 4.3 — On sending media:
  - User selects file
  - File is read in-browser using FileReader API
  - Encrypted (AES-GCM via Web Crypto API)
  - Chunked and streamed over WebSocket to recipient
- 4.4 — Support file types: Images (JPG, PNG, GIF, WebP), Videos (MP4, WebM), Audio (MP3, OGG), Documents (PDF, TXT)
- 4.5 — Show media thumbnail preview in chat (generated client-side, not server-side)
- 4.6 — Implement progress bar for file transfer
- 4.7 — Handle transfer failure / retry logic
- 4.8 — On server: only store metadata (file name, type, size, timestamp, sender, receiver) — NOT the file itself

---

### Phase 5 — Groups (WhatsApp-Style)
**Goal:** Group chats with admin controls, just like WhatsApp groups

- 5.1 — Group creation UI (name, icon, add members)
- 5.2 — Group DB model (group_id, name, icon, creator, members, admins, created_at)
- 5.3 — Group messaging via WebSocket (broadcast to all members)
- 5.4 — Group admin features:
  - Add/remove members
  - Promote/demote admins
  - Change group name/icon
  - Delete group
  - Mute/unmute members
  - Invite link generation
- 5.5 — Member features:
  - Leave group
  - View group info
  - View member list
  - Group media gallery
- 5.6 — Group notifications (mention with @name)
- 5.7 — Group chat search

---

### Phase 6 — Settings Page
**Goal:** Full user settings (WhatsApp-style)

- 6.1 — Profile settings (name, photo, username, bio, phone)
- 6.2 — Privacy settings:
  - Last seen (Everyone / Contacts / Nobody)
  - Profile photo visibility
  - Status visibility
  - Read receipts on/off
  - Online status on/off
- 6.3 — Notification settings (sound, vibrate, pop-up, per-chat settings)
- 6.4 — Chat settings (wallpaper, font size, chat backup)
- 6.5 — Storage settings (show cached data size, clear cache)
- 6.6 — Security settings (change password, active sessions, 2FA — TOTP)
- 6.7 — About page: "Created by Buzz" | Version | Open Source Link
- 6.8 — Account deletion option
- 6.9 — Theme: light/dark/system toggle (within the dual-color palette)

---

### Phase 7 — Home / Search
**Goal:** App home screen with global search and contact management

- 7.1 — Home screen: chat list (sorted by last message time)
- 7.2 — Global search bar (search users, groups, messages)
- 7.3 — Contact discovery (search by username or phone)
- 7.4 — New chat button (starts conversation with any user)
- 7.5 — Stories/Status feature (24-hr disappearing updates, like WhatsApp Status)
- 7.6 — Pin conversations to top
- 7.7 — Archive chats
- 7.8 — Mark as unread
- 7.9 — Mute conversation
- 7.10 — Notification badges (unread count per chat)

---

### Phase 8 — Admin Dashboard
**Goal:** Full super-admin panel for the Founder & CEO account

- 8.1 — Admin route guard (only `shubham.mallick1440@gmail.com` has permanent admin role)
- 8.2 — Admin Dashboard overview:
  - Total users
  - Active users (today / week / month)
  - Messages sent today
  - Groups total
  - New signups
- 8.3 — User Management:
  - View all users
  - Search users
  - Edit user profile
  - Suspend / ban / delete users
  - Promote users to admin
  - View user activity
- 8.5 — Content Moderation (flag review — if needed)
- 8.6 — System Settings:
  - Toggle features on/off (e.g. group creation, media sharing)
  - Set max file size
  - Maintenance mode
- 8.7 — **Push Notification Control** (admin can send broadcast push notifications to all users or specific users, even when app is closed)
  - Write notification title + body
  - Target: All Users / Specific User / Group
  - Schedule notification (now or later)
- 8.8 — Analytics Charts (signups per day, messages per day)
- 8.9 — Export data (CSV of users, messages metadata)
- 8.10 — Admin action audit log (what admin did, when)

---

### Phase 9 — Push Notifications (Mobile + Desktop)
**Goal:** Web Push notifications that work even when app is closed

- 9.1 — Generate VAPID key pair (`py-vapid` library)
  - Store in `.env` file (NEVER in code/GitHub)
- 9.2 — On signup: request browser notification permission
- 9.3 — Register Service Worker in browser
- 9.4 — Subscribe user to push service, store subscription endpoint in DB
- 9.5 — On new message: Python backend sends push via `pywebpush`
- 9.6 — Service Worker handles push event → shows notification (title, body, icon, click URL)
- 9.7 — Admin broadcast push: same flow but sends to all subscribed users
- 9.8 — Notification click → opens TalkBuzz to the specific chat
- 9.9 — Handle notification on Android / iOS PWA (iOS 16.4+ supports PWA push)
- 9.10 — Notification grouping (bundle multiple message notifications)

---

### Phase 10 — Caching & Performance
**Goal:** Fast load times even on slow networks

- 10.1 — Service Worker caches app shell (HTML, CSS, JS, icons) — loads instantly after first visit
- 10.2 — Redis cache on backend:
  - Active WebSocket session mapping
  - Recent messages (last 50 per chat) in memory
  - User online status
  - JWT refresh token store
- 10.3 — Client-side cache (IndexedDB in browser):
  - Chat history (last 200 messages per chat)
  - Contact list
  - User settings
  - Profile photos (small thumbnails)
- 10.4 — Lazy loading for older messages (infinite scroll up)
- 10.5 — Compress all assets (gzip/brotli)
- 10.6 — Minify HTML/CSS/JS at build time (Ruby `Rake` task)
- 10.7 — Use WebP images for all icons/UI elements
- 10.8 — Target app install size: < 500KB for PWA shell

---

### Phase 11 — PWA & Install
**Goal:** Make TalkBuzz installable as an app on Android, iOS, Desktop

- 11.1 — Write `manifest.json` (app name, icons, theme color, display mode)
- 11.2 — Register Service Worker (`sw.js`)
- 11.3 — Offline fallback page
- 11.4 — Add to Home Screen prompt (Android Chrome auto, iOS manual)
- 11.5 — App icons: 48, 72, 96, 144, 192, 512px (PNG + WebP)
- 11.6 — Splash screen configuration
- 11.7 — Test install on Android + iOS + Chrome Desktop

---

### Phase 12 — Additional WhatsApp-like Features
**Goal:** Complete the feature parity with WhatsApp/Telegram

- 12.1 — Voice messages (record in-browser, send as audio blob — saves to user storage)
- 12.2 — Message reactions (emoji)
- 12.3 — Disappearing messages (set timer: 24h / 7d / 90d)
- 12.4 — Contact sharing (share user profiles)
- 12.5 — Location sharing (share Google Maps link or coordinates)
- 12.6 — Link preview (backend fetches og:title + og:image — no user data leaked)
- 12.7 — QR code for profile (scan to start chat)
- 12.8 — Broadcast lists (admin/premium — send one message to many without a group)
- 12.9 — Message formatting (bold, italic, strikethrough, monospace via markdown shortcuts)
- 12.10 — Block / Unblock users
- 12.11 — Mute / Unmute notifications per chat
- 12.12 — Starred messages view (saved messages)
- 12.13 — Two-step verification (TOTP via Google Authenticator)
- 12.14 — Multiple device login tracking (view active sessions, revoke)

---

### Phase 13 — Testing & Security Audit
**Goal:** Ensure app is secure before open-sourcing

- 13.1 — Test all auth flows (signup, login, logout, token refresh)
- 13.2 — Test E2E encryption (no plaintext on server)
- 13.3 — Test push notifications on Android + iOS + Desktop
- 13.4 — Test low-bandwidth scenario (throttle to 50 KB/s in DevTools)
- 13.5 — Test media file save to user device
- 13.6 — Test admin dashboard all controls
- 13.7 — Security scan: no hardcoded secrets, no API keys in code
- 13.8 — OWASP Top 10 check (SQL injection, XSS, CSRF, etc.)
- 13.9 — Rate limiting on API endpoints (prevent brute force)
- 13.10 — SSL/TLS enforcement (HTTPS only)

---

### Phase 14 — Deployment & Launch
**Goal:** Production deployment (see `LAUNCH_GUIDE.md`)

- 14.1 — Choose hosting: Railway / Render / Fly.io (free tier friendly)
- 14.2 — Set all environment variables in hosting dashboard (NOT in code)
- 14.3 — Configure PostgreSQL in production
- 14.4 — Configure Redis in production
- 14.5 — Set up custom domain (optional)
- 14.6 — Enable HTTPS (Let's Encrypt or hosting provider SSL)
- 14.7 — Run database migrations
- 14.8 — Seed founder/admin account
- 14.9 — Test production build
- 14.10 — Make GitHub repo public

---

## 5. Feature List

- Fully secure JWT email/password authentication & Google OAuth2.
- 1-on-1 and Group Chat with read receipts, typing state, emoji reactions, stars, delete, replies.
- Media sharing that saves directly on user devices (File System Access API).
- Global contact search, Stories/Status like WhatsApp.
- Powerful Admin Dashboard (Super Admin: Shubham) with global message activity analytics, user suspensions, toggle controls, and broadcast background push notifications.
- Complete PWA implementation with high-speed asset compression, offline support, and low bandwidth compatibility.

---

## 6. Security & Encryption Plan

### Message Encryption
- **Algorithm:** Curve25519 key exchange + XSalsa20-Poly1305.
- **Keys:** Generated client-side using browser APIs. Private key never leaves the client's device.
- **Token Split:** Message payloads split into 512-byte fragments to stream over bad networks.

---

## 7. Admin System Design

### Founder & CEO Info
- **Founder Email:** `shubham.mallick1440@gmail.com`
- **Privilege Role:** `super_admin` (Permanent, non-demotable).
- **Controls:** Broad analytics charts, user suspension/deletion, and rich broadcast Web Push configurations.

---

## 8. Database Schema

- `users`: ID, email, username, displays, password hashes, E2E public keys, active roles.
- `messages`: ID, conversation, sender, ciphertext payload, metadata.
- `conversations`: ID, participants.
- `groups` & `group_members`: ID, details, specific member role definitions.
- `push_subscriptions`: user links to web-push browser clients.
- `audit_log`: tracks all system updates and admin suspensions.

---

*Document version: 1.0 | Created: 2026 | TalkBuzz by Buzz*
