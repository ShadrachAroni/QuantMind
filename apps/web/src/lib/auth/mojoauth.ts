/**
 * MojoAuth Integration Utility
 * 
 * Handles passwordless authentication flows (Magic Links & Passkeys).
 */

export interface MojoAuthSession {
  user_id: string;
  email: string;
  identifier: string;
  access_token: string;
}

export class MojoAuthService {
  private static instance: MojoAuthService;
  private apiKey: string = process.env.NEXT_PUBLIC_MOJOAUTH_API_KEY || '';

  private constructor() {}

  public static getInstance(): MojoAuthService {
    if (!MojoAuthService.instance) {
      MojoAuthService.instance = new MojoAuthService();
    }
    return MojoAuthService.instance;
  }

  /**
   * Initializes the MojoAuth Web SDK if needed.
   * This would typically be called in a useEffect in the Login component.
   */
  public async initMojoAuth(containerId: string, onSelect: (response: any) => void) {
    if (typeof window === 'undefined') return;

    // Load MojoAuth SDK dynamically if not present
    if (!(window as any).MojoAuth) {
      const script = document.createElement('script');
      script.src = 'https://cdn.mojoauth.com/js/mojoauth.min.js';
      script.async = true;
      document.head.appendChild(script);
      
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const mojoauth = new (window as any).MojoAuth(this.apiKey, {
      source: [{ type: 'email', feature: 'magiclink' }, { type: 'webauthn', feature: 'passkey' }],
      container: `#${containerId}`,
    });

    mojoauth.signIn().then(onSelect);
  }

  /**
   * Validates a MojoAuth token on the server-side proxy or edge function.
   */
  public async verifyToken(token: string) {
    // In a real implementation, this would hit /api/auth/mojo-verify
    // which then calls MojoAuth's management API to get user details.
    return { valid: true, token };
  }
}

export const mojoAuth = MojoAuthService.getInstance();
