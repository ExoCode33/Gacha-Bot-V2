// src/events/client/interactionCreate.js - UPDATED: PvP Integration
const Logger = require('../../utils/Logger');
const ErrorHandler = require('../../utils/ErrorHandler');

module.exports = {
    name: 'interactionCreate',
    
    async execute(interaction) {
        const logger = new Logger('INTERACTION');
        
        try {
            // CRITICAL FIX: Ensure user exists BEFORE any command processing
            await ensureUserExists(interaction);
            
            // Handle slash commands
            if (interaction.isChatInputCommand()) {
                await handleSlashCommand(interaction, logger);
            }
            
            // Handle button interactions
            else if (interaction.isButton()) {
                await handleButtonInteraction(interaction, logger);
            }
            
            // Handle select menu interactions
            else if (interaction.isAnySelectMenu()) {
                await handleSelectMenuInteraction(interaction, logger);
            }
            
        } catch (error) {
            logger.error('Interaction handler error:', error);
            await ErrorHandler.handleCommandError(interaction, error);
        }
    }
};

/**
 * Handle slash command interactions
 */
async function handleSlashCommand(interaction, logger) {
    const command = interaction.client.commands.get(interaction.commandName);
    
    if (!command) {
        logger.warn(`Unknown command: ${interaction.commandName}`);
        await interaction.reply({
            content: '❌ Unknown command!',
            ephemeral: true
        });
        return;
    }
    
    try {
        // User is already ensured to exist at this point
        
        // Use CommandManager to execute command
        const commandManager = interaction.client.commandManager;
        if (commandManager) {
            await commandManager.executeCommand(interaction);
        } else {
            // Fallback to direct execution
            await command.execute(interaction);
        }
        
    } catch (error) {
        logger.error(`Command ${interaction.commandName} failed:`, error);
        await ErrorHandler.handleCommandError(interaction, error);
    }
}

/**
 * Handle button interactions
 */
async function handleButtonInteraction(interaction, logger) {
    const customId = interaction.customId;
    
    // Handle PvP Challenge invitation responses
    if (customId.startsWith('accept_') || customId.startsWith('decline_')) {
        // These are handled by the command's own collector
        logger.debug(`PvP invitation response: ${customId}`);
        return;
    }
    
    // Handle PvP Raid rematch buttons
    if (customId.startsWith('rematch_')) {
        // These are handled by the raid command's collector
        logger.debug(`PvP raid rematch: ${customId}`);
        return;
    }
    
    // Handle PvP Challenge selection/battle buttons
    if (customId.includes('select_') || customId.includes('battle_') || customId.includes('ban_') || customId.includes('confirm_')) {
        const pvpHandler = require('./pvpChallengeHandler');
        await pvpHandler.execute(interaction);
        return;
    }
    
    // Handle gacha animation buttons (from existing system)
    if (customId.startsWith('summon_')) {
        // These are handled by summon command collectors
        logger.debug(`Gacha button: ${customId}`);
        return;
    }
    
    // Handle collection navigation buttons
    if (['collection_first', 'collection_prev', 'collection_next', 'collection_last'].some(btn => customId.startsWith(btn))) {
        // These are handled by collection command collectors
        logger.debug(`Collection navigation: ${customId}`);
        return;
    }
    
    // Handle batch navigation buttons
    if (['batch_first', 'batch_prev', 'batch_summary', 'batch_next', 'batch_last', 'back_to_batches'].includes(customId)) {
        // These are handled by summon command collectors
        logger.debug(`Batch navigation: ${customId}`);
        return;
    }
    
    logger.debug(`Unhandled button interaction: ${customId}`);
}

/**
 * Handle select menu interactions
 */
async function handleSelectMenuInteraction(interaction, logger) {
    const customId = interaction.customId;
    
    // Handle PvP Challenge fruit selection menus
    if (customId.includes('select_fruit_') || customId.includes('ban_fruit_') || customId.includes('battle_switch_')) {
        const pvpHandler = require('./pvpChallengeHandler');
        await pvpHandler.execute(interaction);
        return;
    }
    
    logger.debug(`Select menu interaction: ${customId}`, {
        values: interaction.values
    });
}

/**
 * CRITICAL FIX: Ensure user exists in database BEFORE any command processing
 * This prevents foreign key constraint violations in command_usage table
 */
async function ensureUserExists(interaction) {
    try {
        const DatabaseManager = require('../../database/DatabaseManager');
        
        // Create user if they don't exist
        await DatabaseManager.ensureUser(
            interaction.user.id,
            interaction.user.username,
            interaction.guildId
        );
        
        // Log successful user creation/verification for debugging
        const logger = new Logger('USER_CREATION');
        logger.debug(`User verified/created: ${interaction.user.id} (${interaction.user.username})`);
        
    } catch (error) {
        // Log error but don't fail the interaction completely
        const logger = new Logger('USER_CREATION');
        logger.error('Failed to ensure user exists:', {
            userId: interaction.user.id,
            username: interaction.user.username,
            guildId: interaction.guildId,
            error: error.message,
            stack: error.stack
        });
        
        // Still throw the error to prevent command execution with incomplete user data
        throw new Error(`Failed to create/verify user: ${error.message}`);
    }
}
