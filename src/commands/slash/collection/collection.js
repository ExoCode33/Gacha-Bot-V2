// src/commands/slash/collection/collection.js - Enhanced with Special Effects Display
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const { DEVIL_FRUITS } = require('../../../data/DevilFruits');
const { DevilFruitEffectManager } = require('../../../data/DevilFruitEffects');
const { RARITY_COLORS, RARITY_EMOJIS, PAGINATION } = require('../../../data/Constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collection')
        .setDescription('📚 View your Devil Fruit collection with special effects')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('View another user\'s collection')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('rarity')
                .setDescription('Filter by rarity')
                .setRequired(false)
                .addChoices(
                    { name: 'Common', value: 'common' },
                    { name: 'Uncommon', value: 'uncommon' },
                    { name: 'Rare', value: 'rare' },
                    { name: 'Epic', value: 'epic' },
                    { name: 'Legendary', value: 'legendary' },
                    { name: 'Mythical', value: 'mythical' },
                    { name: 'Divine', value: 'divine' }
                )
        )
        .addStringOption(option =>
            option.setName('effect')
                .setDescription('Filter by special effect type')
                .setRequired(false)
                .addChoices(
                    { name: 'Flight', value: 'flight' },
                    { name: 'Immunity', value: 'immunity' },
                    { name: 'Teleportation', value: 'teleport' },
                    { name: 'Transformation', value: 'transformation' },
                    { name: 'Soul Manipulation', value: 'soul' },
                    { name: 'Time Control', value: 'time' },
                    { name: 'Memory Control', value: 'memory' },
                    { name: 'Elemental', value: 'elemental' }
                )
        )
        .addBooleanOption(option =>
            option.setName('show_effects')
                .setDescription('Show detailed special effects for each fruit')
                .setRequired(false)
        ),
    
    category: 'collection',
    cooldown: 3,
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const rarityFilter = interaction.options.getString('rarity');
        const effectFilter = interaction.options.getString('effect');
        const showEffects = interaction.options.getBoolean('show_effects') || false;
        const userId = targetUser.id;
        
        try {
            // Get user's devil fruits
            let fruits = await DatabaseManager.getUserDevilFruits(userId);
            
            if (!fruits || fruits.length === 0) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF6B6B')
                            .setTitle(`📚 ${targetUser.username}'s Collection`)
                            .setDescription('No Devil Fruits found! Use `/summon` to start collecting.')
                            .setThumbnail(targetUser.displayAvatarURL())
                    ],
                    ephemeral: true
                });
            }
            
            // Filter by rarity if specified
            if (rarityFilter) {
                fruits = fruits.filter(fruit => fruit.fruit_rarity === rarityFilter);
            }
            
            // Filter by effect if specified
            if (effectFilter) {
                fruits = fruits.filter(fruit => {
                    const fruitId = fruit.fruit_id;
                    return DevilFruitEffectManager.hasEffect(fruitId, effectFilter);
                });
            }
            
            if (fruits.length === 0) {
                const filterDesc = rarityFilter && effectFilter ? 
                    `No ${rarityFilter} fruits with ${effectFilter} effects found!` :
                    rarityFilter ? `No ${rarityFilter} Devil Fruits found!` :
                    effectFilter ? `No fruits with ${effectFilter} effects found!` :
                    'No Devil Fruits found!';
                
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF6B6B')
                            .setTitle(`📚 ${targetUser.username}'s Filtered Collection`)
                            .setDescription(filterDesc)
                            .setThumbnail(targetUser.displayAvatarURL())
                    ],
                    ephemeral: true
                });
            }
            
            // Group fruits by unique ID and count duplicates
            const fruitGroups = {};
            fruits.forEach(fruit => {
                const key = fruit.fruit_id;
                if (!fruitGroups[key]) {
                    fruitGroups[key] = {
                        ...fruit,
                        count: 0
                    };
                }
                fruitGroups[key].count++;
            });
            
            const uniqueFruits = Object.values(fruitGroups);
            
            // Sort by rarity and name
            const rarityOrder = ['divine', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
            uniqueFruits.sort((a, b) => {
                const rarityA = rarityOrder.indexOf(a.fruit_rarity);
                const rarityB = rarityOrder.indexOf(b.fruit_rarity);
                
                if (rarityA !== rarityB) {
                    return rarityA - rarityB;
                }
                
                return a.fruit_name.localeCompare(b.fruit_name);
            });
            
            // Pagination
            const itemsPerPage = showEffects ? 3 : PAGINATION.ITEMS_PER_PAGE; // Fewer items if showing effects
            const totalPages = Math.ceil(uniqueFruits.length / itemsPerPage);
            let currentPage = 1;
            
            const generateEmbed = (page) => {
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const pageFruits = uniqueFruits.slice(start, end);
                
                let title = `📚 ${targetUser.username}'s Devil Fruit Collection`;
                if (rarityFilter || effectFilter) {
                    const filters = [];
                    if (rarityFilter) filters.push(rarityFilter.charAt(0).toUpperCase() + rarityFilter.slice(1));
                    if (effectFilter) filters.push(`${effectFilter} Effects`);
                    title += ` (${filters.join(' + ')})`;
                }
                
                const embed = new EmbedBuilder()
                    .setColor('#4A90E2')
                    .setTitle(title)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setFooter({ 
                        text: `Page ${page}/${totalPages} • ${uniqueFruits.length} unique fruits • ${fruits.length} total` 
                    })
                    .setTimestamp();
                
                // Add collection summary
                const rarityCounts = {};
                const effectCounts = {};
                
                uniqueFruits.forEach(fruit => {
                    // Count rarities
                    rarityCounts[fruit.fruit_rarity] = (rarityCounts[fruit.fruit_rarity] || 0) + 1;
                    
                    // Count effects
                    const effects = DevilFruitEffectManager.getEffects(fruit.fruit_id);
                    if (effects) {
                        const allEffects = [
                            ...(effects.primary_effects || []),
                            ...(effects.passive_effects || [])
                        ];
                        allEffects.forEach(effect => {
                            effectCounts[effect.type] = (effectCounts[effect.type] || 0) + 1;
                        });
                    }
                });
                
                let summaryText = '';
                rarityOrder.forEach(rarity => {
                    if (rarityCounts[rarity]) {
                        const emoji = RARITY_EMOJIS[rarity] || '⚪';
                        summaryText += `${emoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}: ${rarityCounts[rarity]}\n`;
                    }
                });
                
                if (summaryText) {
                    embed.addFields({
                        name: '📊 Collection Summary',
                        value: summaryText,
                        inline: true
                    });
                }
                
                // Add top effects summary
                const topEffects = Object.entries(effectCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                
                if (topEffects.length > 0) {
                    const effectsText = topEffects
                        .map(([effect, count]) => `• ${effect.replace('_', ' ')}: ${count}`)
                        .join('\n');
                    
                    embed.addFields({
                        name: '⚡ Top Effects',
                        value: effectsText,
                        inline: true
                    });
                }
                
                // Add fruits for this page
                pageFruits.forEach((fruit, index) => {
                    // Get actual fruit data for skill information
                    const actualFruit = Object.values(DEVIL_FRUITS).find(f => 
                        f.name === fruit.fruit_name || f.id === fruit.fruit_id
                    );
                    
                    const rarityEmoji = RARITY_EMOJIS[fruit.fruit_rarity] || '⚪';
                    const multiplier = (fruit.base_cp / 100).toFixed(1);
                    const countText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    // Get special effects
                    const effects = DevilFruitEffectManager.getEffects(fruit.fruit_id);
                    const hasEffects = !!effects;
                    
                    // Basic fruit info
                    let fieldValue = 
                        `**Type:** ${fruit.fruit_type}\n` +
                        `**CP Multiplier:** x${multiplier}\n` +
                        `**User:** ${actualFruit?.user || 'Unknown'}\n` +
                        `**Total CP:** ${fruit.total_cp?.toLocaleString() || 'N/A'}`;
                    
                    // Add effects if enabled and available
                    if (showEffects && hasEffects) {
                        fieldValue += `\n\n🌟 **Special Effects:**\n`;
                        
                        // Primary effects
                        if (effects.primary_effects?.length) {
                            effects.primary_effects.forEach(effect => {
                                const powerStars = '★'.repeat(Math.min(effect.power_level || 1, 5));
                                fieldValue += `• **${effect.name}** ${powerStars}\n`;
                                fieldValue += `  ${effect.description}\n`;
                            });
                        }
                        
                        // Ultimate ability
                        if (effects.ultimate_ability || effects.ultimate_technique) {
                            const ultimate = effects.ultimate_ability || effects.ultimate_technique;
                            fieldValue += `\n💥 **Ultimate:** ${ultimate.name}\n`;
                        }
                        
                        // Limitations
                        if (effects.limitations?.length) {
                            fieldValue += `\n⚠️ **Weaknesses:** ${effects.limitations.slice(0, 2).join(', ')}`;
                        }
                    } else if (!showEffects && hasEffects) {
                        // Just show that effects exist
                        const effectCount = (effects.primary_effects?.length || 0) + 
                                          (effects.passive_effects?.length || 0);
                        fieldValue += `\n✨ **Special Effects:** ${effectCount} documented`;
                    }
                    
                    // Add description
                    fieldValue += `\n\n**Description:** ${fruit.fruit_description || actualFruit?.description || 'A mysterious Devil Fruit power'}`;
                    
                    embed.addFields({
                        name: `${rarityEmoji} ${fruit.fruit_name}${countText}`,
                        value: fieldValue,
                        inline: false
                    });
                });
                
                return embed;
            };
            
            const embed = generateEmbed(currentPage);
            
            // Add navigation buttons if multiple pages
            if (totalPages > 1) {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('collection_first')
                            .setLabel('⏮️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === 1),
                        new ButtonBuilder()
                            .setCustomId('collection_prev')
                            .setLabel('⬅️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === 1),
                        new ButtonBuilder()
                            .setCustomId('collection_effects')
                            .setLabel(showEffects ? '📋 Hide Effects' : '⚡ Show Effects')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('collection_next')
                            .setLabel('➡️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === totalPages),
                        new ButtonBuilder()
                            .setCustomId('collection_last')
                            .setLabel('⏭️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === totalPages)
                    );
                
                await interaction.reply({ embeds: [embed], components: [row] });
                
                // Setup collector for pagination
                const message = await interaction.fetchReply();
                const collector = message.createMessageComponentCollector({ time: 300000 });
                
                collector.on('collect', async (buttonInteraction) => {
                    if (buttonInteraction.user.id !== interaction.user.id) {
                        return buttonInteraction.reply({
                            content: '❌ You can only navigate your own collection view!',
                            ephemeral: true
                        });
                    }
                    
                    let needsUpdate = false;
                    
                    switch (buttonInteraction.customId) {
                        case 'collection_first':
                            currentPage = 1;
                            needsUpdate = true;
                            break;
                        case 'collection_prev':
                            currentPage = Math.max(1, currentPage - 1);
                            needsUpdate = true;
                            break;
                        case 'collection_effects':
                            // Toggle effects display and regenerate
                            showEffects = !showEffects;
                            const newItemsPerPage = showEffects ? 3 : PAGINATION.ITEMS_PER_PAGE;
                            const newTotalPages = Math.ceil(uniqueFruits.length / newItemsPerPage);
                            
                            // Adjust current page if needed
                            currentPage = Math.min(currentPage, newTotalPages);
                            needsUpdate = true;
                            break;
                        case 'collection_next':
                            currentPage = Math.min(totalPages, currentPage + 1);
                            needsUpdate = true;
                            break;
                        case 'collection_last':
                            currentPage = totalPages;
                            needsUpdate = true;
                            break;
                    }
                    
                    if (needsUpdate) {
                        // Recalculate pages if effects toggled
                        const newItemsPerPage = showEffects ? 3 : PAGINATION.ITEMS_PER_PAGE;
                        const newTotalPages = Math.ceil(uniqueFruits.length / newItemsPerPage);
                        
                        const newEmbed = generateEmbed(currentPage);
                        const newRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('collection_first')
                                    .setLabel('⏮️')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(currentPage === 1),
                                new ButtonBuilder()
                                    .setCustomId('collection_prev')
                                    .setLabel('⬅️')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(currentPage === 1),
                                new ButtonBuilder()
                                    .setCustomId('collection_effects')
                                    .setLabel(showEffects ? '📋 Hide Effects' : '⚡ Show Effects')
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId('collection_next')
                                    .setLabel('➡️')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(currentPage === newTotalPages),
                                new ButtonBuilder()
                                    .setCustomId('collection_last')
                                    .setLabel('⏭️')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(currentPage === newTotalPages)
                            );
                        
                        await buttonInteraction.update({ embeds: [newEmbed], components: [newRow] });
                    }
                });
                
                collector.on('end', () => {
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('collection_first_disabled')
                                .setLabel('⏮️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('collection_prev_disabled')
                                .setLabel('⬅️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('collection_effects_disabled')
                                .setLabel('⚡ Effects')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('collection_next_disabled')
                                .setLabel('➡️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('collection_last_disabled')
                                .setLabel('⏭️')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        );
                    
                    interaction.editReply({ components: [disabledRow] }).catch(() => {});
                });
                
            } else {
                // Single page - still add effects toggle
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('collection_effects')
                            .setLabel(showEffects ? '📋 Hide Effects' : '⚡ Show Effects')
                            .setStyle(ButtonStyle.Primary)
                    );
                
                await interaction.reply({ embeds: [embed], components: [row] });
                
                // Setup collector for effects toggle
                const message = await interaction.fetchReply();
                const collector = message.createMessageComponentCollector({ time: 300000 });
                
                collector.on('collect', async (buttonInteraction) => {
                    if (buttonInteraction.user.id !== interaction.user.id) {
                        return buttonInteraction.reply({
                            content: '❌ You can only toggle your own collection view!',
                            ephemeral: true
                        });
                    }
                    
                    if (buttonInteraction.customId === 'collection_effects') {
                        showEffects = !showEffects;
                        const newEmbed = generateEmbed(1);
                        const newRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('collection_effects')
                                    .setLabel(showEffects ? '📋 Hide Effects' : '⚡ Show Effects')
                                    .setStyle(ButtonStyle.Primary)
                            );
                        
                        await buttonInteraction.update({ embeds: [newEmbed], components: [newRow] });
                    }
                });
                
                collector.on('end', () => {
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('collection_effects_disabled')
                                .setLabel('⚡ Effects')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true)
                        );
                    
                    interaction.editReply({ components: [disabledRow] }).catch(() => {});
                });
            }
            
        } catch (error) {
            interaction.client.logger.error('Collection command error:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching the collection.',
                ephemeral: true
            });
        }
    }
};
