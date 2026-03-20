# Data Handling and Security Documentation

## Architecture Overview
QuantMind leverages a multi-tenant architecture secured by **Supabase Row Level Security (RLS)** and **PostgreSQL** schema boundaries. All user data is isolated at the database level, ensuring that no user can access or modify another user's information.

## Authentication & Authorization
- **Identity Provider**: Supabase Auth (JWT-based).
- **Session Management**: Secure, encrypted cookies for web applications and secure storage for mobile devices.
- **MFA Support**: Multi-Factor Authentication is supported and can be enabled per-user in the profile settings.
- **RBAC**: Role-Based Access Control is enforced. Public users interact with `public` schemas using RLS, while administrative actions are restricted to the `service_role` through a hardened API gateway.

## Data Security Measures
### 1. Row Level Security (RLS)
Every table containing user-specific data has RLS enabled. Policies are defined to restrict access based on the authenticated user's ID (`auth.uid()`):
- **User Profiles**: Only the profile owner can read or update their information.
- **Portfolios**: Users only have access to portfolios they created.
- **Simulations**: Simulation parameters and results are strictly tied to the initiating user.
- **Simulation Paths**: Large vector data (Monte Carlo paths) is protected by cascading RLS logic.

### 2. Encryption
- **Data in Transit**: All communication between clients and servers is encrypted via TLS 1.3.
- **Data at Rest**: Database volumes and backups are encrypted using industry-standard AES-256 encryption.
- **Secrets Management**: Sensitive keys (API keys, recovery codes) are never stored in the repository and are managed via Supabase Vault or environment variables.

### 3. Immutable Auditing
Administrative actions are captured in an **immutable audit log**.
- Every change to user permissions, tier upgrades, or system configuration is logged with a timestamp, IP address, and the ID of the performing administrator.
- These logs are "insert-only" and cannot be modified or deleted, ensuring a reliable trail for compliance and security reviews.

## GDPR & CCPA Compliance
QuantMind provides built-in mechanisms for data privacy compliance:
- **Data Portability**: Users can export their portfolio and simulation results through the Executive Console.
- **Right to be Forgotten**: A dedicated `delete_user_data` procedure ensures that all PII and associated simulation data are purged from the system upon account deletion requests.
- **Analytics Consent**: Users can opt-in or opt-out of behavioral analytics tracking at any time.

## Infrastructure Integrity
- **Edge Functions**: Backend logic runs in isolated Deno Runtimes with restricted permissions.
- **Rate Limiting**: Protection against brute-force and DDoS attacks is implemented at the API Gateway level.
- **Dependency Scanning**: All project dependencies are regularly audited for known vulnerabilities.
