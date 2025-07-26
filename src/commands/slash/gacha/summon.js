// src/commands/slash/gacha/summon.js - COMPLETE Working File
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

    static getRaritySquare(rarity) {
        const raritySquares = {
            'common': '⬜',
            'uncommon': '🟩',
            'rare': '🟦',
            'epic': '🟪',
            'mythical': '🟧',
            'legendary': '🟨',
            'divine': '✨'
        };
        return raritySquares[rarity] || '⬜';
    }

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

    static createColorSpreadFrame(frame, fruit, rewardColor, rewardEmoji) {
        const barLength = 20;
        const center = 9.5;
        const spreadRadius = Math.floor(frame * 1.0);
        
        const bar = Array(barLength).fill('⬛');
        const rainbowSquares = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
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
        const progressSquares = '🟩'.repeat(Math.floor(frame / 2)) + '⬛'.repeat(6 - Math.floor(frame / 2));
        
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

    static createFinalReveal(fruit, result, newBalance) {
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

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Summoning Complete!')
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: '🏴‍☠️ Your legend grows on the Grand Line!' })
            .setTimestamp();
    }

    static createQuickFrame(frame, fruit, summonNumber) {
        const pattern = this.getRainbowPattern(frame, 15);
        const color = this.getRainbowColor(frame);
        const progressDots = '●'.repeat(frame + 1) + '○'.repeat(4 - frame);
        
        return new EmbedBuilder()
            .setTitle('🍈 10x Devil Fruit Summoning')
            .setDescription(`**Summon ${summonNumber}/10**\n\n🌊 Scanning the Grand Line...\n\n${pattern}\n\n📊 **Status:** Analyzing... ${progressDots}\n🍃 **Fruit:** ???\n⭐ **Rarity:** ???\n\n${pattern}`)
            .setColor(color)
            .setFooter({ text: `Summon ${summonNumber} of 10 - Searching...` });
    }

    static createQuickReveal(fruit, summonNumber) {
        const raritySquare = this.getRaritySquare(fruit.rarity);
        const color = RARITY_COLORS[fruit.rarity];
        const pattern = Array(15).fill(raritySquare).join(' ');
        
        const description = `**Summon ${summonNumber}/10** - ✨ **ACQUIRED!**\n\n${pattern}\n\n` +
            `📊 **Status:** ✨ New Discovery!\n` +
            `🍃 **Name:** ${fruit.name}\n` +
            `🔮 **Type:** ${fruit.type}\n` +
            `⭐ **Rarity:** ${raritySquare} ${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)}\n` +
            `💪 **CP Multiplier:** x${fruit.multiplier}\n` +
            `🎯 **Description:** ${fruit.description}\n` +
            `⚔️ **Ability:** ${fruit.skillName} (${fruit.skillDamage} DMG, ${fruit.skillCooldown}s CD)\n\n` +
            `${pattern}`;
        
        return new EmbedBuilder()
            .setTitle('🍈 10x Devil Fruit Summoning')
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: `Summon ${summonNumber} of 10 - ✨ Acquired!` });
    }

    static create10xSummary(fruits, results, balance) {
        let detailedResults = '';
        fruits.forEach((fruit, index) => {
            const raritySquare = this.getRaritySquare(fruit.rarity);
            const number = (index + 1).toString().padStart(2, '0');
            detailedResults += `**${number}.** ${raritySquare} **${fruit.name}** (${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)})\n`;
            detailedResults += `      📊 **Status:** ✨ New Discovery!\n`;
            detailedResults += `      🔮 **Type:** ${fruit.type}\n`;
            detailedResults += `      💪 **CP Multiplier:** x${fruit.multiplier}\n`;
            detailedResults += `      🎯 **Description:** ${fruit.description}\n`;
            detailedResults += `      ⚔️ **Ability:** ${fruit.skillName} (${fruit.skillDamage} DMG, ${fruit.skillCooldown}s CD)\n\n`;
        });

        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'mythical', 'legendary', 'divine'];
        let highestRarity = 'common';
        [...rarityOrder].reverse().forEach(rarity => {
            if (fruits.some(f => f.rarity === rarity) && highestRarity === 'common') {
                highestRarity = rarity;
            }
        });

        const highestColor = RARITY_COLORS[highestRarity];

        return new EmbedBuilder()
            .setTitle('🍈 10x Devil Fruit Summoning Complete!')
            .setDescription(`🎉 **Congratulations! You've summoned 10 magnificent Devil Fruits!** 🎉\n\n${detailedResults}💰 **Remaining Berries:** ${balance.toLocaleString()}\n\n✨ All fruits have been added to your collection!`)
            .setColor(highestColor)
            .setFooter({ text: '🏴‍☠️ Your legend grows on the Grand Line!' })
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
            const cost = summonCount === 10 ? PULL_COST * 10 * 0.9 : PULL_COST * summonCount;
            const balance = await EconomyService.getBalance(userId);
            
            if (balance < cost) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('❌ Insufficient Berries')
                            .setDescription(`You need **${cost.toLocaleString()}** berries but only have **${balance.toLocaleString()}** berries`)
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
        const results = await GachaService.performPulls(interaction.user.id, 1);
        const result = results[0];
        const fruit = result.fruit;
        
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
        
        await this.runFullAnimation(interaction, displayFruit, result, newBalance);
        await this.setupButtons(interaction);
    },

    async run10xSummon(interaction, newBalance) {
        const results = await GachaService.performPulls(interaction.user.id, 10);
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
        
        await this.run10xAnimation(interaction, displayFruits, results, newBalance);
        await this.setupButtons(interaction);
    },

    async runFullAnimation(interaction, fruit, result, newBalance) {
        await this.runRainbowPhase(interaction, fruit);
        await new Promise(resolve => setTimeout(resolve, 300));
        await this.runColorSpread(interaction, fruit);
        await new Promise(resolve => setTimeout(resolve, 400));
        await this.runTextReveal(interaction, fruit, result, newBalance);
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.showFinalReveal(interaction, fruit, result, newBalance);
    },

    async run10xAnimation(interaction, fruits, results, newBalance) {
        for (let i = 0; i < 10; i++) {
            const fruit = fruits[i];
            const summonNumber = i + 1;
            await this.runQuickAnimation(interaction, fruit, summonNumber);
            if (i < 9) await new Promise(resolve => setTimeout(resolve, 1000));
        }
        await this.show10xSummary(interaction, fruits, results, newBalance);
    },

    async runRainbowPhase(interaction, fruit) {
        for (let frame = 0; frame < ANIMATION_CONFIG.RAINBOW_FRAMES; frame++) {
            const embed = SummonAnimator.createRainbowFrame(frame, fruit);
            
            if (frame === 0 && !interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            if (frame < ANIMATION_CONFIG.RAINBOW_FRAMES - 1) {
                await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.RAINBOW_DELAY));
            }
        }
    },

    async runColorSpread(interaction, fruit) {
        const rewardColor = RARITY_COLORS[fruit.rarity];
        const rewardEmoji = RARITY_EMOJIS[fruit.rarity];
        
        for (let frame = 0; frame < ANIMATION_CONFIG.SPREAD_FRAMES; frame++) {
            const embed = SummonAnimator.createColorSpreadFrame(frame, fruit, rewardColor, rewardEmoji);
            await interaction.editReply({ embeds: [embed] });
            
            if (frame < ANIMATION_CONFIG.SPREAD_FRAMES - 1) {
                await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.SPREAD_DELAY));
            }
        }
    },

    async runTextReveal(interaction, fruit, result, newBalance) {
        const rewardColor = RARITY_COLORS[fruit.rarity];
        const rewardEmoji = RARITY_EMOJIS[fruit.rarity];
        
        for (let frame = 0; frame < ANIMATION_CONFIG.REVEAL_FRAMES; frame++) {
            const embed = SummonAnimator.createTextRevealFrame(frame, fruit, result, newBalance, rewardColor, rewardEmoji);
            await interaction.editReply({ embeds: [embed] });
            
            if (frame < ANIMATION_CONFIG.REVEAL_FRAMES - 1) {
                await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.REVEAL_DELAY));
            }
        }
    },

    async runQuickAnimation(interaction, fruit, summonNumber) {
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
        
        const revealEmbed = SummonAnimator.createQuickReveal(fruit, summonNumber);
        await interaction.editReply({ embeds: [revealEmbed] });
        
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
                    .setLabel('🍈 Summon 10x')
                    .setStyle(ButtonStyle.Success)
            );

        const currentReply = await interaction.fetchReply();
        const currentEmbed = currentReply.embeds[0];
        
        await interaction.editReply({
            embeds: [currentEmbed],
            components: [row]
        });

        const collector = currentReply.createMessageComponentCollector({ time: 300000 });
        collector.on('collect', async (buttonInteraction) => {
            await this.handleButtonInteraction(buttonInteraction, interaction.user.id);
        });
        collector.on('end', () => this.disableButtons(interaction));
    },

    async handleButtonInteraction(buttonInteraction, originalUserId) {
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
        const balance = await EconomyService.getBalance(buttonInteraction.user.id);
        
        if (balance < cost) {
            return buttonInteraction.reply({ 
                content: `💸 You need **${cost.toLocaleString()}** berries but only have **${balance.toLocaleString()}** berries!\n💡 Use \`/income\` to collect berries.`, 
                ephemeral: true 
            });
        }

        await EconomyService.deductBerries(buttonInteraction.user.id, cost, 'summon_again');
        const newBalance = balance - cost;

        await buttonInteraction.deferReply();
        await this.runSingleSummon(buttonInteraction, newBalance);
        await this.setupButtons(buttonInteraction);
    },

    async handleSummon10x(buttonInteraction) {
        const cost = PULL_COST * 10 * 0.9;
        const balance = await EconomyService.getBalance(buttonInteraction.user.id);
        
        if (balance < cost) {
            return buttonInteraction.reply({ 
                content: `💸 You need **${cost.toLocaleString()}** berries but only have **${balance.toLocaleString()}** berries!\n💡 Use \`/income\` to collect berries.`, 
                ephemeral: true 
            });
        }

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
