// src/commands/slash/pvp/pvp-raid.js - FIXED: Interaction timeout handling
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const { getSkillData } = require('../../../data/DevilFruitSkills');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');
const { recordRaidInHistory } = require('./pvp-raid-history');

// Raid configuration
const RAID_CONFIG = {
    COOLDOWN_TIME: 300000,
    MIN_CP_REQUIRED: 500,
    BERRY_STEAL_PERCENTAGE: 0.15,
    FRUIT_DROP_CHANCES: {
        'divine': 0.01, 'mythical': 0.02, 'legendary': 0.05,
        'epic': 0.08, 'rare': 0.12, 'uncommon': 0.18, 'common': 0.25
    },
    MAX_FRUIT_DROPS: 3,
    MAX_BATTLE_TURNS: 30,
    TURN_TIMEOUT: 480000, // FIXED: Reduced to 8 minutes to prevent token expiration
    HP_BAR_LENGTH: 20,
    TEAM_SIZE: 5,
    FRUITS_PER_PAGE: 20,
    MAX_INTERACTION_AGE: 720000 // 12 minutes max interaction age
};

// Active raids and cooldowns
const raidCooldowns = new Map();
const activeRaids = new Map();
const fruitSelections = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid')
        .setDescription('⚔️ Raid another pirate with strategic fruit selection!')
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
                    embeds: [createErrorEmbed(`You need at least ${RAID_CONFIG.TEAM_SIZE} Devil Fruits to raid!`)],
                    ephemeral: true
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

// [Previous helper functions remain the same until showBattleInterface...]

async function showBattleInterface(interaction, raidState) {
    // IMPROVED: Check for auto-skip before showing interface
    const availableFruits = raidState.attacker.team
        .filter(fruit => fruit.currentHP > 0 && fruit.cooldown === 0);
    
    if (availableFruits.length === 0) {
        // Auto-skip attacker turn
        raidState.battleLog.push(`⏭️ ${raidState.attacker.username} has no available fruits - turn skipped!`);
        
        // Process AI turn immediately
        await processAITurn(raidState);
        
        // Check if battle ended after AI turn
        const battleResult = checkBattleEnd(raidState);
        if (battleResult.ended) {
            await endBattle(interaction, raidState, battleResult);
            return;
        }
        
        // Reduce cooldowns and continue
        reduceCooldowns(raidState.attacker);
        reduceCooldowns(raidState.defender);
        raidState.turn++;
        raidState.currentPlayer = 'attacker';
        
        // Recursive call to check again (in case still no fruits available)
        await showBattleInterface(interaction, raidState);
        return;
    }
    
    const embed = createBattleEmbed(raidState);
    const components = createBattleComponents(raidState);
    
    // FIXED: Use editReply safely with comprehensive error handling
    try {
        // Check if interaction is still valid
        const timeSinceCreation = Date.now() - interaction.createdTimestamp;
        if (timeSinceCreation > RAID_CONFIG.MAX_INTERACTION_AGE) {
            console.log('Interaction too old, ending battle gracefully');
            await endBattle(interaction, raidState, { 
                ended: true, 
                winner: raidState.defender.userId, 
                reason: 'interaction_expired' 
            });
            return;
        }
        
        await interaction.editReply({
            embeds: [embed],
            components
        });
        
        // Only setup collector if update was successful
        setupBattleCollector(interaction, raidState);
        
    } catch (error) {
        console.error('Failed to update battle interface:', error.code, error.message);
        
        // Handle specific Discord errors
        if (error.code === 10008 || error.code === 10062 || error.code === 40060) {
            console.log('Message or interaction expired, ending battle gracefully...');
            await endBattle(interaction, raidState, { 
                ended: true, 
                winner: raidState.defender.userId, 
                reason: 'interface_expired' 
            });
        } else {
            // For other errors, try one more time with a simpler message
            try {
                await interaction.editReply({
                    content: '⚔️ Battle interface error - battle will continue in background',
                    embeds: [],
                    components: []
                });
            } catch (finalError) {
                console.error('Final fallback failed:', finalError.code);
                // End battle gracefully
                await endBattle(interaction, raidState, { 
                    ended: true, 
                    winner: raidState.defender.userId, 
                    reason: 'interface_error' 
                });
            }
        }
    }
}

function setupBattleCollector(interaction, raidState) {
    const filter = (i) => i.user.id === raidState.attacker.userId;
    
    // FIXED: Shorter timeout to prevent token expiration
    const collectorTimeout = Math.min(RAID_CONFIG.TURN_TIMEOUT, 480000); // Max 8 minutes
    
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: collectorTimeout
    });
    
    collector.on('collect', async (componentInteraction) => {
        try {
            await handleBattleAction(componentInteraction, raidState, interaction);
        } catch (error) {
            console.error('Battle interaction error:', error.code, error.message);
            
            // FIXED: Don't try to respond if interaction is expired
            if (error.code === 10062 || error.code === 40060) {
                console.log('Component interaction expired, continuing battle silently...');
                // Continue battle logic without interaction response
                await processAITurn(raidState);
                const battleResult = checkBattleEnd(raidState);
                if (battleResult.ended) {
                    await endBattle(interaction, raidState, battleResult);
                } else {
                    reduceCooldowns(raidState.attacker);
                    reduceCooldowns(raidState.defender);
                    raidState.turn++;
                    raidState.currentPlayer = 'attacker';
                    await showBattleInterface(interaction, raidState);
                }
                return;
            }
            
            // Only try to respond to valid interactions
            try {
                if (!componentInteraction.replied && !componentInteraction.deferred) {
                    await componentInteraction.reply({
                        content: '❌ An error occurred during battle!',
                        ephemeral: true
                    });
                }
            } catch (responseError) {
                console.error('Failed to send error response:', responseError.code);
            }
        }
    });
    
    collector.on('end', async (collected, reason) => {
        console.log(`Battle collector ended: ${reason}, collected: ${collected.size}`);
        if (reason === 'time' && activeRaids.has(raidState.id)) {
            await endBattle(interaction, raidState, { 
                ended: true, 
                winner: raidState.defender.userId, 
                reason: 'timeout' 
            });
        }
    });
    
    // Store collector reference for cleanup
    raidState.collector = collector;
}

async function handleBattleAction(componentInteraction, raidState, originalInteraction) {
    // CRITICAL FIX: Check interaction age before processing
    const interactionAge = Date.now() - componentInteraction.createdTimestamp;
    
    if (interactionAge > RAID_CONFIG.MAX_INTERACTION_AGE) {
        console.log(`Component interaction too old (${interactionAge}ms), processing silently`);
        await processBattleActionSilently(raidState, originalInteraction);
        return;
    }
    
    const fruitIndex = parseInt(componentInteraction.values[0].split('_')[1]);
    const attackingFruit = raidState.attacker.team[fruitIndex];
    
    // FIXED: More robust interaction handling
    let interactionHandled = false;
    
    try {
        // Try to defer the interaction first
        await componentInteraction.deferUpdate();
        interactionHandled = true;
    } catch (error) {
        console.error('Failed to defer interaction:', error.code, error.message);
        
        // If interaction is already handled or expired, continue without responding
        if (error.code === 10062 || error.code === 40060) {
            console.log('Interaction already handled or expired, continuing battle silently...');
            await processBattleActionSilently(raidState, originalInteraction);
            return;
        }
        
        // For other errors, don't try alternative responses - just continue silently
        console.log('Continuing battle without interaction response...');
        await processBattleActionSilently(raidState, originalInteraction);
        return;
    }
    
    // Continue with battle logic
    const damage = await executeAttack(raidState, fruitIndex);
    raidState.battleLog.push(`⚔️ ${attackingFruit.name} attacks for ${damage} damage!`);
    
    const battleResult = checkBattleEnd(raidState);
    if (battleResult.ended) {
        await endBattle(originalInteraction, raidState, battleResult);
        return;
    }
    
    await processAITurn(raidState);
    
    const battleResult2 = checkBattleEnd(raidState);
    if (battleResult2.ended) {
        await endBattle(originalInteraction, raidState, battleResult2);
        return;
    }
    
    reduceCooldowns(raidState.attacker);
    reduceCooldowns(raidState.defender);
    raidState.turn++;
    raidState.currentPlayer = 'attacker';
    
    // IMPROVED: Use showBattleInterface to handle auto-skip logic
    await showBattleInterface(originalInteraction, raidState);
}

/**
 * Process battle action without trying to respond to interaction
 */
async function processBattleActionSilently(raidState, originalInteraction) {
    try {
        // Process the battle logic without interaction responses
        await processAITurn(raidState);
        
        const battleResult = checkBattleEnd(raidState);
        if (battleResult.ended) {
            await endBattle(originalInteraction, raidState, battleResult);
            return;
        }
        
        reduceCooldowns(raidState.attacker);
        reduceCooldowns(raidState.defender);
        raidState.turn++;
        raidState.currentPlayer = 'attacker';
        
        // Try to update the battle interface safely
        await showBattleInterface(originalInteraction, raidState);
        
    } catch (error) {
        console.error('Error in silent battle processing:', error);
        // If all else fails, end the battle
        await endBattle(originalInteraction, raidState, { 
            ended: true, 
            winner: raidState.defender.userId, 
            reason: 'processing_error' 
        });
    }
}

// [Rest of the functions remain the same - executeAttack, processAITurn, etc.]

async function executeAttack(raidState, attackerFruitIndex) {
    const attackingFruit = raidState.attacker.team[attackerFruitIndex];
    const defendingFruit = raidState.defender.team[raidState.defender.activeFruitIndex];
    
    const skillData = getSkillData(attackingFruit.id, attackingFruit.rarity) || {
        name: `${attackingFruit.name} Power`,
        damage: Math.floor(attackingFruit.totalCP / 20),
        cooldown: 2
    };
    
    let damage = skillData.damage || Math.floor(attackingFruit.totalCP / 20);
    damage = Math.floor(damage * (0.8 + Math.random() * 0.4));
    
    // Apply self-damage
    const selfDamage = Math.floor(damage * 0.1);
    attackingFruit.currentHP = Math.max(0, attackingFruit.currentHP - selfDamage);
    
    // Apply damage to defender
    const originalHP = defendingFruit.currentHP;
    defendingFruit.currentHP = Math.max(0, defendingFruit.currentHP - damage);
    const actualDamage = originalHP - defendingFruit.currentHP;
    
    attackingFruit.cooldown = skillData.cooldown || 2;
    
    // Battle log entries
    raidState.battleLog.push(`⚔️ ${raidState.attacker.username} uses ${attackingFruit.name}!`);
    raidState.battleLog.push(`💥 Deals ${actualDamage} damage to ${defendingFruit.name} (${defendingFruit.currentHP}/${defendingFruit.maxHP} HP left)`);
    if (selfDamage > 0) {
        raidState.battleLog.push(`🩸 ${attackingFruit.name} takes ${selfDamage} recoil damage (${attackingFruit.currentHP}/${attackingFruit.maxHP} HP left)`);
    }
    
    // Handle defeated fruits
    if (attackingFruit.currentHP === 0) {
        raidState.battleLog.push(`💀 ${attackingFruit.name} was defeated by recoil damage!`);
        const nextAttackerFruit = raidState.attacker.team.findIndex((fruit, index) => 
            index !== attackerFruitIndex && fruit.currentHP > 0
        );
        if (nextAttackerFruit !== -1) {
            raidState.attacker.activeFruitIndex = nextAttackerFruit;
            raidState.battleLog.push(`🔄 ${raidState.attacker.team[nextAttackerFruit].name} is now active for ${raidState.attacker.username}!`);
        }
    }
    
    if (defendingFruit.currentHP === 0) {
        raidState.battleLog.push(`💀 ${defendingFruit.name} was defeated!`);
        const nextFruit = raidState.defender.team.findIndex((fruit, index) => 
            index !== raidState.defender.activeFruitIndex && fruit.currentHP > 0
        );
        if (nextFruit !== -1) {
            raidState.defender.activeFruitIndex = nextFruit;
            raidState.battleLog.push(`🔄 ${raidState.defender.team[nextFruit].name} enters the battle for ${raidState.defender.username}!`);
        }
    }
    
    return actualDamage;
}

async function processAITurn(raidState) {
    const availableFruits = raidState.defender.team
        .map((fruit, index) => ({ fruit, index }))
        .filter(({ fruit }) => fruit.currentHP > 0 && fruit.cooldown === 0);
    
    if (availableFruits.length === 0) {
        raidState.battleLog.push(`⏭️ ${raidState.defender.username} has no available fruits - turn skipped!`);
        return;
    }
    
    const { fruit: attackingFruit, index: fruitIndex } = availableFruits[Math.floor(Math.random() * availableFruits.length)];
    const defendingFruit = raidState.attacker.team[raidState.attacker.activeFruitIndex];
    
    const skillData = getSkillData(attackingFruit.id, attackingFruit.rarity) || {
        name: `${attackingFruit.name} Power`,
        damage: Math.floor(attackingFruit.totalCP / 20),
        cooldown: 2
    };
    
    let damage = skillData.damage || Math.floor(attackingFruit.totalCP / 20);
    damage = Math.floor(damage * (0.8 + Math.random() * 0.4));
    
    // AI fruit also takes recoil damage
    const selfDamage = Math.floor(damage * 0.1);
    attackingFruit.currentHP = Math.max(0, attackingFruit.currentHP - selfDamage);
    
    const originalHP = defendingFruit.currentHP;
    defendingFruit.currentHP = Math.max(0, defendingFruit.currentHP - damage);
    const actualDamage = originalHP - defendingFruit.currentHP;
    
    attackingFruit.cooldown = skillData.cooldown || 2;
    
    // AI battle log
    raidState.battleLog.push(`🤖 ${raidState.defender.username} uses ${attackingFruit.name}!`);
    raidState.battleLog.push(`💥 Deals ${actualDamage} damage to ${defendingFruit.name} (${defendingFruit.currentHP}/${defendingFruit.maxHP} HP left)`);
    if (selfDamage > 0) {
        raidState.battleLog.push(`🩸 ${attackingFruit.name} takes ${selfDamage} recoil damage (${attackingFruit.currentHP}/${attackingFruit.maxHP} HP left)`);
    }
    
    // Handle defeated fruits
    if (attackingFruit.currentHP === 0) {
        raidState.battleLog.push(`💀 ${attackingFruit.name} was defeated by recoil damage!`);
        const nextDefenderFruit = raidState.defender.team.findIndex((fruit, index) => 
            index !== fruitIndex && fruit.currentHP > 0
        );
        if (nextDefenderFruit !== -1) {
            raidState.defender.activeFruitIndex = nextDefenderFruit;
            raidState.battleLog.push(`🔄 ${raidState.defender.team[nextDefenderFruit].name} is now active for ${raidState.defender.username}!`);
        }
    }
    
    if (defendingFruit.currentHP === 0) {
        raidState.battleLog.push(`💀 ${defendingFruit.name} was defeated!`);
        const nextFruit = raidState.attacker.team.findIndex((fruit, index) => 
            index !== raidState.attacker.activeFruitIndex && fruit.currentHP > 0
        );
        if (nextFruit !== -1) {
            raidState.attacker.activeFruitIndex = nextFruit;
            raidState.battleLog.push(`🔄 ${raidState.attacker.team[nextFruit].name} enters the battle for ${raidState.attacker.username}!`);
        }
    }
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

async function endBattle(interaction, raidState, battleResult) {
    try {
        // Clean up collector if it exists
        if (raidState.collector) {
            raidState.collector.stop();
        }
        
        const rewards = await calculateRewards(raidState, battleResult.winner);
        const resultEmbed = createBattleResultEmbed(raidState, battleResult, rewards);
        
        // Try to edit the reply with final results
        try {
            await interaction.editReply({
                embeds: [resultEmbed],
                components: []
            });
        } catch (editError) {
            console.error('Failed to edit reply with battle results:', editError.code);
            // If edit fails, try follow up
            try {
                await interaction.followUp({
                    embeds: [resultEmbed],
                    ephemeral: false
                });
            } catch (followUpError) {
                console.error('Failed to send battle results:', followUpError.code);
            }
        }
        
        // Record raid in history
        try {
            await recordRaidInHistory({
                attackerId: raidState.attacker.userId,
                defenderId: raidState.defender.userId,
                winnerId: battleResult.winner,
                battleDuration: Math.floor((Date.now() - raidState.startTime) / 1000),
                totalTurns: raidState.turn,
                berriesStolen: rewards.berries || 0,
                fruitsStolen: rewards.fruitsStolen || [],
                battleLog: raidState.battleLog,
                startTime: raidState.startTime,
                endTime: Date.now()
            });
        } catch (error) {
            console.error('Failed to record raid in history:', error);
        }
        
        activeRaids.delete(raidState.id);
        
    } catch (error) {
        console.error('Error ending battle:', error);
        // Ensure raid is removed even if there's an error
        activeRaids.delete(raidState.id);
    }
}

// [Include all other helper functions like createBattleEmbed, createBattleComponents, etc. - they remain mostly the same]

function createBattleEmbed(raidState) {
    const { attacker, defender, turn } = raidState;
    
    const embed = new EmbedBuilder()
        .setTitle('⚔️ Battle in Progress!')
        .setDescription(`**Turn ${turn}** - ${attacker.username} vs ${defender.username}`)
        .setColor(RARITY_COLORS.legendary)
        .setTimestamp();
    
    // Team status with HP bars
    const attackerTeamText = attacker.team.map((fruit, index) => {
        const isActive = index === attacker.activeFruitIndex;
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const cooldownText = fruit.cooldown > 0 ? ` (CD: ${fruit.cooldown})` : '';
        const activeIcon = isActive ? '▶️' : '▫️';
        
        return `${activeIcon} ${fruit.emoji} **${fruit.name}**${cooldownText}\n${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
    }).join('\n\n');
    
    embed.addFields({
        name: `⚔️ ${attacker.username}'s Team`,
        value: attackerTeamText,
        inline: true
    });
    
    const defenderTeamText = defender.team.map((fruit, index) => {
        const isActive = index === defender.activeFruitIndex;
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        const activeIcon = isActive ? '▶️' : '▫️';
        
        return `${activeIcon} ${fruit.emoji} **${fruit.name}**\n${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
    }).join('\n\n');
    
    embed.addFields({
        name: `🛡️ ${defender.username}'s Team`,
        value: defenderTeamText,
        inline: true
    });
    
    // Battle log (last 8 actions)
    if (raidState.battleLog.length > 0) {
        const lastActions = raidState.battleLog.slice(-8).join('\n');
        embed.addFields({
            name: '📜 Battle Log',
            value: lastActions.length > 1000 ? lastActions.substring(0, 997) + '...' : lastActions,
            inline: false
        });
    }
    
    if (raidState.currentPlayer === 'attacker') {
        embed.addFields({
            name: '⏰ Your Turn',
            value: 'Choose a Devil Fruit to attack with!',
            inline: false
        });
    }
    
    return embed;
}

function createBattleComponents(raidState) {
    if (raidState.currentPlayer !== 'attacker') {
        return [];
    }
    
    const components = [];
    
    const availableFruits = raidState.attacker.team
        .map((fruit, index) => ({
            fruit,
            index,
            canUse: fruit.currentHP > 0 && fruit.cooldown === 0
        }))
        .filter(item => item.canUse);
    
    if (availableFruits.length === 0) {
        return [];
    }
    
    const options = availableFruits.map(({ fruit, index }) => ({
        label: `${fruit.name}`.substring(0, 100),
        description: `${fruit.currentHP}/${fruit.maxHP} HP • ${fruit.totalCP.toLocaleString()} CP`.substring(0, 100),
        value: `attack_${index}`,
        emoji: fruit.emoji
    }));
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`battle_attack_${raidState.id}`)
        .setPlaceholder('Choose a Devil Fruit to attack with...')
        .addOptions(options);
    
    components.push(new ActionRowBuilder().addComponents(selectMenu));
    
    return components;
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

function createBattleResultEmbed(raidState, battleResult, rewards) {
    const { attacker, defender } = raidState;
    const { winner, reason } = battleResult;
    
    const winnerName = winner === attacker.userId ? attacker.username : defender.username;
    const loserName = winner === attacker.userId ? defender.username : attacker.username;
    
    const embed = new EmbedBuilder()
        .setTitle('🏆 Battle Complete!')
        .setDescription(`**${winnerName}** defeats **${loserName}**!`)
        .setColor(winner === attacker.userId ? 0x00FF00 : 0xFF0000)
        .setTimestamp();
    
    const attackerStatus = attacker.team.map(fruit => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        return `${fruit.emoji} **${fruit.name}**\n${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
    }).join('\n\n');
    
    const defenderStatus = defender.team.map(fruit => {
        const hpBar = createPerfectHPBar(fruit.currentHP, fruit.maxHP);
        return `${fruit.emoji} **${fruit.name}**\n${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
    }).join('\n\n');
    
    embed.addFields(
        {
            name: `⚔️ ${attacker.username}'s Final Team`,
            value: attackerStatus,
            inline: true
        },
        {
            name: `🛡️ ${defender.username}'s Final Team`,
            value: defenderStatus,
            inline: true
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
    
    // Battle log (last 10 actions)
    if (raidState.battleLog.length > 0) {
        const battleLog = raidState.battleLog.slice(-10).join('\n');
        embed.addFields({
            name: '📜 Battle Log',
            value: battleLog.length > 1000 ? battleLog.substring(0, 997) + '...' : battleLog,
            inline: false
        });
    }
    
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

function reduceCooldowns(player) {
    player.team.forEach(fruit => {
        if (fruit.cooldown > 0) {
            fruit.cooldown--;
        }
    });
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
        
        await Promise.all([
            DatabaseManager.recalculateUserCP(fromUserId),
            DatabaseManager.recalculateUserCP(toUserId)
        ]);
        
    } catch (error) {
        console.error('Error transferring fruit:', error);
    }
}

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

function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Raid Failed')
        .setDescription(message)
        .setTimestamp();
}

function generateSelectionId() {
    return `selection_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateRaidId() {
    return `raid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Fruit selection functions (keeping existing implementations)
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

function createFruitSelectionEmbed(allFruits, selectedFruits, currentPage) {
    const embed = new EmbedBuilder()
        .setTitle(`🍈 Select Your Battle Team (${selectedFruits.length}/${RAID_CONFIG.TEAM_SIZE})`)
        .setColor(RARITY_COLORS.legendary)
        .setDescription('Choose 5 Devil Fruits for your raid team!')
        .setFooter({ text: `Page ${currentPage + 1} • Select fruits from the dropdown menu` })
        .setTimestamp();
    
    if (selectedFruits.length > 0) {
        const selectedText = selectedFruits
            .map((fruit, index) => `${index + 1}. ${fruit.emoji} **${fruit.name}** (${fruit.totalCP.toLocaleString()} CP)`)
            .join('\n');
        
        embed.addFields({
            name: '✅ Selected Team',
            value: selectedText,
            inline: false
        });
    }
    
    const startIndex = currentPage * RAID_CONFIG.FRUITS_PER_PAGE;
    const endIndex = startIndex + RAID_CONFIG.FRUITS_PER_PAGE;
    const pageFruits = allFruits.slice(startIndex, endIndex);
    
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
            name: '🍈 Available Fruits',
            value: availableText.length > 1000 ? availableText.substring(0, 997) + '...' : availableText,
            inline: false
        });
    }
    
    return embed;
}

function createFruitSelectionComponents(selectionId, allFruits, selectedFruits, currentPage) {
    const components = [];
    
    const navRow = new ActionRowBuilder();
    
    if (currentPage > 0) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`fruit_prev_${selectionId}`)
                .setLabel('⬅️ Previous')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    const totalPages = Math.ceil(allFruits.length / RAID_CONFIG.FRUITS_PER_PAGE);
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
    
    const startIndex = currentPage * RAID_CONFIG.FRUITS_PER_PAGE;
    const endIndex = startIndex + RAID_CONFIG.FRUITS_PER_PAGE;
    const pageFruits = allFruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0 && selectedFruits.length < RAID_CONFIG.TEAM_SIZE) {
        const options = pageFruits
            .filter(fruit => !selectedFruits.some(s => s.id === fruit.id))
            .slice(0, 25)
            .map((fruit, index) => {
                const globalIndex = startIndex + index;
                return {
                    label: `${fruit.name}`.substring(0, 100),
                    description: `${fruit.rarity} • ${fruit.totalCP.toLocaleString()} CP`.substring(0, 100),
                    value: `select_${globalIndex}`,
                    emoji: fruit.emoji
                };
            });
        
        if (options.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`fruit_select_${selectionId}`)
                .setPlaceholder('Select fruits for your team...')
                .setMinValues(0)
                .setMaxValues(Math.min(options.length, RAID_CONFIG.TEAM_SIZE - selectedFruits.length))
                .addOptions(options);
            
            components.push(new ActionRowBuilder().addComponents(selectMenu));
        }
    }
    
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

function setupFruitSelectionCollector(interaction, selectionId, target) {
    const filter = (i) => i.user.id === interaction.user.id;
    
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 300000
    });
    
    collector.on('collect', async (componentInteraction) => {
        try {
            const selection = fruitSelections.get(selectionId);
            if (!selection) {
                return componentInteraction.reply({
                    content: '❌ Selection session expired!',
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
                collector.stop();
            }
            
        } catch (error) {
            console.error('Fruit selection error:', error);
            
            try {
                if (!componentInteraction.replied && !componentInteraction.deferred) {
                    await componentInteraction.reply({
                        content: '❌ An error occurred!',
                        ephemeral: true
                    });
                }
            } catch (responseError) {
                console.error('Failed to send error response:', responseError);
            }
        }
    });
    
    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            interaction.editReply({
                embeds: [createErrorEmbed('Fruit selection timed out!')],
                components: []
            }).catch(() => {});
        }
        fruitSelections.delete(selectionId);
    });
}

async function handlePageNavigation(interaction, selectionId, direction) {
    const selection = fruitSelections.get(selectionId);
    
    if (direction === 'prev' && selection.currentPage > 0) {
        selection.currentPage--;
    } else if (direction === 'next') {
        const totalPages = Math.ceil(selection.attackerFruits.length / RAID_CONFIG.FRUITS_PER_PAGE);
        if (selection.currentPage < totalPages - 1) {
            selection.currentPage++;
        }
    }
    
    const embed = createFruitSelectionEmbed(selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    const components = createFruitSelectionComponents(selectionId, selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    
    await interaction.update({ embeds: [embed], components });
}

async function handleFruitSelection(interaction, selectionId) {
    const selection = fruitSelections.get(selectionId);
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
    selection.selectedFruits = [];
    
    const embed = createFruitSelectionEmbed(selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    const components = createFruitSelectionComponents(selectionId, selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    
    await interaction.update({ embeds: [embed], components });
}

async function handleConfirmSelection(interaction, selectionId, target) {
    const selection = fruitSelections.get(selectionId);
    
    if (selection.selectedFruits.length !== RAID_CONFIG.TEAM_SIZE) {
        return interaction.reply({
            content: `❌ You must select exactly ${RAID_CONFIG.TEAM_SIZE} fruits!`,
            ephemeral: true
        });
    }
    
    await interaction.update({
        embeds: [new EmbedBuilder()
            .setTitle('⚔️ Preparing Battle...')
            .setDescription('Getting defender team and starting combat!')
            .setColor(RARITY_COLORS.legendary)],
        components: []
    });
    
    const defenderFruits = await getDefenderStrongestFruits(target.id);
    
    await startBattle(interaction, selection.attackerId, target.id, selection.selectedFruits, defenderFruits);
    
    raidCooldowns.set(selection.attackerId, Date.now());
}

async function getDefenderStrongestFruits(userId) {
    const fruits = await getUserFruitsForSelection(userId);
    return fruits.slice(0, RAID_CONFIG.TEAM_SIZE);
}

async function startBattle(interaction, attackerId, defenderId, attackerTeam, defenderTeam) {
    const raidId = generateRaidId();
    
    const [attackerUser, defenderUser] = await Promise.all([
        DatabaseManager.getUser(attackerId),
        DatabaseManager.getUser(defenderId)
    ]);
    
    const raidState = {
        id: raidId,
        attacker: {
            userId: attackerId,
            username: attackerUser.username,
            team: attackerTeam.map(fruit => ({
                ...fruit,
                currentHP: 500,
                maxHP: 500,
                cooldown: 0
            })),
            activeFruitIndex: 0
        },
        defender: {
            userId: defenderId,
            username: defenderUser.username,
            team: defenderTeam.map(fruit => ({
                ...fruit,
                currentHP: 500,
                maxHP: 500,
                cooldown: 0
            })),
            activeFruitIndex: 0
        },
        turn: 1,
        currentPlayer: 'attacker',
        battleLog: [],
        startTime: Date.now(),
        collector: null
    };
    
    activeRaids.set(raidId, raidState);
    
    await showBattleInterface(interaction, raidState);
}
