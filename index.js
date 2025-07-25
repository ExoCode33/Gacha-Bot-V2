// index.js - Add this at the VERY TOP, before any other code

// =============================================================================
// 🆘 EMERGENCY DEBUGGING - MUST BE FIRST
// =============================================================================
console.log('🆘 === EMERGENCY DEBUG START ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node.js version:', process.version);
console.log('File:', __filename);
console.log('Directory:', __dirname);
console.log('');

console.log('🆘 IMMEDIATE ENVIRONMENT CHECK:');
console.log('Total env vars:', Object.keys(process.env).length);
console.log('DISCORD_TOKEN exists:', 'DISCORD_TOKEN' in process.env);
console.log('DISCORD_TOKEN type:', typeof process.env.DISCORD_TOKEN);
console.log('DISCORD_TOKEN length:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0);
console.log('DISCORD_TOKEN preview:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.substring(0, 10) + '...' : 'NONE');
console.log('');

console.log('DATABASE_PUBLIC_URL exists:', 'DATABASE_PUBLIC_URL' in process.env);
console.log('DATABASE_URL exists:', 'DATABASE_URL' in process.env);
console.log('DATABASE_PUBLIC_URL preview:', process.env.DATABASE_PUBLIC_URL ? process.env.DATABASE_PUBLIC_URL.substring(0, 30) + '...' : 'NONE');
console.log('');

console.log('🆘 RAILWAY DETECTION:');
console.log('RAILWAY_ENVIRONMENT_NAME:', process.env.RAILWAY_ENVIRONMENT_NAME || 'NOT SET');
console.log('RAILWAY_SERVICE_NAME:', process.env.RAILWAY_SERVICE_NAME || 'NOT SET');
console.log('RAILWAY_PROJECT_NAME:', process.env.RAILWAY_PROJECT_NAME || 'NOT SET');
console.log('');

console.log('🆘 === EMERGENCY DEBUG END ===');
console.log('');

// =============================================================================
// CONTINUE WITH ORIGINAL CODE
// =============================================================================

require('dotenv').config(); // Load environment variables FIRST

console.log('📦 Loading Discord.js...');
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const path = require('path');
const fs = require('fs');

console.log('📦 Loading core modules...');
// Core modules
const Logger = require('./src/utils/Logger');
const Config = require('./src/config/Config');
const DatabaseManager = require('./src/database/DatabaseManager');
const EventManager = require('./src/events/EventManager');
const CommandManager = require('./src/commands/CommandManager');
const SystemMonitor = require('./src/utils/SystemMonitor');
const ErrorHandler = require('./src/utils/ErrorHandler');

console.log('📦 All modules loaded, creating bot class...');

class OnePieceGachaBot {
    constructor() {
        console.log('🤖 Bot constructor called');
        this.client = null;
        this.commandManager = null;
        this.logger = new Logger('BOT_CORE');
        this.isReady = false;
        this.startTime = Date.now();
        
        // Initialize error handlers
        this.setupGlobalErrorHandlers();
        
        this.logger.info('🏴‍☠️ One Piece Devil Fruit Gacha Bot v4.0 Initializing...');
        console.log('🤖 Bot constructor completed');
    }

    /**
     * Initialize and start the bot
     */
    async start() {
        try {
            console.log('🚀 Bot.start() called');
            console.log('🔍 === BOT STARTUP DEBUG ===');
            console.log('About to initialize configuration...');
            
            // Load and validate configuration
            console.log('⚙️ About to call Config.load()...');
            await this.initializeConfig();
            console.log('✅ Configuration initialization completed');
            
            // Initialize database connection
            console.log('🗄️ About to initialize database...');
            await this.initializeDatabase();
            console.log('✅ Database initialization completed');
            
            // Create Discord client
            console.log('🤖 About to create Discord client...');
            this.createClient();
            console.log('✅ Discord client created');
            
            // Load commands and events
            console.log('📁 About to load commands...');
            await this.loadCommands();
            console.log('✅ Commands loaded');
            
            console.log('📁 About to load events...');
            await this.loadEvents();
            console.log('✅ Events loaded');
            
            // Register slash commands
            console.log('🔄 About to register commands...');
            await this.registerCommands();
            console.log('✅ Commands registered');
            
            // Login to Discord
            console.log('🔐 About to login to Discord...');
            await this.login();
            console.log('✅ Discord login completed');
            
            // Start monitoring systems
            console.log('📊 About to start monitoring...');
            this.startMonitoring();
            console.log('✅ Monitoring started');
            
            this.logger.success('🎉 Bot started successfully!');
            
        } catch (error) {
            console.log('❌ Bot.start() failed with error:', error.message);
            console.log('Error stack:', error.stack);
            this.logger.error('Failed to start bot:', error);
            await this.shutdown(1);
        }
    }

    /**
     * Initialize configuration
     */
    async initializeConfig() {
        try {
            console.log('⚙️ === CONFIG INITIALIZATION DEBUG ===');
            console.log('About to load configuration...');
            console.log('Config module type:', typeof Config);
            console.log('Config.load function exists:', typeof Config.load === 'function');
            
            console.log('🔧 Calling Config.load()...');
            await Config.load();
            console.log('🔧 Config.load() returned successfully');
            
            // Additional token validation
            console.log('🔍 POST-CONFIG TOKEN CHECK:');
            console.log('Config object exists:', !!Config);
            console.log('Config.discord exists:', !!Config.discord);
            console.log('Config.discord.token exists:', !!Config.discord?.token);
            
            if (Config.discord?.token) {
                console.log('Config token length:', Config.discord.token.length);
                console.log('Config token preview:', Config.discord.token.substring(0, 15) + '...');
            } else {
                console.log('❌ Config.discord.token is NOT SET after Config.load()');
                console.log('Config.discord contents:', Config.discord);
            }
            
            this.logger.info('✅ Configuration loaded successfully');
            console.log('⚙️ === CONFIG INITIALIZATION COMPLETE ===');
            
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
                console.log('❌ Token is null/undefined, trying direct environment access...');
                const directToken = process.env.DISCORD_TOKEN;
                console.log('Direct env token exists:', !!directToken);
                if (directToken) {
                    console.log('Direct env token length:', directToken.length);
                    console.log('Direct env token preview:', directToken.substring(0, 15) + '...');
                    console.log('🔧 Using direct environment token for login...');
                    await this.client.login(directToken);
                } else {
                    throw new Error('No Discord token available for login - both Config and direct env access failed');
                }
            } else {
                // Validate token format before attempting login
                const parts = tokenToUse.split('.');
                if (parts.length !== 3) {
                    throw new Error(`Invalid token format - has ${parts.length} parts, should have 3`);
                }
                
                if (tokenToUse.length < 50 || tokenToUse.length > 80) {
                    throw new Error(`Invalid token length - ${tokenToUse.length} characters, should be 50-80`);
                }
                
                console.log('✅ Token format validation passed');
                console.log('🔍 === ATTEMPTING DISCORD LOGIN ===');
                
                await this.client.login(tokenToUse);
            }
            
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

console.log('🤖 Creating bot instance...');
// Create and start bot instance
const bot = new OnePieceGachaBot();

console.log('🚀 Starting bot...');
// Handle startup
bot.start().catch((error) => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
});

// Export for testing
module.exports = { OnePieceGachaBot, bot };
