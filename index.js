import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;

// ---------- CORS ----------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Permite file:// (Origin: "null") si lo habilitas (útil en pruebas abriendo el HTML desde Finder)
const ALLOW_NULL_ORIGIN =
  (process.env.ALLOW_NULL_ORIGIN || "true").toLowerCase() === "true";

const corsOptions = {
  origin: (origin, cb) => {
    // Server-to-server, curl, Postman (sin header Origin)
    if (!origin) return cb(null, true);

    // file:// -> Origin: "null"
    if (ALLOW_NULL_ORIGIN && origin === "null") return cb(null, true);

    // Si no configuras ALLOWED_ORIGINS, permite todo (dev only)
    if (allowedOrigins.length === 0) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);

    // Rechaza limpio, sin lanzar error
    return cb(null, false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization", "Cache-Control", "Pragma"],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Health
app.get("/", (req, res) => res.send("ok"));
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ---------- FINANCE DATA PROXY (Apps Script / Sheets) ----------
const FINANCE_DATA_ENDPOINT =
  process.env.FINANCE_DATA_ENDPOINT ||
  "https://script.google.com/macros/s/REPLACE_ME/exec";

app.get("/api/data", async (req, res) => {
  try {
    const url = new URL(FINANCE_DATA_ENDPOINT);
    for (const [k, v] of Object.entries(req.query)) url.searchParams.set(k, v);

    const r = await fetch(url.toString());
    const text = await r.text();

    res.status(r.status);
    try {
      res.json(JSON.parse(text));
    } catch {
      res.type("text/plain").send(text);
    }
  } catch (e) {
    console.error("[/api/data] proxy_failed:", e);
    res.status(500).json({ ok: false, error: "proxy_failed", message: e.message });
  }
});

// ✅ Error handler (incluye errores de CORS)
app.use((err, req, res, next) => {
  console.error("[express error]", err);
  res.status(500).json({
    ok: false,
    error: "server_error",
    message: err?.message || "Unknown error",
  });
});

app.listen(PORT, "0.0.0.0", () => console.log(`Listening on ${PORT}`));
