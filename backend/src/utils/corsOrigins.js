// Shared CORS origin policy: exact-match against ALLOWED_ORIGINS (comma-separated).
// Requests without an Origin header (curl, server-to-server, tests) are permitted;
// browsers always send Origin on cross-origin requests.
// Computed per-call so dotenv.config() in index.js is picked up regardless of load order.
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const getAllowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(','))
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const isAllowedOrigin = (origin) => !origin || getAllowedOrigins().includes(origin);

module.exports = { getAllowedOrigins, isAllowedOrigin };
