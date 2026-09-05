# URLForge — Short links. Smart analytics. Total control.

URLForge is a modern developer-SaaS platform for URL shortening, custom branded aliases, high-resolution vector QR codes, and privacy-first analytics telemetry with real-time bot detection.

Built with **FastAPI**, **SQLAlchemy 2.0**, **PostgreSQL / SQLite**, **Alembic**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Recharts**.

---

## Architecture Overview

```
                      ┌────────────────────────────┐
                      │    URLForge Web App        │
                      │  (React + TS + Tailwind)   │
                      └─────────────┬──────────────┘
                                    │ REST API (JSON)
                                    ▼
                      ┌────────────────────────────┐
                      │    FastAPI Backend Engine  │
                      │  Layered Service Arch.     │
                      └──────┬──────────────┬──────┘
                             │              │ Background Click Tracking
                 ┌───────────┴───┐          ▼
                 ▼               ▼    ┌───────────────────────────┐
           ┌───────────┐  ┌──────────┐│ Bot Detector & IP Hasher  │
           │ JWT Auth  │  │ QR (SVG) ││ Geo & User-Agent Parser   │
           │ Rate Limit│  │ Base62   │└─────────────┬─────────────┘
           └───────────┘  └──────────┘              │
                 │               │                  │
                 └───────────────┼──────────────────┘
                                 ▼
                      ┌────────────────────────────┐
                      │ PostgreSQL / SQLite Engine │
                      │ Users, URLs, Clicks, Keys  │
                      └────────────────────────────┘
```

---

## Key Features

- **Public & Authenticated Shortening**: Instant collision-resistant Base62 short links without mandatory signup.
- **Collision-Resistant Short Codes**: 6-8 char Base62 codes (`a-zA-Z0-9`) providing over 3.5 trillion permutations with database retry logic.
- **Custom Branded Aliases**: User-defined vanity paths with system-reserved namespace protection (`admin`, `api`, `dashboard`, `settings`, etc.).
- **High-Performance 302 Redirect Engine**: Blazing-fast database lookups with asynchronous background telemetry collection.
- **Privacy-First Analytics**:
  - SHA-256 salted IP anonymization (no permanent raw IP storage).
  - Automated Crawler & Bot detection.
  - Interactive timeseries click graphs (Today, 7D, 30D, 90D, All Time).
  - Device distribution (Desktop, Mobile, Tablet, Bot).
  - Browser & Operating System classification.
  - Inbound traffic referrer analysis.
  - Geographic breakdown from proxy headers.
  - One-click **CSV** and **JSON** analytics export.
- **Vector QR Code Generation**: Download high-resolution SVG and PNG codes with customizable error correction levels (`L`, `M`, `Q`, `H`).
- **Developer REST API**: Scoped API keys (`uf_live_...`) with SHA-256 storage, interactive OpenAPI documentation, and cURL snippets.
- **Security & Safety**:
  - Sliding-window in-memory rate limiting with `Retry-After` headers.
  - SSRF protection against RFC-1918 private subnets and loopback addresses.
  - Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`.
  - Bcrypt password hashing and JWT access + refresh token rotation.
- **Community Abuse Reporting**: Public `/report` submission with administrative resolution triage.
- **Dark Mode & Responsive UI**: Seamless Light, Dark, and System theme synchronization.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Bcrypt, PyJWT, QRCode |
| **Database** | PostgreSQL (Docker/Production) / SQLite with aiosqlite (Local zero-dependency standalone) |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts, Lucide Icons |
| **Containers** | Docker, Docker Compose, Multi-stage builds, Nginx |

---

## Local Development Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker and Docker Compose

### 2. Clone & Environment Configuration
```bash
git clone https://github.com/your-org/urlforge.git
cd urlforge

# Copy environment defaults
cp .env.example .env
```

### 3. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed realistic development data (Admin, Demo user, Sample URLs, and 250+ click events)
python -m app.utils.seed

# Start backend server
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000`  
Interactive OpenAPI documentation at `http://localhost:8000/api/docs`

#### Demo Credentials
- **Admin User**: `admin@urlforge.app` / `AdminSecurePass123!`
- **Developer User**: `alex@urlforge.app` / `DemoPassword123!`

### 4. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend web application will be live at `http://localhost:5173`

---

## Docker Deployment

To launch the full production stack (PostgreSQL + Redis + FastAPI Backend + Nginx Frontend SPA):

```bash
docker compose up --build -d
```

Services will be accessible at:
- **Frontend SPA**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

## Running Automated Tests

### Backend Test Suite
The backend includes 100% automated pytest coverage across authentication, custom aliases, link lifecycle, expiration handling, redirects, click telemetry, API keys, and rate limiters:

```bash
cd backend
.\.venv\Scripts\pytest.exe -v
```

### Frontend Build Verification
```bash
cd frontend
npm run build
```

---

## REST API Summary

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | System & DB healthcheck | Public |
| `POST` | `/api/v1/auth/register` | Register new creator account | Rate-limited |
| `POST` | `/api/v1/auth/login` | Login and receive JWT access + refresh token | Rate-limited |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token | Public |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh session | Authenticated |
| `POST` | `/api/v1/urls` | Shorten a long URL (Public or Auth) | Rate-limited |
| `GET` | `/api/v1/urls` | List user links with search, filters, and pagination | Bearer / API Key |
| `GET` | `/api/v1/urls/{id}` | Retrieve link details | Bearer / API Key |
| `PATCH` | `/api/v1/urls/{id}` | Update title, destination, status, or expiration | Bearer / API Key |
| `DELETE` | `/api/v1/urls/{id}` | Permanently delete link and cascade clicks | Bearer / API Key |
| `GET` | `/api/v1/urls/{id}/qr` | Generate QR code (SVG or PNG) | Public |
| `GET` | `/api/v1/urls/{id}/analytics`| Aggregated timeseries, device, and referrer telemetry | Bearer / API Key |
| `GET` | `/api/v1/urls/{id}/export` | Export click logs as CSV or JSON | Bearer / API Key |
| `POST` | `/api/v1/api-keys` | Generate new developer secret (`uf_live_...`) | Bearer |
| `GET` | `/api/v1/api-keys` | List active & revoked API keys | Bearer |
| `DELETE` | `/api/v1/api-keys/{id}` | Revoke an API key | Bearer |
| `POST` | `/api/v1/reports` | Submit abuse report for malicious links | Public |
| `GET` | `/{short_code}` | Perform 302 redirect with background click logging | Public |

---

## License
MIT License. Built for high performance and total control.
