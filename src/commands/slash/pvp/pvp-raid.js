// src/commands/slash/pvp/pvp-raid.js - FIXED: Complete PvP Raid Command
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const EconomyService = require('../../../services/EconomyService');
const { getSkillData } = require('../../../data/DevilFruitSkills');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');

// Enhanced raid configuration
const RAID_CONFIG = {
    COOLDOWN_TIME: 300000, // 5 minutes between raids
    MIN_CP_REQUIRED: 500, // Minimum CP to participate
    BERRY_STEAL_PERCENTAGE: 0.15, // 15% of opponent's berries
    FRUIT_DROP_CHANCES: {
        'divine': 0.01, 'mythical': 0.02, 'legendary': 0.05,
        'epic': 0.08, 'rare': 0.12, 'uncommon': 0.18, 'common': 0.25
    },
    MAX_FRUIT_DROPS: 3,
    MAX_BATTLE_TURNS: 20,
    TURN_DELAY: 3000, // 3 seconds between turns for animation
    HP_BAR_LENGTH: 20 // Length of HP bar in characters
};

// Active raid cooldowns and battles
const raidCooldowns = new Map();
const activeBattles = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid')
        .setDescription('⚔️ Launch an enhanced raid with turn-based combat against another pirate!')
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
            
            // Get enhanced participant data with skills
            const [attackerData, targetData] = await Promise.all([
                getEnhancedParticipantData(attacker.id),
                getEnhancedParticipantData(target.id)
            ]);
            
            // Start the enhanced turn-based battle
            const battleResult = await executeEnhancedBattle(interaction, attackerData, targetData);
            
            // Process rewards and penalties
            const rewards = await processRaidRewards(battleResult, attackerData, targetData);
            
            // Set raid cooldown
            raidCooldowns.set(attacker.id, Date.now());
            
            // Create final result embed
            const resultEmbed = await createDetailedResultEmbed(battleResult, rewards, attacker, target);
            
            // Add rematch button for winner
            const components = battleResult.winner === attacker.id ? 
                [createRematchButton(attacker.id, target.id)] : [];
            
            await interaction.editReply({ 
                embeds: [resultEmbed], 
                components 
            });
            
            // Setup button collector for rematch
            if (components.length > 0) {
                await setupRematchCollector(interaction, attacker.id, target.id);
            }
            
        } catch (error) {
            interaction.client.logger.error('Enhanced PvP Raid error:', error);
            
            const errorResponse = {
                embeds: [createErrorEmbed('An error occurred during the enhanced raid!')],
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
 * Get enhanced participant data with devil fruit skills
 */
async function getEnhancedParticipantData(userId) {
    const user = await DatabaseManager.getUser(userId);
    const fruits = await DatabaseManager.getUserDevilFruits(userId);
    
    // Get the best fruit for battle (highest CP with skill data)
    let bestFruit = null;
    let highestCP = 0;
    
    for (const fruit of fruits) {
        const totalCP = fruit.total_cp || fruit.base_cp || 100;
        if (totalCP > highestCP) {
            highestCP = totalCP;
            bestFruit = fruit;
        }
    }
    
    // Get skill data for the best fruit
    let skillData = null;
    if (bestFruit) {
        skillData = getSkillData(bestFruit.fruit_id, bestFruit.fruit_rarity);
        
        // Fallback skill if none found
        if (!skillData) {
            skillData = {
                name: `${bestFruit.fruit_name} Power`,
                damage: Math.floor(50 + (highestCP / 20)),
                cooldown: 2,
                effect: 'basic_attack',
                description: `Harness the power of the ${bestFruit.fruit_name}`,
                type: 'attack',
                range: 'single'
            };
        }
    }
    
    return {
        userId,
        username: user.username,
        totalCP: user.total_cp,
        berries: user.berries,
        level: user.level,
        bestFruit,
        skillData,
        fruits: fruits.length,
        uniqueFruits: new Set(fruits.map(f => f.fruit_id)).size,
        // Battle stats
        maxHP: calculateMaxHP(user.total_cp, user.level),
        currentHP: 0, // Will be set to maxHP at battle start
        statusEffects: [],
        skillCooldowns: {},
        lastAction: null
    };
}

/**
 * Calculate maximum HP based on CP and level
 */
function calculateMaxHP(totalCP, level) {
    const baseHP = 800;
    const levelBonus = level * 40;
    const cpBonus = Math.floor(totalCP * 0.6);
    return baseHP + levelBonus + cpBonus;
}

/**
 * Execute enhanced turn-based battle with animations
 */
async function executeEnhancedBattle(interaction, attackerData, targetData) {
    // Initialize battle state
    const battleId = `raid_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    attackerData.currentHP = attackerData.maxHP;
    targetData.currentHP = targetData.maxHP;
    
    const battleState = {
        id: battleId,
        attacker: attackerData,
        target: targetData,
        turn: 1,
        currentPlayer: 'attacker',
        battleLog: [],
        startTime: Date.now()
    };
    
    activeBattles.set(battleId, battleState);
    
    // Send initial battle setup
    await sendBattleStartMessage(interaction, battleState);
    
    // Execute turn-based combat
    while (battleState.turn <= RAID_CONFIG.MAX_BATTLE_TURNS) {
        const currentPlayerData = battleState.currentPlayer === 'attacker' 
            ? battleState.attacker 
            : battleState.target;
        const opponentData = battleState.currentPlayer === 'attacker' 
            ? battleState.target 
            : battleState.attacker;
        
        // Execute turn
        const turnResult = await executeTurn(battleState, currentPlayerData, opponentData);
        
        // Update battle embed with turn results
        await updateBattleMessage(interaction, battleState, turnResult);
        
        // Check for battle end
        if (battleState.attacker.currentHP <= 0 || battleState.target.currentHP <= 0) {
            break;
        }
        
        // Switch turns and increment turn counter
        battleState.currentPlayer = battleState.currentPlayer === 'attacker' ? 'target' : 'attacker';
        battleState.turn++;
        
        // Add delay for dramatic effect
        await new Promise(resolve => setTimeout(resolve, RAID_CONFIG.TURN_DELAY));
    }
    
    // Determine winner and create final result
    const winner = determineBattleWinner(battleState);
    const finalResult = {
        battleId,
        attacker: battleState.attacker,
        target: battleState.target,
        winner: winner.id,
        reason: winner.reason,
        totalTurns: battleState.turn,
        battleLog: battleState.battleLog,
        finalHP: {
            attacker: battleState.attacker.currentHP,
            target: battleState.target.currentHP
        }
    };
    
    activeBattles.delete(battleId);
    return finalResult;
}

/**
 * Send initial battle start message
 */
async function sendBattleStartMessage(interaction, battleState) {
    const embed = createBattleEmbed(battleState, {
        type: 'battle_start',
        message: '⚔️ **Enhanced Raid Battle Begins!**',
        details: 'Turn-based combat with devil fruit skills!'
    });
    
    await interaction.editReply({ embeds: [embed] });
}

/**
 * Execute a single turn of combat
 */
async function executeTurn(battleState, currentPlayer, opponent) {
    // Process status effects
    processStatusEffects(currentPlayer);
    
    // Check if player is disabled
    if (isPlayerDisabled(currentPlayer)) {
        return {
            type: 'disabled',
            message: `${currentPlayer.username} is disabled and skips their turn!`,
            damage: 0
        };
    }
    
    // Determine action (80% skill use, 20% basic attack if skill on cooldown)
    const useSkill = currentPlayer.skillData && 
                    !isSkillOnCooldown(currentPlayer, currentPlayer.skillData.name) && 
                    Math.random() > 0.2;
    
    if (useSkill) {
        return executeSkillAttack(battleState, currentPlayer, opponent);
    } else {
        return executeBasicAttack(battleState, currentPlayer, opponent);
    }
}

/**
 * Execute skill attack with enhanced effects
 */
function executeSkillAttack(battleState, attacker, defender) {
    const skill = attacker.skillData;
    
    // Calculate skill damage
    let damage = skill.damage || 100;
    const cpMultiplier = Math.min(attacker.totalCP / defender.totalCP, 2.0);
    const levelDiff = Math.max(0.5, 1 + (attacker.level - defender.level) * 0.05);
    
    damage = Math.floor(damage * cpMultiplier * levelDiff);
    
    // Apply random variance
    const variance = 0.8 + (Math.random() * 0.4);
    damage = Math.floor(damage * variance);
    
    // Check for critical hit
    const critChance = 0.15 + (attacker.level / 1000);
    const isCritical = Math.random() < critChance;
    if (isCritical) {
        damage = Math.floor(damage * 1.8);
    }
    
    // Apply damage
    defender.currentHP = Math.max(0, defender.currentHP - damage);
    
    // Set skill cooldown
    setSkillCooldown(attacker, skill.name, skill.cooldown || 2);
    
    // Apply skill effects
    const effectResults = applySkillEffects(skill, attacker, defender);
    
    // Create turn result
    const result = {
        type: 'skill_attack',
        skillName: skill.name,
        damage,
        isCritical,
        message: createSkillAttackMessage(attacker, defender, skill, damage, isCritical),
        effects: effectResults
    };
    
    // Log the action
    battleState.battleLog.push(result);
    attacker.lastAction = result;
    
    return result;
}

/**
 * Execute basic attack
 */
function executeBasicAttack(battleState, attacker, defender) {
    // Calculate basic attack damage
    let damage = 60 + Math.floor(attacker.totalCP / 50);
    const levelDiff = Math.max(0.5, 1 + (attacker.level - defender.level) * 0.03);
    
    damage = Math.floor(damage * levelDiff);
    
    // Apply random variance
    const variance = 0.7 + (Math.random() * 0.6);
    damage = Math.floor(damage * variance);
    
    // Check for critical hit
    const critChance = 0.1;
    const isCritical = Math.random() < critChance;
    if (isCritical) {
        damage = Math.floor(damage * 1.5);
    }
    
    // Apply damage
    defender.currentHP = Math.max(0, defender.currentHP - damage);
    
    const result = {
        type: 'basic_attack',
        damage,
        isCritical,
        message: createBasicAttackMessage(attacker, defender, damage, isCritical)
    };
    
    battleState.battleLog.push(result);
    attacker.lastAction = result;
    
    return result;
}

/**
 * Create skill attack message with dramatic flair
 */
function createSkillAttackMessage(attacker, defender, skill, damage, isCritical) {
    const fruitEmoji = RARITY_EMOJIS[attacker.bestFruit?.fruit_rarity] || '🍈';
    const critText = isCritical ? ' **CRITICAL HIT!** 💥' : '';
    
    return `${fruitEmoji} **${attacker.username}** unleashes **${skill.name}**!\n` +
           `✨ *${skill.description}*\n` +
           `💀 Deals **${damage}** damage to ${defender.username}${critText}`;
}

/**
 * Create basic attack message
 */
function createBasicAttackMessage(attacker, defender, damage, isCritical) {
    const critText = isCritical ? ' **CRITICAL HIT!** 💥' : '';
    return `⚔️ **${attacker.username}** attacks ${defender.username} for **${damage}** damage${critText}`;
}

/**
 * Apply skill effects (simplified for now, can be expanded)
 */
function applySkillEffects(skill, attacker, defender) {
    const effects = [];
    
    if (skill.effect) {
        switch (skill.effect) {
            case 'burn_damage':
                addStatusEffect(defender, 'burn', 3, 0.1);
                effects.push(`🔥 ${defender.username} is burning!`);
                break;
            case 'freeze_effect':
                addStatusEffect(defender, 'frozen', 1, 0);
                effects.push(`❄️ ${defender.username} is frozen!`);
                break;
            case 'poison_dot':
                addStatusEffect(defender, 'poison', 2, 0.15);
                effects.push(`☠️ ${defender.username} is poisoned!`);
                break;
            case 'self_heal':
                const healAmount = Math.floor(attacker.maxHP * 0.15);
                attacker.currentHP = Math.min(attacker.maxHP, attacker.currentHP + healAmount);
                effects.push(`💚 ${attacker.username} heals for ${healAmount} HP!`);
                break;
        }
    }
    
    return effects;
}

/**
 * Add status effect to player
 */
function addStatusEffect(player, type, duration, damagePercent) {
    player.statusEffects.push({
        type,
        duration,
        damagePercent,
        appliedTurn: Date.now()
    });
}

/**
 * Process status effects at turn start
 */
function processStatusEffects(player) {
    player.statusEffects = player.statusEffects.filter(effect => {
        let keepEffect = true;
        
        switch (effect.type) {
            case 'burn':
            case 'poison':
                const dotDamage = Math.floor(player.maxHP * effect.damagePercent);
                player.currentHP = Math.max(0, player.currentHP - dotDamage);
                break;
        }
        
        effect.duration--;
        if (effect.duration <= 0) {
            keepEffect = false;
        }
        
        return keepEffect;
    });
}

/**
 * Check if player is disabled by status effects
 */
function isPlayerDisabled(player) {
    return player.statusEffects.some(effect => effect.type === 'frozen' || effect.type === 'stunned');
}

/**
 * Set skill cooldown
 */
function setSkillCooldown(player, skillName, turns) {
    player.skillCooldowns[skillName] = turns;
}

/**
 * Check if skill is on cooldown
 */
function isSkillOnCooldown(player, skillName) {
    return (player.skillCooldowns[skillName] || 0) > 0;
}

/**
 * Reduce all cooldowns by 1
 */
function reduceCooldowns(player) {
    Object.keys(player.skillCooldowns).forEach(skill => {
        if (player.skillCooldowns[skill] > 0) {
            player.skillCooldowns[skill]--;
        }
    });
}

/**
 * Create professional single-line HP bar
 */
function createProfessionalHPBar(currentHP, maxHP, length = 15) {
    const hpPercent = Math.max(0, Math.min(1, currentHP / maxHP));
    const filledBars = Math.floor(hpPercent * length);
    const emptyBars = length - filledBars;
    
    // Professional color coding
    let barColor;
    if (hpPercent > 0.6) {
        barColor = '🟢'; // Green for healthy
    } else if (hpPercent > 0.3) {
        barColor = '🟡'; // Yellow for wounded
    } else {
        barColor = '🔴'; // Red for critical
    }
    
    const filled = barColor.repeat(filledBars);
    const empty = '⬛'.repeat(emptyBars);
    
    return `${filled}${empty}`;
}

/**
 * Create professional battle embed with clean layout
 */
function createBattleEmbed(battleState, turnResult = null) {
    const { attacker, target, turn } = battleState;
    
    // Calculate HP percentages
    const attackerHPPercent = Math.round((attacker.currentHP / attacker.maxHP) * 100);
    const targetHPPercent = Math.round((target.currentHP / target.maxHP) * 100);
    
    // Create professional HP bars
    const attackerHPBar = createProfessionalHPBar(attacker.currentHP, attacker.maxHP, 15);
    const targetHPBar = createProfessionalHPBar(target.currentHP, target.maxHP, 15);
    
    // Professional status display
    const attackerStatus = createProfessionalPlayerStatus(attacker);
    const targetStatus = createProfessionalPlayerStatus(target);
    
    const embed = new EmbedBuilder()
        .setTitle('⚔️ ENHANCED RAID BATTLE')
        .setColor(RARITY_COLORS.legendary)
        .setDescription(createBattleHeader(battleState, turnResult))
        .addFields(
            {
                name: '🏴‍☠️ ATTACKER',
                value: `**${attacker.username}**\n${attackerHPBar}\n**HP:** ${attacker.currentHP}/${attacker.maxHP} (${attackerHPPercent}%)\n${attackerStatus}`,
                inline: true
            },
            {
                name: '🛡️ DEFENDER', 
                value: `**${target.username}**\n${targetHPBar}\n**HP:** ${target.currentHP}/${target.maxHP} (${targetHPPercent}%)\n${targetStatus}`,
                inline: true
            },
            {
                name: '📊 BATTLE STATUS',
                value: `**Turn:** ${turn}/${RAID_CONFIG.MAX_BATTLE_TURNS}\n**Active:** ${battleState.currentPlayer === 'attacker' ? attacker.username : target.username}\n**Duration:** ${Math.floor((Date.now() - battleState.startTime) / 1000)}s`,
                inline: true
            }
        )
        .setTimestamp();
    
    // Add battle log as separate field if there's recent action
    if (turnResult && battleState.battleLog && battleState.battleLog.length > 0) {
        embed.addFields({
            name: '📜 BATTLE LOG',
            value: createProfessionalBattleLog(battleState),
            inline: false
        });
    }
    
    embed.setFooter({ 
        text: `Battle ID: ${battleState.id} | Enhanced Combat System v2.0` 
    });
    
    return embed;
}

/**
 * Create professional player status (compact format)
 */
function createProfessionalPlayerStatus(player) {
    let status = '';
    
    // Devil Fruit info
    if (player.bestFruit && player.skillData) {
        const fruitEmoji = RARITY_EMOJIS[player.bestFruit.fruit_rarity] || '🍈';
        const skillCooldown = player.skillCooldowns[player.skillData.name] || 0;
        const skillStatus = skillCooldown > 0 ? `🔄${skillCooldown}` : '✅';
        
        status += `${fruitEmoji} **${player.bestFruit.fruit_name}**\n`;
        status += `⚡ ${player.skillData.name} ${skillStatus}\n`;
        status += `💪 **${player.totalCP.toLocaleString()}** CP`;
    }
    
    // Status effects (compact)
    if (player.statusEffects && player.statusEffects.length > 0) {
        const effects = player.statusEffects.map(effect => {
            const emoji = getStatusEffectEmoji(effect.type);
            return `${emoji}${effect.duration}`;
        }).join(' ');
        status += `\n🔮 ${effects}`;
    }
    
    return status;
}

/**
 * Create battle header with current action
 */
function createBattleHeader(battleState, turnResult) {
    if (!turnResult) {
        return '⚡ **BATTLE IN PROGRESS** ⚡\n*Turn-based combat with Devil Fruit abilities*';
    }
    
    let header = '';
    
    // Main action description
    if (turnResult.type === 'skill_attack') {
        const skillEmoji = '✨';
        header += `${skillEmoji} **SKILL USED:** ${turnResult.skillName}\n`;
        header += `💥 **DAMAGE:** ${turnResult.damage}${turnResult.isCritical ? ' (CRITICAL!)' : ''}\n`;
    } else if (turnResult.type === 'basic_attack') {
        header += `⚔️ **BASIC ATTACK**\n`;
        header += `💥 **DAMAGE:** ${turnResult.damage}${turnResult.isCritical ? ' (CRITICAL!)' : ''}\n`;
    }
    
    // Additional effects
    if (turnResult.effects && turnResult.effects.length > 0) {
        header += `🔮 **EFFECTS:** ${turnResult.effects.join(', ')}\n`;
    }
    
    return header || '*Preparing for combat...*';
}

/**
 * Create professional battle log (last 3 actions)
 */
function createProfessionalBattleLog(battleState) {
    if (!battleState.battleLog || battleState.battleLog.length === 0) {
        return '*No actions yet*';
    }
    
    // Get last 3 actions for compact display
    const recentActions = battleState.battleLog.slice(-3);
    
    return recentActions.map((action, index) => {
        const actionNumber = battleState.battleLog.length - recentActions.length + index + 1;
        
        // Format action based on type
        let actionText = '';
        
        if (action.type === 'skill_attack') {
            const critText = action.isCritical ? ' 💥' : '';
            actionText = `**${action.skillName}** → ${action.damage} DMG${critText}`;
        } else if (action.type === 'basic_attack') {
            const critText = action.isCritical ? ' 💥' : '';
            actionText = `**Basic Attack** → ${action.damage} DMG${critText}`;
        } else {
            actionText = action.message || 'Unknown action';
        }
        
        return `\`${actionNumber}.\` ${actionText}`;
    }).join('\n');
}

/**
 * Enhanced turn execution with better logging
 */
async function executeTurn(battleState, currentPlayer, opponent) {
    // Process status effects first
    const statusResults = processStatusEffectsWithResults(currentPlayer);
    
    // Check if player is disabled
    if (isPlayerDisabled(currentPlayer)) {
        return {
            type: 'disabled',
            message: `${currentPlayer.username} is disabled and skips their turn!`,
            damage: 0,
            statusResults
        };
    }
    
    // Determine action (80% skill use, 20% basic attack if skill on cooldown)
    const useSkill = currentPlayer.skillData && 
                    !isSkillOnCooldown(currentPlayer, currentPlayer.skillData.name) && 
                    Math.random() > 0.2;
    
    let result;
    if (useSkill) {
        result = executeEnhancedSkillAttack(battleState, currentPlayer, opponent);
    } else {
        result = executeEnhancedBasicAttack(battleState, currentPlayer, opponent);
    }
    
    // Add status effect results to the main result
    result.statusResults = statusResults;
    
    return result;
}

/**
 * Enhanced skill attack with better data
 */
function executeEnhancedSkillAttack(battleState, attacker, defender) {
    const skill = attacker.skillData;
    
    // Calculate skill damage
    let damage = skill.damage || 100;
    const cpMultiplier = Math.min(attacker.totalCP / defender.totalCP, 2.0);
    const levelDiff = Math.max(0.5, 1 + (attacker.level - defender.level) * 0.05);
    
    damage = Math.floor(damage * cpMultiplier * levelDiff);
    
    // Apply random variance
    const variance = 0.8 + (Math.random() * 0.4);
    damage = Math.floor(damage * variance);
    
    // Check for critical hit
    const critChance = 0.15 + (attacker.level / 1000);
    const isCritical = Math.random() < critChance;
    if (isCritical) {
        damage = Math.floor(damage * 1.8);
    }
    
    // Apply damage
    const originalHP = defender.currentHP;
    defender.currentHP = Math.max(0, defender.currentHP - damage);
    const actualDamage = originalHP - defender.currentHP;
    
    // Set skill cooldown
    setSkillCooldown(attacker, skill.name, skill.cooldown || 2);
    
    // Apply skill effects
    const effectResults = applySkillEffectsWithResults(skill, attacker, defender);
    
    // Create enhanced result
    const result = {
        type: 'skill_attack',
        skillName: skill.name,
        damage: actualDamage,
        isCritical,
        effects: effectResults,
        attacker: attacker.username,
        defender: defender.username,
        timestamp: Date.now()
    };
    
    return result;
}

/**
 * Enhanced basic attack with better data
 */
function executeEnhancedBasicAttack(battleState, attacker, defender) {
    // Calculate basic attack damage
    let damage = 60 + Math.floor(attacker.totalCP / 50);
    const levelDiff = Math.max(0.5, 1 + (attacker.level - defender.level) * 0.03);
    
    damage = Math.floor(damage * levelDiff);
    
    // Apply random variance
    const variance = 0.7 + (Math.random() * 0.6);
    damage = Math.floor(damage * variance);
    
    // Check for critical hit
    const critChance = 0.1;
    const isCritical = Math.random() < critChance;
    if (isCritical) {
        damage = Math.floor(damage * 1.5);
    }
    
    // Apply damage
    const originalHP = defender.currentHP;
    defender.currentHP = Math.max(0, defender.currentHP - damage);
    const actualDamage = originalHP - defender.currentHP;
    
    const result = {
        type: 'basic_attack',
        damage: actualDamage,
        isCritical,
        attacker: attacker.username,
        defender: defender.username,
        timestamp: Date.now()
    };
    
    return result;
}

/**
 * Process status effects with detailed results
 */
function processStatusEffectsWithResults(player) {
    const results = [];
    
    player.statusEffects = player.statusEffects.filter(effect => {
        let keepEffect = true;
        
        switch (effect.type) {
            case 'burn':
            case 'poison':
                const dotDamage = Math.floor(player.maxHP * effect.damagePercent);
                const originalHP = player.currentHP;
                player.currentHP = Math.max(0, player.currentHP - dotDamage);
                const actualDamage = originalHP - player.currentHP;
                
                if (actualDamage > 0) {
                    results.push({
                        type: effect.type,
                        damage: actualDamage,
                        message: `${getStatusEffectEmoji(effect.type)} ${actualDamage} DMG`
                    });
                }
                break;
            case 'regen':
                const healAmount = Math.floor(player.maxHP * 0.05);
                player.currentHP = Math.min(player.maxHP, player.currentHP + healAmount);
                results.push({
                    type: 'regen',
                    heal: healAmount,
                    message: `💚 +${healAmount} HP`
                });
                break;
        }
        
        effect.duration--;
        if (effect.duration <= 0) {
            keepEffect = false;
            results.push({
                type: 'effect_expired',
                effectType: effect.type,
                message: `${getStatusEffectEmoji(effect.type)} expired`
            });
        }
        
        return keepEffect;
    });
    
    return results;
}

/**
 * Apply skill effects with detailed results
 */
function applySkillEffectsWithResults(skill, attacker, defender) {
    const effects = [];
    
    if (skill.effect) {
        switch (skill.effect) {
            case 'burn_damage':
                addStatusEffect(defender, 'burn', 3, 0.1);
                effects.push('🔥 Burning');
                break;
            case 'freeze_effect':
                addStatusEffect(defender, 'frozen', 1, 0);
                effects.push('❄️ Frozen');
                break;
            case 'poison_dot':
                addStatusEffect(defender, 'poison', 2, 0.15);
                effects.push('☠️ Poisoned');
                break;
            case 'self_heal':
                const healAmount = Math.floor(attacker.maxHP * 0.15);
                attacker.currentHP = Math.min(attacker.maxHP, attacker.currentHP + healAmount);
                effects.push(`💚 +${healAmount} HP`);
                break;
        }
    }
    
    return effects;
}

/**
 * Get emoji for status effects
 */
function getStatusEffectEmoji(effectType) {
    const emojis = {
        'burn': '🔥',
        'poison': '☠️',
        'frozen': '❄️',
        'stunned': '⚡',
        'regen': '💚'
    };
    return emojis[effectType] || '🔮';
}

/**
 * Update battle message with professional layout
 */
async function updateBattleMessage(interaction, battleState, turnResult) {
    try {
        // Reduce cooldowns for both players
        reduceCooldowns(battleState.attacker);
        reduceCooldowns(battleState.target);
        
        // Add to battle log
        if (turnResult) {
            battleState.battleLog.push(turnResult);
            
            // Keep only last 10 actions to prevent embed from getting too long
            if (battleState.battleLog.length > 10) {
                battleState.battleLog = battleState.battleLog.slice(-10);
            }
        }
        
        const embed = createBattleEmbed(battleState, turnResult);
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error updating professional battle message:', error);
    }
}

/**
 * Create professional final results embed
 */
async function createDetailedResultEmbed(battleResult, rewards, attacker, target) {
    const { winner, reason, totalTurns, finalHP } = battleResult;
    
    let color = RARITY_COLORS.common;
    let title = '⚔️ BATTLE COMPLETE';
    let resultIcon = '⚖️';
    
    if (winner === attacker.id) {
        color = RARITY_COLORS.legendary;
        title = '🏆 RAID VICTORY';
        resultIcon = '👑';
    } else if (winner === target.id) {
        color = RARITY_COLORS.epic;
        title = '🛡️ RAID DEFENDED';
        resultIcon = '🛡️';
    }
    
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setDescription(`${resultIcon} **${getResultDescription(winner, attacker, target, reason)}**`)
        .addFields(
            {
                name: '📊 BATTLE STATISTICS',
                value: [
                    `**Duration:** ${totalTurns} turns`,
                    `**Final HP:** ${attacker.username}: ${finalHP.attacker} | ${target.username}: ${finalHP.target}`,
                    `**Victory Condition:** ${getReasonText(reason)}`,
                    `**Combat System:** Enhanced Turn-Based`
                ].join('\n'),
                inline: false
            }
        );
    
    // Add detailed battle summary
    const skillSummary = createSkillUsageSummary(battleResult);
    if (skillSummary) {
        embed.addFields({
            name: '⚡ COMBAT SUMMARY',
            value: skillSummary,
            inline: false
        });
    }
    
    // Add rewards section if any
    if (rewards && (rewards.berries !== 0 || rewards.fruitsStolen.length > 0)) {
        let rewardsText = '';
        
        if (rewards.berries > 0) {
            rewardsText += `💰 **${rewards.berries.toLocaleString()}** berries stolen\n`;
        } else if (rewards.berries < 0) {
            rewardsText += `💸 **${Math.abs(rewards.berries).toLocaleString()}** defense bonus\n`;
        }
        
        if (rewards.fruitsStolen.length > 0) {
            rewardsText += `🍈 **${rewards.fruitsStolen.length}** devil fruits stolen\n`;
            rewards.fruitsStolen.forEach(fruit => {
                const emoji = RARITY_EMOJIS[fruit.fruit_rarity] || '⚪';
                rewardsText += `   ${emoji} ${fruit.fruit_name}\n`;
            });
        }
        
        if (rewards.experienceGained > 0) {
            rewardsText += `⭐ **+${rewards.experienceGained}** experience gained`;
        }
        
        if (rewardsText) {
            embed.addFields({
                name: '🎁 REWARDS',
                value: rewardsText,
                inline: false
            });
        }
    }
    
    embed.setFooter({ text: 'Enhanced Combat System | Professional PvP' })
         .setTimestamp();
    
    return embed;
}

/**
 * Get result description
 */
function getResultDescription(winner, attacker, target, reason) {
    if (!winner) {
        return `Draw between ${attacker.username} and ${target.username}`;
    }
    
    const winnerName = winner === attacker.id ? attacker.username : target.username;
    const loserName = winner === attacker.id ? target.username : attacker.username;
    
    switch (reason) {
        case 'victory':
            return `${winnerName} defeats ${loserName}`;
        case 'time_limit':
            return `${winnerName} wins by HP advantage`;
        default:
            return `${winnerName} emerges victorious`;
    }
}

/**
 * Determine battle winner
 */
function determineBattleWinner(battleState) {
    const { attacker, target } = battleState;
    
    if (attacker.currentHP <= 0 && target.currentHP <= 0) {
        return { id: null, reason: 'mutual_destruction' };
    } else if (attacker.currentHP <= 0) {
        return { id: target.userId, reason: 'victory' };
    } else if (target.currentHP <= 0) {
        return { id: attacker.userId, reason: 'victory' };
    } else {
        // Time limit reached - winner has more HP percentage
        const attackerPercent = attacker.currentHP / attacker.maxHP;
        const targetPercent = target.currentHP / target.maxHP;
        
        if (attackerPercent > targetPercent) {
            return { id: attacker.userId, reason: 'time_limit' };
        } else if (targetPercent > attackerPercent) {
            return { id: target.userId, reason: 'time_limit' };
        } else {
            return { id: null, reason: 'draw' };
        }
    }
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
            await EconomyService.transferBerries(targetData.userId, attackerData.userId, berriesStolen, 'enhanced_raid_victory');
            rewards.berries = berriesStolen;
        }
        
        // Try to steal fruits
        const stolenFruits = await stealRandomFruits(targetData, attackerData.userId);
        rewards.fruitsStolen = stolenFruits;
        
        // Experience for winner
        rewards.experienceGained = Math.floor(targetData.totalCP / 100);
        
    } else if (battleResult.winner === targetData.userId) {
        // Defender victory bonus
        const defenseBonus = Math.floor(attackerData.berries * 0.05);
        
        if (defenseBonus > 0) {
            await EconomyService.addBerries(targetData.userId, defenseBonus, 'enhanced_raid_defense');
            rewards.berries = -defenseBonus;
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
    
    // Get actual fruits from database
    const targetFruits = await DatabaseManager.getUserDevilFruits(targetData.userId);
    if (targetFruits.length === 0) return stolenFruits;
    
    // Sort by rarity (easier to steal common fruits)
    const availableFruits = [...targetFruits].sort((a, b) => {
        const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5, 'mythical': 6, 'divine': 7 };
        return (rarityOrder[a.fruit_rarity] || 1) - (rarityOrder[b.fruit_rarity] || 1);
    });
    
    for (let attempt = 0; attempt < RAID_CONFIG.MAX_FRUIT_DROPS && availableFruits.length > 0 && stolenFruits.length < RAID_CONFIG.MAX_FRUIT_DROPS; attempt++) {
        const randomFruit = availableFruits[Math.floor(Math.random() * availableFruits.length)];
        const rarity = randomFruit.fruit_rarity || 'common';
        const dropChance = RAID_CONFIG.FRUIT_DROP_CHANCES[rarity] || 0.1;
        
        if (Math.random() < dropChance) {
            try {
                await transferFruit(randomFruit, targetData.userId, attackerId);
                stolenFruits.push(randomFruit);
                
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
 * Get reason text for battle end
 */
function getReasonText(reason) {
    switch (reason) {
        case 'victory': return 'Decisive Victory';
        case 'time_limit': return 'Time Limit Reached';
        case 'mutual_destruction': return 'Mutual Destruction';
        case 'draw': return 'Perfect Draw';
        default: return 'Battle Complete';
    }
}

/**
 * Create detailed final result embed
 */
async function createDetailedResultEmbed(battleResult, rewards, attacker, target) {
    const { winner, reason, totalTurns, battleLog, finalHP } = battleResult;
    
    let color = RARITY_COLORS.common;
    let title = '⚔️ Enhanced Raid Complete!';
    let description = '';
    
    if (winner === attacker.id) {
        color = RARITY_COLORS.legendary;
        title = '🏆 Raid Victory!';
        description = `**${attacker.username}** successfully raided **${target.username}** with enhanced combat!`;
    } else if (winner === target.id) {
        color = RARITY_COLORS.epic;
        title = '🛡️ Raid Defended!';
        description = `**${target.username}** successfully defended against **${attacker.username}**!`;
    } else {
        color = RARITY_COLORS.uncommon;
        title = '⚖️ Epic Battle Draw!';
        description = `An epic battle between **${attacker.username}** and **${target.username}** ended in a draw!`;
    }
    
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .addFields(
            {
                name: '⚔️ Battle Summary',
                value: [
                    `**Total Turns:** ${totalTurns}/${RAID_CONFIG.MAX_BATTLE_TURNS}`,
                    `**Final HP:** ${attacker.username}: ${finalHP.attacker}/${battleResult.attacker.maxHP} | ${target.username}: ${finalHP.target}/${battleResult.target.maxHP}`,
                    `**Battle Reason:** ${getReasonText(reason)}`,
                    `**Combat Type:** Enhanced Turn-based with Devil Fruit Skills`
                ].join('\n'),
                inline: false
            }
        );
    
    // Add skill usage summary
    const skillSummary = createSkillUsageSummary(battleResult);
    if (skillSummary) {
        embed.addFields({
            name: '⚡ Skills Used',
            value: skillSummary,
            inline: false
        });
    }
    
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
    
    embed.setFooter({ text: `Enhanced raid completed in ${totalTurns} turns with ${battleLog.length} actions` })
         .setTimestamp();
    
    return embed;
}

/**
 * Create skill usage summary
 */
function createSkillUsageSummary(battleResult) {
    const attackerSkills = new Map();
    const targetSkills = new Map();
    
    battleResult.battleLog.forEach(action => {
        if (action.type === 'skill_attack') {
            const isAttacker = action.message.includes(battleResult.attacker.username);
            const skillMap = isAttacker ? attackerSkills : targetSkills;
            const skillName = action.skillName;
            
            skillMap.set(skillName, (skillMap.get(skillName) || 0) + 1);
        }
    });
    
    let summary = '';
    
    if (attackerSkills.size > 0) {
        summary += `**${battleResult.attacker.username}:**\n`;
        attackerSkills.forEach((count, skill) => {
            const emoji = RARITY_EMOJIS[battleResult.attacker.bestFruit?.fruit_rarity] || '⚡';
            summary += `${emoji} ${skill} (${count}x)\n`;
        });
    }
    
    if (targetSkills.size > 0) {
        summary += `**${battleResult.target.username}:**\n`;
        targetSkills.forEach((count, skill) => {
            const emoji = RARITY_EMOJIS[battleResult.target.bestFruit?.fruit_rarity] || '⚡';
            summary += `${emoji} ${skill} (${count}x)\n`;
        });
    }
    
    return summary || null;
}

/**
 * Create error embed
 */
function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Enhanced Raid Failed')
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
                .setLabel('⚔️ Offer Enhanced Rematch')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄')
        );
}

/**
 * Setup rematch button collector
 */
async function setupRematchCollector(interaction, winnerId, loserId) {
    try {
        const message = await interaction.fetchReply();
        
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
                    content: `❌ Enhanced rematch not available: ${validation.reason}`,
                    ephemeral: true
                });
            }
            
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rematch_used')
                        .setLabel('⚔️ Enhanced Rematch Requested!')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
            
            await buttonInteraction.update({ components: [disabledRow] });
            
            await buttonInteraction.followUp({
                content: `🔄 **Enhanced rematch requested!** ${target.username} can now raid you back with \`/pvp-raid @${buttonInteraction.user.username}\` for another epic turn-based battle!`,
                ephemeral: false
            });
        });
        
        collector.on('end', async () => {
            try {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('rematch_expired')
                            .setLabel('⚔️ Enhanced Rematch Expired')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );
                
                await interaction.editReply({ components: [disabledRow] });
            } catch (error) {
                console.log('Failed to disable enhanced rematch button:', error.message);
            }
        });
        
    } catch (error) {
        console.error('Error setting up enhanced rematch collector:', error);
    }
}
