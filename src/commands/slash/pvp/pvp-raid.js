// src/commands/slash/pvp/pvp-raid.js - COMPLETELY FIXED VERSION WITH PROPER DAMAGE & UI
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const { getSkillData } = require('../../../data/DevilFruitSkills');
const SkillEffectService = require('../../../services/SkillEffectService');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');

// FIXED: Enhanced raid configuration with proper balance
const RAID_CONFIG = {
    COOLDOWN_TIME: 300000, // 5 minutes
    MIN_CP_REQUIRED: 500,
    BERRY_STEAL_PERCENTAGE: 0.15,
    FRUIT_DROP_CHANCES: {
        'divine': 0.01, 'mythical': 0.02, 'legendary': 0.05,
        'epic': 0.08, 'rare': 0.12, 'uncommon': 0.18, 'common': 0.25
    },
    MAX_FRUIT_DROPS: 3,
    
    // FIXED: Battle system with proper damage calculations
    MAX_BATTLE_TURNS: 30,
    TURN_TIMEOUT: 300000,
    HP_BAR_LENGTH: 20,
    TEAM_SIZE: 5,
    FRUITS_PER_PAGE: 12,
    INTERACTION_TIMEOUT: 900000,
    
    // FIXED: Proper damage calculations that guarantee hits
    MIN_DAMAGE_PERCENT: 0.08,     // Minimum 8% of target's max HP
    MAX_DAMAGE_PERCENT: 0.25,     // Maximum 25% of target's max HP
    BASE_DAMAGE_MULTIPLIER: 1.5,  // Base damage multiplier
    CP_SCALING_FACTOR: 0.5,       // How much CP difference affects damage
    SKILL_DAMAGE_BONUS: 1.8,      // Skill damage bonus over basic attacks
    
    // FIXED: Critical and dodge rates
    BASE_CRIT_CHANCE: 0.15,       // 15% base critical chance
    CRIT_DAMAGE_MULTIPLIER: 1.8,  // 80% more damage on crit
    BASE_DODGE_CHANCE: 0.08,      // 8% base dodge chance
    
    // Status effect settings
    MAX_STATUS_DURATION: 5,
    STATUS_STACK_LIMIT: 3,
    
    // AI behavior settings
    AI_SKILL_USE_CHANCE: 0.7,
    AI_AGGRESSION: 0.8
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

// ===== FIXED DAMAGE CALCULATION SYSTEM =====

/**
 * FIXED: Calculate guaranteed damage that properly scales with CP
 */
function calculateEnhancedDamage(attackingFruit, defendingFruit, baseDamage, attackerModifiers = {}) {
    const targetMaxHP = defendingFruit.maxHP;
    
    // FIXED: Base damage as percentage of target's max HP (guaranteed meaningful damage)
    const basePercent = RAID_CONFIG.MIN_DAMAGE_PERCENT + 
        (Math.random() * (RAID_CONFIG.MAX_DAMAGE_PERCENT - RAID_CONFIG.MIN_DAMAGE_PERCENT));
    
    let damage = Math.floor(targetMaxHP * basePercent);
    
    // FIXED: CP scaling that actually matters
    const cpRatio = attackingFruit.totalCP / Math.max(defendingFruit.totalCP, 1);
    const cpMultiplier = 0.7 + (cpRatio * RAID_CONFIG.CP_SCALING_FACTOR);
    damage = Math.floor(damage * Math.min(cpMultiplier, 2.0)); // Cap at 2x
    
    // Apply rarity bonus
    const rarityBonus = getRarityDamageBonus(attackingFruit.rarity);
    damage = Math.floor(damage * rarityBonus);
    
    // Apply attacker modifiers
    if (attackerModifiers.damageModifier) {
        damage = Math.floor(damage * attackerModifiers.damageModifier);
    }
    
    // Ensure minimum damage
    const minDamage = Math.floor(targetMaxHP * 0.05); // At least 5% of max HP
    damage = Math.max(damage, minDamage);
    
    // Cap maximum damage per hit
    const maxDamage = Math.floor(targetMaxHP * 0.35); // Max 35% of max HP
    damage = Math.min(damage, maxDamage);
    
    return damage;
}

/**
 * FIXED: Calculate critical hit chance with proper scaling
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
 * FIXED: Calculate dodge chance with diminishing returns
 */
function calculateDodgeChance(attacker, defender, defenderModifiers) {
    let dodgeChance = RAID_CONFIG.BASE_DODGE_CHANCE;
    
    // Speed difference factor (much smaller impact)
    const speedDiff = (defender.totalCP - attacker.totalCP) / 10000;
    dodgeChance += Math.max(-0.05, Math.min(0.1, speedDiff));
    
    // Status effect modifiers
    if (defenderModifiers.speedModifier) {
        const speedBonus = (defenderModifiers.speedModifier - 1) * 0.2;
        dodgeChance += speedBonus;
    }
    
    return Math.max(0.02, Math.min(0.25, dodgeChance)); // 2-25% dodge chance
}

/**
 * Get rarity damage bonus
 */
function getRarityDamageBonus(rarity) {
    const bonuses = {
        'common': 1.0, 'uncommon': 1.05, 'rare': 1.1, 'epic': 1.15,
        'legendary': 1.2, 'mythical': 1.25, 'divine': 1.3
    };
    return bonuses[rarity] || 1.0;
}

// ===== FIXED BATTLE EXECUTION SYSTEM =====

/**
 * FIXED: Execute attack with guaranteed damage and proper effects
 */
async function executeAttack(raidState, skillChoice, targetFruitIndex) {
    const [skillType, attackerFruitIndex] = skillChoice.split('_');
    const attackingFruit = raidState.attacker.team[parseInt(attackerFruitIndex)];
    const defendingFruit = raidState.defender.team[targetFruitIndex];
    
    // Check if attacker is dead or disabled
    if (attackingFruit.currentHP <= 0) {
        raidState.battleLog.push(`💀 ${attackingFruit.name} cannot attack - already defeated!`);
        return 0;
    }
    
    if (isDisabled(attackingFruit)) {
        raidState.battleLog.push(`😵 ${attackingFruit.name} is disabled and cannot act!`);
        return 0;
    }
    
    if (defendingFruit.currentHP <= 0) {
        raidState.battleLog.push(`💀 Cannot target ${defendingFruit.name} - already defeated!`);
        return 0;
    }
    
    // Get skill data
    const skillData = getSkillData(attackingFruit.id, attackingFruit.rarity) || {
        name: `${attackingFruit.name} Power`,
        damage: 100,
        cooldown: 2,
        effect: null,
        description: 'A basic devil fruit ability',
        type: 'attack',
        range: 'single'
    };
    
    const isSkillAttack = skillType === 'skill';
    const skillName = isSkillAttack ? skillData.name : 'Basic Attack';
    
    raidState.battleLog.push(`⚔️ ${raidState.attacker.username} uses ${attackingFruit.name}'s ${skillName}!`);
    
    // Calculate damage modifiers
    const attackerModifiers = calculateDamageModifiers(attackingFruit);
    const defenderModifiers = calculateDamageModifiers(defendingFruit);
    
    // FIXED: Dodge check (much lower chance now)
    const dodgeChance = calculateDodgeChance(attackingFruit, defendingFruit, defenderModifiers);
    if (Math.random() < dodgeChance) {
        raidState.battleLog.push(`💨 ${defendingFruit.name} dodged the attack!`);
        if (isSkillAttack) {
            attackingFruit.cooldown = skillData.cooldown || 2;
        }
        return 0;
    }
    
    // FIXED: Calculate guaranteed meaningful damage
    const baseDamage = isSkillAttack ? 
        (skillData.damage * RAID_CONFIG.SKILL_DAMAGE_BONUS) : 
        skillData.damage;
    
    let damage = calculateEnhancedDamage(attackingFruit, defendingFruit, baseDamage, attackerModifiers);
    
    // FIXED: Critical hit calculation
    const criticalChance = calculateCriticalChance(attackingFruit, attackerModifiers, skillData);
    const isCritical = Math.random() < criticalChance;
    
    if (isCritical) {
        damage = Math.floor(damage * RAID_CONFIG.CRIT_DAMAGE_MULTIPLIER);
        raidState.battleLog.push(`💥 Critical hit!`);
    }
    
    // Apply skill effects
    let effectResults = null;
    if (isSkillAttack && skillData.effect) {
        effectResults = applyEnhancedSkillEffect(attackingFruit, defendingFruit, skillData, damage);
        
        if (effectResults && effectResults.messages && effectResults.messages.length > 0) {
            effectResults.messages.forEach(msg => raidState.battleLog.push(msg));
        }
        
        if (effectResults && effectResults.damageMultiplier) {
            damage = Math.floor(damage * effectResults.damageMultiplier);
        }
    }
    
    // Apply final damage
    const originalHP = defendingFruit.currentHP;
    defendingFruit.currentHP = Math.max(0, defendingFruit.currentHP - damage);
    const actualDamage = originalHP - defendingFruit.currentHP;
    
    // Handle AOE effects
    if (skillData.range === 'area' || skillData.range === 'all') {
        const aoeDamage = Math.floor(actualDamage * 0.4);
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
            raidState.battleLog.push(`🌊 Area effect hits ${aoeTargets} additional targets for ${aoeDamage} damage each!`);
        }
    }
    
    // Apply minor recoil damage (much reduced)
    const recoilDamage = Math.floor(actualDamage * 0.03); // Only 3% recoil
    if (recoilDamage > 0) {
        attackingFruit.currentHP = Math.max(0, attackingFruit.currentHP - recoilDamage);
    }
    
    // Set cooldown for skills
    if (isSkillAttack) {
        attackingFruit.cooldown = skillData.cooldown || 2;
    }
    
    // Enhanced battle log with damage
    raidState.battleLog.push(`💥 ${skillName} deals ${actualDamage} damage to ${defendingFruit.name}`);
    raidState.battleLog.push(`🩸 ${defendingFruit.name}: ${defendingFruit.currentHP}/${defendingFruit.maxHP} HP remaining`);
    
    if (recoilDamage > 0) {
        raidState.battleLog.push(`🩸 ${attackingFruit.name} takes ${recoilDamage} recoil damage`);
    }
    
    // Handle defeated fruits
    if (attackingFruit.currentHP === 0) {
        raidState.battleLog.push(`💀 ${attackingFruit.name} was defeated by recoil damage!`);
        attackingFruit.statusEffects = [];
    }
    
    if (defendingFruit.currentHP === 0) {
        raidState.battleLog.push(`💀 ${defendingFruit.name} was defeated!`);
        defendingFruit.statusEffects = [];
    }
    
    return actualDamage;
}

// ===== ENHANCED UI SYSTEM =====

/**
 * FIXED: Create enhanced battle embed with clean layout
 */
function createEnhancedBattleEmbed(raidState, selectedSkill = null) {
    const { attacker, defender, turn } = raidState;
    
    const embed = new EmbedBuilder()
        .setTitle('⚔️ Devil Fruit Battle Arena')
        .setDescription(`**Turn ${turn}** | ${attacker.username} (YOU) vs ${defender.username} (AI)`)
        .setColor(RARITY_COLORS.legendary)
        .setTimestamp();
    
    // FIXED: Clean team display with better HP visualization
    const attackerTeamText = attacker.team.map((fruit, index) => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const hpPercent = Math.round((fruit.currentHP / fruit.maxHP) * 100);
        const cooldownText = fruit.cooldown > 0 ? ` ⏱️${fruit.cooldown}` : '';
        const statusIcon = fruit.currentHP > 0 ? '🟢' : '💀';
        
        let statusEffectsText = '';
        if (fruit.statusEffects && fruit.statusEffects.length > 0) {
            const effectIcons = fruit.statusEffects
                .map(effect => `${effect.icon || '⭐'}`)
                .join('');
            statusEffectsText = ` ${effectIcons}`;
        }
        
        return `${statusIcon} ${fruit.emoji} **${fruit.name}**${cooldownText}${statusEffectsText}\n${hpBar} **${hpPercent}%** (${fruit.currentHP}/${fruit.maxHP})`;
    }).join('\n\n');
    
    embed.addFields({
        name: `⚔️ YOUR Team (${attacker.username})`,
        value: attackerTeamText || 'No fruits remaining',
        inline: false
    });
    
    // FIXED: AI team display with same format
    const defenderTeamText = defender.team.map((fruit, index) => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const hpPercent = Math.round((fruit.currentHP / fruit.maxHP) * 100);
        const statusIcon = fruit.currentHP > 0 ? '🟢' : '💀';
        
        let statusEffectsText = '';
        if (fruit.statusEffects && fruit.statusEffects.length > 0) {
            const effectIcons = fruit.statusEffects
                .map(effect => `${effect.icon || '⭐'}`)
                .join('');
            statusEffectsText = ` ${effectIcons}`;
        }
        
        return `${statusIcon} ${fruit.emoji} **${fruit.name}**${statusEffectsText}\n${hpBar} **${hpPercent}%** (${fruit.currentHP}/${fruit.maxHP})`;
    }).join('\n\n');
    
    embed.addFields({
        name: `🤖 AI Team (${defender.username})`,
        value: defenderTeamText || 'No fruits remaining',
        inline: false
    });
    
    // FIXED: Cleaner battle log (last 6 actions only)
    if (raidState.battleLog.length > 0) {
        const recentActions = raidState.battleLog
            .slice(-6)
            .join('\n');
        embed.addFields({
            name: '📜 Recent Battle Actions',
            value: recentActions.length > 1024 ? recentActions.substring(0, 1021) + '...' : recentActions,
            inline: false
        });
    }
    
    // FIXED: Clear turn instructions
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
 * FIXED: Create enhanced battle components with clearer skill info
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
                    damage: 100,
                    cooldown: 2
                };
                
                // Basic Attack option
                const basicDamage = Math.floor(skillData.damage * 0.8);
                availableSkills.push({
                    label: `${fruit.name} - Basic Attack`,
                    description: `${basicDamage} base damage • Always ready`,
                    value: `basic_${index}`,
                    emoji: fruit.emoji
                });
                
                // Special Skill option (if not on cooldown)
                if (fruit.cooldown === 0 && !areSkillsDisabled(fruit)) {
                    let skillDescription = `${skillData.damage} base damage`;
                    
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
                .addOptions(availableSkills.slice(0, 25)); // Discord limit
            
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

/**
 * FIXED: Perfect HP bar that's always readable
 */
function createPerfectHPBar(currentHP, maxHP) {
    const barLength = 12; // Shorter for better mobile display
    const percentage = Math.max(0, Math.min(1, currentHP / maxHP));
    const filledBars = Math.floor(percentage * barLength);
    const emptyBars = barLength - filledBars;
    
    let hpEmoji = '🟢';
    if (percentage <= 0) {
        return '⚫'.repeat(barLength);
    } else if (percentage < 0.25) {
        hpEmoji = '🔴';
    } else if (percentage < 0.5) {
        hpEmoji = '🟡';
    }
    
    return hpEmoji.repeat(filledBars) + '⚫'.repeat(emptyBars);
}

// ===== ENHANCED AI SYSTEM =====

/**
 * FIXED: Enhanced AI turn processing with smarter decisions
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
        raidState.battleLog.push(`⏭️ ${raidState.defender.username} has no available fruits - turn skipped!`);
        return;
    }
    
    const availablePlayerTargets = raidState.attacker.team
        .map((fruit, index) => ({ fruit, index }))
        .filter(({ fruit }) => fruit.currentHP > 0);
    
    if (availablePlayerTargets.length === 0) {
        raidState.battleLog.push(`⏭️ ${raidState.defender.username} has no valid targets!`);
        return;
    }
    
    // Smart AI fruit and target selection
    const selectedAI = selectBestAIFruit(availableAIFruits, availablePlayerTargets);
    const selectedTarget = selectBestAITarget(availablePlayerTargets, selectedAI.fruit);
    
    // Enhanced AI skill decision
    const skillData = getSkillData(selectedAI.fruit.id, selectedAI.fruit.rarity);
    const shouldUseSkill = decideAISkillUsage(selectedAI.fruit, selectedTarget.fruit, skillData, raidState);
    
    const skillChoice = shouldUseSkill ? `skill_${selectedAI.index}` : `basic_${selectedAI.index}`;
    
    // Log AI decision
    const actionType = shouldUseSkill ? skillData?.name || 'Special Skill' : 'Basic Attack';
    raidState.battleLog.push(`🤖 ${selectedAI.fruit.name} prepares ${actionType}!`);
    
    // Execute the AI's attack
    await executeAttack(raidState, skillChoice, selectedTarget.index);
}

/**
 * Enhanced AI fruit selection
 */
function selectBestAIFruit(availableAIFruits, playerTargets) {
    let bestScore = -1;
    let bestFruit = availableAIFruits[0];
    
    availableAIFruits.forEach(({ fruit, index }) => {
        let score = 0;
        
        // HP and CP factors
        score += (fruit.currentHP / fruit.maxHP) * 30;
        score += (fruit.totalCP / 10000) * 40;
        
        // Skill availability
        const skillData = getSkillData(fruit.id, fruit.rarity);
        if (skillData && fruit.cooldown === 0) {
            score += 25;
            
            if ((skillData.range === 'area' || skillData.range === 'all') && playerTargets.length > 2) {
                score += 15;
            }
            
            if (skillData.damage > 120) {
                score += 10;
            }
        }
        
        // Status considerations
        if (fruit.statusEffects) {
            const debuffs = fruit.statusEffects.filter(e => e.type === 'debuff' || e.type === 'disable');
            score -= debuffs.length * 10;
            
            const buffs = fruit.statusEffects.filter(e => e.type === 'buff');
            score += buffs.length * 5;
        }
        
        score += Math.random() * 5;
        
        if (score > bestScore) {
            bestScore = score;
            bestFruit = { fruit, index };
        }
    });
    
    return bestFruit;
}

/**
 * Enhanced AI target selection
 */
function selectBestAITarget(availablePlayerTargets, attackingFruit) {
    let bestScore = -1;
    let bestTarget = availablePlayerTargets[0];
    
    availablePlayerTargets.forEach(({ fruit, index }) => {
        let score = 0;
        
        // Prioritize low HP targets
        const hpPercent = fruit.currentHP / fruit.maxHP;
        if (hpPercent < 0.3) {
            score += 60; // High priority for finishing
        } else if (hpPercent < 0.6) {
            score += 30;
        }
        
        // Prioritize high CP threats
        score += (fruit.totalCP / 10000) * 20;
        
        // Avoid heavily defended targets
        const hasDefenses = fruit.statusEffects && 
            fruit.statusEffects.some(e => e.type === 'defense' || e.type === 'immunity');
        
        if (!hasDefenses) {
            score += 15;
        }
        
        score += Math.random() * 10;
        
        if (score > bestScore) {
            bestScore = score;
            bestTarget = { fruit, index };
        }
    });
    
    return bestTarget;
}

/**
 * Enhanced AI skill usage decision
 */
function decideAISkillUsage(attackingFruit, targetFruit, skillData, raidState) {
    if (!skillData || attackingFruit.cooldown > 0) {
        return false;
    }
    
    const targetHpPercent = targetFruit.currentHP / targetFruit.maxHP;
    
    // Always use skills for finishing blows
    if (targetHpPercent < 0.3 && skillData.damage > targetFruit.currentHP) {
        return true;
    }
    
    // Prioritize AOE skills when multiple targets
    const livingTargets = raidState.attacker.team.filter(f => f.currentHP > 0).length;
    if ((skillData.range === 'area' || skillData.range === 'all') && livingTargets > 2) {
        return Math.random() < 0.9;
    }
    
    // Use effect skills more often
    if (skillData.effect) {
        return Math.random() < 0.8;
    }
    
    // Use high damage skills against high HP targets
    if (targetHpPercent > 0.7 && skillData.damage > 120) {
        return Math.random() < 0.75;
    }
    
    return Math.random() < RAID_CONFIG.AI_SKILL_USE_CHANCE;
}

// ===== STATUS EFFECTS AND PROCESSING =====

/**
 * FIXED: Process all status effects including DOT damage
 */
function processAllStatusEffects(raidState) {
    raidState.attacker.team.forEach(fruit => {
        if (fruit.currentHP > 0) {
            processStatusEffects(fruit, raidState.battleLog);
        }
    });
    
    raidState.defender.team.forEach(fruit => {
        if (fruit.currentHP > 0) {
            processStatusEffects(fruit, raidState.battleLog);
        }
    });
}

/**
 * FIXED: Process individual fruit status effects
 */
function processStatusEffects(fruit, battleLog) {
    if (!fruit.statusEffects || fruit.statusEffects.length === 0) return;

    fruit.statusEffects = fruit.statusEffects.filter(effect => {
        let shouldKeepEffect = true;
        
        switch (effect.type) {
            case 'dot':
                const dotDamage = effect.damage || Math.floor(fruit.maxHP * 0.1);
                const actualDotDamage = Math.min(fruit.currentHP, dotDamage);
                
                if (actualDotDamage > 0) {
                    fruit.currentHP = Math.max(0, fruit.currentHP - actualDotDamage);
                    battleLog.push(`${effect.icon || '☠️'} ${fruit.name} takes ${actualDotDamage} ${effect.name} damage`);
                    
                    if (fruit.currentHP === 0) {
                        battleLog.push(`💀 ${fruit.name} was defeated by ${effect.name}!`);
                    }
                }
                break;
                
            case 'heal':
                const healAmount = effect.value || Math.floor(fruit.maxHP * 0.1);
                const actualHeal = Math.min(healAmount, fruit.maxHP - fruit.currentHP);
                
                if (actualHeal > 0) {
                    fruit.currentHP = Math.min(fruit.maxHP, fruit.currentHP + actualHeal);
                    battleLog.push(`${effect.icon || '💚'} ${fruit.name} recovers ${actualHeal} HP from ${effect.name}`);
                }
                break;
        }
        
        if (effect.duration > 0) {
            effect.duration--;
            
            if (effect.duration === 0) {
                battleLog.push(`⏰ ${effect.name} expired on ${fruit.name}`);
                shouldKeepEffect = false;
            }
        }
        
        return shouldKeepEffect;
    });
}

/**
 * Calculate damage modifiers from status effects
 */
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

/**
 * Enhanced skill effect application
 */
function applyEnhancedSkillEffect(attacker, defender, skillData, skillDamage) {
    const result = {
        effectName: skillData.effect,
        messages: [],
        damageMultiplier: null,
        armorPierce: null,
        undodgeable: false
    };

    const attackerFruitName = attacker.name;
    const defenderFruitName = defender.name;

    const effectMapping = {
        'burn_damage': () => {
            const dotDamage = Math.floor(skillDamage * 0.2);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Burning',
                duration: 3,
                damage: dotDamage,
                icon: '🔥',
                source: attackerFruitName
            });
            result.messages.push(`🔥 ${defenderFruitName} is set ablaze! (${dotDamage} damage/turn for 3 turns)`);
        },
        
        'freeze_effect': () => {
            const dotDamage = Math.floor(skillDamage * 0.15);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Frostbite',
                duration: 2,
                damage: dotDamage,
                icon: '❄️',
                source: attackerFruitName
            });
            addStatusEffect(defender, {
                type: 'debuff',
                name: 'Slowed',
                duration: 2,
                effect: 'speed',
                modifier: -0.3,
                icon: '❄️'
            });
            result.messages.push(`❄️ ${defenderFruitName} is frozen! (${dotDamage} frostbite damage/turn + speed reduction)`);
        },
        
        'lightning_strike': () => {
            const dotDamage = Math.floor(skillDamage * 0.1);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Electrocution',
                duration: 2,
                damage: dotDamage,
                icon: '⚡',
                source: attackerFruitName
            });
            addStatusEffect(defender, {
                type: 'disable',
                name: 'Stunned',
                duration: 1,
                icon: '⚡'
            });
            result.messages.push(`⚡ ${defenderFruitName} is electrocuted and stunned! (${dotDamage} shock/turn + 1 turn stun)`);
            result.undodgeable = true;
        },
        
        'poison_dot': () => {
            const dotDamage = Math.floor(skillDamage * 0.25);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Deadly Poison',
                duration: 4,
                damage: dotDamage,
                icon: '☠️',
                source: attackerFruitName
            });
            result.messages.push(`☠️ ${defenderFruitName} is poisoned! (${dotDamage} poison damage/turn for 4 turns)`);
        },
        
        'shadow_bind': () => {
            const dotDamage = Math.floor(skillDamage * 0.1);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Shadow Drain',
                duration: 3,
                damage: dotDamage,
                icon: '🌑',
                source: attackerFruitName
            });
            addStatusEffect(defender, {
                type: 'debuff',
                name: 'Fear',
                duration: 2,
                effect: 'damage',
                modifier: -0.2,
                icon: '😰'
            });
            result.messages.push(`🌑 ${defenderFruitName} is bound by shadows and fears! (${dotDamage} drain/turn + damage reduction)`);
        },
        
        'default': () => {
            const dotDamage = Math.floor(skillDamage * 0.15);
            addStatusEffect(defender, {
                type: 'dot',
                name: 'Devil Fruit Effect',
                duration: 2,
                damage: dotDamage,
                icon: '🍈',
                source: attackerFruitName
            });
            result.messages.push(`🍈 ${defenderFruitName} suffers from devil fruit power! (${dotDamage} damage/turn for 2 turns)`);
        }
    };

    const effectFunction = effectMapping[skillData.effect] || effectMapping['default'];
    effectFunction();

    return result;
}

/**
 * Add status effect to fruit
 */
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
        if (effect.source) {
            existingEffect.source = effect.source;
        }
    } else {
        fruit.statusEffects.push({
            ...effect,
            stacks: 1
        });
    }
}

function isDisabled(fruit) {
    if (!fruit.statusEffects) return false;
    return fruit.statusEffects.some(effect => 
        effect.type === 'disable' && (effect.name === 'Stunned' || effect.name === 'Frozen' || effect.name === 'Immobilized')
    );
}

function areSkillsDisabled(fruit) {
    if (!fruit.statusEffects) return false;
    return fruit.statusEffects.some(effect => 
        effect.type === 'disable' && effect.name === 'Skill Locked'
    );
}

// ===== BATTLE FLOW MANAGEMENT =====

/**
 * FIXED: Enhanced battle interface with proper status effects processing
 */
async function showBattleInterface(interaction, raidState) {
    // Process status effects FIRST at start of each turn
    raidState.battleLog.push(`\n⏰ === TURN ${raidState.turn} START ===`);
    processAllStatusEffects(raidState);
    
    // Check if battle ended due to DOT damage
    const battleResult = checkBattleEnd(raidState);
    if (battleResult.ended) {
        await endBattle(interaction, raidState, battleResult);
        return;
    }
    
    const availableFruits = raidState.attacker.team
        .filter(fruit => fruit.currentHP > 0 && fruit.cooldown === 0 && !isDisabled(fruit));
    
    if (availableFruits.length === 0) {
        raidState.battleLog.push(`⏭️ ${raidState.attacker.username} has no available fruits - turn skipped!`);
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
 * FIXED: Setup battle collector with enhanced error handling
 */
function setupEnhancedBattleCollector(interaction, raidState) {
    const filter = (i) => i.user.id === raidState.attacker.userId;
    
    if (raidState.collector) {
        raidState.collector.stop();
    }
    
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: RAID_CONFIG.TURN_TIMEOUT
    });
    
    let selectedSkill = null;
    
    collector.on('collect', async (componentInteraction) => {
        try {
            const customId = componentInteraction.customId;
            
            if (customId.startsWith('skill_select_')) {
                selectedSkill = componentInteraction.values[0];
                await componentInteraction.deferUpdate();
                
                const updatedEmbed = createEnhancedBattleEmbed(raidState, selectedSkill);
                const updatedComponents = createEnhancedBattleComponents(raidState, selectedSkill);
                
                await interaction.editReply({
                    embeds: [updatedEmbed],
                    components: updatedComponents
                });
                
            } else if (customId.startsWith('target_select_')) {
                if (!selectedSkill) {
                    return componentInteraction.reply({
                        content: '❌ Please select a skill first!',
                        ephemeral: true
                    });
                }
                
                const selectedTarget = parseInt(componentInteraction.values[0]);
                await componentInteraction.deferUpdate();
                
                // Execute player attack
                await executeAttack(raidState, selectedSkill, selectedTarget);
                
                const battleResult = checkBattleEnd(raidState);
                if (battleResult.ended) {
                    await endBattle(interaction, raidState, battleResult);
                    collector.stop();
                    return;
                }
                
                // Process AI turn
                await processAITurn(raidState);
                
                const battleResult2 = checkBattleEnd(raidState);
                if (battleResult2.ended) {
                    await endBattle(interaction, raidState, battleResult2);
                    collector.stop();
                    return;
                }
                
                // Reduce cooldowns and advance turn
                reduceCooldowns(raidState.attacker);
                reduceCooldowns(raidState.defender);
                raidState.turn++;
                raidState.currentPlayer = 'attacker';
                
                selectedSkill = null;
                
                await showBattleInterface(interaction, raidState);
                collector.stop();
                
            } else if (customId.startsWith('change_skill_')) {
                selectedSkill = null;
                await componentInteraction.deferUpdate();
                
                const updatedEmbed = createEnhancedBattleEmbed(raidState);
                const updatedComponents = createEnhancedBattleComponents(raidState);
                
                await interaction.editReply({
                    embeds: [updatedEmbed],
                    components: updatedComponents
                });
            }
        } catch (error) {
            console.error('Enhanced battle action error:', error);
            try {
                if (!componentInteraction.replied && !componentInteraction.deferred) {
                    await componentInteraction.reply({
                        content: 'An error occurred during battle. Continuing...',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('Failed to send battle error response:', replyError);
            }
        }
    });
    
    collector.on('end', async (collected, reason) => {
        if (reason === 'time' && activeRaids.has(raidState.id)) {
            await endBattle(interaction, raidState, { 
                ended: true, 
                winner: raidState.defender.userId, 
                reason: 'timeout' 
            });
        }
    });
    
    raidState.collector = collector;
}

function calculateFruitHP(fruit) {
    const baseHP = {
        'common': 400, 'uncommon': 450, 'rare': 500, 'epic': 550,
        'legendary': 600, 'mythical': 650, 'divine': 700
    };
    
    const rarityHP = baseHP[fruit.rarity] || 400;
    const cpBonus = Math.floor(fruit.totalCP / 50);
    
    return rarityHP + cpBonus;
}

function reduceCooldowns(player) {
    player.team.forEach(fruit => {
        if (fruit.cooldown > 0) {
            fruit.cooldown--;
        }
    });
}

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

// ===== BATTLE INITIALIZATION =====

async function startBattle(interaction, attackerId, defenderId, attackerTeam, defenderTeam) {
    const raidId = generateRaidId();
    
    const [attackerUser, defenderUser] = await Promise.all([
        DatabaseManager.getUser(attackerId),
        DatabaseManager.getUser(defenderId)
    ]);
    
    updateBotStatus(interaction.client, 'raid_battle', {
        attacker: attackerUser.username,
        defender: defenderUser.username
    });
    
    const raidState = {
        id: raidId,
        attacker: {
            userId: attackerId,
            username: attackerUser.username,
            team: attackerTeam.map(fruit => {
                const maxHP = calculateFruitHP(fruit);
                return {
                    ...fruit,
                    currentHP: maxHP,
                    maxHP: maxHP,
                    cooldown: 0,
                    defense: calculateDefense(fruit),
                    statusEffects: []
                };
            }),
            activeFruitIndex: 0
        },
        defender: {
            userId: defenderId,
            username: defenderUser.username,
            team: defenderTeam.map(fruit => {
                const maxHP = calculateFruitHP(fruit);
                return {
                    ...fruit,
                    currentHP: maxHP,
                    maxHP: maxHP,
                    cooldown: 0,
                    defense: calculateDefense(fruit),
                    statusEffects: []
                };
            }),
            activeFruitIndex: 0
        },
        turn: 1,
        currentPlayer: 'attacker',
        battleLog: [],
        startTime: Date.now(),
        collector: null,
        fieldEffects: {}
    };
    
    activeRaids.set(raidId, raidState);
    
    await showBattleInterface(interaction, raidState);
}

function calculateDefense(fruit) {
    const baseDefense = {
        'common': 5, 'uncommon': 8, 'rare': 12, 'epic': 16,
        'legendary': 20, 'mythical': 25, 'divine': 30
    };
    
    return baseDefense[fruit.rarity] || 5;
}

/**
 * FIXED: End battle with detailed results
 */
async function endBattle(interaction, raidState, battleResult) {
    try {
        if (raidState.collector) {
            raidState.collector.stop();
        }
        
        const winnerUser = battleResult.winner === raidState.attacker.userId ? 
            raidState.attacker.username : raidState.defender.username;
        
        updateBotStatus(interaction.client, 'raid_end', {
            winner: winnerUser
        });
        
        const rewards = await calculateRewards(raidState, battleResult.winner);
        const resultEmbed = createEnhancedBattleResultEmbed(raidState, battleResult, rewards);
        
        await interaction.editReply({
            embeds: [resultEmbed],
            components: []
        });
        
        activeRaids.delete(raidState.id);
        
    } catch (error) {
        console.error('Error ending battle:', error);
        activeRaids.delete(raidState.id);
    }
}

/**
 * FIXED: Create detailed battle result embed
 */
function createEnhancedBattleResultEmbed(raidState, battleResult, rewards) {
    const { attacker, defender } = raidState;
    const { winner, reason } = battleResult;
    
    const winnerName = winner === attacker.userId ? attacker.username : defender.username;
    const loserName = winner === attacker.userId ? defender.username : attacker.username;
    
    const embed = new EmbedBuilder()
        .setTitle('🏆 Battle Complete!')
        .setDescription(`**${winnerName}** defeats **${loserName}** with devil fruit mastery!`)
        .setColor(winner === attacker.userId ? 0x00FF00 : 0xFF0000)
        .setTimestamp();
    
    // Show final team status
    const attackerStatus = attacker.team.map(fruit => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const statusIcon = fruit.currentHP > 0 ? '🟢' : '💀';
        const hpPercent = Math.round((fruit.currentHP / fruit.maxHP) * 100);
        
        return `${statusIcon} ${fruit.emoji} **${fruit.name}**\n${hpBar} ${hpPercent}% (${fruit.currentHP}/${fruit.maxHP})`;
    }).join('\n\n');
    
    const defenderStatus = defender.team.map(fruit => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const statusIcon = fruit.currentHP > 0 ? '🟢' : '💀';
        const hpPercent = Math.round((fruit.currentHP / fruit.maxHP) * 100);
        
        return `${statusIcon} ${fruit.emoji} **${fruit.name}**\n${hpBar} ${hpPercent}% (${fruit.currentHP}/${fruit.maxHP})`;
    }).join('\n\n');
    
    embed.addFields(
        {
            name: `⚔️ ${attacker.username}'s Final Team`,
            value: attackerStatus,
            inline: false
        },
        {
            name: `🛡️ ${defender.username}'s Final Team`,
            value: defenderStatus,
            inline: false
        },
        {
            name: '📊 Battle Summary',
            value: [
                `**Winner:** ${winnerName}`,
                `**Reason:** ${reason}`,
                `**Total Turns:** ${raidState.turn}`,
                `**Duration:** ${Math.floor((Date.now() - raidState.startTime) / 1000)}s`
            ].join('\n'),
            inline: false
        }
    );
    
    // Show battle log (last 10 actions)
    if (raidState.battleLog.length > 0) {
        const battleLog = raidState.battleLog.slice(-10).join('\n');
        embed.addFields({
            name: '📜 Final Battle Log',
            value: battleLog.length > 1024 ? battleLog.substring(0, 1021) + '...' : battleLog,
            inline: false
        });
    }
    
    // Show rewards
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
        
        if (rewardsText) {
            embed.addFields({
                name: '🎁 Battle Rewards',
                value: rewardsText,
                inline: false
            });
        }
    }
    
    return embed;
}

// ===== REMAINING HELPER FUNCTIONS =====

async function validateRaid(attackerId, target) {
    if (!target || target.bot) {
        return { valid: false, reason: 'Cannot raid bots or invalid users!' };
    }
    
    if (attackerId === target.id) {
        return { valid: false, reason: 'Cannot raid yourself!' };
    }
    
    const lastRaid = raidCooldowns.get(attackerId);
    if (lastRaid && Date.now() - lastRaid < RAID_CONFIG.COOLDOWN_TIME) {
        const timeLeft = Math.ceil((RAID_CONFIG.COOLDOWN_TIME - (Date.now() - lastRaid)) / 1000 / 60);
        return { valid: false, reason: `Raid cooldown active! Wait ${timeLeft} more minutes.` };
    }
    
    try {
        const targetUser = await DatabaseManager.getUser(target.id);
        if (!targetUser || targetUser.total_cp < RAID_CONFIG.MIN_CP_REQUIRED) {
            return { valid: false, reason: `Target must have at least ${RAID_CONFIG.MIN_CP_REQUIRED} CP to be raided!` };
        }
    } catch (error) {
        return { valid: false, reason: 'Could not verify target information!' };
    }
    
    return { valid: true };
}

async function getUserFruitsForSelection(userId) {
    const fruits = await DatabaseManager.query(`
        SELECT DISTINCT ON (fruit_id) 
            fruit_id, fruit_name, fruit_type, fruit_rarity, 
            fruit_description, total_cp, base_cp
        FROM user_devil_fruits 
        WHERE user_id = $1 
        ORDER BY fruit_id, total_cp DESC
    `, [userId]);
    
    const fruitGroups = {};
    fruits.rows.forEach(fruit => {
        const key = fruit.fruit_id;
        fruitGroups[key] = {
            id: fruit.fruit_id,
            name: fruit.fruit_name,
            type: fruit.fruit_type,
            rarity: fruit.fruit_rarity,
            description: fruit.fruit_description,
            totalCP: fruit.total_cp,
            baseCP: fruit.base_cp,
            emoji: RARITY_EMOJIS[fruit.fruit_rarity] || '⚪'
        };
    });
    
    return Object.values(fruitGroups).sort((a, b) => b.totalCP - a.totalCP);
}

async function getDefenderStrongestFruits(userId) {
    const fruits = await getUserFruitsForSelection(userId);
    return fruits.slice(0, RAID_CONFIG.TEAM_SIZE);
}

async function calculateRewards(raidState, winnerId) {
    const rewards = {
        berries: 0,
        fruitsStolen: [],
        experience: 0
    };
    
    if (winnerId === raidState.attacker.userId) {
        const defenderUser = await DatabaseManager.getUser(raidState.defender.userId);
        const targetBerries = defenderUser.berries || 0;
        const berriesStolen = Math.floor(targetBerries * RAID_CONFIG.BERRY_STEAL_PERCENTAGE);
        
        if (berriesStolen > 0) {
            rewards.berries = berriesStolen;
            
            try {
                await DatabaseManager.updateUserBerries(raidState.attacker.userId, berriesStolen, 'raid_victory');
                await DatabaseManager.updateUserBerries(raidState.defender.userId, -berriesStolen, 'raid_loss');
            } catch (error) {
                console.error('Error updating berries:', error);
            }
        }
        
        const stolenFruits = await tryStealFruits(raidState.defender.userId, raidState.attacker.userId);
        rewards.fruitsStolen = stolenFruits;
        
        rewards.experience = Math.floor(defenderUser.total_cp / 100);
        
        raidCooldowns.set(raidState.attacker.userId, Date.now());
    }
    
    return rewards;
}

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
        
        await DatabaseManager.recalculateUserCP(fromUserId);
        await DatabaseManager.recalculateUserCP(toUserId);
        
    } catch (error) {
        console.error('Error transferring fruit:', error);
    }
}

// ===== FRUIT SELECTION UI FUNCTIONS =====

async function startFruitSelection(interaction, attacker, target, attackerFruits) {
    const selectionId = generateSelectionId();
    
    fruitSelections.set(selectionId, {
        attackerId: attacker.id,
        targetId: target.id,
        attackerFruits,
        selectedFruits: [],
        currentPage: 0,
        createdAt: Date.now()
    });
    
    const embed = createFruitSelectionEmbed(attackerFruits, [], 0);
    const components = createFruitSelectionComponents(selectionId, attackerFruits, [], 0);
    
    await interaction.editReply({
        embeds: [embed],
        components
    });
    
    setupFruitSelectionCollector(interaction, selectionId, target);
}

function setupFruitSelectionCollector(interaction, selectionId, target) {
    const filter = (i) => i.user.id === interaction.user.id;
    
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: RAID_CONFIG.INTERACTION_TIMEOUT
    });
    
    collector.on('collect', async (componentInteraction) => {
        try {
            const selection = fruitSelections.get(selectionId);
            if (!selection) {
                return componentInteraction.reply({
                    content: 'Selection session expired!',
                    ephemeral: true
                });
            }
            
            const customId = componentInteraction.customId;
            
            if (customId.startsWith('fruit_prev_')) {
                await handlePageNavigation(componentInteraction, selectionId, 'prev');
            } else if (customId.startsWith('fruit_next_')) {
                await handlePageNavigation(componentInteraction, selectionId, 'next');
            } else if (customId.startsWith('fruit_select_')) {
                await handleFruitSelection(componentInteraction, selectionId);
            } else if (customId.startsWith('fruit_clear_')) {
                await handleClearSelection(componentInteraction, selectionId);
            } else if (customId.startsWith('fruit_confirm_')) {
                await handleConfirmSelection(componentInteraction, selectionId, target);
                collector.stop('confirmed');
            }
        } catch (error) {
            console.error('Fruit selection error:', error);
            try {
                await componentInteraction.reply({
                    content: 'An error occurred. Please try again.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error response:', replyError);
            }
        }
    });
    
    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            interaction.followUp({
                embeds: [createErrorEmbed('Fruit selection timed out!')],
                ephemeral: true
            }).catch(() => {});
        }
        
        fruitSelections.delete(selectionId);
    });
}

function createFruitSelectionEmbed(allFruits, selectedFruits, currentPage) {
    const selectedCount = selectedFruits.length;
    const remainingSlots = RAID_CONFIG.TEAM_SIZE - selectedCount;
    
    const embed = new EmbedBuilder()
        .setColor(RARITY_COLORS.legendary)
        .setTitle(`🍈 Select Your Raid Team (${selectedCount}/${RAID_CONFIG.TEAM_SIZE})`)
        .setDescription(`Choose ${remainingSlots} more Devil Fruit${remainingSlots !== 1 ? 's' : ''} for your raid team!`)
        .setFooter({ text: `Page ${currentPage + 1} • Use buttons to navigate and select` })
        .setTimestamp();
    
    // Show current selections
    if (selectedFruits.length > 0) {
        const selectedText = selectedFruits
            .map((fruit, index) => `${index + 1}. ${fruit.emoji} **${fruit.name}** (${fruit.totalCP} CP)`)
            .join('\n');
        
        embed.addFields({
            name: '✅ Selected Team',
            value: selectedText,
            inline: false
        });
    }
    
    // Show available fruits for current page
    const startIndex = currentPage * RAID_CONFIG.FRUITS_PER_PAGE;
    const endIndex = startIndex + RAID_CONFIG.FRUITS_PER_PAGE;
    const pageFruits = allFruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0) {
        const availableText = pageFruits
            .map((fruit, index) => {
                const globalIndex = startIndex + index;
                const isSelected = selectedFruits.some(s => s.id === fruit.id);
                const status = isSelected ? '✅' : `${globalIndex + 1}.`;
                return `${status} ${fruit.emoji} **${fruit.name}** (${fruit.rarity}, ${fruit.totalCP} CP)`;
            })
            .join('\n');
        
        embed.addFields({
            name: '🍈 Available Fruits',
            value: availableText.length > 1000 ? availableText.substring(0, 997) + '...' : availableText,
            inline: false
        });
    }
    
    return embed;
}

function createFruitSelectionComponents(selectionId, allFruits, selectedFruits, currentPage) {
    const components = [];
    
    // Navigation buttons
    const navRow = new ActionRowBuilder();
    const totalPages = Math.ceil(allFruits.length / RAID_CONFIG.FRUITS_PER_PAGE);
    
    if (currentPage > 0) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`fruit_prev_${selectionId}`)
                .setLabel('⬅️ Previous')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    if (currentPage < totalPages - 1) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`fruit_next_${selectionId}`)
                .setLabel('➡️ Next')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    if (navRow.components.length > 0) {
        components.push(navRow);
    }
    
    // Fruit selection dropdown
    const startIndex = currentPage * RAID_CONFIG.FRUITS_PER_PAGE;
    const endIndex = startIndex + RAID_CONFIG.FRUITS_PER_PAGE;
    const pageFruits = allFruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0 && selectedFruits.length < RAID_CONFIG.TEAM_SIZE) {
        const options = pageFruits.map((fruit, index) => {
            const globalIndex = startIndex + index;
            const isSelected = selectedFruits.some(s => s.id === fruit.id);
            
            return {
                label: `${fruit.name} (${fruit.totalCP} CP)`.substring(0, 100),
                description: `${fruit.rarity} • ${fruit.type}`.substring(0, 100),
                value: `fruit_${globalIndex}`,
                emoji: fruit.emoji,
                default: false
            };
        });
        
        const remainingSlots = RAID_CONFIG.TEAM_SIZE - selectedFruits.length;
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`fruit_select_${selectionId}`)
            .setPlaceholder('Select fruits for your raid team...')
            .setMinValues(0)
            .setMaxValues(Math.min(options.length, remainingSlots))
            .addOptions(options);
        
        components.push(new ActionRowBuilder().addComponents(selectMenu));
    }
    
    // Action buttons
    const actionRow = new ActionRowBuilder();
    
    if (selectedFruits.length > 0) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`fruit_clear_${selectionId}`)
                .setLabel('🗑️ Clear All')
                .setStyle(ButtonStyle.Danger)
        );
    }
    
    if (selectedFruits.length === RAID_CONFIG.TEAM_SIZE) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`fruit_confirm_${selectionId}`)
                .setLabel('⚔️ Start Raid!')
                .setStyle(ButtonStyle.Success)
        );
    }
    
    if (actionRow.components.length > 0) {
        components.push(actionRow);
    }
    
    return components;
}

// ===== SELECTION HANDLERS =====

async function handlePageNavigation(interaction, selectionId, direction) {
    const selection = fruitSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    const totalPages = Math.ceil(selection.attackerFruits.length / RAID_CONFIG.FRUITS_PER_PAGE);
    
    if (direction === 'prev' && selection.currentPage > 0) {
        selection.currentPage--;
    } else if (direction === 'next' && selection.currentPage < totalPages - 1) {
        selection.currentPage++;
    }
    
    const embed = createFruitSelectionEmbed(selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    const components = createFruitSelectionComponents(selectionId, selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    
    await interaction.update({ embeds: [embed], components });
}

async function handleFruitSelection(interaction, selectionId) {
    const selection = fruitSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    const selectedValues = interaction.values;
    
    // Process selections
    selectedValues.forEach(value => {
        const fruitIndex = parseInt(value.split('_')[1]);
        const fruit = selection.attackerFruits[fruitIndex];
        
        if (fruit && !selection.selectedFruits.some(s => s.id === fruit.id)) {
            if (selection.selectedFruits.length < RAID_CONFIG.TEAM_SIZE) {
                selection.selectedFruits.push(fruit);
            }
        }
    });
    
    const embed = createFruitSelectionEmbed(selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    const components = createFruitSelectionComponents(selectionId, selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    
    await interaction.update({ embeds: [embed], components });
}

async function handleClearSelection(interaction, selectionId) {
    const selection = fruitSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    selection.selectedFruits = [];
    
    const embed = createFruitSelectionEmbed(selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    const components = createFruitSelectionComponents(selectionId, selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    
    await interaction.update({ embeds: [embed], components });
}

async function handleConfirmSelection(interaction, selectionId, target) {
    const selection = fruitSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (selection.selectedFruits.length !== RAID_CONFIG.TEAM_SIZE) {
        return interaction.reply({ 
            content: `❌ You must select exactly ${RAID_CONFIG.TEAM_SIZE} fruits!`, 
            ephemeral: true 
        });
    }
    
    await interaction.update({
        embeds: [new EmbedBuilder()
            .setColor(RARITY_COLORS.epic)
            .setTitle('⚔️ Starting Enhanced Raid Battle!')
            .setDescription('Preparing for battle with improved damage system and UI!')
            .setTimestamp()],
        components: []
    });
    
    // Get defender team
    const defenderFruits = await getDefenderStrongestFruits(target.id);
    
    // Start the battle
    await startBattle(interaction, selection.attackerId, selection.targetId, selection.selectedFruits, defenderFruits);
    
    fruitSelections.delete(selectionId);
}

// ===== BOT STATUS UPDATES =====

function updateBotStatus(client, activityType, data = {}) {
    try {
        const { ActivityType } = require('discord.js');
        
        let statusText = 'the Grand Line for Devil Fruits! 🍈';
        let activityTypeDiscord = ActivityType.Watching;
        
        switch (activityType) {
            case 'raid_start':
                statusText = `⚔️ ${data.attacker} raiding ${data.target}!`;
                activityTypeDiscord = ActivityType.Watching;
                break;
            case 'raid_battle':
                statusText = `⚔️ Enhanced battle in progress!`;
                activityTypeDiscord = ActivityType.Watching;
                break;
            case 'raid_end':
                statusText = `🏆 ${data.winner} wins with enhanced combat!`;
                activityTypeDiscord = ActivityType.Watching;
                break;
        }
        
        client.user.setActivity(statusText, { type: activityTypeDiscord });
        
        setTimeout(() => {
            client.user.setActivity('the Grand Line for Devil Fruits! 🍈', { type: ActivityType.Watching });
        }, 30000);
        
    } catch (error) {
        console.error('Failed to update bot status:', error);
    }
}

// ===== UTILITY FUNCTIONS =====

function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Raid Error')
        .setDescription(message)
        .setTimestamp();
}

function generateRaidId() {
    return `raid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateSelectionId() {
    return `selection_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
