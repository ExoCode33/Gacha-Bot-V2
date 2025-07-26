// src/commands/slash/gacha/summon.js - CORRECTED Complete Multi-Pull System
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

    static createQuickFrame(frame, fruit, summonNumber, totalSummons, currentPity) {
        const pattern = this.getRainbowPattern(frame, 20);
        const color = this.getRainbowColor(frame);
        const loadingDots = '●'.repeat((frame % 5) + 1) + '○'.repeat(4 - (frame % 5));
        
        const description = `🌊 Scanning the Grand Line...\n\n${pattern}\n\n` +
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
            .setFooter({ text: `Summon ${summonNumber} of ${totalSummons} - Searching... | Pity: ${currentPity}/1500` });
    }

    static createQuickReveal(fruit, result, summonNumber, totalSummons, currentPity) {
        const raritySquare = this.getRaritySquare(fruit.rarity);
        const color = RARITY_COLORS[fruit.rarity];
        const pattern = Array(20).fill(raritySquare).join(' ');
        
        const duplicateCount = result.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `Total Owned: ${duplicateCount}`;
        
        const description = `✨ **ACQUIRED!**\n\n${pattern}\n\n` +
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
        
        let footerText = `Summon ${summonNumber} of ${totalSummons} - ✨ Acquired! | Pity: ${currentPity}/1500`;
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
            // Calculate cost WITHOUT DISCOUNTS - full price for all pulls
            const cost = PULL_COST * summonCount;
            
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
        // Add skip animation button
        const skipRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('skip_animation')
                    .setLabel('⏭️ Skip Animation')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        // Get initial pity for tracking
        let currentPity = await GachaService.getPityCount(interaction.user.id);
        
        // Get all fruits data BEFORE performing pulls to track pity changes
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
        // Perform pulls one by one to track pity in real-time
        const allResults = [];
        const allDisplayFruits = [];
        let skipAnimation = false;
        
        for (let i = 0; i < 10; i++) {
            // Perform single pull
            const pullData = await GachaService.performPulls(interaction.user.id, 1);
            const result = pullData.results[0];
            const fruit = result.fruit;
            
            allResults.push(result);
            
            const actualFruit = Object.values(DEVIL_FRUITS).find(f => 
                f.name === fruit.fruit_name || f.id === fruit.fruit_id
            );
            
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
            
            allDisplayFruits.push(displayFruit);
            
            // Check for skip button press
            if (!skipAnimation) {
                try {
                    // Show animation with skip button
                    if (i === 0) {
                        const initialEmbed = SummonAnimator.createQuickFrame(0, displayFruit, i + 1, 10, currentPity);
                        await interaction.reply({ embeds: [initialEmbed], components: [skipRow] });
                        
                        // Wait for potential skip button press
                        const filter = (buttonInteraction) => buttonInteraction.customId === 'skip_animation' && buttonInteraction.user.id === interaction.user.id;
                        try {
                            const buttonInteraction = await interaction.channel.awaitMessageComponent({ filter, time: 1000 });
                            skipAnimation = true;
                            await buttonInteraction.deferUpdate();
                        } catch (error) {
                            // No skip pressed, continue animation
                        }
                    }
                    
                    if (!skipAnimation) {
                        await this.runQuickAnimation(interaction, displayFruit, result, i + 1, 10, currentPity);
                    }
                } catch (error) {
                    // Continue without animation if there's an error
                }
            }
            
            // Update pity for next pull
            currentPity = await GachaService.getPityCount(interaction.user.id);
            
            if (i < 9 && !skipAnimation) await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // Get final pity info
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        const pityUsedInSession = allResults.some(r => r.pityUsed);
        
        // Show summary
        await this.show10xSummary(interaction, allDisplayFruits, allResults, newBalance, pityInfo, pityUsedInSession);
        await this.setupButtons(interaction);
    },

    async run50xSummon(interaction, newBalance) {
        // Add skip animation button
        const skipRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('skip_animation')
                    .setLabel('⏭️ Skip Animation')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        // Get initial pity for tracking
        let currentPity = await GachaService.getPityCount(interaction.user.id);
        
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
        // Perform ALL 50 pulls one by one with full animations
        const allResults = [];
        const allDisplayFruits = [];
        let skipAnimation = false;
        
        for (let i = 0; i < 50; i++) {
            // Perform single pull
            const pullData = await GachaService.performPulls(interaction.user.id, 1);
            const result = pullData.results[0];
            const fruit = result.fruit;
            
            allResults.push(result);
            
            const actualFruit = Object.values(DEVIL_FRUITS).find(f => 
                f.name === fruit.fruit_name || f.id === fruit.fruit_id
            );
            
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
            
            allDisplayFruits.push(displayFruit);
            
            // Check for skip button press
            if (!skipAnimation) {
                try {
                    // Show animation with skip button
                    if (i === 0) {
                        const initialEmbed = SummonAnimator.createQuickFrame(0, displayFruit, i + 1, 50, currentPity);
                        await interaction.reply({ embeds: [initialEmbed], components: [skipRow] });
                        
                        // Wait for potential skip button press
                        const filter = (buttonInteraction) => buttonInteraction.customId === 'skip_animation' && buttonInteraction.user.id === interaction.user.id;
                        try {
                            const buttonInteraction = await interaction.channel.awaitMessageComponent({ filter, time: 1000 });
                            skipAnimation = true;
                            await buttonInteraction.deferUpdate();
                        } catch (error) {
                            // No skip pressed, continue animation
                        }
                    }
                    
                    if (!skipAnimation) {
                        await this.runQuickAnimation(interaction, displayFruit, result, i + 1, 50, currentPity);
                    }
                } catch (error) {
                    // Continue without animation if there's an error
                }
            }
            
            // Update pity for next pull
            currentPity = await GachaService.getPityCount(interaction.user.id);
            
            // Shorter delay for 50x
            if (i < 49 && !skipAnimation) await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        // Get final pity info
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        const pityUsedInSession = allResults.some(r => r.pityUsed);
        
        // Create all batch embeds (don't delete them)
        const batchEmbeds = [];
        for (let batch = 0; batch < 5; batch++) {
            const startIdx = batch * 10;
            const endIdx = startIdx + 10;
            const batchFruits = allDisplayFruits.slice(startIdx, endIdx);
            const batchResults = allResults.slice(startIdx, endIdx);
            
            const summaryData = SummonAnimator.create10xSummary(batchFruits, batchResults, newBalance, pityInfo, pityUsedInSession, batch + 1, 5);
            batchEmbeds.push(summaryData.embed);
        }
        
        // Create mega summary
        const megaSummaryData = SummonAnimator.createMegaSummary(allDisplayFruits, allResults, newBalance, pityInfo, pityUsedInSession, 50);
        
        // Show first batch with navigation
        await this.showBatchNavigation(interaction, batchEmbeds, megaSummaryData.embed, 0);
    },

    async run100xSummon(interaction, newBalance) {
        // Add skip animation button
        const skipRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('skip_animation')
                    .setLabel('⏭️ Skip Animation')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        // Get initial pity for tracking
        let currentPity = await GachaService.getPityCount(interaction.user.id);
        
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
        // Perform ALL 100 pulls one by one with full animations
        const allResults = [];
        const allDisplayFruits = [];
        let skipAnimation = false;
        
        for (let i = 0; i < 100; i++) {
            // Perform single pull
            const pullData = await GachaService.performPulls(interaction.user.id, 1);
            const result = pullData.results[0];
            const fruit = result.fruit;
            
            allResults.push(result);
            
            const actualFruit = Object.values(DEVIL_FRUITS).find(f => 
                f.name === fruit.fruit_name || f.id === fruit.fruit_id
            );
            
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
            
            allDisplayFruits.push(displayFruit);
            
            // Check for skip button press
            if (!skipAnimation) {
                try {
                    // Show animation with skip button
                    if (i === 0) {
                        const initialEmbed = SummonAnimator.createQuickFrame(0, displayFruit, i + 1, 100, currentPity);
                        await interaction.reply({ embeds: [initialEmbed], components: [skipRow] });
                        
                        // Wait for potential skip button press
                        const filter = (buttonInteraction) => buttonInteraction.customId === 'skip_animation' && buttonInteraction.user.id === interaction.user.id;
                        try {
                            const buttonInteraction = await interaction.channel.awaitMessageComponent({ filter, time: 1000 });
                            skipAnimation = true;
                            await buttonInteraction.deferUpdate();
                        } catch (error) {
                            // No skip pressed, continue animation
                        }
                    }
                    
                    if (!skipAnimation) {
                        await this.runQuickAnimation(interaction, displayFruit, result, i + 1, 100, currentPity);
                    }
                } catch (error) {
                    // Continue without animation if there's an error
                }
            }
            
            // Update pity for next pull
            currentPity = await GachaService.getPityCount(interaction.user.id);
            
            // Shorter delay for 100x
            if (i < 99 && !skipAnimation) await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        // Get final pity info
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        const pityUsedInSession = allResults.some(r => r.pityUsed);
        
        // Create all batch embeds (don't delete them)
        const batchEmbeds = [];
        for (let batch = 0; batch < 10; batch++) {
            const startIdx = batch * 10;
            const endIdx = startIdx + 10;
            const batchFruits = allDisplayFruits.slice(startIdx, endIdx);
            const batchResults = allResults.slice(startIdx, endIdx);
            
            const summaryData = SummonAnimator.create10xSummary(batchFruits, batchResults, newBalance, pityInfo, pityUsedInSession, batch + 1, 10);
            batchEmbeds.push(summaryData.embed);
        }
        
        // Create mega summary
        const megaSummaryData = SummonAnimator.createMegaSummary(allDisplayFruits, allResults, newBalance, pityInfo, pityUsedInSession, 100);
        
        // Show first batch with navigation
        await this.showBatchNavigation(interaction, batchEmbeds, megaSummaryData.embed, 0);
    },

    async runQuickAnimation(interaction, fruit, result, summonNumber, totalSummons, currentPity) {
        for (let frame = 0; frame < ANIMATION_CONFIG.QUICK_FRAMES; frame++) {
            const embed = SummonAnimator.createQuickFrame(frame, fruit, summonNumber, totalSummons, currentPity);
            
            if (summonNumber === 1 && frame === 0 && !interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.QUICK_DELAY));
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const revealEmbed = SummonAnimator.createQuickReveal(fruit, result, summonNumber, totalSummons, currentPity);
        await interaction.editReply({ embeds: [revealEmbed] });
        
        await new Promise(resolve => setTimeout(resolve, 300));
    },

    async showBatchNavigation(interaction, batchEmbeds, summaryEmbed, currentPage) {
        const totalPages = batchEmbeds.length;
        const hasSummary = summaryEmbed !== null;
        
        const navigationRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('batch_first')
                    .setLabel('⏮️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('batch_prev')
                    .setLabel('⬅️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('batch_summary')
                    .setLabel('📊 Summary')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('batch_next')
                    .setLabel('➡️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === totalPages - 1),
                new ButtonBuilder()
                    .setCustomId('batch_last')
                    .setLabel('⏭️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === totalPages - 1)
            );
        
        // Show current batch
        const currentEmbed = batchEmbeds[currentPage];
        await interaction.editReply({ 
            embeds: [currentEmbed], 
            components: [navigationRow] 
        });
        
        // Setup collector for navigation
        const message = await interaction.fetchReply();
        const collector = message.createMessageComponentCollector({ time: 600000 }); // 10 minutes
        
        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.user.id !== interaction.user.id) {
                return buttonInteraction.reply({
                    content: '❌ You can only navigate your own summon results!',
                    ephemeral: true
                });
            }
            
            let newPage = currentPage;
            let showSummary = false;
            
            switch (buttonInteraction.customId) {
                case 'batch_first':
                    newPage = 0;
                    break;
                case 'batch_prev':
                    newPage = Math.max(0, currentPage - 1);
                    break;
                case 'batch_summary':
                    showSummary = true;
                    break;
                case 'batch_next':
                    newPage = Math.min(totalPages - 1, currentPage + 1);
                    break;
                case 'batch_last':
                    newPage = totalPages - 1;
                    break;
                case 'back_to_batches':
                    // Return to batch navigation
                    const returnNavigationRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('batch_first')
                                .setLabel('⏮️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === 0),
                            new ButtonBuilder()
                                .setCustomId('batch_prev')
                                .setLabel('⬅️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === 0),
                            new ButtonBuilder()
                                .setCustomId('batch_summary')
                                .setLabel('📊 Summary')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('batch_next')
                                .setLabel('➡️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === totalPages - 1),
                            new ButtonBuilder()
                                .setCustomId('batch_last')
                                .setLabel('⏭️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(currentPage === totalPages - 1)
                        );
                    
                    await buttonInteraction.update({ 
                        embeds: [batchEmbeds[currentPage]], 
                        components: [returnNavigationRow] 
                    });
                    return;
            }
            
            if (showSummary && hasSummary) {
                // Show summary with back button
                const backRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('back_to_batches')
                            .setLabel('⬅️ Back to Batches')
                            .setStyle(ButtonStyle.Secondary)
                    );
                
                await buttonInteraction.update({ 
                    embeds: [summaryEmbed], 
                    components: [backRow] 
                });
            } else if (newPage !== currentPage) {
                // Update navigation row
                const updatedNavigationRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('batch_first')
                            .setLabel('⏮️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(newPage === 0),
                        new ButtonBuilder()
                            .setCustomId('batch_prev')
                            .setLabel('⬅️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(newPage === 0),
                        new ButtonBuilder()
                            .setCustomId('batch_summary')
                            .setLabel('📊 Summary')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('batch_next')
                            .setLabel('➡️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(newPage === totalPages - 1),
                        new ButtonBuilder()
                            .setCustomId('batch_last')
                            .setLabel('⏭️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(newPage === totalPages - 1)
                    );
                
                await buttonInteraction.update({ 
                    embeds: [batchEmbeds[newPage]], 
                    components: [updatedNavigationRow] 
                });
                
                currentPage = newPage;
            }
        });
        
        collector.on('end', () => {
            // Disable all buttons when collector expires
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('batch_first_disabled')
                        .setLabel('⏮️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('batch_prev_disabled')
                        .setLabel('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('batch_summary_disabled')
                        .setLabel('📊 Summary')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('batch_next_disabled')
                        .setLabel('➡️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('batch_last_disabled')
                        .setLabel('⏭️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
            
            interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
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
                    .setCustomId(`summon_10x_${interaction.user.id}`)
                    .setLabel('🍈 Summon 10x')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`summon_50x_${interaction.user.id}`)
                    .setLabel('🍈 Summon 50x')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`summon_100x_${interaction.user.id}`)
                    .setLabel('🍈 Summon 100x')
                    .setStyle(ButtonStyle.Danger)
            );

        const currentReply = await interaction.fetchReply();
        const currentEmbed = currentReply.embeds[0];
        
        await interaction.editReply({
            embeds: [currentEmbed],
            components: [row]
        });

        // Setup collector for new summons
        const message = await interaction.fetchReply();
        const collector = message.createMessageComponentCollector({ time: 300000 }); // 5 minutes
        
        collector.on('collect', async (buttonInteraction) => {
            const [action, count, userId] = buttonInteraction.customId.split('_');
            
            if (buttonInteraction.user.id !== userId) {
                return buttonInteraction.reply({
                    content: '❌ You can only use your own summon buttons!',
                    ephemeral: true
                });
            }
            
            // Check if user has enough berries
            const EconomyService = require('../../../services/EconomyService');
            const { PULL_COST } = require('../../../data/Constants');
            const cost = PULL_COST * parseInt(count.replace('x', ''));
            const balance = await EconomyService.getBalance(userId);
            
            if (balance < cost) {
                const GachaService = require('../../../services/GachaService');
                const pityInfo = await GachaService.getPityInfo(userId);
                const pityDisplay = GachaService.formatPityDisplay(pityInfo);
                
                return buttonInteraction.reply({
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
            
            // Deduct berries and start new summon
            await EconomyService.deductBerries(userId, cost, 'gacha_summon');
            const newBalance = balance - cost;
            
            // Acknowledge the button press
            await buttonInteraction.deferUpdate();
            
            // Start the appropriate summon
            const summonCount = parseInt(count.replace('x', ''));
            if (summonCount === 10) {
                await this.run10xSummon(buttonInteraction, newBalance);
            } else if (summonCount === 50) {
                await this.run50xSummon(buttonInteraction, newBalance);
            } else if (summonCount === 100) {
                await this.run100xSummon(buttonInteraction, newBalance);
            }
        });
        
        collector.on('end', () => {
            // Disable buttons when collector expires
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
            
            interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
    }
};
