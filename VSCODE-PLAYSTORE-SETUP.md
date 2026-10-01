# Getting shipabyte running in VS Code and onto the Play Store

This project was exported from Replit's agent mode. Two things had to change
before it works outside Replit, and they're already patched in this copy:

- `artifacts/shipabyte/vite.config.ts` and `artifacts/api-server/src/index.ts`
  used to `throw` unless Replit's injected `PORT`/`BASE_PATH` env vars were
  present. They now default to `5173`/`5000`/`/` locally.
- Capacitor scaffolding (`capacitor.config.ts`, deps, `cap:*` scripts) has
  been added to `artifacts/shipabyte/package.json` so the web app can be
  wrapped into a real Android app.

Everything below assumes you're working from the root of this unzipped
project.

## 1. Prerequisites

- **Node.js 24** (matches `.replit`'s `modules = ["nodejs-24"]`)
- **pnpm** — `corepack enable` or `npm i -g pnpm`
- **VS Code** with the "Simple Browser" (built in) or a regular browser tab
  for previewing — Vite's dev server is just a normal local web server
- **Android Studio** (latest stable) — only needed once you get to the
  Capacitor step; it bundles the Android SDK
- **A Google Play Developer account** ($25 one-time fee) — needed at the very
  end to actually submit

## 2. Run it locally (web preview first)

```bash
pnpm install
pnpm --filter @workspace/shipabyte run dev
```

Open the printed local URL (defaults to `http://localhost:5173`) in a
browser, or VS Code's Simple Browser (`Ctrl/Cmd+Shift+P` → "Simple Browser:
Show"). You should see the full shipabyte landing page, same as on Replit.

If you also want the API server running (it's a stub right now — only
`/api/healthz`):

```bash
PORT=5000 pnpm --filter @workspace/api-server run dev
```

## 3. Wrap it as an Android app with Capacitor

Capacitor takes your existing Vite build and drops it into a native Android
project, so you keep all your React/Tailwind code as-is.

```bash
cd artifacts/shipabyte
pnpm install
npx cap init "shipabyte" "com.replace.me.shipabyte" --web-dir dist/public
```

(Skip `cap init` if you're happy with the `capacitor.config.ts` already in
this repo — just make sure the `appId` is set to something you own, since
**it can't be changed after you publish**.)

```bash
pnpm run build          # builds the web app into dist/public
pnpm run cap:add:android  # generates the android/ native project
pnpm run cap:open:android # opens it in Android Studio
```

From here it's a normal Android Studio project. Any time you change the
React code, re-run `pnpm run cap:sync` to rebuild and copy the new web
assets into the native shell.

### Things a "just wrapped" web app needs before it feels like a real app
- **App icon & splash screen** — Android Studio's Image Asset tool
  generates all densities from one source image
- **Back button handling** — Android's hardware/gesture back button should
  navigate within the app, not just exit; Capacitor's `@capacitor/app`
  plugin exposes a `backButton` listener for this
- **Offline handling** — since it's a WebView, a real network blip will
  show a blank screen unless you handle it
- **Status bar / safe-area styling** — so content doesn't sit under the
  notch or system bars (`@capacitor/status-bar`)

## 4. Wire up real monetization (RevenueCat)

The "Bet $0.75" flow and the fund progress bar are currently pure UI state
in `localStorage` — no money moves and nothing is shared between users.
Since this looks like a Shipaton entry, judging typically expects a real
RevenueCat integration (subscriptions or consumable in-app purchases) rather
than simulated numbers. Rough shape of the work:

1. Create a RevenueCat project, add your Android app, connect it to a Play
   Console in-app product (a $0.75 consumable, or a subscription tier)
2. `pnpm add @revenuecat/purchases-capacitor` in `artifacts/shipabyte`
3. Replace `placeBet()` in `src/App.tsx` with a real purchase call, and
   update the fund totals from RevenueCat's/your backend's source of truth
   instead of local state

I can help write this integration once you've got a RevenueCat account and
product IDs set up — happy to do that in a follow-up.

## 5. Connect the frontend to the real backend

Right now `apps`, `bets`, and onboarding state all live only in the
browser. The Express + Postgres scaffold (`artifacts/api-server`,
`lib/db`, `lib/api-spec`) is unused. To make this a real shared app:

1. Define the `submissions` and `bets` tables in `lib/db/src/schema/index.ts`
   (currently empty)
2. Add endpoints to `lib/api-spec/openapi.yaml` (currently only has
   `/healthz`), then run `pnpm --filter @workspace/api-spec run codegen`
   to regenerate the typed React Query hooks in `lib/api-client-react`
3. Swap the `localStorage` reads/writes in `App.tsx` for those generated
   hooks

This is a good chunk of work on its own — let me know if you want to tackle
it next and I'll help scaffold the schema and routes.

## 6. Fill in app identity & store assets checklist

- [ ] Final `appId` chosen and set in `capacitor.config.ts` (reverse-domain,
      permanent once published)
- [ ] App icon (512×512 for the store listing, plus adaptive icon set for
      the app itself)
- [ ] Feature graphic (1024×500) and at least 2 screenshots for the store
      listing
- [ ] Privacy policy URL (required — RevenueCat/purchases data plus any
      backend user data both need disclosure)
- [ ] Content rating questionnaire completed in Play Console
- [ ] Data safety form completed in Play Console (what data is collected,
      how it's used/shared)
- [ ] `versionCode` / `versionName` set in `android/app/build.gradle`
- [ ] Signed release keystore generated and stored somewhere safe (losing it
      means you can never update the app again under the same listing)

## 7. Build, sign, and submit

In Android Studio: **Build → Generate Signed Bundle / APK → Android App
Bundle**, sign it with your release keystore, then upload the resulting
`.aab` in Play Console under **Production** (or **Internal testing** first,
which is recommended for a first pass).

---

Suggested order if you want to keep working through this with me: get step
2 (local dev) confirmed working on your machine first, then decide whether
to tackle the backend wiring or the RevenueCat integration next — both are
independent and I can help with either.
