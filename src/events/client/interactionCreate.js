// src/events/client/interactionCreate.js - FIXED: Ensure user exists BEFORE command execution
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
    
    // Handle pull animation buttons
    if (customId.startsWith('pull_')) {
        // This will be handled by PullAnimationService
        logger.debug(`Pull animation button: ${customId}`);
        return;
    }
    
    // Handle navigation buttons
    if (['prev', 'next', 'summary'].includes(customId)) {
        // These are handled by the respective services
        logger.debug(`Navigation button: ${customId}`);
        return;
    }
    
    logger.debug(`Unhandled button interaction: ${customId}`);
}

/**
 * Handle select menu interactions
 */
async function handleSelectMenuInteraction(interaction, logger) {
    const customId = interaction.customId;
    
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
