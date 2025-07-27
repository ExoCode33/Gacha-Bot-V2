-- src/database/migrations/002_improve_foreign_keys.sql
-- Enhanced foreign key constraints and safety measures

-- Add missing foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key constraint for user_devil_fruits -> users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_devil_fruits_user_id_fkey'
    ) THEN
        ALTER TABLE user_devil_fruits 
        ADD CONSTRAINT user_devil_fruits_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE;
    END IF;

    -- Add foreign key constraint for income_history -> users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'income_history_user_id_fkey'
    ) THEN
        ALTER TABLE income_history 
        ADD CONSTRAINT income_history_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE;
    END IF;

    -- Add foreign key constraint for command_usage -> users (nullable)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'command_usage_user_id_fkey'
    ) THEN
        ALTER TABLE command_usage 
        ADD CONSTRAINT command_usage_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE SET NULL;  -- Allow NULL if user is deleted
    END IF;
END $$;

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

-- Add user levels table if it doesn't exist (referenced in some code)
CREATE TABLE IF NOT EXISTS user_levels (
    user_id TEXT PRIMARY KEY,
    level INTEGER DEFAULT 0,
    experience BIGINT DEFAULT 0,
    total_experience BIGINT DEFAULT 0,
    prestige_level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Add user statistics table for PvP and other stats
CREATE TABLE IF NOT EXISTS user_statistics (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    stat_type VARCHAR(100) NOT NULL,
    value BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(user_id, stat_type)
);

-- Add PvP battles table
CREATE TABLE IF NOT EXISTS pvp_battles (
    battle_id VARCHAR(100) PRIMARY KEY,
    player1_id TEXT NOT NULL,
    player2_id TEXT NOT NULL,
    winner_id TEXT,
    battle_type VARCHAR(50) DEFAULT 'ranked',
    battle_data JSONB,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Add system logs table for error tracking
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    component VARCHAR(100),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add pull history table for analytics
CREATE TABLE IF NOT EXISTS pull_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    fruit_id VARCHAR(100),
    fruit_name VARCHAR(255),
    fruit_rarity VARCHAR(50),
    pity_used BOOLEAN DEFAULT FALSE,
    pity_count INTEGER DEFAULT 0,
    cost_paid INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Add helpful functions for data cleanup
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    -- Delete system logs older than 30 days
    DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete command usage older than 90 days
    DELETE FROM command_usage WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete income history older than 180 days (6 months)
    DELETE FROM income_history WHERE created_at < NOW() - INTERVAL '180 days';
    
    -- Delete pull history older than 1 year
    DELETE FROM pull_history WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Add function to get user summary
CREATE OR REPLACE FUNCTION get_user_summary(input_user_id TEXT)
RETURNS TABLE(
    user_id TEXT,
    username VARCHAR(255),
    level INTEGER,
    berries BIGINT,
    total_cp INTEGER,
    total_fruits BIGINT,
    unique_fruits BIGINT,
    total_earned BIGINT,
    total_spent BIGINT,
    pity_count INTEGER,
    last_income TIMESTAMP,
    created_at TIMESTAMP
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.username,
        u.level,
        u.berries,
        u.total_cp,
        COALESCE(df.total_fruits, 0) as total_fruits,
        COALESCE(df.unique_fruits, 0) as unique_fruits,
        u.total_earned,
        u.total_spent,
        u.pity_count,
        u.last_income,
        u.created_at
    FROM users u
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) as total_fruits,
            COUNT(DISTINCT fruit_id) as unique_fruits
        FROM user_devil_fruits
        WHERE user_id = input_user_id
        GROUP BY user_id
    ) df ON u.user_id = df.user_id
    WHERE u.user_id = input_user_id;
END;
$ LANGUAGE plpgsql;

-- Add function to clean orphaned records
CREATE OR REPLACE FUNCTION clean_orphaned_records()
RETURNS INTEGER AS $
DECLARE
    cleaned_count INTEGER := 0;
BEGIN
    -- Clean orphaned devil fruits (shouldn't happen with proper FK, but safety first)
    DELETE FROM user_devil_fruits 
    WHERE user_id NOT IN (SELECT user_id FROM users);
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Clean orphaned income history
    DELETE FROM income_history 
    WHERE user_id NOT IN (SELECT user_id FROM users);
    GET DIAGNOSTICS cleaned_count = cleaned_count + ROW_COUNT;
    
    -- Clean orphaned command usage (allow NULL user_id)
    DELETE FROM command_usage 
    WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT user_id FROM users);
    GET DIAGNOSTICS cleaned_count = cleaned_count + ROW_COUNT;
    
    -- Clean orphaned user levels
    DELETE FROM user_levels 
    WHERE user_id NOT IN (SELECT user_id FROM users);
    GET DIAGNOSTICS cleaned_count = cleaned_count + ROW_COUNT;
    
    -- Clean orphaned user statistics
    DELETE FROM user_statistics 
    WHERE user_id NOT IN (SELECT user_id FROM users);
    GET DIAGNOSTICS cleaned_count = cleaned_count + ROW_COUNT;
    
    -- Clean orphaned pull history
    DELETE FROM pull_history 
    WHERE user_id NOT IN (SELECT user_id FROM users);
    GET DIAGNOSTICS cleaned_count = cleaned_count + ROW_COUNT;
    
    RETURN cleaned_count;
END;
$ LANGUAGE plpgsql;

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_levels_updated_at ON user_levels;
CREATE TRIGGER update_user_levels_updated_at
    BEFORE UPDATE ON user_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add data validation functions
CREATE OR REPLACE FUNCTION validate_user_data()
RETURNS void AS $
BEGIN
    -- Fix negative berries
    UPDATE users SET berries = 0 WHERE berries < 0;
    
    -- Fix negative CP
    UPDATE users SET total_cp = base_cp WHERE total_cp < base_cp;
    UPDATE users SET base_cp = 100 WHERE base_cp < 100;
    
    -- Fix invalid levels
    UPDATE users SET level = 0 WHERE level < 0;
    
    -- Fix invalid pity counts
    UPDATE users SET pity_count = 0 WHERE pity_count < 0;
    UPDATE users SET pity_count = 1500 WHERE pity_count > 1500;
    
    -- Ensure all users have basic required fields
    UPDATE users SET 
        username = COALESCE(username, 'Unknown'),
        created_at = COALESCE(created_at, NOW()),
        updated_at = COALESCE(updated_at, NOW()),
        last_income = COALESCE(last_income, NOW())
    WHERE username IS NULL 
       OR created_at IS NULL 
       OR updated_at IS NULL 
       OR last_income IS NULL;
END;
$ LANGUAGE plpgsql;

-- Run data validation
SELECT validate_user_data();

-- Add indexes for performance on large tables
CREATE INDEX IF NOT EXISTS idx_system_logs_level_created_at ON system_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_players ON pvp_battles(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_started_at ON pvp_battles(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pull_history_user_rarity ON pull_history(user_id, fruit_rarity);
CREATE INDEX IF NOT EXISTS idx_pull_history_created_at ON pull_history(created_at DESC);

-- Add partial indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_command_usage_successful ON command_usage(user_id, created_at DESC) WHERE success = true;
CREATE INDEX IF NOT EXISTS idx_devil_fruits_recent ON user_devil_fruits(user_id, obtained_at DESC) WHERE obtained_at > NOW() - INTERVAL '30 days';

-- Add some helpful views for common queries
CREATE OR REPLACE VIEW user_summary_view AS
SELECT 
    u.user_id,
    u.username,
    u.level,
    u.berries,
    u.total_cp,
    u.pity_count,
    COALESCE(df.total_fruits, 0) as total_fruits,
    COALESCE(df.unique_fruits, 0) as unique_fruits,
    COALESCE(df.legendary_plus, 0) as legendary_plus_fruits,
    u.total_earned,
    u.total_spent,
    u.created_at,
    u.last_income
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_fruits,
        COUNT(DISTINCT fruit_id) as unique_fruits,
        COUNT(CASE WHEN fruit_rarity IN ('legendary', 'mythical', 'divine') THEN 1 END) as legendary_plus
    FROM user_devil_fruits
    GROUP BY user_id
) df ON u.user_id = df.user_id;

-- Create leaderboard views
CREATE OR REPLACE VIEW cp_leaderboard AS
SELECT 
    user_id,
    username,
    total_cp,
    level,
    ROW_NUMBER() OVER (ORDER BY total_cp DESC) as rank
FROM users
WHERE total_cp > 0
ORDER BY total_cp DESC;

CREATE OR REPLACE VIEW berry_leaderboard AS
SELECT 
    user_id,
    username,
    berries,
    total_earned,
    ROW_NUMBER() OVER (ORDER BY berries DESC) as rank
FROM users
WHERE berries > 0
ORDER BY berries DESC;

CREATE OR REPLACE VIEW collection_leaderboard AS
SELECT 
    u.user_id,
    u.username,
    COUNT(DISTINCT df.fruit_id) as unique_fruits,
    COUNT(df.fruit_id) as total_fruits,
    ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT df.fruit_id) DESC) as rank
FROM users u
LEFT JOIN user_devil_fruits df ON u.user_id = df.user_id
GROUP BY u.user_id, u.username
HAVING COUNT(DISTINCT df.fruit_id) > 0
ORDER BY unique_fruits DESC;

-- Add comments for documentation
COMMENT ON TABLE users IS 'Main user profiles with economy and progression data';
COMMENT ON TABLE user_devil_fruits IS 'Devil fruits owned by users with duplicate tracking';
COMMENT ON TABLE income_history IS 'Historical record of berry income events';
COMMENT ON TABLE command_usage IS 'Command execution tracking for analytics';
COMMENT ON TABLE user_levels IS 'User level and experience progression';
COMMENT ON TABLE user_statistics IS 'Generic key-value statistics for users (PvP, achievements, etc.)';
COMMENT ON TABLE pvp_battles IS 'PvP battle records and results';
COMMENT ON TABLE system_logs IS 'System error and event logging';
COMMENT ON TABLE pull_history IS 'Detailed gacha pull history for analytics';

COMMENT ON FUNCTION cleanup_old_logs() IS 'Maintenance function to clean old log data';
COMMENT ON FUNCTION get_user_summary(TEXT) IS 'Get comprehensive user information';
COMMENT ON FUNCTION clean_orphaned_records() IS 'Clean records that reference deleted users';
COMMENT ON FUNCTION validate_user_data() IS 'Fix invalid data in user records';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_bot_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_bot_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_bot_user;
