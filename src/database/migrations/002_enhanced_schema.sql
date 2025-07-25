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

-- Leaderboards view for rankings
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
    END
