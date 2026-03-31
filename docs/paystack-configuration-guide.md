# Paystack Configuration Guide

Follow these steps to securely finalize the Paystack billing integration for your application. This setup involves placing environment variables in your local development files, your Supabase deployment, and configuring your Paystack Dashboard.

## 1. Paystack Dashboard Configuration

First, log into your [Paystack Dashboard](https://dashboard.paystack.com/) and navigate to the various settings outlined below.

### A. Webhook URL
Your Supabase `paystack-webhook` Edge Function listens for payment events to automatically update user subscription statuses in your database.

1. Go to **Settings > API Keys & Webhooks**.
2. Paste the following URL into the **Webhook URL** field (replace `[YOUR_SUPABASE_PROJECT_REF]` with your actual project reference like `qvqczzyghhgzaesiwtkj`):
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/functions/v1/paystack-webhook
   ```
> [!NOTE]
> You do **not** need a separate webhook signature secret. Our backend uses your Paystack *Secret Key* to decrypt and verify the webhook payload natively via HMAC-SHA512.

### B. Callback URL
The Callback URL determines where Paystack returns your users after they complete their payment.

1. In the same **Settings > API Keys & Webhooks** page, locate the **Callback URL** field.
2. Set it based on your current environment:
   * **Local Development:** `http://localhost:3000/settings/billing`
   * **Production:** `https://your-live-domain.com/settings/billing`

### C. Create Subscription Plans
You must map your 3 application tiers to actual Paystack "Plans" under **Commerce > Plans**. 
Set the billing interval to **Monthly** and create the following:

1. **Plus Tier:** ~1,300 KES / $9.99
2. **Pro Tier:** ~3,400 KES / $24.99
3. **Student Tier:** ~650 KES / $5.00

Once created, Paystack gives you unique **Plan Codes** for each (e.g., `PLN_gx2y8abc123`). Copy these codes for the next step.

## 2. Environment Variables

### A. Supabase Edge Functions (Backend)
Your Edge Functions need the Paystack Secret Key to authenticate checkout/portal requests and securely parse HMAC webhook signatures.

Run the following command in your terminal using the Supabase CLI (or add it directly in the Supabase Dashboard under Edge Function Secrets):
```bash
supabase secrets set PAYSTACK_SECRET_KEY="sk_test_..." # Use your test or live secret key
```

### B. Next.js Dashboard (Frontend)
Your web application triggers initial checkouts and needs the exact Paystack Plan Code associated with the tier the user selected. Add these variables to your [apps/dashboard/.env](file:///c:/Projects/Quantmind%20Application/QuantMind/apps/dashboard/.env) or Vercel Environment Variables:

```env
# Required for Checkout Initialization
NEXT_PUBLIC_PAYSTACK_PLAN_PLUS="PLN_your_new_plus_code"
NEXT_PUBLIC_PAYSTACK_PLAN_PRO="PLN_your_new_pro_code"
NEXT_PUBLIC_PAYSTACK_PLAN_STUDENT="PLN_your_new_student_code"
```

### C. Expo Mobile App (Mobile)
Your React Native app works identically to the dashboard. Add these to your [apps/mobile/.env](file:///c:/Projects/Quantmind%20Application/QuantMind/apps/mobile/.env) or Expo EAS Environment Variables:

```env
# Required for Checkout Initialization
EXPO_PUBLIC_PAYSTACK_PLAN_PLUS="PLN_your_new_plus_code"
EXPO_PUBLIC_PAYSTACK_PLAN_PRO="PLN_your_new_pro_code"
EXPO_PUBLIC_PAYSTACK_PLAN_STUDENT="PLN_your_new_student_code"
```

## 3. Final Verification
1. Restart your development servers (`npm run dev` / `npx expo start --clear`) so they pick up the new [.env](file:///c:/Projects/Quantmind%20Application/QuantMind/supabase/functions/.env) values.
2. Sign up as a test user and click the **Upgrade to Pro** button to ensure the Paystack checkout flow initializes accurately and requests the correct price!
