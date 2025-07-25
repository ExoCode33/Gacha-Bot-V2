// src/config/Config.js - CPU-Optimized Railway Configuration (EMERGENCY FIX)
const path = require('path');
const fs = require('fs');

class ConfigManager {
    constructor() {
        this.config = {};
        this.isLoaded = false;
        this.environment = process.env.NODE_ENV || 'production';
    }

    async load() {
        try {
            console.log('🔍 === CPU-OPTIMIZED CONFIG LOADING ===');
            console.log('Starting LIGHTWEIGHT configuration load...');
            console.log('Timestamp:', new Date().toISOString());
            console.log('Environment:', this.environment);
            console.log('');
            
            // Load config files first (optional)
            await this.loadOptionalConfigs();
            
            // Load environment variables LAST to override
            this.loadEnvironmentVariables();
            
            // Simple validation
            this.validateConfig();
            
            this.isLoaded = true;
            console.log('✅ CPU-optimized configuration loaded');
            console.log('🔍 === CONFIG LOADING COMPLETE ===');
            
        } catch (error) {
            console.log('❌ Configuration loading failed:', error.message);
            throw new Error(`Configuration loading failed: ${error.message}`);
        }
    }

    loadEnvironmentVariables() {
        console.log('🔍 === RAILWAY ENVIRONMENT LOADING (OPTIMIZED) ===');
        
        // Discord Configuration - Required
        const discordToken = process.env.DISCORD_TOKEN;
        const discordClientId = process.env.DISCORD_CLIENT_ID;
        
        if (!discordToken) {
            throw new Error('DISCORD_TOKEN environment variable is required');
        }
        
        this.config.discord = {
            token: discordToken.trim(),
            clientId: discordClientId || this.extractClientIdFromToken(discordToken),
            guildId: process.env.DISCORD_GUILD_ID || null
        };

        // Database Configuration - Required
        const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
        
        if (!databaseUrl) {
            throw new Error('DATABASE_URL or DATABASE_PUBLIC_URL environment variable is required');
        }
        
        // RAILWAY-OPTIMIZED DATABASE SETTINGS
        this.config.database = {
            url: databaseUrl.trim(),
            ssl: this.environment === 'production',
            pool: {
                min: 1,                    // Reduced from 2
                max: 5,                    // Reduced from 10
                acquireTimeoutMillis: 15000,  // Reduced from 30000
                createTimeoutMillis: 10000,   // Reduced from 15000
                destroyTimeoutMillis: 3000,   // Reduced from 5000
                idleTimeoutMillis: 20000,     // Reduced from 30000
                reapIntervalMillis: 5000,     // Increased from 1000
                createRetryIntervalMillis: 1000  // Increased from 200
            }
        };

        // ULTRA-LIGHTWEIGHT PERFORMANCE SETTINGS
        this.config.performance = {
            commandCooldown: parseInt(process.env.COMMAND_COOLDOWN) || 5000,  // Increased
            rateLimit: {
                window: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
                max: parseInt(process.env.RATE_LIMIT_MAX) || 15  // Reduced from 30
            },
            cacheSize: parseInt(process.env.CACHE_SIZE) || 100,      // Reduced from 1000
            cacheTTL: parseInt(process.env.CACHE_TTL) || 600000      // Increased from 300000
        };

        // DISABLE HEAVY MONITORING
        this.config.monitoring = {
            enabled: process.env.MONITORING_ENABLED === 'true',  // Default FALSE
            interval: parseInt(process.env.MONITORING_INTERVAL) || 300000,  // 5 minutes instead of 30 seconds
            alertThresholds: {
                memory: parseInt(process.env.ALERT_MEMORY_THRESHOLD) || 128,  // Reduced
                cpu: parseInt(process.env.ALERT_CPU_THRESHOLD) || 50,         // Reduced from 80
                latency: parseInt(process.env.ALERT_LATENCY_THRESHOLD) || 1000 // Increased
            }
        };

        // MINIMAL LOGGING
        this.config.logging = {
            level: process.env.LOG_LEVEL || 'warn',  // Changed from 'info' to 'warn'
            console: process.env.LOG_CONSOLE !== 'false',
            file: false,  // DISABLED file logging
            filePath: process.env.LOG_FILE_PATH || './logs',
            maxFiles: 3,  // Reduced from 14
            maxSize: '5m' // Reduced from 20m
        };

        // GAME CONFIGURATION (unchanged)
        this.config.game = {
            pullCost: parseInt(process.env.PULL_COST) || 1000,
            baseIncome: parseInt(process.env.BASE_INCOME) || 50,
            incomeRate: parseFloat(process.env.INCOME_RATE) || 0.1,
            manualIncomeMultiplier: parseFloat(process.env.MANUAL_INCOME_MULTIPLIER) || 6,
            manualIncomeCooldown: parseInt(process.env.MANUAL_INCOME_COOLDOWN) || 60,
            autoIncomeInterval: parseInt(process.env.AUTO_INCOME_INTERVAL) || 10,
            maxStoredHours: parseInt(process.env.MAX_STORED_HOURS) || 24
        };

        // SECURITY (minimal)
        this.config.security = {
            adminUsers: process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',').map(id => id.trim()) : [],
            moderatorRoles: [],  // Simplified
            rateLimitBypass: []  // Simplified
        };

        // DEVELOPMENT (minimal)
        this.config.development = {
            hotReload: false,   // DISABLED
            debugMode: false,   // DISABLED
            testMode: false,    // DISABLED
            mockData: false     // DISABLED
        };

        // PVP (minimal)
        this.config.pvp = {
            enabled: false,  // DISABLED to reduce CPU
            maxQueueSize: 5,
            matchmakingTime: 300,
            battleCooldown: 600,
            maxBattleTurns: 10,
            cpBalanceThreshold: 0.5
        };
        
        console.log('✅ CPU-optimized environment variables loaded');
        console.log('🔍 === ENVIRONMENT LOADING COMPLETE ===');
    }

    async loadOptionalConfigs() {
        // Load configs but don't fail if they don't exist
        try {
            const defaultConfigPath = path.join(__dirname, 'default.json');
            if (fs.existsSync(defaultConfigPath)) {
                const defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
                this.config = { ...defaultConfig };
                console.log('✅ Default configuration loaded');
            }
        } catch (error) {
            console.log('ℹ️ No default config (optional)');
        }

        try {
            const envConfigPath = path.join(__dirname, `${this.environment}.json`);
            if (fs.existsSync(envConfigPath)) {
                const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
                this.config = { ...this.config, ...envConfig };
                console.log(`✅ ${this.environment} configuration loaded`);
            }
        } catch (error) {
            console.log(`ℹ️ No ${this.environment} config (optional)`);
        }
    }

    extractClientIdFromToken(token) {
        try {
            const base64 = token.split('.')[0];
            const decoded = Buffer.from(base64, 'base64').toString('ascii');
            return decoded;
        } catch (error) {
            return null;
        }
    }

    validateConfig() {
        console.log('🔍 === LIGHTWEIGHT CONFIG VALIDATION ===');
        
        const errors = [];
        
        // Only validate critical items
        if (!this.config.discord?.token) {
            errors.push('Discord token is missing');
        }
        
        if (!this.config.database?.url) {
            errors.push('Database URL is missing');
        }
        
        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
        
        console.log('✅ Configuration validation passed (lightweight)');
    }

    // Getters (simplified)
    getAll() {
        if (!this.isLoaded) throw new Error('Configuration not loaded');
        return { ...this.config };
    }

    get(section) {
        if (!this.isLoaded) throw new Error('Configuration not loaded');
        return this.config[section] || {};
    }

    get loaded() { return this.isLoaded; }
    get env() { return this.environment; }
    get isDevelopment() { return this.environment === 'development'; }
    get isProduction() { return this.environment === 'production'; }
    get discord() { return this.get('discord'); }
    get database() { return this.get('database'); }
    get game() { return this.get('game'); }
    get performance() { return this.get('performance'); }
    get monitoring() { return this.get('monitoring'); }
    get security() { return this.get('security'); }
    get logging() { return this.get('logging'); }
    get development() { return this.get('development'); }
    get pvp() { return this.get('pvp'); }

    async reload() {
        this.config = {};
        this.isLoaded = false;
        await this.load();
    }
}

module.exports = new ConfigManager();
