-- QuantMind Migration: Stripe Billing Schema
-- This migration updates the necessary tables to secure credit card processing via Stripe.

-- Add Stripe mapping fields to the existing subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;

-- Create stripe_invoices table for transaction logging, reconciliation, and audit trail
CREATE TABLE IF NOT EXISTS public.stripe_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_subscription_id VARCHAR(255),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_paid numeric(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- paid, open, uncollectible, void
    invoice_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for stripe_invoices to ensure strict access control
ALTER TABLE public.stripe_invoices ENABLE ROW LEVEL SECURITY;

-- Policy to ensure users can only view their own invoices (Consumer Privacy and Data Security)
CREATE POLICY "Users can view their own stripe invoices" 
ON public.stripe_invoices FOR SELECT USING (auth.uid() = user_id);

-- NOTE: All writes to stripe_invoices are done by the secure backend (Edge Functions) using service role,
-- so we deliberately omit INSERT/UPDATE/DELETE policies for authenticated users.
