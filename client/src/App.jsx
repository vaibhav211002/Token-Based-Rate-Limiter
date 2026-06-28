import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { usePrivy } from "@privy-io/react-auth";
import "./App.css";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

// ── Toast system ──────────────────────────────────────────────────────────────
let toastId = 0;
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

// ── Activity timeline ─────────────────────────────────────────────────────────
function useTimeline() {
  const [events, setEvents] = useState([]);
  const push = useCallback((label, kind) => {
    const id = Date.now() + Math.random();
    setEvents((e) => [{ id, label, kind, time: new Date() }, ...e].slice(0, 20));
  }, []);
  return { events, push };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ICONS = {
  key: "🔑", allow: "🚀", block: "❌", refill: "⚡", copy: "📋", logout: "→",
};

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ToastList({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

function StatusBadge({ online }) {
  return (
    <span className={`status-badge ${online ? "status-badge--on" : "status-badge--off"}`}>
      <span className="status-dot" />
      {online ? "ONLINE" : "OFFLINE"}
    </span>
  );
}

// BucketViz now accepts a "refillFlash" prop to animate a newly added token
function BucketViz({ tokens, capacity, refillFlash }) {
  const pct = capacity > 0 ? (tokens / capacity) * 100 : 0;
  const BLOCKS = 10;
  const filled = Math.round((pct / 100) * BLOCKS);
  const color = pct > 60 ? "var(--accent-green)" : pct > 25 ? "var(--accent-amber)" : "var(--accent-red)";

  return (
    <div className="bucket-viz">
      <div className="bucket-label">Token Bucket</div>
      <div className="bucket-bar-wrap">
        <div className="bucket-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bucket-blocks" aria-hidden>
        {Array.from({ length: BLOCKS }).map((_, i) => {
          // The "newest" filled block gets a pop animation when a refill just happened
          const isNewest = i === filled - 1 && refillFlash;
          return (
            <span
              key={i}
              className={[
                "bucket-block",
                i < filled ? "bucket-block--on" : "bucket-block--off",
                isNewest ? "bucket-block--new" : "",
              ].join(" ")}
              style={i < filled ? { background: color } : {}}
            />
          );
        })}
      </div>
      <div className="bucket-count" style={{ color }}>
        {tokens} / {capacity} Tokens
      </div>
    </div>
  );
}

function Countdown({ intervalSec, onTick, isFull }) {
  const [rem, setRem] = useState(intervalSec);
  const [flash, setFlash] = useState(false);
  const timer = useRef(null);
  const start = useRef(Date.now());
  const isFullRef = useRef(isFull);
  useEffect(() => { isFullRef.current = isFull; }, [isFull]);

  useEffect(() => {
    start.current = Date.now();
    setRem(intervalSec);
    const tick = () => {
      const elapsed = (Date.now() - start.current) / 1000;
      const left = Math.max(0, intervalSec - elapsed);
      setRem(left);
      if (left <= 0) {
        if (!isFullRef.current) {
          setFlash(true);
          onTick && onTick();
          setTimeout(() => setFlash(false), 600);
        }
        start.current = Date.now();
        setRem(intervalSec);
      }
    };
    timer.current = setInterval(tick, 100);
    return () => clearInterval(timer.current);
  }, [intervalSec]);

  return (
    <div className={`countdown-card ${flash ? "countdown-flash" : ""}`}>
      <div className="countdown-label">
        {isFull ? "Bucket full — refill paused" : "Next token refill in"}
      </div>
      <div className="countdown-time">
        {isFull ? "MAX" : flash ? "+1 Token" : `${rem.toFixed(1)} s`}
      </div>
      <div className="countdown-track">
        <div
          className="countdown-track-fill"
          style={{ width: isFull ? "100%" : `${((intervalSec - rem) / intervalSec) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={accent ? { color: accent } : {}}>{value ?? "—"}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ApiKeyCard({ apiKey, onCopy }) {
  const [masked, setMasked] = useState(true);
  const display = apiKey
    ? masked ? apiKey.slice(0, 8) + "••••••••••••••••••••" + apiKey.slice(-4) : apiKey
    : "";
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">API Key</span>
        {apiKey && (
          <div className="row-gap-8">
            <button className="btn-ghost btn-sm" onClick={() => setMasked((m) => !m)}>
              {masked ? "Reveal" : "Hide"}
            </button>
            <button className="btn-ghost btn-sm" onClick={() => onCopy(apiKey)}>
              {ICONS.copy} Copy
            </button>
          </div>
        )}
      </div>
      <div className="apikey-box">
        {apiKey
          ? <code className="apikey-text">{display}</code>
          : <span className="apikey-empty">No key generated yet</span>}
      </div>
    </div>
  );
}

function Timeline({ events }) {
  return (
    <div className="panel">
      <div className="panel-header"><span className="panel-title">Activity</span></div>
      {events.length === 0
        ? <div className="timeline-empty">No activity yet.</div>
        : (
          <ul className="timeline-list">
            {events.map((e) => (
              <li key={e.id} className={`timeline-item timeline-item--${e.kind}`}>
                <span className="timeline-dot" />
                <span className="timeline-label">{e.label}</span>
                <span className="timeline-time">{fmtTime(e.time)}</span>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

// ── Learn Section ─────────────────────────────────────────────────────────────
function LearnSection() {
  const [open, setOpen] = useState(null);
  const toggle = (id) => setOpen((o) => (o === id ? null : id));

  const cards = [
    {
      id: "problem",
      emoji: "🤔",
      title: "The Problem",
      subtitle: "Why do APIs need rate limiting?",
      content: (
        <>
          <p className="learn-p">
            Imagine you own a coffee shop with one barista. The barista can make
            <strong> 10 coffees per minute</strong>. If 500 people walk in at once, the
            barista gets overwhelmed — quality drops, orders get lost, and the shop
            crashes.
          </p>
          <p className="learn-p">
            APIs face the exact same problem. Without protection, a single bad actor
            (or a buggy client with an infinite retry loop) can send thousands of
            requests per second — exhausting your CPU, memory, and database connections,
            causing a <strong>denial-of-service</strong> for every other user.
          </p>
          <div className="learn-diagram">
            <pre>{`
  WITHOUT RATE LIMITING
  ─────────────────────────────────────
  Client A  ──────────────────────────────► 💥 Server crash
  Client B  ──────────────────────────────►
  Client C  ──────────────────────────────►
  Bot       ████████████████████████████►

  WITH RATE LIMITING
  ─────────────────────────────────────
  Client A  ──┤✅├──┤✅├──┤✅├──────►  Allowed (within limit)
  Client B  ──┤✅├──┤✅├──────────────►  Allowed (within limit)
  Bot       ██┤❌├██┤❌├██┤❌├███►  Blocked (429 Too Many Requests)
`}</pre>
          </div>
          <p className="learn-p">
            Rate limiting is the bouncer at the door — it lets genuine users in and
            stops abusers before they cause damage.
          </p>
        </>
      ),
    },
    {
      id: "algorithms",
      emoji: "📐",
      title: "Rate Limiting Algorithms",
      subtitle: "Four approaches — their trade-offs",
      content: (
        <>
          <p className="learn-p">
            Several algorithms solve rate limiting. Each has different properties
            around burst handling, memory use, and smoothness.
          </p>

          <div className="learn-algo-grid">
            {[
              {
                name: "Fixed Window",
                burst: "Edge bursts ⚠️",
                memory: "O(1)",
                smooth: "Poor",
                desc: "Counts requests in fixed time windows (e.g. 100 req/min). Simple but allows 2× burst at window boundaries.",
              },
              {
                name: "Token Bucket ✅",
                burst: "Controlled ✅",
                memory: "O(1)",
                smooth: "Good",
                desc: "Tokens accumulate up to a max capacity. Requests consume tokens. Refills happen at a fixed rate. This is what we built.",
              },
              {
                name: "Sliding Window Log",
                burst: "No bursts",
                memory: "O(n) requests",
                smooth: "Excellent",
                desc: "Logs every request timestamp. Most accurate but memory-expensive at scale.",
              },
              {
                name: "Leaky Bucket",
                burst: "No bursts",
                memory: "O(1)",
                smooth: "Excellent",
                desc: "Requests drip out at a constant rate. Ideal for smoothing bursty traffic into even output.",
              },
            ].map((a) => (
              <div key={a.name} className="learn-algo-card">
                <div className="learn-algo-name">{a.name}</div>
                <div className="learn-algo-row"><span>Burst</span><span>{a.burst}</span></div>
                <div className="learn-algo-row"><span>Memory</span><span>{a.memory}</span></div>
                <div className="learn-algo-row"><span>Smoothness</span><span>{a.smooth}</span></div>
                <p className="learn-algo-desc">{a.desc}</p>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      id: "token-bucket",
      emoji: "🪣",
      title: "Token Bucket — Deep Dive",
      subtitle: "How the algorithm actually works",
      content: (
        <>
          <p className="learn-p">
            The Token Bucket algorithm is named after a literal analogy: imagine a
            bucket that holds tokens (coins). You need to spend a token to make an
            API request. The bucket refills automatically over time.
          </p>

          <div className="learn-diagram">
            <pre>{`
  ┌─────────────────────────────────────────────┐
  │              THE BUCKET                      │
  │                                              │
  │   ┌──────────────────────────────────────┐   │
  │   │   🪙  🪙  🪙  🪙  🪙  🪙  🪙  🪙   │   │  ← Capacity = 8
  │   └──────────────────────────────────────┘   │
  │                                              │
  │   ⚡ Refill rate: +1 token every 2 seconds   │
  │                                              │
  └─────────────────────────────────────────────┘

  Client makes a request
         │
         ▼
  ┌─────────────────────────┐
  │   Is there a token?     │
  └────────────┬────────────┘
               │
      ┌────────┴────────┐
      │ YES             │ NO
      ▼                 ▼
  Remove 1 token    Return 429
  Allow request     Too Many Requests
      │
      ▼
  ┌────────────────────────────┐
  │  🪙 🪙 🪙 🪙 🪙 🪙 🪙    │  ← 7 tokens left
  └────────────────────────────┘
`}</pre>
          </div>

          <p className="learn-p">
            After 2 seconds, the refill timer fires and adds 1 token back:
          </p>

          <div className="learn-diagram">
            <pre>{`
  t=0s  [ 🪙 🪙 🪙 🪙 🪙 🪙 🪙 🪙 ]  8/8 tokens  FULL
  t=0s  Request → consume 1 token
        [ 🪙 🪙 🪙 🪙 🪙 🪙 🪙    ]  7/8 tokens
  t=0s  Request → consume 1 token
        [ 🪙 🪙 🪙 🪙 🪙 🪙       ]  6/8 tokens
  t=2s  Refill  → +1 token
        [ 🪙 🪙 🪙 🪙 🪙 🪙 🪙    ]  7/8 tokens
  t=4s  Refill  → +1 token
        [ 🪙 🪙 🪙 🪙 🪙 🪙 🪙 🪙 ]  8/8 tokens  FULL again
`}</pre>
          </div>

          <p className="learn-p">
            The key insight: the bucket never exceeds its <strong>capacity</strong>.
            Idle time accumulates tokens up to the cap — giving legitimate users a
            "burst budget" they've earned by being patient.
          </p>
        </>
      ),
    },
    {
      id: "redis",
      emoji: "⚡",
      title: "Why Redis?",
      subtitle: "The secret behind O(1) rate limiting",
      content: (
        <>
          <p className="learn-p">
            The Token Bucket only works in production if checking it is extremely fast.
            If the rate-limit check takes longer than the request itself, you've made
            everything slower.
          </p>
          <p className="learn-p">
            Redis is an <strong>in-memory key-value store</strong>. Unlike a database
            that writes to disk, Redis holds all data in RAM. A typical operation takes
            under <strong>0.1 milliseconds</strong> — roughly 100× faster than MongoDB
            or PostgreSQL.
          </p>

          <div className="learn-diagram">
            <pre>{`
  Storage Comparison (approximate)
  ──────────────────────────────────────────────
  Redis (in-memory)   │████│              ~0.1ms
  MongoDB (SSD)       │████████████████│  ~5–15ms
  PostgreSQL (SSD)    │█████████████████│ ~5–20ms
  MySQL (SSD)         │██████████████████│~5–25ms
  ──────────────────────────────────────────────

  Per request, this difference × millions of requests/day
  = the difference between "invisible overhead" and "noticeable slowdown"
`}</pre>
          </div>

          <p className="learn-p">
            In this project, every incoming request to <code>/protected</code> does
            exactly <strong>two Redis operations</strong>:
          </p>

          <div className="learn-diagram">
            <pre>{`
  1.  GET  bucket:{apiKey}
      → Returns { tokens: 7, lastRefill: 1719000000000 }
      → Takes ~0.1ms

  2.  SET  bucket:{apiKey}
      → Writes { tokens: 6, lastRefill: now }
      → Takes ~0.1ms

  Total overhead added to every request: ~0.2ms
  That's effectively invisible to the end user.
`}</pre>
          </div>

          <p className="learn-p">
            Because all state lives in Redis (not in the Node.js process), you can
            run <strong>multiple backend servers</strong> behind a load balancer and
            they all share the same bucket state — no coordination needed.
          </p>
        </>
      ),
    },
    {
      id: "lifecycle",
      emoji: "🔄",
      title: "Full Request Lifecycle",
      subtitle: "From browser click to API response",
      content: (
        <>
          <p className="learn-p">
            When you click "Send 1 Request" on this dashboard, here is the exact
            journey that happens:
          </p>

          <div className="learn-diagram">
            <pre>{`
  ① You click "Send 1 Request" in the browser
         │
         ▼
  ② React calls getAccessToken() → Privy returns a JWT
         │
         ▼
  ③ Axios sends:
       GET /protected
       Headers:
         Authorization: Bearer <jwt>
         x-api-key:     a3f9c821-e4d2-4b1c-...
         │
         ▼
  ④ Express receives the request
         │
         ▼
  ⑤ authMiddleware.js
       → Verifies JWT with Privy SDK
       → Extracts userId
       → If invalid → 401 Unauthorized ❌
         │
         ▼
  ⑥ rateLimiter.js middleware
       → Looks up apiKey in MongoDB
         → If not found → 403 Forbidden ❌
       → GET bucket:{apiKey} from Redis
         → tokens: 4, lastRefill: 1719000100
       → Calculate refill:
           elapsed = now - lastRefill = 6 seconds
           newTokens = floor(6 / interval) = 3 tokens
           tokens = min(4 + 3, capacity) = 7
       → tokens >= 1? YES
         → tokens = 7 - 1 = 6
         → SET bucket:{apiKey} = { tokens: 6, lastRefill: now }
         │
         ▼
  ⑦ protectedController.js
       → Returns 200 OK { tokensLeft: 6 }
         │
         ▼
  ⑧ React receives response
       → setTokensLeft(6)
       → Bucket visualization updates 🪣
       → Toast: "🚀 Request Allowed"
       → Timeline: "Request Allowed"

  ─────── OR if bucket was empty ────────────────

  ⑥ rateLimiter.js
       → tokens = 0, no refill due yet
       → Returns 429 Too Many Requests
             { message: "Rate limit exceeded", tokensLeft: 0 }
         │
         ▼
  ⑧ React catches error
       → Toast: "❌ Rate Limit Exceeded"
       → Timeline: "Rate Limit Hit"
`}</pre>
          </div>
        </>
      ),
    },
    {
      id: "scalability",
      emoji: "📈",
      title: "Scalability",
      subtitle: "How this design handles millions of users",
      content: (
        <>
          <p className="learn-p">
            One of the most important properties of this architecture is that it
            scales horizontally — you can add more backend servers without changing
            any code.
          </p>

          <div className="learn-diagram">
            <pre>{`
  SINGLE SERVER (works but is a bottleneck)
  ─────────────────────────────────────────
  Users → [  Server 1  ] → Redis → MongoDB


  HORIZONTAL SCALING (production-grade)
  ─────────────────────────────────────────
                     ┌──[ Server 1 ]──┐
  Users → Load   ────┤──[ Server 2 ]──├──► Redis ──► MongoDB
         Balancer    └──[ Server 3 ]──┘

  All servers read/write the SAME Redis bucket.
  No coordination needed. No race conditions.
  Redis's single-threaded command execution
  guarantees atomic reads and writes.
`}</pre>
          </div>

          <p className="learn-p">
            The bucket check is <strong>O(1)</strong> — constant time regardless of
            how many users or requests exist. Whether you have 10 users or 10 million,
            every request does the same two Redis operations. There are no loops,
            no scans, no growing data structures to search through.
          </p>

          <div className="learn-diagram">
            <pre>{`
  Time complexity of each algorithm:

  Fixed Window       O(1)   ✅  (simple counter)
  Token Bucket       O(1)   ✅  (two Redis ops)
  Leaky Bucket       O(1)   ✅  (queue length check)
  Sliding Window Log O(n)   ⚠️  (n = requests in window)

  Space per user:

  Token Bucket       2 values (tokens + lastRefill)
  Sliding Window Log 1 entry per request in window
`}</pre>
          </div>
        </>
      ),
    },
  ];

  return (
    <section className="learn-section">
      <div className="learn-header">
        <div className="learn-header-eyebrow">Concept Guide</div>
        <h2 className="learn-header-title">How Token Bucket Rate Limiting Works</h2>
        <p className="learn-header-sub">
          A practical, visual explanation for developers and students. Click any card to expand.
        </p>
      </div>

      <div className="learn-cards">
        {cards.map((c) => (
          <div
            key={c.id}
            className={`learn-card ${open === c.id ? "learn-card--open" : ""}`}
          >
            <button className="learn-card-trigger" onClick={() => toggle(c.id)}>
              <span className="learn-card-emoji">{c.emoji}</span>
              <span className="learn-card-titles">
                <span className="learn-card-title">{c.title}</span>
                <span className="learn-card-subtitle">{c.subtitle}</span>
              </span>
              <span className="learn-card-chevron">{open === c.id ? "▲" : "▼"}</span>
            </button>
            {open === c.id && (
              <div className="learn-card-body">{c.content}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ login }) {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-icon">🪣</div>
        <h1 className="login-title">Token Bucket</h1>
        <p className="login-sub">Rate Limiter Dashboard</p>
        <button className="btn-primary login-btn" onClick={login}>Sign in with Privy</button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const { login, logout, authenticated, user, getAccessToken } = usePrivy();

  // ── Original state (names preserved) ──────────────────────────────────────
  const [capacity, setCapacity] = useState(10);
  const [interval, setInterval] = useState(2);
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");
  const [tokensLeft, setTokensLeft] = useState("");
  const [allowed, setAllowed] = useState(0);
  const [blocked, setBlocked] = useState(0);

  // ── Extra UI state ─────────────────────────────────────────────────────────
  const [online, setOnline] = useState(true);
  const [firing, setFiring] = useState(false);
  const [refillFlash, setRefillFlash] = useState(false); // triggers block pop animation
  const stopRef = useRef(false); // stop signal for burst loop
  const { toasts, add: addToast } = useToasts();
  const { events, push: pushEvent } = useTimeline();

  // ── Backend health check ───────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try { await api.get("/health").catch(() => {}); setOnline(true); }
      catch { setOnline(false); }
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  // ── Handlers (original logic, unchanged) ──────────────────────────────────
  const generateKey = async () => {
    try {
      const token = await getAccessToken();
      const res = await api.post(
        "/apikeys",
        { capacity: Number(capacity), tokenInterval: Number(interval) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApiKey(res.data.apiKey);
      setStatus("✅ API Key Generated Successfully");
      setTokensLeft(Number(capacity));
      addToast("✅ API Key Generated", "success");
      pushEvent("API Key Generated", "key");
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      setStatus(msg);
      addToast("❌ " + msg, "error");
    }
  };

  const sendRequest = async () => {
    try {
      const token = await getAccessToken();
      const res = await api.get("/protected", {
        headers: { Authorization: `Bearer ${token}`, "x-api-key": apiKey },
      });
      setStatus("✅ Request Allowed");
      setTokensLeft(res.data.tokensLeft);
      setAllowed((a) => a + 1);
      addToast("🚀 Request Allowed", "success");
      pushEvent("Request Allowed", "allow");
    } catch (err) {
      const msg = err.response?.data?.message || "Request Failed";
      setStatus(msg);
      setTokensLeft(err.response?.data?.tokensLeft ?? tokensLeft);
      setBlocked((b) => b + 1);
      addToast("❌ Rate Limit Exceeded", "error");
      pushEvent("Rate Limit Hit", "block");
    }
  };

  const fireTenRequests = async () => {
    if (firing) return;
    setFiring(true);
    stopRef.current = false;
    let success = 0;
    let fail = 0;
    const token = await getAccessToken();

    for (let i = 0; i < 10; i++) {
      // Check stop signal before every request
      if (stopRef.current) {
        addToast("⏹ Simulation stopped", "info");
        pushEvent(`Simulation stopped (${success} allowed, ${fail} blocked)`, fail > 0 ? "block" : "allow");
        break;
      }
      try {
        const res = await api.get("/protected", {
          headers: { Authorization: `Bearer ${token}`, "x-api-key": apiKey },
        });
        success++;
        setTokensLeft(res.data.tokensLeft);
      } catch (err) {
        fail++;
        setTokensLeft(err.response?.data?.tokensLeft ?? 0);
      }
    }

    if (!stopRef.current) {
      setStatus("Finished Sending Requests");
      addToast(`📊 ${success} allowed · ${fail} blocked`, "info");
      pushEvent(`Burst: ${success} allowed, ${fail} blocked`, fail > 0 ? "block" : "allow");
    }

    setAllowed((a) => a + success);
    setBlocked((b) => b + fail);
    setFiring(false);
    stopRef.current = false;
  };

  const stopSimulation = () => {
    stopRef.current = true;
    setStatus("⏹ Simulation stopped");
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key).then(() => {
      addToast("📋 API Key Copied", "info");
      pushEvent("API Key Copied", "key");
    });
  };

  // When a refill tick fires: optimistically increment the local token count
  // and briefly flash the newest block in the visualization.
  const handleRefill = useCallback(() => {
    const current = typeof tokensLeft === "number" ? tokensLeft : Number(tokensLeft) || 0;
    const cap = Number(capacity);
    if (current < cap) {
      setTokensLeft((prev) => {
        const n = typeof prev === "number" ? prev : Number(prev) || 0;
        return Math.min(n + 1, cap);
      });
      setRefillFlash(true);
      setTimeout(() => setRefillFlash(false), 500);
      pushEvent("Token Refilled", "refill");
    }
  }, [tokensLeft, capacity]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!authenticated) return <LoginScreen login={login} />;

  const tokensNum = typeof tokensLeft === "number" ? tokensLeft : Number(tokensLeft) || 0;

  return (
    <div className="dash">
      <ToastList toasts={toasts} />

      {/* Header */}
      <header className="dash-header">
        <div className="dash-logo">
          <span className="dash-logo-icon">🪣</span>
          <span className="dash-logo-text">Token Bucket</span>
        </div>
        <div className="dash-header-right">
          <StatusBadge online={online} />
          <span className="dash-email">{user?.email?.address || "User"}</span>
          <button className="btn-ghost btn-sm" onClick={logout}>Sign out {ICONS.logout}</button>
        </div>
      </header>

      {/* Main grid */}
      <main className="dash-grid">
        {/* Left column */}
        <div className="col-left">
          {/* Config */}
          <div className="panel">
            <div className="panel-header"><span className="panel-title">Configuration</span></div>
            <div className="field">
              <label className="field-label">Bucket Capacity</label>
              <input className="field-input" type="number" min={1} value={capacity}
                onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Refill Interval (seconds)</label>
              <input className="field-input" type="number" min={0.1} step={0.1} value={interval}
                onChange={(e) => setInterval(e.target.value)} />
            </div>
            <button className="btn-primary w-full" onClick={generateKey}>Generate API Key</button>
          </div>

          {/* API Key */}
          <ApiKeyCard apiKey={apiKey} onCopy={copyKey} />

          {/* Request simulator */}
          <div className="panel">
            <div className="panel-header"><span className="panel-title">Request Simulator</span></div>
            <p className="panel-hint">
              {apiKey ? "Send requests to test your rate limiter." : "Generate an API key first."}
            </p>
            <div className="sim-btns">
              <button className="btn-primary" onClick={sendRequest} disabled={!apiKey || firing}>
                Send 1 Request
              </button>
              <button
                className={`btn-secondary ${firing ? "btn-loading" : ""}`}
                onClick={fireTenRequests}
                disabled={!apiKey || firing}
              >
                {firing ? "Firing…" : "Fire 10 Requests"}
              </button>
              {/* Stop button — only active while a burst is running */}
              <button
                className="btn-stop"
                onClick={stopSimulation}
                disabled={!firing}
                title="Stop the running simulation"
              >
                ⏹ Stop
              </button>
            </div>
            {status && <div className="status-line">{status}</div>}
          </div>
        </div>

        {/* Right column */}
        <div className="col-right">
          {/* Bucket visualization */}
          <div className="panel">
            <div className="panel-header"><span className="panel-title">Bucket Status</span></div>
            <BucketViz tokens={tokensNum} capacity={Number(capacity)} refillFlash={refillFlash} />
          </div>

          {/* Countdown */}
          {apiKey && (
            <Countdown
              intervalSec={Number(interval)}
              onTick={handleRefill}
              isFull={tokensNum >= Number(capacity)}
            />
          )}

          {/* Stats */}
          <div className="stats-grid">
            <StatCard label="Tokens Left" value={tokensLeft !== "" ? tokensLeft : "—"} accent="var(--accent-green)" />
            <StatCard label="Capacity" value={capacity} />
            <StatCard label="Allowed" value={allowed} accent="var(--accent-green)" />
            <StatCard label="Blocked" value={blocked} accent="var(--accent-red)" />
            <StatCard label="Refill (s)" value={interval} />
          </div>

          {/* Timeline */}
          <Timeline events={events} />
        </div>
      </main>

      {/* Learn section — full width below the grid */}
      <LearnSection />
    </div>
  );
}