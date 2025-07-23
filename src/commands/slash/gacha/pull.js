// src/commands/slash/gacha/pull.js - Main Pull Command
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GachaService = require('../../../services/GachaService');
const EconomyService = require('../../../services/EconomyService');
const { PULL_COST, MULTI_PULL_DISCOUNT, RARITY_COLORS, RARITY_EMOJIS, ANIMATION_FRAMES } = require('../../../data/Constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pull')
        .setDescription('🍈 Hunt for Devil Fruits with cinematic animation!')
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Number of pulls to make')
                .setRequired(false)
                .addChoices(
                    { name: '1x Single Pull', value: 1 },
                    { name: '10x Multi Pull', value: 10 }
                )
        ),
    
    category: 'gacha',
    cooldown: 5,
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const pullCount = interaction.options.getInteger('count') || 1;
        
        try {
            // Calculate cost
            const cost = pullCount === 10 
                ? PULL_COST * 10 * MULTI_PULL_DISCOUNT 
                : PULL_COST * pullCount;
            
            // Check balance
            const balance = await EconomyService.getBalance(userId);
            if (balance < cost) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('❌ Insufficient Berries')
                            .setDescription(`You need **${cost.toLocaleString()} 🍓** but only have **${balance.toLocaleString()} 🍓**`)
                            .setFooter({ text: 'Use /income to earn more berries!' })
                    ],
                    ephemeral: true
                });
            }
            
            // Deduct berries
            await EconomyService.deductBerries(userId, cost, 'gacha_pull');
            
            // Start pull animation
            const pullAnimation = new PullAnimation(interaction, pullCount);
            await pullAnimation.start();
            
            // Perform pulls
            const results = await GachaService.performPulls(userId, pullCount);
            
            // Show results
            await pullAnimation.showResults(results);
            
        } catch (error) {
            interaction.client.logger.error('Pull command error:', error);
            
            // Try to refund berries on error
            try {
                const cost = pullCount === 10 
                    ? PULL_COST * 10 * MULTI_PULL_DISCOUNT 
                    : PULL_COST * pullCount;
                await EconomyService.addBerries(userId, cost, 'error_refund');
            } catch (refundError) {
                interaction.client.logger.error('Failed to refund berries:', refundError);
            }
            
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ An error occurred during your pull. Your berries have been refunded.',
                    ephemeral: true
                });
            }
        }
    }
};

/**
 * Pull Animation Handler
 */
class PullAnimation {
    constructor(interaction, pullCount) {
        this.interaction = interaction;
        this.pullCount = pullCount;
        this.message = null;
        this.currentFrame = 0;
        this.animationInterval = null;
    }
    
    async start() {
        // Initial animation embed
        const embed = new EmbedBuilder()
            .setColor
