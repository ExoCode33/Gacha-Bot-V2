// src/config/Config.js - Professional Configuration Management
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
            // Load environment variables FIRST
            this.loadEnvironmentVariables();
            
            // Load default configuration
            await this.loadDefaultConfig();
            
            // Load environment-specific configuration
            await this.loadEnvironmentConfig();
            
            // Validate configuration AFTER loading
            this.validateConfig();
            
            this.isLoaded = true;
            
        } catch (error) {
            throw new Error(`Configuration loading failed: ${error.message}`);
        }
    }

    /**
     * Load environment variables with defaults
     */
    loadEnvironmentVariables() {
        // Discord Configuration
        this.config.discord = {
            token: process.env.DISCORD_TOKEN,
            clientId: process.env.DISCORD_CLIENT_ID,
            guildId: process.env.DISCORD_GUILD_ID // Optional for guild-specific commands
        };

        // Database Configuration
        this.config.database = {
            url: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
            ssl: this.environment === 'production',
            pool: {
                min: parseInt(process.env.DB_POOL_MIN) || 2,
                max: parseInt(process.env.DB_POOL_MAX) || 20,
                acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
                createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT) || 30000,
                destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT) || 5000,
                idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
                reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL) || 1000,
                createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL) || 200
            }
        };

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

        // PvP Configuration
        this.config.pvp = {
            enabled: process.env.PVP_ENABLED !== 'false',
            maxQueueSize: parseInt(process.env.PVP_MAX_QUEUE_SIZE) || 20,
            matchmakingTime: parseInt(process.env.PVP_MATCHMAKING_TIME) || 120,
            battleCooldown: parseInt(process.env.PVP_BATTLE_COOLDOWN) || 300,
            maxBattleTurns: parseInt(process.env.PVP_MAX_TURNS) || 15,
            cpBalanceThreshold: parseFloat(process.env.PVP_CP_BALANCE_THRESHOLD) || 0.3
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
                memory: parseInt(process.env.ALERT_MEMORY_THRESHOLD) || 512,
                cpu: parseInt(process.env.ALERT_CPU_THRESHOLD) || 80,
                latency: parseInt(process.env.ALERT_LATENCY_THRESHOLD) || 300
            }
        };

        // Security Configuration
        this.config.security = {
            adminUsers: process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [],
            moderatorRoles: process.env.MODERATOR_ROLES ? process.env.MODERATOR_ROLES.split(',') : [],
            rateLimitBypass: process.env.RATE_LIMIT_BYPASS ? process.env.RATE_LIMIT_BYPASS.split(',') : []
        };

        // Development Configuration
        this.config.development = {
            hotReload: process.env.HOT_RELOAD === 'true',
            debugMode: process.env.DEBUG_MODE === 'true',
            testMode: process.env.TEST_MODE === 'true',
            mockData: process.env.MOCK_DATA === 'true'
        };
    }

    /**
     * Load default configuration
     */
    async loadDefaultConfig() {
        const defaultConfigPath = path.join(__dirname, 'default.json');
        
        if (fs.existsSync(defaultConfigPath)) {
            try {
                const defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
                this.mergeConfig(defaultConfig);
            } catch (error) {
                // Default config is optional
                console.warn('Warning: Could not load default configuration:', error.message);
            }
        }
    }

    /**
     * Load environment-specific configuration
     */
    async loadEnvironmentConfig() {
        const envConfigPath = path.join(__dirname, `${this.environment}.json`);
        
        if (fs.existsSync(envConfigPath)) {
            try {
                const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
                this.mergeConfig(envConfig);
            } catch (error) {
                console.warn(`Warning: Could not load ${this.environment} configuration:`, error.message);
            }
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
     * Validate required configuration
     */
    validateConfig() {
        console.log('🔍 === CONFIG VALIDATION DEBUG ===');
        console.log('Starting configuration validation...');
        
        // Direct environment variable check first
        console.log('🔍 DIRECT ENVIRONMENT CHECK:');
        console.log('process.env.DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? 'EXISTS' : 'MISSING');
        console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL ? 'EXISTS' : 'MISSING');
        console.log('process.env.DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL ? 'EXISTS' : 'MISSING');
        
        // Check config object structure
        console.log('🔍 CONFIG OBJECT STRUCTURE:');
        console.log('this.config:', !!this.config);
        console.log('this.config.discord:', !!this.config.discord);
        console.log('this.config.database:', !!this.config.database);
        
        if (this.config.discord) {
            console.log('this.config.discord.token:', this.config.discord.token ? 'SET' : 'NOT SET');
            if (this.config.discord.token) {
                console.log('discord.token length:', this.config.discord.token.length);
                console.log('discord.token type:', typeof this.config.discord.token);
            }
        }
        
        if (this.config.database) {
            console.log('this.config.database.url:', this.config.database.url ? 'SET' : 'NOT SET');
            if (this.config.database.url) {
                console.log('database.url length:', this.config.database.url.length);
                console.log('database.url type:', typeof this.config.database.url);
                console.log('database.url preview:', this.config.database.url.substring(0, 50) + '...');
            } else {
                console.log('❌ Config database.url is empty! Fixing...');
                // Fix it directly here
                this.config.database.url = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
                console.log('Fixed database.url:', this.config.database.url ? 'NOW SET' : 'STILL NOT SET');
            }
        }
        
        // Use direct environment variables for validation
        const discordToken = process.env.DISCORD_TOKEN;
        const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
        
        console.log('🔍 VALIDATION CHECK:');
        console.log('discordToken from env:', discordToken ? 'SET' : 'NOT SET');
        console.log('databaseUrl from env:', databaseUrl ? 'SET' : 'NOT SET');
        console.log('Using DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL ? 'YES' : 'NO');
        
        // Make sure config object has the working URL
        if (databaseUrl && (!this.config.database.url || this.config.database.url.includes('railway.internal'))) {
            console.log('🔧 Forcing config to use working database URL...');
            this.config.database.url = databaseUrl;
            console.log('Config database URL updated to:', this.config.database.url.substring(0, 50) + '...');
        }
        
        const errors = [];
        
        if (!discordToken || discordToken.trim() === '') {
            console.log('❌ DISCORD_TOKEN validation failed');
            errors.push('DISCORD_TOKEN is required');
        } else {
            console.log('✅ DISCORD_TOKEN validation passed');
        }
        
        if (!databaseUrl || databaseUrl.trim() === '') {
            console.log('❌ DATABASE_URL validation failed');
            errors.push('DATABASE_URL is required');
        } else {
            console.log('✅ DATABASE_URL validation passed');
            console.log('Database URL preview:', databaseUrl.substring(0, 50) + '...');
            console.log('Database URL contains proxy:', databaseUrl.includes('proxy.rlwy.net'));
            console.log('Database URL contains internal:', databaseUrl.includes('railway.internal'));
        }

        if (errors.length > 0) {
            console.log('❌ VALIDATION ERRORS FOUND:', errors.length);
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
            
            console.log('🔍 === CONFIG VALIDATION FAILED ===');
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }

        console.log('✅ All validations passed');
        console.log('Final config database URL:', this.config.database?.url ? this.config.database.url.substring(0, 50) + '...' : 'NOT SET');
        console.log('🔍 === CONFIG VALIDATION COMPLETE ===');

        // Validate numeric values
        this.validateNumericConfig();
        
        // Validate discord token format
        this.validateDiscordToken();
    }

    /**
     * Validate numeric configuration values
     */
    validateNumericConfig() {
        const numericValidations = [
            ['game.pullCost', 1, 100000],
            ['game.baseIncome', 1, 1000],
            ['game.incomeRate', 0.01, 10],
            ['pvp.maxQueueSize', 1, 100],
            ['pvp.matchmakingTime', 30, 600],
            ['database.pool.max', 1, 100]
        ];

        for (const [path, min, max] of numericValidations) {
            const value = this.getConfigValue(path);
            if (value !== undefined && (value < min || value > max)) {
                throw new Error(`Configuration ${path} must be between ${min} and ${max}, got ${value}`);
            }
        }
    }

    /**
     * Validate Discord token format
     */
    validateDiscordToken() {
        // Use environment variable directly instead of config object
        const token = process.env.DISCORD_TOKEN;
        if (!token || typeof token !== 'string' || token.length < 50) {
            throw new Error('Invalid Discord token format');
        }
    }

    /**
     * Get configuration value by dot notation path
     */
    getConfigValue(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.config);
    }

    /**
     * Set configuration value by dot notation path
     */
    setConfigValue(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.config);
        
        target[lastKey] = value;
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
     * Get PvP configuration
     */
    get pvp() {
        return this.get('pvp');
    }

    /**
     * Get logging configuration
     */
    get logging() {
        return this.get('logging');
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
