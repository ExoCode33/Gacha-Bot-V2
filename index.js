// index.js - Professional One Piece Devil Fruit Gacha Bot v4.0 with Enhanced Debugging

// =============================================================================
// ENHANCED ENVIRONMENT DEBUG SECTION
// =============================================================================
console.log('🔍 === ENHANCED ENVIRONMENT DEBUG ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node.js Version:', process.version);
console.log('Platform:', process.platform);
console.log('Working Directory:', process.cwd());
console.log('');

console.log('🔍 ENVIRONMENT VARIABLES CHECK:');
console.log('Total environment variables:', Object.keys(process.env).length);
console.log('');

// Check specifically for Discord token
console.log('🔍 DISCORD TOKEN ANALYSIS:');
console.log('DISCORD_TOKEN in process.env:', 'DISCORD_TOKEN' in process.env);
console.log('DISCORD_TOKEN value exists:', !!process.env.DISCORD_TOKEN);
console.log('DISCORD_TOKEN type:', typeof process.env.DISCORD_TOKEN);

if (process.env.DISCORD_TOKEN) {
    const rawToken = process.env.DISCORD_TOKEN;
    console.log('Raw token length:', rawToken.length);
    console.log('Raw token first 15 chars:', rawToken.substring(0, 15));
    console.log('Raw token last 5 chars:', rawToken.substring(rawToken.length - 5));
    console.log('Raw token has quotes:', rawToken.includes('"') || rawToken.includes("'"));
    console.log('Raw token has spaces:', rawToken.includes(' '));
    console.log('Raw token has newlines:', rawToken.includes('\n') || rawToken.includes('\r'));
    
    // Clean the token
    let cleanToken = rawToken.trim();
    
    // Remove surrounding quotes if present
    if ((cleanToken.startsWith('"') && cleanToken.endsWith('"')) ||
        (cleanToken.startsWith("'") && cleanToken.endsWith("'"))) {
        console.log('🔧 Removing surrounding quotes from token...');
        cleanToken = cleanToken.slice(1, -1);
    }
    
    // Remove any embedded quotes
    if (cleanToken.includes('"') || cleanToken.includes("'")) {
        console.log('🔧 Removing embedded quotes from token...');
        cleanToken = cleanToken.replace(/['"]/g, '');
    }
    
    console.log('Cleaned token length:', cleanToken.length);
    console.log('Cleaned token first 15 chars:', cleanToken.substring(0, 15));
    console.log('Cleaned token last 5 chars:', cleanToken.substring(cleanToken.length - 5));
    
    // Validate token format
    const tokenParts = cleanToken.split('.');
    console.log('Token parts count:', tokenParts.length);
    if (tokenParts.length === 3) {
        console.log('✅ Token has correct 3-part structure');
        console.log('Part 1 length:', tokenParts[0].length);
        console.log('Part 2 length:', tokenParts[1].length);
        console.log('Part 3 length:', tokenParts[2].length);
    } else {
        console.log('❌ Token does not have 3 parts separated by dots');
    }
    
    // Update environment with cleaned token
    process.env.DISCORD_TOKEN = cleanToken;
    console.log('🔧 Updated process.env.DISCORD_TOKEN with cleaned version');
    
} else {
    console.log('❌ DISCORD_TOKEN is not set or is empty');
}

console.log('');

// Check for database URLs
console.log('🔍 DATABASE URLS:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_PUBLIC_URL exists:', !!process.env.DATABASE_PUBLIC_URL);
console.log('DATABASE_PRIVATE_URL exists:', !!process.env.DATABASE_PRIVATE_URL);

console.log('');

// Show Railway-specific variables
console.log('🔍 RAILWAY DETECTION:');
console.log('RAILWAY_ENVIRONMENT_NAME:', process.env.RAILWAY_ENVIRONMENT_NAME || 'NOT SET');
console.log('RAILWAY_SERVICE_NAME:', process.env.RAILWAY_SERVICE_NAME || 'NOT SET');
console.log('RAILWAY_PROJECT_NAME:', process.env.RAILWAY_PROJECT_NAME || 'NOT SET');

console.log('');

// Show all Discord/Token related variables
console.log('🔍 ALL DISCORD/TOKEN VARIABLES:');
const allKeys = Object.keys(process.env);
const relevantKeys = allKeys.filter(key => 
    key.includes('DISCORD') || 
    key.includes('TOKEN') || 
    key.includes('BOT')
);

if (relevantKeys.length > 0) {
    relevantKeys.forEach(key => {
        const value = process.env[key];
        if (key.includes('TOKEN')) {
            console.log(`  ${key}: ${value ? value.substring(0, 15) + '...' : 'NOT SET'}`);
        } else {
            console.log(`  ${key}: ${value || 'NOT SET'}`);
        }
    });
} else {
    console.log('  No Discord/Token related variables found');
}

console.log('');
console.log('🔍 === END ENHANCED DEBUG ===');
console.log('');

// =============================================================================
// ORIGINAL BOT CODE CONTINUES
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
            
            if (error.code === 'TokenInvalid') {
                console.log('');
                console.log('🔧 TOKEN INVALID TROUBLESHOOTING:');
                console.log('1. Go to https://discord.com/developers/applications');
                console.log('2. Select your bot application');
                console.log('3. Go to "Bot" section');
                console.log('4. Click "Reset Token" to generate a new one');
                console.log('5. Copy the new token (all of it, no quotes)');
                console.log('6. In Railway: go to your service → Variables tab');
                console.log('7. Edit DISCORD_TOKEN variable and paste the new token');
                console.log('8. Make sure there are NO quotes around the token');
                console.log('9. Save and redeploy');
                console.log('');
            }
            
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

// Create and start bot instance
const bot = new OnePieceGachaBot();

// Handle startup
bot.start().catch((error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
});

// Export for testing
module.exports = { OnePieceGachaBot, bot };
