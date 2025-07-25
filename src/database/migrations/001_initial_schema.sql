-- src/database/migrations/001_initial_schema.sql
-- Fixed initial database schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    guild_id TEXT,
    level INTEGER DEFAULT 0,
    base_cp INTEGER DEFAULT 100,
    total_cp INTEGER DEFAULT 100,
    berries BIGINT DEFAULT 0,
    total_earned BIGINT DEFAULT 0,
    total_spent BIGINT DEFAULT 0,
    pity_count INTEGER DEFAULT 0,
    last_income TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_berries_non_negative CHECK (berries >= 0),
    CONSTRAINT check_level_non_negative CHECK (level >= 0),
    CONSTRAINT check_base_cp_positive CHECK (base_cp > 0),
    CONSTRAINT check_total_cp_positive CHECK (total_cp > 0)
);

-- Devil Fruits collection table  
CREATE TABLE IF NOT EXISTS user_devil_fruits (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    fruit_id VARCHAR(100) NOT NULL,
    fruit_name VARCHAR(255) NOT NULL,
    fruit_type VARCHAR(50) NOT NULL,
    fruit_rarity VARCHAR(50) NOT NULL,
    fruit_element VARCHAR(50) DEFAULT 'Unknown',
    fruit_fruit_type VARCHAR(50) DEFAULT 'Unknown',
    fruit_power TEXT NOT NULL,
    fruit_description TEXT,
    base_cp INTEGER NOT NULL,
    duplicate_count INTEGER DEFAULT 1,
    total_cp INTEGER NOT NULL,
    obtained_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_duplicate_count_positive CHECK (duplicate_count > 0),
    CONSTRAINT check_base_cp_positive CHECK (base_cp > 0)
);

-- Income tracking
CREATE TABLE IF NOT EXISTS income_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount BIGINT NOT NULL,
    cp_at_time INTEGER NOT NULL,
    income_type VARCHAR(50) DEFAULT 'automatic',
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_cp_at_time_positive CHECK (cp_at_time > 0)
);

-- Command usage statistics
CREATE TABLE IF NOT EXISTS command_usage (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    command_name VARCHAR(100) NOT NULL,
    guild_id TEXT,
    success BOOLEAN DEFAULT true,
    execution_time INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
CREATE INDEX IF NOT EXISTS idx_users_total_cp ON users(total_cp DESC);
CREATE INDEX IF NOT EXISTS idx_users_berries ON users(berries DESC);
CREATE INDEX IF NOT EXISTS idx_devil_fruits_user ON user_devil_fruits(user_id);
CREATE INDEX IF NOT EXISTS idx_income_history_user ON income_history(user_id);
CREATE INDEX IF NOT EXISTS idx_command_usage_user ON command_usage(user_id);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
