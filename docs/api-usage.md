# QuantMind API Integration Guide

## Overview
QuantMind integrates with multiple external financial and AI providers. This guide outlines how we manage these integrations securely.

## AI Providers

### 1. Default Logic (Institutional)
By default, the `ai-chat` Edge Function uses QuantMind's system-level API keys (Stored in Supabase Vault) to provide access to Claude models for all users.

### 2. Custom Key Protocol (Pro/Plus)
Authorized users can connect their own AI instances:
- **Provider Support**: Anthropic (`claude-3`), OpenAI (`gpt-4`), Google (`gemini-1.5`).
- **Storage**: Keys are encrypted with **AES-256** using `pgcrypto` before being stored in `user_ai_configs`.
- **Injection**: The Edge Function decrypts the user's key just-in-time and injects it into the request headers, bypassing system-level defaults.

## Financial Data Providers

### 1. Alpha Vantage
- **Primary Use**: Real-time equity and forex price feeds.
- **Deduplication**: Price data is cached in the `prices` table and updated every 60 seconds.

### 2. Twelve Data
- **Primary Use**: Historical data for backtesting and portfolio correlation matrices.
- **Latency**: Managed through asynchronous background processing in `ota_rollout_events`.

## Error Handling
- **Provider Outages**: System automatically falls back to secondary providers if the primary (e.g., Anthropic) returns a 5XX error.
- **Invalid Keys**: If a user's custom key is invalid, the system reverts to the "Institutional" default model to ensure continuity of service.
