-- src/database/migrations/002_enhanced_schema.sql
-- Fixed enhanced schema for Devil Fruit system with PvP support

-- Add additional columns to users table if they don't exist
DO $$ 
BEGIN 
    -- Add pity_count if not exists (should already exist from 001)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pity_count') THEN
        ALTER TABLE users ADD COLUMN pity_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add pvp columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pvp_rank') THEN
        ALTER TABLE users ADD COLUMN pvp_rank VARCHAR(50) DEFAULT 'Unranked';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='battle_wins') THEN
        ALTER TABLE users ADD COLUMN battle_wins INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='battle_losses') THEN
        ALTER TABLE users ADD COLUMN battle_losses INTEGER DEFAULT 0;
    END IF;
END $$;

-- Enhanced user statistics table
CREATE TABLE IF NOT EXISTS user_statistics (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    stat_type VARCHAR(50) NOT NULL,
    value BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, stat_type)
);

-- Battle log table for detailed battle history
CREATE TABLE IF NOT EXISTS battle_logs (
    id SERIAL PRIMARY KEY,
    battle_id TEXT NOT NULL,
    turn_number INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB,
    damage_dealt INTEGER DEFAULT 0,
    healing_done INTEGER DEFAULT 0,
    status_effects_applied TEXT[],
    timestamp TIMESTAMP DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_id VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, achievement_id)
);

-- Battle queue table for matchmaking
CREATE TABLE IF NOT EXISTS battle_queue (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    queue_type VARCHAR(50) DEFAULT 'ranked',
    min_cp INTEGER,
    max_cp INTEGER,
    preferred_rank VARCHAR(50),
    joined_at TIMESTAMP DEFAULT NOW(),
    last_ping TIMESTAMP DEFAULT NOW()
);

-- User loadouts table (for future fruit selection)
CREATE TABLE IF NOT EXISTS user_loadouts (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    fruit_id TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily quests/challenges table
CREATE TABLE IF NOT EXISTS daily_challenges (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    challenge_type VARCHAR(50) NOT NULL,
    target_value INTEGER NOT NULL,
    current_progress INTEGER DEFAULT 0,
    reward_berries INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    date DATE DEFAULT CURRENT_DATE,
    expires_at TIMESTAMP DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
    UNIQUE(user_id, challenge_type, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_stat ON user_statistics(user_id, stat_type);
CREATE INDEX IF NOT EXISTS idx_user_statistics_stat_type ON user_statistics(stat_type);
CREATE INDEX IF NOT EXISTS idx_user_statistics_updated ON user_statistics(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_pvp_battles_battle_id ON pvp_battles(battle_id);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_players ON pvp_battles(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_type ON pvp_battles(battle_type);

CREATE INDEX IF NOT EXISTS idx_battle_logs_battle ON battle_logs(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_logs_player ON battle_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_battle_logs_turn ON battle_logs(turn_number);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed);

CREATE INDEX IF NOT EXISTS idx_battle_queue_user ON battle_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_queue_type ON battle_queue(queue_type);
CREATE INDEX IF NOT EXISTS idx_battle_queue_joined ON battle_queue(joined_at);

CREATE INDEX IF NOT EXISTS idx_user_loadouts_user ON user_loadouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loadouts_default ON user_loadouts(user_id) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_daily_challenges_user ON daily_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_type ON daily_challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_completed ON daily_challenges(completed);

-- Update trigger for user_loadouts
DROP TRIGGER IF EXISTS update_user_loadouts_updated_at ON user_loadouts;
CREATE TRIGGER update_user_loadouts_updated_at 
    BEFORE UPDATE ON user_loadouts
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_statistics_updated_at ON user_statistics;
CREATE TRIGGER update_user_statistics_updated_at 
    BEFORE UPDATE ON user_statistics
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
