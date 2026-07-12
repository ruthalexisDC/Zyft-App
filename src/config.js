// src/config.js
//
// Single source of truth for the backend's origin.
// - Local dev: falls back to http://localhost:5000 automatically.
// - Production: set VITE_API_URL in your .env to your backend's origin,
//   e.g. VITE_API_URL=https://api.zyft.com
//   (no trailing slash, and do NOT include "/api" — that's appended
//   separately by whichever file needs it, see api/axios.js).

export const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:5000";