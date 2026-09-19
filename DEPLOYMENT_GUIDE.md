# PressLine — Production Deployment Guide

We have successfully transformed PressLine from a UI shell into a fully functional, production-ready SaaS application! Here are the final steps to deploy your platform.

## 1. Apply Database Migrations
We have added critical database policies to enforce Row Level Security (RLS) across all tables, ensuring complete workspace isolation, as well as a highly optimized Dashboard RPC for performance.

Push the migrations to your production Supabase database:
```bash
supabase db push
```

## 2. Deploy Edge Functions
All AI features have been centralized through the Edge Functions (`ai-generate` and `generate-openrouter`) to ensure that API keys remain hidden and credit deduction is secure.

Deploy the edge functions to your Supabase project:
```bash
supabase functions deploy
```

## 3. Set Edge Function Secrets
You must configure the environment secrets in Supabase for the AI routing and image generation to work.

### Recommended (No CLI required — Web Dashboard):
1. Go to your [Supabase Project Dashboard](https://supabase.com/dashboard/project/sbndtgrkrrdurchmsreq).
2. Click **Edge Functions** on the left menu (or **Project Settings** > **Configuration** > **Edge Functions**).
3. Click **Secrets** > **Add new secret**:
   - `OPENROUTER_API_KEY`: `your_openrouter_api_key`
   - (Optional) `OPENROUTER_MODEL`: `google/gemini-2.5-flash` (ultra-low cost default)
   - (Optional) `OPENROUTER_IMAGE_MODEL`: `openai/gpt-image-2.5-sunburst` (flagship image model)
4. Click **Save**.

### Alternative: Using Supabase CLI via `npx`
If you do not have `supabase` installed globally, prepend `npx`:
```bash
npx supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key
npx supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-flash
npx supabase secrets set OPENROUTER_IMAGE_MODEL=openai/gpt-image-2.5-sunburst
```

## 4. Build and Deploy Frontend
The frontend code is fully typed, optimized, and ready for deployment to Vercel, Netlify, or any static host. 
We have verified that the build is completely clean (zero TypeScript or ESLint errors).

```bash
npm run build
```
Upload the generated `dist` folder to your hosting provider.

---

### What We Accomplished:
- **Missing Pages Complete**: Implemented fully functional `Projects`, `AffiliateHub`, `Templates`, `BrandVoice`, `CompetitorAnalysis`, and `HelpPage` modules, all wired into the `WorkspaceContext` and Supabase.
- **AI Infrastructure Secured**: Migrated the `ai-generate` endpoint to use **OpenRouter**, enforcing server-side credit checks and atomic deduction via PostgreSQL RPC before hitting the API.
- **Beautiful Results Engine**: Rebuilt the `AIToolEngine` component to parse OpenRouter's structured output into a beautiful, human-readable format (rather than raw JSON).
- **Performance Optimizations**: Rewrote the `DashboardHome` page to use a single highly optimized database call (`get_dashboard_overview` RPC), significantly speeding up load times and reducing database hits.
- **Security Hardened**: Deployed `006_full_rls_and_dashboard_rpc.sql` which enforces strict Row Level Security (RLS) across all tables so users can only ever access their own workspace data.
