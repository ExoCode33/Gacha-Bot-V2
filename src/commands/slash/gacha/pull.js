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
            .setColor('#FFD700')
            .setTitle('🌊 Searching the Grand Line...')
            .setDescription(ANIMATION_FRAMES[0])
            .setFooter({ text: `${this.pullCount}x Pull${this.pullCount > 1 ? 's' : ''} in progress...` });
        
        this.message = await this.interaction.reply({
            embeds: [embed],
            fetchReply: true
        });
        
        // Start animation loop
        this.animationInterval = setInterval(() => {
            this.updateAnimation();
        }, 1000);
        
        // Stop animation after 5 seconds
        setTimeout(() => {
            if (this.animationInterval) {
                clearInterval(this.animationInterval);
            }
        }, 5000);
    }
    
    async updateAnimation() {
        this.currentFrame++;
        
        if (this.currentFrame >= ANIMATION_FRAMES.length) {
            clearInterval(this.animationInterval);
            return;
        }
        
        const embed = EmbedBuilder.from(this.message.embeds[0])
            .setDescription(ANIMATION_FRAMES[this.currentFrame]);
        
        try {
            await this.message.edit({ embeds: [embed] });
        } catch (error) {
            clearInterval(this.animationInterval);
        }
    }
    
    async showResults(results) {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
        
        const embeds = [];
        
        // Create result embeds
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const { fruit, isNew, duplicateCount } = result;
            
            const rarityColor = RARITY_COLORS[fruit.fruit_rarity];
            const rarityEmoji = RARITY_EMOJIS[fruit.fruit_rarity];
            
            const embed = new EmbedBuilder()
                .setColor(rarityColor)
                .setTitle(`${rarityEmoji} ${fruit.fruit_name}`)
                .setDescription(fruit.fruit_description)
                .addFields(
                    { name: '🎭 Type', value: fruit.fruit_type, inline: true },
                    { name: '⭐ Rarity', value: fruit.fruit_rarity.charAt(0).toUpperCase() + fruit.fruit_rarity.slice(1), inline: true },
                    { name: '⚡ CP Multiplier', value: `x${(fruit.base_cp / 100).toFixed(1)}`, inline: true },
                    { name: '📊 Status', value: isNew ? '✨ NEW!' : `📚 Duplicate #${duplicateCount}`, inline: true }
                )
                .setFooter({ text: `Pull ${i + 1}/${this.pullCount}` });
            
            embeds.push(embed);
        }
        
        // Navigation buttons for multi-pull
        const components = this.pullCount > 1 ? [this.createNavigationRow(0, results.length)] : [];
        
        await this.message.edit({
            embeds: [embeds[0]],
            components
        });
        
        // Setup collector for navigation
        if (this.pullCount > 1) {
            this.setupNavigationCollector(embeds, results);
        }
    }
    
    createNavigationRow(currentIndex, totalCount) {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⬅️')
                    .setDisabled(currentIndex === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➡️')
                    .setDisabled(currentIndex === totalCount - 1),
                new ButtonBuilder()
                    .setCustomId('summary')
                    .setLabel('Summary')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📊')
            );
    }
    
    setupNavigationCollector(embeds, results) {
        const collector = this.message.createMessageComponentCollector({
            time: 300000 // 5 minutes
        });
        
        let currentIndex = 0;
        
        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.user.id !== this.interaction.user.id) {
                return buttonInteraction.reply({
                    content: 'These buttons are not for you!',
                    ephemeral: true
                });
            }
            
            switch (buttonInteraction.customId) {
                case 'prev':
                    currentIndex = Math.max(0, currentIndex - 1);
                    break;
                case 'next':
                    currentIndex = Math.min(embeds.length - 1, currentIndex + 1);
                    break;
                case 'summary':
                    return this.showSummary(buttonInteraction, results);
            }
            
            await buttonInteraction.update({
                embeds: [embeds[currentIndex]],
                components: [this.createNavigationRow(currentIndex, embeds.length)]
            });
        });
        
        collector.on('end', () => {
            this.message.edit({ components: [] }).catch(() => {});
        });
    }
    
    async showSummary(interaction, results) {
        const summary = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('📊 Pull Summary')
            .setDescription(`You pulled ${this.pullCount} Devil Fruit${this.pullCount > 1 ? 's' : ''}!`);
        
        // Group by rarity
        const rarityGroups = {};
        results.forEach(({ fruit }) => {
            if (!rarityGroups[fruit.fruit_rarity]) {
                rarityGroups[fruit.fruit_rarity] = [];
            }
            rarityGroups[fruit.fruit_rarity].push(fruit.fruit_name);
        });
        
        // Add fields for each rarity
        const rarityOrder = ['legendary', 'mythical', 'epic', 'rare', 'uncommon', 'common'];
        rarityOrder.forEach(rarity => {
            if (rarityGroups[rarity]) {
                summary.addFields({
                    name: `${RARITY_EMOJIS[rarity]} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`,
                    value: rarityGroups[rarity].join('\n'),
                    inline: true
                });
            }
        });
        
        await interaction.reply({
            embeds: [summary],
            ephemeral: true
        });
    }
}
