# THREATNEX

**Unmasking the Invisible Threat**  
**Detect. Decode. Defend.**

THREATNEX is a defensive cybersecurity prototype for reviewing suspicious emails, SMS messages, URLs, and voice transcripts. Its transparent heuristic engine is a triage aid, not a guarantee or a substitute for contacting an organization through a trusted channel.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- Supabase project is optional; core analysis runs locally without one

## Start the application

```powershell
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The Express API runs on port 3001 and Vite proxies `/api` requests to it. `npm run build` type-checks and builds the client and API.

## Persistence

Without Supabase, completed analyses are stored in the current browser's local storage. This is local to that browser and is not cloud persistence or multi-user history.

To enable Supabase:

1. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project.
2. Apply `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.
3. Enable Supabase Auth email/password sign-in. Use the account control in the top bar to sign up or sign in before relying on cloud history.

The app only uses the public anon key in the browser; never put a service-role key in frontend configuration. Supabase tables enforce user ownership with RLS. Until an authenticated Supabase user exists, the app continues to use browser-local history. Supabase email confirmation may need to be completed before the first sign-in, depending on your project settings.

## Detection and limitations

- Email and SMS use explainable local text heuristics. Scores are risk indicators, not verified verdicts.
- URL analysis parses URL structure only. The submitted URL is never fetched, opened, or sent to a reputation API.
- Voice analysis can record up to two minutes through browser microphone permission. Audio remains in memory for playback and is not uploaded or saved. Optional browser speech recognition requires separate opt-in and may send audio to the browser's recognition provider; manual transcript entry is available when it is unsupported.
- Live-call/WebRTC analysis is not enabled. A browser cannot monitor ordinary cellular SIM calls; do not treat this prototype as cellular-call protection.
- Do not paste passwords, OTPs, or other sensitive information into the prototype.
