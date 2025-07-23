-- src/database/migrations/001_initial_schema.sql
-- Initial database schema for One Piece Devil Fruit Gacha Bot

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
    last_income TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Devil Fruits collection table
CREATE TABLE IF NOT EXISTS user_devil_fruits (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
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
    obtained_at TIMESTAMP DEFAULT NOW()
);

-- User level tracking
CREATE TABLE IF NOT EXISTS user_levels (
    user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    current_level INTEGER DEFAULT 0,
    role_name VARCHAR(50),
    base_cp INTEGER DEFAULT 100,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Income tracking
CREATE TABLE IF NOT EXISTS income_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    cp_at_time INTEGER NOT NULL,
    income_type VARCHAR(50) DEFAULT 'automatic',
    created_at TIMESTAMP DEFAULT NOW()
);

-- PvP battle history
CREATE TABLE IF NOT EXISTS pvp_battles (
    id SERIAL PRIMARY KEY,
    battle_id TEXT UNIQUE NOT NULL,
    player1_id TEXT REFERENCES users(user_id),
    player2_id TEXT,
    winner_id TEXT,
    battle_type VARCHAR(50) DEFAULT 'pvp',
    turns_taken INTEGER DEFAULT 0,
    battle_data JSONB,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- Command usage statistics
CREATE TABLE IF NOT EXISTS command_usage (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id),
    command_name VARCHAR(100) NOT NULL,
    guild_id TEXT,
    success BOOLEAN DEFAULT true,
    execution_time INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System logs
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    component VARCHAR(100),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
CREATE INDEX IF NOT EXISTS idx_users_total_cp ON users(total_cp DESC);
CREATE INDEX IF NOT EXISTS idx_users_berries ON users(berries DESC);
CREATE INDEX IF NOT EXISTS idx_users_guild ON users(guild_id);

CREATE INDEX IF NOT EXISTS idx_devil_fruits_user ON user_devil_fruits(user_id);
CREATE INDEX IF NOT EXISTS idx_devil_fruits_fruit_id ON user_devil_fruits(fruit_id);
CREATE INDEX IF NOT EXISTS idx_devil_fruits_rarity ON user_devil_fruits(fruit_rarity);
CREATE INDEX IF NOT EXISTS idx_devil_fruits_obtained ON user_devil_fruits(obtained_at DESC);

CREATE INDEX IF NOT EXISTS idx_income_history_user ON income_history(user_id);
CREATE INDEX IF NOT EXISTS idx_income_history_type ON income_history(income_type);
CREATE INDEX IF NOT EXISTS idx_income_history_created ON income_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pvp_battles_player1 ON pvp_battles(player1_id);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_player2 ON pvp_battles(player2_id);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_winner ON pvp_battles(winner_id);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_started ON pvp_battles(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_command_usage_user ON command_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_command_usage_command ON command_usage(command_name);
CREATE INDEX IF NOT EXISTS idx_command_usage_created ON command_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC);

-- Add some useful constraints
ALTER TABLE users ADD CONSTRAINT check_berries_non_negative CHECK (berries >= 0);
ALTER TABLE users ADD CONSTRAINT check_level_non_negative CHECK (level >= 0);
ALTER TABLE users ADD CONSTRAINT check_base_cp_positive CHECK (base_cp > 0);
ALTER TABLE users ADD CONSTRAINT check_total_cp_positive CHECK (total_cp > 0);

ALTER TABLE user_devil_fruits ADD CONSTRAINT check_duplicate_count_positive CHECK (duplicate_count > 0);
ALTER TABLE user_devil_fruits ADD CONSTRAINT check_base_cp_positive CHECK (base_cp > 0);

ALTER TABLE income_history ADD CONSTRAINT check_cp_at_time_positive CHECK (cp_at_time > 0);

-- Add trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_levels_updated_at BEFORE UPDATE ON user_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
