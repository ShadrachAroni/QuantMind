# QuantMind App Operational Rules

## 1. Feature Entitlements

### **AI_TUNING (Custom AI Integration)**
- **Availability**: **PRO** and **PLUS** tiers only.
- **Rules**:
  - Users MUST provide their own API keys for non-default models.
  - API keys are encrypted at rest and never shared between users.
  - Invalid keys result in immediate fallback to the QuantMind "Institutional" default model.

  - **Aesthetic**: All screens must adhere to the "Terminal Vault" design system (see [MOBILE_THEME_SYSTEM.md](./MOBILE_THEME_SYSTEM.md)).
  - **Feedback**: Every backend action must provide an visual indicator (ActivityIndicator/GlowEffect).

## 2. Data Governance

### **ENCRYPTION_VAULT**
- Keys for external AI providers are stored in the `user_ai_configs` table.
- Decryption is only permitted within the `ai-chat` Edge Function execution context.

### **CHANGELOG_SYSTEM**
- All production updates MUST be documented in the `app_changelog` table before deployment.
- Updates are tagged with impact levels: **Low**, **Medium**, **High**, **Critical**.

## 3. Compliance

### **GDPR_DATA_DELETION**
- Invoking the `delete_user_data` RPC will permanently scrub all simulations, portfolios, and AI configurations associated with the user ID.

---
*QuantMind OS Rules V1.0.4*
