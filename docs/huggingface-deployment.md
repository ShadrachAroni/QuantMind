# QuantMind — Hugging Face Spaces Deployment Guide

This guide provides a professional, step-by-step walkthrough for deploying the "Heavy" Monte Carlo Simulation Service to Hugging Face Spaces using Docker.

## Why Hugging Face Spaces?
QuantMind simulations are computationally intensive. Hugging Face Spaces provides **2 vCPU cores and 16GB of RAM** for free on their Docker SDK, which significantly outperforms other free-tier providers like Render (512MB RAM).

---

## 🏗️ Phase 1: Preparation

Ensure you have the following files ready in your `apps/simulation` directory:
1.  **`app/main.py`**: The FastAPI application logic.
2.  **`requirements.txt`**: Lists `fastapi`, `numpy`, `scipy`, etc.
3.  **`Dockerfile`**: Configured for port `7860`.

---

## 🚀 Phase 2: Create the Space

1.  **Sign Up/Login**: Go to [huggingface.co](https://huggingface.co/) and log in.
2.  **New Space**: Click on your profile icon and select **"New Space"** or go directly to [huggingface.co/new-space](https://huggingface.co/new-space).
3.  **Configure Name**: Set the **"Space Name"** (e.g., `quantmind-simulation`).
4.  **License**: Choose **MIT** or any appropriate license.
5.  **Select SDK**: Choose **Docker**.
6.  **Template**: Choose **Blank** (default).
7.  **Visibility**: Keep it **Public** so your Supabase Edge Functions can reach the endpoint.
8.  **Create Space**: Click the button at the bottom.

---

## 📤 Phase 3: Upload Files

You can upload files via the web interface or Git.

### Option A: Web Interface
1.  Navigate to the **"Files"** tab of your new Space.
2.  Click **"Add file" > "Upload files"**.
3.  Drag and drop all files from `apps/simulation` (including the `app/` folder, `requirements.txt`, and `Dockerfile`).
4.  Click **"Commit changes to main"**.

### Option B: Git (Recommended)
```bash
# Clone the empty space
git clone https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME

# Copy files
cp -r apps/simulation/* YOUR_SPACE_NAME/

# Push to Hugging Face
cd YOUR_SPACE_NAME
git add .
git commit -m "Initial simulation engine deployment"
git push
```

---

## 🔐 Phase 4: Configure Secrets

Hugging Face Spaces needs your environment variables to connect to Supabase and verify requests.

1.  Go to the **"Settings"** tab of your Space.
2.  Scroll down to the **"Variables and secrets"** section.
3.  Clique **"New secret"** for each of the following:
    -   `SIMULATION_SECRET_KEY`: (Must match your Supabase secrets).
    -   `SUPABASE_URL`: (Your project URL).
    -   `SUPABASE_SERVICE_ROLE_KEY`: (From Supabase API settings).
    -   `ALLOWED_ORIGIN`: (e.g., `https://qvqczzyghhgzaesiwtkj.supabase.co`).

4.  **Restart Space**: Hugging Face will automatically rebuild and restart the Space when secrets are saved.

---

## ✅ Phase 5: Verification

Once the build status shows **"Running"** (green icon):

1.  **Health Check**: Visit your Space's direct URL + `/health`.
    -   Example: `https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/health`
    -   Expected: `{"status":"ok", "service":"quantmind-simulation"}`
2.  **Supabase Update**: Ensure your Supabase Edge Functions (like `ai-chat` or `simulate`) are updated to point to this new URL in their environment variables.

```bash
supabase secrets set SIMULATION_SERVICE_URL=https://YOUR_USER-YOUR_SPACE.hf.space
```

---

## 🛠️ Troubleshooting
- **OOM (Out of Memory)**: If your simulation crashes, check the "Logs" tab. While 16GB is usually enough, extremely high `num_paths` (e.g., millions) might hit the limit.
- **Port Error**: Ensure the `Dockerfile` uses `EXPOSE 7860` and the CMD runs on port `7860`.
