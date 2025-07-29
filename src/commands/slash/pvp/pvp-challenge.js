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
            .setTitle('⚔️ PvP Challenge Invitation!')
            .setDescription(`**${challenger.username}** has challenged **${opponent.username}** to a strategic Devil Fruit battle!`)
            .addFields(
                {
                    name: '🎮 Battle Format',
                    value: [
                        `• **Team Size:** ${CHALLENGE_CONFIG.TEAM_SIZE} Devil Fruits each`,
                        `• **Bans:** ${CHALLENGE_CONFIG.BANS_PER_SIDE} fruits banned per side`,
                        `• **Turns:** Manual turn-based combat`,
                        `• **Time Limit:** ${CHALLENGE_CONFIG.TURN_TIMEOUT / 1000} seconds per turn`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⏰ Time Limit',
                    value: `You have **${CHALLENGE_CONFIG.INVITATION_TIMEOUT / 60000} minutes** to accept or decline this challenge.`,
                    inline: false
                }
            )
            .setThumbnail(challenger.displayAvatarURL())
            .setFooter({ text: 'Choose your response below!' })
            .setTimestamp();
    },
    
    /**
     * Create invitation buttons
     */
    createInvitationButtons(challengeId) {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_${challengeId}`)
                    .setLabel('⚔️ Accept Challenge')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`decline_${challengeId}`)
                    .setLabel('❌ Decline Challenge')
                    .setStyle(ButtonStyle.Danger)
            );
    },
    
    /**
     * Setup invitation collector
     */
    setupInvitationCollector(interaction, challengeId) {
        const collector = interaction.channel.createMessageComponentCollector({
            time: CHALLENGE_CONFIG.INVITATION_TIMEOUT
        });
        
        collector.on('collect', async (buttonInteraction) => {
            const challenge = activeInvitations.get(challengeId);
            if (!challenge) return;
            
            if (buttonInteraction.user.id !== challenge.opponent) {
                return buttonInteraction.reply({
                    content: '❌ Only the challenged user can respond to this invitation!',
                    ephemeral: true
                });
            }
            
            if (buttonInteraction.customId.startsWith('accept_')) {
                await this.handleChallengeAccepted(buttonInteraction, challengeId);
            } else if (buttonInteraction.customId.startsWith('decline_')) {
                await this.handleChallengeDeclined(buttonInteraction, challengeId);
            }
            
            collector.stop();
        });
        
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                const challenge = activeInvitations.get(challengeId);
                if (challenge && challenge.status === 'pending') {
                    this.handleChallengeExpired(interaction, challengeId);
                }
            }
            activeInvitations.delete(challengeId);
        });
    },
    
    /**
     * Handle challenge accepted
     */
    async handleChallengeAccepted(interaction, challengeId) {
        const challenge = activeInvitations.get(challengeId);
        challenge.status = 'accepted';
        
        const acceptedEmbed = new EmbedBuilder()
            .setColor(RARITY_COLORS.epic)
            .setTitle('✅ Challenge Accepted!')
            .setDescription('The battle will now begin with fruit selection phase!')
            .addFields({
                name: '📋 Next Steps',
                value: [
                    '1. Both players select their team of 5 Devil Fruits',
                    '2. Each player bans 2 of opponent\'s fruits',
                    '3. Strategic turn-based battle begins!',
                    '',
                    '⏰ You have 5 minutes for fruit selection.'
                ].join('\n'),
                inline: false
            })
            .setTimestamp();
        
        await interaction.update({
            embeds: [acceptedEmbed],
            components: []
        });
        
        // Start fruit selection phase
        setTimeout(() => this.startFruitSelection(interaction, challengeId), 2000);
    },
    
    /**
     * Handle challenge declined
     */
    async handleChallengeDeclined(interaction, challengeId) {
        const challenge = activeInvitations.get(challengeId);
        challenge.status = 'declined';
        
        const declinedEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('❌ Challenge Declined')
            .setDescription('The challenge has been declined.')
            .setTimestamp();
        
        await interaction.update({
            embeds: [declinedEmbed],
            components: []
        });
    },
    
    /**
     * Handle challenge expired
     */
    async handleChallengeExpired(interaction, challengeId) {
        const expiredEmbed = new EmbedBuilder()
            .setColor('#808080')
            .setTitle('⏰ Challenge Expired')
            .setDescription('The challenge invitation has expired.')
            .setTimestamp();
        
        await interaction.editReply({
            embeds: [expiredEmbed],
            components: []
        }).catch(() => {});
    },
    
    /**
     * Start fruit selection phase
     */
    async startFruitSelection(interaction, challengeId) {
        const challenge = activeInvitations.get(challengeId);
        
        // Get fruits for both users
        const [challengerFruits, opponentFruits] = await Promise.all([
            this.getUserFruitsForSelection(challenge.challenger),
            this.getUserFruitsForSelection(challenge.opponent)
        ]);
        
        // Create selection data
        const selectionId = this.generateSelectionId();
        activeSelections.set(selectionId, {
            challengeId,
            challenger: {
                userId: challenge.challenger,
                fruits: challengerFruits,
                selectedTeam: [],
                currentPage: 0,
                selectionComplete: false
            },
            opponent: {
                userId: challenge.opponent,
                fruits: opponentFruits,
                selectedTeam: [],
                currentPage: 0,
                selectionComplete: false
            },
            phase: 'selection', // 'selection' -> 'banning' -> 'battle'
            createdAt: Date.now()
        });
        
        // Send selection interfaces to both users
        await this.sendSelectionInterface(interaction, selectionId, challenge.challenger, 'challenger');
        await this.sendSelectionInterface(interaction, selectionId, challenge.opponent, 'opponent');
    },
    
    /**
     * Get user fruits formatted for selection
     */
    async getUserFruitsForSelection(userId) {
        const fruits = await DatabaseManager.getUserDevilFruits(userId);
        
        // Group by fruit_id and get best version of each
        const fruitGroups = {};
        fruits.forEach(fruit => {
            const key = fruit.fruit_id;
            if (!fruitGroups[key] || fruit.total_cp > fruitGroups[key].total_cp) {
                fruitGroups[key] = {
                    id: fruit.fruit_id,
                    name: fruit.fruit_name,
                    type: fruit.fruit_type,
                    rarity: fruit.fruit_rarity,
                    description: fruit.fruit_description,
                    totalCP: fruit.total_cp,
                    baseCP: fruit.base_cp,
                    emoji: RARITY_EMOJIS[fruit.fruit_rarity] || '⚪'
                };
            }
        });
        
        // Sort by rarity then by name
        return Object.values(fruitGroups).sort((a, b) => {
            const rarityOrder = { 'divine': 7, 'mythical': 6, 'legendary': 5, 'epic': 4, 'rare': 3, 'uncommon': 2, 'common': 1 };
            const rarityDiff = (rarityOrder[b.rarity] || 1) - (rarityOrder[a.rarity] || 1);
            if (rarityDiff !== 0) return rarityDiff;
            return a.name.localeCompare(b.name);
        });
    },
    
    /**
     * Send selection interface to user
     */
    async sendSelectionInterface(interaction, selectionId, userId, role) {
        const selection = activeSelections.get(selectionId);
        const userData = selection[role];
        
        try {
            const user = await interaction.client.users.fetch(userId);
            const embed = this.createSelectionEmbed(userData, role);
            const components = this.createSelectionComponents(selectionId, userData, role);
            
            await user.send({
                embeds: [embed],
                components
            });
            
        } catch (error) {
            // If DM fails, try in the channel
            console.error('Failed to send DM, trying channel:', error);
            const embed = this.createSelectionEmbed(userData, role);
            const components = this.createSelectionComponents(selectionId, userData, role);
            
            await interaction.followUp({
                content: `<@${userId}> - Your fruit selection interface:`,
                embeds: [embed],
                components,
                ephemeral: false
            });
        }
    },
    
    /**
     * Create selection embed
     */
    createSelectionEmbed(userData, role) {
        const selectedCount = userData.selectedTeam.length;
        const remainingSlots = CHALLENGE_CONFIG.TEAM_SIZE - selectedCount;
        
        const embed = new EmbedBuilder()
            .setColor(RARITY_COLORS.legendary)
            .setTitle(`🍈 Select Your Team (${selectedCount}/${CHALLENGE_CONFIG.TEAM_SIZE})`)
            .setDescription(`Choose ${remainingSlots} more Devil Fruit${remainingSlots !== 1 ? 's' : ''} for your team!`)
            .setFooter({ text: `Page ${userData.currentPage + 1} • Use buttons to navigate and select` })
            .setTimestamp();
        
        // Show current selections
        if (userData.selectedTeam.length > 0) {
            const selectedText = userData.selectedTeam
                .map((fruit, index) => `${index + 1}. ${fruit.emoji} **${fruit.name}** (${fruit.totalCP} CP)`)
                .join('\n');
            
            embed.addFields({
                name: '✅ Selected Team',
                value: selectedText,
                inline: false
            });
        }
        
        // Show available fruits for current page
        const startIndex = userData.currentPage * CHALLENGE_CONFIG.FRUITS_PER_PAGE;
        const endIndex = startIndex + CHALLENGE_CONFIG.FRUITS_PER_PAGE;
        const pageFruits = userData.fruits.slice(startIndex, endIndex);
        
        if (pageFruits.length > 0) {
            const availableText = pageFruits
                .map((fruit, index) => {
                    const globalIndex = startIndex + index;
                    const isSelected = userData.selectedTeam.some(s => s.id === fruit.id);
                    const status = isSelected ? '✅' : `${globalIndex + 1}.`;
                    return `${status} ${fruit.emoji} **${fruit.name}** (${fruit.rarity}, ${fruit.totalCP} CP)`;
                })
                .join('\n');
            
            embed.addFields({
                name: '🍈 Available Fruits',
                value: availableText.length > 1000 ? availableText.substring(0, 997) + '...' : availableText,
                inline: false
            });
        }
        
        return embed;
    },
    
    /**
     * Create selection components
     */
    createSelectionComponents(selectionId, userData, role) {
        const components = [];
        
        // Navigation buttons
        const navRow = new ActionRowBuilder();
        
        if (userData.currentPage > 0) {
            navRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`select_prev_${selectionId}_${role}`)
                    .setLabel('⬅️ Previous')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        
        const totalPages = Math.ceil(userData.fruits.length / CHALLENGE_CONFIG.FRUITS_PER_PAGE);
        if (userData.currentPage < totalPages - 1) {
            navRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`select_next_${selectionId}_${role}`)
                    .setLabel('➡️ Next')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        
        if (navRow.components.length > 0) {
            components.push(navRow);
        }
        
        // Fruit selection dropdown
        const startIndex = userData.currentPage * CHALLENGE_CONFIG.FRUITS_PER_PAGE;
        const endIndex = startIndex + CHALLENGE_CONFIG.FRUITS_PER_PAGE;
        const pageFruits = userData.fruits.slice(startIndex, endIndex);
        
        if (pageFruits.length > 0) {
            const options = pageFruits.map((fruit, index) => {
                const globalIndex = startIndex + index;
                const isSelected = userData.selectedTeam.some(s => s.id === fruit.id);
                
                return {
                    label: `${fruit.name} (${fruit.totalCP} CP)`.substring(0, 100),
                    description: `${fruit.rarity} • ${fruit.type}`.substring(0, 100),
                    value: `fruit_${globalIndex}`,
                    emoji: fruit.emoji,
                    default: isSelected
                };
            });
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`select_fruit_${selectionId}_${role}`)
                .setPlaceholder('Select a Devil Fruit for your team...')
                .setMinValues(0)
                .setMaxValues(Math.min(options.length, CHALLENGE_CONFIG.TEAM_SIZE - userData.selectedTeam.length))
                .addOptions(options);
            
            components.push(new ActionRowBuilder().addComponents(selectMenu));
        }
        
        // Action buttons
        const actionRow = new ActionRowBuilder();
        
        if (userData.selectedTeam.length > 0) {
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`clear_selection_${selectionId}_${role}`)
                    .setLabel('🗑️ Clear All')
                    .setStyle(ButtonStyle.Danger)
            );
        }
        
        if (userData.selectedTeam.length === CHALLENGE_CONFIG.TEAM_SIZE) {
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_team_${selectionId}_${role}`)
                    .setLabel('✅ Confirm Team')
                    .setStyle(ButtonStyle.Success)
            );
        }
        
        if (actionRow.components.length > 0) {
            components.push(actionRow);
        }
        
        return components;
    },
    
    /**
     * Create error embed
     */
    createErrorEmbed(message) {
        return new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Challenge Error')
            .setDescription(message)
            .setTimestamp();
    },
    
    /**
     * Generate unique challenge ID
     */
    generateChallengeId() {
        return `challenge_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    },
    
    /**
     * Generate unique selection ID
     */
    generateSelectionId() {
        return `selection_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
};
