// src/commands/slash/gacha/summon.js - COMPLETE SMOOTH Animation Implementation
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GachaService = require('../../../services/GachaService');
const EconomyService = require('../../../services/EconomyService');
const DatabaseManager = require('../../../database/DatabaseManager');
const { PULL_COST, RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');
const { getFruitsByRarity, getRandomFruitByRarity } = require('../../../data/DevilFruits');

// SMOOTH Animation Configuration - Much faster and smoother
const SMOOTH_ANIMATION_CONFIG = {
    // Scanning phase - faster frames
    SCAN_FRAMES: 8,           // Reduced from 12
    SCAN_DELAY: 300,          // Reduced from 500ms
    
    // Transition phase - new smooth transition
    TRANSITION_FRAMES: 6,     // New transition phase
    TRANSITION_DELAY: 200,    // Fast transition
    
    // Reveal phase - quicker reveal
    REVEAL_FRAMES: 4,         // Reduced from 8
    REVEAL_DELAY: 400,        // Reduced from 750ms
    
    // Color transition - smoother color changes
    COLOR_TRANSITION_SPEED: 150,  // Faster color transitions
    
    // Pattern animation - smoother pattern flow
    PATTERN_FLOW_SPEED: 100   // Faster pattern updates
};

const HUNT_DESCRIPTIONS = [
    "🌊 Searching the Grand Line's mysterious depths...",
    "⚡ Devil Fruit energy detected... analyzing power signature...",
    "🔥 Tremendous force breaking through dimensional barriers...",
    "💎 Legendary power crystallizing before your eyes...",
    "🌟 Ancient mysteries awakening from the ocean's heart...",
    "⚔️ The sea itself trembles with anticipation..."
];

class SmoothSummonAnimator {
    
    /**
     * Create smooth scanning animation with flowing rainbow
     */
    static createSmoothScanFrame(frame, fruit, summonNumber, totalSummons, currentPity) {
        // Flowing rainbow pattern that moves smoothly
        const flowingPattern = this.createFlowingRainbow(frame, 20);
        
        // Smooth color transitions for embed
        const scanColor = this.getSmoothScanColor(frame);
        
        // Dynamic loading animation
        const loadingAnimation = this.createLoadingAnimation(frame);
        
        const description = `🌊 **Scanning the Grand Line...**\n\n${flowingPattern}\n\n` +
            `📊 **Status:** ${loadingAnimation}\n` +
            `🍃 **Searching for:** ${this.createSearchingText(frame)}\n` +
            `🔮 **Energy Level:** ${this.createEnergyMeter(frame)}\n` +
            `⭐ **Rarity Detection:** ${this.createRarityScanner(frame)}\n` +
            `💪 **Power Analysis:** ${this.createPowerAnalysis(frame)}\n` +
            `🎯 **Fruit Signature:** ${this.createSignatureScanner(frame)}\n` +
            `⚔️ **Ability Scan:** ${this.createAbilityScanner(frame)}\n\n` +
            `🔥 **Total CP:** ${this.createCPScanner(frame)}\n` +
            `💰 **Cost Analysis:** ${this.createCostAnalysis(frame)}\n\n` +
            `${flowingPattern}`;
        
        return new EmbedBuilder()
            .setTitle(`🍈 ${totalSummons}x Devil Fruit Summoning - Scanning...`)
            .setDescription(description)
            .setColor(scanColor)
            .setFooter({ text: `Summon ${summonNumber} of ${totalSummons} - Analyzing... | Pity: ${currentPity}/1500` });
    }

    /**
     * Create smooth transition from scanning to rarity detection
     */
    static createSmoothTransition(frame, fruit, summonNumber, totalSummons, currentPity) {
        const raritySquare = this.getRaritySquare(fruit.rarity);
        const targetColor = RARITY_COLORS[fruit.rarity];
        
        // Transition pattern - gradually introducing rarity color
        const transitionPattern = this.createTransitionPattern(frame, raritySquare, 20);
        
        // Smooth color transition to rarity color
        const transitionColor = this.interpolateColor(
            this.getSmoothScanColor(7), // Last scan color
            targetColor,
            frame / SMOOTH_ANIMATION_CONFIG.TRANSITION_FRAMES
        );
        
        const description = `✨ **ENERGY SIGNATURE DETECTED!**\n\n${transitionPattern}\n\n` +
            `📊 **Status:** Analysis Complete!\n` +
            `🍃 **Type Detected:** ${this.createTypeReveal(frame, fruit.type)}\n` +
            `🔮 **Power Class:** ${this.createPowerReveal(frame, fruit.rarity)}\n` +
            `⭐ **Rarity Level:** ${this.createRarityReveal(frame, fruit.rarity, raritySquare)}\n` +
            `💪 **Multiplier:** ${this.createMultiplierReveal(frame, fruit.multiplier)}\n` +
            `🎯 **Identification:** ${this.createNameReveal(frame, fruit.name)}\n` +
            `⚔️ **Ability Type:** ${this.createAbilityReveal(frame, fruit.skillName)}\n\n` +
            `🔥 **Final Analysis:** ${this.createFinalAnalysis(frame)}\n` +
            `💰 **Value Assessment:** Processing...\n\n` +
            `${transitionPattern}`;
        
        return new EmbedBuilder()
            .setTitle(`🍈 ${totalSummons}x Devil Fruit Summoning - Analyzing...`)
            .setDescription(description)
            .setColor(transitionColor)
            .setFooter({ text: `Summon ${summonNumber} of ${totalSummons} - Energy Detected! | Pity: ${currentPity}/1500` });
    }

    /**
     * Create smooth final reveal
     */
    static createSmoothReveal(fruit, result, summonNumber, totalSummons, currentPity) {
        const raritySquare = this.getRaritySquare(fruit.rarity);
        const color = RARITY_COLORS[fruit.rarity];
        
        // Celebration pattern for final reveal
        const celebrationPattern = this.createCelebrationPattern(raritySquare, 20);
        
        const duplicateCount = result.duplicateCount || 1;
        const duplicateText = duplicateCount === 1 ? '✨ **NEW DISCOVERY!**' : `**Total Owned:** ${duplicateCount}`;
        
        const description = `🎉 **DEVIL FRUIT ACQUIRED!** 🎉\n\n${celebrationPattern}\n\n` +
            `📊 **Status:** ${duplicateText}\n` +
            `🍃 **Name:** **${fruit.name}**\n` +
            `🔮 **Type:** **${fruit.type}**\n` +
            `⭐ **Rarity:** ${raritySquare} **${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)}**` +
            (result.pityUsed ? ' 🎯 **PITY ACTIVATED!**' : '') + `\n` +
            `💪 **CP Multiplier:** **x${fruit.multiplier}**\n` +
            `🎯 **Description:** ${fruit.description}\n` +
            `⚔️ **Ability:** **${fruit.skillName}** (${fruit.skillDamage} DMG, ${fruit.skillCooldown}s CD)\n\n` +
            `🔥 **Total CP:** **${result.fruit?.total_cp?.toLocaleString() || '250'} CP**\n` +
            `💰 **Remaining Berries:** Calculating...\n\n` +
            `${celebrationPattern}`;
        
        let footerText = `Summon ${summonNumber} of ${totalSummons} - ✨ SUCCESS! | Pity: ${currentPity}/1500`;
        if (result.pityUsed) {
            footerText = `🎯 PITY ACTIVATED! | ${footerText}`;
        }
        
        return new EmbedBuilder()
            .setTitle(`🍈 ${totalSummons}x Devil Fruit Summoning - SUCCESS!`)
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: footerText });
    }

    /**
     * Create flowing rainbow pattern that moves smoothly
     */
    static createFlowingRainbow(frame, length) {
        const colors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬜'];
        const pattern = [];
        
        // Create smooth flowing effect
        for (let i = 0; i < length; i++) {
            const colorIndex = (i + frame * 2) % colors.length; // Faster flow
            pattern.push(colors[colorIndex]);
        }
        
        return pattern.join(' ');
    }

    /**
     * Create transition pattern that gradually introduces rarity color
     */
    static createTransitionPattern(frame, raritySquare, length) {
        const colors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬜'];
        const pattern = [];
        
        // Calculate how many squares should be rarity color
        const rarityCount = Math.floor((frame / SMOOTH_ANIMATION_CONFIG.TRANSITION_FRAMES) * length);
        
        for (let i = 0; i < length; i++) {
            if (i < rarityCount) {
                pattern.push(raritySquare);
            } else {
                const colorIndex = (i + frame * 2) % colors.length;
                pattern.push(colors[colorIndex]);
            }
        }
        
        return pattern.join(' ');
    }

    /**
     * Create celebration pattern for final reveal
     */
    static createCelebrationPattern(raritySquare, length) {
        const pattern = [];
        
        // Celebration effect with rarity color
        for (let i = 0; i < length; i++) {
            pattern.push(raritySquare);
        }
        
        return pattern.join(' ');
    }

    /**
     * Get smooth scanning color that transitions through rainbow
     */
    static getSmoothScanColor(frame) {
        const colors = [0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 0xFF00FF, 0x00FFFF];
        const index = frame % colors.length;
        return colors[index];
    }

    /**
     * Interpolate between two colors for smooth transitions
     */
    static interpolateColor(color1, color2, progress) {
        progress = Math.max(0, Math.min(1, progress));
        
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;
        
        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;
        
        const r = Math.round(r1 + (r2 - r1) * progress);
        const g = Math.round(g1 + (g2 - g1) * progress);
        const b = Math.round(b1 + (b2 - b1) * progress);
        
        return (r << 16) | (g << 8) | b;
    }

    /**
     * Animation helper methods for dynamic text
     */
    static createLoadingAnimation(frame) {
        const animations = [
            '◐ Scanning...', '◓ Analyzing...', '◑ Processing...', '◒ Detecting...',
            '◐ Identifying...', '◓ Calculating...', '◑ Evaluating...', '◒ Finalizing...'
        ];
        return animations[frame % animations.length];
    }

    static createSearchingText(frame) {
        const searches = [
            'Devil Fruit Energy', 'Power Signatures', 'Rare Frequencies', 'Legendary Auras',
            'Mystical Essences', 'Divine Resonance', 'Ancient Powers', 'Hidden Abilities'
        ];
        return searches[frame % searches.length];
    }

    static createEnergyMeter(frame) {
        const level = (frame % 8) + 1;
        const bars = '█'.repeat(level) + '░'.repeat(8 - level);
        return `[${bars}] ${(level * 12.5).toFixed(0)}%`;
    }

    static createRarityScanner(frame) {
        const scanners = [
            'Common Range ⚪', 'Uncommon Zone 🟢', 'Rare Frequency 🔵', 'Epic Resonance 🟣',
            'Legendary Aura 🌟', 'Mythical Power 🟠', 'Divine Energy ✨', 'Unknown Signal ❓'
        ];
        return scanners[frame % scanners.length];
    }

    static createPowerAnalysis(frame) {
        const analyses = [
            'Low Power', 'Moderate Force', 'High Energy', 'Intense Power',
            'Extreme Force', 'Overwhelming Aura', 'Legendary Might', 'Divine Strength'
        ];
        return analyses[frame % analyses.length];
    }

    static createSignatureScanner(frame) {
        const signatures = [
            'Paramecia Type', 'Zoan Class', 'Logia Nature', 'Ancient Power',
            'Mythical Force', 'Divine Essence', 'Unknown Origin', 'Classified'
        ];
        return signatures[frame % signatures.length];
    }

    static createAbilityScanner(frame) {
        const abilities = [
            'Combat Skill', 'Support Power', 'Transformation', 'Elemental Control',
            'Reality Bending', 'Time Manipulation', 'Space Control', 'Ultimate Technique'
        ];
        return abilities[frame % abilities.length];
    }

    static createCPScanner(frame) {
        const cps = ['250 CP', '500 CP', '1,000 CP', '2,500 CP', '5,000 CP', '10,000 CP', '25,000 CP', '50,000+ CP'];
        return cps[frame % cps.length];
    }

    static createCostAnalysis(frame) {
        const costs = ['Calculating...', 'Processing...', 'Analyzing...', 'Computing...'];
        return costs[frame % costs.length];
    }

    // Transition reveal methods
    static createTypeReveal(frame, actualType) {
        if (frame < 3) return 'Detecting...';
        return actualType;
    }

    static createPowerReveal(frame, actualRarity) {
        if (frame < 2) return 'Analyzing...';
        return actualRarity.charAt(0).toUpperCase() + actualRarity.slice(1);
    }

    static createRarityReveal(frame, actualRarity, raritySquare) {
        if (frame < 4) return 'Identifying...';
        return `${raritySquare} ${actualRarity.charAt(0).toUpperCase() + actualRarity.slice(1)}`;
    }

    static createMultiplierReveal(frame, actualMultiplier) {
        if (frame < 3) return 'Calculating...';
        return `x${actualMultiplier}`;
    }

    static createNameReveal(frame, actualName) {
        if (frame < 5) return 'Decoding...';
        return actualName;
    }

    static createAbilityReveal(frame, actualSkill) {
        if (frame < 4) return 'Scanning...';
        return actualSkill;
    }

    static createFinalAnalysis(frame) {
        const analyses = ['Processing...', 'Finalizing...', 'Complete!'];
        const index = Math.min(frame, analyses.length - 1);
        return analyses[index];
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

// Main animation function for smoother experience
async function runSmoothAnimation(interaction, fruit, result, summonNumber, totalSummons, currentPity) {
    try {
        // Phase 1: Smooth scanning animation (faster)
        for (let frame = 0; frame < SMOOTH_ANIMATION_CONFIG.SCAN_FRAMES; frame++) {
            const embed = SmoothSummonAnimator.createSmoothScanFrame(
                frame, fruit, summonNumber, totalSummons, currentPity
            );
            
            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, SMOOTH_ANIMATION_CONFIG.SCAN_DELAY));
        }
        
        // Phase 2: Smooth transition to rarity (new phase)
        for (let frame = 0; frame < SMOOTH_ANIMATION_CONFIG.TRANSITION_FRAMES; frame++) {
            const embed = SmoothSummonAnimator.createSmoothTransition(
                frame, fruit, summonNumber, totalSummons, currentPity
            );
            
            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, SMOOTH_ANIMATION_CONFIG.TRANSITION_DELAY));
        }
        
        // Phase 3: Final reveal (faster)
        for (let frame = 0; frame < SMOOTH_ANIMATION_CONFIG.REVEAL_FRAMES; frame++) {
            const embed = SmoothSummonAnimator.createSmoothReveal(
                fruit, result, summonNumber, totalSummons, currentPity
            );
            
            await interaction.editReply({ embeds: [embed] });
            
            if (frame < SMOOTH_ANIMATION_CONFIG.REVEAL_FRAMES - 1) {
                await new Promise(resolve => setTimeout(resolve, SMOOTH_ANIMATION_CONFIG.REVEAL_DELAY));
            }
        }
        
    } catch (error) {
        // Fallback to simple reveal if animation fails
        const embed = SmoothSummonAnimator.createSmoothReveal(
            fruit, result, summonNumber, totalSummons, currentPity
        );
        await interaction.editReply({ embeds: [embed] });
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
        )
        .addBooleanOption(option =>
            option.setName('skip_animation')
                .setDescription('Skip animations and show results immediately')
                .setRequired(false)
        ),
    
    category: 'gacha',
    cooldown: 5,
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const summonCount = interaction.options.getInteger('count') || 10; // Default to 10x
        const skipAnimation = interaction.options.getBoolean('skip_animation') || false;
        
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
            
            // ALWAYS defer the reply first for longer operations
            await interaction.deferReply();
            
            await EconomyService.deductBerries(userId, cost, 'gacha_summon');
            const newBalance = balance - cost;
            
            if (summonCount === 10) {
                await this.run10xSummon(interaction, newBalance, skipAnimation);
            } else if (summonCount === 50) {
                await this.run50xSummon(interaction, newBalance, skipAnimation);
            } else if (summonCount === 100) {
                await this.run100xSummon(interaction, newBalance, skipAnimation);
            }
            
        } catch (error) {
            interaction.client.logger.error('Summon command error:', error);
            
            // Check if we can still respond
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred during your summon.',
                        ephemeral: true
                    });
                } else {
                    await interaction.editReply({
                        content: '❌ An error occurred during your summon.'
                    });
                }
            } catch (responseError) {
                interaction.client.logger.error('Failed to send error response:', responseError);
            }
        }
    },

    async run10xSummon(interaction, newBalance, skipAnimation = false) {
        // Get initial pity for tracking
        let currentPity = await GachaService.getPityCount(interaction.user.id);
        
        // Get all fruits data BEFORE performing pulls to track pity changes
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
        // Perform pulls one by one to track pity in real-time
        const allResults = [];
        const allDisplayFruits = [];
        
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
            
            // Check skip animation setting
            if (skipAnimation) {
                // Use simple rainbow animation (like 50x/100x skip) - CONSTANTLY UPDATE
                await this.showSimpleLoadingAnimation(interaction, i + 1, 10);
                await new Promise(resolve => setTimeout(resolve, 100)); // Short delay for constant updates
            } else {
                // Use NEW SMOOTH animation system instead of clunky old one
                await runSmoothAnimation(interaction, displayFruit, result, i + 1, 10, currentPity);
                if (i < 9) await new Promise(resolve => setTimeout(resolve, 600)); // Reduced from 800ms
            }
            
            // Update pity for next pull
            currentPity = await GachaService.getPityCount(interaction.user.id);
        }
        
        // Get final pity info
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        const pityUsedInSession = allResults.some(r => r.pityUsed);
        
        // Show summary
        await this.show10xSummary(interaction, allDisplayFruits, allResults, newBalance, pityInfo, pityUsedInSession);
        await this.setupButtons(interaction);
    },

    async run50xSummon(interaction, newBalance, skipAnimation = false) {
        // Get initial pity for tracking
        let currentPity = await GachaService.getPityCount(interaction.user.id);
        
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
        // Perform ALL 50 pulls one by one
        const allResults = [];
        const allDisplayFruits = [];
        
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
            
            // Update pity for next pull
            currentPity = await GachaService.getPityCount(interaction.user.id);
            
            // Show animation based on skip_animation setting
            if (skipAnimation) {
                // Use simple rainbow animation - CONSTANTLY UPDATE
                await this.showSimpleLoadingAnimation(interaction, i + 1, 50);
                await new Promise(resolve => setTimeout(resolve, 50)); // Constant updates
            } else {
                // Smart animation system for 50x - only full animation for special pulls
                const isSpecialPull = ['legendary', 'mythical', 'divine'].includes(displayFruit.rarity);
                
                if (isSpecialPull || i % 10 === 9) { // Show full animation for special pulls or every 10th pull
                    await runSmoothAnimation(interaction, displayFruit, result, i + 1, 50, currentPity);
                    await new Promise(resolve => setTimeout(resolve, 400));
                } else {
                    // Quick flash for common pulls
                    await this.showQuickFlash(interaction, displayFruit, result, i + 1, 50, currentPity);
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }
            
            // Adjust delay based on animation preference
            const delay = skipAnimation ? 25 : (['legendary', 'mythical', 'divine'].includes(displayFruit.rarity) ? 200 : 100);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Get final pity info
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        const pityUsedInSession = allResults.some(r => r.pityUsed);
        
        // GLOBAL SORT: Sort ALL fruits by rarity first, then distribute to batches
        const allPairs = allDisplayFruits.map((fruit, index) => ({
            fruit,
            result: allResults[index],
            originalIndex: index
        }));
        
        // Sort all fruits globally by rarity (highest first)
        const rarityPriority = {
            'divine': 7, 'mythical': 6, 'legendary': 5, 'epic': 4,
            'rare': 3, 'uncommon': 2, 'common': 1
        };
        
        allPairs.sort((a, b) => {
            const rarityA = rarityPriority[a.fruit.rarity] || 0;
            const rarityB = rarityPriority[b.fruit.rarity] || 0;
            
            if (rarityA !== rarityB) {
                return rarityB - rarityA; // Higher rarity first
            }
            
            return a.fruit.name.localeCompare(b.fruit.name); // Then alphabetical
        });
        
        // Now create sorted arrays
        const sortedFruits = allPairs.map(pair => pair.fruit);
        const sortedResults = allPairs.map(pair => pair.result);
        
        // Create all batch embeds with globally sorted fruits
        const batchEmbeds = [];
        for (let batch = 0; batch < 5; batch++) {
            const startIdx = batch * 10;
            const endIdx = startIdx + 10;
            const batchFruits = sortedFruits.slice(startIdx, endIdx);
            const batchResults = sortedResults.slice(startIdx, endIdx);
            
            const summaryData = SmoothSummonAnimator.create10xSummary(batchFruits, batchResults, newBalance, pityInfo, pityUsedInSession, batch + 1, 5);
            batchEmbeds.push(summaryData.embed);
        }
        
        // Create mega summary with sorted fruits
        const megaSummaryData = SmoothSummonAnimator.createMegaSummary(sortedFruits, sortedResults, newBalance, pityInfo, pityUsedInSession, 50);
        
        // Show first batch with navigation
        await this.showBatchNavigation(interaction, batchEmbeds, megaSummaryData.embed, 0);
    },

    async run100xSummon(interaction, newBalance, skipAnimation = false) {
        // Get initial pity for tracking
        let currentPity = await GachaService.getPityCount(interaction.user.id);
        
        const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
        
        // Perform ALL 100 pulls one by one
        const allResults = [];
        const allDisplayFruits = [];
        
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
            
            // Update pity for next pull
            currentPity = await GachaService.getPityCount(interaction.user.id);
            
            // Show animation based on skip_animation setting
            if (skipAnimation) {
                // Use simple rainbow animation - CONSTANTLY UPDATE
                await this.showSimpleLoadingAnimation(interaction, i + 1, 100);
                await new Promise(resolve => setTimeout(resolve, 30)); // Constant updates
            } else {
                // Smart animation for 100x - even more selective
                const isSpecialPull = ['legendary', 'mythical', 'divine'].includes(displayFruit.rarity);
                
                if (isSpecialPull) { // Only show full animation for legendary+ pulls
                    await runSmoothAnimation(interaction, displayFruit, result, i + 1, 100, currentPity);
                    await new Promise(resolve => setTimeout(resolve, 300));
                } else if (i % 20 === 19) { // Show quick flash every 20th pull
                    await this.showQuickFlash(interaction, displayFruit, result, i + 1, 100, currentPity);
                    await new Promise(resolve => setTimeout(resolve, 100));
                } else {
                    // Ultra quick update for most pulls
                    await this.showUltraQuickUpdate(interaction, i + 1, 100, currentPity);
                }
            }
            
            // Minimal delay for 100x
            const delay = skipAnimation ? 15 : ((['legendary', 'mythical', 'divine'].includes(displayFruit.rarity)) ? 150 : 50);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Get final pity info
        const pityInfo = await GachaService.getPityInfo(interaction.user.id);
        const pityUsedInSession = allResults.some(r => r.pityUsed);
        
        // GLOBAL SORT: Sort ALL fruits by rarity first, then distribute to batches
        const allPairs = allDisplayFruits.map((fruit, index) => ({
            fruit,
            result: allResults[index],
            originalIndex: index
        }));
        
        // Sort all fruits globally by rarity (highest first)
        const rarityPriority = {
            'divine': 7, 'mythical': 6, 'legendary': 5, 'epic': 4,
            'rare': 3, 'uncommon': 2, 'common': 1
        };
        
        allPairs.sort((a, b) => {
            const rarityA = rarityPriority[a.fruit.rarity] || 0;
            const rarityB = rarityPriority[b.fruit.rarity] || 0;
            
            if (rarityA !== rarityB) {
                return rarityB - rarityA; // Higher rarity first
            }
            
            return a.fruit.name.localeCompare(b.fruit.name); // Then alphabetical
        });
        
        // Now create sorted arrays
        const sortedFruits = allPairs.map(pair => pair.fruit);
        const sortedResults = allPairs.map(pair => pair.result);
        
        // Create all batch embeds with globally sorted fruits  
        const batchEmbeds = [];
        for (let batch = 0; batch < 10; batch++) {
            const startIdx = batch * 10;
            const endIdx = startIdx + 10;
            const batchFruits = sortedFruits.slice(startIdx, endIdx);
            const batchResults = sortedResults.slice(startIdx, endIdx);
            
            const summaryData = SmoothSummonAnimator.create10xSummary(batchFruits, batchResults, newBalance, pityInfo, pityUsedInSession, batch + 1, 10);
            batchEmbeds.push(summaryData.embed);
        }
        
        // Create mega summary with sorted fruits
        const megaSummaryData = SmoothSummonAnimator.createMegaSummary(sortedFruits, sortedResults, newBalance, pityInfo, pityUsedInSession, 100);
        
        // Show first batch with navigation
        await this.showBatchNavigation(interaction, batchEmbeds, megaSummaryData.embed, 0);
    },

    // New ultra quick update for 100x summons
    async showUltraQuickUpdate(interaction, currentPulls, totalPulls, currentPity) {
        const progressPercent = Math.floor((currentPulls / totalPulls) * 100);
        
        // Minimal pattern
        const frame = Math.floor(Date.now() / 150) % 4;
        const quickPattern = ['⚡', '✨', '💫', '🌟'][frame];
        
        const embed = new EmbedBuilder()
            .setTitle(`🍈 ${totalPulls}x Ultra Summoning - Rapid Scan`)
            .setDescription(
                `${quickPattern} **Ultra High-Speed Scanning...** ${quickPattern}\n\n` +
                `📊 **Progress:** ${progressPercent}% (${currentPulls}/${totalPulls})\n` +
                `🎯 **Pity:** ${currentPity}/1500\n` +
                `⚡ **Mode:** Ultra Speed`
            )
            .setColor(0x00FFFF)
            .setFooter({ text: `Ultra Scan ${currentPulls}/${totalPulls}` });
        
        try {
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            // Ignore rate limit errors
        }
    },

    // Enhanced quick flash animation
    async showQuickFlash(interaction, fruit, result, summonNumber, totalSummons, currentPity) {
        const raritySquare = SmoothSummonAnimator.getRaritySquare(fruit.rarity);
        const color = RARITY_COLORS[fruit.rarity];
        
        // Quick pattern flash
        const pattern = Array(20).fill(raritySquare).join(' ');
        
        const description = `⚡ **QUICK SCAN ${summonNumber}/${totalSummons}**\n\n${pattern}\n\n` +
            `🍃 **Found:** ${fruit.name}\n` +
            `⭐ **Rarity:** ${raritySquare} ${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)}\n` +
            `💪 **Multiplier:** x${fruit.multiplier}` +
            (result.pityUsed ? ' 🎯 **PITY!**' : '') + `\n\n` +
            `${pattern}`;
        
        const embed = new EmbedBuilder()
            .setTitle(`🍈 ${totalSummons}x Mega Summoning - Rapid Scan`)
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: `Quick Scan ${summonNumber}/${totalSummons} | Pity: ${currentPity}/1500` });
        
        await interaction.editReply({ embeds: [embed] });
    },

    async showSimpleLoadingAnimation(interaction, currentPulls, totalPulls) {
        const progressPercent = Math.floor((currentPulls / totalPulls) * 100);
        const currentPity = await GachaService.getPityCount(interaction.user.id);
        
        // Faster changing rainbow pattern - reduced frame calculation for better performance
        const frame = Math.floor(Date.now() / 200) % 7; // Changed from 300ms to 200ms
        const colors = ['🟧', '🟨', '🟩', '🟦', '🟪', '⬜', '🟥'];
        const pattern = [];
        
        // Optimized pattern generation
        const baseColor = colors[frame];
        for (let i = 0; i < 20; i++) {
            const colorIndex = (frame + Math.floor(i / 3)) % colors.length; // Less CPU intensive
            pattern.push(colors[colorIndex]);
        }
        
        const rainbowPattern = pattern.join(' ');
        const embedColor = {
            '🟧': 0xFF8000, '🟨': 0xFFFF00, '🟩': 0x00FF00,
            '🟦': 0x0080FF, '🟪': 0x800080, '⬜': 0xFFFFFF, '🟥': 0xFF0000
        }[baseColor] || 0x4A90E2;
        
        // Progress bar
        const progressBarLength = 20;
        const filledBars = Math.floor((currentPulls / totalPulls) * progressBarLength);
        const progressBar = '█'.repeat(filledBars) + '░'.repeat(progressBarLength - filledBars);
        
        const embed = new EmbedBuilder()
            .setTitle(`🍈 ${totalPulls}x Mega Summoning - High Speed Scan`)
            .setDescription(
                `🌊 **Rapid Devil Fruit Detection in Progress...**\n\n` +
                `${rainbowPattern}\n\n` +
                `📊 **Progress:** [${progressBar}] ${progressPercent}%\n` +
                `🎯 **Current Pity:** ${currentPity}/1500\n` +
                `⚡ **Scan Rate:** ${(currentPulls * 1000 / (Date.now() % 10000 + 1000)).toFixed(1)} pulls/sec\n` +
                `🔍 **Fruits Found:** ${currentPulls}/${totalPulls}\n\n` +
                `${rainbowPattern}`
            )
            .setColor(embedColor)
            .setFooter({ text: `High-Speed Scanning... ${currentPulls}/${totalPulls} | Pity: ${currentPity}/1500` })
            .setTimestamp();
        
        try {
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            // Ignore rate limit errors during animation
            if (error.code !== 10062 && error.code !== 50013) {
                console.log('Simple loading update error:', error.message);
            }
        }
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
        const summaryData = SmoothSummonAnimator.create10xSummary(fruits, results, newBalance, pityInfo, pityUsedInSession, batchNumber, totalBatches);
        
        // Check if we got a divine fruit for special animation
        if (summaryData.isDivine && totalBatches === 1) {
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
            const cost = PULL_COST * parseInt(count.replace('x', ''));
            const balance = await EconomyService.getBalance(userId);
            
            if (balance < cost) {
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
            
            // Acknowledge the button press and defer
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
