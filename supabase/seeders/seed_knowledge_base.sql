-- Seed Knowledge Base Articles for RAG support
INSERT INTO knowledge_base_articles (title, slug, content, category, tags, is_published)
VALUES 
(
    'Understanding QuantMind Simulations', 
    'understanding-simulations', 
    'QuantMind uses Geometric Brownian Motion (GBM) and Fat-Tail distribution models to simulate asset paths. GBM is suitable for stocks following a random walk, while Fat-Tail models account for extreme market events (black swans). You can configure the number of paths (up to 10,000 for Pro users) and the time horizon.', 
    'Education', 
    ARRAY['simulations', 'math', 'risk'], 
    true
),
(
    'Subscription Tiers and Limits', 
    'subscription-tiers', 
    'QuantMind offers three tiers: Free (1 portfolio, basic simulations), PLUS (5 portfolios, 1,000 paths), and PRO (Unlimited portfolios, 10,000 paths, full Opus AI access). PRO users also receive real-time radar-sweep data priorities.', 
    'Billing', 
    ARRAY['billing', 'tiers', 'pro'], 
    true
),
(
    'Configuring Real-Time Data', 
    'real-time-data-setup', 
    'Real-time data is ingested via the ASTERIX pipeline from Twelve Data. To ensure your dashboard is live, verify that the market-stream edge function is active in your system status. PRO users experience zero-latency radar sweeps.', 
    'Technical', 
    ARRAY['asterix', 'data', 'real-time'], 
    true
),
(
    'Data Privacy and Compliance', 
    'data-privacy', 
    'QuantMind is fully compliant with DPA 2019 and GDPR. You can request a full archive of your simulation paths and portfolio data from the settings menu. Deleting your account will initiate a cryptographic purge of all sub-processor data within 72 hours.', 
    'Legal', 
    ARRAY['privacy', 'compliance', 'legal'], 
    true
);
