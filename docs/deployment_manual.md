# QuantMind Deployment & API Reference Manual

This document serves as the canonical guide for deploying the QuantMind ecosystem and provides a reference for all critical API endpoints and webhook configurations.

---

## 1. System Components & Deployment URLs

| Component | Technology | URL | Deployment Platform |
| :--- | :--- | :--- | :--- |
| **Main Web Terminal** | Next.js / React | [Quantmind.co.ke](https://Quantmind.co.ke) | Vercel |
| **Admin Dashboard** | Next.js / React | [quantmind-dashboard.vercel.app](https://quantmind-dashboard.vercel.app/) | Vercel |
| **Primary Backend** | Supabase Hub | [qvqczzyghhgzaesiwtkj.supabase.co](https://qvqczzyghhgzaesiwtkj.supabase.co) | Supabase |
| **Compute Nodes** | Docker / AI | [kingaroni-docker.hf.space](https://kingaroni-docker.hf.space/) | Hugging Face Spaces |
| **Mobile App** | React Native / Expo | `quantmind://` | Expo Application Services (EAS) |

---

## 2. API Endpoints Reference

### **Supabase Edge Functions**
All edge functions are hosted on the Supabase project: `https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/`

*   **`paystack-checkout`**: Initiates the secure payment session.
    *   **Method**: `POST`
    *   **Payload**: `{ "planCode": "PLN_..." }`
*   **`paystack-webhook`**: Processes real-time subscription events from Paystack.
    *   **Method**: `POST` (Triggered by Paystack)
*   **`paystack-cancel`**: Decommissions an active subscription.
    *   **Method**: `POST`

### **Web API Routes**
*   **`quantmind.co.ke/api/paystack/callback`**: Handles the post-payment redirection protocol.
    *   **Query Params**: `?platform=mobile|web` & `?reference=...`
    *   **Logic**: Cross-platform deep-linking to `quantmind://operator/billing` or web dashboard.

---

## 3. Webhook Configurations

### **Paystack Webhook**
To ensure real-time tier synchronization, configure the Paystack Dashboard with the following:

> [!IMPORTANT]
> **Webhook URL**: `https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/paystack-webhook`
> **Secret Key**: Ensure the `PAYSTACK_SECRET_KEY` matches between the Supabase Secrets and Paystack Dashboard settings.

---

## 4. Mobile Environment Deployment (EAS)

The mobile application uses **Expo Application Services (EAS)** for production builds and OTA (Over-the-Air) updates.

### **Environment Setup**
1.  **Install EAS CLI**: `npm install -g eas-cli`
2.  **Login**: `eas login`
3.  **Link Project**: `eas project:init`

### **Build Commands**
*   **Production (Android)**: `eas build --platform android --profile production`
*   **Production (iOS)**: `eas build --platform ios --profile production`
*   **Development Build**: `eas build --platform all --profile development`

### **Release (OTA Updates)**
*   To push instant fixes without a full store review:
    `eas update --branch production --message "Sync: Hardened Subscription Tiers"`

### **Deep Link Configuration**
The app is registered under the `quantmind://` scheme. Critical paths:
- `quantmind://operator/billing`: Redirects users to the Subscription page after payment.

---

## 5. Deployment Checklist (Production Readiness)

1.  **Vercel ENV**:
    - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are production-locked.
    - Verify `PAYSTACK_SECRET_KEY` is present in both Web and Dashboard projects.
2.  **Supabase Secrets**:
    - Set all `PAYSTACK_PLAN_*` codes for both monthly and yearly variants.
    - Set `PAYSTACK_SECRET_KEY` using `supabase secrets set`.
3.  **SSL/CORS**:
    - Web Terminal must have `https://Quantmind.co.ke` as an allowed origin in Supabase Authentication settings.
4.  **Compute Nodes (HF)**:
    - Ensure the Docker image on Hugging Face is utilizing the `SUPABASE_SERVICE_ROLE_KEY` for administrative simulation write-backs.
