# 🚀 TalkBuzz — Launch Guide
**Created by Buzz** | How to set up, run, and deploy TalkBuzz

---

## 📋 Prerequisites

Before you start, make sure you have:

| Tool | Version | Install |
|---|---|---|
| Python | 3.11+ | https://python.org |
| Ruby | 3.2+ | https://ruby-lang.org |
| GCC | Any recent | `sudo apt install gcc` / Xcode tools |
| libsodium | Latest | See below |
| PostgreSQL | 15+ | https://postgresql.org |
| Redis | 7+ | https://redis.io |
| Git | Any | https://git-scm.com |

### Install libsodium
```bash
# Ubuntu/Debian
sudo apt-get install libsodium-dev

# macOS
brew install libsodium

# Windows (use WSL2 or download from https://libsodium.org)
```

---

## ⚡ Quick Start (Development)

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/talkbuzz.git
cd talkbuzz
```

### Step 2: Set Up Environment Variables
```bash
cp .env.example .env
```
Open `.env` and fill in **your own real values**:
- Generate a `SECRET_KEY`: `python3 -c "import secrets; print(secrets.token_hex(32))"`
- Set your `DATABASE_URL` (PostgreSQL connection string)
- Set `REDIS_URL` (Redis connection string)
- Set `FOUNDER_EMAIL` to your email (this will be the super-admin)
- Generate VAPID keys (see Step 4)

> ⚠️ NEVER share or commit your `.env` file. It is in `.gitignore` for safety.

### Step 3: Run the Setup Script
```bash
ruby setup.rb
```
This will:
- Create a Python virtual environment
- Install all Python dependencies
- Compile the C encryption utilities
- Run initial database migrations
- Seed the founder/admin account

### Step 4: Generate VAPID Keys (for Push Notifications)
```bash
source venv/bin/activate
python3 -c "from py_vapid import Vapid; v = Vapid(); v.generate_keys(); print('Public:', v.public_key); print('Private:', v.private_key)"
```
Copy the output into your `.env`:
```
VAPID_PUBLIC_KEY=<the public key output>
VAPID_PRIVATE_KEY=<the private key output>
```

### Step 5: Start PostgreSQL and Redis
```bash
# PostgreSQL (Ubuntu)
sudo service postgresql start

# Redis (Ubuntu)
sudo service redis-server start

# macOS
brew services start postgresql
brew services start redis
```

### Step 6: Run the Application
```bash
source venv/bin/activate
python backend/app.py
```

### Step 7: Open in Browser
```
http://localhost:5000
```

Sign up with the email you set in `FOUNDER_EMAIL` — that account automatically has full admin access.

---

## 🏭 Production Deployment

### Option A: Railway (Recommended — Free Tier Available)

1. Create account at https://railway.app
2. Create new project → Deploy from GitHub repo
3. Add PostgreSQL plugin (Railway provides one)
4. Add Redis plugin (Railway provides one)
5. Go to **Variables** tab and add all your `.env` values
6. Railway automatically deploys on every `git push`
7. Get your public URL from the Railway dashboard

### Option B: Render (Free Tier Available)

1. Create account at https://render.com
2. New → Web Service → Connect GitHub repo
3. Build command: `ruby setup.rb`
4. Start command: `python backend/app.py`
5. Add all environment variables in the Render dashboard
6. Create a free PostgreSQL database on Render
7. Create a free Redis instance on Render

---

## 🔧 Environment Variables Reference

Copy this to your `.env` file and replace all placeholder values:

```bash
# Server Settings
SECRET_KEY=REPLACE_WITH_64_CHAR_RANDOM_STRING
DEBUG=False
PORT=5000
ALLOWED_ORIGINS=https://yourdomain.com

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/talkbuzz

# Cache (Redis)
REDIS_URL=redis://localhost:6379/0

# Admin / Founder Account
# This email will be automatically given super-admin privileges
FOUNDER_EMAIL=shubham.mallick1440@gmail.com

# Push Notifications (VAPID)
VAPID_PUBLIC_KEY=REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=REPLACE_WITH_YOUR_VAPID_PRIVATE_KEY
VAPID_CLAIMS_EMAIL=shubham.mallick1440@gmail.com
```

---

*TalkBuzz Launch Guide v1.0 | Created by Buzz*
