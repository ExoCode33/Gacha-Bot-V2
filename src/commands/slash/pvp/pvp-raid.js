// src/commands/slash/pvp/pvp-raid.js - FIXED: Syntax Error Corrected
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const EconomyService = require('../../../services/EconomyService');
const { getSkillData } = require('../../../data/DevilFruitSkills');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');

// Enhanced raid configuration - Turn 1 Protection + NO DRAWS
const RAID_CONFIG = {
    COOLDOWN_TIME: 300000, // 5 minutes between raids
    MIN_CP_REQUIRED: 500, // Minimum CP to participate
    BERRY_STEAL_PERCENTAGE: 0.15, // 15% of opponent's berries
    FRUIT_DROP_CHANCES: {
        'divine': 0.01, 'mythical': 0.02, 'legendary': 0.05,
        'epic': 0.08, 'rare': 0.12, 'uncommon': 0.18, 'common': 0.25
    },
    MAX_FRUIT_DROPS: 3,
    MAX_BATTLE_TURNS: 75, // Reduced for faster resolution
    MIN_BATTLE_TURNS: 5, // Minimum turns before early victory
    TURN_DELAY: 2500, // 2.5 seconds between turns
    DAMAGE_FLASH_DELAY: 800, // Damage flash duration
    HP_BAR_LENGTH: 20, // Length of HP bar in squares
    ANIMATION_FRAMES: 3, // Number of damage flash frames
    DECISIVE_HP_THRESHOLD: 0.25, // 25% HP difference for decisive victory
    // Turn 1 Protection System
    TURN_1_DAMAGE_REDUCTION: 0.8, // 80% damage reduction
    EARLY_TURN_DAMAGE_REDUCTION: 0.5, // 50% damage reduction turns 2-3
    MID_TURN_DAMAGE_REDUCTION: 0.25 // 25% damage reduction turns 4-5
};

// Active raid cooldowns, battles, and fruit selections
const raidCooldowns = new Map();
const activeBattles = new Map();
const activeSelections = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid')
        .setDescription('⚔️ Launch a raid with Turn 1 protection and guaranteed winner system!')
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
            
            // Check if attacker has enough fruits for selection
            const attackerFruits = await DatabaseManager.getUserDevilFruits(attacker.id);
            if (attackerFruits.length < 5) {
                return interaction.reply({
                    embeds: [createErrorEmbed(`You need at least 5 Devil Fruits to raid! You have ${attackerFruits.length}.`)],
                    ephemeral: true
                });
            }
            
            await interaction.deferReply();
            
            // Start fruit selection process for attacker
            await startRaidFruitSelection(interaction, attacker, target);
            
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
 * TURN 1 PROTECTION: Apply turn-based damage reduction
 */
function applyTurnBasedDamageReduction(damage, currentTurn) {
    let originalDamage = damage;
    
    // Turn 1: 80% damage reduction (only 20% damage gets through)
    if (currentTurn === 1) {
        damage = Math.floor(damage * (1 - RAID_CONFIG.TURN_1_DAMAGE_REDUCTION));
        console.log(`🛡️ Turn 1 protection: ${originalDamage} → ${damage} (80% reduced)`);
        return damage;
    }
    
    // Turn 2-3: 50% damage reduction
    if (currentTurn <= 3) {
        damage = Math.floor(damage * (1 - RAID_CONFIG.EARLY_TURN_DAMAGE_REDUCTION));
        console.log(`🛡️ Early turn protection: ${originalDamage} → ${damage} (50% reduced)`);
        return damage;
    }
    
    // Turn 4-5: 25% damage reduction
    if (currentTurn <= 5) {
        damage = Math.floor(damage * (1 - RAID_CONFIG.MID_TURN_DAMAGE_REDUCTION));
        console.log(`🛡️ Mid-early protection: ${originalDamage} → ${damage} (25% reduced)`);
        return damage;
    }
    
    // Turn 6+: Normal damage
    console.log(`⚔️ Full damage: ${originalDamage} (no protection)`);
    return damage;
}

/**
 * FIXED: Execute enhanced turn-based battle with protection
 */
async function executeVisualBattle(interaction, attackerData, targetData) {
    // Initialize battle state
    const battleId = `raid_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    // Calculate HP based on individual fruit power
    const attackerBestCP = Math.max(...attackerData.teamFruits.map(f => f.totalCP));
    const targetBestCP = Math.max(...targetData.teamFruits.map(f => f.totalCP));
    
    attackerData.currentHP = calculateMaxHP(attackerBestCP, attackerData.level);
    attackerData.maxHP = attackerData.currentHP;
    targetData.currentHP = calculateMaxHP(targetBestCP, targetData.level);
    targetData.maxHP = targetData.currentHP;
    
    // Set active fruit (index 0 = first fruit)
    attackerData.activeFruitIndex = 0;
    targetData.activeFruitIndex = 0;
    
    const battleState = {
        id: battleId,
        attacker: attackerData,
        target: targetData,
        turn: 1,
        currentPlayer: 'attacker',
        battleLog: [],
        startTime: Date.now(),
        waitingForAction: false
    };
    
    activeBattles.set(battleId, battleState);
    
    // Execute automatic battle with turn protection and no-draw guarantee
    const battleResult = await executeAutomaticBattleWithProtection(interaction, battleState);
    
    activeBattles.delete(battleId);
    return battleResult;
}

/**
 * FIXED: Execute automatic battle with protection system
 */
async function executeAutomaticBattleWithProtection(interaction, battleState) {
    let updateMessage = await interaction.editReply({
        embeds: [createVisualBattleEmbed(battleState)]
    });
    
    // Battle loop with turn protection and no-draw guarantee
    while (true) {
        await new Promise(resolve => setTimeout(resolve, RAID_CONFIG.TURN_DELAY));
        
        // Determine current player
        const currentPlayer = battleState.currentPlayer === 'attacker' ? battleState.attacker : battleState.target;
        const opponent = battleState.currentPlayer === 'attacker' ? battleState.target : battleState.attacker;
        
        // Execute turn with protection
        const turnResult = await executeTurnWithProtection(battleState, currentPlayer, opponent);
        
        // Add to battle log
        battleState.battleLog.push(turnResult);
        
        // Process status effects
        processStatusEffectsWithResults(battleState.attacker);
        processStatusEffectsWithResults(battleState.target);
        
        // Reduce cooldowns
        reduceCooldowns(battleState.attacker);
        reduceCooldowns(battleState.target);
        
        // Show damage animation if there was damage
        if (turnResult.damage > 0) {
            for (let frame = 1; frame <= RAID_CONFIG.ANIMATION_FRAMES; frame++) {
                await updateMessage.edit({
                    embeds: [createVisualBattleEmbed(battleState, turnResult, frame)]
                });
                await new Promise(resolve => setTimeout(resolve, RAID_CONFIG.DAMAGE_FLASH_DELAY / RAID_CONFIG.ANIMATION_FRAMES));
            }
        }
        
        // Update display
        await updateMessage.edit({
            embeds: [createVisualBattleEmbed(battleState, turnResult, 0)]
        });
        
        // Check for battle end using no-draw system
        const battleResult = checkBattleEndNoDraws(battleState);
        if (battleResult.ended) {
            const finalResult = {
                battleId: battleState.id,
                attacker: battleState.attacker,
                target: battleState.target,
                winner: battleResult.winner,
                reason: battleResult.reason,
                totalTurns: battleState.turn,
                battleLog: battleState.battleLog,
                startTime: battleState.startTime,
                finalHP: {
                    attacker: battleState.attacker.currentHP,
                    target: battleState.target.currentHP
                }
            };
            
            return finalResult;
        }
        
        // Switch turns
        battleState.currentPlayer = battleState.currentPlayer === 'attacker' ? 'target' : 'attacker';
        battleState.turn++;
        
        // Failsafe: Force end after absolute maximum
        if (battleState.turn > RAID_CONFIG.MAX_BATTLE_TURNS + 10) {
            const winner = determineBattleWinner(battleState);
            return {
                battleId: battleState.id,
                attacker: battleState.attacker,
                target: battleState.target,
                winner: winner.id,
                reason: winner.reason,
                totalTurns: battleState.turn,
                battleLog: battleState.battleLog,
                startTime: battleState.startTime,
                finalHP: {
                    attacker: battleState.attacker.currentHP,
                    target: battleState.target.currentHP
                }
            };
        }
    }
}

/**
 * FIXED: Execute a single turn of combat with protection
 */
async function executeTurnWithProtection(battleState, currentPlayer, opponent) {
    // Process status effects first
    const statusResults = processStatusEffectsWithResults(currentPlayer);
    
    // Check if player is disabled
    if (isPlayerDisabled(currentPlayer)) {
        return {
            type: 'disabled',
            message: `${currentPlayer.username} is disabled and skips their turn!`,
            damage: 0,
            statusResults,
            attacker: currentPlayer.username,
            defender: opponent.username,
            turnProtection: battleState.turn <= 5
        };
    }
    
    // Determine action (80% skill use, 20% basic attack if skill on cooldown)
    const useSkill = currentPlayer.skillData && 
                    !isSkillOnCooldown(currentPlayer, currentPlayer.skillData.name) && 
                    Math.random() > 0.2;
    
    let result;
    if (useSkill) {
        result = executeEnhancedSkillAttackWithProtection(battleState, currentPlayer, opponent);
    } else {
        result = executeEnhancedBasicAttackWithProtection(battleState, currentPlayer, opponent);
    }
    
    // Add status effect results to the main result
    result.statusResults = statusResults;
    
    return result;
}

/**
 * FIXED: Enhanced skill attack with turn-based damage reduction
 */
function executeEnhancedSkillAttackWithProtection(battleState, attacker, defender) {
    const skill = attacker.skillData;
    
    // Enhanced skill damage calculation
    let damage = skill.damage || 100;
    
    // Skill base damage multiplier
    const skillPowerMultiplier = 2.5; // Skills are 2.5x more powerful
    damage = Math.floor(damage * skillPowerMultiplier);
    
    // Rarity multiplier for skills
    const rarityMultiplier = getRaritySkillMultiplier(attacker.bestFruit?.fruit_rarity || 'common');
    damage = Math.floor(damage * rarityMultiplier);
    
    // Enhanced CP multiplier
    const cpMultiplier = Math.min(attacker.totalCP / defender.totalCP, 3.0);
    
    // Level difference bonus
    const levelDiff = Math.max(0.7, 1 + (attacker.level - defender.level) * 0.08);
    
    damage = Math.floor(damage * cpMultiplier * levelDiff);
    
    // Skill mastery bonus based on total CP
    const masteryBonus = 1 + (attacker.totalCP / 5000);
    damage = Math.floor(damage * masteryBonus);
    
    // Apply random variance (less variance for skills - more consistent)
    const variance = 0.85 + (Math.random() * 0.3); // 85%-115%
    damage = Math.floor(damage * variance);
    
    // Higher critical hit chance and damage for skills
    const critChance = 0.25 + (attacker.level / 500);
    const isCritical = Math.random() < critChance;
    if (isCritical) {
        damage = Math.floor(damage * 2.2);
    }
    
    // 🛡️ APPLY TURN-BASED DAMAGE REDUCTION HERE 🛡️
    const originalDamage = damage;
    damage = applyTurnBasedDamageReduction(damage, battleState.turn);
    const turnProtection = battleState.turn <= 5 && damage < originalDamage;
    
    // Apply damage
    const originalHP = defender.currentHP;
    defender.currentHP = Math.max(0, defender.currentHP - damage);
    const actualDamage = originalHP - defender.currentHP;
    
    // Set skill cooldown
    setSkillCooldown(attacker, skill.name, skill.cooldown || 2);
    
    // Apply skill effects
    const effectResults = applySkillEffectsWithResults(skill, attacker, defender);
    
    return {
        type: 'skill_attack',
        skillName: skill.name,
        damage: actualDamage,
        isCritical,
        effects: effectResults,
        attacker: attacker.username,
        defender: defender.username,
        turnProtection: turnProtection, // Track if protection was applied
        timestamp: Date.now()
    };
}

/**
 * FIXED: Enhanced basic attack with turn-based damage reduction
 */
function executeEnhancedBasicAttackWithProtection(battleState, attacker, defender) {
    // Basic attacks should be reliable but weaker
    let damage = 50 + Math.floor(attacker.totalCP / 60);
    const levelDiff = Math.max(0.5, 1 + (attacker.level - defender.level) * 0.03);
    
    damage = Math.floor(damage * levelDiff);
    
    // Basic attacks have more variance (less reliable)
    const variance = 0.6 + (Math.random() * 0.8); // 60%-140%
    damage = Math.floor(damage * variance);
    
    // Lower critical chance for basic attacks
    const critChance = 0.1;
    const isCritical = Math.random() < critChance;
    if (isCritical) {
        damage = Math.floor(damage * 1.5);
    }
    
    // 🛡️ APPLY TURN-BASED DAMAGE REDUCTION HERE 🛡️
    const originalDamage = damage;
    damage = applyTurnBasedDamageReduction(damage, battleState.turn);
    const turnProtection = battleState.turn <= 5 && damage < originalDamage;
    
    // Apply damage
    const originalHP = defender.currentHP;
    defender.currentHP = Math.max(0, defender.currentHP - damage);
    const actualDamage = originalHP - defender.currentHP;
    
    return {
        type: 'basic_attack',
        damage: actualDamage,
        isCritical,
        attacker: attacker.username,
        defender: defender.username,
        turnProtection: turnProtection, // Track if protection was applied
        timestamp: Date.now()
    };
}

/**
 * Get skill-specific rarity multiplier
 */
function getRaritySkillMultiplier(rarity) {
    const multipliers = {
        'common': 1.0,     // Base skill power
        'uncommon': 1.3,   // 30% more damage
        'rare': 1.6,       // 60% more damage
        'epic': 2.0,       // 100% more damage
        'legendary': 2.5,  // 150% more damage
        'mythical': 3.2,   // 220% more damage
        'divine': 4.0      // 300% more damage
    };
    return multipliers[rarity] || 1.0;
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
                const dotDamage = Math.floor(player.maxHP * 0.05);
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
        }
        
        effect.duration--;
        if (effect.duration <= 0) {
            keepEffect = false;
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
 * Calculate maximum HP based on CP and level
 */
function calculateMaxHP(totalCP, level) {
    const baseHP = 800;
    const levelBonus = level * 40;
    const cpBonus = Math.floor(totalCP * 0.6);
    return baseHP + levelBonus + cpBonus;
}

/**
 * NO DRAWS: Determine battle winner - GUARANTEED WINNER EVERY TIME
 */
function determineBattleWinner(battleState) {
    const { attacker, target } = battleState;
    
    console.log('🔍 Determining winner with no-draw system...');
    
    // Case 1: Clear knockout - one player has 0 HP
    if (attacker.currentHP <= 0 && target.currentHP > 0) {
        console.log('✅ Target wins by knockout');
        return { id: target.userId, reason: 'knockout_victory' };
    } else if (target.currentHP <= 0 && attacker.currentHP > 0) {
        console.log('✅ Attacker wins by knockout');
        return { id: attacker.userId, reason: 'knockout_victory' };
    }
    
    // Case 2: Both players dead - ATTACKER ALWAYS WINS (no draws!)
    else if (attacker.currentHP <= 0 && target.currentHP <= 0) {
        console.log('✅ Both dead - Attacker wins by default');
        return { id: attacker.userId, reason: 'mutual_destruction_attacker_wins' };
    }
    
    // Case 3: Time limit/turn limit reached - use advanced tiebreakers
    else {
        console.log('⚖️ Using advanced tiebreaker system...');
        return determineWinnerByAdvancedCriteria(battleState);
    }
}

/**
 * NO DRAWS: Advanced winner determination with multiple tiebreakers
 */
function determineWinnerByAdvancedCriteria(battleState) {
    const { attacker, target } = battleState;
    
    console.log('🔍 Advanced criteria check started');
    console.log(`Attacker HP: ${attacker.currentHP}/${attacker.maxHP}`);
    console.log(`Target HP: ${target.currentHP}/${target.maxHP}`);
    
    // Tiebreaker 1: HP Percentage (1% difference threshold)
    const attackerHPPercent = attacker.currentHP / attacker.maxHP;
    const targetHPPercent = target.currentHP / target.maxHP;
    
    console.log(`HP Percentages - Attacker: ${(attackerHPPercent * 100).toFixed(2)}%, Target: ${(targetHPPercent * 100).toFixed(2)}%`);
    
    if (Math.abs(attackerHPPercent - targetHPPercent) > 0.01) {
        const winner = attackerHPPercent > targetHPPercent ? attacker.userId : target.userId;
        const reason = 'hp_superiority';
        console.log(`✅ Winner by HP: ${winner} (${reason})`);
        return { id: winner, reason };
    }
    
    // Tiebreaker 2: Total Damage Dealt
    const attackerDamage = target.maxHP - target.currentHP;
    const targetDamage = attacker.maxHP - attacker.currentHP;
    
    console.log(`Damage dealt - Attacker: ${attackerDamage}, Target: ${targetDamage}`);
    
    if (attackerDamage !== targetDamage) {
        const winner = attackerDamage > targetDamage ? attacker.userId : target.userId;
        const reason = 'damage_dominance';
        console.log(`✅ Winner by damage: ${winner} (${reason})`);
        return { id: winner, reason };
    }
    
    // Tiebreaker 3: Devil Fruit Power (Total CP)
    console.log(`Total CP - Attacker: ${attacker.totalCP}, Target: ${target.totalCP}`);
    
    if (attacker.totalCP !== target.totalCP) {
        const winner = attacker.totalCP > target.totalCP ? attacker.userId : target.userId;
        const reason = 'power_advantage';
        console.log(`✅ Winner by CP: ${winner} (${reason})`);
        return { id: winner, reason };
    }
    
    // Tiebreaker 4: Experience Level
    console.log(`Levels - Attacker: ${attacker.level}, Target: ${target.level}`);
    
    if (attacker.level !== target.level) {
        const winner = attacker.level > target.level ? attacker.userId : target.userId;
        const reason = 'experience_edge';
        console.log(`✅ Winner by level: ${winner} (${reason})`);
        return { id: winner, reason };
    }
    
    // Final Tiebreaker: Simple coin flip with timestamp
    const randomSeed = (Date.now() % 2);
    const winner = randomSeed === 0 ? attacker.userId : target.userId;
    const reason = randomSeed === 0 ? 'fortune_favors_bold' : 'destiny_defied';
    
    console.log(`✅ Final tiebreaker - Winner: ${winner} (${reason})`);
    
    return { id: winner, reason };
}

/**
 * NO DRAWS + TURN 1 PROTECTION: Enhanced battle end check
 */
function checkBattleEndNoDraws(battleState) {
    const { attacker, target, turn } = battleState;
    
    // Immediate knockout
    if (attacker.currentHP <= 0 || target.currentHP <= 0) {
        const winner = determineBattleWinner(battleState);
        return { ended: true, winner: winner.id, reason: winner.reason };
    }
    
    // Minimum turn requirement (let battles develop with protection)
    if (turn < RAID_CONFIG.MIN_BATTLE_TURNS) {
        return { ended: false };
    }
    
    // Decisive HP advantage (25%+ difference) - but only after protection ends
    if (turn > 5) { // Only check after protection ends
        const attackerHPPercent = attacker.currentHP / attacker.maxHP;
        const targetHPPercent = target.currentHP / target.maxHP;
        
        if (Math.abs(attackerHPPercent - targetHPPercent) >= RAID_CONFIG.DECISIVE_HP_THRESHOLD) {
            const winner = determineBattleWinner(battleState);
            return { ended: true, winner: winner.id, reason: winner.reason };
        }
    }
    
    // Force end at turn limit with guaranteed winner
    if (turn >= RAID_CONFIG.MAX_BATTLE_TURNS) {
        const winner = determineBattleWinner(battleState);
        return { ended: true, winner: winner.id, reason: winner.reason };
    }
    
    return { ended: false };
}

/**
 * Create visual battle embed with protection indicators
 */
function createVisualBattleEmbed(battleState, turnResult = null, animationFrame = 0) {
    const { attacker, target, turn } = battleState;
    
    // Check if turn protection is active
    const turnProtection = turn <= 5;
    
    // Calculate HP percentages
    const attackerHPPercent = Math.round((attacker.currentHP / attacker.maxHP) * 100);
    const targetHPPercent = Math.round((target.currentHP / target.maxHP) * 100);
    
    const embed = new EmbedBuilder()
        .setTitle('⚔️ PROTECTED RAID BATTLE')
        .setColor(turnProtection ? RARITY_COLORS.epic : RARITY_COLORS.legendary)
        .setDescription(createBattleHeader(battleState, turnResult, animationFrame))
        .addFields(
            {
                name: '🏴‍☠️ ATTACKER',
                value: `**${attacker.username}**\n💗 ${attacker.currentHP}/${attacker.maxHP} HP (${attackerHPPercent}%)`,
                inline: true
            },
            {
                name: '🛡️ DEFENDER',
                value: `**${target.username}**\n💗 ${target.currentHP}/${target.maxHP} HP (${targetHPPercent}%)`,
                inline: true
            },
            {
                name: '📊 BATTLE INFO',
                value: `**Turn:** ${turn}/${RAID_CONFIG.MAX_BATTLE_TURNS}\n**Protection:** ${getProtectionStatus(turn)}\n**System:** NO DRAWS`,
                inline: true
            }
        )
        .setFooter({ text: `Battle ID: ${battleState.id} | Turn 1 Protection + No-Draw System v4.2` })
        .setTimestamp();
    
    return embed;
}

/**
 * Get protection status for display
 */
function getProtectionStatus(turn) {
    if (turn === 1) return '🛡️🛡️🛡️ 80% DR';
    if (turn <= 3) return '🛡️🛡️ 50% DR';
    if (turn <= 5) return '🛡️ 25% DR';
    return '⚔️ Full DMG';
}

/**
 * Create battle header
 */
function createBattleHeader(battleState, turnResult, animationFrame = 0) {
    if (!turnResult) {
        let protectionText = '';
        if (battleState.turn === 1) {
            protectionText = '\n🛡️🛡️🛡️ **TURN 1 PROTECTION:** 80% damage reduction active!';
        } else if (battleState.turn <= 3) {
            protectionText = '\n🛡️🛡️ **EARLY PROTECTION:** 50% damage reduction active!';
        } else if (battleState.turn <= 5) {
            protectionText = '\n🛡️ **SCALING PROTECTION:** 25% damage reduction active!';
        } else {
            protectionText = '\n⚔️ **FULL COMBAT:** Protection removed - full damage!';
        }
        
        return `⚡ **PROTECTED RAID BATTLE** ⚡\n*Every battle guarantees a winner with fair protection!*${protectionText}`;
    }
    
    let header = '';
    
    // Animation indicator
    if (animationFrame > 0) {
        header += '💥 **DAMAGE IMPACT!** 💥\n';
    }
    
    // Turn protection indicator
    if (turnResult.turnProtection) {
        if (battleState.turn === 1) {
            header += '🛡️🛡️🛡️ **TURN 1 PROTECTION** (80% DR) 🛡️🛡️🛡️\n';
        } else if (battleState.turn <= 3) {
            header += '🛡️🛡️ **EARLY PROTECTION** (50% DR) 🛡️🛡️\n';
        } else if (battleState.turn <= 5) {
            header += '🛡️ **SCALING PROTECTION** (25% DR) 🛡️\n';
        }
    }
    
    // Main action description
    if (turnResult.type === 'skill_attack') {
        const skillEmoji = '✨';
        header += `${skillEmoji} **SKILL USED:** ${turnResult.skillName}\n`;
        header += `💥 **DAMAGE:** ${turnResult.damage}${turnResult.isCritical ? ' (CRITICAL!)' : ''}`;
        if (turnResult.turnProtection) {
            header += ' *[Protected]*';
        }
        header += '\n';
    } else if (turnResult.type === 'basic_attack') {
        header += `⚔️ **BASIC ATTACK**\n`;
        header += `💥 **DAMAGE:** ${turnResult.damage}${turnResult.isCritical ? ' (CRITICAL!)' : ''}`;
        if (turnResult.turnProtection) {
            header += ' *[Protected]*';
        }
        header += '\n';
    }
    
    return header || '*Preparing for protected combat...*';
}

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
 * Start raid fruit selection process for attacker
 */
async function startRaidFruitSelection(interaction, attacker, target) {
    // Get attacker's fruits for selection
    const attackerFruits = await getRaidFruitOptions(attacker.id);
    
    if (attackerFruits.length < 5) {
        return interaction.editReply({
            embeds: [createErrorEmbed(`You need at least 5 Devil Fruits to raid! You have ${attackerFruits.length}.`)]
        });
    }
    
    // Create selection session
    const selectionId = `raid_select_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const selectionData = {
        attackerId: attacker.id,
        targetId: target.id,
        attackerFruits,
        selectedFruits: [],
        currentPage: 0,
        createdAt: Date.now()
    };
    
    activeSelections.set(selectionId, selectionData);
    
    // Send selection interface
    const embed = createFruitSelectionEmbed(selectionData, attacker, target);
    const components = createFruitSelectionComponents(selectionId, selectionData);
    
    await interaction.editReply({ embeds: [embed], components });
    
    // Setup selection collector
    setupFruitSelectionCollector(interaction, selectionId);
}

/**
 * Get raid fruit options for user (formatted for selection)
 */
async function getRaidFruitOptions(userId) {
    const fruits = await DatabaseManager.getUserDevilFruits(userId);
    
    // Group by fruit_id and get best version of each
    const fruitGroups = {};
    fruits.forEach(fruit => {
        const key = fruit.fruit_id;
        if (!fruitGroups[key] || fruit.total_cp > fruitGroups[key].total_cp) {
            fruitGroups[key] = {
                id: fruit.fruit_id,
                name: fruit.fruit_name,
                type: fruit.fruit_type,
                rarity: fruit.fruit_rarity,
                description: fruit.fruit_description,
                totalCP: fruit.total_cp,
                baseCP: fruit.base_cp,
                emoji: RARITY_EMOJIS[fruit.fruit_rarity] || '⚪',
                skillData: null // Will be populated when needed
            };
        }
    });
    
    // Sort by CP (highest first) then by rarity
    return Object.values(fruitGroups).sort((a, b) => {
        if (b.totalCP !== a.totalCP) {
            return b.totalCP - a.totalCP; // Higher CP first
        }
        const rarityOrder = { 'divine': 7, 'mythical': 6, 'legendary': 5, 'epic': 4, 'rare': 3, 'uncommon': 2, 'common': 1 };
        return (rarityOrder[b.rarity] || 1) - (rarityOrder[a.rarity] || 1);
    });
}

/**
 * Create fruit selection embed
 */
function createFruitSelectionEmbed(selectionData, attacker, target) {
    const { selectedFruits, currentPage, attackerFruits } = selectionData;
    const fruitsPerPage = 10;
    const totalPages = Math.ceil(attackerFruits.length / fruitsPerPage);
    
    const embed = new EmbedBuilder()
        .setColor(RARITY_COLORS.legendary)
        .setTitle(`⚔️ Select Your Protected Raid Team (${selectedFruits.length}/5)`)
        .setDescription(`**${attacker.username}** vs **${target.username}**\n\n🛡️ **TURN 1 PROTECTION** - 80% damage reduction on first turn!\n🏆 **NO-DRAW SYSTEM** - Every battle guarantees a winner!\n\nChoose 5 Devil Fruits for your raid attack!\n*Defender will automatically use their 5 strongest fruits.*`)
        .setFooter({ text: `Page ${currentPage + 1}/${totalPages} • Select fruits below` })
        .setTimestamp();
    
    // Show selected fruits
    if (selectedFruits.length > 0) {
        const selectedText = selectedFruits
            .map((fruit, index) => `${index + 1}. ${fruit.emoji} **${fruit.name}** (${fruit.totalCP.toLocaleString()} CP)`)
            .join('\n');
        
        embed.addFields({
            name: '✅ Selected Protected Raid Team',
            value: selectedText,
            inline: false
        });
    }
    
    // Show available fruits for current page
    const startIndex = currentPage * fruitsPerPage;
    const endIndex = startIndex + fruitsPerPage;
    const pageFruits = attackerFruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0) {
        const availableText = pageFruits
            .map((fruit, index) => {
                const globalIndex = startIndex + index;
                const isSelected = selectedFruits.some(s => s.id === fruit.id);
                const status = isSelected ? '✅' : `${globalIndex + 1}.`;
                return `${status} ${fruit.emoji} **${fruit.name}** (${fruit.rarity}, ${fruit.totalCP.toLocaleString()} CP)`;
            })
            .join('\n');
        
        embed.addFields({
            name: '🍈 Available Devil Fruits',
            value: availableText.length > 1000 ? availableText.substring(0, 997) + '...' : availableText,
            inline: false
        });
    }
    
    return embed;
}

/**
 * Create fruit selection components
 */
function createFruitSelectionComponents(selectionId, selectionData) {
    const { selectedFruits, currentPage, attackerFruits } = selectionData;
    const components = [];
    const fruitsPerPage = 10;
    const totalPages = Math.ceil(attackerFruits.length / fruitsPerPage);
    
    // Navigation buttons
    const navRow = new ActionRowBuilder();
    
    if (currentPage > 0) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`raid_prev_${selectionId}`)
                .setLabel('⬅️ Previous')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    if (currentPage < totalPages - 1) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`raid_next_${selectionId}`)
                .setLabel('➡️ Next')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    if (navRow.components.length > 0) {
        components.push(navRow);
    }
    
    // Fruit selection dropdown
    const startIndex = currentPage * fruitsPerPage;
    const endIndex = startIndex + fruitsPerPage;
    const pageFruits = attackerFruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0 && selectedFruits.length < 5) {
        const options = pageFruits
            .filter(fruit => !selectedFruits.some(s => s.id === fruit.id))
            .map((fruit, index) => {
                const globalIndex = startIndex + index;
                return {
                    label: `${fruit.name}`.substring(0, 100),
                    description: `${fruit.rarity} • ${fruit.totalCP.toLocaleString()} CP`.substring(0, 100),
                    value: `fruit_${globalIndex}`,
                    emoji: fruit.emoji
                };
            });
        
        if (options.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`raid_select_${selectionId}`)
                .setPlaceholder('Select Devil Fruits for your protected raid team...')
                .setMinValues(0)
                .setMaxValues(Math.min(options.length, 5 - selectedFruits.length))
                .addOptions(options);
            
            components.push(new ActionRowBuilder().addComponents(selectMenu));
        }
    }
    
    // Action buttons
    const actionRow = new ActionRowBuilder();
    
    if (selectedFruits.length > 0) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`raid_clear_${selectionId}`)
                .setLabel('🗑️ Clear Selection')
                .setStyle(ButtonStyle.Danger)
        );
    }
    
    if (selectedFruits.length === 5) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`raid_confirm_${selectionId}`)
                .setLabel('🛡️ Start Protected Raid!')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🏴‍☠️')
        );
    }
    
    if (actionRow.components.length > 0) {
        components.push(actionRow);
    }
    
    return components;
}

/**
 * Setup fruit selection collector
 */
function setupFruitSelectionCollector(interaction, selectionId) {
    const collector = interaction.channel.createMessageComponentCollector({
        time: 300000 // 5 minutes to select
    });
    
    collector.on('collect', async (componentInteraction) => {
        const selection = activeSelections.get(selectionId);
        if (!selection) {
            return componentInteraction.reply({ 
                content: '❌ Selection session expired!', 
                ephemeral: true 
            });
        }
        
        if (componentInteraction.user.id !== selection.attackerId) {
            return componentInteraction.reply({
                content: '❌ Only the raid attacker can select fruits!',
                ephemeral: true
            });
        }
        
        const customId = componentInteraction.customId;
        
        try {
            if (customId.startsWith('raid_prev_')) {
                await handlePageNavigation(componentInteraction, selectionId, 'prev');
            } else if (customId.startsWith('raid_next_')) {
                await handlePageNavigation(componentInteraction, selectionId, 'next');
            } else if (customId.startsWith('raid_select_')) {
                await handleFruitSelection(componentInteraction, selectionId);
            } else if (customId.startsWith('raid_clear_')) {
                await handleClearSelection(componentInteraction, selectionId);
            } else if (customId.startsWith('raid_confirm_')) {
                await handleConfirmProtectedRaid(componentInteraction, selectionId, interaction);
                collector.stop();
            }
        } catch (error) {
            console.error('Fruit selection interaction error:', error);
            await componentInteraction.reply({
                content: '❌ An error occurred during selection!',
                ephemeral: true
            });
        }
    });
    
    collector.on('end', () => {
        activeSelections.delete(selectionId);
    });
}

/**
 * Handle page navigation
 */
async function handlePageNavigation(interaction, selectionId, direction) {
    const selection = activeSelections.get(selectionId);
    const fruitsPerPage = 10;
    const totalPages = Math.ceil(selection.attackerFruits.length / fruitsPerPage);
    
    if (direction === 'prev' && selection.currentPage > 0) {
        selection.currentPage--;
    } else if (direction === 'next' && selection.currentPage < totalPages - 1) {
        selection.currentPage++;
    }
    
    const attacker = await interaction.client.users.fetch(selection.attackerId);
    const target = await interaction.client.users.fetch(selection.targetId);
    
    const embed = createFruitSelectionEmbed(selection, attacker, target);
    const components = createFruitSelectionComponents(selectionId, selection);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle fruit selection from dropdown
 */
async function handleFruitSelection(interaction, selectionId) {
    const selection = activeSelections.get(selectionId);
    const selectedValues = interaction.values;
    
    selectedValues.forEach(value => {
        const fruitIndex = parseInt(value.split('_')[1]);
        const fruit = selection.attackerFruits[fruitIndex];
        
        if (fruit && !selection.selectedFruits.some(s => s.id === fruit.id)) {
            if (selection.selectedFruits.length < 5) {
                selection.selectedFruits.push(fruit);
            }
        }
    });
    
    const attacker = await interaction.client.users.fetch(selection.attackerId);
    const target = await interaction.client.users.fetch(selection.targetId);
    
    const embed = createFruitSelectionEmbed(selection, attacker, target);
    const components = createFruitSelectionComponents(selectionId, selection);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle clear selection
 */
async function handleClearSelection(interaction, selectionId) {
    const selection = activeSelections.get(selectionId);
    selection.selectedFruits = [];
    
    const attacker = await interaction.client.users.fetch(selection.attackerId);
    const target = await interaction.client.users.fetch(selection.targetId);
    
    const embed = createFruitSelectionEmbed(selection, attacker, target);
    const components = createFruitSelectionComponents(selectionId, selection);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle confirm protected raid
 */
async function handleConfirmProtectedRaid(interaction, selectionId, originalInteraction) {
    const selection = activeSelections.get(selectionId);
    
    if (selection.selectedFruits.length !== 5) {
        return interaction.reply({
            content: '❌ You must select exactly 5 Devil Fruits!',
            ephemeral: true
        });
    }
    
    // Confirm selection with protection info
    const confirmEmbed = new EmbedBuilder()
        .setColor(RARITY_COLORS.epic)
        .setTitle('🛡️ Protected Raid Confirmed!')
        .setDescription('Starting guaranteed-winner battle with Turn 1 protection system...')
        .addFields(
            {
                name: '🏴‍☠️ Your Protected Raid Team',
                value: selection.selectedFruits
                    .map((fruit, index) => `${index + 1}. ${fruit.emoji} **${fruit.name}** (${fruit.totalCP.toLocaleString()} CP)`)
                    .join('\n'),
                inline: false
            },
            {
                name: '🛡️ Protection System Active',
                value: [
                    '**Turn 1:** 80% damage reduction',
                    '**Turn 2-3:** 50% damage reduction', 
                    '**Turn 4-5:** 25% damage reduction',
                    '**Turn 6+:** Full damage combat'
                ].join('\n'),
                inline: false
            }
        )
        .setFooter({ text: 'NO DRAWS ALLOWED - Every battle has a winner with fair protection!' })
        .setTimestamp();
    
    await interaction.update({ embeds: [confirmEmbed], components: [] });
    
    // Start battle with selected fruits and protection
    setTimeout(async () => {
        try {
            const attacker = await originalInteraction.client.users.fetch(selection.attackerId);
            const target = await originalInteraction.client.users.fetch(selection.targetId);
            
            // Get enhanced participant data with selected fruits
            const [attackerData, targetData] = await Promise.all([
                getEnhancedParticipantDataWithSelectedFruits(selection.attackerId, selection.selectedFruits),
                getEnhancedParticipantDataWithTopFruits(selection.targetId) // Auto-select top 5 for defender
            ]);
            
            // Start the enhanced battle with turn protection and no-draw system
            const battleResult = await executeVisualBattle(originalInteraction, attackerData, targetData);
            
            // Process rewards and penalties
            const rewards = await processRaidRewards(battleResult, attackerData, targetData);
            
            // Set raid cooldown
            raidCooldowns.set(attacker.id, Date.now());
            
            // Create final result embed
            const resultEmbed = await createDetailedResultEmbed(battleResult, rewards, attacker, target);
            
            await originalInteraction.editReply({ 
                embeds: [resultEmbed]
            });
            
        } catch (error) {
            console.error('Error starting protected raid battle:', error);
            await originalInteraction.editReply({
                embeds: [createErrorEmbed('An error occurred starting the protected battle!')]
            });
        }
    }, 2000);
}

/**
 * Get enhanced participant data with user-selected fruits (for attacker)
 */
async function getEnhancedParticipantDataWithSelectedFruits(userId, selectedFruits) {
    const user = await DatabaseManager.getUser(userId);
    
    // Calculate team stats from selected fruits
    let totalTeamCP = 0;
    let teamFruits = [];
    
    for (const fruit of selectedFruits) {
        // Get skill data for each fruit
        const skillData = getSkillData(fruit.id, fruit.rarity) || {
            name: `${fruit.name} Power`,
            damage: Math.floor(50 + (fruit.totalCP / 20)),
            cooldown: 2,
            effect: 'basic_attack',
            description: `Harness the power of the ${fruit.name}`,
            type: 'attack',
            range: 'single'
        };
        
        teamFruits.push({
            ...fruit,
            skillData
        });
        
        totalTeamCP += fruit.totalCP;
    }
    
    // Use the strongest fruit as the "active" fruit for battle calculations
    const bestFruit = teamFruits.reduce((best, current) => 
        current.totalCP > best.totalCP ? current : best
    );
    
    return {
        userId,
        username: user.username,
        totalCP: totalTeamCP, // Use team CP instead of user total CP
        berries: user.berries,
        level: user.level,
        bestFruit: {
            fruit_id: bestFruit.id,
            fruit_name: bestFruit.name,
            fruit_type: bestFruit.type,
            fruit_rarity: bestFruit.rarity,
            fruit_description: bestFruit.description,
            total_cp: bestFruit.totalCP,
            base_cp: bestFruit.baseCP
        },
        skillData: bestFruit.skillData,
        teamFruits: teamFruits, // Store all 5 selected fruits
        fruits: selectedFruits.length,
        uniqueFruits: selectedFruits.length,
        // Battle stats
        maxHP: calculateMaxHP(totalTeamCP, user.level),
        currentHP: 0, // Will be set to maxHP at battle start
        statusEffects: [],
        skillCooldowns: {},
        lastAction: null
    };
}

/**
 * Get enhanced participant data with top 5 strongest fruits (for defender)
 */
async function getEnhancedParticipantDataWithTopFruits(userId) {
    const user = await DatabaseManager.getUser(userId);
    const allFruits = await DatabaseManager.getUserDevilFruits(userId);
    
    // Get top 5 strongest fruits (by total CP)
    const topFruits = allFruits
        .sort((a, b) => (b.total_cp || 0) - (a.total_cp || 0))
        .slice(0, 5);
    
    // If user has less than 5 fruits, use what they have
    if (topFruits.length === 0) {
        // Fallback: create a basic fruit for users with no fruits
        topFruits.push({
            fruit_id: 'basic_fruit',
            fruit_name: 'Basic Fruit',
            fruit_type: 'Paramecia',
            fruit_rarity: 'common',
            fruit_description: 'A basic devil fruit power',
            total_cp: 100,
            base_cp: 100
        });
    }
    
    // Calculate team stats from top fruits
    let totalTeamCP = 0;
    let teamFruits = [];
    
    for (const fruit of topFruits) {
        // Get skill data for each fruit
        const skillData = getSkillData(fruit.fruit_id, fruit.fruit_rarity) || {
            name: `${fruit.fruit_name} Power`,
            damage: Math.floor(50 + (fruit.total_cp / 20)),
            cooldown: 2,
            effect: 'basic_attack',
            description: `Harness the power of the ${fruit.fruit_name}`,
            type: 'attack',
            range: 'single'
        };
        
        teamFruits.push({
            id: fruit.fruit_id,
            name: fruit.fruit_name,
            type: fruit.fruit_type,
            rarity: fruit.fruit_rarity,
            description: fruit.fruit_description,
            totalCP: fruit.total_cp,
            baseCP: fruit.base_cp,
            emoji: RARITY_EMOJIS[fruit.fruit_rarity] || '⚪',
            skillData
        });
        
        totalTeamCP += fruit.total_cp;
    }
    
    // Use the strongest fruit as the "active" fruit for battle calculations
    const bestFruit = teamFruits[0]; // Already sorted by CP
    
    return {
        userId,
        username: user.username,
        totalCP: totalTeamCP, // Use team CP instead of user total CP
        berries: user.berries,
        level: user.level,
        bestFruit: {
            fruit_id: bestFruit.id,
            fruit_name: bestFruit.name,
            fruit_type: bestFruit.type,
            fruit_rarity: bestFruit.rarity,
            fruit_description: bestFruit.description,
            total_cp: bestFruit.totalCP,
            base_cp: bestFruit.baseCP
        },
        skillData: bestFruit.skillData,
        teamFruits: teamFruits, // Store all defender's top fruits
        fruits: topFruits.length,
        uniqueFruits: topFruits.length,
        // Battle stats
        maxHP: calculateMaxHP(totalTeamCP, user.level),
        currentHP: 0, // Will be set to maxHP at battle start
        statusEffects: [],
        skillCooldowns: {},
        lastAction: null
    };
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
            await DatabaseManager.updateUserBerries(attackerData.userId, berriesStolen, 'protected_raid_victory');
            await DatabaseManager.updateUserBerries(targetData.userId, -berriesStolen, 'protected_raid_loss');
            rewards.berries = berriesStolen;
        }
        
        rewards.experienceGained = Math.floor(targetData.totalCP / 100);
        
    } else if (battleResult.winner === targetData.userId) {
        // Defender victory bonus
        const defenseBonus = Math.floor(attackerData.berries * 0.05);
        
        if (defenseBonus > 0) {
            await DatabaseManager.updateUserBerries(targetData.userId, defenseBonus, 'protected_raid_defense');
            rewards.berries = -defenseBonus;
        }
        
        rewards.experienceGained = Math.floor(attackerData.totalCP / 200);
    }
    
    return rewards;
}

/**
 * Create detailed final result embed with protection stats
 */
async function createDetailedResultEmbed(battleResult, rewards, attacker, target) {
    const { winner, reason, totalTurns, finalHP } = battleResult;
    
    const winnerUser = winner === attacker.id ? attacker : target;
    const loserUser = winner === attacker.id ? target : attacker;
    
    const embed = new EmbedBuilder()
        .setTitle('🏆 PROTECTED BATTLE VICTORY!')
        .setDescription(`**${winnerUser.username}** emerges victorious against **${loserUser.username}** after ${totalTurns} turns of protected combat!`)
        .setColor(RARITY_COLORS.legendary)
        .addFields(
            {
                name: '👑 Victory Details',
                value: [
                    `**Champion:** ${winnerUser.username}`,
                    `**Victory Type:** ${getReasonText(reason)}`,
                    `**Turns Fought:** ${totalTurns}/${RAID_CONFIG.MAX_BATTLE_TURNS}`,
                    `**Protection System:** Turn 1-5 Damage Reduction`,
                    `**Combat Type:** No-Draw Guaranteed Winner`
                ].join('\n'),
                inline: false
            },
            {
                name: '🛡️ Protection Summary',
                value: [
                    `**Turn 1:** 80% damage reduction applied`,
                    `**Turn 2-3:** 50% damage reduction applied`,
                    `**Turn 4-5:** 25% damage reduction applied`,
                    `**Turn 6+:** Full damage combat`
                ].join('\n'),
                inline: false
            },
            {
                name: '💗 Final Health Status',
                value: [
                    `**${attacker.username}:** ${finalHP.attacker}/${battleResult.attacker.maxHP} HP`,
                    `**${target.username}:** ${finalHP.target}/${battleResult.target.maxHP} HP`
                ].join('\n'),
                inline: false
            }
        );
    
    // Add rewards section
    if (rewards.berries !== 0 || rewards.experienceGained > 0) {
        let rewardsText = '';
        
        if (rewards.berries > 0) {
            rewardsText += `💰 **Berries Stolen:** ${rewards.berries.toLocaleString()}\n`;
        } else if (rewards.berries < 0) {
            rewardsText += `💸 **Defense Bonus:** ${Math.abs(rewards.berries).toLocaleString()}\n`;
        }
        
        if (rewards.experienceGained > 0) {
            rewardsText += `⭐ **Experience:** +${rewards.experienceGained}`;
        }
        
        if (rewardsText) {
            embed.addFields({
                name: '🎁 Victory Spoils',
                value: rewardsText,
                inline: false
            });
        }
    }
    
    embed.setFooter({ 
        text: `Protected Combat completed in ${totalTurns} turns | Turn 1 Protection + No-Draw System v4.2` 
    })
    .setTimestamp();
    
    return embed;
}

/**
 * Get victory reason descriptions
 */
function getReasonText(reason) {
    const reasons = {
        'knockout_victory': 'Decisive Knockout Victory',
        'mutual_destruction_attacker_wins': 'Attacker\'s Final Stand',
        'hp_superiority': 'Superior Endurance',
        'damage_dominance': 'Combat Mastery',
        'power_advantage': 'Devil Fruit Supremacy', 
        'experience_edge': 'Veteran\'s Wisdom',
        'legendary_superiority': 'Legendary Power',
        'collection_mastery': 'Devil Fruit Expertise',
        'cosmic_alignment': 'Cosmic Fortune',
        'fortune_favors_bold': 'Fortune Favors the Bold',
        'destiny_defied': 'Destiny\'s Unexpected Turn'
    };
    return reasons[reason] || 'Victory Achieved';
}

/**
 * Create error embed
 */
function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Protected Raid Failed')
        .setDescription(message)
        .setTimestamp();
}
