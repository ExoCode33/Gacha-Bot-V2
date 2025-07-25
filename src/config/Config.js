// src/config/Config.js - Railway-Compatible Configuration Management
const path = require('path');
const fs = require('fs');

class ConfigManager {
    constructor() {
        this.config = {};
        this.isLoaded = false;
        this.environment = process.env.NODE_ENV || 'production';
    }

    /**
     * Load configuration from environment variables and config files
     */
    async load() {
        try {
            console.log('🔍 === RAILWAY-COMPATIBLE CONFIG LOADING ===');
            console.log('Starting configuration load process...');
            console.log('Timestamp:', new Date().toISOString());
            console.log('Environment:', this.environment);
            console.log('');
            
            // Load environment variables with Railway-specific approach
            this.loadEnvironmentVariables();
            
            // Load default configuration (optional)
            await this.loadDefaultConfig();
            
            // Load environment-specific configuration (optional)
            await this.loadEnvironmentConfig();
            
            // Validate configuration
            this.validateConfig();
            
            this.isLoaded = true;
            console.log('✅ Configuration loading completed successfully');
            console.log('🔍 === CONFIG LOADING COMPLETE ===');
            console.log('');
            
        } catch (error) {
            console.log('❌ Configuration loading failed:', error.message);
            console.log('Error stack:', error.stack);
            throw new Error(`Configuration loading failed: ${error.message}`);
        }
    }

    /**
     * Railway-compatible environment variable loading
     */
    loadEnvironmentVariables() {
        console.log('🔍 === RAILWAY ENVIRONMENT LOADING ===');
        console.log('Loading environment variables...');
        
        // Discord Configuration - Railway compatible
        const discordToken = process.env.DISCORD_TOKEN;
        const discordClientId = process.env.DISCORD_CLIENT_ID;
        
        console.log('Discord Token:', discordToken ? 'FOUND' : 'NOT FOUND');
        console.log('Discord Client ID:', discordClientId ? 'FOUND' : 'NOT FOUND');
        
        if (!discordToken) {
            throw new Error('DISCORD_TOKEN environment variable is required');
        }
        
        this.config.discord = {
            token: discordToken.trim(),
            clientId: discordClientId || this.extractClientIdFromToken(discordToken),
            guildId: process.env.DISCORD_GUILD_ID || null
        };
        
        console.log('✅ Discord configuration loaded');

        // Database Configuration - Railway compatible
        const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
        
        console.log('Database URL:', databaseUrl ? 'FOUND' : 'NOT FOUND');
        
        if (!databaseUrl) {
            throw new Error('DATABASE_URL or DATABASE_PUBLIC_URL environment variable is required');
        }
        
        this.config.database = {
            url: databaseUrl.trim(),
            ssl: this.environment === 'production',
            pool: {
                min: parseInt(process.env.DB_POOL_MIN) || 2,
                max: parseInt(process.env.DB_POOL_MAX) || 10, // Reduced for Railway
                acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
                createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT) || 15000,
                destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT) || 5000,
                idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000
            }
        };
        
        console.log('✅ Database configuration loaded');

        // Game Configuration
        this.config.game = {
            pullCost: parseInt(process.env.PULL_COST) || 1000,
            baseIncome: parseInt(process.env.BASE_INCOME) || 50,
            incomeRate: parseFloat(process.env.INCOME_RATE) || 0.1,
            manualIncomeMultiplier: parseFloat(process.env.MANUAL_INCOME_MULTIPLIER) || 6,
            manualIncomeCooldown: parseInt(process.env.MANUAL_INCOME_COOLDOWN) || 60,
            autoIncomeInterval: parseInt(process.env.AUTO_INCOME_INTERVAL) || 10,
            maxStoredHours: parseInt(process.env.MAX_STORED_HOURS) || 24
        };

        // Logging Configuration
        this.config.logging = {
            level: process.env.LOG_LEVEL || 'info',
            console: process.env.LOG_CONSOLE !== 'false',
            file: process.env.LOG_FILE === 'true',
            filePath: process.env.LOG_FILE_PATH || './logs',
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 14,
            maxSize: process.env.LOG_MAX_SIZE || '20m'
        };

        // Performance Configuration
        this.config.performance = {
            commandCooldown: parseInt(process.env.COMMAND_COOLDOWN) || 3000,
            rateLimit: {
                window: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
                max: parseInt(process.env.RATE_LIMIT_MAX) || 30
            },
            cacheSize: parseInt(process.env.CACHE_SIZE) || 1000,
            cacheTTL: parseInt(process.env.CACHE_TTL) || 300000
        };

        // Monitoring Configuration  
        this.config.monitoring = {
            enabled: process.env.MONITORING_ENABLED !== 'false',
            interval: parseInt(process.env.MONITORING_INTERVAL) || 30000,
            alertThresholds: {
                memory: parseInt(process.env.ALERT_MEMORY_THRESHOLD) || 256, // Reduced for Railway
                cpu: parseInt(process.env.ALERT_CPU_THRESHOLD) || 80,
                latency: parseInt(process.env.ALERT_LATENCY_THRESHOLD) || 300
            }
        };

        // Security Configuration
        this.config.security = {
            adminUsers: process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',').map(id => id.trim()) : [],
            moderatorRoles: process.env.MODERATOR_ROLES ? process.env.MODERATOR_ROLES.split(',').map(role => role.trim()) : [],
            rateLimitBypass: process.env.RATE_LIMIT_BYPASS ? process.env.RATE_LIMIT_BYPASS.split(',').map(id => id.trim()) : []
        };

        // Development Configuration
        this.config.development = {
            hotReload: process.env.HOT_RELOAD === 'true',
            debugMode: process.env.DEBUG_MODE === 'true',
            testMode: process.env.TEST_MODE === 'true',
            mockData: process.env.MOCK_DATA === 'true'
        };

        // PvP Configuration (optional)
        this.config.pvp = {
            enabled: process.env.PVP_ENABLED !== 'false',
            maxQueueSize: parseInt(process.env.PVP_MAX_QUEUE_SIZE) || 20,
            matchmakingTime: parseInt(process.env.PVP_MATCHMAKING_TIME) || 120,
            battleCooldown: parseInt(process.env.PVP_BATTLE_COOLDOWN) || 300,
            maxBattleTurns: parseInt(process.env.PVP_MAX_TURNS) || 15,
            cpBalanceThreshold: parseFloat(process.env.PVP_CP_BALANCE_THRESHOLD) || 0.3
        };
        
        console.log('✅ All environment variables loaded successfully');
        console.log('🔍 === ENVIRONMENT LOADING COMPLETE ===');
    }

    /**
     * Extract client ID from Discord token
     */
    extractClientIdFromToken(token) {
        try {
            const base64 = token.split('.')[0];
            const decoded = Buffer.from(base64, 'base64').toString('ascii');
            console.log('✅ Extracted client ID from token:', decoded);
            return decoded;
        } catch (error) {
            console.log('⚠️ Could not extract client ID from token:', error.message);
            return null;
        }
    }

    /**
     * Load default configuration (optional)
     */
    async loadDefaultConfig() {
        const defaultConfigPath = path.join(__dirname, 'default.json');
        
        if (fs.existsSync(defaultConfigPath)) {
            try {
                const defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
                this.mergeConfig(defaultConfig);
                console.log('✅ Default configuration loaded');
            } catch (error) {
                console.log('⚠️ Could not load default configuration:', error.message);
            }
        } else {
            console.log('ℹ️ No default configuration file found (optional)');
        }
    }

    /**
     * Load environment-specific configuration (optional)
     */
    async loadEnvironmentConfig() {
        const envConfigPath = path.join(__dirname, `${this.environment}.json`);
        
        if (fs.existsSync(envConfigPath)) {
            try {
                const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
                this.mergeConfig(envConfig);
                console.log(`✅ ${this.environment} configuration loaded`);
            } catch (error) {
                console.log(`⚠️ Could not load ${this.environment} configuration:`, error.message);
            }
        } else {
            console.log(`ℹ️ No ${this.environment} configuration file found (optional)`);
        }
    }

    /**
     * Merge configuration objects
     */
    mergeConfig(newConfig) {
        this.config = this.deepMerge(this.config, newConfig);
    }

    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Simple but effective configuration validation
     */
    validateConfig() {
        console.log('🔍 === CONFIG VALIDATION ===');
        console.log('Starting configuration validation...');
        
        const errors = [];
        
        // Validate Discord token
        if (!this.config.discord?.token) {
            errors.push('Discord token is missing');
        } else {
            const token = this.config.discord.token;
            const parts = token.split('.');
            if (parts.length !== 3) {
                errors.push(`Discord token format invalid: ${parts.length} parts (expected 3)`);
            }
            if (token.length < 50 || token.length > 80) {
                errors.push(`Discord token length invalid: ${token.length} characters`);
            }
        }
        
        // Validate Database URL
        if (!this.config.database?.url) {
            errors.push('Database URL is missing');
        } else {
            const dbUrl = this.config.database.url;
            if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
                errors.push('Database URL format invalid (must be PostgreSQL)');
            }
        }
        
        if (errors.length > 0) {
            console.log('❌ CONFIGURATION VALIDATION FAILED');
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
        
        console.log('✅ Configuration validation passed');
        console.log('🔍 === VALIDATION COMPLETE ===');
    }

    /**
     * Get all configuration
     */
    getAll() {
        if (!this.isLoaded) {
            throw new Error('Configuration not loaded');
        }
        return { ...this.config };
    }

    /**
     * Get configuration section
     */
    get(section) {
        if (!this.isLoaded) {
            throw new Error('Configuration not loaded');
        }
        return this.config[section] || {};
    }

    /**
     * Check if configuration is loaded
     */
    get loaded() {
        return this.isLoaded;
    }

    /**
     * Get environment
     */
    get env() {
        return this.environment;
    }

    /**
     * Check if development mode
     */
    get isDevelopment() {
        return this.environment === 'development';
    }

    /**
     * Check if production mode
     */
    get isProduction() {
        return this.environment === 'production';
    }

    /**
     * Get Discord configuration
     */
    get discord() {
        return this.get('discord');
    }

    /**
     * Get database configuration
     */
    get database() {
        return this.get('database');
    }

    /**
     * Get game configuration
     */
    get game() {
        return this.get('game');
    }

    /**
     * Get performance configuration
     */
    get performance() {
        return this.get('performance');
    }

    /**
     * Get monitoring configuration
     */
    get monitoring() {
        return this.get('monitoring');
    }

    /**
     * Get security configuration
     */
    get security() {
        return this.get('security');
    }

    /**
     * Get logging configuration
     */
    get logging() {
        return this.get('logging');
    }

    /**
     * Get development configuration
     */
    get development() {
        return this.get('development');
    }

    /**
     * Get PvP configuration
     */
    get pvp() {
        return this.get('pvp');
    }

    /**
     * Reload configuration
     */
    async reload() {
        this.config = {};
        this.isLoaded = false;
        await this.load();
    }
}

// Export singleton instance
module.exports = new ConfigManager();
