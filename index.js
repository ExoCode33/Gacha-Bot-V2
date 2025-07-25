// index.js - Professional One Piece Devil Fruit Gacha Bot v4.0 with Bypass Test

// =============================================================================
// 🆘 BYPASS CONFIG SYSTEM - DIRECT ENVIRONMENT ACCESS
// =============================================================================
console.log('🆘 === DIRECT ENVIRONMENT ACCESS TEST ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node.js Version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());
console.log('');

// Test ALL environment variables
console.log('🔍 TOTAL ENVIRONMENT VARIABLES:', Object.keys(process.env).length);

// Direct environment access test
console.log('🔍 DIRECT ENVIRONMENT ACCESS:');
const directToken = process.env.DISCORD_TOKEN;
const directDb = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
const directClientId = process.env.DISCORD_CLIENT_ID;

console.log('DISCORD_TOKEN via process.env:', directToken ? 'FOUND' : 'NOT FOUND');
if (directToken) {
    console.log('  Length:', directToken.length);
    console.log('  Preview:', directToken.substring(0, 15) + '...');
    console.log('  Type:', typeof directToken);
} else {
    console.log('  Value:', directToken);
}

console.log('DATABASE_URL via process.env:', directDb ? 'FOUND' : 'NOT FOUND');
if (directDb) {
    console.log('  Preview:', directDb.substring(0, 40) + '...');
    console.log('  Type:', typeof directDb);
} else {
    console.log('  DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL);
    console.log('  DATABASE_URL:', process.env.DATABASE_URL);
}

console.log('DISCORD_CLIENT_ID via process.env:', directClientId ? 'FOUND' : 'NOT FOUND');

// List some environment variables
console.log('');
console.log('🔍 ENVIRONMENT VARIABLE SAMPLE:');
const envKeys = Object.keys(process.env);
console.log('First 10 environment variables:');
envKeys.slice(0, 10).forEach(key => {
    const value = process.env[key];
    if (key.includes('TOKEN') || key.includes('PASSWORD')) {
        console.log(`  ${key}: ${value ? 'SET (****)' : 'NOT SET'}`);
    } else {
        console.log(`  ${key}: ${value ? 'SET' : 'NOT SET'}`);
    }
});

// Railway-specific variables
console.log('');
console.log('🔍 RAILWAY VARIABLES:');
const railwayKeys = envKeys.filter(key => key.includes('RAILWAY'));
railwayKeys.forEach(key => {
    console.log(`  ${key}: ${process.env[key] || 'NOT SET'}`);
});

console.log('🆘 === END DIRECT ACCESS TEST ===');
console.log('');

// =============================================================================
// IF ENVIRONMENT VARIABLES ARE FOUND, SKIP CONFIG AND LOGIN DIRECTLY
// =============================================================================
if (directToken && directDb) {
    console.log('✅ ENVIRONMENT VARIABLES FOUND! Attempting direct Discord login...');
    
    // Skip all the config loading and try direct login
    const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
    
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent
        ],
        presence: {
            activities: [{
                name: 'the Grand Line for Devil Fruits! 🍈',
                type: ActivityType.Watching
            }],
            status: 'online'
        }
    });
    
    console.log('🔐 Attempting direct Discord login with environment token...');
    
    client.once('ready', () => {
        console.log('');
        console.log('🎉 === SUCCESS! DIRECT LOGIN WORKED! ===');
        console.log('✅ Bot logged in as:', client.user.tag);
        console.log('✅ Bot ID:', client.user.id);
        console.log('✅ Connected to', client.guilds.cache.size, 'guilds');
        console.log('✅ Users cached:', client.users.cache.size);
        console.log('');
        console.log('🔧 SOLUTION IDENTIFIED:');
        console.log('   ✅ Environment variables ARE working in Railway');
        console.log('   ✅ Discord token is valid and working');
        console.log('   ✅ Database URL is available');
        console.log('   ❌ The problem is in the Config loading system');
        console.log('');
        console.log('🛠️  NEXT STEPS:');
        console.log('   1. The Config.js bulletproof loading is failing');
        console.log('   2. Environment variables are properly injected by Railway');
        console.log('   3. Need to fix the Config loading logic');
        console.log('');
        console.log('📊 WORKING VALUES:');
        console.log('   Token preview:', directToken.substring(0, 15) + '...');
        console.log('   Database preview:', directDb.substring(0, 40) + '...');
        console.log('   Client ID:', directClientId);
        console.log('');
        console.log('🏴‍☠️ Bot is now online and ready for commands!');
        console.log('   (Running in bypass mode - Config system needs fixing)');
        
        // Keep the bot running to prove it works
        setInterval(() => {
            console.log('💓 Bot heartbeat - still online and working!', new Date().toISOString());
        }, 60000); // Every minute
    });
    
    client.on('error', (error) => {
        console.log('❌ Direct login failed:', error.message);
        console.log('Error code:', error.code);
        if (error.code === 'TokenInvalid') {
            console.log('🔧 Token is invalid. Railway token might be corrupted.');
            console.log('   Check Railway Variables tab to ensure token is set correctly');
        }
        process.exit(1);
    });
    
    // Set up basic error handling
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception thrown:', error);
        process.exit(1);
    });
    
    client.login(directToken).catch(error => {
        console.log('❌ Login attempt failed:', error.message);
        console.log('Error details:', error);
        process.exit(1);
    });
    
} else {
    console.log('❌ ENVIRONMENT VARIABLES NOT FOUND');
    console.log('   Token found:', !!directToken);
    console.log('   Database found:', !!directDb);
    console.log('   Client ID found:', !!directClientId);
    console.log('');
    console.log('🔧 This indicates Railway is not injecting environment variables properly');
    console.log('   Need to check Railway service configuration');
    console.log('');
    console.log('🔍 DEBUGGING INFO:');
    console.log('   Total env vars available:', Object.keys(process.env).length);
    console.log('   Railway environment name:', process.env.RAILWAY_ENVIRONMENT_NAME || 'NOT SET');
    console.log('   Railway service name:', process.env.RAILWAY_SERVICE_NAME || 'NOT SET');
    console.log('');
    console.log('📝 TROUBLESHOOTING STEPS:');
    console.log('   1. Check Railway Variables tab in your service');
    console.log('   2. Ensure variables are set on the BOT service, not database service');
    console.log('   3. Try redeploying the Railway service');
    console.log('   4. Check if there are any deployment errors in Railway');
    console.log('');
    
    // Continue with normal initialization to see the full error
    console.log('📦 Continuing with normal bot initialization for full error details...');
}

// =============================================================================
// ORIGINAL BOT CODE (only runs if bypass fails)
// =============================================================================

require('dotenv').config(); // Load environment variables FIRST

const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const path = require('path');
const fs = require('fs');

// Core modules
const Logger = require('./src/utils/Logger');
const Config = require('./src/config/Config');
const DatabaseManager = require('./src/database/DatabaseManager');
const EventManager = require('./src/events/EventManager');
const CommandManager = require('./src/commands/CommandManager');
const SystemMonitor = require('./src/utils/SystemMonitor');
const ErrorHandler = require('./src/utils/ErrorHandler');

class OnePieceGachaBot {
    constructor() {
        this.client = null;
        this.commandManager = null;
        this.logger = new Logger('BOT_CORE');
        this.isReady = false;
        this.startTime = Date.now();
        
        // Initialize error handlers
        this.setupGlobalErrorHandlers();
        
        this.logger.info('🏴‍☠️ One Piece Devil Fruit Gacha Bot v4.0 Initializing...');
    }

    /**
     * Initialize and start the bot
     */
    async start() {
        try {
            console.log('🔍 === BOT STARTUP DEBUG ===');
            console.log('About to initialize configuration...');
            
            // Load and validate configuration
            await this.initializeConfig();
            
            // Initialize database connection
            await this.initializeDatabase();
            
            // Create Discord client
            this.createClient();
            
            // Load commands and events
            await this.loadCommands();
            await this.loadEvents();
            
            // Register slash commands
            await this.registerCommands();
            
            // Login to Discord
            await this.login();
            
            // Start monitoring systems
            this.startMonitoring();
            
            this.logger.success('🎉 Bot started successfully!');
            
        } catch (error) {
            this.logger.error('Failed to start bot:', error);
            await this.shutdown(1);
        }
    }

    /**
     * Initialize configuration
     */
    async initializeConfig() {
        try {
            console.log('🔍 === CONFIG INITIALIZATION DEBUG ===');
            console.log('About to load configuration...');
            
            await Config.load();
            console.log('Config.load() completed successfully');
            
            // Additional token validation
            console.log('🔍 POST-CONFIG TOKEN CHECK:');
            console.log('Config.discord exists:', !!Config.discord);
            console.log('Config.discord.token exists:', !!Config.discord?.token);
            
            if (Config.discord?.token) {
                console.log('Config token length:', Config.discord.token.length);
                console.log('Config token preview:', Config.discord.token.substring(0, 15) + '...');
            }
            
            this.logger.info('✅ Configuration loaded successfully');
            console.log('🔍 === CONFIG INITIALIZATION COMPLETE ===');
            
        } catch (error) {
            console.log('❌ CONFIG INITIALIZATION FAILED');
            console.log('Error name:', error.name);
            console.log('Error message:', error.message);
            console.log('Error stack:', error.stack);
            
            this.logger.error('Failed to initialize configuration:', error);
            throw error;
        }
    }

    /**
     * Initialize database connection
     */
    async initializeDatabase() {
        try {
            this.logger.info('🗄️ Initializing database connection...');
            
            // Add Railway-recommended delay for database connectivity
            console.log('⏰ Adding 3-second delay for Railway networking...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            await DatabaseManager.connect();
            await DatabaseManager.migrate();
            
            this.logger.success('✅ Database initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize database:', error);
            throw error;
        }
    }

    /**
     * Create Discord client with optimized settings
     */
    createClient() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent
            ],
            allowedMentions: { parse: ['users', 'roles'], repliedUser: false },
            presence: {
                activities: [{
                    name: 'the Grand Line for Devil Fruits! 🍈',
                    type: ActivityType.Watching
                }],
                status: 'online'
            },
            // Optimize for performance
            sweepers: {
                messages: {
                    interval: 300, // 5 minutes
                    lifetime: 1800 // 30 minutes
                },
                users: {
                    interval: 3600, // 1 hour
                    filter: () => user => user.bot && user.id !== this.client.user.id
                }
            }
        });

        // Initialize command collection
        this.client.commands = new Collection();
        this.client.config = Config;
        this.client.logger = this.logger;
        this.client.db = DatabaseManager;

        this.logger.info('✅ Discord client created');
    }

    /**
     * Load all commands
     */
    async loadCommands() {
        try {
            this.logger.info('📁 Loading commands...');
            
            this.commandManager = new CommandManager(this.client);
            this.client.commandManager = this.commandManager; // Store reference
            await this.commandManager.loadCommands();
            
            this.logger.success(`✅ Loaded ${this.client.commands.size} commands`);
            
        } catch (error) {
            this.logger.error('Failed to load commands:', error);
            throw error;
        }
    }

    /**
     * Load all events
     */
    async loadEvents() {
        try {
            this.logger.info('📁 Loading events...');
            
            const eventManager = new EventManager(this.client);
            const eventCount = await eventManager.loadEvents();
            
            this.logger.success(`✅ Loaded ${eventCount} events`);
            
        } catch (error) {
            this.logger.error('Failed to load events:', error);
            throw error;
        }
    }

    /**
     * Register slash commands with Discord
     */
    async registerCommands() {
        try {
            if (!this.client.commands.size) {
                this.logger.warn('No commands to register');
                return;
            }

            this.logger.info('🔄 Registering slash commands...');
            
            const commands = Array.from(this.client.commands.values())
                .map(command => command.data.toJSON());

            const rest = new REST({ version: '10' }).setToken(Config.discord.token);
            
            // Get client ID from token if not provided
            const clientId = Config.discord.clientId || this.getClientIdFromToken(Config.discord.token);
            
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );

            this.logger.success(`✅ Registered ${commands.length} slash commands`);
            
        } catch (error) {
            this.logger.error('Failed to register commands:', error);
            throw error;
        }
    }

    /**
     * Extract client ID from token if needed
     */
    getClientIdFromToken(token) {
        try {
            const base64 = token.split('.')[0];
            const decoded = Buffer.from(base64, 'base64').toString('ascii');
            return decoded;
        } catch (error) {
            this.logger.warn('Could not extract client ID from token');
            return 'temp';
        }
    }

    /**
     * Login to Discord with enhanced debugging
     */
    async login() {
        try {
            this.logger.info('🔐 Logging in to Discord...');
            
            // Enhanced login debugging
            console.log('🔍 === FINAL LOGIN ATTEMPT DEBUG ===');
            const tokenToUse = Config.discord.token;
            console.log('Token source: Config.discord.token');
            console.log('Token exists:', !!tokenToUse);
            console.log('Token type:', typeof tokenToUse);
            console.log('Token length:', tokenToUse ? tokenToUse.length : 0);
            console.log('Token preview:', tokenToUse ? tokenToUse.substring(0, 15) + '...' : 'NONE');
            
            if (!tokenToUse) {
                throw new Error('No Discord token available for login');
            }
            
            // Validate token format before attempting login
            const parts = tokenToUse.split('.');
            if (parts.length !== 3) {
                throw new Error(`Invalid token format - has ${parts.length} parts, should have 3`);
            }
            
            if (tokenToUse.length < 50 || tokenToUse.length > 70) {
                throw new Error(`Invalid token length - ${tokenToUse.length} characters, should be 50-70`);
            }
            
            console.log('✅ Token format validation passed');
            console.log('🔍 === ATTEMPTING DISCORD LOGIN ===');
            
            await this.client.login(tokenToUse);
            
            // Wait for ready event
            await new Promise((resolve) => {
                this.client.once('ready', resolve);
            });
            
            this.isReady = true;
            this.logger.success(`✅ Logged in as ${this.client.user.tag}`);
            
        } catch (error) {
            console.log('❌ LOGIN FAILED WITH ERROR:', error.message);
            console.log('Error code:', error.code);
            console.log('Error name:', error.name);
            
            this.logger.error('Failed to login to Discord:', error);
            throw error;
        }
    }

    /**
     * Start monitoring systems
     */
    startMonitoring() {
        const monitor = new SystemMonitor(this.client);
        monitor.start();
        
        this.logger.info('✅ System monitoring started');
    }

    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        process.on('unhandledRejection', (reason, promise) => {
            ErrorHandler.handleUnhandledRejection(reason, promise);
        });

        process.on('uncaughtException', (error) => {
            ErrorHandler.handleUncaughtException(error);
            this.shutdown(1);
        });

        process.on('SIGINT', () => this.shutdown(0));
        process.on('SIGTERM', () => this.shutdown(0));
    }

    /**
     * Graceful shutdown
     */
    async shutdown(exitCode = 0) {
        this.logger.info('🛑 Initiating graceful shutdown...');
        
        try {
            if (this.client) {
                this.logger.info('📡 Destroying Discord client...');
                this.client.destroy();
            }
            
            this.logger.info('🗄️ Closing database connections...');
            await DatabaseManager.disconnect();
            
            this.logger.success('✅ Shutdown complete');
            
        } catch (error) {
            this.logger.error('Error during shutdown:', error);
        } finally {
            process.exit(exitCode);
        }
    }

    /**
     * Get bot statistics
     */
    getStats() {
        if (!this.isReady) return null;

        return {
            uptime: Date.now() - this.startTime,
            guilds: this.client.guilds.cache.size,
            users: this.client.users.cache.size,
            commands: this.client.commands.size,
            memory: process.memoryUsage(),
            version: '4.0.0'
        };
    }
}

// Only create bot instance if bypass didn't work
if (!directToken || !directDb) {
    // Create and start bot instance
    const bot = new OnePieceGachaBot();

    // Handle startup
    bot.start().catch((error) => {
        console.error('Failed to start bot:', error);
        process.exit(1);
    });

    // Export for testing
    module.exports = { OnePieceGachaBot, bot };
} else {
    console.log('ℹ️  Bot running in bypass mode - Config system bypassed');
    module.exports = { message: 'Bot running in bypass mode' };
}
