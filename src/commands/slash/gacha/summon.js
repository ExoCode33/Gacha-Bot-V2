// src/commands/slash/gacha/summon.js - FIXED Enhanced Summon Command with Proper Animation
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
    "🌊 Searching the Grand Line's mysterious depths...",
    "⚡ Devil Fruit energy detected... analyzing power signature...",
    "🔥 Tremendous force breaking through dimensional barriers...",
    "💎 Legendary power crystallizing before your eyes...",
    "🌟 Ancient mysteries awakening from the ocean's heart...",
    "⚔️ The sea itself trembles with anticipation..."
];

class SummonAnimator {
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

    // FIXED: Create rainbow hunt frame - everything should be ???
    static createRainbowFrame(frame, fruit) {
        const pattern = this.getRainbowPattern(frame);
        const color = this.getRainbowColor(frame);
        const description = HUNT_DESCRIPTIONS[frame] || HUNT_DESCRIPTIONS[5];
        
        const animatedDots = '.'.repeat((frame % 3) + 1);
        const mysteriousInfo = `✨ **Devil Fruit Summoning in Progress** ✨\n\n${pattern}\n\n` +
            `📊 **Status:** Scanning${animatedDots}\n` +
            `🍃 **Name:** ???\n` +
            `🔮 **Type:** ???\n` +
            `⭐ **Rarity:** ???\n` +
            `💪 **CP Multiplier:** ???\n` +
            `🎯 **Description:** ???\n` +
            `⚔️ **Ability:** ???\n\n` +
            `🔥 **Total CP:** ???\n` +
            `💰 **Remaining Berries:** ???\n\n` +
            `${pattern}`;
        
        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Summoning')
            .setDescription(`${description}\n\n${mysteriousInfo}`)
            .setColor(color)
            .setFooter({ text: `🌊 Searching the mysterious seas...` });
    }

    // FIXED: Create color spread frame - everything should STILL be ???
    static createColorSpreadFrame(frame, fruit, rewardColor, rewardEmoji) {
        const barLength = 20;
        const center = 9.5;
        const spreadRadius = Math.floor(frame * 1.0);
        
        const bar = Array(barLength).fill('⬛'); // Start with black squares
        const rainbowSquares = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫']; // Keep squares consistent
        
        // Get the appropriate square color for this rarity
        const raritySquare = this.getRaritySquare(fruit.rarity);
        
        for (let i = 0; i < barLength; i++) {
            const distanceFromCenter = Math.abs(i - center);
            
            if (distanceFromCenter <= spreadRadius) {
                bar[i] = raritySquare; // Use rarity square instead of emoji
            } else {
                // Use rainbow squares for remaining positions
                const colorIndex = Math.floor(distanceFromCenter + frame * 0.5) % rainbowSquares.length;
                bar[i] = rainbowSquares[colorIndex];
            }
        }

        const pattern = bar.join(' ');
        // Keep progress squares consistent
        const progressSquares = '🟩'.repeat(Math.floor(frame / 2)) + '⬛'.repeat(6 - Math.floor(frame / 2));
        
        // FIXED: Keep ALL information as ??? during color spread phase
        const mysteriousInfo = `✨ **Devil Fruit Manifestation** ✨\n\n${pattern}\n\n` +
            `📊 **Status:** ???\n` +
            `🍃 **Name:** ???\n` +
            `🔮 **Type:** ???\n` +
            `⭐ **Rarity:** ???\n` +
            `💪 **CP Multiplier:** ???\n` +
            `🎯 **Description:** ???\n` +
            `⚔️ **Ability:** ???\n\n` +
            `🔥 **Total CP:** ???\n` +
            `💰 **Remaining Berries:** ???\n\n` +
            `${pattern}`;
        
        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Summoning')
            .setDescription(`🔮 Mysterious power manifesting...\n\n${mysteriousInfo}`)
            .setColor(rewardColor)
            .setFooter({ text: `⚡ Power crystallizing... ${progressSquares}` });
    }

    // Get the appropriate square emoji for each rarity
    static getRaritySquare(rarity) {
        const raritySquares = {
            'common': '⬜',        // White square for common
            'uncommon': '🟩',      // Green square for uncommon  
            'rare': '🟦',          // Blue square for rare
            'epic': '🟪',          // Purple square for epic
            'mythical': '🟧',      // Orange square for mythical
            'legendary': '🟨',     // Yellow square for legendary
            'divine': '✨'         // Sparkles for divine
        };
        return raritySquares[rarity] || '⬜';
    }

    // FIXED: Create text reveal frame - information reveals gradually
    static createTextRevealFrame(frame, fruit, result, newBalance, rewardColor, rewardEmoji) {
        const raritySquare = this.getRaritySquare(fruit.rarity);
        const pattern = Array(20).fill(raritySquare).join(' '); // Use rarity square
        const duplicateCount = result.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `📚 Total Owned: ${duplicateCount}`;
        const totalCp = result.fruit?.total_cp || 250;
        
        const glowEffect = frame >= 7 ? '✨ ' : '';
        let description = `${glowEffect}**Devil Fruit Acquired!** ${glowEffect}\n\n${pattern}\n\n`;
        
        // FIXED: Gradual reveal based on frame number (0-7)
        description += `📊 **Status:** ${frame >= 0 ? duplicateText : '???'}\n`;
        description += `🍃 **Name:** ${frame >= 1 ? fruit.name : '???'}\n`;
        description += `🔮 **Type:** ${frame >= 2 ? fruit.type : '???'}\n`;
        description += `⭐ **Rarity:** ${frame >= 3 ? `${raritySquare} ${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)}` : '???'}\n`;
        description += `💪 **CP Multiplier:** ${frame >= 4 ? `x${fruit.multiplier}` : '???'}\n`;
        description += `🎯 **Description:** ${frame >= 5 ? fruit.description : '???'}\n`;
        description += `⚔️ **Ability:** ${frame >= 6 ? `${fruit.skillName} (${fruit.skillDamage} DMG, ${fruit.skillCooldown}s CD)` : '???'}\n\n`;
        description += `🔥 **Total CP:** ${frame >= 7 ? `${totalCp.toLocaleString()} CP` : '???'}\n`;
        description += `💰 **Remaining Berries:** ${newBalance.toLocaleString()}\n\n`; // Always show remaining berries
        description += `${pattern}`;

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Summoning')
            .setDescription(description)
            .setColor(rewardColor)
            .setFooter({ text: `🎉 Added to your collection! Revealing...` });
    }

    // Create final reveal
    static createFinalReveal(fruit, result, newBalance) {
        const raritySquare = this.getRaritySquare(fruit.rarity);
        const color = RARITY_COLORS[fruit.rarity];
        const pattern = Array(20).fill(raritySquare).join(' '); // Use rarity square
        const duplicateCount = result.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `📚 Total Owned: ${duplicateCount}`;
        const totalCp = result.fruit?.total_cp || 250;

        const description = `🎉 **Congratulations!** You've summoned a magnificent Devil Fruit! 🎉\n\n${pattern}\n\n` +
            `📊 **Status:** ${duplicateText}\n` +
            `🍃 **Name:** ${fruit.name}\n` +
            `🔮 **Type:** ${fruit.type}\n` +
            `⭐ **Rarity:** ${raritySquare} ${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)}\n` +
            `💪 **CP Multiplier:** x${fruit.multiplier}\n` +
            `🎯 **Description:** ${fruit.description}\n` +
            `⚔️ **Ability:** ${fruit.skillName} (${fruit.skillDamage} DMG, ${fruit.skillCooldown}s CD)\n\n` +
            `🔥 **Total CP:** ${totalCp.toLocaleString()} CP\n` +
            `💰 **Remaining Berries:** ${newBalance.toLocaleString()}\n\n` +
            `${pattern}`;

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Summoning Complete!')
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: '🏴‍☠️ Your legend grows on the Grand Line!' })
            .setTimestamp();
    }

    // Create quick frame for 10x
    static createQuickFrame(frame, fruit, summonNumber) {
        const pattern = this.getRainbowPattern(frame, 15);
        const color = this.getRainbowColor(frame);
        const progressDots = '●'.repeat(frame + 1) + '○'.repeat(4 - frame);
        
        return new EmbedBuilder()
            .setTitle('🎰 10x Devil Fruit Summoning')
            .setDescription(`**Summon ${summonNumber}/10**\n\n🌊 Scanning the Grand Line...\n\n${pattern}\n\n📊 **Status:** Analyzing... ${progressDots}\n🍃 **Fruit:** ???\n⭐ **Rarity:** ???\n\n${pattern}`)
            .setColor(color)
            .setFooter({ text: `Summon ${summonNumber} of 10 - Searching...` });
    }

    // Create quick reveal for 10x
    static createQuickReveal(fruit, summonNumber) {
        const raritySquare = this.getRaritySquare(fruit.rarity);
        const color = RARITY_COLORS[fruit.rarity];
        const pattern = Array(15).fill(raritySquare).join(' '); // Use rarity square
        
        return new EmbedBuilder()
            .setTitle('🎰 10x Devil Fruit Summoning')
            .setDescription(`**Summon ${summonNumber}/10** - ${raritySquare} **${fruit.rarity.toUpperCase()}**\n\n${pattern}\n\n🍃 **${fruit.name}**\n🔮 ${fruit.type}\n💪 x${fruit.multiplier} CP\n\n${pattern}`)
            .setColor(color)
            .setFooter({ text: `Summon ${summonNumber} of 10 - ✨ Acquired!` });
    }

    // Create 10x summary
    static create10xSummary(fruits, results, balance) {
        const rarityCounts = {};
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'mythical', 'legendary', 'divine'];
        
        rarityOrder.forEach(rarity => { rarityCounts[rarity] = 0; });
        fruits.forEach(fruit => { rarityCounts[fruit.rarity]++; });

        let rarityText = '';
        rarityOrder.forEach(rarity => {
            if (rarityCounts[rarity] > 0) {
                const raritySquare = this.getRaritySquare(rarity);
                rarityText += `${raritySquare} **${rarity.charAt(0).toUpperCase() + rarity.slice(1)}**: ${rarityCounts[rarity]}\n`;
            }
        });

        // Get highest rarity
        let highestRarity = 'common';
        [...rarityOrder].reverse().forEach(rarity => {
            if (rarityCounts[rarity] > 0 && highestRarity === 'common') {
                highestRarity = rarity;
            }
        });

        const highestSquare = this.getRaritySquare(highestRarity);
        const highestColor = RARITY_COLORS[highestRarity];

        return new EmbedBuilder()
            .setTitle('🎰 10x Devil Fruit Summoning Complete!')
            .setDescription(`🎉 **10x Summon Complete!** 🎉\n\n**Highest Rarity:** ${highestSquare} ${highestRarity.charAt(0).toUpperCase() + highestRarity.slice(1)}\n\n**Results:**\n${rarityText}\n💰 **Remaining Berries:** ${balance.toLocaleString()} 🍓\n\n✨ All fruits have been added to your collection!`)
            .setColor(highestColor)
            .setFooter({ text: '🏴‍☠️ Continue your adventure on the Grand Line!' })
            .setTimestamp();
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summon')
        .setDescription('🍈 Summon Devil Fruits with cinematic animation!')
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Number of summons to make')
                .setRequired(false)
                .addChoices(
                    { name: '1x Single Summon', value: 1 },
                    { name: '10x Multi Summon', value: 10 }
                )
        ),
    
    category: 'gacha',
    cooldown: 5,
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const summonCount = interaction.options.getInteger('count') || 1;
        
        try {
            // Calculate cost
            const cost = summonCount === 10 
                ? PULL_COST * 10 * 0.9  // 10% discount for 10-summon
                : PULL_COST * summonCount;
            
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
            await EconomyService.deductBerries(userId, cost, 'gacha_summon');
            const newBalance = balance - cost;
            
            // Perform summons with animation
            if (summonCount === 1) {
                await this.runSingleSummon(interaction, newBalance);
            } else {
                await this.run10xSummon(interaction, newBalance);
            }
            
        } catch (error) {
            interaction.client.logger.error('Summon command error:', error);
            
            // Try to refund berries on error
            try {
                await EconomyService.addBerries(userId, cost, 'error_refund');
            } catch (refundError) {
                interaction.client.logger.error('Failed to refund berries:', refundError);
            }
            
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ An error occurred during your summon. Your berries have been refunded.',
                    ephemeral: true
                });
            }
        }
    },

    async runSingleSummon(interaction, newBalance) {
        // Get fruit from gacha service
        const results = await GachaService.performPulls(interaction.user.id, 1);
        const result = results[0];
        const fruit = result.fruit;
        
        // Get actual fruit data for skill information
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        const actualFruit = Object.values(DEVIL_FRUITS).find(f => 
            f.name === result.fruit.fruit_name || f.id === result.fruit.fruit_id
        );
        
        // Convert database result to display format (USING OLD STRUCTURE)
        const displayFruit = {
            name: fruit.fruit_name,
            type: fruit.fruit_type,
            rarity: fruit.fruit_rarity,
            multiplier: (fruit.base_cp / 100).toFixed(1),
            description: fruit.fruit_description || fruit.fruit_power || 'A mysterious Devil Fruit power',
            skillName: actualFruit?.skill?.name || 'Unknown Ability',
            skillDamage: actualFruit?.skill?.damage || 50,
            skillCooldown: actualFruit?.skill?.cooldown || 2
        };
        
        console.log(`🎯 Single summon: ${displayFruit.name} (${displayFruit.rarity})`);
        
        // Run full animation
        await this.runFullAnimation(interaction, displayFruit, result, newBalance);
        await this.setupButtons(interaction);
    },

    async run10xSummon(interaction, newBalance) {
        // Get fruits from gacha service
        const results = await GachaService.performPulls(interaction.user.id, 10);
        
        // Get actual fruit data for skill information  
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
        // Convert to display format (USING OLD STRUCTURE)
        const displayFruits = results.map(result => {
            const actualFruit = Object.values(DEVIL_FRUITS).find(f => 
                f.name === result.fruit.fruit_name || f.id === result.fruit.fruit_id
            );
            
            return {
                name: result.fruit.fruit_name,
                type: result.fruit.fruit_type,
                rarity: result.fruit.fruit_rarity,
                multiplier: (result.fruit.base_cp / 100).toFixed(1),
                description: result.fruit.fruit_description || result.fruit.fruit_power || 'A mysterious Devil Fruit power',
                skillName: actualFruit?.skill?.name || 'Unknown Ability',
                skillDamage: actualFruit?.skill?.damage || 50,
                skillCooldown: actualFruit?.skill?.cooldown || 2
            };
        });
        
        console.log(`🎯 10x summon starting`);
        
        // Run 10x animation
        await this.run10xAnimation(interaction, displayFruits, results, newBalance);
        await this.setupButtons(interaction);
    },

    async runFullAnimation(interaction, fruit, result, newBalance) {
        // Phase 1: Rainbow hunt (5.4s) - Everything shows as ???
        await this.runRainbowPhase(interaction, fruit);
        
        // Small pause
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Phase 2: Color spread (4.8s) - Everything STILL shows as ???
        await this.runColorSpread(interaction, fruit);
        
        // Small pause
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Phase 3: Text reveal (5.6s) - Information reveals gradually
        await this.runTextReveal(interaction, fruit, result, newBalance);
        
        // Final pause
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Phase 4: Final reveal - All information shown
        await this.showFinalReveal(interaction, fruit, result, newBalance);
    },

    async run10xAnimation(interaction, fruits, results, newBalance) {
        // Animate each fruit individually
        for (let i = 0; i < 10; i++) {
            const fruit = fruits[i];
            const summonNumber = i + 1;
            
            console.log(`🎯 Summon ${summonNumber}/10: ${fruit.name} (${fruit.rarity})`);
            
            // Quick animation for each
            await this.runQuickAnimation(interaction, fruit, summonNumber);
            
            // Delay between summons
            if (i < 9) await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Show completion summary
        await this.show10xSummary(interaction, fruits, results, newBalance);
    },

    async runRainbowPhase(interaction, fruit) {
        const frames = ANIMATION_CONFIG.RAINBOW_FRAMES;
        const delay = ANIMATION_CONFIG.RAINBOW_DELAY;
        
        for (let frame = 0; frame < frames; frame++) {
            const embed = SummonAnimator.createRainbowFrame(frame, fruit);
            
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
            const embed = SummonAnimator.createColorSpreadFrame(frame, fruit, rewardColor, rewardEmoji);
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
            const embed = SummonAnimator.createTextRevealFrame(frame, fruit, result, newBalance, rewardColor, rewardEmoji);
            await interaction.editReply({ embeds: [embed] });
            
            if (frame < frames - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    },

    async runQuickAnimation(interaction, fruit, summonNumber) {
        const frames = ANIMATION_CONFIG.QUICK_FRAMES;
        const delay = ANIMATION_CONFIG.QUICK_DELAY;
        
        // Quick rainbow
        for (let frame = 0; frame < frames; frame++) {
            const embed = SummonAnimator.createQuickFrame(frame, fruit, summonNumber);
            
            if (summonNumber === 1 && frame === 0 && !interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Pause before reveal
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Quick reveal
        const revealEmbed = SummonAnimator.createQuickReveal(fruit, summonNumber);
        await interaction.editReply({ embeds: [revealEmbed] });
        
        // Show reveal for a bit
        await new Promise(resolve => setTimeout(resolve, 300));
    },

    async showFinalReveal(interaction, fruit, result, newBalance) {
        const embed = SummonAnimator.createFinalReveal(fruit, result, newBalance);
        await interaction.editReply({ embeds: [embed] });
    },

    async show10xSummary(interaction, fruits, results, newBalance) {
        const embed = SummonAnimator.create10xSummary(fruits, results, newBalance);
        await interaction.editReply({ embeds: [embed] });
    },

    async setupButtons(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('summon_again')
                    .setLabel('🍈 Summon Again')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('summon_10x')
                    .setLabel('🎰 Summon 10x')
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
                content: '❌ You can only interact with your own summon results!',
                ephemeral: true
            });
        }

        try {
            if (buttonInteraction.customId === 'summon_again') {
                await this.handleSummonAgain(buttonInteraction);
            } else if (buttonInteraction.customId === 'summon_10x') {
                await this.handleSummon10x(buttonInteraction);
            }
        } catch (error) {
            console.error('Button error:', error);
            if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                await buttonInteraction.reply({ content: '❌ An error occurred.', ephemeral: true });
            }
        }
    },

    async handleSummonAgain(buttonInteraction) {
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
        await EconomyService.deductBerries(buttonInteraction.user.id, cost, 'summon_again');
        const newBalance = balance - cost;

        await buttonInteraction.deferReply();
        await this.runSingleSummon(buttonInteraction, newBalance);
        await this.setupButtons(buttonInteraction);
    },

    async handleSummon10x(buttonInteraction) {
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
        await EconomyService.deductBerries(buttonInteraction.user.id, cost, 'summon_10x');
        const newBalance = balance - cost;

        await buttonInteraction.deferReply();
        await this.run10xSummon(buttonInteraction, newBalance);
        await this.setupButtons(buttonInteraction);
    },

    async disableButtons(interaction) {
        try {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('summon_again_disabled')
                        .setLabel('
