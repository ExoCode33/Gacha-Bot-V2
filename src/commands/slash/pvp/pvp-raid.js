// src/commands/slash/pvp/pvp-raid.js - Authentic One Piece Raid System
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
    MAX_BATTLE_TURNS: 50,
    TURN_TIMEOUT: 120000, // 2 minutes per turn
    HP_BAR_LENGTH: 20
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
            const raidResult = await executeRaid(interaction, attackerData, targetData);
            
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
            activeFruitIndex: 0, // Currently active fruit
            statusEffects: [],
            skillCooldowns: {}
        },
        target: {
            ...targetData,
            currentHP: calculateMaxHP(targetData.totalCP, targetData.level),
            maxHP: calculateMaxHP(targetData.totalCP, targetData.level),
            activeFruitIndex: 0, // AI controlled
            statusEffects: [],
            skillCooldowns: {}
        },
        turn: 1,
        currentPlayer: 'attacker',
        battleLog: [],
        startTime: Date.now()
    };
    
    activeRaids.set(raidId, raidState);
    
    // Start the interactive battle
    await startInteractiveBattle(interaction, raidState);
    
    return raidState;
}

/**
 * Start interactive turn-based battle
 */
async function startInteractiveBattle(interaction, raidState) {
    // Send initial battle interface
    const embed = createBattleEmbed(raidState);
    const components = createBattleComponents(raidState);
    
    const message = await interaction.editReply({
        embeds: [embed],
        components
    });
    
    // Setup battle collector
    setupBattleCollector(interaction, raidState, message);
}

/**
 * Create battle embed like in screenshot
 */
function createBattleEmbed(raidState, lastAction = null) {
    const { attacker, target, turn } = raidState;
    
    // Get active fruits
    const attackerFruit = attacker.fruits[attacker.activeFruitIndex];
    const targetFruit = target.fruits[target.activeFruitIndex];
    
    // Calculate HP percentages
    const attackerHPPercent = Math.round((attacker.currentHP / attacker.maxHP) * 100);
    const targetHPPercent = Math.round((target.currentHP / target.maxHP) * 100);
    
    // Create HP bars
    const attackerHPBar = createHPBar(attacker.currentHP, attacker.maxHP);
    const targetHPBar = createHPBar(target.currentHP, target.maxHP);
    
    const embed = new EmbedBuilder()
        .setTitle('⚔️ Raid Battle!')
        .setDescription(`${attacker.username} successfully raided ${target.username} with enhanced visual combat!`)
        .setColor(RARITY_COLORS.legendary)
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
                name: '⚔️ Battle Summary',
                value: [
                    `**Total Turns:** ${turn}/50`,
                    `**Battle Reason:** Enhanced Visual Turn-based System`,
                    `**Combat Type:** Enhanced Visual Turn-based System`,
                    `**Visual Features:** Animated HP bars, damage flashes, separated logs`
                ].join('\n'),
                inline: false
            }
        );
    
    // Add active fruits info
    embed.addFields({
        name: '🍈 Active Devil Fruits',
        value: [
            `**${attacker.username}:** ${attackerFruit?.emoji || '⚪'} ${attackerFruit?.name || 'None'}`,
            `**${target.username}:** ${targetFruit?.emoji || '⚪'} ${targetFruit?.name || 'None'}`
        ].join('\n'),
        inline: true
    });
    
    // Add last action if any
    if (lastAction) {
        embed.addFields({
            name: '💥 Last Action',
            value: lastAction,
            inline: true
        });
    }
    
    // Add turn indicator
    if (raidState.currentPlayer === 'attacker') {
        embed.addFields({
            name: '⏰ Current Turn',
            value: `**${attacker.username}'s Turn** - Choose your action!`,
            inline: false
        });
    }
    
    embed.setFooter({ 
        text: `Enhanced Visual Raid completed in ${turn} turns | Visual Combat System v3.0 • Today at ${new Date().toLocaleTimeString()}` 
    })
    .setTimestamp();
    
    return embed;
}

/**
 * Create interactive battle components
 */
function createBattleComponents(raidState) {
    const components = [];
    
    if (raidState.currentPlayer === 'attacker') {
        // Action buttons
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`battle_attack_${raidState.id}`)
                    .setLabel('⚔️ Attack')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`battle_skill_${raidState.id}`)
                    .setLabel('✨ Use Skill')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`battle_switch_${raidState.id}`)
                    .setLabel('🔄 Switch Fruit')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`battle_info_${raidState.id}`)
                    .setLabel('📊 Skill Info')
                    .setStyle(ButtonStyle.Success)
            );
        
        components.push(actionRow);
        
        // Fruit switching menu
        if (raidState.attacker.fruits.length > 1) {
            const fruitOptions = raidState.attacker.fruits.map((fruit, index) => ({
                label: `${fruit.name}`.substring(0, 100),
                description: `${fruit.rarity} • ${fruit.totalCP} CP • ${fruit.currentHP || fruit.maxHP}/${fruit.maxHP || fruit.totalCP} HP`.substring(0, 100),
                value: `switch_${index}`,
                emoji: fruit.emoji,
                default: index === raidState.attacker.activeFruitIndex
            }));
            
            const fruitMenu = new StringSelectMenuBuilder()
                .setCustomId(`fruit_switch_${raidState.id}`)
                .setPlaceholder('Select a Devil Fruit to switch to...')
                .addOptions(fruitOptions);
            
            components.push(new ActionRowBuilder().addComponents(fruitMenu));
        }
    }
    
    return components;
}

/**
 * Setup battle interaction collector
 */
function setupBattleCollector(interaction, raidState, message) {
    const collector = message.createMessageComponentCollector({
        time: RAID_CONFIG.TURN_TIMEOUT
    });
    
    collector.on('collect', async (buttonInteraction) => {
        if (buttonInteraction.user.id !== raidState.attacker.userId) {
            return buttonInteraction.reply({
                content: '❌ This is not your battle!',
                ephemeral: true
            });
        }
        
        const customId = buttonInteraction.customId;
        
        try {
            if (customId.startsWith('battle_attack_')) {
                await handleAttack(buttonInteraction, raidState);
            } else if (customId.startsWith('battle_skill_')) {
                await handleSkillUse(buttonInteraction, raidState);
            } else if (customId.startsWith('battle_switch_')) {
                await handleFruitSwitch(buttonInteraction, raidState);
            } else if (customId.startsWith('battle_info_')) {
                await handleSkillInfo(buttonInteraction, raidState);
            } else if (customId.startsWith('fruit_switch_')) {
                await handleFruitMenuSwitch(buttonInteraction, raidState);
            }
            
            // Check if battle ended
            const battleResult = checkBattleEnd(raidState);
            if (battleResult.ended) {
                await endBattle(buttonInteraction, raidState, battleResult);
                collector.stop();
                return;
            }
            
            // Continue battle
            await processTurn(buttonInteraction, raidState);
            
        } catch (error) {
            console.error('Battle interaction error:', error);
            await buttonInteraction.reply({
                content: '❌ An error occurred during battle!',
                ephemeral: true
            });
        }
    });
    
    collector.on('end', async () => {
        if (activeRaids.has(raidState.id)) {
            // Battle timed out
            const timeoutResult = {
                ended: true,
                winner: raidState.target.userId,
                reason: 'timeout'
            };
            await endBattle(interaction, raidState, timeoutResult);
        }
    });
}

/**
 * Handle attack action
 */
async function handleAttack(interaction, raidState) {
    const attacker = raidState.attacker;
    const target = raidState.target;
    const activeFruit = attacker.fruits[attacker.activeFruitIndex];
    
    // Calculate damage
    let damage = Math.floor(50 + (activeFruit.totalCP / 50));
    const critChance = 0.15;
    const isCritical = Math.random() < critChance;
    
    if (isCritical) {
        damage = Math.floor(damage * 1.8);
    }
    
    // Apply damage
    const originalHP = target.currentHP;
    target.currentHP = Math.max(0, target.currentHP - damage);
    const actualDamage = originalHP - target.currentHP;
    
    // Log action
    const actionText = `${attacker.username} attacks with ${activeFruit.name} for ${actualDamage} damage${isCritical ? ' (CRITICAL!)' : ''}!`;
    raidState.battleLog.push(actionText);
    
    await interaction.reply({
        content: `⚔️ ${actionText}`,
        ephemeral: true
    });
}

/**
 * Handle skill use
 */
async function handleSkillUse(interaction, raidState) {
    const attacker = raidState.attacker;
    const target = raidState.target;
    const activeFruit = attacker.fruits[attacker.activeFruitIndex];
    
    // Get skill data
    const skillData = getSkillData(activeFruit.id, activeFruit.rarity) || {
        name: `${activeFruit.name} Power`,
        damage: Math.floor(activeFruit.totalCP / 20),
        cooldown: 2,
        effect: null,
        description: `Harness the power of the ${activeFruit.name}`
    };
    
    // Check cooldown
    const cooldownKey = `${activeFruit.id}_${skillData.name}`;
    if (attacker.skillCooldowns[cooldownKey] > 0) {
        return interaction.reply({
            content: `❌ ${skillData.name} is on cooldown for ${attacker.skillCooldowns[cooldownKey]} more turns!`,
            ephemeral: true
        });
    }
    
    // Calculate skill damage
    let damage = skillData.damage || Math.floor(activeFruit.totalCP / 15);
    const critChance = 0.25; // Higher crit chance for skills
    const isCritical = Math.random() < critChance;
    
    if (isCritical) {
        damage = Math.floor(damage * 2.2);
    }
    
    // Apply damage
    const originalHP = target.currentHP;
    target.currentHP = Math.max(0, target.currentHP - damage);
    const actualDamage = originalHP - target.currentHP;
    
    // Set cooldown
    attacker.skillCooldowns[cooldownKey] = skillData.cooldown || 2;
    
    // Apply effects
    let effectText = '';
    if (skillData.effect) {
        effectText = applySkillEffect(skillData.effect, target);
    }
    
    // Log action
    const actionText = `${attacker.username} uses ${skillData.name} for ${actualDamage} damage${isCritical ? ' (CRITICAL!)' : ''}!${effectText}`;
    raidState.battleLog.push(actionText);
    
    await interaction.reply({
        content: `✨ ${actionText}`,
        ephemeral: true
    });
}

/**
 * Handle fruit switching
 */
async function handleFruitSwitch(interaction, raidState) {
    await interaction.reply({
        content: '🔄 Use the dropdown menu below to select which Devil Fruit to switch to!',
        ephemeral: true
    });
}

/**
 * Handle fruit menu switching
 */
async function handleFruitMenuSwitch(interaction, raidState) {
    const fruitIndex = parseInt(interaction.values[0].split('_')[1]);
    const newFruit = raidState.attacker.fruits[fruitIndex];
    
    if (fruitIndex === raidState.attacker.activeFruitIndex) {
        return interaction.reply({
            content: `❌ ${newFruit.name} is already your active fruit!`,
            ephemeral: true
        });
    }
    
    raidState.attacker.activeFruitIndex = fruitIndex;
    
    const actionText = `${raidState.attacker.username} switches to ${newFruit.emoji} ${newFruit.name}!`;
    raidState.battleLog.push(actionText);
    
    await interaction.reply({
        content: `🔄 ${actionText}`,
        ephemeral: true
    });
}

/**
 * Handle skill info display
 */
async function handleSkillInfo(interaction, raidState) {
    const activeFruit = raidState.attacker.fruits[raidState.attacker.activeFruitIndex];
    
    // Get skill data
    const skillData = getSkillData(activeFruit.id, activeFruit.rarity) || {
        name: `${activeFruit.name} Power`,
        damage: Math.floor(activeFruit.totalCP / 20),
        cooldown: 2,
        effect: null,
        description: `Harness the power of the ${activeFruit.name}`,
        type: 'attack',
        range: 'single'
    };
    
    // Create detailed skill info embed
    const skillEmbed = new EmbedBuilder()
        .setTitle(`📊 ${skillData.name} - Skill Information`)
        .setColor(RARITY_COLORS[activeFruit.rarity] || RARITY_COLORS.common)
        .setDescription(`**Active Fruit:** ${activeFruit.emoji} ${activeFruit.name}`)
        .addFields(
            {
                name: '⚔️ Combat Stats',
                value: [
                    `**Damage:** ${skillData.damage || 'Variable'}`,
                    `**Cooldown:** ${skillData.cooldown || 1} turns`,
                    `**Type:** ${skillData.type || 'Attack'}`,
                    `**Range:** ${skillData.range || 'Single'}`,
                    `**Cost:** ${skillData.cost || 0} Energy`
                ].join('\n'),
                inline: true
            },
            {
                name: '🔮 Effects & Buffs',
                value: createEffectsDescription(skillData),
                inline: true
            },
            {
                name: '📝 Description',
                value: skillData.description || 'A mysterious Devil Fruit ability',
                inline: false
            }
        );
    
    // Add cooldown status
    const cooldownKey = `${activeFruit.id}_${skillData.name}`;
    const currentCooldown = raidState.attacker.skillCooldowns[cooldownKey] || 0;
    
    if (currentCooldown > 0) {
        skillEmbed.addFields({
            name: '⏰ Cooldown Status',
            value: `❌ **On Cooldown:** ${currentCooldown} turns remaining`,
            inline: false
        });
    } else {
        skillEmbed.addFields({
            name: '⏰ Cooldown Status',
            value: '✅ **Ready to use!**',
            inline: false
        });
    }
    
    await interaction.reply({
        embeds: [skillEmbed],
        ephemeral: true
    });
}

/**
 * Create effects description for skill info
 */
function createEffectsDescription(skillData) {
    let effects = [];
    
    // Main effect
    if (skillData.effect) {
        const effectNames = {
            'burn_damage': '🔥 Burn (DoT)',
            'freeze_effect': '❄️ Freeze (Stun)',
            'poison_dot': '☠️ Poison (DoT)',
            'heal_self': '💚 Self Heal',
            'buff_attack': '💪 Attack Buff',
            'debuff_defense': '🛡️ Defense Debuff'
        };
        effects.push(effectNames[skillData.effect] || skillData.effect);
    }
    
    // Special abilities
    if (skillData.special) {
        Object.entries(skillData.special).forEach(([key, value]) => {
            if (value === true) {
                const specialNames = {
                    'ignoreArmor': '🗡️ Armor Pierce',
                    'multiHit': '⚡ Multi-Hit',
                    'lifesteal': '🩸 Life Steal',
                    'critBoost': '💥 Crit Boost',
                    'areaEffect': '💥 Area Effect',
                    'stunChance': '⚡ Stun Chance',
                    'shieldBreak': '🛡️ Shield Break'
                };
                effects.push(specialNames[key] || key);
            } else if (value && value !== false) {
                effects.push(`${key}: ${value}`);
            }
        });
    }
    
    return effects.length > 0 ? effects.join('\n') : 'No special effects';
}

/**
 * Apply skill effect to target
 */
function applySkillEffect(effect, target) {
    switch (effect) {
        case 'burn_damage':
            target.statusEffects.push({ type: 'burn', duration: 3, damage: 5 });
            return ' 🔥 Target is burning!';
        case 'freeze_effect':
            target.statusEffects.push({ type: 'freeze', duration: 1 });
            return ' ❄️ Target is frozen!';
        case 'poison_dot':
            target.statusEffects.push({ type: 'poison', duration: 2, damage: 8 });
            return ' ☠️ Target is poisoned!';
        default:
            return '';
    }
}

/**
 * Process turn and handle AI
 */
async function processTurn(interaction, raidState) {
    // Switch to target's turn (AI)
    raidState.currentPlayer = 'target';
    
    // AI takes action
    await processAITurn(raidState);
    
    // Reduce cooldowns
    reduceCooldowns(raidState.attacker);
    reduceCooldowns(raidState.target);
    
    // Process status effects
    processStatusEffects(raidState.attacker);
    processStatusEffects(raidState.target);
    
    // Next turn
    raidState.turn++;
    raidState.currentPlayer = 'attacker';
    
    // Update battle display
    const embed = createBattleEmbed(raidState);
    const components = createBattleComponents(raidState);
    
    await interaction.editReply({
        embeds: [embed],
        components
    });
}

/**
 * Process AI turn
 */
async function processAITurn(raidState) {
    const target = raidState.target;
    const attacker = raidState.attacker;
    const activeFruit = target.fruits[target.activeFruitIndex];
    
    // AI logic: 70% skill use, 30% basic attack
    const useSkill = Math.random() > 0.3;
    
    if (useSkill) {
        // Try to use skill
        const skillData = getSkillData(activeFruit.id, activeFruit.rarity);
        const cooldownKey = `${activeFruit.id}_${skillData?.name || 'basic'}`;
        
        if (skillData && target.skillCooldowns[cooldownKey] <= 0) {
            // Use skill
            let damage = skillData.damage || Math.floor(activeFruit.totalCP / 15);
            
            const originalHP = attacker.currentHP;
            attacker.currentHP = Math.max(0, attacker.currentHP - damage);
            const actualDamage = originalHP - attacker.currentHP;
            
            target.skillCooldowns[cooldownKey] = skillData.cooldown || 2;
            
            const actionText = `${target.username} uses ${skillData.name} for ${actualDamage} damage!`;
            raidState.battleLog.push(actionText);
        } else {
            // Basic attack
            executeAIBasicAttack(raidState);
        }
    } else {
        // Basic attack
        executeAIBasicAttack(raidState);
    }
}

/**
 * Execute AI basic attack
 */
function executeAIBasicAttack(raidState) {
    const target = raidState.target;
    const attacker = raidState.attacker;
    const activeFruit = target.fruits[target.activeFruitIndex];
    
    let damage = Math.floor(40 + (activeFruit.totalCP / 60));
    
    const originalHP = attacker.currentHP;
    attacker.currentHP = Math.max(0, attacker.currentHP - damage);
    const actualDamage = originalHP - attacker.currentHP;
    
    const actionText = `${target.username} attacks with ${activeFruit.name} for ${actualDamage} damage!`;
    raidState.battleLog.push(actionText);
}

/**
 * Check if battle has ended
 */
function checkBattleEnd(raidState) {
    // Check for KO
    if (raidState.attacker.currentHP <= 0) {
        return { ended: true, winner: raidState.target.userId, reason: 'Decisive Victory' };
    }
    if (raidState.target.currentHP <= 0) {
        return { ended: true, winner: raidState.attacker.userId, reason: 'Decisive Victory' };
    }
    
    // Check turn limit
    if (raidState.turn >= RAID_CONFIG.MAX_BATTLE_TURNS) {
        const attackerHP = raidState.attacker.currentHP / raidState.attacker.maxHP;
        const targetHP = raidState.target.currentHP / raidState.target.maxHP;
        
        if (attackerHP > targetHP) {
            return { ended: true, winner: raidState.attacker.userId, reason: 'Decisive Victory' };
        } else {
            return { ended: true, winner: raidState.target.userId, reason: 'Decisive Victory' };
        }
    }
    
    return { ended: false };
}

/**
 * End the battle and show results
 */
async function endBattle(interaction, raidState, battleResult) {
    const { winner, reason } = battleResult;
    
    // Calculate rewards
    const rewards = await calculateRewards(raidState, winner);
    
    // Create final result embed (like screenshot)
    const resultEmbed = createFinalResultEmbed(raidState, battleResult, rewards);
    
    await interaction.editReply({
        embeds: [resultEmbed],
        components: []
    });
    
    // Clean up
    activeRaids.delete(raidState.id);
}

/**
 * Create final result embed matching screenshot
 */
function createFinalResultEmbed(raidState, battleResult, rewards) {
    const { attacker, target } = raidState;
    const { winner, reason } = battleResult;
    
    const winnerName = winner === attacker.userId ? attacker.username : target.username;
    const loserName = winner === attacker.userId ? target.username : attacker.username;
    
    // Create HP bars for final status
    const attackerHPBar = createHPBar(attacker.currentHP, attacker.maxHP, '#00FF00');
    const targetHPBar = createHPBar(target.currentHP, target.maxHP, '#FF0000');
    
    const embed = new EmbedBuilder()
        .setTitle('🏆 Raid Victory!')
        .setDescription(`${winnerName} successfully raided ${loserName} with enhanced visual combat!`)
        .setColor(0xFFD700)
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
                name: '⚔️ Battle Summary',
                value: [
                    `**Total Turns:** ${raidState.turn}/50`,
                    `**Battle Reason:** ${reason}`,
                    `**Combat Type:** Enhanced Visual Turn-based System`,
                    `**Visual Features:** Animated HP bars, damage flashes, separated logs`
                ].join('\n'),
                inline: false
            }
        );
    
    // Add combat skills used
    const skillsUsed = getSkillsUsed(raidState);
    if (skillsUsed.length > 0) {
        embed.addFields({
            name: '⚡ Combat Skills Used',
            value: skillsUsed.join('\n'),
            inline: false
        });
    }
    
    // Add battle rewards
    if (rewards.berries > 0 || rewards.fruitsStolen.length > 0) {
        let rewardsText = '';
        
        if (rewards.berries > 0) {
            rewardsText += `💰 **Berries Stolen:** ${rewards.berries.toLocaleString()}\n`;
        }
        
        if (rewards.fruitsStolen.length > 0) {
            rewardsText += `🍈 **Fruits Stolen:** ${rewards.fruitsStolen.length}\n`;
            rewards.fruitsStolen.forEach(fruit => {
                rewardsText += `🟢 ${fruit.name}\n`;
            });
        }
        
        if (rewards.experience > 0) {
            rewardsText += `⭐ **Experience:** +${rewards.experience}`;
        }
        
        embed.addFields({
            name: '🎁 Battle Rewards',
            value: rewardsText,
            inline: false
        });
    }
    
    embed.setFooter({ 
        text: `Enhanced Visual Raid completed in ${raidState.turn} turns | Visual Combat System v3.0 • Today at ${new Date().toLocaleTimeString()}` 
    })
    .setTimestamp();
    
    return embed;
}

/**
 * Create HP bar visualization
 */
function createHPBar(currentHP, maxHP, color = '#00FF00') {
    const percentage = Math.max(0, currentHP / maxHP);
    const filledBars = Math.floor(percentage * RAID_CONFIG.HP_BAR_LENGTH);
    const emptyBars = RAID_CONFIG.HP_BAR_LENGTH - filledBars;
    
    // Choose appropriate emoji based on HP percentage
    let hpEmoji = '🟩'; // Green
    if (percentage < 0.3) {
        hpEmoji = '🟥'; // Red
    } else if (percentage < 0.6) {
        hpEmoji = '🟨'; // Yellow
    }
    
    return hpEmoji.repeat(filledBars) + '⬜'.repeat(emptyBars);
}

/**
 * Get skills used during battle
 */
function getSkillsUsed(raidState) {
    const skills = [];
    
    // Extract skills from battle log
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
    
    return skills.slice(0, 5); // Limit to 5 skills
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
        // Attacker won - gets berries and possibly fruits
        const targetBerries = raidState.target.berries || 0;
        const berriesStolen = Math.floor(targetBerries * RAID_CONFIG.BERRY_STEAL_PERCENTAGE);
        
        if (berriesStolen > 0) {
            rewards.berries = berriesStolen;
            
            // Update database
            await DatabaseManager.updateUserBerries(raidState.attacker.userId, berriesStolen, 'raid_victory');
            await DatabaseManager.updateUserBerries(raidState.target.userId, -berriesStolen, 'raid_loss');
        }
        
        // Try to steal fruits
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
                // Transfer fruit
                await transferFruit(randomFruit, targetId, attackerId);
                stolenFruits.push({
                    name: randomFruit.fruit_name,
                    rarity: randomFruit.fruit_rarity,
                    emoji: RARITY_EMOJIS[randomFruit.fruit_rarity] || '⚪'
                });
                
                // Remove from available fruits
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
        // Remove from original owner
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
    
    // Get user's devil fruits
    const fruits = await DatabaseManager.getUserDevilFruits(userId);
    
    // Process fruits for battle
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
    })).sort((a, b) => b.totalCP - a.totalCP).slice(0, 5); // Top 5 fruits
    
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
        // Apply effect
        if (effect.type === 'burn' || effect.type === 'poison') {
            const damage = effect.damage || 5;
            player.currentHP = Math.max(0, player.currentHP - damage);
        }
        
        // Reduce duration
        effect.duration--;
        return effect.duration > 0;
    });
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
