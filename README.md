<div align="center">

# 🪣 Token Bucket Rate Limiter

**A production-grade API rate limiting platform built on the Token Bucket algorithm**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequests.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)

<br/>

> Authenticate → Generate an API Key → Configure your bucket → Fire requests and watch the limiter work in real time.

<br/>

[Live Demo](#) · [Report Bug](https://github.com/your-username/token-bucket-rate-limiter/issues) · [Request Feature](https://github.com/your-username/token-bucket-rate-limiter/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Token Bucket Algorithm](#-token-bucket-algorithm)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Installation](#-installation)
- [Screenshots](#-screenshots)
- [Deployment](#-deployment)
- [Security](#-security)
- [Performance](#-performance)
- [Future Improvements](#-future-improvements)
- [Why This Project](#-why-this-project)
- [Resume Impact](#-resume-impact)

---

## 🔍 Overview

**Token Bucket Rate Limiter** is a full-stack platform that demonstrates how production APIs enforce rate limits. Users authenticate via Privy, generate scoped API keys, configure a custom Token Bucket (capacity + refill rate), then test their configuration through an interactive dashboard with live visualizations.

The backend stores bucket state in **Redis** (sub-millisecond reads and atomic updates) and persists API key configuration in **MongoDB Atlas**. Every request through a protected route is checked against that user's bucket — no tokens means a `429 Too Many Requests`.

This is not a toy. The same conceptual architecture powers rate limiting at Stripe, Cloudflare, and GitHub's APIs.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 (Vite) | Interactive SPA dashboard |
| **HTTP Client** | Axios | API communication with interceptors |
| **Styling** | CSS3 (custom) | Dark-mode SaaS UI |
| **Backend** | Node.js + Express.js | REST API server |
| **Auth** | Privy | Embedded wallet / social login |
| **Cache** | Redis | High-speed bucket state storage |
| **Database** | MongoDB Atlas | Persistent API key + config storage |
| **Frontend Deployment** | Vercel | Edge-deployed React app |
| **Backend Deployment** | Render | Always-on Express server |

---

## ✨ Features

<details>
<summary><strong>🔐 Authentication & Identity</strong></summary>

- Privy-powered authentication — supports email, social login, and embedded wallets
- JWT access tokens issued per session, verified server-side on every protected request
- Users are scoped — no cross-user key access

</details>

<details>
<summary><strong>🔑 API Key Management</strong></summary>

- Generate a unique API key linked to your authenticated identity
- Each key carries its own bucket configuration (capacity + refill interval)
- Keys are stored securely in MongoDB with user binding
- Copy key to clipboard with one click; mask / reveal toggle in the UI

</details>

<details>
<summary><strong>⚙️ Custom Rate Limit Configuration</strong></summary>

- **Bucket Capacity** — set the maximum number of tokens (e.g., 10 requests before limiting)
- **Token Interval** — set how frequently one token is added back (e.g., 1 token every 2 seconds)
- Configurations are stored per API key; multiple keys can have different rules

</details>

<details>
<summary><strong>📊 Live Dashboard</strong></summary>

- Animated token bucket visualization — block segments fill and drain with color transitions (green → amber → red)
- Real-time refill countdown timer (100 ms resolution)
- Statistics cards: Tokens Left, Capacity, Allowed Requests, Blocked Requests, Refill Interval
- Activity timeline — newest-first log of every key event
- Live status badge — polls backend health and shows ONLINE / OFFLINE

</details>

<details>
<summary><strong>🚀 Request Simulator</strong></summary>

- **Send 1 Request** — fires a single request and shows remaining tokens
- **Fire 10 Requests** — rapid-fire burst to demonstrate rate limiting in action
- Toast notifications for every outcome: ✅ Allowed · ❌ Rate Limit Exceeded

</details>

---

## 🧠 Token Bucket Algorithm

### The Problem: Why Rate Limiting?

Without rate limiting, a single client can exhaust your server's resources — whether through malicious abuse, a buggy SDK retry loop, or unexpected traffic spikes. APIs at scale need a mechanism that:

- Allows **burst traffic** up to a configured threshold
- **Automatically recovers** over time without manual resets
- Is **O(1)** in time complexity — checking a limit must not slow down the request

The **Token Bucket** algorithm solves all three.

---

### How It Works

```
┌─────────────────────────────────────────────┐
│              TOKEN BUCKET                   │
│                                             │
│   ┌───────────────────────────────────┐     │
│   │  🪙 🪙 🪙 🪙 🪙 🪙 🪙 🪙        │     │
│   │                                   │     │
│   │   Capacity:  10 tokens            │     │
│   │   Current:    8 tokens            │     │
│   └───────────────────────────────────┘     │
│                                             │
│   ⚡ Refill: +1 token every 2 seconds       │
│                                             │
└─────────────────────────────────────────────┘
```

**Four core concepts:**

| Concept | Description |
|---|---|
| **Capacity** | The maximum number of tokens the bucket can hold. Also the maximum burst size. |
| **Token Consumption** | Each API request consumes 1 token. If the bucket is empty, the request is rejected with HTTP 429. |
| **Automatic Refill** | Tokens are added back at a fixed rate (e.g., 1 per second). The bucket never exceeds capacity. |
| **Redis Storage** | Bucket state (current token count + last refill timestamp) is stored in Redis for sub-millisecond access and atomic updates. |

---

### Request Lifecycle

```
  Client Request
       │
       ▼
  ┌─────────────┐
  │ Auth Check  │  ← Verify JWT from Privy
  └──────┬──────┘
         │ ✅ Authenticated
         ▼
  ┌─────────────┐
  │  API Key    │  ← Extract x-api-key header, lookup in MongoDB
  │  Lookup     │
  └──────┬──────┘
         │ ✅ Valid key found
         ▼
  ┌─────────────────────────────────────┐
  │         Redis Bucket Check          │
  │                                     │
  │  1. GET bucket:{apiKey}             │
  │  2. Calculate tokens to refill      │
  │     based on elapsed time           │
  │  3. tokens >= 1?                    │
  │     YES → decrement → allow         │
  │     NO  → reject with 429           │
  └────────────────┬────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
   ✅ 200 OK            ❌ 429 Too Many
   { tokensLeft: 7 }     Requests
```

---

### Why Token Bucket over other algorithms?

| Algorithm | Burst Allowed | Memory | Complexity | Smoothness |
|---|---|---|---|---|
| **Token Bucket** ✅ | Yes | O(1) per user | O(1) | Good |
| Fixed Window | Yes (edge burst) | O(1) per user | O(1) | Poor |
| Sliding Window Log | No | O(n) requests | O(n) | Excellent |
| Leaky Bucket | No | O(1) per user | O(1) | Excellent |

Token Bucket strikes the right balance: it allows short bursts (useful for legitimate clients), refills automatically, and requires only two values in Redis per user.

---

## 🏗 Architecture

### System Diagram

```
┌──────────────────────────────────────────────────────┐
│                     CLIENT                           │
│                  React (Vite)                        │
│                                                      │
│  ┌────────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Config UI  │  │ Bucket   │  │ Request          │ │
│  │ API Key    │  │ Viz      │  │ Simulator        │ │
│  └─────┬──────┘  └────┬─────┘  └────────┬─────────┘ │
└────────┼──────────────┼─────────────────┼────────────┘
         │              │  Axios (HTTP)    │
         └──────────────▼─────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│                    BACKEND                           │
│              Express.js (Node.js)                    │
│                                                      │
│  ┌──────────────┐  ┌───────────────┐                 │
│  │ Auth         │  │ Rate Limiter  │                 │
│  │ Middleware   │  │ Middleware    │                 │
│  │ (Privy JWT)  │  │ (Token Bucket)│                 │
│  └──────┬───────┘  └───────┬───────┘                 │
│         └─────────┬────────┘                         │
│                   │                                  │
│  ┌────────────────┼────────────────────┐             │
│  │                │                   │             │
│  ▼                ▼                   ▼             │
│ /apikeys     /protected          /health            │
└──────┬──────────────┬─────────────────────────────────┘
       │              │
       ▼              ▼
┌─────────────┐  ┌───────────────────────────────────┐
│  MongoDB    │  │            Redis                  │
│  Atlas      │  │                                   │
│             │  │  bucket:{apiKey}                  │
│  apikeys    │  │  ├── tokens: 8                    │
│  collection │  │  └── lastRefill: 1719000000000    │
│             │  │                                   │
│  {          │  │  O(1) reads, atomic GETSET        │
│    userId,  │  │  TTL auto-expiry on idle keys     │
│    apiKey,  │  │                                   │
│    capacity,│  └───────────────────────────────────┘
│    interval │
│  }          │
└─────────────┘
```

### Data Flow: Login → Protected Request

```
1. User opens app
       │
       ▼
2. Privy login (email / social)
       │
       ▼
3. Privy issues JWT access token
       │
       ▼
4. POST /apikeys
   Headers: Authorization: Bearer <jwt>
   Body:    { capacity: 10, tokenInterval: 2 }
       │
       ▼
5. Server verifies JWT with Privy SDK
   Generates UUID API key
   Saves { userId, apiKey, capacity, interval } → MongoDB
   Seeds bucket in Redis: { tokens: 10, lastRefill: now }
       │
       ▼
6. Client stores API key in state
       │
       ▼
7. GET /protected
   Headers: Authorization: Bearer <jwt>
            x-api-key: <apiKey>
       │
       ▼
8. Auth middleware verifies JWT → userId
   Rate limit middleware:
     a. Lookup config in MongoDB by apiKey
     b. GET bucket:{apiKey} from Redis
     c. Compute refill tokens since lastRefill
     d. tokens >= 1 → decrement → SET back
     e. Return { tokensLeft }
       │
       ▼
9. 200 OK { tokensLeft: 9 }
   — or —
   429 Too Many Requests { message, tokensLeft: 0 }
```

---

## 📁 Folder Structure

```
token-bucket-rate-limiter/
│
├── client/                     # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── App.jsx             # Root component, all UI logic
│   │   ├── App.css             # Dark-mode SaaS styles
│   │   └── main.jsx            # Vite entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Express backend
│   ├── config/
│   │   ├── db.js               # MongoDB Atlas connection
│   │   └── redis.js            # Redis client setup
│   │
│   ├── controllers/
│   │   ├── apikeyController.js # Generate & store API keys
│   │   └── protectedController.js # Protected route handler
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js   # Privy JWT verification
│   │   └── rateLimiter.js      # Token Bucket algorithm
│   │
│   ├── models/
│   │   └── ApiKey.js           # Mongoose schema
│   │
│   ├── routes/
│   │   ├── apikeyRoutes.js
│   │   └── protectedRoutes.js
│   │
│   ├── utils/
│   │   └── tokenBucket.js      # Core bucket logic (Redis ops)
│   │
│   ├── index.js                # Express app entry point
│   └── package.json
│
├── .env.example                # Environment variable template
└── README.md
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:5000          (development)
https://your-app.onrender.com  (production)
```

---

### `POST /apikeys` — Generate API Key

Creates a new API key with a custom Token Bucket configuration.

**Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <privy_jwt>` |
| `Content-Type` | `application/json` |

**Request Body**

```json
{
  "capacity": 10,
  "tokenInterval": 2
}
```

| Field | Type | Description |
|---|---|---|
| `capacity` | `number` | Max tokens the bucket can hold |
| `tokenInterval` | `number` | Seconds between each +1 token refill |

**Response — `201 Created`**

```json
{
  "apiKey": "a3f9c821-e4d2-4b1c-9f3a-7c0e2d8b1a56"
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid JWT |
| `400 Bad Request` | Missing `capacity` or `tokenInterval` |
| `500 Internal Server Error` | DB / Redis failure |

---

### `GET /protected` — Protected API Route

Tests the rate limiter. Consumes 1 token from the caller's bucket.

**Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <privy_jwt>` |
| `x-api-key` | Your generated API key |

**Response — `200 OK`**

```json
{
  "message": "Request successful",
  "tokensLeft": 7
}
```

**Response — `429 Too Many Requests`**

```json
{
  "message": "Rate limit exceeded. Please wait for token refill.",
  "tokensLeft": 0
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid JWT |
| `403 Forbidden` | Invalid or unknown API key |
| `429 Too Many Requests` | Bucket empty |

---

### `GET /health` — Health Check

Returns server status. Used by the frontend to power the ONLINE / OFFLINE badge.

**Response — `200 OK`**

```json
{
  "status": "ok"
}
```

---

## 🔒 Environment Variables

### Server (`server/.env`)

| Variable | Example | Description |
|---|---|---|
| `PORT` | `5000` | Port the Express server listens on |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/ratelimiter` | MongoDB Atlas connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string (local or Upstash) |
| `PRIVY_APP_ID` | `clx1abc...` | Your Privy application ID (from Privy dashboard) |
| `PRIVY_APP_SECRET` | `privy-secret-...` | Server-side Privy secret for JWT verification |

### Client (`client/.env`)

| Variable | Example | Description |
|---|---|---|
| `VITE_PRIVY_APP_ID` | `clx1abc...` | Same Privy App ID (exposed to browser via Vite) |
| `VITE_API_URL` | `http://localhost:5000` | Backend base URL |

> **Never commit `.env` files.** Copy `.env.example` and fill in values locally.

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- Redis (local or [Upstash](https://upstash.com) for cloud)
- MongoDB Atlas account
- Privy account at [privy.io](https://privy.io)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/token-bucket-rate-limiter.git
cd token-bucket-rate-limiter
```

### Step 2 — Install server dependencies

```bash
cd server
npm install
```

### Step 3 — Install client dependencies

```bash
cd ../client
npm install
```

### Step 4 — Configure environment variables

```bash
# Server
cp server/.env.example server/.env
# Fill in MONGO_URI, REDIS_URL, PRIVY_APP_ID, PRIVY_APP_SECRET

# Client
cp client/.env.example client/.env
# Fill in VITE_PRIVY_APP_ID, VITE_API_URL
```

### Step 5 — Start Redis (if running locally)

```bash
redis-server
```

### Step 6 — Start the backend

```bash
cd server
npm run dev
# Server running on http://localhost:5000
```

### Step 7 — Start the frontend

```bash
cd client
npm run dev
# App running on http://localhost:5173
```

### Step 8 — Open in browser

Navigate to [http://localhost:5173](http://localhost:5173), sign in with Privy, generate an API key, and start testing.

---

## 🖼 Screenshots

### Dashboard

![Dashboard](./screenshots/dashboard.png)
> *The main dashboard showing bucket visualization, stats, and activity timeline.*

### API Key Generation

![API Key Generation](./screenshots/apikey.png)
> *Configuring bucket capacity and refill interval, then generating a scoped API key.*

### Request Simulation — Allowed

![Request Allowed](./screenshots/allowed.png)
> *Firing a single request. Bucket decrements and shows tokens remaining.*

### Token Visualization

![Token Visualization](./screenshots/token-viz.png)
> *Animated block segments drain from green → amber → red as tokens are consumed.*

### Rate Limit Exceeded

![Rate Limit Exceeded](./screenshots/rate-limit.png)
> *Firing 10 rapid requests. Some succeed, some return 429. Stats update in real time.*

### Deployment

![Deployment](./screenshots/deployment.png)
> *Frontend on Vercel, backend on Render, Redis and MongoDB fully managed in the cloud.*

---

## ☁️ Deployment

### Frontend → Vercel

```bash
cd client
npm run build
# Or connect the /client directory to a Vercel project
```

Set environment variables in the Vercel dashboard:
- `VITE_PRIVY_APP_ID`
- `VITE_API_URL` (point to your Render backend URL)

---

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Set root directory to `server/`
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add all server environment variables in the Render dashboard

---

### MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user with read/write access
3. Whitelist `0.0.0.0/0` (or your Render IP) in Network Access
4. Copy the connection string into `MONGO_URI`

---

### Redis

**Option A — Local**
```bash
brew install redis && redis-server   # macOS
sudo apt install redis-server        # Ubuntu
```

**Option B — Upstash (recommended for production)**

1. Create a free database at [upstash.com](https://upstash.com)
2. Copy the Redis URL (starts with `rediss://`) into `REDIS_URL`

---

## 🔐 Security

| Concern | Mitigation |
|---|---|
| **Authentication** | All routes verify Privy JWTs server-side before processing |
| **API Key scoping** | API keys are bound to a `userId`; cross-user key use is rejected |
| **Secrets** | All secrets are in server-side `.env` files, never shipped to the browser |
| **Redis isolation** | Bucket keys are namespaced by `bucket:{apiKey}` — no user data is stored in Redis |
| **MongoDB** | Atlas network access rules + authenticated connection strings |
| **Protected routes** | Double middleware: auth check → API key check → rate limit check |
| **CORS** | Configured to allow only the known frontend origin in production |

---

## ⚡ Performance

### Why Redis?

Redis stores bucket state in memory. Every protected request requires exactly two Redis operations:

```
GET  bucket:{apiKey}     →  ~0.1ms
SET  bucket:{apiKey}     →  ~0.1ms
```

Compared to a MongoDB query (~5–15ms), Redis makes the rate limiter effectively invisible in the request latency budget. At scale, this difference compounds across millions of requests per day.

### O(1) Complexity

The Token Bucket check is constant time regardless of traffic volume:

1. Read current state from Redis — O(1)
2. Calculate elapsed time and refill — O(1) arithmetic
3. Decrement and write back — O(1)

No iteration over request logs. No window scans. Just two Redis calls per request.

### Horizontal Scaling

Because all state lives in Redis (not in server memory), multiple backend instances can be added behind a load balancer without any coordination logic. Each instance reads and writes the same Redis bucket. Redis's single-threaded command processing guarantees no race conditions in token decrements.

```
              Load Balancer
             /      |      \
    Server 1   Server 2   Server 3
             \      |      /
              Redis Cluster
```

---

## 🔭 Future Improvements

| Feature | Description |
|---|---|
| **Sliding Window Log** | More precise but memory-intensive algorithm for stricter rate limits |
| **Leaky Bucket** | Smooth output rate for queue-based APIs |
| **WebSocket Live Updates** | Push token count changes to the UI without polling |
| **Multiple API Keys per User** | Scoped keys per project / environment |
| **Analytics Dashboard** | Charts showing request volume, block rate, and token usage over time |
| **Admin Dashboard** | View and manage all users' keys and usage |
| **Team Workspaces** | Shared API keys across multiple authenticated team members |
| **Metrics & Monitoring** | Prometheus + Grafana integration for request rate and latency |
| **Key Rotation** | One-click API key regeneration without losing configuration |
| **IP-based Limiting** | Rate limit by IP in addition to API key |

---

## 💡 Why This Project

This project was built to demonstrate practical command of the infrastructure-level concepts that matter most in backend engineering:

| Concept | Implementation |
|---|---|
| **Authentication** | Privy JWT verification in Express middleware |
| **Caching** | Redis for sub-millisecond bucket state reads |
| **Database Design** | MongoDB schema for flexible API key config storage |
| **Middleware Architecture** | Composable Express middleware chain (auth → key lookup → rate limit) |
| **Algorithm Design** | Token Bucket with time-based refill calculation |
| **API Design** | RESTful endpoints with proper status codes and structured responses |
| **System Design** | Stateless backend + external state store = horizontal scalability |
| **Frontend Engineering** | Real-time animated dashboard, countdown timer, toast system |

Every architectural decision in this project mirrors how production systems at companies like Stripe, GitHub, and Cloudflare are built. The use of Redis for rate limiting, the separation of config persistence from ephemeral state, and the stateless Express server are all patterns directly applicable to large-scale API infrastructure.

---

## 📄 Resume Impact

> **Token Bucket Rate Limiter** — *Full-Stack · Node.js · Redis · MongoDB · React*
>
> Built a full-stack API rate limiting platform implementing the Token Bucket algorithm from scratch. Used Redis for O(1) bucket state management (two-command check-and-decrement per request) and MongoDB Atlas for persistent API key storage. Integrated Privy JWT authentication across a custom Express middleware chain. Delivered a real-time React dashboard with animated token visualization, refill countdown, and burst request simulation. Designed for horizontal scalability — stateless servers share Redis bucket state with no coordination overhead.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with ☕ and a healthy respect for distributed systems.

**[⬆ Back to top](#-token-bucket-rate-limiter)**

</div>
