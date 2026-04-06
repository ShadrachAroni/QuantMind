import * as Linking from 'expo-linking';
import axios from 'axios';

/**
 * MojoAuth Mobile Service
 * Handles passwordless authentication (Magic Link/OTP) for Expo/React Native.
 */
class MojoAuthMobile {
  private static instance: MojoAuthMobile;
  private apiKey: string = process.env.NEXT_MOJOAUTH_API_KEY || '';

  private constructor() {}

  public static getInstance(): MojoAuthMobile {
    if (!MojoAuthMobile.instance) {
      MojoAuthMobile.instance = new MojoAuthMobile();
    }
    return MojoAuthMobile.instance;
  }

  /**
   * Senders a Magic Link to the user's email.
   * On mobile, the Magic Link should point to a deep-link URL.
   */
  async sendMagicLink(email: string): Promise<boolean> {
    try {
      const redirectUrl = Linking.createURL('auth/callback');
      const response = await axios.post(`https://api.mojoauth.com/v1/magiclink/send`, {
        email,
        redirect_url: redirectUrl,
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });
      return response.status === 200;
    } catch (error) {
      console.error('MojoAuth MagicLink Error:', error);
      return false;
    }
  }

  /**
   * Sends an OTP to the user's email as a fallback.
   */
  async sendEmailOTP(email: string): Promise<boolean> {
    try {
      const response = await axios.post(`https://api.mojoauth.com/v1/otp/send`, {
        email,
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });
      return response.status === 200;
    } catch (error) {
      console.error('MojoAuth OTP Error:', error);
      return false;
    }
  }

  /**
   * Verifies the OTP code.
   */
  async verifyOTP(email: string, otp: string, stateId: string): Promise<any> {
    try {
      const response = await axios.post(`https://api.mojoauth.com/v1/otp/verify`, {
        email,
        otp,
        state_id: stateId,
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });
      return response.data;
    } catch (error) {
      console.error('MojoAuth Verify Error:', error);
      throw error;
    }
  }
}

export const mojoAuth = MojoAuthMobile.getInstance();
