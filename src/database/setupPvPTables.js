// src/database/setupPvPTables.js - JavaScript Database Setup for PvP
const DatabaseManager = require('./DatabaseManager');
const Logger = require('../utils/Logger');

class PvPDatabaseSetup {
    constructor() {
        this.logger = new Logger('PVP_DB_SETUP');
    }

    /**
     * Setup all PvP tables safely using JavaScript
     */
    async setupPvPDatabase() {
        try {
            this.logger.info('🔄 Setting up PvP database tables...');
            
            // Create tables one by one with error handling
            await this.createPvPBattlesTable();
            await this.createPvPTeamsTable();
            await this.createPvPBattleActionsTable();
            await this.createUserPvPStatsTable();
            await this.createPvPSeasonsTable();
            await this.createPvPQueueTable();
            await this.createPvPRankingsTable();
            await this.createPvPBattleRewardsTable();
            
            // Create indexes
            await this.createIndexes();
            
            // Insert initial data
            await this.insertInitialData();
            
            this.logger.success('✅ PvP database setup completed successfully!');
            return true;
            
        } catch (error) {
            this.logger.error('❌ PvP database setup failed:', error);
            return false;
        }
    }

    /**
     * Create PvP battles table
     */
    async createPvPBattlesTable() {
        try {
            await DatabaseManager.query(`
                CREATE TABLE IF NOT EXISTS pvp_battles (
                    id SERIAL PRIMARY KEY,
                    battle_id VARCHAR(100) UNIQUE NOT NULL,
                    player1_id TEXT NOT NULL,
                    player2_id TEXT NOT NULL,
                    battle_type VARCHAR(50) DEFAULT 'ranked',
                    status VARCHAR(50) DEFAULT 'active',
                    winner_id TEXT,
                    started_at TIMESTAMP DEFAULT NOW(),
                    ended_at TIMESTAMP,
                    turn_count INTEGER DEFAULT 0,
                    battle_data TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            this.logger.debug('✅ pvp_battles table created');
        } catch (error) {
            this.logger.error('Failed to create pvp_battles table:', error);
        }
    }

    /**
     * Create PvP teams table
     */
    async createPvPTeamsTable() {
        try {
            await DatabaseManager.query(`
                CREATE TABLE IF NOT EXISTS pvp_teams (
                    id SERIAL PRIMARY KEY,
                    battle_id VARCHAR(100) NOT NULL,
                    player_id TEXT NOT NULL,
                    fruit_id VARCHAR(100) NOT NULL,
                    fruit_name VARCHAR(255) NOT NULL,
                    fruit_rarity VARCHAR(50) NOT NULL,
                    fruit_weight INTEGER NOT NULL,
                    position_in_team INTEGER NOT NULL,
                    is_active_fruit BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            this.logger.debug('✅ pvp_teams table created');
        } catch (error) {
            this.logger.error('Failed to create pvp_teams table:', error);
        }
    }

    /**
     * Create PvP battle actions table
     */
    async createPvPBattleActionsTable() {
        try {
            await DatabaseManager.query(`
                CREATE TABLE IF NOT EXISTS pvp_battle_actions (
                    id SERIAL PRIMARY KEY,
                    battle_id VARCHAR(100) NOT NULL,
                    player_id TEXT NOT NULL,
                    turn_number INTEGER NOT NULL,
                    action_type VARCHAR(50) NOT NULL,
                    target_player_id TEXT,
                    skill_used VARCHAR(255),
                    damage_dealt INTEGER DEFAULT 0,
                    healing_done INTEGER DEFAULT 0,
                    status_effects TEXT,
                    action_data TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            this.logger.debug('✅ pvp_battle_actions table created');
        } catch (error) {
            this.logger.error('Failed to create pvp_battle_actions table:', error);
        }
    }

    /**
     * Create user PvP stats table
     */
    async createUserPvPStatsTable() {
        try {
            await DatabaseManager.query(`
                CREATE TABLE IF NOT EXISTS user_pvp_stats (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT UNIQUE NOT NULL,
                    total_battles INTEGER DEFAULT 0,
                    wins INTEGER DEFAULT 0,
                    losses INTEGER DEFAULT 0,
                    draws INTEGER DEFAULT 0,
                    ranked_wins INTEGER DEFAULT 0,
                    ranked_losses INTEGER DEFAULT 0,
                    current_streak INTEGER DEFAULT 0,
                    best_streak INTEGER DEFAULT 0,
                    total_damage_dealt BIGINT DEFAULT 0,
                    total_damage_taken BIGINT DEFAULT 0,
                    total_healing_done BIGINT DEFAULT 0,
                    favorite_fruit_id VARCHAR(100),
                    rank_points INTEGER DEFAULT 1000,
                    current_rank VARCHAR(50) DEFAULT 'Unranked',
                    last_battle_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            this.logger.debug('✅ user_pvp_stats table created');
        } catch (error) {
            this.logger.error('Failed to create user_pvp_stats table:', error);
        }
    }

    /**
     * Create PvP seasons table
     */
    async createPvPSeasonsTable() {
        try {
            await DatabaseManager.query(`
                CREATE TABLE IF NOT EXISTS pvp_seasons (
                    id SERIAL PRIMARY KEY,
                    season_number INTEGER UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    start_date TIMESTAMP NOT NULL,
                    end_date TIMESTAMP NOT NULL,
                    is_active BOOLEAN DEFAULT false,
                    rewards TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            this.logger.debug('✅ pvp_seasons table created');
        } catch (error) {
            this.logger.error('Failed to create pvp_seasons table:', error);
        }
    }

    /**
     * Create PvP queue table
     */
    async createPvPQueueTable() {
        try {
            await DatabaseManager.query(`
                CREATE TABLE IF NOT EXISTS pvp_queue (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT UNIQUE NOT NULL,
                    battle_type VARCHAR(50) DEFAULT 'ranked',
                    preferred_cp_range TEXT,
                    queue_joined_at TIMESTAMP DEFAULT NOW(),
                    estimated_wait_time INTEGER
                )
            `);
            this.logger.debug('✅ pvp_queue table created');
        } catch (error) {
            this.logger.error('Failed to create pvp_queue table:', error);
        }
    }

    /**
     * Create PvP rankings table
     */
    async createPvPRankingsTable() {
        try {
            await DatabaseManager.query(`
                CREATE TABLE IF NOT EXISTS pvp_rankings (
                    id SERIAL PRIMARY KEY,
                    season_id INTEGER,
                    user_id TEXT NOT NULL,
                    rank_position INTEGER NOT NULL,
                    rank_points INTEGER NOT NULL,
                    tier VARCHAR(50) NOT NULL,
                    wins INTEGER NOT NULL,
                    losses INTEGER NOT NULL,
                    win_rate DECIMAL(5,2) NOT NULL,
                    peak_rank_points INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            this.logger.debug('✅ pvp_rankings table created');
        } catch (error) {
            this.logger.error('Failed to create pvp_rankings table:', error);
        }
    }

    /**
     * Create PvP battle rewards table
     */
    async createPvPBattleRewardsTable() {
        try {
            await DatabaseManager.query(`
                CREATE TABLE IF NOT EXISTS pvp_battle_rewards (
                    id SERIAL PRIMARY KEY,
                    battle_id VARCHAR(100) NOT NULL,
                    user_id TEXT NOT NULL,
                    reward_type VARCHAR(50) NOT NULL,
                    reward_amount INTEGER,
                    reward_data TEXT,
                    claimed BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            this.logger.debug('✅ pvp_battle_rewards table created');
        } catch (error) {
            this.logger.error('Failed to create pvp_battle_rewards table:', error);
        }
    }

    /**
     * Create indexes for better performance
     */
    async createIndexes() {
        const indexes = [
            // PvP battles indexes
            'CREATE INDEX IF NOT EXISTS idx_pvp_battles_player1 ON pvp_battles(player1_id)',
            'CREATE INDEX IF NOT EXISTS idx_pvp_battles_player2 ON pvp_battles(player2_id)',
            'CREATE INDEX IF NOT EXISTS idx_pvp_battles_status ON pvp_battles(status)',
            'CREATE INDEX IF NOT EXISTS idx_pvp_battles_started_at ON pvp_battles(started_at)',
            
            // PvP teams indexes
            'CREATE INDEX IF NOT EXISTS idx_pvp_teams_battle_id ON pvp_teams(battle_id)',
            'CREATE INDEX IF NOT EXISTS idx_pvp_teams_player_id ON pvp_teams(player_id)',
            
            // PvP actions indexes
            'CREATE INDEX IF NOT EXISTS idx_pvp_actions_battle_id ON pvp_battle_actions(battle_id)',
            'CREATE INDEX IF NOT EXISTS idx_pvp_actions_player_id ON pvp_battle_actions(player_id)',
            
            // User stats indexes
            'CREATE INDEX IF NOT EXISTS idx_user_pvp_stats_user_id ON user_pvp_stats(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_user_pvp_stats_rank_points ON user_pvp_stats(rank_points)',
            
            // Queue indexes
            'CREATE INDEX IF NOT EXISTS idx_pvp_queue_user_id ON pvp_queue(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_pvp_queue_battle_type ON pvp_queue(battle_type)',
            
            // Rankings indexes
            'CREATE INDEX IF NOT EXISTS idx_pvp_rankings_season_id ON pvp_rankings(season_id)',
            'CREATE INDEX IF NOT EXISTS idx_pvp_rankings_user_id ON pvp_rankings(user_id)',
            
            // Rewards indexes
            'CREATE INDEX IF NOT EXISTS idx_pvp_rewards_battle_id ON pvp_battle_rewards(battle_id)',
            'CREATE INDEX IF NOT EXISTS idx_pvp_rewards_user_id ON pvp_battle_rewards(user_id)'
        ];

        for (const indexQuery of indexes) {
            try {
                await DatabaseManager.query(indexQuery);
            } catch (error) {
                this.logger.warn(`Index creation warning: ${error.message}`);
            }
        }
        
        this.logger.debug('✅ Database indexes created');
    }

    /**
     * Insert initial data
     */
    async insertInitialData() {
        try {
            // Insert initial season if none exists
            const seasonExists = await DatabaseManager.query(
                'SELECT COUNT(*) as count FROM pvp_seasons WHERE season_number = 1'
            );
            
            if (parseInt(seasonExists.rows[0].count) === 0) {
                await DatabaseManager.query(`
                    INSERT INTO pvp_seasons (season_number, name, description, start_date, end_date, is_active)
                    VALUES (1, 'Season 1: Grand Line Debut', 'The inaugural PvP season on the Grand Line!', 
                           NOW(), NOW() + INTERVAL '3 months', true)
                `);
                this.logger.debug('✅ Initial PvP season created');
            }
        } catch (error) {
            this.logger.error('Failed to insert initial data:', error);
        }
    }

    /**
     * Check if PvP tables exist
     */
    async checkPvPTablesExist() {
        try {
            const requiredTables = [
                'pvp_battles',
                'pvp_teams',
                'pvp_battle_actions',
                'user_pvp_stats',
                'pvp_seasons',
                'pvp_queue',
                'pvp_rankings',
                'pvp_battle_rewards'
            ];

            const existingTables = [];
            
            for (const tableName of requiredTables) {
                try {
                    const result = await DatabaseManager.query(`
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_name = $1
                        )
                    `, [tableName]);
                    
                    if (result.rows[0].exists) {
                        existingTables.push(tableName);
                    }
                } catch (error) {
                    // Table doesn't exist or query failed
                }
            }

            return {
                allExist: existingTables.length === requiredTables.length,
                existing: existingTables,
                missing: requiredTables.filter(table => !existingTables.includes(table)),
                total: requiredTables.length
            };
            
        } catch (error) {
            this.logger.error('Error checking PvP tables:', error);
            return { allExist: false, existing: [], missing: [], total: 0 };
        }
    }

    /**
     * Create PvP stats for existing users
     */
    async createStatsForExistingUsers() {
        try {
            this.logger.info('🔄 Creating PvP stats for existing users...');
            
            await DatabaseManager.query(`
                INSERT INTO user_pvp_stats (user_id, created_at, updated_at)
                SELECT user_id, NOW(), NOW()
                FROM users
                WHERE user_id NOT IN (SELECT user_id FROM user_pvp_stats)
            `);
            
            const result = await DatabaseManager.query('SELECT COUNT(*) as count FROM user_pvp_stats');
            this.logger.success(`✅ PvP stats created for ${result.rows[0].count} users`);
            
        } catch (error) {
            this.logger.error('Failed to create stats for existing users:', error);
        }
    }

    /**
     * Drop all PvP tables (for testing/reset)
     */
    async dropAllPvPTables() {
        try {
            this.logger.warn('⚠️ Dropping all PvP tables...');
            
            const tables = [
                'pvp_battle_rewards',
                'pvp_rankings', 
                'pvp_queue',
                'pvp_seasons',
                'user_pvp_stats',
                'pvp_battle_actions',
                'pvp_teams',
                'pvp_battles'
            ];

            for (const table of tables) {
                try {
                    await DatabaseManager.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
                    this.logger.debug(`Dropped table: ${table}`);
                } catch (error) {
                    this.logger.warn(`Could not drop table ${table}:`, error.message);
                }
            }
            
            this.logger.success('✅ All PvP tables dropped');
            
        } catch (error) {
            this.logger.error('Failed to drop PvP tables:', error);
        }
    }

    /**
     * Get PvP database status
     */
    async getPvPDatabaseStatus() {
        try {
            const tableStatus = await this.checkPvPTablesExist();
            
            let userStatsCount = 0;
            let activeBattlesCount = 0;
            let seasonsCount = 0;
            
            if (tableStatus.allExist) {
                try {
                    const userStatsResult = await DatabaseManager.query('SELECT COUNT(*) as count FROM user_pvp_stats');
                    userStatsCount = parseInt(userStatsResult.rows[0].count);
                    
                    const battlesResult = await DatabaseManager.query("SELECT COUNT(*) as count FROM pvp_battles WHERE status = 'active'");
                    activeBattlesCount = parseInt(battlesResult.rows[0].count);
                    
                    const seasonsResult = await DatabaseManager.query('SELECT COUNT(*) as count FROM pvp_seasons');
                    seasonsCount = parseInt(seasonsResult.rows[0].count);
                } catch (error) {
                    this.logger.warn('Could not get detailed PvP stats:', error.message);
                }
            }

            return {
                tablesReady: tableStatus.allExist,
                tablesExisting: tableStatus.existing.length,
                tablesTotal: tableStatus.total,
                missingTables: tableStatus.missing,
                userStatsCount,
                activeBattlesCount,
                seasonsCount,
                status: tableStatus.allExist ? 'ready' : 'incomplete'
            };
            
        } catch (error) {
            this.logger.error('Error getting PvP database status:', error);
            return {
                tablesReady: false,
                status: 'error',
                error: error.message
            };
        }
    }
}

// Export singleton instance
const pvpDatabaseSetup = new PvPDatabaseSetup();

module.exports = pvpDatabaseSetup;
