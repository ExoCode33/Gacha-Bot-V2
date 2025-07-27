// src/utils/GachaRevealUtils.js - Complete Enhanced Gacha Reveal System
const { EmbedBuilder } = require('discord.js');
const { skillsManager } = require('../data/DevilFruitSkills');
const { DEVIL_FRUITS } = require('../data/DevilFruits');
const { RARITY_EMOJIS, RARITY_COLORS } = require('../data/Constants');

/**
 * Create enhanced gacha reveal embed with users and real skills
 * @param {Array} results - Array of pull results
 * @param {number} batchNumber - Current batch number
 * @param {number} totalBatches - Total number of batches
 * @returns {EmbedBuilder} Enhanced embed with skill details
 */
function createEnhancedGachaReveal(results, batchNumber, totalBatches) {
    const embed = new EmbedBuilder()
        .setTitle(`🍈 Devil Fruit Batch ${batchNumber}/${totalBatches} Complete!`)
        .setColor(RARITY_COLORS.legendary)
        .setDescription(`🎉 **Batch ${batchNumber} Results:** 🎉`)
        .setTimestamp();

    results.forEach((result, index) => {
        const { fruit, isNew } = result;
        const fruitData = DEVIL_FRUITS[fruit.id];
        
        if (!fruitData) {
            console.error(`Fruit data not found for ID: ${fruit.id}`);
            return;
        }

        // Get skill data from the new skills system
        const skillData = skillsManager.getSkillData(fruit.id, fruit.rarity);
        
        // Format skill info
        let skillInfo = "Unknown Ability (50 DMG, 2s CD)"; // Fallback
        if (skillData) {
            const cost = skillData.cost ? ` | ${skillData.cost} Energy` : '';
            skillInfo = `${skillData.name} (${skillData.damage} DMG, ${skillData.cooldown}s CD${cost})`;
        }

        // Get user from fruit data
        const user = fruitData.user || "Unknown User";

        // Status emoji and text
        const statusEmoji = isNew ? '🆕' : '🔄';
        const statusText = isNew ? 'New!' : `Total Owned: ${fruit.count || 1}`;

        // Rarity emoji and name
        const rarityEmoji = RARITY_EMOJIS[fruit.rarity] || '⚪';
        const rarityName = fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1);

        // Build field value with enhanced formatting
        const fieldValue = [
            `${statusEmoji} **Status:** ${statusText}`,
            `🧬 **Type:** ${fruitData.type}`,
            `⚡ **CP Multiplier:** x${fruitData.multiplier}`,
            `👤 **User:** ${user}`,
            `📝 **Description:** ${fruitData.description}`,
            `⚔️ **Ability:** ${skillInfo}`
        ].join('\n');

        // Add field to embed
        embed.addFields({
            name: `${String(index + 1).padStart(2, '0')}. ${rarityEmoji} ${fruitData.name} (${rarityName})`,
            value: fieldValue,
            inline: false
        });
    });

    return embed;
}

/**
 * Enhanced batch reveal with skill details
 * @param {Interaction} interaction - Discord interaction object
 * @param {Array} allResults - All pull results
 * @returns {Array} Array of embed objects
 */
async function createEnhancedBatchReveal(interaction, allResults) {
    const batchSize = 5; // Show 5 fruits per batch
    const batches = [];
    
    // Split results into batches
    for (let i = 0; i < allResults.length; i += batchSize) {
        batches.push(allResults.slice(i, i + batchSize));
    }

    const embeds = [];
    const totalBatches = batches.length;

    // Create embed for each batch
    for (let i = 0; i < batches.length; i++) {
        const batchResults = batches[i];
        const batchNumber = i + 1;
        
        const embed = createEnhancedGachaReveal(batchResults, batchNumber, totalBatches);
        embeds.push(embed);
    }

    // Send first batch immediately
    if (embeds.length > 0) {
        await interaction.editReply({ embeds: [embeds[0]] });
        
        // Send remaining batches with delay
        for (let i = 1; i < embeds.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
            await interaction.followUp({ embeds: [embeds[i]] });
        }
    }

    return embeds;
}

/**
 * Create summary embed after all batches
 * @param {Array} allResults - All pull results
 * @param {Object} userStats - User statistics
 * @returns {EmbedBuilder} Summary embed
 */
function createSummaryEmbed(allResults, userStats) {
    const rarityCount = {};
    let totalCP = 0;
    let newFruits = 0;

    // Count rarities and calculate stats
    allResults.forEach(result => {
        const rarity = result.fruit.rarity;
        rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
        
        const fruitData = DEVIL_FRUITS[result.fruit.id];
        if (fruitData) {
            totalCP += Math.floor(fruitData.multiplier * 100); // Estimated CP
        }
        
        if (result.isNew) newFruits++;
    });

    // Build rarity summary
    const raritySummary = Object.entries(rarityCount)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .map(([rarity, count]) => {
            const emoji = RARITY_EMOJIS[rarity] || '⚪';
            const name = rarity.charAt(0).toUpperCase() + rarity.slice(1);
            return `${emoji} ${name}: ${count}`;
        })
        .join('\n');

    const embed = new EmbedBuilder()
        .setTitle('📊 Summon Session Summary')
        .setColor(RARITY_COLORS.divine)
        .addFields(
            {
                name: '🎯 Pull Results',
                value: [
                    `**Total Pulls:** ${allResults.length}`,
                    `**New Fruits:** ${newFruits}`,
                    `**Estimated CP Gained:** ${totalCP.toLocaleString()}`
                ].join('\n'),
                inline: true
            },
            {
                name: '📈 Rarity Breakdown',
                value: raritySummary || 'No fruits pulled',
                inline: true
            },
            {
                name: '💰 Current Stats',
                value: [
                    `**Berries:** ${userStats.berries?.toLocaleString() || 0}`,
                    `**Total Fruits:** ${userStats.totalFruits || 0}`,
                    `**Collection:** ${userStats.uniqueFruits || 0} unique`
                ].join('\n'),
                inline: true
            }
        )
        .setFooter({ text: '🏴‍☠️ Keep sailing the Grand Line for more Devil Fruits!' })
        .setTimestamp();

    return embed;
}

/**
 * Get skill details for display
 * @param {string} fruitId - Fruit ID
 * @param {string} rarity - Fruit rarity
 * @returns {Object} Skill data object
 */
function getSkillDisplay(fruitId, rarity) {
    const skillData = skillsManager.getSkillData(fruitId, rarity);
    
    if (!skillData) {
        // Use smart fallback if no custom skill exists
        const fruitData = DEVIL_FRUITS[fruitId];
        return skillsManager.generateFallbackSkill(fruitId, rarity, fruitData);
    }

    return skillData;
}

/**
 * Enhanced reveal for single pulls
 * @param {Object} result - Single pull result
 * @returns {EmbedBuilder} Single pull reveal embed
 */
function createSinglePullReveal(result) {
    const { fruit, isNew } = result;
    const fruitData = DEVIL_FRUITS[fruit.id];
    
    if (!fruitData) {
        console.error(`Fruit data not found for ID: ${fruit.id}`);
        return null;
    }

    // Get skill data
    const skillData = getSkillDisplay(fruit.id, fruit.rarity);
    
    // Status and rarity info
    const statusEmoji = isNew ? '🆕' : '🔄';
    const statusText = isNew ? 'New Addition!' : `Total Owned: ${fruit.count || 1}`;
    const rarityEmoji = RARITY_EMOJIS[fruit.rarity] || '⚪';
    const rarityName = fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1);

    const embed = new EmbedBuilder()
        .setTitle(`🍈 Devil Fruit Summoned!`)
        .setColor(RARITY_COLORS[fruit.rarity] || RARITY_COLORS.common)
        .setDescription(`${rarityEmoji} **${fruitData.name}** (${rarityName})`)
        .addFields(
            {
                name: '📊 Fruit Information',
                value: [
                    `${statusEmoji} **Status:** ${statusText}`,
                    `🧬 **Type:** ${fruitData.type}`,
                    `⚡ **CP Multiplier:** x${fruitData.multiplier}`,
                    `👤 **User:** ${fruitData.user || "Unknown User"}`
                ].join('\n'),
                inline: true
            },
            {
                name: '⚔️ Combat Ability',
                value: [
                    `**Skill:** ${skillData.name}`,
                    `**Damage:** ${skillData.damage}`,
                    `**Cooldown:** ${skillData.cooldown}s`,
                    `**Type:** ${skillData.type || 'attack'}`,
                    `**Range:** ${skillData.range || 'single'}`
                ].join('\n'),
                inline: true
            },
            {
                name: '📝 Description',
                value: fruitData.description,
                inline: false
            }
        )
        .setFooter({ text: '🏴‍☠️ Your journey on the Grand Line continues!' })
        .setTimestamp();

    // Add skill description if available and different from fruit description
    if (skillData.description && skillData.description !== fruitData.description) {
        embed.addFields({
            name: '⚡ Skill Details',
            value: skillData.description,
            inline: false
        });
    }

    // Add special abilities if they exist
    if (skillData.special && Object.keys(skillData.special).length > 0) {
        const specialAbilities = Object.keys(skillData.special)
            .map(ability => `• ${ability.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
            .join('\n');
        
        embed.addFields({
            name: '✨ Special Abilities',
            value: specialAbilities,
            inline: false
        });
    }

    return embed;
}

/**
 * Create a detailed skill breakdown embed
 * @param {string} fruitId - Fruit ID
 * @param {string} rarity - Fruit rarity
 * @returns {EmbedBuilder} Skill details embed
 */
function createSkillDetailEmbed(fruitId, rarity) {
    const fruitData = DEVIL_FRUITS[fruitId];
    const skillData = getSkillDisplay(fruitId, rarity);
    
    if (!fruitData || !skillData) {
        return null;
    }

    const rarityEmoji = RARITY_EMOJIS[rarity] || '⚪';
    const rarityName = rarity.charAt(0).toUpperCase() + rarity.slice(1);

    const embed = new EmbedBuilder()
        .setTitle(`⚔️ ${skillData.name}`)
        .setColor(RARITY_COLORS[rarity] || RARITY_COLORS.common)
        .setDescription(`${rarityEmoji} **${fruitData.name}** (${rarityName})`)
        .addFields(
            {
                name: '📊 Combat Stats',
                value: [
                    `**Damage:** ${skillData.damage}`,
                    `**Cooldown:** ${skillData.cooldown} seconds`,
                    `**Energy Cost:** ${skillData.cost || 0}`,
                    `**Type:** ${skillData.type || 'attack'}`,
                    `**Range:** ${skillData.range || 'single'}`
                ].join('\n'),
                inline: true
            },
            {
                name: '👤 Devil Fruit User',
                value: [
                    `**Current User:** ${fruitData.user || 'Unknown'}`,
                    `**Fruit Type:** ${fruitData.type}`,
                    `**Element:** ${fruitData.element}`,
                    `**CP Multiplier:** x${fruitData.multiplier}`
                ].join('\n'),
                inline: true
            }
        );

    // Add skill description
    if (skillData.description) {
        embed.addFields({
            name: '📖 Skill Description',
            value: skillData.description,
            inline: false
        });
    }

    // Add special abilities
    if (skillData.special && Object.keys(skillData.special).length > 0) {
        const specialAbilities = Object.entries(skillData.special)
            .map(([ability, value]) => {
                const displayName = ability.replace(/([A-Z])/g, ' $1').toLowerCase();
                return typeof value === 'boolean' && value ? `• ${displayName}` : `• ${displayName}: ${value}`;
            })
            .join('\n');
        
        embed.addFields({
            name: '✨ Special Abilities',
            value: specialAbilities,
            inline: false
        });
    }

    // Add effect information
    if (skillData.effect) {
        embed.addFields({
            name: '🌟 Status Effect',
            value: `**Effect:** ${skillData.effect.replace(/_/g, ' ')}`,
            inline: false
        });
    }

    embed.setFooter({ text: '⚔️ Use this power wisely in battle!' })
         .setTimestamp();

    return embed;
}

/**
 * Create a comparison embed between two skills
 * @param {string} fruitId1 - First fruit ID
 * @param {string} fruitId2 - Second fruit ID
 * @returns {EmbedBuilder} Comparison embed
 */
function createSkillComparisonEmbed(fruitId1, fruitId2) {
    const fruit1Data = DEVIL_FRUITS[fruitId1];
    const fruit2Data = DEVIL_FRUITS[fruitId2];
    
    if (!fruit1Data || !fruit2Data) {
        return null;
    }

    const skill1 = getSkillDisplay(fruitId1, fruit1Data.rarity);
    const skill2 = getSkillDisplay(fruitId2, fruit2Data.rarity);

    const comparison = skillsManager.compareSkills(fruitId1, fruitId2);

    const embed = new EmbedBuilder()
        .setTitle('⚔️ Skill Comparison')
        .setColor(RARITY_COLORS.legendary)
        .setDescription('Compare the combat abilities of two Devil Fruits')
        .addFields(
            {
                name: `🔵 ${fruit1Data.name}`,
                value: [
                    `**Skill:** ${skill1.name}`,
                    `**Damage:** ${skill1.damage}`,
                    `**Cooldown:** ${skill1.cooldown}s`,
                    `**User:** ${fruit1Data.user || 'Unknown'}`
                ].join('\n'),
                inline: true
            },
            {
                name: `🔴 ${fruit2Data.name}`,
                value: [
                    `**Skill:** ${skill2.name}`,
                    `**Damage:** ${skill2.damage}`,
                    `**Cooldown:** ${skill2.cooldown}s`,
                    `**User:** ${fruit2Data.user || 'Unknown'}`
                ].join('\n'),
                inline: true
            }
        );

    if (comparison && !comparison.error) {
        embed.addFields({
            name: '🏆 Comparison Results',
            value: [
                `**Damage Winner:** ${comparison.comparison.damageWinner}`,
                `**Speed Winner:** ${comparison.comparison.cooldownWinner}`,
                `**Overall Winner:** ${comparison.comparison.powerRatingWinner}`,
                `**Power Rating Difference:** ${comparison.comparison.ratingDifference}`
            ].join('\n'),
            inline: false
        });
    }

    return embed;
}

// Export all functions
module.exports = {
    createEnhancedGachaReveal,
    createEnhancedBatchReveal,
    createSummaryEmbed,
    createSinglePullReveal,
    getSkillDisplay,
    createSkillDetailEmbed,
    createSkillComparisonEmbed
};
