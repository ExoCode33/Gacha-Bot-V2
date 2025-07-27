// src/commands/slash/pvp/pvp-challenge.js - Complete PvP Challenge Command
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const PvPService = require('../../../services/PvPService');
const DatabaseManager = require('../../../database/DatabaseManager');
const { RARITY_COLORS, FRUIT_WEIGHTS } = require('../../../data/Constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-challenge')
        .setDescription('⚔️ Challenge another player to a PvP battle')
        .addUserOption(option =>
            option.setName('opponent')
                .setDescription('The player you want to challenge')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of battle')
                .setRequired(false)
                .addChoices(
                    { name: '🏆 Ranked Battle', value: 'ranked' },
                    { name: '🎮 Friendly Battle', value: 'friendly' },
                    { name: '🏟️ Tournament Battle', value: 'tournament' }
                )
        ),
    
    category: 'pvp',
    cooldown: 10,
    
    async execute(interaction) {
        const challenger = interaction.user;
        const opponent = interaction.options.getUser('opponent');
        const battleType = interaction.options.getString('type') || 'ranked';
        
        try {
            // Validation checks
            if (challenger.id === opponent.id) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF6B6B')
                            .setTitle('❌ Invalid Challenge')
                            .setDescription('You cannot challenge yourself to a battle!')
                            .setFooter({ text: 'Find a worthy opponent on the Grand Line!' })
                    ],
                    ephemeral: true
                });
            }
            
            if (opponent.bot) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF6B6B')
                            .setTitle('❌ Invalid Challenge')
                            .setDescription('You cannot challenge a bot to battle!')
                            .setFooter({ text: 'Challenge a real pirate instead!' })
                    ],
                    ephemeral: true
                });
            }
            
            // Check if users are already in battles
            const challengerInBattle = PvPService.isUserInBattle(challenger.id);
            const opponentInBattle = PvPService.isUserInBattle(opponent.id);
            
            if (challengerInBattle) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF6B6B')
                            .setTitle('⚔️ Already in Battle')
                            .setDescription('You are already in an active battle! Finish your current fight before challenging someone new.')
                            .setFooter({ text: 'Use /pvp-battle to continue your current fight' })
                    ],
                    ephemeral: true
                });
            }
            
            if (opponentInBattle) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF6B6B')
                            .setTitle('⚔️ Opponent Busy')
                            .setDescription(`${opponent.username} is already in an active battle! Wait for them to finish their current fight.`)
                            .setFooter({ text: 'Try challenging them again later' })
                    ],
                    ephemeral: true
                });
            }
            
            // Ensure users exist in database
            await DatabaseManager.ensureUser(challenger.id, challenger.username, interaction.guildId);
            await DatabaseManager.ensureUser(opponent.id, opponent.username, interaction.guildId);
            
            // Get user battle data for preview
            const challengerData = await PvPService.getPlayerBattleData(challenger.id);
            const opponentData = await PvPService.getPlayerBattleData(opponent.id);
            
            if (!challengerData || !opponentData) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF6B6B')
                            .setTitle('❌ Battle Setup Error')
                            .setDescription('Could not load player data for battle. Please try again.')
                            .setFooter({ text: 'Make sure both players have pulled at least one Devil Fruit!' })
                    ],
                    ephemeral: true
                });
            }
            
            // Create challenge embed
            const challengeEmbed = new EmbedBuilder()
                .setTitle('⚔️ PvP Battle Challenge!')
                .setColor(RARITY_COLORS.legendary)
                .setDescription(`🏴‍☠️ **${challenger.username}** challenges **${opponent.username}** to a ${battleType} battle!\n\n**Battle Preview:**`)
                .addFields(
                    {
                        name: `👤 ${challenger.username} (Challenger)`,
                        value: this.createPlayerPreview(challengerData),
                        inline: true
                    },
                    {
                        name: '⚔️ VS ⚔️',
                        value: '⚡ **Battle Type:**\n' + 
                               `${this.getBattleTypeEmoji(battleType)} ${battleType.charAt(0).toUpperCase() + battleType.slice(1)}\n\n` +
                               '⏰ **Time Limit:**\n10 minutes to accept',
                        inline: true
                    },
                    {
                        name: `🎯 ${opponent.username} (Opponent)`,
                        value: this.createPlayerPreview(opponentData),
                        inline: true
                    }
                )
                .setFooter({ text: 'The challenged player has 10 minutes to respond!' })
                .setTimestamp();
            
            // Create action buttons
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`pvp_accept_${challenger.id}_${opponent.id}_${battleType}`)
                        .setLabel('⚔️ Accept Challenge')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`pvp_decline_${challenger.id}_${opponent.id}_${battleType}`)
                        .setLabel('❌ Decline Challenge')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`pvp_preview_${challenger.id}_${opponent.id}`)
                        .setLabel('👁️ Battle Preview')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            // Send challenge
            await interaction.reply({
                content: `${opponent}, you have been challenged to a PvP battle!`,
                embeds: [challengeEmbed],
                components: [actionRow]
            });
            
            // Set timeout for challenge expiration
            setTimeout(async () => {
                try {
                    const message = await interaction.fetchReply();
                    
                    // Check if challenge was already responded to
                    if (message.components[0]?.components[0]?.disabled) return;
                    
                    // Disable buttons and update message
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('expired')
                                .setLabel('⏰ Challenge Expired')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        );
                    
                    const expiredEmbed = challengeEmbed
                        .setColor('#808080')
                        .setTitle('⏰ Challenge Expired')
                        .setDescription(`The challenge from **${challenger.username}** to **${opponent.username}** has expired.`)
                        .setFields([]) // Clear fields
                        .setFooter({ text: 'Challenge expired after 10 minutes' });
                    
                    await interaction.editReply({
                        content: `Challenge expired - ${opponent.username} did not respond in time.`,
                        embeds: [expiredEmbed],
                        components: [disabledRow]
                    });
                    
                } catch (error) {
                    // Silently handle timeout cleanup errors
                    console.error('Challenge timeout cleanup error:', error);
                }
            }, 10 * 60 * 1000); // 10 minutes
            
        } catch (error) {
            interaction.client.logger.error('PvP challenge command error:', error);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle('❌ Challenge Failed')
                        .setDescription('An error occurred while creating the challenge. Please try again.')
                        .setFooter({ text: 'If the problem persists, contact support' })
                ],
                ephemeral: true
            });
        }
    },
    
    /**
     * Create player preview for challenge
     */
    createPlayerPreview(playerData) {
        const fruit = playerData.selectedFruit;
        const skill = fruit?.skill;
        
        return [
            `**Rank:** ${playerData.rank}`,
            `**Level:** ${playerData.level}`,
            `**Total CP:** ${playerData.totalCP.toLocaleString()}`,
            `**Main Fruit:** ${fruit?.fruit_name || 'None'}`,
            `**Rarity:** ${fruit?.fruit_rarity || 'N/A'}`,
            `**Skill:** ${skill?.name || 'Unknown'} (${skill?.damage || 50} DMG)`
        ].join('\n');
    },
    
    /**
     * Get emoji for battle type
     */
    getBattleTypeEmoji(battleType) {
        const emojis = {
            'ranked': '🏆',
            'friendly': '🎮',
            'tournament': '🏟️'
        };
        return emojis[battleType] || '⚔️';
    }
};
