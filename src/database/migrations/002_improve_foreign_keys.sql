-- src/database/migrations/002_fix_foreign_keys_simple.sql
-- Simple migration without complex syntax that might cause issues

-- Add missing tables first
CREATE TABLE IF NOT EXISTS user_levels (
    user_id TEXT PRIMARY KEY,
    level INTEGER DEFAULT 0,
    experience BIGINT DEFAULT 0,
    total_experience BIGINT DEFAULT 0,
    prestige_level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_statistics (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    stat_type VARCHAR(100) NOT NULL,
    value BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pvp_battles (
    battle_id VARCHAR(100) PRIMARY KEY,
    player1_id TEXT NOT NULL,
    player2_id TEXT NOT NULL,
    winner_id TEXT,
    battle_type VARCHAR(50) DEFAULT 'ranked',
    battle_data TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    component VARCHAR(100),
    message TEXT NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pull_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    fruit_id VARCHAR(100),
    fruit_name VARCHAR(255),
    fruit_rarity VARCHAR(50),
    pity_used BOOLEAN DEFAULT FALSE,
    pity_count INTEGER DEFAULT 0,
    cost_paid INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_total_cp ON users(total_cp DESC);
CREATE INDEX IF NOT EXISTS idx_users_berries ON users(berries DESC);

CREATE INDEX IF NOT EXISTS idx_devil_fruits_user_id_fruit_id ON user_devil_fruits(user_id, fruit_id);
CREATE INDEX IF NOT EXISTS idx_devil_fruits_rarity ON user_devil_fruits(fruit_rarity);
CREATE INDEX IF NOT EXISTS idx_devil_fruits_obtained_at ON user_devil_fruits(obtained_at DESC);

CREATE INDEX IF NOT EXISTS idx_income_history_user_id_created_at ON income_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_income_history_income_type ON income_history(income_type);

CREATE INDEX IF NOT EXISTS idx_command_usage_user_id_created_at ON command_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_command_usage_command_name ON command_usage(command_name);
CREATE INDEX IF NOT EXISTS idx_command_usage_success ON command_usage(success);

CREATE INDEX IF NOT EXISTS idx_system_logs_level_created_at ON system_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);

CREATE INDEX IF NOT EXISTS idx_pull_history_user_rarity ON pull_history(user_id, fruit_rarity);
CREATE INDEX IF NOT EXISTS idx_pull_history_created_at ON pull_history(created_at DESC);

-- Add unique constraints where needed
ALTER TABLE user_statistics ADD CONSTRAINT user_statistics_user_stat_unique UNIQUE(user_id, stat_type) ON CONFLICT DO NOTHING;

-- Fix any existing data issues
UPDATE users SET berries = 0 WHERE berries < 0;
UPDATE users SET total_cp = base_cp WHERE total_cp < base_cp;
UPDATE users SET base_cp = 100 WHERE base_cp < 100;
UPDATE users SET level = 0 WHERE level < 0;
UPDATE users SET pity_count = 0 WHERE pity_count < 0;
UPDATE users SET pity_count = 1500 WHERE pity_count > 1500;

-- Ensure all users have required fields
UPDATE users SET 
    username = COALESCE(username, 'Unknown'),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW()),
    last_income = COALESCE(last_income, NOW())
WHERE username IS NULL 
   OR created_at IS NULL 
   OR updated_at IS NULL 
   OR last_income IS NULL;
