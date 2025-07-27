// src/database/DatabaseManager.js - IMPROVED: Better connection handling and error recovery
const { Pool } = require('pg');
const Logger = require('../utils/Logger');
const Config = require('../config/Config');

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.logger = new Logger('DATABASE');
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.reconnectDelay = 5000; // 5 seconds
        this.lastHealthCheck = 0;
        this.healthCheckInterval = 30000; // 30 seconds
        
        // Track connection statistics
        this.stats = {
            totalQueries: 0,
            failedQueries: 0,
            reconnections: 0,
            lastError: null
        };
    }

    /**
     * Initialize database connection with retry logic
     */
    async connect() {
        this.logger.info('🗄️ Initializing database connection...');
        
        const dbConfig = {
            connectionString: Config.database.url,
            ssl: Config.database.ssl ? { rejectUnauthorized: false } : false,
            
            // CONNECTION POOL SETTINGS - OPTIMIZED FOR RAILWAY
            max: 10,                    // Maximum pool size
            min: 2,                     // Minimum pool size
            idleTimeoutMillis: 30000,   // 30 seconds idle timeout
            connectionTimeoutMillis: 10000, // 10 seconds connection timeout
            acquireTimeoutMillis: 5000, // 5 seconds acquire timeout
            
            // KEEPALIVE SETTINGS - PREVENT CONNECTION DROPS
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
            
            // QUERY TIMEOUT
            query_timeout: 20000,       // 20 seconds query timeout
            statement_timeout: 20000,   // 20 seconds statement timeout
            
            // ERROR HANDLING
            application_name: 'One_Piece_Gacha_Bot_v4',
        };

        return this.attemptConnection(dbConfig);
    }

    /**
     * Attempt database connection with exponential backoff
     */
    async attemptConnection(dbConfig, attempt = 1) {
        try {
            this.logger.info(`🔄 Database connection attempt ${attempt}/${this.maxConnectionAttempts}`);
            
            // Create new pool
            this.pool = new Pool(dbConfig);
            
            // Set up error handlers BEFORE testing connection
            this.setupErrorHandlers();
            
            // Test connection
            const startTime = Date.now();
            const client = await this.pool.connect();
            const testResult = await client.query('SELECT NOW() as server_time, version() as postgres_version');
            const connectionTime = Date.now() - startTime;
            client.release();
            
            this.isConnected = true;
            this.connectionAttempts = 0;
            
            this.logger.success(`✅ Database connected successfully! (${connectionTime}ms)`);
            this.logger.info(`📊 Server time: ${testResult.rows[0].server_time}`);
            this.logger.info(`🐘 PostgreSQL version: ${testResult.rows[0].postgres_version.split(' ')[0]}`);
            
            // Start health checking
            this.startHealthChecking();
            
            return true;
            
        } catch (error) {
            this.logger.error(`❌ Database connection attempt ${attempt} failed:`, {
                error: error.message,
                code: error.code,
                errno: error.errno,
                syscall: error.syscall
            });
            
            this.isConnected = false;
            this.stats.lastError = error.message;
            
            // Clean up failed pool
            if (this.pool) {
                try {
                    await this.pool.end();
                } catch (cleanupError) {
                    this.logger.warn('Error cleaning up failed pool:', cleanupError.message);
                }
                this.pool = null;
            }
            
            // Retry with exponential backoff
            if (attempt < this.maxConnectionAttempts) {
                const delay = this.reconnectDelay * Math.pow(2, attempt - 1);
                this.logger.info(`⏳ Retrying in ${delay / 1000} seconds...`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.attemptConnection(dbConfig, attempt + 1);
            } else {
                this.logger.error(`💥 Failed to connect to database after ${this.maxConnectionAttempts} attempts`);
                throw new Error(`Database connection failed: ${error.message}`);
            }
        }
    }

    /**
     * Setup error handlers for pool events
     */
    setupErrorHandlers() {
        if (!this.pool) return;
        
        // Handle pool errors
        this.pool.on('error', (error) => {
            this.logger.error('🚨 Database pool error:', {
                message: error.message,
                code: error.code,
                errno: error.errno
            });
            
            this.isConnected = false;
            this.stats.lastError = error.message;
            
            // Attempt reconnection
            setTimeout(() => {
                if (!this.isConnected) {
                    this.logger.info('🔄 Attempting automatic reconnection...');
                    this.reconnect();
                }
            }, this.reconnectDelay);
        });
        
        // Handle client connections
        this.pool.on('connect', (client) => {
            this.logger.debug('📡 New database client connected');
            
            // Set up client error handling
            client.on('error', (error) => {
                this.logger.warn('⚠️ Database client error:', error.message);
            });
        });
        
        // Handle client removals
        this.pool.on('remove', (client) => {
            this.logger.debug('📤 Database client removed from pool');
        });
        
        // Handle acquisition
        this.pool.on('acquire', (client) => {
            this.logger.debug('🔒 Database client acquired from pool');
        });
    }

    /**
     * Reconnect to database
     */
    async reconnect() {
        this.logger.info('🔄 Attempting database reconnection...');
        this.stats.reconnections++;
        
        try {
            // Close existing pool
            if (this.pool) {
                await this.pool.end();
                this.pool = null;
            }
            
            // Attempt new connection
            await this.connect();
            
        } catch (error) {
            this.logger.error('❌ Reconnection failed:', error.message);
            
            // Schedule another reconnection attempt
            setTimeout(() => {
                this.reconnect();
            }, this.reconnectDelay);
        }
    }

    /**
     * Start periodic health checking
     */
    startHealthChecking() {
        setInterval(async () => {
            await this.performHealthCheck();
        }, this.healthCheckInterval);
    }

    /**
     * Perform health check
     */
    async performHealthCheck() {
        if (!this.pool) return { status: 'disconnected' };
        
        try {
            const startTime = Date.now();
            const result = await this.pool.query('SELECT 1 as health_check');
            const latency = Date.now() - startTime;
            
            this.lastHealthCheck = Date.now();
            
            if (latency > 5000) { // 5 seconds is too slow
                this.logger.warn(`⚠️ Slow database response: ${latency}ms`);
            }
            
            return {
                status: 'healthy',
                latency: latency,
                timestamp: this.lastHealthCheck,
                poolSize: this.pool.totalCount,
                idleConnections: this.pool.idleCount,
                waitingClients: this.pool.waitingCount
            };
            
        } catch (error) {
            this.logger.error('❌ Health check failed:', error.message);
            this.isConnected = false;
            this.stats.lastError = error.message;
            
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Execute query with automatic retry and error handling
     */
    async query(text, params = []) {
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Check if pool exists
                if (!this.pool) {
                    throw new Error('Database pool not initialized');
                }
                
                const startTime = Date.now();
                const result = await this.pool.query(text, params);
                const queryTime = Date.now() - startTime;
                
                this.stats.totalQueries++;
                
                // Log slow queries
                if (queryTime > 1000) {
                    this.logger.warn(`🐌 Slow query detected: ${queryTime}ms`, {
                        query: text.substring(0, 100),
                        params: params?.length || 0
                    });
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                this.stats.failedQueries++;
                
                this.logger.error(`❌ Query failed (attempt ${attempt}/${maxRetries}):`, {
                    error: error.message,
                    code: error.code,
                    query: text.substring(0, 100),
                    params: params?.length || 0
                });
                
                // Handle specific error types
                if (this.isConnectionError(error)) {
                    this.isConnected = false;
                    
                    if (attempt < maxRetries) {
                        this.logger.info(`🔄 Retrying query in 1 second... (${attempt}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // Try to reconnect
                        if (!this.isConnected) {
                            try {
                                await this.reconnect();
                            } catch (reconnectError) {
                                this.logger.warn('Failed to reconnect for retry:', reconnectError.message);
                            }
                        }
                        continue;
                    }
                }
                
                // For non-connection errors, don't retry
                if (!this.isConnectionError(error)) {
                    break;
                }
            }
        }
        
        // If we get here, all retries failed
        this.logger.error(`💥 Query failed after ${maxRetries} attempts:`, lastError.message);
        throw lastError;
    }

    /**
     * Check if error is connection-related
     */
    isConnectionError(error) {
        const connectionErrorCodes = [
            'ECONNRESET',
            'ECONNREFUSED', 
            'ETIMEOUT',
            'ENOTFOUND',
            'EHOSTUNREACH',
            'ENETUNREACH',
            'CONNECTION_TERMINATED',
            'CONNECTION_DOES_NOT_EXIST'
        ];
        
        return connectionErrorCodes.includes(error.code) ||
               error.message?.includes('connection') ||
               error.message?.includes('pool') ||
               error.message?.includes('timeout');
    }

    /**
     * Graceful shutdown
     */
    async disconnect() {
        this.logger.info('🔌 Closing database connections...');
        
        if (this.pool) {
            try {
                await this.pool.end();
                this.pool = null;
                this.isConnected = false;
                this.logger.success('✅ Database connections closed gracefully');
            } catch (error) {
                this.logger.error('❌ Error closing database connections:', error.message);
            }
        }
    }

    /**
     * Get database statistics
     */
    getStats() {
        const poolStats = this.pool ? {
            totalConnections: this.pool.totalCount,
            idleConnections: this.pool.idleCount,
            waitingClients: this.pool.waitingCount
        } : null;
        
        return {
            isConnected: this.isConnected,
            totalQueries: this.stats.totalQueries,
            failedQueries: this.stats.failedQueries,
            successRate: this.stats.totalQueries > 0 ? 
                ((this.stats.totalQueries - this.stats.failedQueries) / this.stats.totalQueries * 100).toFixed(2) + '%' : '0%',
            reconnections: this.stats.reconnections,
            lastError: this.stats.lastError,
            lastHealthCheck: this.lastHealthCheck,
            poolStats
        };
    }

    // ===== USER MANAGEMENT METHODS =====
    
    /**
     * Ensure user exists in database
     */
    async ensureUser(userId, username, guildId = null) {
        try {
            // First try to get existing user
            let user = await this.getUser(userId);
            
            if (!user) {
                // Create new user
                const result = await this.query(`
                    INSERT INTO users (user_id, username, guild_id, berries, total_cp, level, created_at, updated_at, last_income)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
                    ON CONFLICT (user_id) DO UPDATE SET
                        username = EXCLUDED.username,
                        updated_at = NOW()
                    RETURNING *
                `, [userId, username, guildId, Config.game.baseIncome, 0, 1]);
                
                user = result.rows[0];
                this.logger.info(`👤 Created new user: ${username} (${userId})`);
            }
            
            return user;
            
        } catch (error) {
            this.logger.error('Error ensuring user exists:', error);
            throw error;
        }
    }
    
    /**
     * Get user by ID
     */
    async getUser(userId) {
        try {
            const result = await this.query('SELECT * FROM users WHERE user_id = $1', [userId]);
            return result.rows[0] || null;
        } catch (error) {
            this.logger.error(`Error getting user ${userId}:`, error);
            throw error;
        }
    }
    
    /**
     * Update user data
     */
    async updateUser(userId, updates) {
        try {
            const fields = Object.keys(updates);
            const values = Object.values(updates);
            
            if (fields.length === 0) return null;
            
            const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
            const query = `
                UPDATE users 
                SET ${setClause}, updated_at = NOW()
                WHERE user_id = $1 
                RETURNING *
            `;
            
            const result = await this.query(query, [userId, ...values]);
            return result.rows[0];
            
        } catch (error) {
            this.logger.error(`Error updating user ${userId}:`, error);
            throw error;
        }
    }

    // ===== DEVIL FRUIT METHODS =====
    
    /**
     * Get user's devil fruits
     */
    async getUserDevilFruits(userId) {
        try {
            const result = await this.query(`
                SELECT * FROM user_devil_fruits 
                WHERE user_id = $1 
                ORDER BY obtained_at DESC
            `, [userId]);
            
            return result.rows;
        } catch (error) {
            this.logger.error(`Error getting devil fruits for user ${userId}:`, error);
            throw error;
        }
    }
    
    /**
     * Add devil fruit to user's collection
     */
    async addDevilFruit(userId, fruitData) {
        try {
            // Calculate CP based on fruit data
            const baseCp = Math.floor((fruitData.multiplier || 1) * 100);
            
            // Insert fruit
            const result = await this.query(`
                INSERT INTO user_devil_fruits (
                    user_id, fruit_id, fruit_name, fruit_type, fruit_rarity, 
                    fruit_description, base_cp, total_cp, obtained_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                RETURNING *
            `, [
                userId,
                fruitData.id,
                fruitData.name,
                fruitData.type,
                fruitData.rarity,
                fruitData.description || fruitData.power,
                baseCp,
                baseCp
            ]);
            
            const newFruit = result.rows[0];
            
            // Update user's total CP
            await this.query(`
                UPDATE users 
                SET total_cp = total_cp + $2, updated_at = NOW()
                WHERE user_id = $1
            `, [userId, baseCp]);
            
            // Check if this is a new fruit for the user
            const duplicateCount = await this.query(`
                SELECT COUNT(*) as count 
                FROM user_devil_fruits 
                WHERE user_id = $1 AND fruit_id = $2
            `, [userId, fruitData.id]);
            
            const isNewFruit = parseInt(duplicateCount.rows[0].count) === 1;
            
            this.logger.info(`🍈 Added ${fruitData.name} to user ${userId} (CP: +${baseCp})`);
            
            return {
                fruit: newFruit,
                isNewFruit,
                duplicateCount: parseInt(duplicateCount.rows[0].count)
            };
            
        } catch (error) {
            this.logger.error('Error adding devil fruit:', error);
            throw error;
        }
    }

    // ===== UTILITY METHODS =====
    
    /**
     * Get server statistics
     */
    async getServerStats() {
        try {
            const [userCount, fruitCount, berriesTotal] = await Promise.all([
                this.query('SELECT COUNT(DISTINCT user_id) as count FROM users'),
                this.query('SELECT COUNT(*) as count FROM user_devil_fruits'),
                this.query('SELECT SUM(berries) as total FROM users')
            ]);
            
            return {
                totalUsers: parseInt(userCount.rows[0].count),
                totalFruits: parseInt(fruitCount.rows[0].count), 
                totalBerries: parseInt(berriesTotal.rows[0].total || 0)
            };
        } catch (error) {
            this.logger.error('Error getting server stats:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new DatabaseManager();
