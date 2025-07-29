// src/commands/slash/pvp/pvp-raid.js - ENHANCED: Visual HP System & Cleaner Battle Display
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
    TURN_DELAY: 2500, // 2.5 seconds between turns
    DAMAGE_FLASH_DELAY: 800, // Damage flash duration
    HP_BAR_LENGTH: 20, // Length of HP bar in squares
    ANIMATION_FRAMES: 3 // Number of damage flash frames
};

// Active raid cooldowns and battles
const raidCooldowns = new Map();
const activeBattles = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid')
        .setDescription('⚔️ Launch an enhanced raid with visual HP system against another pirate!')
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
            
            // Start the enhanced turn-based battle with visual HP system
            const battleResult = await executeVisualBattle(interaction, attackerData, targetData);
            
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

// Export the module
module.exports;
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
 * Create detailed final result embed with enhanced visuals
 */
async function createDetailedResultEmbed(battleResult, rewards, attacker, target) {
    const { winner, reason, totalTurns, finalHP } = battleResult;
    
    let color = RARITY_COLORS.common;
    let title = '⚔️ Enhanced Visual Raid Complete!';
    let description = '';
    
    if (winner === attacker.id) {
        color = RARITY_COLORS.legendary;
        title = '🏆 Raid Victory!';
        description = `**${attacker.username}** successfully raided **${target.username}** with enhanced visual combat!`;
    } else if (winner === target.id) {
        color = RARITY_COLORS.epic;
        title = '🛡️ Raid Defended!';
        description = `**${target.username}** successfully defended against **${attacker.username}**!`;
    } else {
        color = RARITY_COLORS.uncommon;
        title = '⚖️ Epic Visual Battle Draw!';
        description = `An epic battle between **${attacker.username}** and **${target.username}** ended in a draw!`;
    }
    
    // Create final HP bars for result display
    const attackerFinalBar = createVisualHPBar(finalHP.attacker, battleResult.attacker.maxHP);
    const targetFinalBar = createVisualHPBar(finalHP.target, battleResult.target.maxHP);
    
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .addFields(
            {
                name: '🏁 Final HP Status',
                value: `**🏴‍☠️ ${attacker.username}:**\n${attackerFinalBar}\n**${finalHP.attacker}** / **${battleResult.attacker.maxHP}** HP\n\n**🛡️ ${target.username}:**\n${targetFinalBar}\n**${finalHP.target}** / **${battleResult.target.maxHP}** HP`,
                inline: false
            },
            {
                name: '⚔️ Battle Summary',
                value: [
                    `**Total Turns:** ${totalTurns}/${RAID_CONFIG.MAX_BATTLE_TURNS}`,
                    `**Battle Reason:** ${getReasonText(reason)}`,
                    `**Combat Type:** Enhanced Visual Turn-based System`,
                    `**Visual Features:** Animated HP bars, damage flashes, separated logs`
                ].join('\n'),
                inline: false
            }
        );
    
    // Add skill usage summary
    const skillSummary = createSkillUsageSummary(battleResult);
    if (skillSummary) {
        embed.addFields({
            name: '⚡ Combat Skills Used',
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
                name: '🎁 Battle Rewards',
                value: rewardsText,
                inline: false
            });
        }
    }
    
    embed.setFooter({ 
        text: `Enhanced Visual Raid completed in ${totalTurns} turns | Visual Combat System v3.0` 
    })
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
            const isAttacker = action.attacker === battleResult.attacker.username;
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
        summary += '\n';
    }
    
    if (targetSkills.size > 0) {
        summary += `**${battleResult.target.username}:**\n`;
        targetSkills.forEach((count, skill) => {
            const emoji = RARITY_EMOJIS[battleResult.target.bestFruit?.fruit_rarity] || '⚡';
            summary += `${emoji} ${skill} (${count}x)\n`;
        });
    }
    
    return summary.trim() || null;
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
                content: `🔄 **Enhanced Visual Rematch Requested!** ${target.username} can now raid you back with \`/pvp-raid @${buttonInteraction.user.username}\` for another epic visual battle with animated HP bars and damage effects!`,
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

/**
 * ENHANCED: Create visual HP bar with green squares that turn white when damaged
 */
function createVisualHPBar(currentHP, maxHP, recentDamage = 0, animationFrame = 0) {
    const totalBars = RAID_CONFIG.HP_BAR_LENGTH;
    const hpPercent = Math.max(0, Math.min(1, currentHP / maxHP));
    const fullBars = Math.floor(hpPercent * totalBars);
    const emptyBars = totalBars - fullBars;
    
    // Calculate damage bars for animation
    let damageBars = 0;
    let animatedBars = 0;
    
    if (recentDamage > 0 && animationFrame > 0) {
        const damagePercent = Math.min(recentDamage / maxHP, 1);
        damageBars = Math.min(Math.ceil(damagePercent * totalBars), emptyBars);
        
        // Animate damaged squares (flash yellow/orange)
        if (animationFrame <= RAID_CONFIG.ANIMATION_FRAMES) {
            animatedBars = damageBars;
        }
    }
    
    // Build HP bar with colors
    let hpBar = '';
    
    // Green squares for current HP
    hpBar += '🟩'.repeat(fullBars);
    
    // Animated damage squares (yellow flash)
    if (animatedBars > 0) {
        const flashSquare = animationFrame % 2 === 0 ? '🟨' : '🟧'; // Alternate yellow/orange
        hpBar += flashSquare.repeat(animatedBars);
        hpBar += '⬜'.repeat(emptyBars - animatedBars);
    } else {
        // White squares for lost HP
        hpBar += '⬜'.repeat(emptyBars);
    }
    
    return hpBar;
}

/**
 * ENHANCED: Create professional battle embed with visual HP system
 */
function createVisualBattleEmbed(battleState, turnResult = null, animationFrame = 0) {
    const { attacker, target, turn } = battleState;
    
    // Calculate HP percentages
    const attackerHPPercent = Math.round((attacker.currentHP / attacker.maxHP) * 100);
    const targetHPPercent = Math.round((target.currentHP / target.maxHP) * 100);
    
    // Get recent damage for animation
    const attackerDamage = turnResult && turnResult.defender === attacker.username ? turnResult.damage : 0;
    const targetDamage = turnResult && turnResult.defender === target.username ? turnResult.damage : 0;
    
    // Create animated HP bars
    const attackerHPBar = createVisualHPBar(attacker.currentHP, attacker.maxHP, attackerDamage, animationFrame);
    const targetHPBar = createVisualHPBar(target.currentHP, target.maxHP, targetDamage, animationFrame);
    
    // Professional status display
    const attackerStatus = createEnhancedPlayerStatus(attacker);
    const targetStatus = createEnhancedPlayerStatus(target);
    
    const embed = new EmbedBuilder()
        .setTitle('⚔️ ENHANCED VISUAL RAID BATTLE')
        .setColor(RARITY_COLORS.legendary)
        .setDescription(createBattleHeader(battleState, turnResult, animationFrame))
        .setTimestamp();
    
    // ENHANCED: Separate HP displays with clean formatting
    embed.addFields(
        {
            name: '🏴‍☠️ ATTACKER HP',
            value: `**${attacker.username}**\n${attackerHPBar}\n**${attacker.currentHP}** / **${attacker.maxHP}** HP (**${attackerHPPercent}%**)`,
            inline: false
        },
        {
            name: '🛡️ DEFENDER HP', 
            value: `**${target.username}**\n${targetHPBar}\n**${target.currentHP}** / **${target.maxHP}** HP (**${targetHPPercent}%**)`,
            inline: false
        }
    );
    
    // Add player details in columns
    embed.addFields(
        {
            name: '⚔️ ATTACKER STATUS',
            value: attackerStatus,
            inline: true
        },
        {
            name: '🛡️ DEFENDER STATUS',
            value: targetStatus,
            inline: true
        },
        {
            name: '📊 BATTLE INFO',
            value: `**Turn:** ${turn}/${RAID_CONFIG.MAX_BATTLE_TURNS}\n**Active:** ${battleState.currentPlayer === 'attacker' ? attacker.username : target.username}\n**Duration:** ${Math.floor((Date.now() - battleState.startTime) / 1000)}s`,
            inline: true
        }
    );
    
    // ENHANCED: Separated battle logs for each player
    const battleLogSection = createSeparatedBattleLogs(battleState, turnResult);
    if (battleLogSection) {
        embed.addFields({
            name: '📜 BATTLE LOG',
            value: battleLogSection,
            inline: false
        });
    }
    
    embed.setFooter({ 
        text: `Battle ID: ${battleState.id} | Enhanced Visual Combat System v3.0${animationFrame > 0 ? ' | Damage Animation' : ''}` 
    });
    
    return embed;
}

/**
 * ENHANCED: Create separated battle logs for cleaner display
 */
function createSeparatedBattleLogs(battleState, turnResult) {
    if (!battleState.battleLog || battleState.battleLog.length === 0) {
        return '*Battle starting...*';
    }
    
    // Get last 3 actions for compact display
    const recentActions = battleState.battleLog.slice(-3);
    
    const attackerActions = [];
    const targetActions = [];
    
    recentActions.forEach((action, index) => {
        const actionNumber = battleState.battleLog.length - recentActions.length + index + 1;
        const isAttacker = action.attacker === battleState.attacker.username;
        
        let actionText = '';
        if (action.type === 'skill_attack') {
            const critText = action.isCritical ? '💥' : '';
            actionText = `\`${actionNumber}.\` **${action.skillName}** → ${action.damage} DMG${critText}`;
        } else if (action.type === 'basic_attack') {
            const critText = action.isCritical ? '💥' : '';
            actionText = `\`${actionNumber}.\` **Basic Attack** → ${action.damage} DMG${critText}`;
        } else {
            actionText = `\`${actionNumber}.\` ${action.message || 'Action performed'}`;
        }
        
        if (isAttacker) {
            attackerActions.push(actionText);
        } else {
            targetActions.push(actionText);
        }
    });
    
    // Create separated log display
    let logDisplay = '';
    
    if (attackerActions.length > 0) {
        logDisplay += `**🏴‍☠️ ${battleState.attacker.username}:**\n${attackerActions.join('\n')}\n\n`;
    }
    
    if (targetActions.length > 0) {
        logDisplay += `**🛡️ ${battleState.target.username}:**\n${targetActions.join('\n')}`;
    }
    
    return logDisplay || '*No recent actions*';
}

/**
 * ENHANCED: Create enhanced player status with better formatting
 */
function createEnhancedPlayerStatus(player) {
    let status = '';
    
    // Devil Fruit info with better spacing
    if (player.bestFruit && player.skillData) {
        const fruitEmoji = RARITY_EMOJIS[player.bestFruit.fruit_rarity] || '🍈';
        const skillCooldown = player.skillCooldowns[player.skillData.name] || 0;
        const skillStatus = skillCooldown > 0 ? `🔄 ${skillCooldown}` : '✅';
        
        status += `${fruitEmoji} **${player.bestFruit.fruit_name}**\n`;
        status += `⚡ ${player.skillData.name} ${skillStatus}\n`;
        status += `💪 **${player.totalCP.toLocaleString()}** CP\n`;
        status += `🏆 Level **${player.level}**`;
    }
    
    // Status effects (enhanced display)
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
 * ENHANCED: Execute visual battle with damage animations
 */
async function executeVisualBattle(interaction, attackerData, targetData) {
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
    await sendVisualBattleStart(interaction, battleState);
    
    // Execute turn-based combat with visual updates
    while (battleState.turn <= RAID_CONFIG.MAX_BATTLE_TURNS) {
        const currentPlayerData = battleState.currentPlayer === 'attacker' 
            ? battleState.attacker 
            : battleState.target;
        const opponentData = battleState.currentPlayer === 'attacker' 
            ? battleState.target 
            : battleState.attacker;
        
        // Execute turn
        const turnResult = await executeTurn(battleState, currentPlayerData, opponentData);
        
        // ENHANCED: Show damage animation frames
        if (turnResult.damage > 0) {
            for (let frame = 1; frame <= RAID_CONFIG.ANIMATION_FRAMES; frame++) {
                await updateVisualBattleMessage(interaction, battleState, turnResult, frame);
                await new Promise(resolve => setTimeout(resolve, RAID_CONFIG.DAMAGE_FLASH_DELAY / RAID_CONFIG.ANIMATION_FRAMES));
            }
        }
        
        // Show final state without animation
        await updateVisualBattleMessage(interaction, battleState, turnResult, 0);
        
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
 * ENHANCED: Send visual battle start message
 */
async function sendVisualBattleStart(interaction, battleState) {
    const embed = createVisualBattleEmbed(battleState, {
        type: 'battle_start',
        message: '⚔️ **Enhanced Visual Raid Battle Begins!**',
        details: 'Turn-based combat with visual HP system!'
    });
    
    await interaction.editReply({ embeds: [embed] });
}

/**
 * ENHANCED: Update battle message with visual HP system and animations
 */
async function updateVisualBattleMessage(interaction, battleState, turnResult, animationFrame = 0) {
    try {
        // Reduce cooldowns for both players
        reduceCooldowns(battleState.attacker);
        reduceCooldowns(battleState.target);
        
        // Add to battle log
        if (turnResult && animationFrame === 0) { // Only add to log on final frame
            battleState.battleLog.push(turnResult);
            
            // Keep only last 10 actions to prevent embed from getting too long
            if (battleState.battleLog.length > 10) {
                battleState.battleLog = battleState.battleLog.slice(-10);
            }
        }
        
        const embed = createVisualBattleEmbed(battleState, turnResult, animationFrame);
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error updating visual battle message:', error);
    }
}

/**
 * Create enhanced battle header with current action
 */
function createBattleHeader(battleState, turnResult, animationFrame = 0) {
    if (!turnResult) {
        return '⚡ **ENHANCED VISUAL BATTLE IN PROGRESS** ⚡\n*Turn-based combat with visual HP system and damage animations*';
    }
    
    let header = '';
    
    // Animation indicator
    if (animationFrame > 0) {
        header += '💥 **DAMAGE IMPACT!** 💥\n';
    }
    
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
    
    // Status effects results
    if (turnResult.statusResults && turnResult.statusResults.length > 0) {
        const statusText = turnResult.statusResults.map(sr => sr.message).join(', ');
        header += `🌟 **STATUS:** ${statusText}\n`;
    }
    
    return header || '*Preparing for combat...*';
}

// Keep all the existing battle logic functions (they work well)
// Just update references to use the new visual system

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

// [Keep all other existing functions - they work well with the visual system]
// Including: executeTurn, executeSkillAttack, executeBasicAttack, processStatusEffects, etc.

/**
 * Execute a single turn of combat
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
            statusResults,
            attacker: currentPlayer.username,
            defender: opponent.username
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

// [Include all other existing helper functions]

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
