# Environment Setup & Credentials

## 🔑 Key Configuration

### 1. Supabase (Database & Auth)
- `SUPABASE_URL`: Project API gateway URL.
- `SUPABASE_ANON_KEY`: Public-facing key for mobile client access.
- `SUPABASE_SERVICE_ROLE_KEY`: **CRITICAL**. Only for backend/Edge Function use.

### 2. Encryption (Secure Vault)
- `CUSTOM_AI_ENCRYPTION_KEY`: **REQUIRED**. Used for pgcrypto AES-256 sym encryption/decryption of user API keys.
  - **Dev Fallback**: `development_fallback_key`
  - **Prod**: Must be set via the Supabase Dashboard Dashboard for the `ai-chat` Edge Function.

## ⚙️ Local Development Setup

1. **Clone & Install**:
   ```bash
   git clone [repository_url]
   npm install
   ```

2. **Supabase CLI**:
   Follow instructions to link your local CLI to the cloud project.
   ```bash
   supabase link --project-ref [ref]
   ```

3. **Running the Mobile App**:
   Follow the monorepo guide to start the Expo developer menu.
   ```bash
   npm run dev --filter quantmind
   ```

## 🛡️ Best Practices
- **NEVER** commit `.env` files to the repository.
- Use `supabase vault` for highly sensitive keys when possible.
- Rotate the `CUSTOM_AI_ENCRYPTION_KEY` only during scheduled maintenance windows as it would require re-encrypting existing user data.
