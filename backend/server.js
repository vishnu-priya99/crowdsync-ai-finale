import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import StadiumSimulator from "./simulator.js";
import { runAgentSession } from "./agent.js";

// Load environment variables (.env file)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────
// SECURITY LAYER 1: Strict CORS Whitelist
// Only allow requests from our Firebase Hosted frontend and
// localhost for local development. All other origins are blocked.
// ─────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://gapl-496213-ce73f.web.app",
  "https://gapl-496213-ce73f.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman) and whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: Origin ${origin} is not allowed.`));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ─────────────────────────────────────────────────────────────
// SECURITY LAYER 2: Body Size Limit
// Prevents oversized payload attacks (e.g. large JSON bombs)
// ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));

// ─────────────────────────────────────────────────────────────
// SECURITY LAYER 3: Security Response Headers
// Prevents clickjacking, MIME sniffing, and XSS attacks
// ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ─────────────────────────────────────────────────────────────
// SECURITY LAYER 4: In-Memory Rate Limiter
// Prevents abuse of the Gemini /api/chat endpoint.
// Max 20 requests per minute per IP address.
// ─────────────────────────────────────────────────────────────
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20;

function rateLimit(req, res, next) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  const now = Date.now();
  const record = rateLimitStore.get(ip) || { count: 0, startTime: now };

  // Reset window if expired
  if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    record.count = 0;
    record.startTime = now;
  }

  record.count++;
  rateLimitStore.set(ip, record);

  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: "Too many requests. Rate limit: 20 agent requests per minute per client."
    });
  }
  next();
}

// ─────────────────────────────────────────────────────────────
// SECURITY LAYER 5: Input Validation Whitelists
// All incoming gate IDs, statuses, and crisis types are validated
// against strict whitelists to prevent injection attacks.
// ─────────────────────────────────────────────────────────────
const VALID_GATE_IDS = new Set(["gate-a", "gate-b", "gate-c", "gate-d", "gate-e", "gate-f"]);
const VALID_GATE_STATUSES = new Set(["OPEN", "CLOSED", "REROUTING", "EMERGENCY_ONLY"]);
const VALID_CRISIS_TYPES = new Set(["thunderstorm", "stampede_risk_gate_b", "security_breach_gate_e", "power_failure", "reset"]);
const VALID_ZONES = new Set(["zone-1", "zone-2", "zone-3", "zone-4", "all"]);
const VALID_SERVICE_TYPES = new Set(["Security", "Medical", "Fire Rescue"]);

// Initialize the simulator
const simulator = new StadiumSimulator();

// ─────────────────────────────────────────────────────────────
// API ENDPOINTS
// ─────────────────────────────────────────────────────────────

// 1. Fetch live telemetry data
app.get("/api/telemetry", (req, res) => {
  res.json(simulator.getTelemetry());
});

// 2. Update gate status (with whitelist validation)
app.post("/api/gate", (req, res) => {
  const { gateId, status } = req.body;
  if (!gateId || !status) {
    return res.status(400).json({ error: "Missing gateId or status" });
  }
  if (!VALID_GATE_IDS.has(gateId)) {
    return res.status(400).json({ error: `Invalid gateId. Must be one of: ${[...VALID_GATE_IDS].join(", ")}` });
  }
  if (!VALID_GATE_STATUSES.has(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${[...VALID_GATE_STATUSES].join(", ")}` });
  }
  const success = simulator.updateGateStatus(gateId, status);
  if (success) {
    res.json({ success: true, telemetry: simulator.getTelemetry() });
  } else {
    res.status(404).json({ error: "Gate not found" });
  }
});

// 3. Broadcast alert (with zone validation)
app.post("/api/broadcast", (req, res) => {
  const { message, zone } = req.body;
  if (!message || !zone) {
    return res.status(400).json({ error: "Missing message or zone" });
  }
  if (!VALID_ZONES.has(zone)) {
    return res.status(400).json({ error: `Invalid zone. Must be one of: ${[...VALID_ZONES].join(", ")}` });
  }
  if (typeof message !== "string" || message.length > 500) {
    return res.status(400).json({ error: "Message must be a string under 500 characters." });
  }
  const success = simulator.broadcastAlert(message, zone);
  res.json({ success, telemetry: simulator.getTelemetry() });
});

// 4. Dispatch emergency services (with service type validation)
app.post("/api/dispatch", (req, res) => {
  const { serviceType, gateId } = req.body;
  if (!serviceType || !gateId) {
    return res.status(400).json({ error: "Missing serviceType or gateId" });
  }
  if (!VALID_SERVICE_TYPES.has(serviceType)) {
    return res.status(400).json({ error: `Invalid serviceType. Must be one of: ${[...VALID_SERVICE_TYPES].join(", ")}` });
  }
  if (!VALID_GATE_IDS.has(gateId)) {
    return res.status(400).json({ error: `Invalid gateId. Must be one of: ${[...VALID_GATE_IDS].join(", ")}` });
  }
  const success = simulator.dispatchEmergencyServices(serviceType, gateId);
  res.json({ success, telemetry: simulator.getTelemetry() });
});

// 5. Inject a crisis event (with whitelist validation)
app.post("/api/simulate/crisis", (req, res) => {
  const { type } = req.body;
  if (!type) {
    return res.status(400).json({ error: "Missing crisis type" });
  }
  if (!VALID_CRISIS_TYPES.has(type)) {
    return res.status(400).json({ error: `Invalid crisis type. Must be one of: ${[...VALID_CRISIS_TYPES].join(", ")}` });
  }
  const telemetry = simulator.injectCrisis(type);
  res.json({ success: true, telemetry });
});

// 6. Gemini Agent chat endpoint (rate limited + message length restricted)
app.post("/api/chat", rateLimit, async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message query" });
  }
  if (typeof message !== "string" || message.length > 1000) {
    return res.status(400).json({ error: "Message must be a string under 1000 characters." });
  }
  if (history && !Array.isArray(history)) {
    return res.status(400).json({ error: "History must be an array." });
  }

  try {
    const result = await runAgentSession(simulator, message, history || []);
    res.json({
      success: true,
      text: result.text,
      logs: result.logs,
      telemetry: simulator.getTelemetry()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error. Please try again."
      // Note: We deliberately do NOT expose error.message to the client in production
    });
  }
});

// 7. Health check endpoint (for Cloud Run uptime monitoring)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "CrowdSync AI Backend",
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 CrowdSync AI Backend Server running on port ${PORT}`);
  console.log(`🔑 Gemini API Key Status: ${process.env.GEMINI_API_KEY ? "CONFIGURED ✅" : "MISSING ❌"}`);
  console.log(`🛡️  Security: CORS whitelist, rate limiting, input validation ACTIVE`);
  console.log(`==================================================`);
});
