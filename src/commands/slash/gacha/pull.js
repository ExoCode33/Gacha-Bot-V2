// src/commands/slash/gacha/pull.js - Enhanced Pull Command with Cinematic Animations
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GachaService = require('../../../services/GachaService');
const EconomyService = require('../../../services/EconomyService');
const DatabaseManager = require('../../../database/DatabaseManager');
const { PULL_COST, RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');
const { getFruitsByRarity, getRandomFruitByRarity } = require('../../../data/DevilFruits');

// Animation Configuration
const ANIMATION_CONFIG = {
    RAINBOW_FRAMES: 6,
    RAINBOW_DELAY: 900,
    SPREAD_FRAMES: 12,
    SPREAD_DELAY: 400,
    REVEAL_FRAMES: 8,
    REVEAL_DELAY: 700,
    QUICK_FRAMES: 5,
    QUICK_DELAY: 500
};

const HUNT_DESCRIPTIONS = [
    "🌊 Scanning the Grand Line's mysterious depths...",
    "⚡ Devil Fruit energy detected... analyzing power signature...",
    "🔥 Tremendous force breaking through dimensional barriers...",
    "💎 Legendary power crystallizing before your eyes...",
    "🌟 Ancient mysteries awakening from the ocean's heart...",
    "⚔️ The sea itself trembles with anticipation..."
];

class PullAnimator {
    // Rainbow pattern for animations
    static getRainbowPattern(frame, length = 20) {
        const colors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
        const pattern = [];
        
        for (let i = 0; i < length; i++) {
            const colorIndex = (i + frame) % colors.length;
            pattern.push(colors[colorIndex]);
        }
        
        return pattern.join(' ');
    }

    static getRainbowColor(frame) {
        const colors = [0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 0x8B4513];
        return colors[frame % colors.length];
    }

    // Create rainbow hunt frame
    static createRainbowFrame(frame, fruit) {
        const pattern = this.getRainbowPattern(frame);
        const color = this.getRainbowColor(frame);
        const description = HUNT_DESCRIPTIONS[frame] || HUNT_DESCRIPTIONS[5];
        
        const animatedDots = '.'.repeat((frame % 3) + 1);
        const mysteriousInfo = `✨ **Devil Fruit Hunt in Progress** ✨\n\n${pattern}\n\n` +
            `📊 **Status:** Scanning${animatedDots}\n` +
            `🍃 **Name:** ???\n` +
            `🔮 **Type:** ???\n` +
            `⭐ **Rarity:** ???\n` +
            `💪 **CP Multiplier:** ???\n` +
            `⚡ **Power:** ???\n\n` +
            `${pattern}`;
        
        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(`${description}\n\n${mysteriousInfo}`)
            .setColor(color)
            .setFooter({ text: `🌊 Searching the mysterious seas... Frame ${frame + 1}/6` });
    }

    // Create color spread frame
    static createColorSpreadFrame(frame, fruit, rewardColor, rewardEmoji) {
        const barLength = 20;
        const center = 9.5;
        const spreadRadius = Math.floor(frame * 1.0);
        
        const bar = Array(barLength).fill('⬛');
        const rainbowColors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
        
        for (let i = 0; i < barLength; i++) {
            const distanceFromCenter = Math.abs(i - center);
            
            if (distanceFromCenter <= spreadRadius) {
                bar[i] = rewardEmoji;
            } else {
                const colorIndex = Math.floor(distanceFromCenter + frame * 0.5) % rainbowColors.length;
                bar[i] = rainbowColors[colorIndex];
            }
        }

        const pattern = bar.join(' ');
        const progressDots = '●'.repeat(Math.floor(frame / 2)) + '○'.repeat(6 - Math.floor(frame / 2));
        
        const mysteriousInfo = `✨ **Devil Fruit Manifestation** ✨\n\n${pattern}\n\n` +
            `📊 **Status:** Crystallizing${'.'.repeat((frame % 3) + 1)}\n` +
            `🍃 **Name:** ???\n` +
            `🔮 **Type:** ???\n` +
            `⭐ **Rarity:** ???\n` +
            `💪 **CP Multiplier:** ???\n` +
            `⚡ **Power:** ???\n\n` +
            `${pattern}`;
        
        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(`🔮 Mysterious power manifesting...\n\n${mysteriousInfo}`)
            .setColor(rewardColor)
            .setFooter({ text: `⚡ Power crystallizing... ${progressDots}` });
    }

    // Create text reveal frame
    static createTextRevealFrame(frame, fruit, result, newBalance, rewardColor, rewardEmoji) {
        const pattern = Array(20).fill(rewardEmoji).join(' ');
        const duplicateCount = result.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `📚 Total Owned: ${duplicateCount}`;
        const totalCp = result.fruit?.total_cp || 250;
        
        const glowEffect = frame >= 7 ? '✨ ' : '';
        let description = `${glowEffect}**Devil Fruit Acquired!** ${glowEffect}\n\n${pattern}\n\n`;
        description += `📊 **Status:** ${frame >= 0 ? duplicateText : '???'}\n`;
        description += `🍃 **Name:** ${frame >= 1 ? fruit.name : '???'}\n`;
        description += `🔮 **Type:** ${frame >= 2 ? fruit.type : '???'}\n`;
        description += `⭐ **Rarity:** ${frame >= 3 ? `${RARITY_EMOJIS[fruit.rarity]} ${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)}` : '???'}\n`;
        description += `💪 **CP Multiplier:** ${frame >= 4 ? `x${fruit.multiplier}` : '???'}\n`;
        description += `⚡ **Power:** ${frame >= 5 ? fruit.power : '???'}\n`;
        description += `🎯 **Description:** ${frame >= 6 ? fruit.description : '???'}\n\n`;
        description += `🔥 **Total CP:** ${frame >= 7 ? `${totalCp.toLocaleString()} CP` : '???'}\n`;
        description += `💰 **Remaining Berries:** ${newBalance.toLocaleString()} 🍓\n\n`;
        description += `${pattern}`;

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(description)
            .setColor(rewardColor)
            .setFooter({ text: `🎉 Added to your collection! Revealing... ${frame + 1}/8` });
    }

    // Create final reveal
    static createFinalReveal(fruit, result, newBalance) {
        const emoji = RARITY_EMOJIS[fruit.rarity];
        const color = RARITY_COLORS[fruit.rarity];
        const pattern = Array(20).fill(emoji).join(' ');
        const duplicateCount = result.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `📚 Total Owned: ${duplicateCount}`;
        const totalCp = result.fruit?.total_cp || 250;

        const description = `🎉 **Congratulations!** You've obtained a magnificent Devil Fruit! 🎉\n\n${pattern}\n\n` +
            `📊 **Status:** ${duplicateText}\n` +
            `🍃 **Name:** ${fruit.name}\n` +
            `🔮 **Type:** ${fruit.type}\n` +
            `⭐ **Rarity:** ${emoji} ${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)}\n` +
            `💪 **CP Multiplier:** x${fruit.multiplier}\n` +
            `⚡ **Power:** ${fruit.power}\n` +
            `🎯 **Description:** ${fruit.description}\n\n` +
            `🔥 **Total CP:** ${totalCp.toLocaleString()} CP\n` +
            `💰 **Remaining Berries:** ${newBalance.toLocaleString()} 🍓\n\n` +
            `${pattern}`;

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt Complete!')
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: '🏴‍☠️ Your legend grows on the Grand Line!' })
            .setTimestamp();
    }

    // Create quick frame for 10x
    static createQuickFrame(frame, fruit, pullNumber) {
        const pattern = this.getRainbowPattern(frame, 15);
        const color = this.getRainbowColor(frame);
        const progressDots = '●'.repeat(frame + 1) + '○'.repeat(4 - frame);
        
        return new EmbedBuilder()
            .setTitle('🎰 10x Devil Fruit Hunt')
            .setDescription(`**Pull ${pullNumber}/10**\n\n🌊 Scanning the Grand Line...\n\n${pattern}\n\n📊 **Status:** Analyzing... ${progressDots}\n🍃 **Fruit:** ???\n⭐ **Rarity:** ???\n\n${pattern}`)
            .setColor(color)
            .setFooter({ text: `Pull ${pullNumber} of 10 - Searching...` });
    }

    // Create quick reveal for 10x
    static createQuickReveal(fruit, pullNumber) {
        const emoji = RARITY_EMOJIS[fruit.rarity];
        const color = RARITY_COLORS[fruit.rarity];
        const pattern = Array(15).fill(emoji).join(' ');
        
        return new EmbedBuilder()
            .setTitle('🎰 10x Devil Fruit Hunt')
            .setDescription(`**Pull ${pullNumber}/10** - ${emoji} **${fruit.rarity.toUpperCase()}**\n\n${pattern}\n\n🍃 **${fruit.name}**\n🔮 ${fruit.type}\n💪 x${fruit.multiplier} CP\n\n${pattern}`)
            .setColor(color)
            .setFooter({ text: `Pull ${pullNumber} of 10 - ✨ Acquired!` });
    }

    // Create 10x summary
    static create10xSummary(fruits, results, balance) {
        const rarityCounts = {};
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'mythical', 'legendary'];
        
        rarityOrder.forEach(rarity => { rarityCounts[rarity] = 0; });
        fruits.forEach(fruit => { rarityCounts[fruit.rarity]++; });

        let rarityText = '';
        rarityOrder.forEach(rarity => {
            if (rarityCounts[rarity] > 0) {
                const emoji = RARITY_EMOJIS[rarity];
                rarityText += `${emoji} **${rarity.charAt(0).toUpperCase() + rarity.slice(1)}**: ${rarityCounts[rarity]}\n`;
            }
        });

        // Get highest rarity
        let highestRarity = 'common';
        [...rarityOrder].reverse().forEach(rarity => {
            if (rarityCounts[rarity] > 0 && highestRarity === 'common') {
                highestRarity = rarity;
            }
        });

        const highestEmoji = RARITY_EMOJIS[highestRarity];
        const highestColor = RARITY_COLORS[highestRarity];

        return new EmbedBuilder()
            .setTitle('🎰 10x Devil Fruit Hunt Complete!')
            .setDescription(`🎉 **10x Pull Complete!** 🎉\n\n**Highest Rarity:** ${highestEmoji} ${highestRarity.charAt(0).toUpperCase() + highestRarity.slice(1)}\n\n**Results:**\n${rarityText}\n💰 **Remaining Berries:** ${balance.toLocaleString()} 🍓\n\n✨ All fruits have been added to your collection!`)
            .setColor(highestColor)
            .setFooter({ text: '🏴‍☠️ Continue your adventure on the Grand Line!' })
            .setTimestamp();
    }
}

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
                ? PULL_COST * 10 * 0.9  // 10% discount for 10-pull
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
            const newBalance = balance - cost;
            
            // Perform pulls with animation
            if (pullCount === 1) {
                await this.runSinglePull(interaction, newBalance);
            } else {
                await this.run10xPull(interaction, newBalance);
            }
            
        } catch (error) {
            interaction.client.logger.error('Pull command error:', error);
            
            // Try to refund berries on error
            try {
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
    },

    async runSinglePull(interaction, newBalance) {
        // Get fruit from gacha service
        const results = await GachaService.performPulls(interaction.user.id, 1);
        const result = results[0];
        const fruit = result.fruit;
        
        // Convert database result to display format
        const displayFruit = {
            name: fruit.fruit_name,
            type: fruit.fruit_type,
            rarity: fruit.fruit_rarity,
            multiplier: (fruit.base_cp / 100).toFixed(1),
            power: fruit.fruit_power,
            description: fruit.fruit_description
        };
        
        console.log(`🎯 Single pull: ${displayFruit.name} (${displayFruit.rarity})`);
        
        // Run full animation
        await this.runFullAnimation(interaction, displayFruit, result, newBalance);
        await this.setupButtons(interaction);
    },

    async run10xPull(interaction, newBalance) {
        // Get fruits from gacha service
        const results = await GachaService.performPulls(interaction.user.id, 10);
        
        // Convert to display format
        const displayFruits = results.map(result => ({
            name: result.fruit.fruit_name,
            type: result.fruit.fruit_type,
            rarity: result.fruit.fruit_rarity,
            multiplier: (result.fruit.base_cp / 100).toFixed(1),
            power: result.fruit.fruit_power,
            description: result.fruit.fruit_description
        }));
        
        console.log(`🎯 10x pull starting`);
        
        // Run 10x animation
        await this.run10xAnimation(interaction, displayFruits, results, newBalance);
        await this.setupButtons(interaction);
    },

    async runFullAnimation(interaction, fruit, result, newBalance) {
        // Phase 1: Rainbow hunt (5.4s)
        await this.runRainbowPhase(interaction, fruit);
        
        // Small pause
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Phase 2: Color spread (4.8s)
        await this.runColorSpread(interaction, fruit);
        
        // Small pause
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Phase 3: Text reveal (5.6s)
        await this.runTextReveal(interaction, fruit, result, newBalance);
        
        // Final pause
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Phase 4: Final reveal
        await this.showFinalReveal(interaction, fruit, result, newBalance);
    },

    async run10xAnimation(interaction, fruits, results, newBalance) {
        // Animate each fruit individually
        for (let i = 0; i < 10; i++) {
            const fruit = fruits[i];
            const pullNumber = i + 1;
            
            console.log(`🎯 Pull ${pullNumber}/10: ${fruit.name} (${fruit.rarity})`);
            
            // Quick animation for each
            await this.runQuickAnimation(interaction, fruit, pullNumber);
            
            // Delay between pulls
            if (i < 9) await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Show completion summary
        await this.show10xSummary(interaction, fruits, results, newBalance);
    },

    async runRainbowPhase(interaction, fruit) {
        const frames = ANIMATION_CONFIG.RAINBOW_FRAMES;
        const delay = ANIMATION_CONFIG.RAINBOW_DELAY;
        
        for (let frame = 0; frame < frames; frame++) {
            const embed = PullAnimator.createRainbowFrame(frame, fruit);
            
            if (frame === 0 && !interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            if (frame < frames - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    },

    async runColorSpread(interaction, fruit) {
        const frames = ANIMATION_CONFIG.SPREAD_FRAMES;
        const delay = ANIMATION_CONFIG.SPREAD_DELAY;
        const rewardColor = RARITY_COLORS[fruit.rarity];
        const rewardEmoji = RARITY_EMOJIS[fruit.rarity];
        
        for (let frame = 0; frame < frames; frame++) {
            const embed = PullAnimator.createColorSpreadFrame(frame, fruit, rewardColor, rewardEmoji);
            await interaction.editReply({ embeds: [embed] });
            
            if (frame < frames - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    },

    async runTextReveal(interaction, fruit, result, newBalance) {
        const frames = ANIMATION_CONFIG.REVEAL_FRAMES;
        const delay = ANIMATION_CONFIG.REVEAL_DELAY;
        const rewardColor = RARITY_COLORS[fruit.rarity];
        const rewardEmoji = RARITY_EMOJIS[fruit.rarity];
        
        for (let frame = 0; frame < frames; frame++) {
            const embed = PullAnimator.createTextRevealFrame(frame, fruit, result, newBalance, rewardColor, rewardEmoji);
            await interaction.editReply({ embeds: [embed] });
            
            if (frame < frames - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    },

    async runQuickAnimation(interaction, fruit, pullNumber) {
        const frames = ANIMATION_CONFIG.QUICK_FRAMES;
        const delay = ANIMATION_CONFIG.QUICK_DELAY;
        
        // Quick rainbow
        for (let frame = 0; frame < frames; frame++) {
            const embed = PullAnimator.createQuickFrame(frame, fruit, pullNumber);
            
            if (pullNumber === 1 && frame === 0 && !interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Pause before reveal
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Quick reveal
        const revealEmbed = PullAnimator.createQuickReveal(fruit, pullNumber);
        await interaction.editReply({ embeds: [revealEmbed] });
        
        // Show reveal for a bit
        await new Promise(resolve => setTimeout(resolve, 300));
    },

    async showFinalReveal(interaction, fruit, result, newBalance) {
        const embed = PullAnimator.createFinalReveal(fruit, result, newBalance);
        await interaction.editReply({ embeds: [embed] });
    },

    async show10xSummary(interaction, fruits, results, newBalance) {
        const embed = PullAnimator.create10xSummary(fruits, results, newBalance);
        await interaction.editReply({ embeds: [embed] });
    },

    async setupButtons(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('pull_again')
                    .setLabel('🍈 Pull Again')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('pull_10x')
                    .setLabel('🎰 Pull 10x')
                    .setStyle(ButtonStyle.Success)
            );

        const currentReply = await interaction.fetchReply();
        const currentEmbed = currentReply.embeds[0];
        
        await interaction.editReply({
            embeds: [currentEmbed],
            components: [row]
        });

        // Setup collector
        const collector = currentReply.createMessageComponentCollector({ time: 300000 });
        collector.on('collect', async (buttonInteraction) => {
            await this.handleButtonInteraction(buttonInteraction, interaction.user.id);
        });
        collector.on('end', () => this.disableButtons(interaction));
    },

    async handleButtonInteraction(buttonInteraction, originalUserId) {
        // Check if correct user
        if (buttonInteraction.user.id !== originalUserId) {
            return buttonInteraction.reply({
                content: '❌ You can only interact with your own pull results!',
                ephemeral: true
            });
        }

        try {
            if (buttonInteraction.customId === 'pull_again') {
                await this.handlePullAgain(buttonInteraction);
            } else if (buttonInteraction.customId === 'pull_10x') {
                await this.handlePull10x(buttonInteraction);
            }
        } catch (error) {
            console.error('Button error:', error);
            if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                await buttonInteraction.reply({ content: '❌ An error occurred.', ephemeral: true });
            }
        }
    },

    async handlePullAgain(buttonInteraction) {
        const cost = PULL_COST;
        
        // Check balance
        const balance = await EconomyService.getBalance(buttonInteraction.user.id);
        if (balance < cost) {
            return buttonInteraction.reply({ 
                content: `💸 You need **${cost.toLocaleString()} 🍓** but only have **${balance.toLocaleString()} 🍓**!\n💡 Use \`/income\` to collect berries.`, 
                ephemeral: true 
            });
        }

        // Deduct berries
        await EconomyService.deductBerries(buttonInteraction.user.id, cost, 'pull_again');
        const newBalance = balance - cost;

        await buttonInteraction.deferReply();
        await this.runSinglePull(buttonInteraction, newBalance);
        await this.setupButtons(buttonInteraction);
    },

    async handlePull10x(buttonInteraction) {
        const cost = PULL_COST * 10 * 0.9;
        
        // Check balance
        const balance = await EconomyService.getBalance(buttonInteraction.user.id);
        if (balance < cost) {
            return buttonInteraction.reply({ 
                content: `💸 You need **${cost.toLocaleString()} 🍓** but only have **${balance.toLocaleString()} 🍓**!\n💡 Use \`/income\` to collect berries.`, 
                ephemeral: true 
            });
        }

        // Deduct berries
        await EconomyService.deductBerries(buttonInteraction.user.id, cost, 'pull_10x');
        const newBalance = balance - cost;

        await buttonInteraction.deferReply();
        await this.run10xPull(buttonInteraction, newBalance);
        await this.setupButtons(buttonInteraction);
    },

    async disableButtons(interaction) {
        try {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pull_again_disabled')
                        .setLabel('🍈 Pull Again')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('pull_10x_disabled')
                        .setLabel('🎰 Pull 10x')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                );

            await interaction.editReply({ components: [disabledRow] });
        } catch (error) {
            console.log('Could not disable buttons - interaction may have been deleted');
        }
    }
};
