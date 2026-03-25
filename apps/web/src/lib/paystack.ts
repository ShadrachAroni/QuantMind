import { Paystack } from 'paystack-sdk';

/**
 * QuantMind Paystack Integration Helper
 * Used for managing institutional subscription tiers and secure transaction cycles.
 */
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY || '');

export const PaystackHelper = {
  /**
   * Initialize a secure transaction and retrieve checkout URL
   */
  async initializeTransaction(email: string, amount: number, metadata: any, plan?: string, startDate?: string) {
    try {
      const response = await paystack.transaction.initialize({
        email,
        amount: (amount * 100).toString(), // Paystack uses kobo/cents
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/paystack/callback`,
        metadata: metadata,
        plan: plan,
        start_date: startDate
      } as any);

      if (!response.status) throw new Error(response.message);
      return response.data;
    } catch (error: any) {
      console.error('[Paystack_Init_Error]', error);
      throw error;
    }
  },

  /**
   * Verify transaction status via reference ID
   */
  async verifyTransaction(reference: string) {
    try {
      const response = await paystack.transaction.verify(reference);
      if (!response.status) throw new Error(response.message);
      return response.data;
    } catch (error: any) {
      console.error('[Paystack_Verify_Error]', error);
      throw error;
    }
  },

  /**
   * Create a plan in Paystack (e.g. for PLUS, PRO tiers)
   */
  async createPlan(name: string, amount: number, interval: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually') {
    try {
      const response = await paystack.plan.create({
        name,
        amount: amount * 100,
        interval,
        currency: 'NGN' // Default for Paystack
      });
      return response.data;
    } catch (error: any) {
      console.error('[Paystack_Plan_Error]', error);
      throw error;
    }
  }
};
