# Pressline

An AI content & publishing platform for creators and affiliate marketers — draft, proof, and ship
blog posts, reviews and campaigns straight to WordPress or Blogger. Built with React (Vite),
Tailwind CSS, Framer Motion and Supabase.

## Stack

- **React 19 + Vite** — app shell and build tooling
- **Tailwind CSS** — styling, with custom design tokens in `tailwind.config.js`
- **Framer Motion** — page-load, scroll-reveal and interaction animations
- **React Router** — client-side routing
- **Supabase** — auth (email/password) + Postgres database for generation history
- **lucide-react** — icon set

## Getting started

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Supabase project's URL and anon key:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> The app runs fine without Supabase configured — it falls back to a "demo mode" banner and lets
> you click through the whole dashboard UI. Auth and the generation history just won't persist
> until you connect a real project.

Then run the dev server:

```bash
npm run dev
```

## Setting up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run the contents of `supabase/schema.sql`. This creates:
   - `profiles` — one row per user, auto-created on signup via a trigger
   - `generations` — history of every draft run through a tool, with row-level security so users
     only ever see their own rows
   - `connected_sites` — placeholder table for WordPress/Blogger/Amazon connections
3. In **Authentication → Providers**, make sure Email is enabled (it is by default).
4. Copy your **Project URL** and **anon public key** from **Project Settings → API** into `.env`.

## Wiring up real AI generation

The dashboard's "Run it" button currently returns a placeholder draft so the full flow (prompt →
loading state → result → saved to history) works end-to-end out of the box. To generate real
content, replace `fakeGenerate()` in `src/pages/Dashboard.jsx` with a call to a Supabase Edge
Function that hits your model provider of choice, and keep API keys server-side rather than in
the client.

## Project structure

```
src/
  components/   Navbar, Hero, Features, Pricing, dashboard shell, etc.
  context/      AuthContext (wraps Supabase auth)
  data/         Feature catalog, pricing tiers, FAQ, testimonial copy
  lib/          Supabase client
  pages/        Landing, Login, Signup, Dashboard, History, Settings
supabase/
  schema.sql    Full database schema + RLS policies
```

## Build

```bash
npm run build
```

Outputs a production build to `dist/`, ready to deploy to Vercel, Netlify, or any static host.
# cogial
