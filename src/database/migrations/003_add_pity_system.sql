-- src/database/migrations/003_add_pity_system.sql
-- Add pity system support to existing users table

-- Add pity_count column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS pity_count INTEGER DEFAULT 0;

-- Add constraint to ensure pity_count is non-negative
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS check_pity_count_non_negative CHECK (pity_count >= 0);

-- Create index for pity_count for performance
CREATE INDEX IF NOT EXISTS idx_users_pity_count ON users(pity_count);

-- Update any existing users to have pity_count = 0 if NULL
UPDATE users SET pity_count = 0 WHERE pity_count IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.pity_count IS 'Number of pulls since last legendary/mythical/divine fruit';

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_berries_pity ON users(berries DESC, pity_count);
CREATE INDEX IF NOT EXISTS idx_users_total_cp_pity ON users(total_cp DESC, pity_count);
