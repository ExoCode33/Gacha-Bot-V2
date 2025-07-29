// src/commands/slash/pvp/pvp-raid.js - COMPLETE: Full Automated Battle System
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const EconomyService = require('../../../services/EconomyService');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');

// Raid configuration
const RAID_CONFIG = {
    COOLDOWN_TIME: 300000, // 5 minutes between raids
    MIN_CP_REQUIRED: 500, // Minimum CP to participate
    BERRY_STEAL_PERCENTAGE: 0.15, // 15% of opponent's berries
    FRUIT_DROP_CHANCES: {
        'divine': 0.01,     // 1% chance
        'mythical': 0.02,   // 2% chance  
        'legendary': 0.05,  // 5% chance
        'epic': 0.08,       // 8% chance
        'rare': 0.12,       // 12% chance
        'uncommon': 0.18,   // 18% chance
        'common': 0.25      // 25% chance
    },
    MAX_FRUIT_DROPS: 3,
    BATTLE_ROUNDS: 15 // Maximum battle rounds
};

// Active raid cooldowns
const raidCooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid')
        .setDescription('⚔️ Launch an automated raid against another pirate\'s collection!')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The pirate you want to raid')
                .setRequired(true)
        ),
    
    category: 'pvp',
    cooldown: 5,
    
    async execute(interaction) {
        const attacker = interaction.user;
        const target = interaction.options.getUser('target');
        
        try {
            // Validation checks
            const validationResult = await validateRaid(attacker.id, target);
            if (!validationResult.valid) {
                return interaction.reply({
                    embeds: [createErrorEmbed(validationResult.reason)],
                    ephemeral: true
                });
            }
            
            await interaction.deferReply();
            
            // Get participant data
            const [attackerData, targetData] = await Promise.all([
                getParticipantData(attacker.id),
                getParticipantData(target.id)
            ]);
            
            // Start the automated raid battle
            const battleResult = await executeAutomatedBattle(attackerData, targetData);
            
            // Process rewards and penalties
            const rewards = await processRaidRewards(battleResult, attackerData, targetData);
            
            // Set raid cooldown
            raidCooldowns.set(attacker.id, Date.now());
            
            // Create and send result embed
            const resultEmbed = await createRaidResultEmbed(battleResult, rewards, attacker, target);
            
            // Add rematch button for winner
            const components = battleResult.winner === attacker.id ? 
                [createRematchButton(attacker.id, target.id)] : [];
            
            await interaction.editReply({ 
                embeds: [resultEmbed], 
                components 
            });
            
            // Setup button collector for rematch
            if (components.length > 0) {
                setupRematchCollector(interaction, attacker.id, target.id);
            }
            
        } catch (error) {
            interaction.client.logger.error('PvP Raid command error:', error);
            
            const errorResponse = {
                embeds: [createErrorEmbed('An error occurred during the raid!')],
                ephemeral: true
            };
            
            if (interaction.deferred) {
                await interaction.editReply(errorResponse);
            } else {
                await interaction.reply(errorResponse);
            }
        }
    }
};

/**
 * Validate if raid can proceed
 */
async function validateRaid(attackerId, target) {
    // Check if target is valid
    if (!target || target.bot) {
        return { valid: false, reason: 'Cannot raid bots or invalid users!' };
    }
    
    if (attackerId === target.id) {
        return { valid: false, reason: 'Cannot raid yourself!' };
    }
    
    // Check cooldown
    const lastRaid = raidCooldowns.get(attackerId);
    if (lastRaid && (Date.now() - lastRaid) < RAID_CONFIG.COOLDOWN_TIME) {
        const remainingTime = Math.ceil((RAID_CONFIG.COOLDOWN_TIME - (Date.now() - lastRaid)) / 1000);
        return { valid: false, reason: `Raid cooldown active! Wait ${remainingTime} more seconds.` };
    }
    
    // Check if both users exist and have minimum CP
    try {
        const [attackerUser, targetUser] = await Promise.all([
            DatabaseManager.getUser(attackerId),
            DatabaseManager.getUser(target.id)
        ]);
        
        if (!attackerUser) {
            return { valid: false, reason: 'You need to use other commands first to initialize your account!' };
        }
        
        if (!targetUser) {
            return { valid: false, reason: 'Target user not found in the database!' };
        }
        
        if (attackerUser.total_cp < RAID_CONFIG.MIN_CP_REQUIRED) {
            return { valid: false, reason: `You need at least ${RAID_CONFIG.MIN_CP_REQUIRED} CP to raid!` };
        }
        
        if (targetUser.total_cp < RAID_CONFIG.MIN_CP_REQUIRED) {
            return { valid: false, reason: `Target has insufficient CP (minimum ${RAID_CONFIG.MIN_CP_REQUIRED} required)!` };
        }
        
    } catch (error) {
        return { valid: false, reason: 'Database error during validation!' };
    }
    
    return { valid: true };
}

/**
 * Get participant data for battle
 */
async function getParticipantData(userId) {
    const user = await DatabaseManager.getUser(userId);
    const fruits = await DatabaseManager.getUserDevilFruits(userId);
    
    // Group fruits by ID and calculate total power
    const fruitGroups = {};
    fruits.forEach(fruit => {
        const key = fruit.fruit_id || fruit.id;
        if (!fruitGroups[key]) {
            fruitGroups[key] = {
                ...fruit,
                count: 0,
                totalCP: 0
            };
        }
        fruitGroups[key].count++;
        fruitGroups[key].totalCP += fruit.total_cp || fruit.base_cp || 100;
    });
    
    return {
        userId,
        username: user.username,
        totalCP: user.total_cp,
        berries: user.berries,
        level: user.level,
        fruits: Object.values(fruitGroups),
        totalFruits: fruits.length,
        uniqueFruits: Object.keys(fruitGroups).length
    };
}

/**
 * Execute automated battle between two participants
 */
async function executeAutomatedBattle(attacker, target) {
    const battleLog = [];
    
    // Calculate battle stats
    const attackerPower = calculateBattlePower(attacker);
    const targetPower = calculateBattlePower(target);
    
    let attackerHP = attackerPower.totalHP;
    let targetHP = targetPower.totalHP;
    
    battleLog.push(`🏴‍☠️ **${attacker.username}** (${attackerPower.totalHP} HP) vs **${target.username}** (${targetPower.totalHP} HP)`);
    battleLog.push(`⚔️ Battle Power: ${attackerPower.attackPower} vs ${targetPower.attackPower}`);
    battleLog.push('');
    
    let currentRound = 1;
    
    // Battle simulation
    for (currentRound = 1; currentRound <= RAID_CONFIG.BATTLE_ROUNDS; currentRound++) {
        if (attackerHP <= 0 || targetHP <= 0) break;
        
        // Attacker's turn
        if (attackerHP > 0) {
            const damage = calculateDamage(attackerPower, targetPower);
            targetHP = Math.max(0, targetHP - damage);
            
            const critText = damage > attackerPower.attackPower * 1.5 ? ' **CRITICAL!**' : '';
            battleLog.push(`🗡️ ${attacker.username} deals ${damage} damage${critText} (Target HP: ${targetHP})`);
            
            if (targetHP <= 0) {
                battleLog.push(`💀 ${target.username} is defeated!`);
                break;
            }
        }
        
        // Target's counter-attack
        if (targetHP > 0) {
            const damage = calculateDamage(targetPower, attackerPower);
            attackerHP = Math.max(0, attackerHP - damage);
            
            const critText = damage > targetPower.attackPower * 1.5 ? ' **CRITICAL!**' : '';
            battleLog.push(`🗡️ ${target.username} deals ${damage} damage${critText} (Attacker HP: ${attackerHP})`);
            
            if (attackerHP <= 0) {
                battleLog.push(`💀 ${attacker.username} is defeated!`);
                break;
            }
        }
        
        if (currentRound % 3 === 0) {
            battleLog.push(''); // Add spacing every 3 rounds
        }
    }
    
    // Determine winner
    let winner = null;
    let reason = 'draw';
    
    if (attackerHP > targetHP) {
        winner = attacker.userId;
        reason = 'victory';
    } else if (targetHP > attackerHP) {
        winner = target.userId;
        reason = 'victory';
    } else if (attackerHP === 0 && targetHP === 0) {
        reason = 'mutual_destruction';
    } else {
        // Time limit reached, winner is whoever has more HP
        winner = attackerHP > targetHP ? attacker.userId : target.userId;
        reason = 'time_limit';
    }
    
    return {
        attacker,
        target,
        winner,
        reason,
        finalHP: { attacker: attackerHP, target: targetHP },
        battleLog,
        rounds: Math.min(currentRound, RAID_CONFIG.BATTLE_ROUNDS),
        attackerPower,
        targetPower
    };
}

/**
 * Calculate battle power from participant data
 */
function calculateBattlePower(participant) {
    const baseHP = 1000 + (participant.level * 50);
    const cpBonus = Math.floor(participant.totalCP * 0.8);
    const totalHP = baseHP + cpBonus;
    
    const baseAttack = 100 + (participant.level * 10);
    const fruitBonus = participant.fruits.length * 5;
    const rarityBonus = calculateRarityBonus(participant.fruits);
    const attackPower = baseAttack + fruitBonus + rarityBonus;
    
    return {
        totalHP,
        attackPower,
        defense: Math.floor(participant.totalCP * 0.1),
        speed: Math.min(100, participant.uniqueFruits * 2),
        luck: Math.min(20, participant.totalFruits)
    };
}

/**
 * Calculate rarity bonus for attack power
 */
function calculateRarityBonus(fruits) {
    const rarityValues = {
        'divine': 100,
        'mythical': 70,
        'legendary': 50,
        'epic': 30,
        'rare': 20,
        'uncommon': 10,
        'common': 5
    };
    
    return fruits.reduce((bonus, fruit) => {
        const rarity = fruit.fruit_rarity || 'common';
        return bonus + (rarityValues[rarity] || 5);
    }, 0);
}

/**
 * Calculate damage for one attack
 */
function calculateDamage(attacker, defender) {
    const baseDamage = attacker.attackPower;
    const defense = defender.defense;
    
    // Random variance (80% - 120%)
    const variance = 0.8 + (Math.random() * 0.4);
    
    // Critical hit chance (based on luck)
    const critChance = (attacker.luck / 100) * 0.3; // Max 6% crit chance
    const isCritical = Math.random() < critChance;
    
    // Calculate final damage
    let damage = Math.floor((baseDamage - defense * 0.5) * variance);
    
    if (isCritical) {
        damage = Math.floor(damage * 1.8);
    }
    
    return Math.max(1, damage); // Minimum 1 damage
}

/**
 * Process raid rewards and penalties
 */
async function processRaidRewards(battleResult, attackerData, targetData) {
    const rewards = {
        berries: 0,
        fruitsStolen: [],
        experienceGained: 0
    };
    
    if (battleResult.winner === attackerData.userId) {
        // Winner rewards
        const berriesStolen = Math.floor(targetData.berries * RAID_CONFIG.BERRY_STEAL_PERCENTAGE);
        
        if (berriesStolen > 0) {
            await EconomyService.transferBerries(targetData.userId, attackerData.userId, berriesStolen, 'raid_victory');
            rewards.berries = berriesStolen;
        }
        
        // Try to steal fruits
        const stolenFruits = await stealRandomFruits(targetData, attackerData.userId);
        rewards.fruitsStolen = stolenFruits;
        
        // Experience for winner
        rewards.experienceGained = Math.floor(targetData.totalCP / 100);
        
    } else if (battleResult.winner === targetData.userId) {
        // Defender victory bonus (smaller reward)
        const defenseBonus = Math.floor(attackerData.berries * 0.05); // 5% defense bonus
        
        if (defenseBonus > 0) {
            await EconomyService.addBerries(targetData.userId, defenseBonus, 'successful_defense');
            rewards.berries = -defenseBonus; // Negative indicates attacker lost berries
        }
        
        rewards.experienceGained = Math.floor(attackerData.totalCP / 200);
    }
    
    return rewards;
}

/**
 * Steal random fruits from target
 */
async function stealRandomFruits(targetData, attackerId) {
    const stolenFruits = [];
    
    if (targetData.fruits.length === 0) return stolenFruits;
    
    // Sort fruits by rarity (most common first, harder to steal rare ones)
    const availableFruits = [...targetData.fruits].sort((a, b) => {
        const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5, 'mythical': 6, 'divine': 7 };
        const aRarity = rarityOrder[a.fruit_rarity] || 1;
        const bRarity = rarityOrder[b.fruit_rarity] || 1;
        return aRarity - bRarity;
    });
    
    for (let attempt = 0; attempt < RAID_CONFIG.MAX_FRUIT_DROPS && availableFruits.length > 0 && stolenFruits.length < RAID_CONFIG.MAX_FRUIT_DROPS; attempt++) {
        const randomFruit = availableFruits[Math.floor(Math.random() * availableFruits.length)];
        const rarity = randomFruit.fruit_rarity || 'common';
        const dropChance = RAID_CONFIG.FRUIT_DROP_CHANCES[rarity] || 0.1;
        
        if (Math.random() < dropChance) {
            try {
                // Transfer one copy of the fruit
                await transferFruit(randomFruit, targetData.userId, attackerId);
                stolenFruits.push(randomFruit);
                
                // Remove from available fruits to prevent stealing same fruit multiple times
                const index = availableFruits.indexOf(randomFruit);
                if (index > -1) {
                    availableFruits.splice(index, 1);
                }
                
            } catch (error) {
                console.error('Error transferring stolen fruit:', error);
            }
        }
    }
    
    return stolenFruits;
}

/**
 * Transfer a fruit from one user to another
 */
async function transferFruit(fruit, fromUserId, toUserId) {
    // Remove one copy from the original owner
    await DatabaseManager.query(`
        DELETE FROM user_devil_fruits 
        WHERE user_id = $1 AND fruit_id = $2 
        AND id = (
            SELECT id FROM user_devil_fruits 
            WHERE user_id = $1 AND fruit_id = $2 
            LIMIT 1
        )
    `, [fromUserId, fruit.fruit_id]);
    
    // Add to new owner
    await DatabaseManager.addDevilFruit(toUserId, {
        id: fruit.fruit_id,
        name: fruit.fruit_name,
        type: fruit.fruit_type,
        rarity: fruit.fruit_rarity,
        multiplier: (fruit.base_cp / 100).toFixed(1),
        description: fruit.fruit_description
    });
    
    // Recalculate CP for both users
    await Promise.all([
        DatabaseManager.recalculateUserCP(fromUserId),
        DatabaseManager.recalculateUserCP(toUserId)
    ]);
}

/**
 * Create raid result embed
 */
async function createRaidResultEmbed(battleResult, rewards, attacker, target) {
    const { winner, reason, finalHP, battleLog, rounds } = battleResult;
    
    let color = RARITY_COLORS.common;
    let title = '⚔️ Raid Battle Result';
    let description = '';
    
    if (winner === attacker.id) {
        color = RARITY_COLORS.legendary;
        title = '🏆 Successful Raid!';
        description = `**${attacker.username}** successfully raided **${target.username}**!`;
    } else if (winner === target.id) {
        color = RARITY_COLORS.epic;
        title = '🛡️ Raid Defended!';
        description = `**${target.username}** successfully defended against **${attacker.username}**!`;
    } else {
        color = RARITY_COLORS.uncommon;
        title = '⚖️ Raid Draw!';
        description = `The raid between **${attacker.username}** and **${target.username}** ended in a draw!`;
    }
    
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .addFields(
            {
                name: '⚔️ Battle Summary',
                value: [
                    `**Rounds:** ${rounds}/${RAID_CONFIG.BATTLE_ROUNDS}`,
                    `**Final HP:** ${attacker.username}: ${finalHP.attacker} | ${target.username}: ${finalHP.target}`,
                    `**Reason:** ${getReasonText(reason)}`
                ].join('\n'),
                inline: false
            }
        );
    
    // Add rewards section
    if (rewards.berries !== 0 || rewards.fruitsStolen.length > 0) {
        let rewardsText = '';
        
        if (rewards.berries > 0) {
            rewardsText += `💰 **Berries Stolen:** ${rewards.berries.toLocaleString()}\n`;
        } else if (rewards.berries < 0) {
            rewardsText += `💸 **Defense Bonus:** ${Math.abs(rewards.berries).toLocaleString()}\n`;
        }
        
        if (rewards.fruitsStolen.length > 0) {
            rewardsText += `🍈 **Fruits Stolen:** ${rewards.fruitsStolen.length}\n`;
            rewards.fruitsStolen.forEach(fruit => {
                const emoji = RARITY_EMOJIS[fruit.fruit_rarity] || '⚪';
                rewardsText += `   ${emoji} ${fruit.fruit_name}\n`;
            });
        }
        
        if (rewards.experienceGained > 0) {
            rewardsText += `⭐ **Experience:** +${rewards.experienceGained}`;
        }
        
        if (rewardsText) {
            embed.addFields({
                name: '🎁 Rewards',
                value: rewardsText,
                inline: false
            });
        }
    }
    
    // Add battle log (truncated for Discord limits)
    const logText = battleLog.slice(0, 8).join('\n');
    if (logText.length > 0 && logText.length < 1000) {
        embed.addFields({
            name: '📜 Battle Log',
            value: logText.length > 1000 ? logText.substring(0, 997) + '...' : logText,
            inline: false
        });
    }
    
    embed.setFooter({ text: `Raid completed in ${rounds} rounds` })
         .setTimestamp();
    
    return embed;
}

/**
 * Get reason text for battle end
 */
function getReasonText(reason) {
    switch (reason) {
        case 'victory': return 'Decisive Victory';
        case 'time_limit': return 'Time Limit Reached';
        case 'mutual_destruction': return 'Mutual Destruction';
        default: return 'Draw';
    }
}

/**
 * Create error embed
 */
function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Raid Failed')
        .setDescription(message)
        .setTimestamp();
}

/**
 * Create rematch button
 */
function createRematchButton(winnerId, loserId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`rematch_${winnerId}_${loserId}`)
                .setLabel('⚔️ Offer Rematch')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄')
        );
}

/**
 * Setup rematch button collector
 */
function setupRematchCollector(interaction, winnerId, loserId) {
    const message = interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ 
        time: 300000 // 5 minutes
    });
    
    collector.on('collect', async (buttonInteraction) => {
        if (buttonInteraction.user.id !== winnerId) {
            return buttonInteraction.reply({
                content: '❌ Only the winner can offer a rematch!',
                ephemeral: true
            });
        }
        
        // Check if rematch is still valid (cooldowns, etc.)
        const target = await interaction.client.users.fetch(loserId).catch(() => null);
        if (!target) {
            return buttonInteraction.reply({
                content: '❌ Target user not found!',
                ephemeral: true
            });
        }
        
        const validation = await validateRaid(winnerId, target);
        if (!validation.valid) {
            return buttonInteraction.reply({
                content: `❌ Rematch not available: ${validation.reason}`,
                ephemeral: true
            });
        }
        
        // Disable the button and notify
        const disabledRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('rematch_used')
                    .setLabel('⚔️ Rematch Requested!')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        
        await buttonInteraction.update({ components: [disabledRow] });
        
        // Notify about rematch availability
        await buttonInteraction.followUp({
            content: `🔄 **Rematch requested!** ${target.username} can now raid you back with \`/pvp-raid @${buttonInteraction.user.username}\``,
            ephemeral: false
        });
    });
    
    collector.on('end', () => {
        // Disable button when collector expires
        const disabledRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('rematch_expired')
                    .setLabel('⚔️ Rematch Expired')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        
        interaction.editReply({ components: [disabledRow] }).catch(() => {});
    });
}
