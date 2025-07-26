// src/commands/slash/gacha/summon.js - COMPLETE Updated with NEW Pity System Display
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GachaService = require('../../../services/GachaService');
const EconomyService = require('../../../services/EconomyService');
const DatabaseManager = require('../../../database/DatabaseManager');
const { PULL_COST, RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');
const { getFruitsByRarity, getRandomFruitByRarity } = require('../../../data/DevilFruits');

// Animation Configuration
const ANIMATION_CONFIG = {
    RAINBOW_FRAMES: 6,
    RAINBOW_DELAY: 1000,  // Reduced from 1200 to 1000 (faster)
    SPREAD_FRAMES: 12,
    SPREAD_DELAY: 500,    // Reduced from 600 to 500 (faster)
    REVEAL_FRAMES: 8,
    REVEAL_DELAY: 750,    // Reduced from 900 to 750 (faster)
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

    static createRainbowFrame(frame, fruit) {
        const pattern = this.getRainbowPattern(frame);
        const color = this.getRainbowColor(frame);
        const description = HUNT_DESCRIPTIONS[frame] || HUNT_DESCRIPTIONS[5];
        
        // Animated loading dots that cycle
        const loadingDots = '●'.repeat((frame % 5) + 1) + '○'.repeat(4 - (frame % 5));
        const mysteriousInfo = `✨ **Devil Fruit Summoning in Progress** ✨\n\n${pattern}\n\n` +
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
            .setTitle('🏴‍☠️ Devil Fruit Summoning')
            .setDescription(`${description}\n\n${mysteriousInfo}`)
            .setColor(color)
            .setFooter({ text: `🌊 Searching the mysterious seas...` });
    }

    static createColorSpreadFrame(frame, fruit, rewardColor, rewardEmoji) {
        const barLength = 20;
        const center = 9.5;
        const spreadRadius = Math.floor(frame * 1.0);
        
        const bar = Array(barLength).fill('⬛');
        const rainbowSquares = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬜'];
        const raritySquare = this.getRaritySquare(fruit.rarity);
        
        for (let i = 0; i < barLength; i++) {
            const distanceFromCenter = Math.abs(i - center);
            
            if (distanceFromCenter <= spreadRadius) {
                bar[i] = raritySquare;
            } else {
                const colorIndex = Math.floor(distanceFromCenter + frame * 0.5) % rainbowSquares.length;
                bar[i] = rainbowSquares[colorIndex];
            }
        }

        const pattern = bar.join(' ');
        // Animated loading dots that cycle through the frames
        const progressDots = '●'.repeat((frame % 5) + 1) + '○'.repeat(4 - (frame % 5));
        
        const mysteriousInfo = `✨ **Devil Fruit Manifestation** ✨\n\n${pattern}\n\n` +
            `📊 **Status:** ${progressDots}\n` +
            `🍃 **Name:** ${progressDots}\n` +
            `🔮 **Type:** ${progressDots}\n` +
            `⭐ **Rarity:** ${progressDots}\n` +
            `💪 **CP Multiplier:** ${progressDots}\n` +
            `🎯 **Description:** ${progressDots}\n` +
            `⚔️ **Ability:** ${progressDots}\n\n` +
            `🔥 **Total CP:** ${progressDots}\n` +
            `💰 **Remaining Berries:** ${progressDots}\n\n` +
            `${pattern}`;
        
        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Summoning')
            .setDescription(`🔮 Mysterious power manifesting...\n\n${mysteriousInfo}`)
            .setColor(rewardColor)
            .setFooter({ text: `⚡ Power crystallizing... ${progressDots}` });
    }

    static createTextRevealFrame(frame, fruit, result, newBalance, rewardColor, rewardEmoji) {
        const raritySquare = this.getRaritySquare(fruit.rarity);
        const pattern = Array(20).fill(raritySquare).join(' ');
        const duplicateCount = result.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `📚 Total Owned: ${duplicateCount}`;
        const totalCp = result.fruit?.total_cp || 250;
        
        const glowEffect = frame >= 7 ? '✨ ' : '';
        let description = `${glowEffect}**Devil Fruit Acquired!** ${glowEffect}\n\n${pattern}\n\n`;
        
        description += `📊 **Status:** ${frame >= 0 ? duplicateText : '???'}\n`;
        description += `🍃 **Name:** ${frame >= 1 ? fruit.name : '???'}\n`;
        description += `🔮 **Type:** ${frame >= 2 ? fruit.type : '???'}\n`;
        description += `⭐ **Rarity:** ${frame >= 3 ? `${raritySquare} ${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)}` : '???'}\n`;
        description += `💪 **CP Multiplier:** ${frame >= 4 ? `x${fruit.multiplier}` : '???'}\n`;
        description += `🎯 **Description:** ${frame >= 5 ? fruit.description : '???'}\n`;
        description += `⚔️ **Ability:** ${frame >= 6 ? `${fruit.skillName} (${fruit.skillDamage} DMG, ${fruit.skillCooldown}s CD)` : '???'}\n\n`;
        description += `🔥 **Total CP:** ${frame >= 7 ? `${totalCp.toLocaleString()} CP` : '???'}\n`;
        description += `💰 **Remaining Berries:** ${newBalance.toLocaleString()}\n\n`;
        description += `${pattern}`;

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Summoning')
            .setDescription(description)
            .setColor(rewardColor)
            .setFooter({ text: `🎉 Added to your collection! Revealing...` });
    }

    static createFinalReveal(fruit, result, newBalance, pityInfo, pityUsed = false) {
        const raritySquare = this.getRaritySquare(fruit.rarity);
        const color = RARITY_COLORS[fruit.rarity];
        const pattern = Array(20).fill(raritySquare).join(' ');
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

        const embed = new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Summoning Complete!')
            .setDescription(description)
            .setColor(color)
            .setTimestamp();

        // Add pity information to footer
        let footerText = '🏴‍☠️ Your legend grows on the Grand Line!';
        if (pityUsed) {
            footerText = '✨ PITY ACTIVATED! Premium rates used! | ' + footerText;
        }
        
        embed.setFooter({ text: footerText });

        return embed;
    }

    static createQuickFrame(frame, fruit, summonNumber) {
        const pattern = this.getRainbowPattern(frame, 20);
        const color = this.getRainbowColor(frame);
        // Animated loading dots that cycle
        const loadingDots = '●'.repeat((frame % 5) + 1) + '○'.repeat(4 - (frame % 5));
        
        const description = `**Summon ${summonNumber}/10**\n\n🌊 Scanning the Grand Line...\n\n${pattern}\n\n` +
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
            .setTitle('🍈 10x Devil Fruit Summoning')
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: `Summon ${summonNumber} of 10 - Searching...` });
    }

    static createQuickReveal(fruit, result, summonNumber) {
        const raritySquare = this.getRaritySquare(fruit.rarity);
        const color = RARITY_COLORS[fruit.rarity];
        const pattern = Array(20).fill(raritySquare).join(' ');
        
        // Get the actual duplicate count from the result
        const duplicateCount = result.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `Total Owned: ${duplicateCount}`;
        
        const description = `**Summon ${summonNumber}/10** - ✨ **ACQUIRED!**\n\n${pattern}\n\n` +
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
        
        let footerText = `Summon ${summonNumber} of 10 - ✨ Acquired!`;
        if (result.pityUsed) {
            footerText = `✨ PITY USED! | ${footerText}`;
        }
        
        return new EmbedBuilder()
            .setTitle('🍈 10x Devil Fruit Summoning')
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: footerText });
    }

    static create10xSummary(fruits, results, balance, pityInfo, pityUsedInSession) {
        let detailedResults = '';
        fruits.forEach((fruit, index) => {
            const result = results[index];
            const raritySquare = this.getRaritySquare(fruit.rarity);
            const number = (index + 1).toString().padStart(2, '0');
            
            const duplicateCount = result.duplicateCount || 1;
            const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `Total Owned: ${duplicateCount}`;
            const pityIndicator = result.pityUsed ? ' 🎯' : '';
            
            detailedResults += `**${number}.** ${raritySquare} **${fruit.name}**${pityIndicator} (${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)})\n`;
            detailedResults += `      📊 **Status:** ${duplicateText}\n`;
            detailedResults += `      🔮 **Type:** ${fruit.type}\n`;
            detailedResults += `      💪 **CP Multiplier:** x${fruit.multiplier}\n`;
            detailedResults += `      🎯 **Description:** ${fruit.description}\n`;
            detailedResults += `      ⚔️ **Ability:** ${fruit.skillName} (${fruit.skillDamage} DMG, ${fruit.skillCooldown}s CD)\n\n`;
        });

        // Find highest rarity using rarity priority values
        const rarityPriority = {
            'common': 1,
            'uncommon': 2,
            'rare': 3,
            'epic': 4,
            'legendary': 5,
            'mythical': 6,
            'divine': 7
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

        // Add pity display to summary
        const pityDisplay = GachaService.formatPityDisplay(pityInfo, pityUsedInSession);

        const embed = new EmbedBuilder()
            .setTitle('🍈 10x Devil Fruit Summoning Complete!')
            .setDescription(`🎉 **Congratulations! You've summoned 10 magnificent Devil Fruits!** 🎉\n\n${detailedResults}💰 **Remaining Berries:** ${balance.toLocaleString()}\n\n${pityDisplay}\n\n✨ All fruits have been added to your collection!`)
            .setColor(highestColor)
            .setTimestamp();

        let footerText = '🏴‍☠️ Your legend grows on the Grand Line!';
        if (pityUsedInSession) {
            footerText = '✨ PITY ACTIVATED THIS SESSION! | ' + footerText;
        }
        embed.setFooter({ text: footerText });

        return { embed, isDivine: highestRarity === 'divine' };
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
            const cost = summonCount === 10 ? PULL_COST * 10 * 0.9 : PULL_COST * summonCount;
            const balance = await EconomyService.getBalance(userId);
            
            if (balance < cost) {
                // Get pity info for insufficient berries message
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
            
            if (summonCount === 1) {
                await this.runSingleSummon(interaction, newBalance);
            } else {
                await this.run10xSummon(interaction, newBalance);
            }
            
        } catch (error) {
            interaction.client.logger.error('Summon command error:', error);
            await interaction.reply({
                content: '❌ An error occurred during your summon.',
                ephemeral: true
            });
        }
    },

    async runSingleSummon(interaction, newBalance) {
        const pullData = await GachaService.performPulls(interaction.user.id, 1);
        const results = pullData.results;
        const result = results[0];
        const fruit = result.fruit;
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        const actualFruit = Object.values(DEVIL_FRUITS).find(f => 
            f.name === result.fruit.fruit_name || f.id === result.fruit.fruit_id
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
        
        await this.runFullAnimation(interaction, displayFruit, result, newBalance, pityInfo, result.pityUsed);
        await this.setupButtons(interaction);
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
        
        await this.run10xAnimation(interaction, displayFruits, results, newBalance, pityInfo, pullData.pityUsedInSession);
        await this.setupButtons(interaction);
    },

    async runFullAnimation(interaction, fruit, result, newBalance, pityInfo, pityUsed) {
        await this.runRainbowPhase(interaction, fruit);
        await new Promise(resolve => setTimeout(resolve, 300));
        await this.runColorSpread(interaction, fruit);
        await new Promise(resolve => setTimeout(resolve, 400));
        await this.runTextReveal(interaction, fruit, result, newBalance);
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.showFinalReveal(interaction, fruit, result, newBalance, pityInfo, pityUsed);
    },

    async run10xAnimation(interaction, fruits, results, newBalance, pityInfo, pityUsedInSession) {
        for (let i = 0; i < 10; i++) {
            const fruit = fruits[i];
            const result = results[i];
            const summonNumber = i + 1;
            await this.runQuickAnimation(interaction, fruit, result, summonNumber);
            if (i < 9) await new Promise(resolve => setTimeout(resolve, 1000));
        }
        await this.show10xSummary(interaction, fruits, results, newBalance, pityInfo, pityUsedInSession);
    },

    async runRainbowPhase(interaction, fruit) {
        // Use same quick animation as 10x but with single pull styling
        for (let frame = 0; frame < ANIMATION_CONFIG.QUICK_FRAMES; frame++) {
            const pattern = SummonAnimator.getRainbowPattern(frame, 20);
            const color = SummonAnimator.getRainbowColor(frame);
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
            
            const embed = new EmbedBuilder()
                .setTitle('🏴‍☠️ Devil Fruit Summoning')
                .setDescription(description)
                .setColor(color)
                .setFooter({ text: `🌊 Searching the mysterious seas...` });
            
            if (frame === 0 && !interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.QUICK_DELAY));
        }
    },

    async runColorSpread(interaction, fruit) {
        const rewardColor = RARITY_COLORS[fruit.rarity];
        const raritySquare = SummonAnimator.getRaritySquare(fruit.rarity);
        
        // Smooth outward spread animation
        for (let frame = 0; frame < ANIMATION_CONFIG.SPREAD_FRAMES; frame++) {
            const barLength = 20;
            const center = 10; // Center at position 10 (0-19)
            const maxRadius = 10; // Maximum spread radius
            const currentRadius = (frame / (ANIMATION_CONFIG.SPREAD_FRAMES - 1)) * maxRadius;
            
            const bar = Array(barLength).fill('⬛');
            const rainbowSquares = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬜'];
            
            // Create smooth outward spread from center
            for (let i = 0; i < barLength; i++) {
                const distanceFromCenter = Math.abs(i - center);
                
                if (distanceFromCenter <= currentRadius) {
                    bar[i] = raritySquare;
                } else {
                    // Fill remaining positions with rainbow pattern
                    const colorIndex = (i + frame) % rainbowSquares.length;
                    bar[i] = rainbowSquares[colorIndex];
                }
            }

            const pattern = bar.join(' ');
            const loadingDots = '●'.repeat((frame % 5) + 1) + '○'.repeat(4 - (frame % 5));
            
            const description = `🔮 Mysterious power manifesting...\n\n${pattern}\n\n` +
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
            
            const embed = new EmbedBuilder()
                .setTitle('🏴‍☠️ Devil Fruit Summoning')
                .setDescription(description)
                .setColor(rewardColor)
                .setFooter({ text: `⚡ Power crystallizing... ${loadingDots}` });
            
            await interaction.editReply({ embeds: [embed] });
            
            if (frame < ANIMATION_CONFIG.SPREAD_FRAMES - 1) {
                await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.SPREAD_DELAY));
            }
        }
    },

    async runTextReveal(interaction, fruit, result, newBalance) {
        const rewardColor = RARITY_COLORS[fruit.rarity];
        const raritySquare = SummonAnimator.getRaritySquare(fruit.rarity);
        const pattern = Array(20).fill(raritySquare).join(' ');
        const duplicateCount = result.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `Total Owned: ${duplicateCount}`;
        const totalCp = result.fruit?.total_cp || 250;
        
        // Gradual reveal - each frame shows one more line
        for (let frame = 0; frame < ANIMATION_CONFIG.REVEAL_FRAMES; frame++) {
            let description = `✨ **Devil Fruit Acquired!** ✨\n\n${pattern}\n\n`;
            
            // Gradual reveal based on frame number (0-7)
            if (frame >= 0) description += `📊 **Status:** ${duplicateText}\n`;
            else description += `📊 **Status:** ●●●●○\n`;
            
            if (frame >= 1) description += `🍃 **Name:** ${fruit.name}\n`;
            else description += `🍃 **Name:** ●●●●○\n`;
            
            if (frame >= 2) description += `🔮 **Type:** ${fruit.type}\n`;
            else description += `🔮 **Type:** ●●●●○\n`;
            
            if (frame >= 3) description += `⭐ **Rarity:** ${raritySquare} ${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)}\n`;
            else description += `⭐ **Rarity:** ●●●●○\n`;
            
            if (frame >= 4) description += `💪 **CP Multiplier:** x${fruit.multiplier}\n`;
            else description += `💪 **CP Multiplier:** ●●●●○\n`;
            
            if (frame >= 5) description += `🎯 **Description:** ${fruit.description}\n`;
            else description += `🎯 **Description:** ●●●●○\n`;
            
            if (frame >= 6) description += `⚔️ **Ability:** ${fruit.skillName} (${fruit.skillDamage} DMG, ${fruit.skillCooldown}s CD)\n\n`;
            else description += `⚔️ **Ability:** ●●●●○\n\n`;
            
            if (frame >= 7) description += `🔥 **Total CP:** ${totalCp.toLocaleString()} CP\n`;
            else description += `🔥 **Total CP:** ●●●●○\n`;
            
            description += `💰 **Remaining Berries:** ${newBalance.toLocaleString()}\n\n${pattern}`;

            const embed = new EmbedBuilder()
                .setTitle('🏴‍☠️ Devil Fruit Summoning')
                .setDescription(description)
                .setColor(rewardColor)
                .setFooter({ text: `🎉 Added to your collection! Revealing...` });

            await interaction.editReply({ embeds: [embed] });
            
            if (frame < ANIMATION_CONFIG.REVEAL_FRAMES - 1) {
                await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.REVEAL_DELAY));
            }
        }
    },

    async runQuickAnimation(interaction, fruit, result, summonNumber) {
        for (let frame = 0; frame < ANIMATION_CONFIG.QUICK_FRAMES; frame++) {
            const embed = SummonAnimator.createQuickFrame(frame, fruit, summonNumber);
            
            if (summonNumber === 1 && frame === 0 && !interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.QUICK_DELAY));
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const revealEmbed = SummonAnimator.createQuickReveal(fruit, result, summonNumber);
        await interaction.editReply({ embeds: [revealEmbed] });
        
        await new Promise(resolve => setTimeout(resolve, 300));
    },

    async showFinalReveal(interaction, fruit, result, newBalance, pityInfo, pityUsed) {
        const embed = SummonAnimator.createFinalReveal(fruit, result, newBalance, pityInfo, pityUsed);
        
        // Add pity information to the description
        const pityDisplay = GachaService.formatPityDisplay(pityInfo, pityUsed);
        const currentDescription = embed.data.description;
        embed.setDescription(currentDescription + '\n\n' + pityDisplay);
        
        await interaction.editReply({ embeds: [embed] });
    },

    async show10xSummary(interaction, fruits, results, newBalance, pityInfo, pityUsedInSession) {
        const summaryData = SummonAnimator.create10xSummary(fruits, results, newBalance, pityInfo, pityUsedInSession);
        
        // Check if we got a divine fruit
        if (summaryData.isDivine) {
            await this.showDivineAnimation(interaction, summaryData.embed);
        } else {
            await interaction.editReply({ embeds: [summaryData.embed] });
        }
    },

    async showDivineAnimation(interaction, baseEmbed) {
        // Divine color animation - fast color changing for 20 seconds
        const divineColors = [
            0xFF0000, // Red
            0xFF8000, // Orange  
            0xFFFF00, // Yellow
            0x00FF00, // Green
            0x0080FF, // Blue
            0x8000FF, // Purple
            0xFF00FF, // Magenta
            0x00FFFF, // Cyan
            0xFFFFFF, // White
            0xFFD700, // Gold
            0xFF1493, // Deep Pink
            0x00FA9A  // Medium Spring Green
        ];
        
        const animationDuration = 20000; // 20 seconds
        const frameDelay = 200; // Change color every 200ms
        const totalFrames = animationDuration / frameDelay;
        
        for (let frame = 0; frame < totalFrames; frame++) {
            const colorIndex = frame % divineColors.length;
            const currentColor = divineColors[colorIndex];
            
            // Create new embed with changing color
            const animatedEmbed = new EmbedBuilder()
                .setTitle('🍈 10x Devil Fruit Summoning Complete!')
                .setDescription(baseEmbed.data.description)
                .setColor(currentColor)
                .setFooter({ text: '✨ DIVINE POWER DETECTED! ✨' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [animatedEmbed] });
            
            // Wait before next color change
            await new Promise(resolve => setTimeout(resolve, frameDelay));
        }
        
        // End with final divine red color
        const finalEmbed = new EmbedBuilder()
            .setTitle('🍈 10x Devil Fruit Summoning Complete!')
            .setDescription(baseEmbed.data.description)
            .setColor(0xFF0000) // Divine red
            .setFooter({ text: '🏴‍☠️ Your legend grows on the Grand Line!' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [finalEmbed] });
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
                    .setLabel('🍈 Summon 10x')
                    .setStyle(ButtonStyle.Success)
            );

        const currentReply = await interaction.fetchReply();
        const currentEmbed = currentReply.embeds[0];
        
        await interaction.editReply({
            embeds: [currentEmbed],
            components: [row]
        });

        // Setup collector with shorter timeout to prevent expired interactions
        const collector = currentReply.createMessageComponentCollector({ time: 120000 }); // Reduced from 300000 to 120000 (2 minutes)
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
            // Check if interaction is still valid
            if (!buttonInteraction.isRepliable()) {
                console.log('Interaction is no longer repliable (expired)');
                return;
            }

            if (buttonInteraction.customId === 'summon_again') {
                await this.handleSummonAgain(buttonInteraction);
            } else if (buttonInteraction.customId === 'summon_10x') {
                await this.handleSummon10x(buttonInteraction);
            }
        } catch (error) {
            console.error('Button error:', error);
            
            // Better error handling for expired interactions
            if (error.code === 10062) {
                console.log('Interaction expired - buttons will be disabled');
                return;
            }
            
            // Only try to respond if interaction hasn't been responded to
            if (!buttonInteraction.replied && !buttonInteraction.deferred && buttonInteraction.isRepliable()) {
                try {
                    await buttonInteraction.reply({ 
                        content: '❌ An error occurred. Please try using the /summon command again.', 
                        ephemeral: true 
                    });
                } catch (replyError) {
                    console.log('Could not send error reply - interaction may be expired');
                }
            }
        }
    },

    async handleSummonAgain(buttonInteraction) {
        const cost = PULL_COST;
        const balance = await EconomyService.getBalance(buttonInteraction.user.id);
        
        if (balance < cost) {
            const pityInfo = await GachaService.getPityInfo(buttonInteraction.user.id);
            const pityDisplay = GachaService.formatPityDisplay(pityInfo);
            
            return buttonInteraction.reply({ 
                content: `💸 You need **${cost.toLocaleString()}** berries but only have **${balance.toLocaleString()}** berries!\n\n${pityDisplay}\n\n💡 Use \`/income\` to collect berries.`, 
                ephemeral: true 
            });
        }

        await EconomyService.deductBerries(buttonInteraction.user.id, cost, 'summon_again');
        const newBalance = balance - cost;

        // Check if interaction is still valid before deferring
        if (!buttonInteraction.isRepliable()) {
            console.log('Cannot defer - interaction expired');
            return;
        }

        await buttonInteraction.deferReply();
        await this.runSingleSummon(buttonInteraction, newBalance);
        await this.setupButtons(buttonInteraction);
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

        // Check if interaction is still valid before deferring
        if (!buttonInteraction.isRepliable()) {
            console.log('Cannot defer - interaction expired');
            return;
        }

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
                        .setLabel('🍈 Summon Again')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('summon_10x_disabled')
                        .setLabel('🍈 Summon 10x')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                );

            await interaction.editReply({ components: [disabledRow] });
        } catch (error) {
            console.log('Could not disable buttons - interaction may have been deleted');
        }
    }
};
