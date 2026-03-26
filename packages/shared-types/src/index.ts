// Quantmind Shared Types
// Core type definitions used across all surfaces

// ==================== User & Auth Types ====================

export interface User {
    id: string;
    email: string;
    created_at: string;
    updated_at?: string;
    email_verified: boolean;
    tier: SubscriptionTier;
    metadata?: UserMetadata;
}

export interface UserMetadata {
    full_name?: string;
    avatar_url?: string;
    onboarding_completed: boolean;
}

export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'student';

export interface Subscription {
    id: string;
    user_id: string;
    tier: SubscriptionTier;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
}

// ==================== Portfolio Types ====================

export interface Portfolio {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    assets: Asset[];
    total_value?: number;
    correlation_matrix?: number[][];
    created_at: string;
    updated_at: string;
}

export interface Asset {
    id?: string;
    ticker: string;
    name: string;
    weight: number; // 0-1
    expected_return?: number; // Annual return (μ)
    volatility?: number; // Annual volatility (σ)
    dividend_yield?: number; // Annual dividend yield
    asset_class?: AssetClass;
    exchange?: string;
}

export type AssetClass =
    | 'stocks'
    | 'bonds'
    | 'commodities'
    | 'crypto'
    | 'cash'
    | 'real_estate'
    | 'other';

// ==================== Simulation Types ====================

export interface SimulationParams {
    portfolio_id: string;
    num_paths: number;
    time_horizon_years: number;
    initial_value: number;
    risk_free_rate?: number;
    correlation_matrix?: number[][];
    model_type?: SimulationModel;
}

export type SimulationModel =
    | 'gbm'  // Geometric Brownian Motion
    | 'jump_diffusion'
    | 'fat_tails'
    | 'regime_switching';

export interface SimulationResult {
    id: string;
    user_id: string;
    portfolio_id: string;
    params: SimulationParams;
    metrics: RiskMetrics;
    percentile_paths: PercentilePaths;
    terminal_values?: number[];
    created_at: string;
    is_cached?: boolean;
    cached_from?: string;
}

export interface RiskMetrics {
    // Return Metrics
    expected_return: number;
    expected_return_annualized: number;

    // Risk Metrics
    volatility: number;
    volatility_annualized: number;

    // VaR & CVaR
    var_95: number; // Value at Risk at 95%
    var_99: number;
    cvar_95: number; // Conditional VaR
    cvar_99: number;

    // Ratio Metrics
    sharpe_ratio: number;
    sortino_ratio: number;

    // Drawdown Metrics
    max_drawdown: number;
    max_drawdown_duration: number;

    // Probability Metrics
    probability_of_loss: number;
    probability_of_breakeven: number;
    probability_of_target_return: number;

    // Distribution Stats
    skewness: number;
    kurtosis: number;
    median_return: number;
}

export interface PercentilePaths {
    p5: number[];
    p10: number[];
    p25: number[];
    p50: number[]; // Median
    p75: number[];
    p90: number[];
    p95: number[];
}

// ==================== Market Data Types ====================

export interface NormalizedPrice {
    symbol: string;
    price: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
    timestamp: string;
    source: 'alpha_vantage' | 'twelve_data' | 'yahoo' | 'finnhub';
}

export interface AssetSearchResult {
    ticker: string;
    name: string;
    exchange: string;
    asset_class: AssetClass;
}

export interface HistoricalData {
    symbol: string;
    prices: NormalizedPrice[];
    expected_return: number;
    volatility: number;
    period_start: string;
    period_end: string;
}

// ==================== AI Types ====================

export interface AIConversation {
    id: string;
    user_id: string;
    messages: AIMessage[];
    created_at: string;
    updated_at: string;
}

export interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    model?: string;
    workflow?: string;
    created_at: string;
    feedback?: 'up' | 'down';
}

export interface AIRequest {
    message: string;
    context?: AIContext;
    workflow?: AIWorkflow;
}

export interface AIContext {
    portfolio_id?: string;
    simulation_result_id?: string;
    asset_tickers?: string[];
}

export type AIWorkflow =
    | 'portfolio_doctor'
    | 'var_explanation'
    | 'scenario_analysis'
    | 'goal_planning'
    | 'general_assistant';

export interface AIResponse {
    message: string;
    model: string;
    workflow?: string;
    tokens_used?: number;
}

// ==================== API Response Types ====================

export interface APIResponse<T> {
    data?: T;
    error?: APIError;
}

export interface APIError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    page_size: number;
    has_more: boolean;
}

// ==================== Tier Entitlements ====================

export interface TierEntitlements {
    max_portfolios: number;
    max_simulation_paths: number;
    max_ai_messages_per_day: number;
    allow_advanced_models: boolean;
    allow_pdf_export: boolean;
    allow_custom_scenarios: boolean;
    allow_market_streaming: boolean;
    allow_ai_tuning: boolean;
    allow_asset_management: boolean;
    allow_backtest: boolean;
    allow_correlation_matrix: boolean;
}

export const TIER_ENTITLEMENTS: Record<SubscriptionTier, TierEntitlements> = {
    free: {
        max_portfolios: 3,
        max_simulation_paths: 2000,
        max_ai_messages_per_day: 10,
        allow_advanced_models: false,
        allow_pdf_export: false,
        allow_custom_scenarios: false,
        allow_market_streaming: false,
        allow_ai_tuning: false,
        allow_asset_management: false,
        allow_backtest: false,
        allow_correlation_matrix: false,
    },
    plus: {
        max_portfolios: 10,
        max_simulation_paths: 10000,
        max_ai_messages_per_day: 50,
        allow_advanced_models: false,
        allow_pdf_export: true,
        allow_custom_scenarios: false,
        allow_market_streaming: true,
        allow_ai_tuning: true,
        allow_asset_management: true,
        allow_backtest: true,
        allow_correlation_matrix: true,
    },
    pro: {
        max_portfolios: -1, // Unlimited
        max_simulation_paths: 100000,
        max_ai_messages_per_day: -1, // Unlimited
        allow_advanced_models: true,
        allow_pdf_export: true,
        allow_custom_scenarios: true,
        allow_market_streaming: true,
        allow_ai_tuning: true,
        allow_asset_management: true,
        allow_backtest: true,
        allow_correlation_matrix: true,
    },
    student: {
        max_portfolios: 5,
        max_simulation_paths: 10000,
        max_ai_messages_per_day: 50,
        allow_advanced_models: false,
        allow_pdf_export: true,
        allow_custom_scenarios: false,
        allow_market_streaming: true,
        allow_ai_tuning: false,
        allow_asset_management: false,
        allow_backtest: true,
        allow_correlation_matrix: true,
    },
};
