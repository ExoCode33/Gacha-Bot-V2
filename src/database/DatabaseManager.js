// src/database/DatabaseManager.js - Professional Database Management
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const Config = require('../config/Config');
const Logger = require('../utils/Logger');

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.logger = new Logger('DATABASE');
        this.isConnected = false;
        this.migrations = new Map();
        this.queryCount = 0;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
    }

    /**
     * Connect to PostgreSQL database with retry logic
     */
    async connect() {
        while (this.connectionAttempts < this.maxRetries) {
            try {
                this.connectionAttempts++;
                this.logger.info(`🔄 Attempting database connection (${this.connectionAttempts}/${this.maxRetries})...`);

                const config = Config.database;
                
                this.pool = new Pool({
                    connectionString: config.url,
                    ssl: config.ssl ? { rejectUnauthorized: false } : false,
                    ...config.pool,
                    // Additional connection options for Railway
                    keepAlive: true,
                    keepAliveInitialDelayMillis: 10000,
                    statement_timeout: 30000,
                    query_timeout: 30000,
                    connectionTimeoutMillis: 10000
                });

                // Test connection
                const client = await this.pool.connect();
                await client.query('SELECT NOW()');
                client.release();

                this.isConnected = true;
                this.setupEventHandlers();
                
                this.logger.success(`✅ Database connected successfully (attempt ${this.connectionAttempts})`);
                return;

            } catch (error) {
                this.logger.error(`❌ Database connection failed (attempt ${this.connectionAttempts}):`, error.message);
                
                if (this.connectionAttempts >= this.maxRetries) {
                    throw new Error(`Failed to connect to database after ${this.maxRetries} attempts: ${error.message}`);
                }
                
                // Wait before retry with exponential backoff
                const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts - 1), 10000);
                this.logger.info(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Setup event handlers for pool
     */
    setupEventHandlers() {
        this.pool.on('connect', (client) => {
            this.logger.debug('📡 New client connected to database');
        });

        this.pool.on('remove', (client) => {
            this.logger.debug('📡 Client removed from database pool');
        });

        this.pool.on('error', (error, client) => {
            this.logger.error('💥 Database pool error:', error);
        });

        // Graceful shutdown handling
        process.on('SIGINT', () => this.disconnect());
        process.on('SIGTERM', () => this.disconnect());
    }

    /**
     * Execute database query with error handling and metrics
     */
    async query(text, params = [], options = {}) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        const startTime = Date.now();
        const queryId = ++this.queryCount;
        
        try {
            this.logger.debug(`🔍 Executing query ${queryId}:`, text.substring(0, 100));
            
            const result = await this.pool.query(text, params);
            const duration = Date.now() - startTime;
            
            // Log slow queries
            if (duration > 1000) {
                this.logger.warn(`🐌 Slow query detected (${duration}ms):`, text.substring(0, 100));
            }
            
            this.logger.debug(`✅ Query ${queryId} completed in ${duration}ms`);
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(`❌ Query ${queryId} failed after ${duration}ms:`, error.message);
            this.logger.debug('Failed query:', text);
            throw error;
        }
    }

    /**
     * Execute query with transaction
     */
    async transaction(callback) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Load and execute database migrations
     */
    async migrate() {
        try {
            this.logger.info('🔄 Starting database migrations...');
            
            // Ensure migrations table exists
            await this.createMigrationsTable();
            
            // Load migration files
            await this.loadMigrations();
            
            // Get executed migrations
            const executedMigrations = await this.getExecutedMigrations();
            
            // Execute pending migrations
            const pending = Array.from(this.migrations.keys())
                .filter(name => !executedMigrations.includes(name))
                .sort();
            
            if (pending.length === 0) {
                this.logger.info('✅ No pending migrations');
                return;
            }
            
            this.logger.info(`📋 Found ${pending.length} pending migrations`);
            
            for (const migrationName of pending) {
                await this.executeMigration(migrationName);
            }
            
            this.logger.success('✅ All migrations executed successfully');
            
        } catch (error) {
            this.logger.error('❌ Migration failed:', error);
            throw error;
        }
    }

    /**
     * Create migrations tracking table
     */
    async createMigrationsTable() {
        await this.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    /**
     * Load migration files from filesystem
     */
    async loadMigrations() {
        const migrationsDir = path.join(__dirname, 'migrations');
        
        try {
            const files = await fs.readdir(migrationsDir);
            const migrationFiles = files.filter(file => file.endsWith('.sql')).sort();
            
            for (const file of migrationFiles) {
                const filePath = path.join(migrationsDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const name = file.replace('.sql', '');
                
                this.migrations.set(name, content);
            }
            
            this.logger.info(`📁 Loaded ${this.migrations.size} migration files`);
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.logger.warn('⚠️ Migrations directory not found, creating...');
                await fs.mkdir(migrationsDir, { recursive: true });
            } else {
                throw error;
            }
        }
    }

    /**
     * Get list of executed migrations
     */
    async getExecutedMigrations() {
        const result = await this.query('SELECT name FROM _migrations ORDER BY id');
        return result.rows.map(row => row.name);
    }

    /**
     * Execute a single migration
     */
    async executeMigration(migrationName) {
        const sql = this.migrations.get(migrationName);
        if (!sql) {
            throw new Error(`Migration ${migrationName} not found`);
        }
        
        this.logger.info(`🔄 Executing migration: ${migrationName}`);
        
        await this.transaction(async (client) => {
            // Execute migration SQL
            await client.query(sql);
            
            // Record migration as executed
            await client.query(
                'INSERT INTO _migrations (name) VALUES ($1)',
                [migrationName]
            );
        });
        
        this.logger.success(`✅ Migration completed: ${migrationName}`);
    }

    /**
     * User management methods
     */
    async ensureUser(userId, username, guildId = null) {
        const result = await this.query(`
            INSERT INTO users (user_
