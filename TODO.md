# TODO: Fix Env Loading / Passport OAuth Strategy Construction Order

## Plan (approved)

### 1. Create `Back-end/config/loadEnv.js` (NEW — no exports, pure side-effect)

- [x] `dotenv.config({ path: <root>/.env })` and `dotenv.config({ path: <Back-end>/.env })`
- [x] No exports — exists only to populate `process.env`

### 2. Update `Back-end/config/passport.js`

- [x] Add `import './loadEnv.js';` as the VERY FIRST import
- [x] Remove `import dotenv from 'dotenv'` and `dotenv.config()`
- [x] Wrap Google & Facebook `passport.use(...)` calls in exported `initPassport()` function
- [x] Keep serialize/deserialize, debug logs, default export

### 3. Update `Back-end/server.js`

- [x] Add `import './config/loadEnv.js';` as the VERY FIRST import
- [x] Remove `dotenv`, `url`, `path` imports, `__filename`/`__dirname` computation, and both `dotenv.config()` lines
- [x] Change passport import to `import passport, { initPassport } from './config/passport.js';`
- [x] Call `initPassport()` explicitly after env checks

### 4. Verify

- [x] Start server, confirm env vars load (GOOGLE_CLIENT_ID ✓, FACEBOOK_APP_ID ✓, etc.)
- [x] No startup errors — server boots and process stays running
- [x] Smoke-test `/api/auth/google` → 302 redirect to accounts.google.com with real client_id
- [x] Smoke-test `/api/auth/facebook` → 302 redirect to facebook.com dialog with real client_id
- [x] Regression check — server boots cleanly and serves requests after removed imports
