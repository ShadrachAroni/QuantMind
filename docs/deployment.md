# QuantMind Deployment Guide

This document outlines the steps to deploy the various components of the QuantMind monorepo from staging to production.

## 1. Supabase (Backend & Database)

QuantMind uses Supabase for Authentication, PostgreSQL Database (with RLS), and Edge Functions.

### Database Migrations
Deploy your schema changes:
```bash
supabase db push
```

### Edge Functions
Deploy the API gateways:
```bash
supabase functions deploy ai-chat
supabase functions deploy support-ai-reply
supabase functions deploy simulate
```

### Production Secrets
Ensure all production secrets are set. See [supabase-secrets.md](./supabase-secrets.md) for the required keys.
```bash
supabase secrets set GEMINI_API_KEY=your_key SIMULATION_SECRET_KEY=your_key ...
```

---

## 2. Simulation Service (High-Performance Engine)

The Python FastAPI engine handles the heavy Monte Carlo computations. It is typically deployed on **Render**, **Railway**, or **Heroku**.

### Docker Deployment (Recommended)
The service includes a `Dockerfile`. Point your hosting provider to the root of the project with the following build context:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app`
- **Environment Variables**:
  - `SIMULATION_SECRET_KEY`: Must match the value in Supabase.
  - `SUPABASE_URL`: Your project URL.
  - `SUPABASE_SERVICE_ROLE_KEY`: For restricted data access.

### Hugging Face Spaces (Free High-Performance Hosting)
For "Heavy" simulations, Hugging Face Spaces is recommended over Render's free tier due to its 16GB RAM allowance.

1. **Create Space**: Create a new Space on [huggingface.co/new-space](https://huggingface.co/new-space).
2. **SDK**: Choose **Docker**.
3. **Upload**: Push the contents of `apps/simulation` (including the `Dockerfile`) to the Space's repository.
4. **Configuration**:
   - The `Dockerfile` is pre-configured to run on port `7860`.
   - In **Settings > Variables and secrets**, add `SIMULATION_SECRET_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.

**See also**: [Detailed Step-by-Step Guide for Hugging Face Spaces](./huggingface-deployment.md)

---

## 3. Mobile App (Expo / React Native)

We use **EAS (Expo Application Services)** for building and distributing the mobile app.

### Configuration
1. Login to Expo: `npx eas login`
2. Configure project: `npx eas build:configure`

### Build for Distribution
To create production builds for the stores:
```bash
# Android
npx eas build --platform android --profile production

# iOS
npx eas build --platform ios --profile production
```

### Over-the-Air Updates (OTA)
To push quick JS fixes without store re-submission:
```bash
npx eas update --branch production --message "Fixed AI context injection"
```

---

## 4. Web & Dashboard (Next.js)

The marketing site (`apps/web`) and management portal (`apps/dashboard`) are optimized for **Vercel** or **Netlify**.

1. Connect your repository to Vercel/Netlify.
2. Set the **Root Directory** to `apps/web` or `apps/dashboard`.
3. Configure **Environment Variables** (see `docs/env-setup.md`).
4. Enable **NPM Workspaces** in the build settings.

---

## Deployment Checklist
- [ ] Database migrations successfully applied (`supabase db push`).
- [ ] Edge Functions deployed and secrets verified.
- [ ] Simulation backend is healthy (check `/health` endpoint).
- [ ] Mobile app `env` points to the production Supabase URL.
- [ ] RevenueCat webhooks configured for the production URL.
