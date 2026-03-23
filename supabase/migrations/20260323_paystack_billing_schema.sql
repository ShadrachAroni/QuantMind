-- QuantMind Migration: Paystack Billing Schema
-- This migration updates the tables to process payments via Paystack.

-- Add Paystack mapping fields to the existing subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS paystack_customer_code text UNIQUE,
ADD COLUMN IF NOT EXISTS paystack_subscription_code text UNIQUE;

-- Create paystack_transactions table for transaction logging, reconciliation, and audit trail
CREATE TABLE IF NOT EXISTS public.paystack_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    status VARCHAR(50) NOT NULL,
    channel VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for paystack_transactions to ensure strict access control
ALTER TABLE public.paystack_transactions ENABLE ROW LEVEL SECURITY;

-- Policy to ensure users can only view their own transactions 
CREATE POLICY "Users can view their own paystack transactions" 
ON public.paystack_transactions FOR SELECT USING (auth.uid() = user_id);
