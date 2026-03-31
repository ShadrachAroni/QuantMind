Here's your enhanced, implementation-ready prompt:

---

# Authentication & Security Flow — Implementation Spec

## 1. Sign Up Methods
Users can register via:
- **Google OAuth**
- **Apple OAuth**
- **Email + Password** (manual account creation)

---

## 2. Login Methods
Users can authenticate via:
- **Google OAuth**
- **Apple OAuth**
- **Email + Password**
- Email + Password
- **Biometrics / Passkey** *(Mobile native or WebAuthn on Web)*

---

## 3. Two-Factor Authentication (2FA) Options
The following 2FA methods can be configured in **Settings**:

| Method | Platform Availability | Notes |
|---|---|---|
| Email OTP | Web + Mobile | 6-digit code sent via SMTP |
| Authenticator App (TOTP) | Web + Mobile | RFC 6238 compliant (Google Auth / Authy) |
| Biometrics / Passkey | Web + Mobile | WebAuthn (Web) or Secure Enclave (Mobile) |

---

## 4. Cross-Platform MFA Philosophy
- **Parity First**: Both Web and Mobile offer identical security posture.
- **Biometric Bypass**: Biometric login (Passkey/FaceID) serves as a pre-verified AAL2 factor, bypassing subsequent MFA challenges for maximum UX fluidity.
- **Mandatory Enforcement**: If a user has enrolled in any MFA factor, dashboard access is gated by an AAL2 requirement.

---

## 5. Post-Login 2FA Challenge Logic

After successful credential verification, the system enforces AAL2 assurance:

```
User submits credentials (password or OAuth)
        │
        ▼
Session initialized (AAL1)
        │
        ▼
Does user have MFA factors enabled? (Supabase or Profile-based)
    ├── NO  → Grant access directly (Dashboard)
    └── YES → Check current Level:
                  │
                  ├── Session is AAL2? (Biometric Login)
                  │       → Grant access directly
                  │
                  └── Session is AAL1?
                          → Trigger MFAChallengeModal / MfaGuardian
                          → User verifies via TOTP, Email, or Passkey
                          → Grant access (AAL2)
```

---

## 8. Platform Feature Matrix (Verified)

| Feature | Web | Mobile |
|---|---|---|
| Sign up with Google / Apple | ✅ | ✅ |
| Sign up with Email | ✅ | ✅ |
| Login with Google / Apple | ✅ | ✅ |
| Login with Email + Password | ✅ | ✅ |
| Login with Biometrics / Passkey | ✅ | ✅ |
| 2FA via Email OTP | ✅ | ✅ |
| 2FA via Authenticator App | ✅ | ✅ |
| 2FA via Biometrics / Passkey | ✅ | ✅ |
| MFA Setup in Settings | ✅ | ✅ |

---

## 9. Security Roadmap
- **V1.2.0**: SMS OTP Fallback Integration.
- **V1.3.0**: Risk-based Session Fingerprinting.
- **V1.4.0**: Hardware Security Key (FIDO2) support for Mobile.