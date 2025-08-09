// src/commands/slash/pvp/pvp-raid.js - IMPROVED: Better Damage, Battle Log & UI
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const { getSkillData } = require('../../../data/DevilFruitSkills');
const SkillEffectService = require('../../../services/SkillEffectService');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');

// IMPROVED: Enhanced raid configuration with better damage balance
const RAID_CONFIG = {
    COOLDOWN_TIME: 300000, // 5 minutes
    MIN_CP_REQUIRED: 500,
    BERRY_STEAL_PERCENTAGE: 0.15,
    FRUIT_DROP_CHANCES: {
        'divine': 0.01, 'mythical': 0.02, 'legendary': 0.05,
        'epic': 0.08, 'rare': 0.12, 'uncommon': 0.18, 'common': 0.25
    },
    MAX_FRUIT_DROPS: 3,
    
    // IMPROVED: Better balanced damage system
    MAX_BATTLE_TURNS: 30,
    TURN_TIMEOUT: 300000,
    HP_BAR_LENGTH: 20,
    TEAM_SIZE: 5,
    FRUITS_PER_PAGE: 12,
    INTERACTION_TIMEOUT: 900000,
    
    // IMPROVED: More balanced damage calculations
    BASIC_MIN_DAMAGE_PERCENT: 0.08,   // Basic attacks: 8-12% of target's max HP
    BASIC_MAX_DAMAGE_PERCENT: 0.12,   // Increased from 4-8%
    SKILL_MIN_DAMAGE_PERCENT: 0.12,   // Skills: 12-20% of target's max HP  
    SKILL_MAX_DAMAGE_PERCENT: 0.20,   // Increased from 6-15%
    BASE_DAMAGE_MULTIPLIER: 1.2,      // Increased base damage
    CP_SCALING_FACTOR: 0.4,           // Increased CP scaling
    RARITY_BASIC_SCALING: 0.7,        // Better rarity scaling for basic attacks
    
    // IMPROVED: Better critical and dodge rates
    BASE_CRIT_CHANCE: 0.20,       // 20% base critical chance (increased)
    CRIT_DAMAGE_MULTIPLIER: 2.0,  // 100% more damage on crit (increased)
    BASE_DODGE_CHANCE: 0.06,      // 6% base dodge chance (reduced)
    
    // AI behavior settings
    AI_SKILL_USE_CHANCE: 0.95,       // 95% chance to use skills
    AI_AGGRESSION: 0.9               // High aggression
};

// Active raids and cooldowns
const raidCooldowns = new Map();
const activeRaids = new Map();
const fruitSelections = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid')
        .setDescription('⚔️ Raid another pirate with enhanced combat system!')
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
            updateBotStatus(interaction.client, 'raid_start', {
                attacker: attacker.username,
                target: target.username
            });
            
            const validation = await validateRaid(attacker.id, target);
            if (!validation.valid) {
                return interaction.reply({
                    embeds: [createErrorEmbed(validation.reason)],
                    ephemeral: true
                });
            }
            
            await interaction.deferReply();
            
            const attackerFruits = await getUserFruitsForSelection(attacker.id);
            
            if (attackerFruits.length < RAID_CONFIG.TEAM_SIZE) {
                return interaction.editReply({
                    embeds: [createErrorEmbed(`You need at least ${RAID_CONFIG.TEAM_SIZE} Devil Fruits to raid!`)]
                });
            }
            
            await startFruitSelection(interaction, attacker, target, attackerFruits);
            
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

// ===== IMPROVED DAMAGE CALCULATION SYSTEM =====

/**
 * IMPROVED: Calculate much better balanced damage
 */
function calculateEnhancedDamage(attackingFruit, defendingFruit, baseDamage, attackerModifiers = {}, isBasicAttack = false) {
    const targetMaxHP = defendingFruit.maxHP;
    
    // IMPROVED: Higher damage ranges for more exciting battles
    let minPercent, maxPercent;
    
    if (isBasicAttack) {
        minPercent = RAID_CONFIG.BASIC_MIN_DAMAGE_PERCENT;
        maxPercent = RAID_CONFIG.BASIC_MAX_DAMAGE_PERCENT;
        
        // IMPROVED: Better rarity scaling for basic attacks
        const rarityMultiplier = getRarityBasicAttackBonus(attackingFruit.rarity);
        maxPercent *= rarityMultiplier;
    } else {
        minPercent = RAID_CONFIG.SKILL_MIN_DAMAGE_PERCENT;
        maxPercent = RAID_CONFIG.SKILL_MAX_DAMAGE_PERCENT;
    }
    
    // Random damage within range
    const damagePercent = minPercent + (Math.random() * (maxPercent - minPercent));
    let damage = Math.floor(targetMaxHP * damagePercent);
    
    // IMPROVED: Better CP scaling
    const cpRatio = attackingFruit.totalCP / Math.max(defendingFruit.totalCP, 1);
    const cpMultiplier = 0.7 + (cpRatio * RAID_CONFIG.CP_SCALING_FACTOR);
    damage = Math.floor(damage * Math.min(cpMultiplier, 1.8)); // Cap at 1.8x
    
    // Apply rarity bonus
    if (!isBasicAttack) {
        const rarityBonus = getRarityDamageBonus(attackingFruit.rarity);
        damage = Math.floor(damage * rarityBonus);
    }
    
    // Apply attacker modifiers
    if (attackerModifiers.damageModifier) {
        damage = Math.floor(damage * attackerModifiers.damageModifier);
    }
    
    // IMPROVED: Better damage bounds - minimum 5% of max HP
    const minDamage = Math.floor(targetMaxHP * (isBasicAttack ? 0.05 : 0.08)); // 5% for basic, 8% for skills
    const maxDamage = Math.floor(targetMaxHP * (isBasicAttack ? 0.18 : 0.30)); // 18% for basic, 30% for skills
    
    damage = Math.max(minDamage, Math.min(damage, maxDamage));
    
    return damage;
}

/**
 * IMPROVED: Better rarity bonus for basic attacks
 */
function getRarityBasicAttackBonus(rarity) {
    const bonuses = {
        'common': 1.0, 'uncommon': 1.15, 'rare': 1.3, 'epic': 1.45,
        'legendary': 1.6, 'mythical': 1.8, 'divine': 2.0
    };
    return bonuses[rarity] || 1.0;
}

/**
 * IMPROVED: Better rarity damage bonus for skills
 */
function getRarityDamageBonus(rarity) {
    const bonuses = {
        'common': 1.0, 'uncommon': 1.1, 'rare': 1.2, 'epic': 1.35,
        'legendary': 1.5, 'mythical': 1.7, 'divine': 2.0
    };
    return bonuses[rarity] || 1.0;
}

// ===== IMPROVED BATTLE EXECUTION SYSTEM =====

/**
 * IMPROVED: Execute attack with better damage guarantees
 */
async function executeAttack(raidState, skillChoice, targetFruitIndex) {
    const [skillType, attackerFruitIndex] = skillChoice.split('_');
    const attackingFruit = raidState.attacker.team[parseInt(attackerFruitIndex)];
    const defendingFruit = raidState.defender.team[targetFruitIndex];
    
    // Check if attacker is dead or disabled
    if (attackingFruit.currentHP <= 0) {
        raidState.battleLog.push({
            type: 'error',
            message: `💀 ${attackingFruit.name} cannot attack - already defeated!`,
            turn: raidState.turn
        });
        return 0;
    }
    
    if (isDisabled(attackingFruit)) {
        raidState.battleLog.push({
            type: 'disable',
            message: `😵 ${attackingFruit.name} is disabled and cannot act!`,
            turn: raidState.turn
        });
        return 0;
    }
    
    if (defendingFruit.currentHP <= 0) {
        raidState.battleLog.push({
            type: 'error',
            message: `💀 Cannot target ${defendingFruit.name} - already defeated!`,
            turn: raidState.turn
        });
        return 0;
    }
    
    // Get skill data
    const skillData = getSkillData(attackingFruit.id, attackingFruit.rarity) || {
        name: `${attackingFruit.name} Power`,
        damage: 120,
        cooldown: 2,
        effect: null,
        description: 'A basic devil fruit ability',
        type: 'attack',
        range: 'single'
    };
    
    const isSkillAttack = skillType === 'skill';
    const skillName = isSkillAttack ? skillData.name : 'Basic Attack';
    
    // IMPROVED: Better action announcement
    raidState.battleLog.push({
        type: 'action_start',
        message: `⚔️ **${raidState.attacker.username}'s ${attackingFruit.name}** uses **${skillName}** against **${defendingFruit.name}**!`,
        turn: raidState.turn,
        attacker: attackingFruit.name,
        defender: defendingFruit.name,
        skill: skillName
    });
    
    // Calculate damage modifiers
    const attackerModifiers = calculateDamageModifiers(attackingFruit);
    const defenderModifiers = calculateDamageModifiers(defendingFruit);
    
    // IMPROVED: Reduced dodge chance
    const dodgeChance = calculateDodgeChance(attackingFruit, defendingFruit, defenderModifiers);
    if (Math.random() < dodgeChance) {
        raidState.battleLog.push({
            type: 'dodge',
            message: `💨 **${defendingFruit.name}** dodged the attack!`,
            turn: raidState.turn
        });
        if (isSkillAttack) {
            attackingFruit.cooldown = skillData.cooldown || 2;
        }
        return 0;
    }
    
    // IMPROVED: Calculate damage based on attack type
    const isBasicAttack = skillType === 'basic';
    const baseDamage = isBasicAttack ? 100 : (skillData.damage || 150); // Increased base damage
    
    let damage = calculateEnhancedDamage(attackingFruit, defendingFruit, baseDamage, attackerModifiers, isBasicAttack);
    
    // IMPROVED: Better critical hit calculation
    const criticalChance = calculateCriticalChance(attackingFruit, attackerModifiers, skillData);
    const isCritical = Math.random() < criticalChance;
    
    if (isCritical) {
        damage = Math.floor(damage * RAID_CONFIG.CRIT_DAMAGE_MULTIPLIER);
        raidState.battleLog.push({
            type: 'critical',
            message: `💥 **CRITICAL HIT!** Damage amplified!`,
            turn: raidState.turn
        });
    }
    
    // Apply skill effects
    let effectResults = null;
    if (isSkillAttack && skillData.effect) {
        effectResults = applyEnhancedSkillEffect(attackingFruit, defendingFruit, skillData, damage);
        
        if (effectResults && effectResults.messages && effectResults.messages.length > 0) {
            effectResults.messages.forEach(msg => {
                raidState.battleLog.push({
                    type: 'effect',
                    message: msg,
                    turn: raidState.turn
                });
            });
        }
        
        if (effectResults && effectResults.damageMultiplier) {
            damage = Math.floor(damage * effectResults.damageMultiplier);
        }
    }
    
    // IMPROVED: Apply final damage with clear messaging
    const originalHP = defendingFruit.currentHP;
    defendingFruit.currentHP = Math.max(0, defendingFruit.currentHP - damage);
    const actualDamage = originalHP - defendingFruit.currentHP;
    
    // IMPROVED: Clear damage report
    const damageType = isCritical ? 'critical_damage' : 'normal_damage';
    raidState.battleLog.push({
        type: damageType,
        message: `💥 **${skillName}** deals **${actualDamage}** damage to **${defendingFruit.name}**`,
        turn: raidState.turn,
        damage: actualDamage,
        isCritical
    });
    
    // IMPROVED: HP status update
    const hpPercent = Math.round((defendingFruit.currentHP / defendingFruit.maxHP) * 100);
    const hpStatus = defendingFruit.currentHP > 0 ? 
        `🩸 **${defendingFruit.name}**: ${defendingFruit.currentHP}/${defendingFruit.maxHP} HP (${hpPercent}%)` :
        `💀 **${defendingFruit.name}** has been defeated!`;
    
    raidState.battleLog.push({
        type: 'hp_update',
        message: hpStatus,
        turn: raidState.turn,
        target: defendingFruit.name,
        hp: defendingFruit.currentHP,
        maxHP: defendingFruit.maxHP,
        defeated: defendingFruit.currentHP === 0
    });
    
    // Handle AOE effects with clear messaging
    if (skillData.range === 'area' || skillData.range === 'all') {
        const aoeDamage = Math.floor(actualDamage * 0.3); // Reduced from 0.4 to 0.3
        let aoeTargets = 0;
        
        raidState.defender.team.forEach((fruit, index) => {
            if (index !== targetFruitIndex && fruit.currentHP > 0) {
                const aoeActualDamage = Math.min(fruit.currentHP, aoeDamage);
                fruit.currentHP = Math.max(0, fruit.currentHP - aoeDamage);
                if (aoeActualDamage > 0) {
                    aoeTargets++;
                }
            }
        });
        
        if (aoeTargets > 0) {
            raidState.battleLog.push({
                type: 'aoe_damage',
                message: `🌊 **Area Effect** hits **${aoeTargets}** additional targets for **${aoeDamage}** damage each!`,
                turn: raidState.turn,
                aoeDamage,
                targets: aoeTargets
            });
        }
    }
    
    // IMPROVED: Reduced recoil damage
    const recoilDamage = Math.floor(actualDamage * 0.01); // Only 1% recoil
    if (recoilDamage > 0) {
        attackingFruit.currentHP = Math.max(0, attackingFruit.currentHP - recoilDamage);
        raidState.battleLog.push({
            type: 'recoil',
            message: `🩸 **${attackingFruit.name}** takes **${recoilDamage}** recoil damage`,
            turn: raidState.turn
        });
    }
    
    // Set cooldown for skills
    if (isSkillAttack) {
        attackingFruit.cooldown = skillData.cooldown || 2;
    }
    
    // Handle defeated fruits
    if (attackingFruit.currentHP === 0) {
        raidState.battleLog.push({
            type: 'defeat',
            message: `💀 **${attackingFruit.name}** was defeated by recoil damage!`,
            turn: raidState.turn
        });
        attackingFruit.statusEffects = [];
    }
    
    if (defendingFruit.currentHP === 0) {
        raidState.battleLog.push({
            type: 'defeat',
            message: `💀 **${defendingFruit.name}** was defeated!`,
            turn: raidState.turn
        });
        defendingFruit.statusEffects = [];
    }
    
    return actualDamage;
}

// ===== IMPROVED UI SYSTEM =====

/**
 * IMPROVED: Create enhanced battle embed with better formatting
 */
function createEnhancedBattleEmbed(raidState, selectedSkill = null) {
    const { attacker, defender, turn } = raidState;
    
    const embed = new EmbedBuilder()
        .setTitle('⚔️ Devil Fruit Battle Arena')
        .setDescription(`**Turn ${turn}** | ${attacker.username} (YOU) vs ${defender.username} (AI)`)
        .setColor(RARITY_COLORS.legendary)
        .setTimestamp();
    
    // IMPROVED: Clean team display without status icons for alive/dead
    const attackerTeamText = attacker.team.map((fruit, index) => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const hpPercent = Math.round((fruit.currentHP / fruit.maxHP) * 100);
        const cooldownText = fruit.cooldown > 0 ? ` ⏱️${fruit.cooldown}` : '';
        
        let statusEffectsText = '';
        if (fruit.statusEffects && fruit.statusEffects.length > 0) {
            const effectIcons = fruit.statusEffects
                .map(effect => `${effect.icon || '⭐'}`)
                .join('');
            statusEffectsText = ` ${effectIcons}`;
        }
        
        return `${fruit.emoji} **${fruit.name}**${cooldownText}${statusEffectsText}\n${hpBar} **${hpPercent}%** (${fruit.currentHP}/${fruit.maxHP})`;
    }).join('\n\n');
    
    embed.addFields({
        name: `⚔️ YOUR Team (${attacker.username})`,
        value: attackerTeamText || 'No fruits remaining',
        inline: false
    });
    
    // IMPROVED: AI team display with same clean format
    const defenderTeamText = defender.team.map((fruit, index) => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const hpPercent = Math.round((fruit.currentHP / fruit.maxHP) * 100);
        
        let statusEffectsText = '';
        if (fruit.statusEffects && fruit.statusEffects.length > 0) {
            const effectIcons = fruit.statusEffects
                .map(effect => `${effect.icon || '⭐'}`)
                .join('');
            statusEffectsText = ` ${effectIcons}`;
        }
        
        return `${fruit.emoji} **${fruit.name}**${statusEffectsText}\n${hpBar} **${hpPercent}%** (${fruit.currentHP}/${fruit.maxHP})`;
    }).join('\n\n');
    
    embed.addFields({
        name: `🤖 AI Team (${defender.username})`,
        value: defenderTeamText || 'No fruits remaining',
        inline: false
    });
    
    // IMPROVED: Better battle log formatting (last 8 actions)
    if (raidState.battleLog.length > 0) {
        const recentActions = raidState.battleLog
            .slice(-8) // Show last 8 actions instead of 6
            .map(entry => {
                // Format based on action type
                switch (entry.type) {
                    case 'action_start':
                        return `⚔️ ${entry.message}`;
                    case 'critical':
                        return `💥 ${entry.message}`;
                    case 'normal_damage':
                    case 'critical_damage':
                        return `💢 ${entry.message}`;
                    case 'hp_update':
                        return `🩸 ${entry.message}`;
                    case 'dodge':
                        return `💨 ${entry.message}`;
                    case 'defeat':
                        return `💀 ${entry.message}`;
                    case 'effect':
                        return `✨ ${entry.message}`;
                    case 'aoe_damage':
                        return `🌊 ${entry.message}`;
                    case 'recoil':
                        return `🔄 ${entry.message}`;
                    default:
                        return entry.message;
                }
            })
            .join('\n');
        
        embed.addFields({
            name: '📜 Recent Battle Actions',
            value: recentActions.length > 1024 ? recentActions.substring(0, 1021) + '...' : recentActions,
            inline: false
        });
    }
    
    // IMPROVED: Clear turn instructions
    const instructionText = selectedSkill ? 
        `✅ **${selectedSkill.split('_')[0].toUpperCase()} Selected!** Choose your target from the AI team.` :
        `🎯 **Your Turn!** Select an attack/skill, then choose your target.`;
    
    embed.addFields({
        name: '⏰ Turn Instructions',
        value: instructionText,
        inline: false
    });
    
    return embed;
}

/**
 * IMPROVED: Perfect HP bar with better visual feedback
 */
function createPerfectHPBar(currentHP, maxHP) {
    const barLength = 12; // Consistent bar length
    const percentage = Math.max(0, Math.min(1, currentHP / maxHP));
    const filledBars = Math.floor(percentage * barLength);
    const emptyBars = barLength - filledBars;
    
    if (percentage <= 0) {
        return '🔴'.repeat(barLength); // All red when dead
    }
    
    let hpEmoji = '🟢'; // Green for healthy
    if (percentage < 0.25) {
        hpEmoji = '🔴'; // Red for critical
    } else if (percentage < 0.5) {
        hpEmoji = '🟡'; // Yellow for wounded
    }
    
    return hpEmoji.repeat(filledBars) + '⚫'.repeat(emptyBars);
}

// ===== IMPROVED AI SYSTEM =====

/**
 * IMPROVED: Enhanced AI turn processing with better damage
 */
async function processAITurn(raidState) {
    const availableAIFruits = raidState.defender.team
        .map((fruit, index) => ({ fruit, index }))
        .filter(({ fruit }) => 
            fruit.currentHP > 0 && 
            fruit.cooldown === 0 && 
            !isDisabled(fruit)
        );
    
    if (availableAIFruits.length === 0) {
        raidState.battleLog.push({
            type: 'ai_skip',
            message: `⏭️ **${raidState.defender.username}** has no available fruits - turn skipped!`,
            turn: raidState.turn
        });
        return;
    }
    
    // Target PLAYER team
    const availablePlayerTargets = raidState.attacker.team
        .map((fruit, index) => ({ fruit, index }))
        .filter(({ fruit }) => fruit.currentHP > 0);
    
    if (availablePlayerTargets.length === 0) {
        raidState.battleLog.push({
            type: 'ai_no_targets',
            message: `⏭️ **${raidState.defender.username}** has no valid targets!`,
            turn: raidState.turn
        });
        return;
    }
    
    // Smart AI fruit and target selection
    const selectedAI = selectBestAIFruit(availableAIFruits, availablePlayerTargets);
    const selectedTarget = selectBestAITarget(availablePlayerTargets, selectedAI.fruit);
    
    // Enhanced AI skill decision
    const skillData = getSkillData(selectedAI.fruit.id, selectedAI.fruit.rarity);
    const shouldUseSkill = decideAISkillUsage(selectedAI.fruit, selectedTarget.fruit, skillData, raidState);
    
    const skillChoice = shouldUseSkill ? `skill_${selectedAI.index}` : `basic_${selectedAI.index}`;
    
    // IMPROVED: Better AI action announcement
    const actionType = shouldUseSkill ? skillData?.name || 'Special Skill' : 'Basic Attack';
    
    raidState.battleLog.push({
        type: 'ai_action',
        message: `🤖 **AI ${selectedAI.fruit.name}** prepares **${actionType}** against **YOUR ${selectedTarget.fruit.name}**!`,
        turn: raidState.turn
    });
    
    // Execute AI attack against PLAYER target
    const actualDamage = await executeAIAttack(raidState, selectedAI, selectedTarget, shouldUseSkill, skillData);
    
    // IMPROVED: Ensure AI does meaningful damage
    if (actualDamage === 0 && shouldUseSkill) {
        raidState.battleLog.push({
            type: 'ai_miss',
            message: `⚠️ **AI attack missed** - applying backup damage`,
            turn: raidState.turn
        });
        const backupDamage = Math.max(Math.floor(selectedTarget.fruit.maxHP * 0.05), 15); // At least 5% or 15 damage
        selectedTarget.fruit.currentHP = Math.max(0, selectedTarget.fruit.currentHP - backupDamage);
        
        raidState.battleLog.push({
            type: 'ai_backup_damage',
            message: `💥 **AI** deals **${backupDamage}** backup damage to **YOUR ${selectedTarget.fruit.name}**`,
            turn: raidState.turn
        });
        
        const hpPercent = Math.round((selectedTarget.fruit.currentHP / selectedTarget.fruit.maxHP) * 100);
        raidState.battleLog.push({
            type: 'hp_update',
            message: `🩸 **YOUR ${selectedTarget.fruit.name}**: ${selectedTarget.fruit.currentHP}/${selectedTarget.fruit.maxHP} HP (${hpPercent}%)`,
            turn: raidState.turn
        });
    }
}

/**
 * IMPROVED: Execute AI attack with guaranteed meaningful damage
 */
async function executeAIAttack(raidState, selectedAI, selectedTarget, shouldUseSkill, skillData) {
    const attackingFruit = selectedAI.fruit;
    const defendingFruit = selectedTarget.fruit;
    
    const skillName = shouldUseSkill ? (skillData?.name || 'Special Skill') : 'Basic Attack';
    
    // Calculate damage modifiers
    const attackerModifiers = calculateDamageModifiers(attackingFruit);
    const defenderModifiers = calculateDamageModifiers(defendingFruit);
    
    // IMPROVED: Much lower dodge chance for AI attacks
    const dodgeChance = calculateDodgeChance(attackingFruit, defendingFruit, defenderModifiers) * 0.3; // AI has much better accuracy
    if (Math.random() < dodgeChance) {
        raidState.battleLog.push({
            type: 'ai_dodge',
            message: `💨 **YOUR ${defendingFruit.name}** dodged the AI attack!`,
            turn: raidState.turn
        });
        if (shouldUseSkill) {
            attackingFruit.cooldown = skillData?.cooldown || 2;
        }
        return 0;
    }
    
    // IMPROVED: Calculate higher AI damage
    const isBasicAttack = !shouldUseSkill;
    const baseDamage = isBasicAttack ? 120 : (skillData?.damage || 180); // Higher AI base damage
    
    let damage = calculateEnhancedDamage(attackingFruit, defendingFruit, baseDamage, attackerModifiers, isBasicAttack);
    
    // IMPROVED: AI gets slight damage bonus
    damage = Math.floor(damage * 1.15); // 15% AI damage bonus
    
    // Critical hit calculation
    const criticalChance = calculateCriticalChance(attackingFruit, attackerModifiers, skillData);
    const isCritical = Math.random() < criticalChance;
    
    if (isCritical) {
        damage = Math.floor(damage * RAID_CONFIG.CRIT_DAMAGE_MULTIPLIER);
        raidState.battleLog.push({
            type: 'ai_critical',
            message: `💥 **AI scores a CRITICAL HIT!**`,
            turn: raidState.turn
        });
    }
    
    // Apply skill effects if using skill
    if (shouldUseSkill && skillData?.effect) {
        const effectResults = applyEnhancedSkillEffect(attackingFruit, defendingFruit, skillData, damage);
        
        if (effectResults && effectResults.messages && effectResults.messages.length > 0) {
            effectResults.messages.forEach(msg => {
                raidState.battleLog.push({
                    type: 'ai_effect',
                    message: msg,
                    turn: raidState.turn
                });
            });
        }
        
        if (effectResults && effectResults.damageMultiplier) {
            damage = Math.floor(damage * effectResults.damageMultiplier);
        }
    }
    
    // IMPROVED: Apply final damage to PLAYER fruit with better messaging
    const originalHP = defendingFruit.currentHP;
    defendingFruit.currentHP = Math.max(0, defendingFruit.currentHP - damage);
    const actualDamage = originalHP - defendingFruit.currentHP;
    
    // IMPROVED: Ensure minimum damage from AI
    if (actualDamage === 0 && damage > 0) {
        const minDamage = Math.max(Math.floor(defendingFruit.maxHP * 0.04), 12); // At least 4% or 12 damage
        defendingFruit.currentHP = Math.max(0, defendingFruit.currentHP - minDamage);
        const forcedDamage = originalHP - defendingFruit.currentHP;
        
        raidState.battleLog.push({
            type: 'ai_damage',
            message: `💥 **AI ${skillName}** deals **${forcedDamage}** damage to **YOUR ${defendingFruit.name}**`,
            turn: raidState.turn,
            damage: forcedDamage,
            isCritical
        });
        
        const hpPercent = Math.round((defendingFruit.currentHP / defendingFruit.maxHP) * 100);
        raidState.battleLog.push({
            type: 'hp_update',
            message: `🩸 **YOUR ${defendingFruit.name}**: ${defendingFruit.currentHP}/${defendingFruit.maxHP} HP (${hpPercent}%)`,
            turn: raidState.turn
        });
        
        return forcedDamage;
    }
    
    // Set AI cooldown
    if (shouldUseSkill) {
        attackingFruit.cooldown = skillData?.cooldown || 2;
    }
    
    // IMPROVED: Enhanced battle log for AI actions
    const damageType = isCritical ? 'ai_critical_damage' : 'ai_damage';
    raidState.battleLog.push({
        type: damageType,
        message: `💥 **AI ${skillName}** deals **${actualDamage}** damage to **YOUR ${defendingFruit.name}**`,
        turn: raidState.turn,
        damage: actualDamage,
        isCritical
    });
    
    const hpPercent = Math.round((defendingFruit.currentHP / defendingFruit.maxHP) * 100);
    const hpStatus = defendingFruit.currentHP > 0 ? 
        `🩸 **YOUR ${defendingFruit.name}**: ${defendingFruit.currentHP}/${defendingFruit.maxHP} HP (${hpPercent}%)` :
        `💀 **YOUR ${defendingFruit.name}** has been defeated by AI!`;
    
    raidState.battleLog.push({
        type: 'hp_update',
        message: hpStatus,
        turn: raidState.turn,
        target: defendingFruit.name,
        hp: defendingFruit.currentHP,
        maxHP: defendingFruit.maxHP,
        defeated: defendingFruit.currentHP === 0
    });
    
    // Handle defeated player fruits
    if (defendingFruit.currentHP === 0) {
        raidState.battleLog.push({
            type: 'defeat',
            message: `💀 **YOUR ${defendingFruit.name}** was defeated by AI!`,
            turn: raidState.turn
        });
        defendingFruit.statusEffects = [];
    }
    
    return actualDamage;
}

/**
 * IMPROVED: Enhanced AI skill usage decision - Prioritize skills with better logic
 */
function decideAISkillUsage(attackingFruit, targetFruit, skillData, raidState) {
    if (!skillData || attackingFruit.cooldown > 0) {
        return false;
    }
    
    const targetHpPercent = targetFruit.currentHP / targetFruit.maxHP;
    
    // PRIORITY 1: Always use skills for finishing blows
    if (targetHpPercent < 0.35 && skillData.damage > (targetFruit.currentHP * 0.8)) {
        return true;
    }
    
    // PRIORITY 2: Always prioritize AOE skills when multiple targets
    const livingTargets = raidState.attacker.team.filter(f => f.currentHP > 0).length;
    if ((skillData.range === 'area' || skillData.range === 'all') && livingTargets > 2) {
        return true;
    }
    
    // PRIORITY 3: Always use effect skills
    if (skillData.effect) {
        return true;
    }
    
    // PRIORITY 4: Use high damage skills against healthy targets
    if (targetHpPercent > 0.6 && skillData.damage > 120) {
        return true;
    }
    
    // PRIORITY 5: Use skills more often early in battle
    if (raidState.turn <= 8) {
        return Math.random() < 0.95; // 95% in first 8 turns
    }
    
    // PRIORITY 6: General high skill preference
    return Math.random() < 0.85; // 85% base chance
}

// ===== IMPROVED BATTLE INTERFACE =====

/**
 * IMPROVED: Enhanced battle interface with better status processing
 */
async function showBattleInterface(interaction, raidState) {
    // IMPROVED: Process status effects with clear messaging
    if (raidState.battleLog.length === 0 || !raidState.battleLog.some(entry => entry.turn === raidState.turn)) {
        raidState.battleLog.push({
            type: 'turn_start',
            message: `\n⏰ **=== TURN ${raidState.turn} START ===**`,
            turn: raidState.turn
        });
    }
    
    processAllStatusEffects(raidState);
    
    // Check if battle ended due to status effects
    const battleResult = checkBattleEnd(raidState);
    if (battleResult.ended) {
        await endBattle(interaction, raidState, battleResult);
        return;
    }
    
    const availableFruits = raidState.attacker.team
        .filter(fruit => fruit.currentHP > 0 && fruit.cooldown === 0 && !isDisabled(fruit));
    
    if (availableFruits.length === 0) {
        raidState.battleLog.push({
            type: 'player_skip',
            message: `⏭️ **${raidState.attacker.username}** has no available fruits - turn skipped!`,
            turn: raidState.turn
        });
        
        await processAITurn(raidState);
        
        processAllStatusEffects(raidState);
        
        const battleResult2 = checkBattleEnd(raidState);
        if (battleResult2.ended) {
            await endBattle(interaction, raidState, battleResult2);
            return;
        }
        
        reduceCooldowns(raidState.attacker);
        reduceCooldowns(raidState.defender);
        raidState.turn++;
        raidState.currentPlayer = 'attacker';
        
        return showBattleInterface(interaction, raidState);
    }
    
    const embed = createEnhancedBattleEmbed(raidState);
    const components = createEnhancedBattleComponents(raidState);
    
    try {
        await interaction.editReply({
            embeds: [embed],
            components
        });
        
        setupEnhancedBattleCollector(interaction, raidState);
    } catch (error) {
        console.error('Failed to show battle interface:', error);
        await endBattle(interaction, raidState, { 
            ended: true, 
            winner: raidState.defender.userId, 
            reason: 'interface_error' 
        });
    }
}

/**
 * IMPROVED: Process all status effects with better messaging
 */
function processAllStatusEffects(raidState) {
    // Process attacker team status effects
    raidState.attacker.team.forEach(fruit => {
        if (fruit.currentHP > 0) {
            processStatusEffects(fruit, raidState.battleLog, raidState.turn, 'YOUR');
        }
    });
    
    // Process defender team status effects
    raidState.defender.team.forEach(fruit => {
        if (fruit.currentHP > 0) {
            processStatusEffects(fruit, raidState.battleLog, raidState.turn, 'AI');
        }
    });
}

/**
 * IMPROVED: Process individual fruit status effects with better formatting
 */
function processStatusEffects(fruit, battleLog, turn, teamPrefix = '') {
    if (!fruit.statusEffects || fruit.statusEffects.length === 0) return;

    fruit.statusEffects = fruit.statusEffects.filter(effect => {
        let shouldKeepEffect = true;
        
        switch (effect.type) {
            case 'dot':
                const dotDamage = effect.damage || Math.floor(fruit.maxHP * 0.1);
                const actualDotDamage = Math.min(fruit.currentHP, dotDamage);
                
                if (actualDotDamage > 0) {
                    fruit.currentHP = Math.max(0, fruit.currentHP - actualDotDamage);
                    battleLog.push({
                        type: 'status_damage',
                        message: `${effect.icon || '☠️'} **${teamPrefix} ${fruit.name}** takes **${actualDotDamage}** ${effect.name} damage`,
                        turn: turn
                    });
                    
                    if (fruit.currentHP === 0) {
                        battleLog.push({
                            type: 'status_defeat',
                            message: `💀 **${teamPrefix} ${fruit.name}** was defeated by ${effect.name}!`,
                            turn: turn
                        });
                    }
                }
                break;
                
            case 'heal':
                const healAmount = effect.value || Math.floor(fruit.maxHP * 0.1);
                const actualHeal = Math.min(healAmount, fruit.maxHP - fruit.currentHP);
                
                if (actualHeal > 0) {
                    fruit.currentHP = Math.min(fruit.maxHP, fruit.currentHP + actualHeal);
                    battleLog.push({
                        type: 'status_heal',
                        message: `${effect.icon || '💚'} **${teamPrefix} ${fruit.name}** recovers **${actualHeal}** HP from ${effect.name}`,
                        turn: turn
                    });
                }
                break;
        }
        
        if (effect.duration > 0) {
            effect.duration--;
            
            if (effect.duration === 0) {
                battleLog.push({
                    type: 'status_expire',
                    message: `⏰ **${effect.name}** expired on **${teamPrefix} ${fruit.name}**`,
                    turn: turn
                });
                shouldKeepEffect = false;
            }
        }
        
        return shouldKeepEffect;
    });
}

/**
 * IMPROVED: Enhanced battle components with better skill info
 */
function createEnhancedBattleComponents(raidState, selectedSkill = null) {
    if (raidState.currentPlayer !== 'attacker') {
        return [];
    }
    
    const components = [];
    
    // STEP 1: Skill Selection Dropdown
    if (!selectedSkill) {
        const availableSkills = [];
        
        raidState.attacker.team.forEach((fruit, index) => {
            if (fruit.currentHP > 0 && !isDisabled(fruit)) {
                const skillData = getSkillData(fruit.id, fruit.rarity) || {
                    name: `${fruit.name} Power`,
                    damage: 120,
                    cooldown: 2
                };
                
                // Basic Attack option with improved damage calculation
                const rarityBasicBonus = getRarityBasicAttackBonus(fruit.rarity);
                const basicDamage = Math.floor(100 * rarityBasicBonus);
                availableSkills.push({
                    label: `${fruit.name} - Basic Attack`,
                    description: `~${basicDamage} base damage • Always ready • ${fruit.rarity}`,
                    value: `basic_${index}`,
                    emoji: fruit.emoji
                });
                
                // Special Skill option (if not on cooldown)
                if (fruit.cooldown === 0 && !areSkillsDisabled(fruit)) {
                    let skillDescription = `~${skillData.damage || 150} base damage`;
                    
                    if (skillData.effect) {
                        skillDescription += ` • Special Effect`;
                    }
                    
                    if (skillData.range && skillData.range !== 'single') {
                        skillDescription += ` • ${skillData.range.toUpperCase()}`;
                    }
                    
                    skillDescription += ` • ${skillData.cooldown || 2} turn CD`;
                    
                    availableSkills.push({
                        label: `${fruit.name} - ${skillData.name}`,
                        description: skillDescription.substring(0, 100),
                        value: `skill_${index}`,
                        emoji: '✨'
                    });
                }
            }
        });
        
        if (availableSkills.length > 0) {
            const skillMenu = new StringSelectMenuBuilder()
                .setCustomId(`skill_select_${raidState.id}`)
                .setPlaceholder('🎯 Step 1: Choose your attack type...')
                .addOptions(availableSkills.slice(0, 25));
            
            components.push(new ActionRowBuilder().addComponents(skillMenu));
        }
    }
    
    // STEP 2: Target Selection Dropdown (only AI team)
    if (selectedSkill) {
        const availableTargets = [];
        
        raidState.defender.team.forEach((fruit, index) => {
            if (fruit.currentHP > 0) {
                const hpPercent = Math.round((fruit.currentHP / fruit.maxHP) * 100);
                
                let effectsText = '';
                if (fruit.statusEffects && fruit.statusEffects.length > 0) {
                    const effects = fruit.statusEffects
                        .map(e => `${e.icon || '⭐'}`)
                        .join('');
                    effectsText = ` ${effects}`;
                }
                
                const description = `AI Target • ${hpPercent}% HP • ${fruit.rarity}${effectsText}`.substring(0, 100);
                
                availableTargets.push({
                    label: `🤖 ${fruit.name}`,
                    description: description,
                    value: index.toString(),
                    emoji: fruit.emoji
                });
            }
        });
        
        if (availableTargets.length > 0) {
            const targetMenu = new StringSelectMenuBuilder()
                .setCustomId(`target_select_${raidState.id}`)
                .setPlaceholder('🎯 Step 2: Choose AI target to attack...')
                .addOptions(availableTargets);
            
            components.push(new ActionRowBuilder().addComponents(targetMenu));
        }
        
        // Add a "Back" button
        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`change_skill_${raidState.id}`)
                    .setLabel('↩️ Change Attack')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        components.push(backButton);
    }
    
    return components;
}

// Continue with existing helper functions and remaining implementation...
// [Rest of the file continues with the same helper functions like calculateCriticalChance, 
// calculateDodgeChance, checkBattleEnd, etc. from the original code]

/**
 * Calculate critical hit chance with proper scaling
 */
function calculateCriticalChance(attacker, attackerModifiers, skillData) {
    let critChance = RAID_CONFIG.BASE_CRIT_CHANCE;
    
    // Rarity bonus
    const rarityBonus = {
        'common': 0.05, 'uncommon': 0.08, 'rare': 0.12, 'epic': 0.16,
        'legendary': 0.20, 'mythical': 0.25, 'divine': 0.30
    };
    critChance += (rarityBonus[attacker.rarity] || 0.05);
    
    // Skill bonus
    if (skillData && skillData.type === 'attack') {
        critChance += 0.1;
    }
    
    // Status effect modifiers
    if (attackerModifiers.criticalModifier) {
        critChance += attackerModifiers.criticalModifier;
    }
    
    return Math.max(0, Math.min(0.95, critChance));
}

/**
 * Calculate dodge chance with diminishing returns
 */
function calculateDodgeChance(attacker, defender, defenderModifiers) {
    let dodgeChance = RAID_CONFIG.BASE_DODGE_CHANCE;
    
    // Speed difference factor
    const speedDiff = (defender.totalCP - attacker.totalCP) / 15000;
    dodgeChance += Math.max(-0.03, Math.min(0.08, speedDiff));
    
    // Status effect modifiers
    if (defenderModifiers.speedModifier) {
        const speedBonus = (defenderModifiers.speedModifier - 1) * 0.15;
        dodgeChance += speedBonus;
    }
    
    return Math.max(0.01, Math.min(0.20, dodgeChance));
}

function calculateDamageModifiers(fruit) {
    let damageModifier = 1;
    let criticalModifier = 0;
    let speedModifier = 1;
    
    if (fruit.statusEffects) {
        fruit.statusEffects.forEach(effect => {
            if (effect.type === 'buff') {
                switch (effect.effect) {
                    case 'damage':
                        damageModifier *= (1 + (effect.modifier || 0.2));
                        break;
                    case 'critical':
                        criticalModifier += (effect.modifier || 0.2);
                        break;
                    case 'speed':
                        speedModifier *= (1 + (effect.modifier || 0.2));
                        break;
                }
            } else if (effect.type === 'debuff') {
                switch (effect.effect) {
                    case 'damage':
                        damageModifier *= (1 + (effect.modifier || -0.2));
                        break;
                    case 'speed':
                        speedModifier *= (1 + (effect.modifier || -0.2));
                        break;
                }
            }
        });
    }
    
    return { 
        damageModifier: Math.max(0.1, damageModifier), 
        criticalModifier: Math.max(0, Math.min(0.8, criticalModifier)), 
        speedModifier: Math.max(0.1, speedModifier) 
    };
}

function applyEnhancedSkillEffect(attacker, defender, skillData, skillDamage) {
    const result = {
        effectName: skillData.effect,
        messages: [],
        damageMultiplier: null
    };

    const attackerFruitName = attacker.name;
    const defenderFruitName = defender.name;

    const effectMapping = {
        'burn_damage': () => {
            const dotDamage = Math.floor(skillDamage * 0.25);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Burning',
                duration: 3,
                damage: dotDamage,
                icon: '🔥',
                source: attackerFruitName
            });
            result.messages.push(`🔥 **${defenderFruitName}** is set ablaze! (${dotDamage} damage/turn for 3 turns)`);
        },
        
        'freeze_effect': () => {
            const dotDamage = Math.floor(skillDamage * 0.18);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Frostbite',
                duration: 2,
                damage: dotDamage,
                icon: '❄️',
                source: attackerFruitName
            });
            result.messages.push(`❄️ **${defenderFruitName}** is frozen! (${dotDamage} frostbite/turn for 2 turns)`);
        },
        
        'lightning_strike': () => {
            const dotDamage = Math.floor(skillDamage * 0.15);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Electrocution',
                duration: 2,
                damage: dotDamage,
                icon: '⚡',
                source: attackerFruitName
            });
            result.messages.push(`⚡ **${defenderFruitName}** is electrocuted! (${dotDamage} shock/turn for 2 turns)`);
        },
        
        'default': () => {
            const dotDamage = Math.floor(skillDamage * 0.20);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Devil Fruit Effect',
                duration: 2,
                damage: dotDamage,
                icon: '🍈',
                source: attackerFruitName
            });
            result.messages.push(`🍈 **${defenderFruitName}** suffers from devil fruit power! (${dotDamage} damage/turn for 2 turns)`);
        }
    };

    const effectFunction = effectMapping[skillData.effect] || effectMapping['default'];
    effectFunction();

    return result;
}

function addStatusEffect(fruit, effect) {
    if (!fruit.statusEffects) {
        fruit.statusEffects = [];
    }

    const existingEffect = fruit.statusEffects.find(e => e.name === effect.name);
    
    if (existingEffect) {
        existingEffect.duration = Math.max(existingEffect.duration, effect.duration);
        if (effect.damage && existingEffect.damage) {
            existingEffect.damage = Math.max(existingEffect.damage, effect.damage);
        }
    } else {
        fruit.statusEffects.push(effect);
    }
}

function isDisabled(fruit) {
    if (!fruit.statusEffects) return false;
    return fruit.statusEffects.some(effect => 
        effect.type === 'disable' && (effect.name === 'Stunned' || effect.name === 'Frozen')
    );
}

function areSkillsDisabled(fruit) {
    if (!fruit.statusEffects) return false;
    return fruit.statusEffects.some(effect => 
        effect.type === 'disable' && effect.name === 'Skill Locked'
    );
}

// Helper functions for battle management
function checkBattleEnd(raidState) {
    const attackerAlive = raidState.attacker.team.some(fruit => fruit.currentHP > 0);
    const defenderAlive = raidState.defender.team.some(fruit => fruit.currentHP > 0);
    
    if (!attackerAlive) {
        return { ended: true, winner: raidState.defender.userId, reason: 'All attacker fruits defeated' };
    }
    
    if (!defenderAlive) {
        return { ended: true, winner: raidState.attacker.userId, reason: 'All defender fruits defeated' };
    }
    
    if (raidState.turn >= RAID_CONFIG.MAX_BATTLE_TURNS) {
        const attackerHP = raidState.attacker.team.reduce((sum, fruit) => sum + fruit.currentHP, 0);
        const defenderHP = raidState.defender.team.reduce((sum, fruit) => sum + fruit.currentHP, 0);
        
        return { 
            ended: true, 
            winner: attackerHP > defenderHP ? raidState.attacker.userId : raidState.defender.userId,
            reason: 'Turn limit reached'
        };
    }
    
    return { ended: false };
}

function reduceCooldowns(player) {
    player.team.forEach(fruit => {
        if (fruit.cooldown > 0) {
            fruit.cooldown--;
        }
    });
}

// Other helper functions continue as in original code...
// [Include remaining functions like setupEnhancedBattleCollector, validateRaid, etc.]
