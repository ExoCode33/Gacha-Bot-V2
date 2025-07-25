// src/config/Config.js - Bulletproof Configuration Management
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
            console.log('🔍 === BULLETPROOF CONFIG LOADING ===');
            console.log('Starting configuration load process...');
            console.log('Timestamp:', new Date().toISOString());
            console.log('');
            
            // Load environment variables FIRST with bulletproof checking
            this.loadEnvironmentVariables();
            
            // Load default configuration
            await this.loadDefaultConfig();
            
            // Load environment-specific configuration
            await this.loadEnvironmentConfig();
            
            // Validate configuration AFTER loading
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
     * Bulletproof environment variable loading
     */
    loadEnvironmentVariables() {
        console.log('🔍 === BULLETPROOF ENVIRONMENT LOADING ===');
        console.log('Loading environment variables...');
        
        // Debug ALL environment variables first
        const allEnvVars = Object.keys(process.env);
        console.log('Total environment variables available:', allEnvVars.length);
        
        // Find Discord/Token related variables
        const tokenVars = allEnvVars.filter(key => 
            key.includes('DISCORD') || 
            key.includes('TOKEN') || 
            key.includes('BOT')
        );
        
        console.log('Token-related environment variables found:');
        tokenVars.forEach(key => {
            const value = process.env[key];
            if (key.includes('TOKEN')) {
                console.log(`  ${key}: ${value ? 'SET (' + value.length + ' chars)' : 'NOT SET'}`);
            } else {
                console.log(`  ${key}: ${value || 'NOT SET'}`);
            }
        });
        
        // Try to get Discord token with multiple fallbacks
        let discordToken = null;
        const tokenSources = [
            'DISCORD_TOKEN',
            'BOT_TOKEN',
            'DISCORD_BOT_TOKEN',
            'TOKEN'
        ];
        
        console.log('🔍 Searching for Discord token...');
        for (const source of tokenSources) {
            const token = process.env[source];
            if (token && typeof token === 'string' && token.trim().length > 0) {
                discordToken = token.trim();
                console.log(`✅ Found Discord token in ${source}`);
                console.log(`   Token length: ${discordToken.length}`);
                console.log(`   Token preview: ${discordToken.substring(0, 15)}...`);
                break;
            } else {
                console.log(`❌ ${source}: ${token ? 'EMPTY/INVALID' : 'NOT SET'}`);
            }
        }
        
        if (!discordToken) {
            console.log('❌ NO DISCORD TOKEN FOUND IN ANY ENVIRONMENT VARIABLE!');
            console.log('Available environment variables (first 50):');
            allEnvVars.sort().slice(0, 50).forEach(key => {
                console.log(`  ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
            });
            throw new Error('CRITICAL: No Discord token found in environment variables');
        }
        
        // Clean the token
        const originalToken = discordToken;
        discordToken = discordToken.replace(/^["']|["']$/g, ''); // Remove quotes
        discordToken = discordToken.replace(/\s+/g, ''); // Remove whitespace
        
        if (originalToken !== discordToken) {
            console.log('🔧 Token was cleaned (removed quotes/whitespace)');
        }
        
        console.log('🔧 Final token length:', discordToken.length);
        console.log('🔧 Final token preview:', discordToken.substring(0, 15) + '...');
        
        // Validate token format
        const tokenParts = discordToken.split('.');
        if (tokenParts.length !== 3) {
            console.log('❌ Invalid token format - should have 3 parts separated by dots');
            console.log('   Token parts found:', tokenParts.length);
            console.log('   Token structure:', tokenParts.map(p => p.length + ' chars').join(', '));
            throw new Error(`Invalid Discord token format: expected 3 parts, got ${tokenParts.length}`);
        }
        
        if (discordToken.length < 50 || discordToken.length > 80) {
            console.log('❌ Invalid token length');
            console.log('   Expected: 50-80 characters');
            console.log('   Actual:', discordToken.length, 'characters');
            throw new Error(`Invalid Discord token length: ${discordToken.length} characters`);
        }
        
        console.log('✅ Discord token validation passed');
        
        // Get Discord Client ID
        let clientId = process.env.DISCORD_CLIENT_ID;
        if (!clientId) {
            console.log('⚠️  DISCORD_CLIENT_ID not set, will extract from token');
            try {
                const base64 = tokenParts[0];
                const decoded = Buffer.from(base64, 'base64').toString('ascii');
                clientId = decoded;
                console.log('✅ Extracted client ID from token:', clientId);
            } catch (error) {
                console.log('❌ Failed to extract client ID from token:', error.message);
            }
        }

        // Discord Configuration
        this.config.discord = {
            token: discordToken,
            clientId: clientId,
            guildId: process.env.DISCORD_GUILD_ID // Optional for guild-specific commands
        };
        
        console.log('✅ Discord configuration set');
        console.log('   Token: SET (' + this.config.discord.token.length + ' chars)');
        console.log('   Client ID:', this.config.discord.clientId || 'NOT SET');
        console.log('   Guild ID:', this.config.discord.guildId || 'NOT SET');

        // Database Configuration with multiple fallbacks
        console.log('');
        console.log('🔍 Setting up database configuration...');
        
        const databaseSources = [
            'DATABASE_PUBLIC_URL',
            'DATABASE_URL', 
            'PGURL',
            'DATABASE_PRIVATE_URL'
        ];
        
        let databaseUrl = null;
        for (const source of databaseSources) {
            const url = process.env[source];
            if (url && typeof url === 'string' && url.trim().length > 0) {
                databaseUrl = url.trim();
                console.log(`✅ Found database URL in ${source}`);
                console.log(`   URL preview: ${databaseUrl.substring(0, 40)}...`);
                break;
            } else {
                console.log(`❌ ${source}: ${url ? 'EMPTY/INVALID' : 'NOT SET'}`);
            }
        }
        
        this.config.database = {
            url: databaseUrl,
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
        
        console.log('✅ All environment variables loaded');
        console.log('🔍 === ENVIRONMENT LOADING COMPLETE ===');
        console.log('');
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
                console.log('✅ Default configuration loaded');
            } catch (error) {
                // Default config is optional
                console.warn('⚠️  Could not load default configuration:', error.message);
            }
        } else {
            console.log('ℹ️  No default configuration file found');
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
                console.log(`✅ ${this.environment} configuration loaded`);
            } catch (error) {
                console.warn(`⚠️  Could not load ${this.environment} configuration:`, error.message);
            }
        } else {
            console.log(`ℹ️  No ${this.environment} configuration file found`);
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
     * Bulletproof configuration validation
     */
    validateConfig() {
        console.log('🔍 === BULLETPROOF CONFIG VALIDATION ===');
        console.log('Starting configuration validation...');
        
        const errors = [];
        
        // Validate Discord token
        console.log('🔍 Validating Discord configuration...');
        if (!this.config.discord || !this.config.discord.token) {
            errors.push('Discord token is missing from configuration');
            console.log('❌ Discord token missing');
        } else {
            const token = this.config.discord.token;
            console.log('✅ Discord token present in config');
            console.log('   Length:', token.length);
            console.log('   Preview:', token.substring(0, 15) + '...');
            
            // Validate token format
            const parts = token.split('.');
            if (parts.length !== 3) {
                errors.push(`Discord token format invalid: ${parts.length} parts (expected 3)`);
                console.log('❌ Token format invalid');
            } else {
                console.log('✅ Token format valid');
            }
            
            if (token.length < 50 || token.length > 80) {
                errors.push(`Discord token length invalid: ${token.length} characters`);
                console.log('❌ Token length invalid');
            } else {
                console.log('✅ Token length valid');
            }
        }
        
        // Validate Database URL
        console.log('🔍 Validating database configuration...');
        if (!this.config.database || !this.config.database.url) {
            errors.push('Database URL is missing from configuration');
            console.log('❌ Database URL missing');
        } else {
            const dbUrl = this.config.database.url;
            console.log('✅ Database URL present in config');
            console.log('   Preview:', dbUrl.substring(0, 40) + '...');
            
            if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
                errors.push('Database URL format invalid (must start with postgresql:// or postgres://)');
                console.log('❌ Database URL format invalid');
            } else {
                console.log('✅ Database URL format valid');
            }
        }
        
        // Report validation results
        if (errors.length > 0) {
            console.log('❌ CONFIGURATION VALIDATION FAILED');
            console.log('Errors found:');
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
            console.log('🔍 === VALIDATION FAILED ===');
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
        
        console.log('✅ All configuration validation passed');
        console.log('🔍 === VALIDATION COMPLETE ===');
        console.log('');

        // Validate numeric values
        this.validateNumericConfig();
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
