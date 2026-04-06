# QuantMind OmniWealth: Identity & Governance Spec

This document outlines the institutional-grade security architecture of the QuantMind OmniWealth platform, ensuring high-performance authorization and biometric-first identity across Web, Dashboard, and Mobile.

---

## 1. Identity & Authentication (MojoAuth)
QuantMind utilizes **MojoAuth** as its primary identity provider, implementing a biometric-first, passwordless philosophy.

### **Multi-Platform Methods**
*   **Passkeys (WebAuthn)**: Primary login method on Web and Mobile (Secure Enclave/Keystore).
*   **Magic Links**: OTP-less email verification for seamless cross-device onboarding.
*   **Email OTP**: 6-digit secondary fallback for low-trust environments.
*   **OAuth Bridge**: Google & Apple identity verification linked to the MojoAuth profile.

### **Biometric Bridge (Mobile)**
On the mobile platform (`apps/mobile`), MojoAuth sessions are bridged with native hardware using `expo-local-authentication`. 
- **FaceID/TouchID** serves as a pre-verified AAL2 factor.
- Sessions are cached securely in the device's keychain, allowing for instant biometric re-authentication without round-trips to the identity provider.

---

## 2. Governance & Authorization (Warrant)
QuantMind implements a **Relationship-Based Access Control (ReBAC)** model using a local architecture for maximum performance and zero external API latency.

### **The Warrant Local Mesh**
- **Architecture**: The `WarrantService` operates as a local logic layer within the application boundary.
- **Relational Model**:
    - **Objects**: Portfolios, Assets, Organizations.
    - **Relations**: `viewer`, `editor`, `owner`.
- **Enforcement**: 
    - **Web**: Next.js Middleware gates routes based on local relation checks.
    - **Mobile**: The `authStore` provides an `isAuthorized` hook for granular UI component visibility (e.g., hiding "Liquidate" buttons for `viewers`).

---

## 3. Financial Engine Security
Data integrity and privacy for the unified market data mesh:
- **Provider Aggregation**: Signed requests to **Finage** and **Marketstack** via backend proxies.
- **Encryption**: API keys are managed via **Vercel Env** and **Supabase Vault**, never exposed to the client.
- **Offline Integrity**: Mobile exchange rates are cached via `AsyncStorage` with a 1-hour TTL and cryptographic validation.

---

## 4. Multi-Factor Authentication (MFA)
QuantMind enforces a strict **AAL2 (Authenticator Assurance Level 2)** requirement for all institutional accounts.

| Factor | Implementation | Platform |
|---|---|---|
| **Biometric Passkey** | MojoAuth / WebAuthn | Web + Mobile |
| **Authenticator (TOTP)** | RFC 6238 Standard | Web + Mobile |
| **Hardware Key** | FIDO2 / Yubikey | Web (Production) |

---

## 5. Deployment & Secrets Management
Identity and security configurations are synchronized across the ecosystem automatically:
- **Vercel**: `quantmind` and `quantmind-dashboard` production environments.
- **Supabase**: Edge Functions utilizing the modern `sb_publishable_` keys and Vault secrets.
- **GitHub Actions**: CI/CD pipeline verifies security parity before deployment.

---

## 6. Security Roadmap
- **Q3 2026**: Implementation of Risk-based Session Fingerprinting.
- **Q4 2026**: Hardware Security Key support for Native Mobile.
- **Q1 2027**: Zero-Knowledge (ZK) Proofs for privacy-preserving portfolio auditing.
