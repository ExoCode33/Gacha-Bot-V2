// src/commands/slash/pvp/pvp-challenge.js - MANUAL PvP Challenge Command
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const { getSkillData } = require('../../../data/DevilFruitSkills');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');

// Challenge configuration
const CHALLENGE_CONFIG = {
    INVITATION_TIMEOUT: 600000, // 10 minutes
    SELECTION_TIMEOUT: 300000,  // 5 minutes for fruit selection
    TURN_TIMEOUT: 120000,       // 2 minutes per turn
    TEAM_SIZE: 5,               // 5 fruits per team
    BANS_PER_SIDE: 2,          // 2 bans per side
    MAX_TURN_DAMAGE: 1000,      // Maximum damage per turn
    FRUITS_PER_PAGE: 20         // Fruits shown per selection page
};

// Active challenges and selections
const activeInvitations = new Map();
const activeSelections = new Map();
const activeBattles = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-challenge')
        .setDescription('⚔️ Challenge another pirate to a strategic 5v5 Devil Fruit battle!')
        .addUserOption(option =>
            option.setName('opponent')
                .setDescription('The pirate you want to challenge')
                .setRequired(true)
        ),
    
    category: 'pvp',
    cooldown: 3,
    
    async execute(interaction) {
        const challenger = interaction.user;
        const opponent = interaction.options.getUser('opponent');
        
        try {
            // Validation
            const validation = await this.validateChallenge(challenger.id, opponent);
            if (!validation.valid) {
                return interaction.reply({
                    embeds: [this.createErrorEmbed(validation.reason)],
                    ephemeral: true
                });
            }
            
            // Create challenge invitation
            const challengeId = this.generateChallengeId();
            const invitationEmbed = this.createInvitationEmbed(challenger, opponent);
            const invitationButtons = this.createInvitationButtons(challengeId);
            
            // Store challenge data
            activeInvitations.set(challengeId, {
                challenger: challenger.id,
                opponent: opponent.id,
                createdAt: Date.now(),
                status: 'pending'
            });
            
            // Send invitation
            await interaction.reply({
                content: `<@${opponent.id}>`,
                embeds: [invitationEmbed],
                components: [invitationButtons]
            });
            
            // Setup invitation collector
            this.setupInvitationCollector(interaction, challengeId);
            
        } catch (error) {
            interaction.client.logger.error('PvP Challenge command error:', error);
            
            const errorResponse = {
                embeds: [this.createErrorEmbed('An error occurred while creating the challenge!')],
                ephemeral: true
            };
            
            await interaction.reply(errorResponse);
        }
    },
    
    /**
     * Validate challenge requirements
     */
    async validateChallenge(challengerId, opponent) {
        if (!opponent || opponent.bot) {
            return { valid: false, reason: 'Cannot challenge bots or invalid users!' };
        }
        
        if (challengerId === opponent.id) {
            return { valid: false, reason: 'Cannot challenge yourself!' };
        }
        
        // Check if users have enough fruits
        try {
            const [challengerFruits, opponentFruits] = await Promise.all([
                DatabaseManager.getUserDevilFruits(challengerId),
                DatabaseManager.getUserDevilFruits(opponent.id)
            ]);
            
            if (challengerFruits.length < CHALLENGE_CONFIG.TEAM_SIZE) {
                return { valid: false, reason: `You need at least ${CHALLENGE_CONFIG.TEAM_SIZE} Devil Fruits to challenge!` };
            }
            
            if (opponentFruits.length < CHALLENGE_CONFIG.TEAM_SIZE) {
                return { valid: false, reason: `Opponent needs at least ${CHALLENGE_CONFIG.TEAM_SIZE} Devil Fruits!` };
            }
            
        } catch (error) {
            return { valid: false, reason: 'Database error during validation!' };
        }
        
        return { valid: true };
    },
    
    /**
     * Create invitation embed
     */
    createInvitationEmbed(challenger, opponent) {
        return new EmbedBuilder()
            .setColor(RARITY_COLORS.legendary)
            .setTitle('⚔️ Pv
