export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  tier: 'free' | 'plus' | 'pro' | 'student';
  paystack_plan_code?: string; // Optional, if using Paystack Plans
}

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'plan_explorer',
    name: 'Explorer',
    price: 0,
    interval: 'monthly',
    tier: 'free',
    features: [
      '1 Institutional Portfolio',
      'Basic Monte Carlo Simulations',
      'Daily Asset Sync',
      'Community Support'
    ]
  },
  {
    id: 'plan_plus',
    name: 'QuantMind Plus',
    price: 9.99,
    interval: 'monthly',
    tier: 'plus',
    paystack_plan_code: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PLUS || 'PLN_plus_123',
    features: [
      '5 Institutional Portfolios',
      'Advanced Risk Metrics',
      'AI-Powered Insights',
      'Priority Node Access'
    ]
  },
  {
    id: 'plan_plus_yearly',
    name: 'QuantMind Plus (Yearly)',
    price: 99,
    interval: 'yearly',
    tier: 'plus',
    paystack_plan_code: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PLUS_YEARLY || 'PLN_plus_yearly_123',
    features: [
      '5 Institutional Portfolios',
      'Advanced Risk Metrics',
      'AI-Powered Insights',
      'Priority Node Access',
      'Save 17% overall'
    ]
  },
  {
    id: 'plan_pro',
    name: 'QuantMind Pro',
    price: 24.99,
    interval: 'monthly',
    tier: 'pro',
    paystack_plan_code: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PRO || 'PLN_pro_456',
    features: [
      'Unlimited Portfolios',
      'Oracle AI Full Integration',
      'Custom Model Deployment',
      '24/7 Dedicated Support'
    ]
  },
  {
    id: 'plan_pro_yearly',
    name: 'QuantMind Pro (Yearly)',
    price: 229,
    interval: 'yearly',
    tier: 'pro',
    paystack_plan_code: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PRO_YEARLY || 'PLN_pro_yearly_456',
    features: [
      'Unlimited Portfolios',
      'Oracle AI Full Integration',
      'Custom Model Deployment',
      '24/7 Dedicated Support',
      'Save 23% overall'
    ]
  },
  {
    id: 'plan_student',
    name: 'Academic',
    price: 5,
    interval: 'monthly',
    tier: 'student',
    paystack_plan_code: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_STUDENT || 'PLN_student_789',
    features: [
      '3 Institutional Portfolios',
      'Educational Resources',
      'Standard Simulations',
      'Student Verification Required'
    ]
  }
];
