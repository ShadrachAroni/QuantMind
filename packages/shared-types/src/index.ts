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
    model_config?: AdvancedModelConfig;
    optimization_params?: OptimizationParams;
    backtest_config?: {
        start_date: string;
        end_date: string;
        multi_timeframe: 'daily' | 'weekly' | 'monthly';
        use_realtime_streaming: boolean;
    };
}

export type SimulationModel =
    | 'gbm'  // Geometric Brownian Motion
    | 'jump_diffusion'
    | 'fat_tails'
    | 'regime_switching'
    | 'random_forest_regressor'
    | 'lstm_forecast';

export interface AdvancedModelConfig {
    // Fat Tails settings
    df?: number; // degrees of freedom
    
    // Jump Diffusion settings
    lambda_j?: number; // jump intensity
    mu_j?: number; // mean jump size
    sigma_j?: number; // jump volatility
    
    // ML/Training settings
    lookback_periods?: number;
    training_iterations?: number;
    learning_rate?: number;
    use_cross_validation?: boolean;
}

export interface OptimizationParams {
    method: 'mean_variance' | 'risk_parity' | 'black_litterman';
    target_return?: number;
    risk_tolerance?: number; // 0-1
    max_weight?: number; // 0-1
    min_weight?: number; // 0-1
    sector_constraints?: Record<string, [number, number]>;
}

export interface OptimizationSuggestion {
    method: string;
    suggested_weights: Record<string, number>;
    expected_return: number;
    expected_volatility: number;
    sharpe_improvement: number;
}

export interface SimulationResult {
    id: string;
    user_id: string;
    portfolio_id: string;
    params: SimulationParams;
    status: 'pending' | 'running' | 'completed' | 'failed';
    metrics: RiskMetrics;
    percentile_paths: PercentilePaths;
    terminal_values?: number[];
    error_message?: string;
    duration_ms?: number;
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

    // Pro / Granular Metrics
    drawdown_statistics?: {
        max_drawdown: number;
        avg_drawdown: number;
        max_drawdown_duration: number;
        avg_drawdown_duration: number;
        recovery_time_median: number;
    };
    attribution_analysis?: {
        sector_contributions: Record<string, number>;
        asset_class_contributions: Record<string, number>;
        top_performers: string[];
        bottom_performers: string[];
    };
    correlations?: number[][];
    volatility_regimes?: Array<{
        name: string;
        frequency: number;
        avg_vol: number;
    }>;
    sharpe_variation?: {
        rolling_sharpe_30d: number[];
        best_month: number;
        worst_month: number;
    };
    optimization_suggestion?: OptimizationSuggestion;
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
// ==================== Blockchain & On-Chain Types ====================

export type BlockchainNetwork = 'ethereum' | 'binance_smart_chain' | 'solana';

export interface UserWallet {
    id: string;
    user_id: string;
    address: string;
    network: BlockchainNetwork;
    alias?: string;
    is_active: boolean;
    metadata?: WalletMetadata;
    created_at: string;
    updated_at: string;
}

export interface WalletMetadata {
    last_balance_usd?: number;
    token_count?: number;
    ens_name?: string;
    portfolio_distribution?: Record<string, number>; // symbol -> weight
}

export interface OnChainTransaction {
    hash: string;
    network: BlockchainNetwork;
    block_number: number;
    from: string;
    to: string;
    value: string;
    fee: string;
    gas_used: number;
    status: 'success' | 'failed' | 'pending';
    method_name?: string;
    timestamp: string;
}

export interface GasMetrics {
    network: BlockchainNetwork;
    low: number;
    average: number;
    fast: number;
    unit: string; // Gwei, SOL, etc.
}

export interface DeFiPosition {
    protocol: string;
    network: BlockchainNetwork;
    type: 'staking' | 'lending' | 'farming';
    principal_symbol: string;
    principal_amount: number;
    reward_symbol: string;
    reward_amount: number;
    apy: number;
    last_updated: string;
}

// ==================== News Feed Types ====================

export interface NewsArticle {
    id: string;
    title: string;
    summary?: string;
    url: string;
    source: string;
    image_url?: string;
    published_at: string;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    categories: string[];
}

// ==================== Market Terminal Types ====================

export interface MarketTerminalConfig {
    symbol: string;
    indicators: string[];
    timeframe: string;
    favorite_pairs: string[];
}

export interface MarketDepth {
    bids: [number, number][]; // [price, quantity]
    asks: [number, number][];
    last_price: number;
    change_24h: number;
}

export interface MarketTick {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface MarketTicker {
    symbol: string;
    last_price: number;
    price_change_percent: number;
    high_24h: number;
    low_24h: number;
    volume_24h: string;
}
