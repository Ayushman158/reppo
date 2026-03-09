# Reppo 🏋️

> AI-powered progressive overload tracking for serious lifters.
> Your plan. Amplified.

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo-url> reppo
cd reppo
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Once ready: **SQL Editor → New Query** → paste the contents of `supabase/schema.sql` → **Run**
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
reppo/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.jsx       ← Sidebar + route outlet
│   │   ├── ui/                     ← Reusable UI components (Sprint 2)
│   │   └── features/
│   │       ├── auth/
│   │       ├── onboarding/
│   │       │   └── OnboardPage.jsx ← 3-step onboarding flow ✅
│   │       ├── dashboard/          ← Sprint 3
│   │       ├── workout/            ← Sprint 3
│   │       ├── progress/           ← Sprint 5
│   │       └── program/            ← Sprint 4
│   ├── hooks/
│   │   ├── useAuth.js              ← Auth init + current user
│   │   └── useOneRM.js             ← 1RM fetch + compute hook
│   ├── lib/
│   │   ├── supabase.js             ← Supabase client ✅
│   │   └── 1rm.js                  ← Epley formula + AI engine ✅
│   ├── pages/                      ← Route-level page components
│   ├── store/
│   │   ├── authStore.js            ← Zustand: auth state ✅
│   │   └── workoutStore.js         ← Zustand: live session state ✅
│   ├── styles/
│   │   └── global.css              ← Design tokens + base styles ✅
│   ├── App.jsx                     ← Router ✅
│   └── main.jsx                    ← Entry point ✅
├── supabase/
│   └── schema.sql                  ← Full DB schema ✅
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## Sprint Status

| Sprint | Goal                    | Status         |
|--------|-------------------------|----------------|
| 1      | Foundation + Auth       | ✅ In progress  |
| 2      | Onboarding + Program    | 🔜 Next        |
| 3      | Core Logging            | ⏳ Planned      |
| 4      | AI Layer                | ⏳ Planned      |
| 5      | Progress + Plateau      | ⏳ Planned      |
| 6      | Polish + Launch         | ⏳ Planned      |

---

## The 5 Laws

Every feature is judged against these:

1. **5-Tap Rule** — any core action in 5 taps or fewer
2. **AI Enhances, Never Overrides** — user's plan is sacred
3. **Silent Intelligence** — 1RM tracked automatically, never asked
4. **Ranges, Not Targets** — always a zone, never a single number
5. **Zero Memory Required** — user never needs to recall anything

---

## Tech Stack

| Layer    | Choice                   |
|----------|--------------------------|
| Frontend | React + Vite             |
| Styling  | CSS variables (no framework) |
| Charts   | Recharts                 |
| State    | Zustand                  |
| Backend  | Supabase (PostgreSQL)    |
| Auth     | Supabase Auth            |
| Hosting  | Vercel + Supabase        |
| Mobile   | React Native / Expo (Phase 2) |
