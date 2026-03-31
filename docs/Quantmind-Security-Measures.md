# QuantMind Security Measures

## 🔐 Data Encryption

### 1. Encryption at Rest
All user-provided API keys are encrypted at the database level using **AES-256 GCM** equivalent via the `pgcrypto` extension.
- **Algorithm**: `pgp_sym_encrypt` (PGP symmetric encryption).
- **Passphrase**: Managed via a dedicated environment variable (`CUSTOM_AI_ENCRYPTION_KEY`) strictly controlled by the service role.

### 2. Encryption in Transit
All traffic between the Mobile Terminal, Auth Edge, and Simulation Engine is forced over **TLS 1.3**. We use **HSTS** (HTTP Strict Transport Security) to prevent downgrade attacks.

## 🛡️ Authentication & Authorization

### 1. JWT Policy
QuantMind uses short-lived JWTs (60 minutes) with secure refresh token rotation handled by Supabase Auth (OIDC).

### 2. Tier-Based Entitlements
Access to premium features (Custom AI models, High-frequency risk alerts) is enforced via **Server-Side Entitlement Checks**:
- **Mechanism**: The `user_profiles.tier` field is evaluated in every Edge Function request.
- **Enforcement**: Tier-restricted screens in the mobile app act as a UI-level guard, but API-level checks ensure data integrity.

## 📁 Audit & Compliance

### 1. Admin Audit Log
The `admin_audit_log` table tracks all administrative actions performed on user accounts or system configurations. This table is **immutable** by design (No update/delete policies).

### 2. Changelog Protocol
The `app_changelog` system provides transparent tracking of all system updates, ensuring users are aware of security patches and performance fixes.

---
*QuantMind Security V1.0.4_STABLE*
