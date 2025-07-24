// index.js - Professional One Piece Devil Fruit Gacha Bot v4.0

// =============================================================================
// DEBUG SECTION - Environment Variables Check
// =============================================================================
console.log('🔍 === RAILWAY ENVIRONMENT DEBUG ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node.js Version:', process.version);
console.log('Platform:', process.platform);
console.log('Working Directory:', process.cwd());
console.log('');

console.log('🔍 ENVIRONMENT VARIABLES CHECK:');
console.log('DISCORD_TOKEN exists:', 'DISCORD_TOKEN' in process.env);
console.log('DATABASE_URL exists:', 'DATABASE_URL' in process.env);
console.log('DISCORD_TOKEN value:', process.env.DISCORD_TOKEN ? `${process.env.DISCORD_TOKEN.substring(0, 20)}...` : 'UNDEFINED');
console.log('DATABASE_URL value:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'UNDEFINED');
console.log('');

console.log('🔍 RAILWAY DETECTION:');
console.log('RAILWAY_ENVIRONMENT_NAME:', process.env.RAILWAY_ENVIRONMENT_NAME || 'NOT SET');
console.log('RAILWAY_SERVICE_NAME:', process.env.RAILWAY_SERVICE_NAME || 'NOT SET');
console.log('RAILWAY_PROJECT_NAME:', process.env.RAILWAY_PROJECT_NAME || 'NOT SET');
console.log('');

console.log('🔍 RELATED ENVIRONMENT VARIABLES:');
const allKeys = Object.keys(process.env);
const relevantKeys = allKeys.filter(key => 
    key.includes('DISCORD') || 
    key.includes('TOKEN') || 
    key.includes('DATABASE') || 
    key.includes('POSTGRES') ||
    key.includes('DB_')
);
relevantKeys.forEach(key => {
    const value = process.env[key];
    if (key.includes('TOKEN') || key.includes('PASSWORD')) {
        console.log(`${key}: ${value ? `${value.substring(0, 10)}...` : 'NOT SET'}`);
    } else {
        console.log(`${key}: ${value || 'NOT SET'}`);
    }
});
console.log('');

console.log('🔍 TOTAL ENVIRONMENT VARIABLES:', allKeys.length);
console.log('🔍 === END DEBUG ===');
console.log('');

require('dotenv').config(); // Load environment variables FIRST

console.log('🔍 POST-DOTENV CHECK:');
console.log('DISCORD_TOKEN after dotenv:', process.env.DISCORD_TOKEN ? 'SET' : 'NOT SET');
console.log('DATABASE_URL after dotenv:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('');

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
            console.log('Current process.env.DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? 'EXISTS' : 'MISSING');
            console.log('Current process.env.DATABASE_URL:', process.env.DATABASE_URL ? 'EXISTS' : 'MISSING');
            console.log('');
            
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
            console.log('Current process.env.DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? 'EXISTS' : 'MISSING');
            console.log('Current process.env.DATABASE_URL:', process.env.DATABASE_URL ? 'EXISTS' : 'MISSING');
            
            if (process.env.DISCORD_TOKEN) {
                console.log('DISCORD_TOKEN length:', process.env.DISCORD_TOKEN.length);
                console.log('DISCORD_TOKEN type:', typeof process.env.DISCORD_TOKEN);
                console.log('DISCORD_TOKEN preview:', process.env.DISCORD_TOKEN.substring(0, 30) + '...');
            }
            
            if (process.env.DATABASE_URL) {
                console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
                console.log('DATABASE_URL type:', typeof process.env.DATABASE_URL);
                console.log('DATABASE_URL preview:', process.env.DATABASE_URL.substring(0, 40) + '...');
            }
            
            console.log('Calling Config.load()...');
            await Config.load();
            console.log('Config.load() completed successfully');
            
            this.logger.info('✅ Configuration loaded successfully');
            
            // Additional validation
            const required = ['DISCORD_TOKEN', 'DATABASE_URL'];
            const missing = required.filter(key => !process.env[key]);
            
            if (missing.length > 0) {
                console.log('❌ VALIDATION FAILED - Missing variables:', missing);
                throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
            }
            
            console.log('✅ All required environment variables validated');
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
     * Login to Discord
     */
    async login() {
        try {
            this.logger.info('🔐 Logging in to Discord...');
            
            await this.client.login(Config.discord.token);
            
            // Wait for ready event
            await new Promise((resolve) => {
                this.client.once('ready', resolve);
            });
            
            this.isReady = true;
            this.logger.success(`✅ Logged in as ${this.client.user.tag}`);
            
        } catch (error) {
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
