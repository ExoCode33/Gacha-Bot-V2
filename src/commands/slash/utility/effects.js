// src/commands/slash/utility/effects.js - Devil Fruit Effects Explorer
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { DevilFruitEffectManager, EFFECT_TYPES } = require('../../../data/DevilFruitEffects');
const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('effects')
        .setDescription('🌟 Explore Devil Fruit special effects and abilities')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all fruits with a specific effect type')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Effect type to search for')
                        .setRequired(true)
                        .addChoices(
                            { name: '🛡️ Immunity Effects', value: 'immunity' },
                            { name: '🌪️ Flight & Movement', value: 'flight' },
                            { name: '📡 Teleportation', value: 'teleport' },
                            { name: '🔄 Transformation', value: 'transformation' },
                            { name: '👻 Soul Manipulation', value: 'soul' },
                            { name: '🧠 Memory Control', value: 'memory' },
                            { name: '💖 Emotion Control', value: 'emotion' },
                            { name: '⏰ Time Manipulation', value: 'time' },
                            { name: '🌍 Gravity Control', value: 'gravity' },
                            { name: '🩹 Regeneration', value: 'regeneration' },
                            { name: '👤 Stealth & Invisibility', value: 'stealth' },
                            { name: '🔥 Status Effects', value: 'burn' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('detail')
                .setDescription('Get detailed information about a specific fruit\'s effects')
                .addStringOption(option =>
                    option.setName('fruit')
                        .setDescription('Name of the Devil Fruit (partial name works)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Search for effects by keywords')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Search term (e.g., "immunity", "fire", "control")')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('random')
                .setDescription('Get a random Devil Fruit effect to learn about')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('compare')
                .setDescription('Compare effects between two Devil Fruits')
                .addStringOption(option =>
                    option.setName('fruit1')
                        .setDescription('First Devil Fruit name')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('fruit2')
                        .setDescription('Second Devil Fruit name')
                        .setRequired(true)
                )
        ),
    
    category: 'utility',
    cooldown: 3,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            switch (subcommand) {
                case 'list':
                    await this.handleListEffects(interaction);
                    break;
                case 'detail':
                    await this.handleDetailEffect(interaction);
                    break;
                case 'search':
                    await this.handleSearchEffects(interaction);
                    break;
                case 'random':
                    await this.handleRandomEffect(interaction);
                    break;
                case 'compare':
                    await this.handleCompareEffects(interaction);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Unknown subcommand!',
                        ephemeral: true
                    });
            }
        } catch (error) {
            interaction.client.logger.error('Effects command error:', error);
            await interaction.reply({
                content: '❌ An error occurred while processing the effects command.',
                ephemeral: true
            });
        }
    },

    async handleListEffects(interaction) {
        const effectType = interaction.options.getString('type');
        const fruitsWithEffect = DevilFruitEffectManager.getEffectsByType(effectType);
        
        if (fruitsWithEffect.length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle(`🔍 No Fruits Found`)
                        .setDescription(`No Devil Fruits found with **${effectType}** effects.`)
                ],
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#4A90E2')
            .setTitle(`🌟 Devil Fruits with ${effectType.replace('_', ' ').toUpperCase()} Effects`)
            .setDescription(`Found **${fruitsWithEffect.length}** fruits with this effect type:`)
            .setTimestamp();
        
        // Group by rarity
        const byRarity = {};
        fruitsWithEffect.forEach(fruit => {
            if (!byRarity[fruit.rarity]) byRarity[fruit.rarity] = [];
            byRarity[fruit.rarity].push(fruit);
        });
        
        // Display by rarity (highest first)
        const rarityOrder = ['divine', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        
        rarityOrder.forEach(rarity => {
            if (byRarity[rarity]) {
                const fruits = byRarity[rarity];
                const rarityEmoji = RARITY_EMOJIS[rarity] || '⚪';
                const rarityName = rarity.charAt(0).toUpperCase() + rarity.slice(1);
                
                let fruitList = fruits.map(fruit => {
                    const powerStars = '★'.repeat(Math.min(fruit.power, 5));
                    return `• **${fruit.name}** ${powerStars}\n  *User: ${fruit.user || 'Unknown'}*`;
                }).join('\n');
                
                embed.addFields({
                    name: `${rarityEmoji} ${rarityName} (${fruits.length})`,
                    value: fruitList,
                    inline: false
                });
            }
        });
        
        embed.setFooter({ 
            text: `Use /effects detail <fruit_name> to see specific effect details • Power: ★☆☆☆☆ (1-5 scale)` 
        });
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleDetailEffect(interaction) {
        const fruitQuery = interaction.options.getString('fruit').toLowerCase();
        
        // Find matching fruit
        const matchingFruit = Object.entries(DEVIL_FRUITS).find(([id, fruit]) => 
            fruit.name.toLowerCase().includes(fruitQuery) ||
            id.toLowerCase().includes(fruitQuery)
        );
        
        if (!matchingFruit) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle('🔍 Fruit Not Found')
                        .setDescription(`No Devil Fruit found matching "**${fruitQuery}**".\n\nTry using part of the fruit name, like "gomu" for Gomu Gomu no Mi.`)
                ],
                ephemeral: true
            });
        }
        
        const [fruitId, fruitData] = matchingFruit;
        const effects = DevilFruitEffectManager.getEffects(fruitId);
        
        const rarityEmoji = RARITY_EMOJIS[fruitData.rarity] || '⚪';
        const rarityColor = RARITY_COLORS[fruitData.rarity] || RARITY_COLORS.common;
        
        const embed = new EmbedBuilder()
            .setColor(rarityColor)
            .setTitle(`${rarityEmoji} ${fruitData.name}`)
            .setDescription(`**Type:** ${fruitData.type}\n**Rarity:** ${fruitData.rarity.charAt(0).toUpperCase() + fruitData.rarity.slice(1)}\n**User:** ${fruitData.user || 'Unknown'}\n**Element:** ${fruitData.element || 'None'}`)
            .setTimestamp();
        
        if (!effects) {
            embed.addFields({
                name: '📝 Basic Information',
                value: `**Description:** ${fruitData.description || fruitData.power}\n**CP Multiplier:** x${fruitData.multiplier}`,
                inline: false
            });
            
            embed.addFields({
                name: '⚠️ Special Effects',
                value: 'No documented special effects for this fruit yet. This fruit may have undiscovered abilities!',
                inline: false
            });
        } else {
            // Format detailed effects
            const effectsDisplay = DevilFruitEffectManager.formatEffectsForDisplay(fruitId);
            
            // Split into multiple fields if too long
            const maxFieldLength = 1024;
            if (effectsDisplay.length <= maxFieldLength) {
                embed.addFields({
                    name: '✨ Special Effects & Abilities',
                    value: effectsDisplay,
                    inline: false
                });
            } else {
                // Split effects into multiple fields
                const sections = effectsDisplay.split('\n\n');
                let currentField = '';
                let fieldCount = 1;
                
                sections.forEach(section => {
                    if ((currentField + section).length > maxFieldLength) {
                        if (currentField) {
                            embed.addFields({
                                name: fieldCount === 1 ? '✨ Special Effects & Abilities' : `✨ Effects (continued ${fieldCount})`,
                                value: currentField.trim(),
                                inline: false
                            });
                            fieldCount++;
                        }
                        currentField = section + '\n\n';
                    } else {
                        currentField += section + '\n\n';
                    }
                });
                
                if (currentField.trim()) {
                    embed.addFields({
                        name: fieldCount === 1 ? '✨ Special Effects & Abilities' : `✨ Effects (continued ${fieldCount})`,
                        value: currentField.trim(),
                        inline: false
                    });
                }
            }
            
            // Add power level summary
            const allEffects = [
                ...(effects.primary_effects || []),
                ...(effects.passive_effects || []),
                ...(effects.awakened_effects || [])
            ];
            
            if (allEffects.length > 0) {
                const avgPower = allEffects.reduce((sum, e) => sum + (e.power_level || 1), 0) / allEffects.length;
                const powerStars = '★'.repeat(Math.min(Math.round(avgPower), 5)) + '☆'.repeat(5 - Math.min(Math.round(avgPower), 5));
                
                embed.addFields({
                    name: '⚡ Power Assessment',
                    value: `**Effect Count:** ${allEffects.length}\n**Average Power:** ${powerStars} (${avgPower.toFixed(1)}/5.0)\n**CP Multiplier:** x${fruitData.multiplier}`,
                    inline: true
                });
            }
        }
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleSearchEffects(interaction) {
        const query = interaction.options.getString('query');
        const results = DevilFruitEffectManager.searchEffects(query);
        
        if (results.length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle('🔍 No Results Found')
                        .setDescription(`No effects found matching "**${query}**".\n\nTry searching for terms like: immunity, fire, control, teleport, transformation, etc.`)
                ],
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#4A90E2')
            .setTitle(`🔍 Search Results for "${query}"`)
            .setDescription(`Found **${results.length}** fruits with matching effects:`)
            .setTimestamp();
        
        results.slice(0, 10).forEach(result => { // Limit to 10 results
            const rarityEmoji = RARITY_EMOJIS[result.rarity] || '⚪';
            const matchingEffectsText = result.matchingEffects
                .map(effect => `• **${effect.name}**: ${effect.description.substring(0, 100)}${effect.description.length > 100 ? '...' : ''}`)
                .join('\n');
            
            embed.addFields({
                name: `${rarityEmoji} ${result.name}`,
                value: `*User: ${result.user || 'Unknown'}*\n${matchingEffectsText}`,
                inline: false
            });
        });
        
        if (results.length > 10) {
            embed.setFooter({ text: `Showing first 10 of ${results.length} results. Be more specific to narrow down.` });
        }
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleRandomEffect(interaction) {
        const randomEffect = DevilFruitEffectManager.getRandomEffect();
        
        if (!randomEffect) {
            return interaction.reply({
                content: '❌ No effects found in the database!',
                ephemeral: true
            });
        }
        
        const fruitData = DEVIL_FRUITS[randomEffect.fruitId];
        const rarityEmoji = RARITY_EMOJIS[fruitData.rarity] || '⚪';
        const rarityColor = RARITY_COLORS[fruitData.rarity] || RARITY_COLORS.common;
        
        const embed = new EmbedBuilder()
            .setColor(rarityColor)
            .setTitle(`🎲 Random Devil Fruit Effect`)
            .setDescription(`${rarityEmoji} **${randomEffect.fruitName}**\n*User: ${randomEffect.fruitUser || 'Unknown'}*`)
            .addFields({
                name: `✨ ${randomEffect.effect.name}`,
                value: randomEffect.effect.description,
                inline: false
            })
            .setFooter({ text: 'Use /effects detail to learn more about this fruit!' })
            .setTimestamp();
        
        if (randomEffect.effect.power_level) {
            const powerStars = '★'.repeat(Math.min(randomEffect.effect.power_level, 5));
            embed.addFields({
                name: '⚡ Power Level',
                value: `${powerStars} (${randomEffect.effect.power_level}/5)`,
                inline: true
            });
        }
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleCompareEffects(interaction) {
        const fruit1Query = interaction.options.getString('fruit1').toLowerCase();
        const fruit2Query = interaction.options.getString('fruit2').toLowerCase();
        
        // Find both fruits
        const fruit1Match = Object.entries(DEVIL_FRUITS).find(([id, fruit]) => 
            fruit.name.toLowerCase().includes(fruit1Query) || id.toLowerCase().includes(fruit1Query)
        );
        
        const fruit2Match = Object.entries(DEVIL_FRUITS).find(([id, fruit]) => 
            fruit.name.toLowerCase().includes(fruit2Query) || id.toLowerCase().includes(fruit2Query)
        );
        
        if (!fruit1Match || !fruit2Match) {
            const missing = [];
            if (!fruit1Match) missing.push(fruit1Query);
            if (!fruit2Match) missing.push(fruit2Query);
            
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle('🔍 Fruit(s) Not Found')
                        .setDescription(`Could not find: **${missing.join(', ')}**\n\nTry using part of the fruit name.`)
                ],
                ephemeral: true
            });
        }
        
        const [fruit1Id, fruit1Data] = fruit1Match;
        const [fruit2Id, fruit2Data] = fruit2Match;
        
        const effects1 = DevilFruitEffectManager.getEffects(fruit1Id);
        const effects2 = DevilFruitEffectManager.getEffects(fruit2Id);
        
        const embed = new EmbedBuilder()
            .setColor('#4A90E2')
            .setTitle('⚔️ Devil Fruit Effects Comparison')
            .setDescription('Comparing special effects and abilities')
            .setTimestamp();
        
        // Fruit 1 info
        const rarityEmoji1 = RARITY_EMOJIS[fruit1Data.rarity] || '⚪';
        let fruit1Info = `${rarityEmoji1} **${fruit1Data.name}**\n*${fruit1Data.rarity} • ${fruit1Data.type}*\n*User: ${fruit1Data.user || 'Unknown'}*\n`;
        
        if (effects1?.primary_effects?.length) {
            fruit1Info += `\n**Effects (${effects1.primary_effects.length}):**\n`;
            fruit1Info += effects1.primary_effects.slice(0, 3).map(e => `• ${e.name}`).join('\n');
            if (effects1.primary_effects.length > 3) fruit1Info += `\n• ...and ${effects1.primary_effects.length - 3} more`;
        } else {
            fruit1Info += '\n**Effects:** No documented special effects';
        }
        
        // Fruit 2 info
        const rarityEmoji2 = RARITY_EMOJIS[fruit2Data.rarity] || '⚪';
        let fruit2Info = `${rarityEmoji2} **${fruit2Data.name}**\n*${fruit2Data.rarity} • ${fruit2Data.type}*\n*User: ${fruit2Data.user || 'Unknown'}*\n`;
        
        if (effects2?.primary_effects?.length) {
            fruit2Info += `\n**Effects (${effects2.primary_effects.length}):**\n`;
            fruit2Info += effects2.primary_effects.slice(0, 3).map(e => `• ${e.name}`).join('\n');
            if (effects2.primary_effects.length > 3) fruit2Info += `\n• ...and ${effects2.primary_effects.length - 3} more`;
        } else {
            fruit2Info += '\n**Effects:** No documented special effects';
        }
        
        embed.addFields(
            {
                name: '🔵 First Fruit',
                value: fruit1Info,
                inline: true
            },
            {
                name: '🔴 Second Fruit',
                value: fruit2Info,
                inline: true
            }
        );
        
        // Comparison analysis
        let comparisonText = '';
        
        // Compare effect counts
        const count1 = (effects1?.primary_effects?.length || 0) + (effects1?.passive_effects?.length || 0);
        const count2 = (effects2?.primary_effects?.length || 0) + (effects2?.passive_effects?.length || 0);
        
        if (count1 > count2) {
            comparisonText += `🔵 **${fruit1Data.name}** has more documented effects (${count1} vs ${count2})\n`;
        } else if (count2 > count1) {
            comparisonText += `🔴 **${fruit2Data.name}** has more documented effects (${count2} vs ${count1})\n`;
        } else {
            comparisonText += `⚖️ Both fruits have equal effect counts (${count1} each)\n`;
        }
        
        // Compare power levels
        const avgPower1 = effects1 ? 
            [...(effects1.primary_effects || []), ...(effects1.passive_effects || [])]
                .reduce((sum, e) => sum + (e.power_level || 1), 0) / Math.max(count1, 1) : 0;
        const avgPower2 = effects2 ? 
            [...(effects2.primary_effects || []), ...(effects2.passive_effects || [])]
                .reduce((sum, e) => sum + (e.power_level || 1), 0) / Math.max(count2, 1) : 0;
        
        if (avgPower1 > avgPower2) {
            comparisonText += `🔵 **${fruit1Data.name}** has higher average power (${avgPower1.toFixed(1)} vs ${avgPower2.toFixed(1)})\n`;
        } else if (avgPower2 > avgPower1) {
            comparisonText += `🔴 **${fruit2Data.name}** has higher average power (${avgPower2.toFixed(1)} vs ${avgPower1.toFixed(1)})\n`;
        } else {
            comparisonText += `⚖️ Both fruits have similar power levels (${avgPower1.toFixed(1)})\n`;
        }
        
        // Compare rarity
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'divine'];
        const rarity1Index = rarityOrder.indexOf(fruit1Data.rarity);
        const rarity2Index = rarityOrder.indexOf(fruit2Data.rarity);
        
        if (rarity1Index > rarity2Index) {
            comparisonText += `🔵 **${fruit1Data.name}** is rarer (${fruit1Data.rarity} vs ${fruit2Data.rarity})\n`;
        } else if (rarity2Index > rarity1Index) {
            comparisonText += `🔴 **${fruit2Data.name}** is rarer (${fruit2Data.rarity} vs ${fruit1Data.rarity})\n`;
        } else {
            comparisonText += `⚖️ Both fruits have the same rarity (${fruit1Data.rarity})\n`;
        }
        
        // Compare CP multipliers
        if (fruit1Data.multiplier > fruit2Data.multiplier) {
            comparisonText += `🔵 **${fruit1Data.name}** has higher CP multiplier (x${fruit1Data.multiplier} vs x${fruit2Data.multiplier})\n`;
        } else if (fruit2Data.multiplier > fruit1Data.multiplier) {
            comparisonText += `🔴 **${fruit2Data.name}** has higher CP multiplier (x${fruit2Data.multiplier} vs x${fruit1Data.multiplier})\n`;
        } else {
            comparisonText += `⚖️ Both fruits have the same CP multiplier (x${fruit1Data.multiplier})\n`;
        }
        
        // Find shared effect types
        const types1 = new Set();
        const types2 = new Set();
        
        if (effects1) {
            [...(effects1.primary_effects || []), ...(effects1.passive_effects || [])]
                .forEach(e => types1.add(e.type));
        }
        if (effects2) {
            [...(effects2.primary_effects || []), ...(effects2.passive_effects || [])]
                .forEach(e => types2.add(e.type));
        }
        
        const sharedTypes = [...types1].filter(type => types2.has(type));
        if (sharedTypes.length > 0) {
            comparisonText += `\n🤝 **Shared Effect Types:** ${sharedTypes.map(t => t.replace('_', ' ')).join(', ')}`;
        }
        
        embed.addFields({
            name: '📊 Comparison Analysis',
            value: comparisonText || 'No comparison data available.',
            inline: false
        });
        
        // Add bottom line recommendation
        let recommendation = '';
        if (count1 > count2 && avgPower1 > avgPower2) {
            recommendation = `🏆 **${fruit1Data.name}** appears more versatile with both more effects and higher power.`;
        } else if (count2 > count1 && avgPower2 > avgPower1) {
            recommendation = `🏆 **${fruit2Data.name}** appears more versatile with both more effects and higher power.`;
        } else if (rarity1Index > rarity2Index) {
            recommendation = `👑 **${fruit1Data.name}** is the rarer fruit, potentially making it more valuable.`;
        } else if (rarity2Index > rarity1Index) {
            recommendation = `👑 **${fruit2Data.name}** is the rarer fruit, potentially making it more valuable.`;
        } else {
            recommendation = `⚖️ Both fruits have unique strengths - choice depends on playstyle preference!`;
        }
        
        embed.addFields({
            name: '🎯 Recommendation',
            value: recommendation,
            inline: false
        });
        
        embed.setFooter({ text: 'Use /effects detail <fruit_name> for complete effect breakdowns' });
        
        await interaction.reply({ embeds: [embed] });
    }
};
