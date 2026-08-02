// Back-end/config/loadEnv.js
// Single, purpose-built module for loading environment variables.
//
// It does ONE thing and nothing else: populates process.env from both
// possible .env locations (project root and Back-end/).
//
// Why this exists:
//   - ES module imports are hoisted and evaluated BEFORE any module body
//     code runs. So if server.js imports ./config/passport.js, Node fully
//     evaluates passport.js first — which used to construct the OAuth
//     strategies at module top-level before server.js could run its own
//     dotenv.config() calls. The result was clientID/clientSecret being
//     undefined at construction time and Google/Facebook auth failing.
//
//   - This module has no exports and no side-effect-free dependencies, so
//     whichever entry point (server.js, passport.js, a script, etc.)
//     imports it FIRST wins, and every subsequent module sees a fully
//     populated process.env.
//
// No exports — importing it is all that's needed.
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load from project root (where the repo-level .env lives)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Also load from Back-end/ (in case a backend-local .env exists)
dotenv.config({ path: join(__dirname, '.env') });
