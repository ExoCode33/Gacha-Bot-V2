-- src/database/migrations/002_enhanced_schema.sql
-- Enhanced schema for Devil Fruit system with PvP support

-- Add pity system to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pity_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pvp_rank VARCHAR(50) DEFAULT 'Unranked';
ALTER TABLE users ADD COLUMN IF NOT EXISTS battle_wins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS battle_losses INTEGER DEFAULT 0;

-- Enhanced user statistics table
CREATE TABLE IF NOT EXISTS user_statistics (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    stat_type VARCHAR(50) NOT NULL,
    value BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, stat_type)
);

-- PvP battles table (enhanced)
DROP TABLE IF EXISTS pvp_battles;
CREATE TABLE pvp_battles (
    id SERIAL PRIMARY KEY,
    battle_id TEXT UNIQUE NOT NULL,
    player1_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    player2_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    winner_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
    battle_type VARCHAR(50) DEFAULT 'ranked',
    turns_taken INTEGER DEFAULT 0,
    battle_data JSONB,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_seconds INTEGER
);

-- Battle log table for detailed battle history
CREATE TABLE IF NOT EXISTS battle_logs (
    id SERIAL PRIMARY KEY,
    battle_id TEXT REFERENCES pvp_battles(battle_id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    player_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
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
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, achievement_id)
);

-- Battle queue table for matchmaking
CREATE TABLE IF NOT EXISTS battle_queue (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
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
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    fruit_id TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily quests/challenges table
CREATE TABLE IF NOT EXISTS daily_challenges (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    challenge_type VARCHAR(50) NOT NULL,
    target_value INTEGER NOT NULL,
    current_progress INTEGER DEFAULT 0,
    reward_berries INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    date DATE DEFAULT CURRENT_DATE,
    expires_at TIMESTAMP DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
    UNIQUE(user_id, challenge_type, date)
);

-- Leaderboards view for rankings (FIXED)
CREATE OR REPLACE VIEW user_rankings AS
SELECT 
    u.user_id,
    u.username,
    u.level,
    u.total_cp,
    u.pvp_rank,
    COALESCE(wins.value, 0) as pvp_wins,
    COALESCE(losses.value, 0) as pvp_losses,
    CASE 
        WHEN COALESCE(wins.value, 0) + COALESCE(losses.value, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(wins.value, 0)::decimal / (COALESCE(wins.value, 0) + COALESCE(losses.value, 0))) * 100, 2)
    END as win_rate
FROM users u
LEFT JOIN user_statistics wins ON u.user_id = wins.user_id AND wins.stat_type = 'pvp_wins'
LEFT JOIN user_statistics losses ON u.user_id = losses.user_id AND losses.stat_type = 'pvp_losses';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_stat ON user_statistics(user_id, stat_type);
CREATE INDEX IF NOT EXISTS idx_user_statistics_stat_type ON user_statistics(stat_type);
CREATE INDEX IF NOT EXISTS idx_user_statistics_updated ON user_statistics(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_pvp_battles_battle_id ON pvp_battles(battle_id);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_players ON pvp_battles(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_type ON pvp_battles(battle_type);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_active ON pvp_battles(started_at) WHERE ended_at IS NULL;

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
CREATE INDEX IF NOT EXISTS idx_user_loadouts_default ON user_loadouts(is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_daily_challenges_user ON daily_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_type ON daily_challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_completed ON daily_challenges(completed);

-- Add constraints for data integrity
ALTER TABLE user_statistics ADD CONSTRAINT check_stat_value_non_negative CHECK (value >= 0);
ALTER TABLE pvp_battles ADD CONSTRAINT check_different_players CHECK (player1_id != player2_id);
ALTER TABLE battle_logs ADD CONSTRAINT check_turn_number_positive CHECK (turn_number > 0);
ALTER TABLE user_achievements ADD CONSTRAINT check_progress_non_negative CHECK (progress >= 0);
ALTER TABLE daily_challenges ADD CONSTRAINT check_target_value_positive CHECK (target_value > 0);
ALTER TABLE daily_challenges ADD CONSTRAINT check_current_progress_non_negative CHECK (current_progress >= 0);
ALTER TABLE daily_challenges ADD CONSTRAINT check_reward_berries_non_negative CHECK (reward_berries >= 0);

-- Update trigger for user_loadouts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_loadouts_updated_at BEFORE UPDATE ON user_loadouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON user_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
