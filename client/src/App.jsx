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
  key: "🔑",
  allow: "🚀",
  block: "❌",
  refill: "⚡",
  copy: "📋",
  logout: "→",
};

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ToastList({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          {t.msg}
        </div>
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

function BucketViz({ tokens, capacity }) {
  const pct = capacity > 0 ? (tokens / capacity) * 100 : 0;
  const blocks = 10;
  const filled = Math.round((pct / 100) * blocks);

  const color =
    pct > 60 ? "var(--accent-green)" : pct > 25 ? "var(--accent-amber)" : "var(--accent-red)";

  return (
    <div className="bucket-viz">
      <div className="bucket-label">Token Bucket</div>
      <div className="bucket-bar-wrap">
        <div
          className="bucket-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="bucket-blocks" aria-hidden>
        {Array.from({ length: blocks }).map((_, i) => (
          <span
            key={i}
            className={`bucket-block ${i < filled ? "bucket-block--on" : "bucket-block--off"}`}
            style={i < filled ? { background: color } : {}}
          />
        ))}
      </div>
      <div className="bucket-count" style={{ color }}>
        {tokens} / {capacity} Tokens
      </div>
    </div>
  );
}

function Countdown({ intervalSec, onTick }) {
  const [rem, setRem] = useState(intervalSec);
  const [flash, setFlash] = useState(false);
  const timer = useRef(null);
  const start = useRef(Date.now());

  useEffect(() => {
    start.current = Date.now();
    setRem(intervalSec);

    const tick = () => {
      const elapsed = (Date.now() - start.current) / 1000;
      const left = Math.max(0, intervalSec - elapsed);
      setRem(left);
      if (left <= 0) {
        setFlash(true);
        onTick && onTick();
        setTimeout(() => setFlash(false), 600);
        start.current = Date.now();
        setRem(intervalSec);
      }
    };

    timer.current = setInterval(tick, 100);
    return () => clearInterval(timer.current);
  }, [intervalSec]);

  return (
    <div className={`countdown-card ${flash ? "countdown-flash" : ""}`}>
      <div className="countdown-label">Next token refill in</div>
      <div className="countdown-time">{flash ? "+1 Token" : `${rem.toFixed(1)} s`}</div>
      <div className="countdown-track">
        <div
          className="countdown-track-fill"
          style={{ width: `${((intervalSec - rem) / intervalSec) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={accent ? { color: accent } : {}}>
        {value ?? "—"}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ApiKeyCard({ apiKey, onCopy }) {
  const [masked, setMasked] = useState(true);
  const display = apiKey
    ? masked
      ? apiKey.slice(0, 8) + "••••••••••••••••••••" + apiKey.slice(-4)
      : apiKey
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
        {apiKey ? (
          <code className="apikey-text">{display}</code>
        ) : (
          <span className="apikey-empty">No key generated yet</span>
        )}
      </div>
    </div>
  );
}

function Timeline({ events }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Activity</span>
      </div>
      {events.length === 0 ? (
        <div className="timeline-empty">No activity yet.</div>
      ) : (
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

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ login }) {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-icon">🪣</div>
        <h1 className="login-title">Token Bucket</h1>
        <p className="login-sub">Rate Limiter Dashboard</p>
        <button className="btn-primary login-btn" onClick={login}>
          Sign in with Privy
        </button>
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
  const { toasts, add: addToast } = useToasts();
  const { events, push: pushEvent } = useTimeline();

  // Ping backend for status badge
  useEffect(() => {
    const check = async () => {
      try {
        await api.get("/health").catch(() => {});
        setOnline(true);
      } catch {
        setOnline(false);
      }
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
    let success = 0;
    let fail = 0;
    const token = await getAccessToken();

    for (let i = 0; i < 10; i++) {
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

    setAllowed((a) => a + success);
    setBlocked((b) => b + fail);
    setStatus("Finished Sending Requests");
    addToast(`📊 ${success} allowed · ${fail} blocked`, "info");
    pushEvent(`Burst: ${success} allowed, ${fail} blocked`, fail > 0 ? "block" : "allow");
    setFiring(false);
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key).then(() => {
      addToast("📋 API Key Copied", "info");
      pushEvent("API Key Copied", "key");
    });
  };

  const handleRefill = () => {
    pushEvent("Token Refilled", "refill");
  };

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
          <button className="btn-ghost btn-sm" onClick={logout}>
            Sign out {ICONS.logout}
          </button>
        </div>
      </header>

      {/* Main grid */}
      <main className="dash-grid">
        {/* Left column */}
        <div className="col-left">
          {/* Config panel */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Configuration</span>
            </div>
            <div className="field">
              <label className="field-label">Bucket Capacity</label>
              <input
                className="field-input"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">Refill Interval (seconds)</label>
              <input
                className="field-input"
                type="number"
                min={0.1}
                step={0.1}
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
              />
            </div>
            <button className="btn-primary w-full" onClick={generateKey}>
              Generate API Key
            </button>
          </div>

          {/* API Key */}
          <ApiKeyCard apiKey={apiKey} onCopy={copyKey} />

          {/* Request simulator */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Request Simulator</span>
            </div>
            <p className="panel-hint">
              {apiKey ? "Send requests to test your rate limiter." : "Generate an API key first."}
            </p>
            <div className="sim-btns">
              <button
                className="btn-primary"
                onClick={sendRequest}
                disabled={!apiKey}
              >
                Send 1 Request
              </button>
              <button
                className={`btn-secondary ${firing ? "btn-loading" : ""}`}
                onClick={fireTenRequests}
                disabled={!apiKey || firing}
              >
                {firing ? "Firing…" : "Fire 10 Requests"}
              </button>
            </div>
            {status && <div className="status-line">{status}</div>}
          </div>
        </div>

        {/* Right column */}
        <div className="col-right">
          {/* Bucket visualization */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Bucket Status</span>
            </div>
            <BucketViz tokens={tokensNum} capacity={Number(capacity)} />
          </div>

          {/* Countdown */}
          {apiKey && (
            <Countdown intervalSec={Number(interval)} onTick={handleRefill} />
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
    </div>
  );
}