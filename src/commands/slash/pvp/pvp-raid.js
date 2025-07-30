// src/commands/slash/pvp/pvp-raid.js - COMPLETE FIXED VERSION
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const { getSkillData } = require('../../../data/DevilFruitSkills');
const SkillEffectService = require('../../../services/SkillEffectService');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');

// FIXED: Proper separator length
const SEPARATOR_LINE = "─".repeat(50);

// ENHANCED: Full skill effects integration with status effects
const RAID_CONFIG = {
    COOLDOWN_TIME: 300000,
    MIN_CP_REQUIRED: 500,
    BERRY_STEAL_PERCENTAGE: 0.15,
    FRUIT_DROP_CHANCES: {
        'divine': 0.01, 'mythical': 0.02, 'legendary': 0.05,
        'epic': 0.08, 'rare': 0.12, 'uncommon': 0.18, 'common': 0.25
    },
    MAX_FRUIT_DROPS: 3,
    
    // Enhanced battle system
    MAX_BATTLE_TURNS: 50,
    TURN_TIMEOUT: 300000,
    HP_BAR_LENGTH: 20,
    TEAM_SIZE: 5,
    FRUITS_PER_PAGE: 12,        // FIXED: Changed from 20 to 12
    INTERACTION_TIMEOUT: 900000,
    
    // Damage and effect calculations
    MIN_DAMAGE: 15,
    MAX_DAMAGE: 150,
    BASE_SKILL_DAMAGE: 60,
    MIN_RECOIL_PERCENT: 0.03,
    MAX_RECOIL_PERCENT: 0.08,
    
    // Status effect durations
    MAX_STATUS_DURATION: 5,
    STATUS_STACK_LIMIT: 3
};

// FIXED: Add missing skill effects with proper fruit object structure
const SKILL_EFFECTS = {
    elemental_mastery: {
        name: "Elemental Mastery",
        description: "Complete control over elemental forces",
        duration: 3,
        type: "buff",
        effect: (fruit) => {
            // Initialize stats if they don't exist
            if (!fruit.stats) {
                fruit.stats = {
                    attack: fruit.totalCP || 1000,
                    special_attack: fruit.totalCP || 1000,
                    speed: fruit.totalCP || 1000
                };
            }
            fruit.stats.attack = Math.floor(fruit.stats.attack * 1.3);
            fruit.stats.special_attack = Math.floor(fruit.stats.special_attack * 1.3);
            fruit.elementalBoost = true;
        },
        remove: (fruit) => {
            if (fruit.stats) {
                fruit.stats.attack = Math.floor(fruit.stats.attack / 1.3);
                fruit.stats.special_attack = Math.floor(fruit.stats.special_attack / 1.3);
            }
            fruit.elementalBoost = false;
        }
    },

    light_speed_barrage: {
        name: "Light Speed Barrage",
        description: "Unleashes a barrage of light-speed attacks",
        duration: 2,
        type: "buff",
        effect: (fruit) => {
            // Initialize stats if they don't exist
            if (!fruit.stats) {
                fruit.stats = {
                    attack: fruit.totalCP || 1000,
                    special_attack: fruit.totalCP || 1000,
                    speed: fruit.totalCP || 1000
                };
            }
            fruit.stats.speed = Math.floor(fruit.stats.speed * 2.0);
            fruit.stats.attack = Math.floor(fruit.stats.attack * 1.2);
            fruit.multiHitChance = 0.6;
        },
        remove: (fruit) => {
            if (fruit.stats) {
                fruit.stats.speed = Math.floor(fruit.stats.speed / 2.0);
                fruit.stats.attack = Math.floor(fruit.stats.attack / 1.2);
            }
            fruit.multiHitChance = 0;
        }
    },

    ice_age: {
        name: "Ice Age",
        description: "Brings forth a freezing apocalypse",
        duration: 4,
        type: "field",
        effect: (fruit, battle) => {
            if (battle) battle.fieldEffects = battle.fieldEffects || {};
            if (battle) battle.fieldEffects.iceAge = true;
            
            // Initialize stats if they don't exist
            if (!fruit.stats) {
                fruit.stats = {
                    attack: fruit.totalCP || 1000,
                    special_attack: fruit.totalCP || 1000,
                    speed: fruit.totalCP || 1000
                };
            }
            fruit.stats.special_attack = Math.floor(fruit.stats.special_attack * 1.4);
            
            // Slow all enemies if battle context exists
            if (battle && battle.enemyTeam) {
                battle.enemyTeam.forEach(enemy => {
                    if (!enemy.stats) {
                        enemy.stats = {
                            attack: enemy.totalCP || 1000,
                            special_attack: enemy.totalCP || 1000,
                            speed: enemy.totalCP || 1000
                        };
                    }
                    enemy.stats.speed = Math.floor(enemy.stats.speed * 0.5);
                });
            }
        },
        remove: (fruit, battle) => {
            if (battle) battle.fieldEffects = battle.fieldEffects || {};
            if (battle) battle.fieldEffects.iceAge = false;
            
            if (fruit.stats) {
                fruit.stats.special_attack = Math.floor(fruit.stats.special_attack / 1.4);
            }
            
            if (battle && battle.enemyTeam) {
                battle.enemyTeam.forEach(enemy => {
                    if (enemy.stats) {
                        enemy.stats.speed = Math.floor(enemy.stats.speed / 0.5);
                    }
                });
            }
        }
    },

    lightning_god: {
        name: "Lightning God",
        description: "Channels divine thunder and lightning",
        duration: 3,
        type: "buff",
        effect: (fruit) => {
            // Initialize stats if they don't exist
            if (!fruit.stats) {
                fruit.stats = {
                    attack: fruit.totalCP || 1000,
                    special_attack: fruit.totalCP || 1000,
                    speed: fruit.totalCP || 1000
                };
            }
            fruit.stats.special_attack = Math.floor(fruit.stats.special_attack * 1.5);
            fruit.stats.speed = Math.floor(fruit.stats.speed * 1.3);
            fruit.paralysisChance = 0.3;
            fruit.criticalHitBonus = 0.2;
        },
        remove: (fruit) => {
            if (fruit.stats) {
                fruit.stats.special_attack = Math.floor(fruit.stats.special_attack / 1.5);
                fruit.stats.speed = Math.floor(fruit.stats.speed / 1.3);
            }
            fruit.paralysisChance = 0;
            fruit.criticalHitBonus = 0;
        }
    },

    // Add the missing reality_bend effect
    reality_bend: {
        name: "Reality Bend",
        description: "Warps reality itself",
        duration: 1,
        type: "special",
        effect: (fruit) => {
            fruit.realityBend = true;
        },
        remove: (fruit) => {
            fruit.realityBend = false;
        }
    }
};

// Active raids and cooldowns
const raidCooldowns = new Map();
const activeRaids = new Map();
const fruitSelections = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid')
        .setDescription('⚔️ Raid another pirate with full skill effects and strategic combat!')
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

// ===== ENHANCED BATTLE SYSTEM WITH FULL SKILL EFFECTS =====

/**
 * ENHANCED: Execute attack with full skill effects processing
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
    
    // Check if attacker is disabled by status effects
    if (isDisabled(attackingFruit)) {
        raidState.battleLog.push(`😵 ${attackingFruit.name} is disabled and cannot act!`);
        return 0;
    }
    
    // Check if target is dead
    if (defendingFruit.currentHP <= 0) {
        raidState.battleLog.push(`💀 Cannot target ${defendingFruit.name} - already defeated!`);
        return 0;
    }
    
    // Get skill data with full effects
    const skillData = getSkillData(attackingFruit.id, attackingFruit.rarity) || {
        name: `${attackingFruit.name} Power`,
        damage: RAID_CONFIG.BASE_SKILL_DAMAGE,
        cooldown: 2,
        effect: null,
        description: 'A basic devil fruit ability',
        type: 'attack',
        range: 'single'
    };
    
    const skillName = skillType === 'skill' ? skillData.name : 'Basic Attack';
    const baseDamage = skillType === 'skill' ? skillData.damage : RAID_CONFIG.BASE_SKILL_DAMAGE * 0.8;
    
    raidState.battleLog.push(`⚔️ ${raidState.attacker.username} uses ${attackingFruit.name}'s ${skillName} on ${defendingFruit.name}!`);
    
    // Check for dodge/miss with status effect modifiers
    const attackerModifiers = calculateDamageModifiers(attackingFruit);
    const defenderModifiers = calculateDamageModifiers(defendingFruit);
    
    const dodgeChance = calculateDodgeChance(attackingFruit, defendingFruit, defenderModifiers);
    
    if (Math.random() < dodgeChance) {
        raidState.battleLog.push(`💨 ${defendingFruit.name} dodged the attack!`);
        if (skillType === 'skill') {
            attackingFruit.cooldown = skillData.cooldown || 2;
        }
        return 0;
    }
    
    // Calculate base damage with modifiers
    let damage = calculateEnhancedDamage(attackingFruit, defendingFruit, baseDamage, attackerModifiers);
    
    // Check for critical hit with skill modifiers
    const criticalChance = calculateCriticalChance(attackingFruit, attackerModifiers, skillData);
    const isCritical = Math.random() < criticalChance;
    
    if (isCritical) {
        damage = Math.floor(damage * 1.8);
        raidState.battleLog.push(`💥 Critical hit!`);
    }
    
    // Apply defense and immunities
    damage = applyDefenseAndImmunities(defendingFruit, damage, skillData);
    
    // ENHANCED: Apply skill effects BEFORE damage
    let effectResults = null;
    if (skillType === 'skill' && skillData.effect) {
        effectResults = applySkillEffect(attackingFruit, defendingFruit, skillData.effect, damage);
        
        if (effectResults && effectResults.messages && effectResults.messages.length > 0) {
            effectResults.messages.forEach(msg => raidState.battleLog.push(msg));
        }
        
        // Apply damage modifiers from effects
        if (effectResults && effectResults.damageMultiplier) {
            damage = Math.floor(damage * effectResults.damageMultiplier);
        }
        
        if (effectResults && effectResults.armorPierce) {
            const bypassAmount = Math.floor(damage * effectResults.armorPierce);
            damage += bypassAmount;
            raidState.battleLog.push(`🗡️ Armor piercing adds ${bypassAmount} damage!`);
        }
    }
    
    // Apply damage to defender
    const originalHP = defendingFruit.currentHP;
    defendingFruit.currentHP = Math.max(0, defendingFruit.currentHP - damage);
    const actualDamage = originalHP - defendingFruit.currentHP;
    
    // ENHANCED: Handle AOE effects
    if (skillData.range === 'area' || skillData.range === 'all') {
        const aoeDamage = Math.floor(actualDamage * 0.5);
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
    
    // Apply recoil damage with skill considerations
    let recoilDamage = calculateRecoilDamage(actualDamage);
    
    if (['defense', 'support'].includes(skillData.type)) {
        recoilDamage = Math.floor(recoilDamage * 0.5);
    }
    
    if (recoilDamage > 0) {
        attackingFruit.currentHP = Math.max(0, attackingFruit.currentHP - recoilDamage);
    }
    
    // Set cooldown for skills
    if (skillType === 'skill') {
        attackingFruit.cooldown = skillData.cooldown || 2;
    }
    
    // Enhanced battle log with detailed information
    raidState.battleLog.push(`💥 ${skillName} deals ${actualDamage} damage to ${defendingFruit.name} (${defendingFruit.currentHP}/${defendingFruit.maxHP} HP left)`);
    
    if (recoilDamage > 0) {
        raidState.battleLog.push(`🩸 ${attackingFruit.name} takes ${recoilDamage} recoil damage (${attackingFruit.currentHP}/${attackingFruit.maxHP} HP left)`);
    }
    
    // Handle newly defeated fruits
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

/**
 * FIXED: Apply skill effects with proper error handling
 */
function applySkillEffect(attacker, defender, effectName, skillDamage) {
    const effectData = SKILL_EFFECTS[effectName];
    if (!effectData) {
        console.warn(`[SKILL_EFFECTS] ⚠️ Unknown effect: ${effectName}`);
        return null;
    }

    const result = {
        effectName,
        effectData,
        messages: []
    };

    try {
        switch (effectData.type) {
            case 'buff':
                applyBuff(attacker, effectData, result);
                break;
            case 'field':
                applyFieldEffect(attacker, defender, effectData, result);
                break;
            default:
                console.log(`✨ Applied ${effectData.name}`);
        }
    } catch (error) {
        console.error(`Error applying effect ${effectName}:`, error);
    }

    return result;
}

function applyBuff(target, effectData, result) {
    if (!target.statusEffects) target.statusEffects = [];
    
    target.statusEffects.push({
        name: effectData.name,
        type: effectData.type,
        duration: effectData.duration,
        icon: '✨'
    });
    
    if (effectData.effect) {
        effectData.effect(target);
    }
    
    result.messages.push(`✨ ${target.name} gains ${effectData.name} for ${effectData.duration} turns`);
}

function applyFieldEffect(attacker, defender, effectData, result) {
    if (effectData.effect) {
        effectData.effect(attacker, { enemyTeam: [defender] });
    }
    
    result.messages.push(`${effectData.name} affects the battlefield!`);
}

/**
 * FIXED: Process AI turn with proper targeting system
 */
async function processAITurn(raidState) {
    const availableFruits = raidState.defender.team
        .map((fruit, index) => ({ fruit, index }))
        .filter(({ fruit }) => 
            fruit.currentHP > 0 && 
            fruit.cooldown === 0 && 
            !isDisabled(fruit)
        );
    
    if (availableFruits.length === 0) {
        raidState.battleLog.push(`⏭️ ${raidState.defender.username} has no available fruits - turn skipped!`);
        return;
    }
    
    // FIXED: Only target living PLAYER fruits (attacker team)
    const availableTargets = raidState.attacker.team
        .map((fruit, index) => ({ fruit, index }))
        .filter(({ fruit }) => fruit.currentHP > 0);
    
    if (availableTargets.length === 0) {
        raidState.battleLog.push(`⏭️ ${raidState.defender.username} has no valid targets!`);
        return;
    }
    
    const { fruit: attackingFruit, index: attackerIndex } = selectBestAIFruit(availableFruits);
    const { fruit: targetFruit, index: targetIndex } = selectBestAITarget(availableTargets, attackingFruit);
    
    // AI chooses skills more intelligently
    const skillData = getSkillData(attackingFruit.id, attackingFruit.rarity);
    const shouldUseSkill = decideAISkillUsage(attackingFruit, targetFruit, skillData);
    
    const skillChoice = shouldUseSkill ? `skill_${attackerIndex}` : `basic_${attackerIndex}`;
    
    await executeAttack(raidState, skillChoice, targetIndex);
    
    raidState.battleLog.push(`🤖 AI: ${attackingFruit.name} targets ${targetFruit.name} (${targetFruit.currentHP}/${targetFruit.maxHP} HP)`);
}

/**
 * ENHANCED: Show battle interface with status effects display
 */
async function showBattleInterface(interaction, raidState) {
    processAllStatusEffects(raidState);
    
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
 * ENHANCED: Create battle embed with FIXED separator
 */
function createEnhancedBattleEmbed(raidState, selectedSkill = null) {
    const { attacker, defender, turn } = raidState;
    
    const embed = new EmbedBuilder()
        .setTitle('⚔️ Enhanced Devil Fruit Battle!')
        .setDescription(`**Turn ${turn}** - ${attacker.username} (YOU) vs ${defender.username} (AI)\n\n${SEPARATOR_LINE}`)
        .setColor(RARITY_COLORS.legendary)
        .setTimestamp();
    
    // Show YOUR team status (attacker = player) - WIDER FORMAT
    const attackerTeamText = attacker.team.map((fruit, index) => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const cooldownText = fruit.cooldown > 0 ? ` (CD: ${fruit.cooldown})` : '';
        const statusIcon = fruit.currentHP > 0 ? '🟢' : '💀';
        
        let statusText = '';
        if (fruit.statusEffects && fruit.statusEffects.length > 0) {
            const activeEffects = fruit.statusEffects
                .map(effect => `${effect.icon || '⭐'}${effect.duration > 0 ? effect.duration : ''}`)
                .join(' ');
            statusText = ` [${activeEffects}]`;
        }
        
        const fruitLine = `${statusIcon} ${fruit.emoji} **${fruit.name}**${cooldownText}${statusText}`;
        const hpLine = `${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
        return `${fruitLine}\n${hpLine}`;
    }).join('\n\n');
    
    embed.addFields({
        name: `⚔️ YOUR Team (${attacker.username})`,
        value: attackerTeamText || 'No fruits remaining',
        inline: false
    });
    
    // Separator line for better visual separation
    embed.addFields({
        name: '\u200B',
        value: SEPARATOR_LINE,
        inline: false
    });
    
    // Show AI team status (defender = AI) - WIDER FORMAT
    const defenderTeamText = defender.team.map((fruit, index) => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const statusIcon = fruit.currentHP > 0 ? '🟢' : '💀';
        
        let statusText = '';
        if (fruit.statusEffects && fruit.statusEffects.length > 0) {
            const activeEffects = fruit.statusEffects
                .map(effect => `${effect.icon || '⭐'}${effect.duration > 0 ? effect.duration : ''}`)
                .join(' ');
            statusText = ` [${activeEffects}]`;
        }
        
        const fruitLine = `${statusIcon} ${fruit.emoji} **${fruit.name}**${statusText}`;
        const hpLine = `${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
        return `${fruitLine}\n${hpLine}`;
    }).join('\n\n');
    
    embed.addFields({
        name: `🤖 AI Team (${defender.username})`,
        value: defenderTeamText || 'No fruits remaining',
        inline: false
    });
    
    // Enhanced battle log with status effects (last 6 actions for readability)
    if (raidState.battleLog.length > 0) {
        const lastActions = raidState.battleLog.slice(-6).join('\n');
        embed.addFields({
            name: '📜 Battle Log (Recent Actions)',
            value: lastActions.length > 1000 ? lastActions.substring(0, 997) + '...' : lastActions,
            inline: false
        });
    }
    
    // Turn instructions
    const instructionText = selectedSkill ? 
        `✅ **Skill Selected!** Now choose your target from the AI team below.` :
        `🎯 **Your Turn!** Select a skill/attack from the dropdown, then choose your target.`;
    
    embed.addFields({
        name: '⏰ Turn Instructions',
        value: instructionText,
        inline: false
    });
    
    return embed;
}

/**
 * ENHANCED: Setup battle collector with separate skill and target selection
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
    let selectedTarget = null;
    
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
                
                selectedTarget = parseInt(componentInteraction.values[0]);
                await componentInteraction.deferUpdate();
                
                await executeAttack(raidState, selectedSkill, selectedTarget);
                
                const battleResult = checkBattleEnd(raidState);
                if (battleResult.ended) {
                    await endBattle(interaction, raidState, battleResult);
                    collector.stop();
                    return;
                }
                
                await processAITurn(raidState);
                
                const battleResult2 = checkBattleEnd(raidState);
                if (battleResult2.ended) {
                    await endBattle(interaction, raidState, battleResult2);
                    collector.stop();
                    return;
                }
                
                reduceCooldowns(raidState.attacker);
                reduceCooldowns(raidState.defender);
                raidState.turn++;
                raidState.currentPlayer = 'attacker';
                
                selectedSkill = null;
                selectedTarget = null;
                
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

/**
 * FIXED: Create battle components with proper team targeting
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
                    damage: RAID_CONFIG.BASE_SKILL_DAMAGE,
                    cooldown: 2
                };
                
                // Basic Attack
                const basicDescription = `${Math.floor(RAID_CONFIG.BASE_SKILL_DAMAGE * 0.8)} damage • Always ready`;
                availableSkills.push({
                    label: `${fruit.name} - Basic Attack`,
                    description: basicDescription,
                    value: `basic_${index}`,
                    emoji: fruit.emoji
                });
                
                // Special Skill (if not on cooldown)
                if (fruit.cooldown === 0 && !areSkillsDisabled(fruit)) {
                    let skillDescription = `${skillData.damage || RAID_CONFIG.BASE_SKILL_DAMAGE} damage`;
                    
                    if (skillData.effect) {
                        skillDescription += ` • ${skillData.effect.replace(/_/g, ' ')}`;
                    }
                    
                    skillDescription += ` • ${skillData.cooldown || 2} turn cooldown`;
                    
                    if (skillData.range && skillData.range !== 'single') {
                        skillDescription += ` • ${skillData.range.toUpperCase()} range`;
                    }
                    
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
            if (availableSkills.length > 25) {
                availableSkills.splice(25);
            }
            
            const skillMenu = new StringSelectMenuBuilder()
                .setCustomId(`skill_select_${raidState.id}`)
                .setPlaceholder('🎯 Step 1: Choose your fruit and attack type...')
                .addOptions(availableSkills);
            
            components.push(new ActionRowBuilder().addComponents(skillMenu));
        }
    }
    
    // STEP 2: Target Selection Dropdown (FIXED: only shows AI team)
    if (selectedSkill) {
        const availableTargets = [];
        
        // FIXED: Only show AI team (defender) as targets
        raidState.defender.team.forEach((fruit, index) => {
            if (fruit.currentHP > 0) {
                const hpPercent = Math.round((fruit.currentHP / fruit.maxHP) * 100);
                
                let statusText = '';
                if (fruit.statusEffects && fruit.statusEffects.length > 0) {
                    const effects = fruit.statusEffects
                        .map(e => `${e.icon || '⭐'}${e.name}`)
                        .join(', ');
                    statusText = ` • Effects: ${effects}`;
                }
                
                const description = `AI Target • ${fruit.currentHP}/${fruit.maxHP} HP (${hpPercent}%) • ${fruit.rarity}${statusText}`.substring(0, 100);
                
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
        
        // Add a "Back" button to change skill selection
        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`change_skill_${raidState.id}`)
                    .setLabel('↩️ Change Skill Selection')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        components.push(backButton);
    }
    
    return components;
}

/**
 * ENHANCED: End battle with detailed results and effects summary
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
 * ENHANCED: Create detailed battle result embed with FIXED separator
 */
function createEnhancedBattleResultEmbed(raidState, battleResult, rewards) {
    const { attacker, defender } = raidState;
    const { winner, reason } = battleResult;
    
    const winnerName = winner === attacker.userId ? attacker.username : defender.username;
    const loserName = winner === attacker.userId ? defender.username : attacker.username;
    
    const embed = new EmbedBuilder()
        .setTitle('🏆 Enhanced Battle Complete!')
        .setDescription(`**${winnerName}** defeats **${loserName}** with devil fruit mastery!\n\n${SEPARATOR_LINE}`)
        .setColor(winner === attacker.userId ? 0x00FF00 : 0xFF0000)
        .setTimestamp();
    
    // Show final team status with effects - WIDER FORMAT
    const attackerStatus = attacker.team.map(fruit => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const statusIcon = fruit.currentHP > 0 ? '🟢' : '💀';
        
        let effectsSummary = '';
        if (fruit.statusEffects && fruit.statusEffects.length > 0) {
            const effects = fruit.statusEffects.map(e => e.icon || '⭐').join(' ');
            effectsSummary = ` [${effects}]`;
        }
        
        return `${statusIcon} ${fruit.emoji} **${fruit.name}**${effectsSummary}\n${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
    }).join('\n\n');
    
    const defenderStatus = defender.team.map(fruit => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const statusIcon = fruit.currentHP > 0 ? '🟢' : '💀';
        
        let effectsSummary = '';
        if (fruit.statusEffects && fruit.statusEffects.length > 0) {
            const effects = fruit.statusEffects.map(e => e.icon || '⭐').join(' ');
            effectsSummary = ` [${effects}]`;
        }
        
        return `${statusIcon} ${fruit.emoji} **${fruit.name}**${effectsSummary}\n${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
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
                `**Duration:** ${Math.floor((Date.now() - raidState.startTime) / 1000)}s`,
                `**Skill Effects Used:** ${countSkillEffectsUsed(raidState.battleLog)}`
            ].join('\n'),
            inline: false
        }
    );
    
    // Enhanced battle log with skill effects (last 12 actions) - WIDER
    if (raidState.battleLog.length > 0) {
        const battleLog = raidState.battleLog.slice(-12).join('\n');
        embed.addFields({
            name: '📜 Enhanced Battle Log',
            value: battleLog.length > 1000 ? battleLog.substring(0, 997) + '...' : battleLog,
            inline: false
        });
    }
    
    // Show rewards - WIDER
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
    
    return embed;
}

// ===== BATTLE FLOW MANAGEMENT =====

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

// ===== UTILITY FUNCTIONS =====

function calculateFruitHP(fruit) {
    const baseHP = {
        'common': 400, 'uncommon': 450, 'rare': 500, 'epic': 550,
        'legendary': 600, 'mythical': 650, 'divine': 700
    };
    
    const rarityHP = baseHP[fruit.rarity] || 400;
    const cpBonus = Math.floor(fruit.totalCP / 50);
    
    return rarityHP + cpBonus;
}

function calculateDefense(fruit) {
    const baseDefense = {
        'common': 5, 'uncommon': 8, 'rare': 12, 'epic': 16,
        'legendary': 20, 'mythical': 25, 'divine': 30
    };
    
    return baseDefense[fruit.rarity] || 5;
}

function calculateRecoilDamage(totalDamage) {
    const recoilPercent = RAID_CONFIG.MIN_RECOIL_PERCENT + 
        (Math.random() * (RAID_CONFIG.MAX_RECOIL_PERCENT - RAID_CONFIG.MIN_RECOIL_PERCENT));
    return Math.floor(totalDamage * recoilPercent);
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

function createPerfectHPBar(currentHP, maxHP) {
    const barLength = 10;
    const percentage = Math.max(0, Math.min(1, currentHP / maxHP));
    const filledBars = Math.floor(percentage * barLength);
    const emptyBars = barLength - filledBars;
    
    let hpEmoji = '🟢';
    if (percentage <= 0) {
        return '⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫';
    } else if (percentage < 0.25) {
        hpEmoji = '🔴';
    } else if (percentage < 0.5) {
        hpEmoji = '🟡';
    }
    
    let hpBar = '';
    for (let i = 0; i < filledBars; i++) {
        hpBar += hpEmoji;
    }
    for (let i = 0; i < emptyBars; i++) {
        hpBar += '⚫';
    }
    
    return hpBar;
}

// ===== STATUS EFFECT HELPERS =====

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

function calculateDamageModifiers(fruit) {
    let damageModifier = 1;
    let criticalModifier = 0;
    let speedModifier = 1;
    
    if (fruit.statusEffects) {
        fruit.statusEffects.forEach(effect => {
            if (effect.type === 'buff' && effect.name === 'Elemental Mastery') {
                damageModifier *= 1.3;
            }
            if (effect.type === 'buff' && effect.name === 'Lightning God') {
                criticalModifier += 0.2;
                speedModifier *= 1.3;
            }
        });
    }
    
    return { damageModifier, criticalModifier, speedModifier };
}

function calculateDodgeChance(attacker, defender, defenderModifiers) {
    const speedDifference = (defender.totalCP - attacker.totalCP) / 1000;
    let baseDodgeChance = Math.max(0.05, Math.min(0.25, 0.10 + speedDifference));
    
    baseDodgeChance *= defenderModifiers.speedModifier;
    
    return Math.max(0, Math.min(0.95, baseDodgeChance));
}

function calculateCriticalChance(attacker, attackerModifiers, skillData) {
    const rarityBonus = {
        'common': 0.05, 'uncommon': 0.08, 'rare': 0.12, 'epic': 0.16,
        'legendary': 0.20, 'mythical': 0.25, 'divine': 0.30
    };
    
    let critChance = rarityBonus[attacker.rarity] || 0.05;
    critChance += attackerModifiers.criticalModifier;
    
    if (skillData && skillData.type === 'attack') {
        critChance += 0.1;
    }
    
    return Math.max(0, Math.min(0.95, critChance));
}

function calculateEnhancedDamage(attackingFruit, defendingFruit, baseDamage, attackerModifiers) {
    const cpRatio = Math.min(attackingFruit.totalCP / defendingFruit.totalCP, 1.8);
    
    let damage = Math.floor(baseDamage * cpRatio);
    damage = Math.floor(damage * attackerModifiers.damageModifier);
    
    const randomMultiplier = 0.85 + (Math.random() * 0.3);
    damage = Math.floor(damage * randomMultiplier);
    
    const rarityBonus = {
        'common': 1.0, 'uncommon': 1.05, 'rare': 1.1, 'epic': 1.15,
        'legendary': 1.2, 'mythical': 1.25, 'divine': 1.3
    };
    
    damage = Math.floor(damage * (rarityBonus[attackingFruit.rarity] || 1.0));
    
    return Math.max(RAID_CONFIG.MIN_DAMAGE, Math.min(damage, RAID_CONFIG.MAX_DAMAGE));
}

function applyDefenseAndImmunities(defendingFruit, damage, skillData) {
    const baseDefense = {
        'common': 5, 'uncommon': 8, 'rare': 12, 'epic': 16,
        'legendary': 20, 'mythical': 25, 'divine': 30
    };
    
    let defense = baseDefense[defendingFruit.rarity] || 5;
    
    if (defendingFruit.statusEffects) {
        defendingFruit.statusEffects.forEach(effect => {
            if (effect.type === 'defense' && effect.name === 'Shell Defense') {
                damage = Math.floor(damage * 0.5);
            }
        });
    }
    
    damage = Math.max(5, damage - defense);
    
    return damage;
}

function selectBestAIFruit(availableFruits) {
    let bestScore = -1;
    let bestFruit = availableFruits[0];
    
    availableFruits.forEach(({ fruit, index }) => {
        let score = 0;
        
        score += (fruit.currentHP / fruit.maxHP) * 30;
        score += (fruit.totalCP / 10000) * 40;
        
        const skillData = getSkillData(fruit.id, fruit.rarity);
        if (skillData && fruit.cooldown === 0) {
            score += 20;
            
            if (skillData.range === 'area' || skillData.range === 'all') {
                score += 10;
            }
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestFruit = { fruit, index };
        }
    });
    
    return bestFruit;
}

function selectBestAITarget(availableTargets, attackingFruit) {
    let bestScore = -1;
    let bestTarget = availableTargets[0];
    
    availableTargets.forEach(({ fruit, index }) => {
        let score = 0;
        
        const hpPercent = fruit.currentHP / fruit.maxHP;
        if (hpPercent < 0.3) {
            score += 50;
        } else if (hpPercent < 0.6) {
            score += 25;
        }
        
        score += (fruit.totalCP / 10000) * 20;
        
        const hasDefensiveEffects = fruit.statusEffects && 
            fruit.statusEffects.some(e => e.type === 'defense');
        
        if (!hasDefensiveEffects) {
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

function decideAISkillUsage(attackingFruit, targetFruit, skillData) {
    if (!skillData || attackingFruit.cooldown > 0) {
        return false;
    }
    
    const targetHpPercent = targetFruit.currentHP / targetFruit.maxHP;
    if (targetHpPercent < 0.3 && skillData.damage > targetFruit.currentHP) {
        return true;
    }
    
    if ((skillData.range === 'area' || skillData.range === 'all')) {
        return true;
    }
    
    if (targetHpPercent > 0.7 && skillData.effect) {
        return true;
    }
    
    const skillPowerRatio = skillData.damage / (RAID_CONFIG.BASE_SKILL_DAMAGE * 0.8);
    const useSkillChance = Math.min(0.8, skillPowerRatio * 0.3 + 0.4);
    
    return Math.random() < useSkillChance;
}

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

function processStatusEffects(fruit, battleLog) {
    if (!fruit.statusEffects) return;

    fruit.statusEffects = fruit.statusEffects.filter(effect => {
        if (effect.duration > 0) {
            effect.duration--;
            
            if (effect.duration === 0 && effect.type === 'buff') {
                // Remove buff effects
                if (SKILL_EFFECTS[effect.name] && SKILL_EFFECTS[effect.name].remove) {
                    SKILL_EFFECTS[effect.name].remove(fruit);
                }
                battleLog.push(`⏰ ${effect.name} expired on ${fruit.name}`);
                return false;
            }
        }
        
        return effect.duration > 0;
    });
}

function countSkillEffectsUsed(battleLog) {
    return battleLog.filter(log => 
        log.includes('🔥') || log.includes('☠️') || log.includes('❄️') || 
        log.includes('⚡') || log.includes('🌊') || log.includes('💥') ||
        log.includes('🛡️') || log.includes('💚') || log.includes('⭐')
    ).length;
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
                statusText = `⚔️ Epic skill battle in progress!`;
                activityTypeDiscord = ActivityType.Watching;
                break;
            case 'raid_end':
                statusText = `🏆 ${data.winner} wins with skills!`;
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

// ===== FRUIT SELECTION FUNCTIONS =====

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
    const fruits = await DatabaseManager.getUserDevilFruits(userId);
    
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
                emoji: RARITY_EMOJIS[fruit.fruit_rarity] || '⚪'
            };
        }
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

function createFruitSelectionEmbed(allFruits, selectedFruits, currentPage) {
    const selectedCount = selectedFruits.length;
    const remainingSlots = RAID_CONFIG.TEAM_SIZE - selectedCount;
    
    const embed = new EmbedBuilder()
        .setColor(RARITY_COLORS.legendary)
        .setTitle(`🍈 Select Your Raid Team (${selectedCount}/${RAID_CONFIG.TEAM_SIZE})`)
        .setDescription(`Choose ${remainingSlots} more Devil Fruit${remainingSlots !== 1 ? 's' : ''} for your raid team!\n\n${SEPARATOR_LINE}`)
        .setFooter({ text: `Page ${currentPage + 1} • Use buttons to navigate and select` })
        .setTimestamp();
    
    // Show current selections - WIDER FORMAT
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
    
    // Show available fruits for current page - WIDER FORMAT
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
                default: isSelected
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
            .setTitle('⚔️ Starting Raid Battle!')
            .setDescription('Preparing for battle... Selecting AI team and initializing combat system!')
            .setTimestamp()],
        components: []
    });
    
    // Get defender team
    const defenderFruits = await getDefenderStrongestFruits(target.id);
    
    // Start the battle
    await startBattle(interaction, selection.attackerId, selection.targetId, selection.selectedFruits, defenderFruits);
    
    fruitSelections.delete(selectionId);
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
