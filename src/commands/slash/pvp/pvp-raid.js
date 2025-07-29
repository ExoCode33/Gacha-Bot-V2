// src/commands/slash/pvp/pvp-raid.js - COMPLETE: Fixed Interaction Handling
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const { getSkillData } = require('../../../data/DevilFruitSkills');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');

// Raid configuration
const RAID_CONFIG = {
    COOLDOWN_TIME: 300000, // 5 minutes between raids
    MIN_CP_REQUIRED: 500,
    BERRY_STEAL_PERCENTAGE: 0.15,
    FRUIT_DROP_CHANCES: {
        'divine': 0.01, 'mythical': 0.02, 'legendary': 0.05,
        'epic': 0.08, 'rare': 0.12, 'uncommon': 0.18, 'common': 0.25
    },
    MAX_FRUIT_DROPS: 3,
    MAX_BATTLE_TURNS: 20, // Reduced for faster battles
    TURN_TIMEOUT: 60000, // Reduced to 1 minute per turn
    HP_BAR_LENGTH: 20,
    INTERACTION_TIMEOUT: 14 * 60 * 1000 // 14 minutes (before Discord's 15min limit)
};

// Active raids and cooldowns
const raidCooldowns = new Map();
const activeRaids = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid')
        .setDescription('⚔️ Raid another pirate with enhanced visual combat!')
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
            // Validation
            const validation = await validateRaid(attacker.id, target);
            if (!validation.valid) {
                return interaction.reply({
                    embeds: [createErrorEmbed(validation.reason)],
                    ephemeral: true
                });
            }
            
            await interaction.deferReply();
            
            // Get participant data
            const [attackerData, targetData] = await Promise.all([
                getParticipantData(attacker.id),
                getParticipantData(target.id)
            ]);
            
            // Start the raid
            await executeRaid(interaction, attackerData, targetData);
            
            // Set cooldown
            raidCooldowns.set(attacker.id, Date.now());
            
        } catch (error) {
            interaction.client.logger.error('PvP Raid error:', error);
            
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
 * FIXED: Safe interaction response with timeout checks
 */
async function safeInteractionReply(interaction, content, ephemeral = true) {
    try {
        // Check if interaction is still valid (not expired)
        const interactionAge = Date.now() - interaction.createdTimestamp;
        if (interactionAge > RAID_CONFIG.INTERACTION_TIMEOUT) {
            console.log('Interaction too old, skipping response');
            return false;
        }
        
        // Check if we can still respond
        if (!interaction.isRepliable()) {
            console.log('Interaction no longer repliable');
            return false;
        }
        
        // Try to respond
        if (interaction.replied) {
            await interaction.followUp({ ...content, ephemeral });
        } else if (interaction.deferred) {
            await interaction.editReply(content);
        } else {
            await interaction.reply({ ...content, ephemeral });
        }
        
        return true;
        
    } catch (error) {
        console.error('Safe interaction reply failed:', error.message);
        return false;
    }
}

/**
 * Execute the main raid battle
 */
async function executeRaid(interaction, attackerData, targetData) {
    const raidId = generateRaidId();
    
    // Initialize battle state
    const raidState = {
        id: raidId,
        attacker: {
            ...attackerData,
            currentHP: calculateMaxHP(attackerData.totalCP, attackerData.level),
            maxHP: calculateMaxHP(attackerData.totalCP, attackerData.level),
            activeFruitIndex: 0,
            statusEffects: [],
            skillCooldowns: {}
        },
        target: {
            ...targetData,
            currentHP: calculateMaxHP(targetData.totalCP, targetData.level),
            maxHP: calculateMaxHP(targetData.totalCP, targetData.level),
            activeFruitIndex: 0,
            statusEffects: [],
            skillCooldowns: {}
        },
        turn: 1,
        currentPlayer: 'attacker',
        battleLog: [],
        startTime: Date.now(),
        originalInteraction: interaction
    };
    
    activeRaids.set(raidId, raidState);
    
    // Start the raid with quick auto-battle (no interaction required)
    await processQuickRaid(interaction, raidState);
}

/**
 * FIXED: Process quick raid without complex interactions
 */
async function processQuickRaid(interaction, raidState) {
    const embed = new EmbedBuilder()
        .setTitle('⚔️ Quick Raid Battle!')
        .setDescription('Processing raid combat...')
        .setColor(RARITY_COLORS.legendary);
    
    await interaction.editReply({ embeds: [embed] });
    
    // Process battle turns automatically
    let battleResult = { ended: false };
    
    while (!battleResult.ended && raidState.turn <= RAID_CONFIG.MAX_BATTLE_TURNS) {
        // Attacker turn
        await processAutoTurn(raidState, 'attacker');
        
        battleResult = checkBattleEnd(raidState);
        if (battleResult.ended) break;
        
        // Target (AI) turn
        await processAutoTurn(raidState, 'target');
        
        battleResult = checkBattleEnd(raidState);
        if (battleResult.ended) break;
        
        raidState.turn++;
        
        // Add a small delay for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Show final results
    const rewards = await calculateRewards(raidState, battleResult.winner);
    const resultEmbed = createQuickRaidResultEmbed(raidState, battleResult, rewards);
    
    try {
        await interaction.editReply({
            embeds: [resultEmbed],
            components: []
        });
    } catch (error) {
        console.error('Failed to update final battle result:', error);
    }
    
    activeRaids.delete(raidState.id);
}

/**
 * Process automatic turn for quick raid
 */
async function processAutoTurn(raidState, playerType) {
    const attacker = raidState[playerType];
    const defender = playerType === 'attacker' ? raidState.target : raidState.attacker;
    const activeFruit = attacker.fruits[attacker.activeFruitIndex];
    
    if (!activeFruit) return;
    
    // Decide action (60% attack, 40% skill)
    const useSkill = Math.random() > 0.6;
    
    if (useSkill) {
        const skillData = getSkillData(activeFruit.id, activeFruit.rarity);
        const cooldownKey = `${activeFruit.id}_${skillData?.name || 'basic'}`;
        
        if (skillData && (attacker.skillCooldowns[cooldownKey] || 0) <= 0) {
            // Use skill
            let damage = skillData.damage || Math.floor(activeFruit.totalCP / 20);
            
            // Add some randomness
            damage = Math.floor(damage * (0.8 + Math.random() * 0.4));
            
            const originalHP = defender.currentHP;
            defender.currentHP = Math.max(0, defender.currentHP - damage);
            const actualDamage = originalHP - defender.currentHP;
            
            attacker.skillCooldowns[cooldownKey] = skillData.cooldown || 2;
            
            const actionText = `${attacker.username} uses ${skillData.name} for ${actualDamage} damage!`;
            raidState.battleLog.push(actionText);
        } else {
            // Fall back to basic attack
            processBasicAttack(raidState, playerType);
        }
    } else {
        // Basic attack
        processBasicAttack(raidState, playerType);
    }
    
    // Reduce cooldowns
    Object.keys(attacker.skillCooldowns).forEach(skill => {
        if (attacker.skillCooldowns[skill] > 0) {
            attacker.skillCooldowns[skill]--;
        }
    });
}

/**
 * Process basic attack
 */
function processBasicAttack(raidState, playerType) {
    const attacker = raidState[playerType];
    const defender = playerType === 'attacker' ? raidState.target : raidState.attacker;
    const activeFruit = attacker.fruits[attacker.activeFruitIndex];
    
    if (!activeFruit) return;
    
    let damage = Math.floor(40 + (activeFruit.totalCP / 60));
    
    // Add randomness and crit chance
    const critChance = 0.15;
    const isCritical = Math.random() < critChance;
    
    if (isCritical) {
        damage = Math.floor(damage * 1.8);
    }
    
    // Add random variance
    damage = Math.floor(damage * (0.8 + Math.random() * 0.4));
    
    const originalHP = defender.currentHP;
    defender.currentHP = Math.max(0, defender.currentHP - damage);
    const actualDamage = originalHP - defender.currentHP;
    
    const actionText = `${attacker.username} attacks with ${activeFruit.name} for ${actualDamage} damage${isCritical ? ' (CRITICAL!)' : ''}!`;
    raidState.battleLog.push(actionText);
}

/**
 * Create quick raid result embed
 */
function createQuickRaidResultEmbed(raidState, battleResult, rewards) {
    const { attacker, target } = raidState;
    const { winner, reason } = battleResult;
    
    const winnerName = winner === attacker.userId ? attacker.username : target.username;
    const loserName = winner === attacker.userId ? target.username : attacker.username;
    
    const attackerHPBar = createHPBar(attacker.currentHP, attacker.maxHP);
    const targetHPBar = createHPBar(target.currentHP, target.maxHP);
    
    const embed = new EmbedBuilder()
        .setTitle('🏆 Raid Complete!')
        .setDescription(`${winnerName} successfully raided ${loserName}!`)
        .setColor(winner === attacker.userId ? 0x00FF00 : 0xFF0000)
        .addFields(
            {
                name: '⚔️ Final HP Status',
                value: [
                    `💀 **${attacker.username}:**`,
                    attackerHPBar,
                    `${attacker.currentHP} / ${attacker.maxHP} HP`,
                    '',
                    `🛡️ **${target.username}:**`,
                    targetHPBar,
                    `${target.currentHP} / ${target.maxHP} HP`
                ].join('\n'),
                inline: false
            },
            {
                name: '📊 Battle Summary',
                value: [
                    `**Total Turns:** ${raidState.turn}`,
                    `**Victory Type:** ${reason}`,
                    `**Actions Taken:** ${raidState.battleLog.length}`,
                    `**Battle Duration:** ${Math.floor((Date.now() - raidState.startTime) / 1000)}s`
                ].join('\n'),
                inline: false
            }
        );
    
    // Show last few actions
    if (raidState.battleLog.length > 0) {
        const lastActions = raidState.battleLog.slice(-3).join('\n');
        embed.addFields({
            name: '⚡ Recent Combat Actions',
            value: lastActions.length > 1000 ? lastActions.substring(0, 997) + '...' : lastActions,
            inline: false
        });
    }
    
    // Show rewards if any
    if (rewards.berries > 0 || rewards.fruitsStolen.length > 0) {
        let rewardsText = '';
        
        if (rewards.berries > 0) {
            rewardsText += `💰 **Berries Stolen:** ${rewards.berries.toLocaleString()}\n`;
        }
        
        if (rewards.fruitsStolen.length > 0) {
            rewardsText += `🍈 **Fruits Stolen:** ${rewards.fruitsStolen.length}\n`;
            rewards.fruitsStolen.forEach(fruit => {
                rewardsText += `• ${fruit.emoji || '⚪'} ${fruit.name}\n`;
            });
        }
        
        if (rewards.experience > 0) {
            rewardsText += `⭐ **Experience:** +${rewards.experience}`;
        }
        
        if (rewardsText) {
            embed.addFields({
                name: '🎁 Battle Rewards',
                value: rewardsText,
                inline: false
            });
        }
    }
    
    embed.setFooter({ 
        text: `Quick Raid System • Combat completed automatically` 
    })
    .setTimestamp();
    
    return embed;
}

/**
 * Create HP bar visualization
 */
function createHPBar(currentHP, maxHP) {
    const percentage = Math.max(0, currentHP / maxHP);
    const filledBars = Math.floor(percentage * RAID_CONFIG.HP_BAR_LENGTH);
    const emptyBars = RAID_CONFIG.HP_BAR_LENGTH - filledBars;
    
    let hpEmoji = '🟩';
    if (percentage < 0.3) {
        hpEmoji = '🟥';
    } else if (percentage < 0.6) {
        hpEmoji = '🟨';
    }
    
    return hpEmoji.repeat(filledBars) + '⬜'.repeat(emptyBars);
}

/**
 * Get skills used during battle
 */
function getSkillsUsed(raidState) {
    const skills = [];
    
    raidState.battleLog.forEach(action => {
        if (action.includes('uses ') && !action.includes('attacks')) {
            const skillMatch = action.match(/uses (.+?) for/);
            if (skillMatch) {
                const skillName = skillMatch[1];
                if (!skills.includes(skillName)) {
                    skills.push(`✨ ${skillName}`);
                }
            }
        }
    });
    
    return skills.slice(0, 5);
}

/**
 * Calculate battle rewards
 */
async function calculateRewards(raidState, winnerId) {
    const rewards = {
        berries: 0,
        fruitsStolen: [],
        experience: 0
    };
    
    if (winnerId === raidState.attacker.userId) {
        const targetBerries = raidState.target.berries || 0;
        const berriesStolen = Math.floor(targetBerries * RAID_CONFIG.BERRY_STEAL_PERCENTAGE);
        
        if (berriesStolen > 0) {
            rewards.berries = berriesStolen;
            
            try {
                await DatabaseManager.updateUserBerries(raidState.attacker.userId, berriesStolen, 'raid_victory');
                await DatabaseManager.updateUserBerries(raidState.target.userId, -berriesStolen, 'raid_loss');
            } catch (error) {
                console.error('Error updating berries:', error);
            }
        }
        
        const stolenFruits = await tryStealFruits(raidState.target.userId, raidState.attacker.userId);
        rewards.fruitsStolen = stolenFruits;
        
        rewards.experience = Math.floor(raidState.target.totalCP / 100);
    }
    
    return rewards;
}

/**
 * Try to steal fruits from target
 */
async function tryStealFruits(targetId, attackerId) {
    const stolenFruits = [];
    
    try {
        const targetFruits = await DatabaseManager.getUserDevilFruits(targetId);
        
        for (let i = 0; i < RAID_CONFIG.MAX_FRUIT_DROPS && stolenFruits.length < RAID_CONFIG.MAX_FRUIT_DROPS; i++) {
            if (targetFruits.length === 0) break;
            
            const randomFruit = targetFruits[Math.floor(Math.random() * targetFruits.length)];
            const dropChance = RAID_CONFIG.FRUIT_DROP_CHANCES[randomFruit.fruit_rarity] || 0.1;
            
            if (Math.random() < dropChance) {
                await transferFruit(randomFruit, targetId, attackerId);
                stolenFruits.push({
                    name: randomFruit.fruit_name,
                    rarity: randomFruit.fruit_rarity,
                    emoji: RARITY_EMOJIS[randomFruit.fruit_rarity] || '⚪'
                });
                
                const index = targetFruits.indexOf(randomFruit);
                if (index > -1) {
                    targetFruits.splice(index, 1);
                }
            }
        }
    } catch (error) {
        console.error('Error stealing fruits:', error);
    }
    
    return stolenFruits;
}

/**
 * Transfer fruit between users
 */
async function transferFruit(fruit, fromUserId, toUserId) {
    try {
        await DatabaseManager.query(`
            DELETE FROM user_devil_fruits 
            WHERE user_id = $1 AND fruit_id = $2 
            AND id = (
                SELECT id FROM user_devil_fruits 
                WHERE user_id = $1 AND fruit_id = $2 
                LIMIT 1
            )
        `, [fromUserId, fruit.fruit_id]);
        
        await DatabaseManager.addDevilFruit(toUserId, {
            id: fruit.fruit_id,
            name: fruit.fruit_name,
            type: fruit.fruit_type,
            rarity: fruit.fruit_rarity,
            multiplier: (fruit.base_cp / 100).toFixed(1),
            description: fruit.fruit_description
        });
        
        await Promise.all([
            DatabaseManager.recalculateUserCP(fromUserId),
            DatabaseManager.recalculateUserCP(toUserId)
        ]);
        
    } catch (error) {
        console.error('Error transferring fruit:', error);
    }
}

/**
 * Get participant data for battle
 */
async function getParticipantData(userId) {
    const user = await DatabaseManager.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const fruits = await DatabaseManager.getUserDevilFruits(userId);
    
    const battleFruits = fruits.map(fruit => ({
        id: fruit.fruit_id,
        name: fruit.fruit_name,
        type: fruit.fruit_type,
        rarity: fruit.fruit_rarity,
        description: fruit.fruit_description,
        totalCP: fruit.total_cp,
        baseCP: fruit.base_cp,
        emoji: RARITY_EMOJIS[fruit.fruit_rarity] || '⚪',
        maxHP: Math.floor(fruit.total_cp * 1.2),
        currentHP: Math.floor(fruit.total_cp * 1.2)
    })).sort((a, b) => b.totalCP - a.totalCP).slice(0, 5);
    
    return {
        userId,
        username: user.username,
        level: user.level,
        totalCP: user.total_cp,
        berries: user.berries,
        fruits: battleFruits
    };
}

/**
 * Calculate max HP based on CP and level
 */
function calculateMaxHP(totalCP, level) {
    const baseHP = 1000;
    const levelBonus = level * 50;
    const cpBonus = Math.floor(totalCP * 0.8);
    return baseHP + levelBonus + cpBonus;
}

/**
 * Reduce skill cooldowns
 */
function reduceCooldowns(player) {
    Object.keys(player.skillCooldowns).forEach(skill => {
        if (player.skillCooldowns[skill] > 0) {
            player.skillCooldowns[skill]--;
        }
    });
}

/**
 * Process status effects
 */
function processStatusEffects(player) {
    player.statusEffects = player.statusEffects.filter(effect => {
        if (effect.type === 'burn' || effect.type === 'poison') {
            const damage = effect.damage || 5;
            player.currentHP = Math.max(0, player.currentHP - damage);
        }
        
        effect.duration--;
        return effect.duration > 0;
    });
}

/**
 * Check if battle has ended
 */
function checkBattleEnd(raidState) {
    if (raidState.attacker.currentHP <= 0) {
        return { ended: true, winner: raidState.target.userId, reason: 'Decisive Victory' };
    }
    if (raidState.target.currentHP <= 0) {
        return { ended: true, winner: raidState.attacker.userId, reason: 'Decisive Victory' };
    }
    
    if (raidState.turn >= RAID_CONFIG.MAX_BATTLE_TURNS) {
        const attackerHP = raidState.attacker.currentHP / raidState.attacker.maxHP;
        const targetHP = raidState.target.currentHP / raidState.target.maxHP;
        
        if (attackerHP > targetHP) {
            return { ended: true, winner: raidState.attacker.userId, reason: 'Time Limit Victory' };
        } else {
            return { ended: true, winner: raidState.target.userId, reason: 'Time Limit Victory' };
        }
    }
    
    return { ended: false };
}

/**
 * Validate raid requirements
 */
async function validateRaid(attackerId, target) {
    if (!target || target.bot) {
        return { valid: false, reason: 'Cannot raid bots or invalid users!' };
    }
    
    if (attackerId === target.id) {
        return { valid: false, reason: 'Cannot raid yourself!' };
    }
    
    const lastRaid = raidCooldowns.get(attackerId);
    if (lastRaid && (Date.now() - lastRaid) < RAID_CONFIG.COOLDOWN_TIME) {
        const remainingTime = Math.ceil((RAID_CONFIG.COOLDOWN_TIME - (Date.now() - lastRaid)) / 1000);
        return { valid: false, reason: `Raid cooldown active! Wait ${remainingTime} more seconds.` };
    }
    
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
 * Generate unique raid ID
 */
function generateRaidId() {
    return `raid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
