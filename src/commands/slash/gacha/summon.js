// src/commands/slash/gacha/summon.js - COMPLETE Multi-Pull System (10x Default, 50x, 100x)
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GachaService = require('../../../services/GachaService');
const EconomyService = require('../../../services/EconomyService');
const DatabaseManager = require('../../../database/DatabaseManager');
const { PULL_COST, RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');
const { getFruitsByRarity, getRandomFruitByRarity } = require('../../../data/DevilFruits');

// Animation Configuration
const ANIMATION_CONFIG = {
    RAINBOW_FRAMES: 6,
    RAINBOW_DELAY: 1000,
    SPREAD_FRAMES: 12,
    SPREAD_DELAY: 500,
    REVEAL_FRAMES: 8,
    REVEAL_DELAY: 750,
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
    static getRainbowPattern(frame, length = 20) {
        const colors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬜'];
        const pattern = [];
        
        for (let i = 0; i < length; i++) {
            const colorIndex = (i + frame) % colors.length;
            pattern.push(colors[colorIndex]);
        }
        
        return pattern.join(' ');
    }

    static getRainbowColor(frame) {
        const colors = [0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 0xFFFFFF];
        return colors[frame % colors.length];
    }

    static getRaritySquare(rarity) {
        const raritySquares = {
            'common': '⬜',
            'uncommon': '🟩',
            'rare': '🟦',
            'epic': '🟪',
            'mythical': '🟧',
            'legendary': '🟨',
            'divine': '🟥'
        };
        return raritySquares[rarity] || '⬜';
    }

    static createQuickFrame(frame, fruit, summonNumber, totalSummons) {
        const pattern = this.getRainbowPattern(frame, 20);
        const color = this.getRainbowColor(frame);
        const loadingDots = '●'.repeat((frame % 5) + 1) + '○'.repeat(4 - (frame % 5));
        
        const description = `**Summon ${summonNumber}/${totalSummons}**\n\n🌊 Scanning the Grand Line...\n\n${pattern}\n\n` +
            `📊 **Status:** ${loadingDots}\n` +
            `🍃 **Name:** ${loadingDots}\n` +
            `🔮 **Type:** ${loadingDots}\n` +
            `⭐ **Rarity:** ${loadingDots}\n` +
            `💪 **CP Multiplier:** ${loadingDots}\n` +
            `🎯 **Description:** ${loadingDots}\n` +
            `⚔️ **Ability:** ${loadingDots}\n\n` +
            `🔥 **Total CP:** ${loadingDots}\n` +
            `💰 **Remaining Berries:** ${loadingDots}\n\n` +
            `${pattern}`;
        
        return new EmbedBuilder()
            .setTitle(`🍈 ${totalSummons}x Devil Fruit Summoning`)
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: `Summon ${summonNumber} of ${totalSummons} - Searching...` });
    }

    static createQuickReveal(fruit, result, summonNumber, totalSummons) {
        const raritySquare = this.getRaritySquare(fruit.rarity);
        const color = RARITY_COLORS[fruit.rarity];
        const pattern = Array(20).fill(raritySquare).join(' ');
        
        const duplicateCount = result.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `Total Owned: ${duplicateCount}`;
        
        const description = `**Summon ${summonNumber}/${totalSummons}** - ✨ **ACQUIRED!**\n\n${pattern}\n\n` +
            `📊 **Status:** ${duplicateText}\n` +
            `🍃 **Name:** ${fruit.name}\n` +
            `🔮 **Type:** ${fruit.type}\n` +
            `⭐ **Rarity:** ${raritySquare} ${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)}\n` +
            `💪 **CP Multiplier:** x${fruit.multiplier}` +
            (result.pityUsed ? ' 🎯 **PITY!**' : '') + `\n` +
            `🎯 **Description:** ${fruit.description}\n` +
            `⚔️ **Ability:** ${fruit.skillName} (${fruit.skillDamage} DMG, ${fruit.skillCooldown}s CD)\n\n` +
            `🔥 **Total CP:** ${result.fruit?.total_cp?.toLocaleString() || '250'} CP\n` +
            `💰 **Remaining Berries:** Loading...\n\n` +
            `${pattern}`;
        
        let footerText = `Summon ${summonNumber} of ${totalSummons} - ✨ Acquired!`;
        if (result.pityUsed) {
            footerText = `✨ PITY USED! | ${footerText}`;
        }
        
        return new EmbedBuilder()
            .setTitle(`🍈 ${totalSummons}x Devil Fruit Summoning`)
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: footerText });
    }

    static create10xSummary(fruits, results, balance, pityInfo, pityUsedInSession, batchNumber = 1, totalBatches = 1) {
        let detailedResults = '';
        fruits.forEach((fruit, index) => {
            const result = results[index];
            const raritySquare = this.getRaritySquare(fruit.rarity);
            const globalNumber = ((batchNumber - 1) * 10 + index + 1).toString().padStart(2, '0');
            
            const duplicateCount = result.duplicateCount || 1;
            const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `Total Owned: ${duplicateCount}`;
            const pityIndicator = result.pityUsed ? ' 🎯' : '';
            
            detailedResults += `**${globalNumber}.** ${raritySquare} **${fruit.name}**${pityIndicator} (${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)})\n`;
            detailedResults += `      📊 **Status:** ${duplicateText}\n`;
            detailedResults += `      🔮 **Type:** ${fruit.type}\n`;
            detailedResults += `      💪 **CP Multiplier:** x${fruit.multiplier}\n`;
            detailedResults += `      🎯 **Description:** ${fruit.description}\n`;
            detailedResults += `      ⚔️ **Ability:** ${fruit.skillName} (${fruit.skillDamage} DMG, ${fruit.skillCooldown}s CD)\n\n`;
        });

        const rarityPriority = {
            'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4,
            'legendary': 5, 'mythical': 6, 'divine': 7
        };
        
        let highestRarity = 'common';
        let highestPriority = 0;
        
        fruits.forEach(fruit => {
            const priority = rarityPriority[fruit.rarity] || 0;
            if (priority > highestPriority) {
                highestPriority = priority;
                highestRarity = fruit.rarity;
            }
        });

        const highestColor = highestRarity === 'divine' ? 0xFF0000 : RARITY_COLORS[highestRarity];

        let title = '🍈 10x Devil Fruit Summoning Complete!';
        if (totalBatches > 1) {
            title = `🍈 Devil Fruit Batch ${batchNumber}/${totalBatches} Complete!`;
        }

        const pityDisplay = batchNumber === totalBatches ? GachaService.formatPityDisplay(pityInfo, pityUsedInSession) : '';
        const balanceText = batchNumber === totalBatches ? `💰 **Remaining Berries:** ${balance.toLocaleString()}\n\n` : '';

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`🎉 **Batch ${batchNumber} Results:** 🎉\n\n${detailedResults}${balanceText}${pityDisplay}${batchNumber === totalBatches ? '\n\n✨ All fruits have been added to your collection!' : ''}`)
            .setColor(highestColor)
            .setTimestamp();

        let footerText = totalBatches > 1 ? `Batch ${batchNumber} of ${totalBatches}` : '🏴‍☠️ Your legend grows on the Grand Line!';
        if (pityUsedInSession && batchNumber === totalBatches) {
            footerText = '✨ PITY ACTIVATED THIS SESSION! | ' + footerText;
        }
        embed.setFooter({ text: footerText });

        return { embed, isDivine: highestRarity === 'divine' };
    }

    static createMegaSummary(allFruits, allResults, balance, pityInfo, pityUsedInSession, totalPulls) {
        // Count rarities
        const rarityCounts = {};
        const pityUsedCount = allResults.filter(r => r.pityUsed).length;
        
        allFruits.forEach(fruit => {
            rarityCounts[fruit.rarity] = (rarityCounts[fruit.rarity] || 0) + 1;
        });

        // Find best fruits
        const rarityPriority = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5, 'mythical': 6, 'divine': 7 };
        const bestFruits = allFruits
            .filter(fruit => rarityPriority[fruit.rarity] >= 5) // Legendary+
            .sort((a, b) => rarityPriority[b.rarity] - rarityPriority[a.rarity])
            .slice(0, 10);

        let summaryText = `🎉 **${totalPulls}x MEGA SUMMONING COMPLETE!** 🎉\n\n`;
        
        // Rarity breakdown
        summaryText += `📊 **Rarity Breakdown:**\n`;
        ['divine', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'].forEach(rarity => {
            if (rarityCounts[rarity]) {
                const emoji = this.getRaritySquare(rarity);
                summaryText += `${emoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}: **${rarityCounts[rarity]}**\n`;
            }
        });

        if (bestFruits.length > 0) {
            summaryText += `\n🌟 **Best Pulls:**\n`;
            bestFruits.forEach((fruit, index) => {
                const emoji = this.getRaritySquare(fruit.rarity);
                summaryText += `${emoji} **${fruit.name}** (${fruit.rarity})\n`;
            });
        }

        if (pityUsedCount > 0) {
            summaryText += `\n🎯 **Pity Activations:** ${pityUsedCount} times\n`;
        }

        summaryText += `\n💰 **Remaining Berries:** ${balance.toLocaleString()}\n\n`;
        summaryText += GachaService.formatPityDisplay(pityInfo, pityUsedInSession);

        const bestRarity = bestFruits.length > 0 ? bestFruits[0].rarity : 'legendary';
        const color = bestRarity === 'divine' ? 0xFF0000 : RARITY_COLORS[bestRarity];

        const embed = new EmbedBuilder()
            .setTitle(`🏆 ${totalPulls}x MEGA SUMMONING RESULTS!`)
            .setDescription(summaryText)
            .setColor(color)
            .setTimestamp();

        let footerText = '🏴‍☠️ Your legend grows on the Grand Line!';
        if (pityUsedInSession) {
            footerText = '✨ PITY ACTIVATED THIS SESSION! | ' + footerText;
        }
        embed.setFooter({ text: footerText });

        return { embed, isDivine: bestRarity === 'divine' };
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
                    { name: '10x Multi Summon (Default)', value: 10 },
                    { name: '50x Mega Summon', value: 50 },
                    { name: '100x Ultra Summon', value: 100 }
                )
        ),
    
    category: 'gacha',
    cooldown: 5,
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const summonCount = interaction.options.getInteger('count') || 10; // Default to 10x
        
        try {
            // Calculate cost with bulk discounts
            let cost;
            if (summonCount === 10) {
                cost = PULL_COST * 10 * 0.9; // 10% discount
            } else if (summonCount === 50) {
                cost = PULL_COST * 50 * 0.85; // 15% discount
            } else if (summonCount === 100) {
                cost = PULL_COST * 100 * 0.8; // 20% discount
            }
            
            const balance = await EconomyService.getBalance(userId);
            
            if (balance < cost) {
                const pityInfo = await GachaService.getPityInfo(userId);
                const pityDisplay = GachaService.formatPityDisplay(pityInfo);
                
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('❌ Insufficient Berries')
                            .setDescription(`You need **${cost.toLocaleString()}** berries but only have **${balance.toLocaleString()}** berries\n\n${pityDisplay}`)
                            .setFooter({ text: 'Use /income to earn more berries!' })
                    ],
                    ephemeral: true
                });
            }
            
            await EconomyService.deductBerries(userId, cost, 'gacha_summon');
            const newBalance = balance - cost;
            
            if (summonCount === 10) {
                await this.run10xSummon(interaction, newBalance);
            } else if (summonCount === 50) {
                await this.run50xSummon(interaction, newBalance);
            } else if (summonCount === 100) {
                await this.run100xSummon(interaction, newBalance);
            }
            
        } catch (error) {
            interaction.client.logger.error('Summon command error:', error);
            await interaction.reply({
                content: '❌ An error occurred during your summon.',
                ephemeral: true
            });
        }
    },

    async run10xSummon(interaction, newBalance) {
        const pullData = await GachaService.performPulls(interaction.user.id, 10);
        const results = pullData.results;
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
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
        
        // Run 10x animation
        for (let i = 0; i < 10; i++) {
            const fruit = displayFruits[i];
            const result = results[i];
            const summonNumber = i + 1;
            await this.runQuickAnimation(interaction, fruit, result, summonNumber, 10);
            if (i < 9) await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Show summary
        await this.show10xSummary(interaction, displayFruits, results, newBalance, pityInfo, pullData.pityUsedInSession);
        await this.setupButtons(interaction);
    },

    async run50xSummon(interaction, newBalance) {
        const pullData = await GachaService.performPulls(interaction.user.id, 50);
        const allResults = pullData.results;
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
        const allDisplayFruits = allResults.map(result => {
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
        
        // Run 50x animation (show every 5th pull)
        for (let i = 0; i < 50; i += 5) {
            const fruit = allDisplayFruits[i];
            const result = allResults[i];
            const summonNumber = i + 1;
            await this.runQuickAnimation(interaction, fruit, result, summonNumber, 50);
            await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        // Show 5 batch summaries (10 fruits each)
        for (let batch = 0; batch < 5; batch++) {
            const startIdx = batch * 10;
            const endIdx = startIdx + 10;
            const batchFruits = allDisplayFruits.slice(startIdx, endIdx);
            const batchResults = allResults.slice(startIdx, endIdx);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.show10xSummary(interaction, batchFruits, batchResults, newBalance, pityInfo, pullData.pityUsedInSession, batch + 1, 5);
            
            if (batch < 4) await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Show mega summary
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.showMegaSummary(interaction, allDisplayFruits, allResults, newBalance, pityInfo, pullData.pityUsedInSession, 50);
        await this.setupButtons(interaction);
    },

    async run100xSummon(interaction, newBalance) {
        const pullData = await GachaService.performPulls(interaction.user.id, 100);
        const allResults = pullData.results;
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
        const allDisplayFruits = allResults.map(result => {
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
        
        // Run 100x animation (show every 10th pull)
        for (let i = 0; i < 100; i += 10) {
            const fruit = allDisplayFruits[i];
            const result = allResults[i];
            const summonNumber = i + 1;
            await this.runQuickAnimation(interaction, fruit, result, summonNumber, 100);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Show 10 batch summaries (10 fruits each)
        for (let batch = 0; batch < 10; batch++) {
            const startIdx = batch * 10;
            const endIdx = startIdx + 10;
            const batchFruits = allDisplayFruits.slice(startIdx, endIdx);
            const batchResults = allResults.slice(startIdx, endIdx);
            
            await new Promise(resolve => setTimeout(resolve, 800));
            await this.show10xSummary(interaction, batchFruits, batchResults, newBalance, pityInfo, pullData.pityUsedInSession, batch + 1, 10);
            
            if (batch < 9) await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Show mega summary
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.showMegaSummary(interaction, allDisplayFruits, allResults, newBalance, pityInfo, pullData.pityUsedInSession, 100);
        await this.setupButtons(interaction);
    },

    async runQuickAnimation(interaction, fruit, result, summonNumber, totalSummons) {
        for (let frame = 0; frame < ANIMATION_CONFIG.QUICK_FRAMES; frame++) {
            const embed = SummonAnimator.createQuickFrame(frame, fruit, summonNumber, totalSummons);
            
            if (summonNumber === 1 && frame === 0 && !interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.QUICK_DELAY));
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const revealEmbed = SummonAnimator.createQuickReveal(fruit, result, summonNumber, totalSummons);
        await interaction.editReply({ embeds: [revealEmbed] });
        
        await new Promise(resolve => setTimeout(resolve, 300));
    },

    async show10xSummary(interaction, fruits, results, newBalance, pityInfo, pityUsedInSession, batchNumber = 1, totalBatches = 1) {
        const summaryData = SummonAnimator.create10xSummary(fruits, results, newBalance, pityInfo, pityUsedInSession, batchNumber, totalBatches);
        
        // Check if we got a divine fruit for special animation
        if (summaryData.isDivine && totalBatches === 1) {
            await this.showDivineAnimation(interaction, summaryData.embed);
        } else {
            await interaction.editReply({ embeds: [summaryData.embed] });
        }
    },

    async showMegaSummary(interaction, allFruits, allResults, newBalance, pityInfo, pityUsedInSession, totalPulls) {
        const summaryData = SummonAnimator.createMegaSummary(allFruits, allResults, newBalance, pityInfo, pityUsedInSession, totalPulls);
        
        // Check if we got a divine fruit for special animation
        if (summaryData.isDivine) {
            await this.showDivineAnimation(interaction, summaryData.embed);
        } else {
            await interaction.editReply({ embeds: [summaryData.embed] });
        }
    },

    async showDivineAnimation(interaction, baseEmbed) {
        // Divine color animation - fast color changing for 20 seconds
        const divineColors = [
            0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 
            0xFF00FF, 0x00FFFF, 0xFFFFFF, 0xFFD700, 0xFF1493, 0x00FA9A
        ];
        
        const animationDuration = 20000; // 20 seconds
        const frameDelay = 200; // Change color every 200ms
        const totalFrames = animationDuration / frameDelay;
        
        for (let frame = 0; frame < totalFrames; frame++) {
            const colorIndex = frame % divineColors.length;
            const currentColor = divineColors[colorIndex];
            
            const animatedEmbed = new EmbedBuilder()
                .setTitle(baseEmbed.data.title)
                .setDescription(baseEmbed.data.description)
                .setColor(currentColor)
                .setFooter({ text: '✨ DIVINE POWER DETECTED! ✨' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [animatedEmbed] });
            await new Promise(resolve => setTimeout(resolve, frameDelay));
        }
        
        // End with final divine red color
        const finalEmbed = new EmbedBuilder()
            .setTitle(baseEmbed.data.title)
            .setDescription(baseEmbed.data.description)
            .setColor(0xFF0000)
            .setFooter({ text: baseEmbed.data.footer.text })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [finalEmbed] });
    },

    async setupButtons(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('summon_10x')
                    .setLabel('🍈 Summon 10x')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('summon_50x')
                    .setLabel('🍈 Summon 50x')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('summon_100x')
                    .setLabel('🍈 Summon 100x')
                    .setStyle(ButtonStyle.Danger)
            );

        const currentReply = await interaction.fetchReply();
        const currentEmbed = currentReply.embeds[0];
        
        await interaction.editReply({
            embeds: [currentEmbed],
            components: [row]
        });

        const collector = currentReply.createMessageComponentCollector({ time: 120000 });
        collector.on('collect', async (buttonInteraction) => {
            await this.handleButtonInteraction(buttonInteraction, interaction.user.id);
        });
        collector.on('end', () => this.disableButtons(interaction));
    },

    async handleSummon10x(buttonInteraction) {
        const cost = PULL_COST * 10 * 0.9;
        const balance = await EconomyService.getBalance(buttonInteraction.user.id);
        
        if (balance < cost) {
            const pityInfo = await GachaService.getPityInfo(buttonInteraction.user.id);
            const pityDisplay = GachaService.formatPityDisplay(pityInfo);
            
            return buttonInteraction.reply({ 
                content: `💸 You need **${cost.toLocaleString()}** berries but only have **${balance.toLocaleString()}** berries!\n\n${pityDisplay}\n\n💡 Use \`/income\` to collect berries.`, 
                ephemeral: true 
            });
        }

        await EconomyService.deductBerries(buttonInteraction.user.id, cost, 'summon_10x');
        const newBalance = balance - cost;

        if (!buttonInteraction.isRepliable()) return;

        await buttonInteraction.deferReply();
        await this.run10xSummon(buttonInteraction, newBalance);
        await this.setupButtons(buttonInteraction);
    },

    async handleSummon50x(buttonInteraction) {
        const cost = PULL_COST * 50 * 0.85;
        const balance = await EconomyService.getBalance(buttonInteraction.user.id);
        
        if (balance < cost) {
            const pityInfo = await GachaService.getPityInfo(buttonInteraction.user.id);
            const pityDisplay = GachaService.formatPityDisplay(pityInfo);
            
            return buttonInteraction.reply({ 
                content: `💸 You need **${cost.toLocaleString()}** berries but only have **${balance.toLocaleString()}** berries!\n\n${pityDisplay}\n\n💡 Use \`/income\` to collect berries.`, 
                ephemeral: true 
            });
        }

        await EconomyService.deductBerries(buttonInteraction.user.id, cost, 'summon_50x');
        const newBalance = balance - cost;

        if (!buttonInteraction.isRepliable()) return;

        await buttonInteraction.deferReply();
        await this.run50xSummon(buttonInteraction, newBalance);
        await this.setupButtons(buttonInteraction);
    },

    async handleSummon100x(buttonInteraction) {
        const cost = PULL_COST * 100 * 0.8;
        const balance = await EconomyService.getBalance(buttonInteraction.user.id);
        
        if (balance < cost) {
            const pityInfo = await GachaService.getPityInfo(buttonInteraction.user.id);
            const pityDisplay = GachaService.formatPityDisplay(pityInfo);
            
            return buttonInteraction.reply({ 
                content: `💸 You need **${cost.toLocaleString()}** berries but only have **${balance.toLocaleString()}** berries!\n\n${pityDisplay}\n\n💡 Use \`/income\` to collect berries.`, 
                ephemeral: true 
            });
        }

        await EconomyService.deductBerries(buttonInteraction.user.id, cost, 'summon_100x');
        const newBalance = balance - cost;

        if (!buttonInteraction.isRepliable()) return;

        await buttonInteraction.deferReply();
        await this.run100xSummon(buttonInteraction, newBalance);
        await this.setupButtons(buttonInteraction);
    },

    async disableButtons(interaction) {
        try {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('summon_10x_disabled')
                        .setLabel('🍈 Summon 10x')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('summon_50x_disabled')
                        .setLabel('🍈 Summon 50x')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('summon_100x_disabled')
                        .setLabel('🍈 Summon 100x')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

            await interaction.editReply({ components: [disabledRow] });
        } catch (error) {
            console.log('Could not disable buttons - interaction may have been deleted');
        }
    }
};
