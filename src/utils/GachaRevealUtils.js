// src/utils/GachaRevealUtils.js - FIXED: Safe charAt implementation
const { EmbedBuilder } = require('discord.js');
const { skillsManager } = require('../data/DevilFruitSkills');
const { DEVIL_FRUITS } = require('../data/DevilFruits');
const { RARITY_EMOJIS, RARITY_COLORS } = require('../data/Constants');

/**
 * SAFE UTILITY FUNCTIONS - Prevent charAt errors
 */
function safeCapitalize(str) {
    if (!str || typeof str !== 'string') return 'Common';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function safeGetRarity(fruit) {
    return fruit?.rarity || fruit?.fruit_rarity || 'common';
}

function safeGetName(fruit) {
    return fruit?.name || fruit?.fruit_name || 'Unknown Fruit';
}

function safeGetType(fruit) {
    return fruit?.type || fruit?.fruit_type || 'Unknown';
}

function safeGetDescription(fruit) {
    return fruit?.description || fruit?.fruit_description || 'A mysterious Devil Fruit power';
}

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
        
        // SAFE: Extract properties with fallbacks
        const fruitId = fruit?.id || fruit?.fruit_id || `unknown_${index}`;
        const fruitName = safeGetName(fruit);
        const fruitType = safeGetType(fruit);
        const fruitRarity = safeGetRarity(fruit);
        const fruitDescription = safeGetDescription(fruit);
        
        // Safely get fruit data from DEVIL_FRUITS
        let fruitData = null;
        try {
            fruitData = Object.values(DEVIL_FRUITS).find(f => 
                f.id === fruitId || f.name === fruitName
            );
        } catch (error) {
            console.warn('Error finding fruit data:', error);
        }

        // Get skill data from the new skills system with safety
        let skillData = null;
        try {
            if (typeof skillsManager !== 'undefined' && skillsManager.getSkillData) {
                skillData = skillsManager.getSkillData(fruitId, fruitRarity);
            }
        } catch (error) {
            console.warn('Error getting skill data:', error);
        }
        
        // Format skill info with fallbacks
        let skillInfo = "Unknown Ability (50 DMG, 2s CD)";
        if (skillData) {
            const cost = skillData.cost ? ` | ${skillData.cost} Energy` : '';
            skillInfo = `${skillData.name} (${skillData.damage} DMG, ${skillData.cooldown}s CD${cost})`;
        } else if (fruitData?.skill) {
            skillInfo = `${fruitData.skill.name} (${fruitData.skill.damage} DMG, ${fruitData.skill.cooldown}s CD)`;
        }

        // Get user from fruit data with safety
        const user = fruitData?.user || "Unknown User";

        // Status emoji and text
        const statusEmoji = isNew ? '🆕' : '🔄';
        const statusText = isNew ? 'New!' : `Total Owned: ${fruit.count || 1}`;

        // SAFE: Rarity emoji and name with charAt protection
        const rarityEmoji = RARITY_EMOJIS[fruitRarity] || '⚪';
        const rarityName = safeCapitalize(fruitRarity);

        // SAFE: Get multiplier with fallback
        const multiplier = fruitData?.multiplier || fruit?.multiplier || 1.0;

        // Build field value with enhanced formatting
        const fieldValue = [
            `${statusEmoji} **Status:** ${statusText}`,
            `🧬 **Type:** ${fruitType}`,
            `⚡ **CP Multiplier:** x${multiplier}`,
            `👤 **User:** ${user}`,
            `📝 **Description:** ${fruitDescription}`,
            `⚔️ **Ability:** ${skillInfo}`
        ].join('\n');

        // Add field to embed
        embed.addFields({
            name: `${String(index + 1).padStart(2, '0')}. ${rarityEmoji} ${fruitName} (${rarityName})`,
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
        
        try {
            const embed = createEnhancedGachaReveal(batchResults, batchNumber, totalBatches);
            embeds.push(embed);
        } catch (error) {
            console.warn(`Error creating batch ${batchNumber} embed:`, error);
            // Create fallback embed
            const fallbackEmbed = new EmbedBuilder()
                .setTitle(`🍈 Devil Fruit Batch ${batchNumber}/${totalBatches} Complete!`)
                .setColor(RARITY_COLORS.legendary)
                .setDescription(`Error displaying batch details. ${batchResults.length} fruits obtained.`)
                .setTimestamp();
            embeds.push(fallbackEmbed);
        }
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

    // Count rarities and calculate stats with safety
    allResults.forEach(result => {
        const fruit = result.fruit;
        const rarity = safeGetRarity(fruit);
        rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
        
        // SAFE: Calculate CP with fallbacks
        let fruitCP = 0;
        try {
            const fruitData = Object.values(DEVIL_FRUITS).find(f => 
                f.id === (fruit?.id || fruit?.fruit_id) || 
                f.name === safeGetName(fruit)
            );
            if (fruitData) {
                fruitCP = Math.floor(fruitData.multiplier * 100);
            } else {
                fruitCP = Math.floor((fruit?.multiplier || 1) * 100);
            }
        } catch (error) {
            fruitCP = 100; // Fallback CP
        }
        
        totalCP += fruitCP;
        
        if (result.isNew) newFruits++;
    });

    // Build rarity summary with safety
    const raritySummary = Object.entries(rarityCount)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .map(([rarity, count]) => {
            const emoji = RARITY_EMOJIS[rarity] || '⚪';
            const name = safeCapitalize(rarity);
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
 * Get skill details for display with safety
 * @param {string} fruitId - Fruit ID
 * @param {string} rarity - Fruit rarity
 * @returns {Object} Skill data object
 */
function getSkillDisplay(fruitId, rarity) {
    // SAFE: Ensure parameters are strings
    const safeFruitId = fruitId || 'unknown';
    const safeRarity = rarity || 'common';
    
    try {
        if (typeof skillsManager !== 'undefined' && skillsManager.getSkillData) {
            const skillData = skillsManager.getSkillData(safeFruitId, safeRarity);
            if (skillData) return skillData;
        }
    } catch (error) {
        console.warn('Error getting skill display:', error);
    }

    // Fallback skill generation
    try {
        const fruitData = Object.values(DEVIL_FRUITS).find(f => f.id === safeFruitId);
        if (fruitData) {
            return {
                name: `${fruitData.name} Power`,
                damage: Math.floor(fruitData.multiplier * 50),
                cooldown: Math.max(1, Math.floor(fruitData.multiplier / 2)),
                type: 'attack',
                description: fruitData.description || 'A powerful devil fruit ability'
            };
        }
    } catch (error) {
        console.warn('Error generating fallback skill:', error);
    }

    // Ultimate fallback
    return {
        name: 'Unknown Ability',
        damage: 50,
        cooldown: 2,
        type: 'attack',
        description: 'A mysterious devil fruit power'
    };
}

/**
 * Enhanced reveal for single pulls
 * @param {Object} result - Single pull result
 * @returns {EmbedBuilder} Single pull reveal embed
 */
function createSinglePullReveal(result) {
    const { fruit, isNew } = result;
    
    // SAFE: Extract all properties with fallbacks
    const fruitId = fruit?.id || fruit?.fruit_id || 'unknown';
    const fruitName = safeGetName(fruit);
    const fruitType = safeGetType(fruit);
    const fruitRarity = safeGetRarity(fruit);
    const fruitDescription = safeGetDescription(fruit);
    
    let fruitData = null;
    try {
        fruitData = Object.values(DEVIL_FRUITS).find(f => 
            f.id === fruitId || f.name === fruitName
        );
    } catch (error) {
        console.warn('Error finding fruit data for single pull:', error);
    }

    // Get skill data with safety
    const skillData = getSkillDisplay(fruitId, fruitRarity);
    
    // Status and rarity info with safety
    const statusEmoji = isNew ? '🆕' : '🔄';
    const statusText = isNew ? 'New Addition!' : `Total Owned: ${fruit.count || 1}`;
    const rarityEmoji = RARITY_EMOJIS[fruitRarity] || '⚪';
    const rarityName = safeCapitalize(fruitRarity);

    const embed = new EmbedBuilder()
        .setTitle(`🍈 Devil Fruit Summoned!`)
        .setColor(RARITY_COLORS[fruitRarity] || RARITY_COLORS.common)
        .setDescription(`${rarityEmoji} **${fruitName}** (${rarityName})`)
        .addFields(
            {
                name: '📊 Fruit Information',
                value: [
                    `${statusEmoji} **Status:** ${statusText}`,
                    `🧬 **Type:** ${fruitType}`,
                    `⚡ **CP Multiplier:** x${fruitData?.multiplier || 1.0}`,
                    `👤 **User:** ${fruitData?.user || "Unknown User"}`
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
                value: fruitDescription,
                inline: false
            }
        )
        .setFooter({ text: '🏴‍☠️ Your journey on the Grand Line continues!' })
        .setTimestamp();

    // Add skill description if available and different from fruit description
    if (skillData.description && skillData.description !== fruitDescription) {
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
    const safeRarity = rarity || 'common';
    const safeFruitId = fruitId || 'unknown';
    
    let fruitData = null;
    try {
        fruitData = Object.values(DEVIL_FRUITS).find(f => f.id === safeFruitId);
    } catch (error) {
        console.warn('Error finding fruit data for skill detail:', error);
    }
    
    const skillData = getSkillDisplay(safeFruitId, safeRarity);
    
    if (!skillData) {
        return null;
    }

    const rarityEmoji = RARITY_EMOJIS[safeRarity] || '⚪';
    const rarityName = safeCapitalize(safeRarity);

    const embed = new EmbedBuilder()
        .setTitle(`⚔️ ${skillData.name}`)
        .setColor(RARITY_COLORS[safeRarity] || RARITY_COLORS.common)
        .setDescription(`${rarityEmoji} **${fruitData?.name || 'Unknown Fruit'}** (${rarityName})`)
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
                    `**Current User:** ${fruitData?.user || 'Unknown'}`,
                    `**Fruit Type:** ${fruitData?.type || 'Unknown'}`,
                    `**Element:** ${fruitData?.element || 'Unknown'}`,
                    `**CP Multiplier:** x${fruitData?.multiplier || 1.0}`
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
    let fruit1Data = null;
    let fruit2Data = null;
    
    try {
        fruit1Data = Object.values(DEVIL_FRUITS).find(f => f.id === fruitId1);
        fruit2Data = Object.values(DEVIL_FRUITS).find(f => f.id === fruitId2);
    } catch (error) {
        console.warn('Error finding fruits for comparison:', error);
    }
    
    if (!fruit1Data || !fruit2Data) {
        return null;
    }

    const skill1 = getSkillDisplay(fruitId1, fruit1Data.rarity);
    const skill2 = getSkillDisplay(fruitId2, fruit2Data.rarity);

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

    // Simple comparison logic
    const damageWinner = skill1.damage > skill2.damage ? fruit1Data.name : 
                        skill2.damage > skill1.damage ? fruit2Data.name : 'Tie';
    const speedWinner = skill1.cooldown < skill2.cooldown ? fruit1Data.name : 
                       skill2.cooldown < skill1.cooldown ? fruit2Data.name : 'Tie';

    embed.addFields({
        name: '🏆 Comparison Results',
        value: [
            `**Damage Winner:** ${damageWinner}`,
            `**Speed Winner:** ${speedWinner}`,
            `**Overall:** Both fruits have unique strengths`
        ].join('\n'),
        inline: false
    });

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
    createSkillComparisonEmbed,
    // Export utility functions for testing
    safeCapitalize,
    safeGetRarity,
    safeGetName,
    safeGetType,
    safeGetDescription
};
