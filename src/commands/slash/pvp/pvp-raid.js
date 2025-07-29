// src/commands/slash/pvp/pvp-raid.js - COMPLETE: Interactive Fruit Selection & Turn-Based Combat
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
    MAX_BATTLE_TURNS: 30,
    TURN_TIMEOUT: 120000, // 2 minutes per turn
    HP_BAR_LENGTH: 20,
    TEAM_SIZE: 5,
    FRUITS_PER_PAGE: 20
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
            // Validation
            const validation = await validateRaid(attacker.id, target);
            if (!validation.valid) {
                return interaction.reply({
                    embeds: [createErrorEmbed(validation.reason)],
                    ephemeral: true
                });
            }
            
            await interaction.deferReply();
            
            // Get attacker's fruits for selection
            const attackerFruits = await getUserFruitsForSelection(attacker.id);
            
            if (attackerFruits.length < RAID_CONFIG.TEAM_SIZE) {
                return interaction.editReply({
                    embeds: [createErrorEmbed(`You need at least ${RAID_CONFIG.TEAM_SIZE} Devil Fruits to raid!`)],
                    ephemeral: true
                });
            }
            
            // Start fruit selection process
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

/**
 * Start fruit selection process
 */
async function startFruitSelection(interaction, attacker, target, attackerFruits) {
    const selectionId = generateSelectionId();
    
    // Store selection data
    fruitSelections.set(selectionId, {
        attackerId: attacker.id,
        targetId: target.id,
        attackerFruits,
        selectedFruits: [],
        currentPage: 0,
        createdAt: Date.now()
    });
    
    // Send selection interface
    const embed = createFruitSelectionEmbed(attackerFruits, [], 0);
    const components = createFruitSelectionComponents(selectionId, attackerFruits, [], 0);
    
    await interaction.editReply({
        embeds: [embed],
        components
    });
    
    // Setup collector for fruit selection
    setupFruitSelectionCollector(interaction, selectionId, target);
}

/**
 * Create fruit selection embed
 */
function createFruitSelectionEmbed(allFruits, selectedFruits, currentPage) {
    const embed = new EmbedBuilder()
        .setTitle(`🍈 Select Your Battle Team (${selectedFruits.length}/${RAID_CONFIG.TEAM_SIZE})`)
        .setColor(RARITY_COLORS.legendary)
        .setDescription('Choose 5 Devil Fruits for your raid team!')
        .setFooter({ text: `Page ${currentPage + 1} • Select fruits from the dropdown menu` })
        .setTimestamp();
    
    // Show selected fruits
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

/**
 * Create fruit selection components
 */
function createFruitSelectionComponents(selectionId, allFruits, selectedFruits, currentPage) {
    const components = [];
    
    // Navigation buttons
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
    
    // Fruit selection dropdown
    const startIndex = currentPage * RAID_CONFIG.FRUITS_PER_PAGE;
    const endIndex = startIndex + RAID_CONFIG.FRUITS_PER_PAGE;
    const pageFruits = allFruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0 && selectedFruits.length < RAID_CONFIG.TEAM_SIZE) {
        const options = pageFruits
            .filter(fruit => !selectedFruits.some(s => s.id === fruit.id))
            .slice(0, 25) // Discord limit
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

/**
 * Setup fruit selection collector
 */
function setupFruitSelectionCollector(interaction, selectionId, target) {
    const filter = (i) => i.user.id === interaction.user.id;
    
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 300000 // 5 minutes
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
            await componentInteraction.reply({
                content: '❌ An error occurred!',
                ephemeral: true
            });
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

/**
 * Handle page navigation
 */
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

/**
 * Handle fruit selection
 */
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

/**
 * Handle clear selection
 */
async function handleClearSelection(interaction, selectionId) {
    const selection = fruitSelections.get(selectionId);
    selection.selectedFruits = [];
    
    const embed = createFruitSelectionEmbed(selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    const components = createFruitSelectionComponents(selectionId, selection.attackerFruits, selection.selectedFruits, selection.currentPage);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle confirm selection and start battle
 */
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
    
    // Get defender's strongest 5 fruits
    const defenderFruits = await getDefenderStrongestFruits(target.id);
    
    // Start the battle
    await startBattle(interaction, selection.attackerId, target.id, selection.selectedFruits, defenderFruits);
    
    // Set cooldown
    raidCooldowns.set(selection.attackerId, Date.now());
}

/**
 * Get defender's 5 strongest fruits automatically
 */
async function getDefenderStrongestFruits(userId) {
    const fruits = await getUserFruitsForSelection(userId);
    return fruits.slice(0, RAID_CONFIG.TEAM_SIZE); // Already sorted by CP
}

/**
 * Start the battle phase
 */
async function startBattle(interaction, attackerId, defenderId, attackerTeam, defenderTeam) {
    const raidId = generateRaidId();
    
    // Get user data
    const [attackerUser, defenderUser] = await Promise.all([
        DatabaseManager.getUser(attackerId),
        DatabaseManager.getUser(defenderId)
    ]);
    
    // Initialize battle state
    const raidState = {
        id: raidId,
        attacker: {
            userId: attackerId,
            username: attackerUser.username,
            team: attackerTeam.map(fruit => ({
                ...fruit,
                currentHP: Math.floor(fruit.totalCP * 1.5),
                maxHP: Math.floor(fruit.totalCP * 1.5),
                cooldown: 0
            })),
            activeFruitIndex: 0
        },
        defender: {
            userId: defenderId,
            username: defenderUser.username,
            team: defenderTeam.map(fruit => ({
                ...fruit,
                currentHP: Math.floor(fruit.totalCP * 1.5),
                maxHP: Math.floor(fruit.totalCP * 1.5),
                cooldown: 0
            })),
            activeFruitIndex: 0
        },
        turn: 1,
        currentPlayer: 'attacker',
        battleLog: [],
        startTime: Date.now()
    };
    
    activeRaids.set(raidId, raidState);
    
    // Show battle interface
    await showBattleInterface(interaction, raidState);
}

/**
 * Show battle interface
 */
async function showBattleInterface(interaction, raidState) {
    const embed = createBattleEmbed(raidState);
    const components = createBattleComponents(raidState);
    
    await interaction.editReply({
        embeds: [embed],
        components
    });
    
    setupBattleCollector(interaction, raidState);
}

/**
 * Create battle result embed
 */
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
    
    // Final team status
    const attackerStatus = attacker.team.map(fruit => {
        const hpBar = createMiniHPBar(fruit.currentHP, fruit.maxHP, 10);
        return `${fruit.emoji} **${fruit.name}**: ${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
    }).join('\n');
    
    const defenderStatus = defender.team.map(fruit => {
        const hpBar = createMiniHPBar(fruit.currentHP, fruit.maxHP, 10);
        return `${fruit.emoji} **${fruit.name}**: ${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
    }).join('\n');
    
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
    
    // Show battle log
    if (raidState.battleLog.length > 0) {
        const battleLog = raidState.battleLog.slice(-5).join('\n');
        embed.addFields({
            name: '📜 Battle Log',
            value: battleLog.length > 1000 ? battleLog.substring(0, 997) + '...' : battleLog,
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
    
    return embed;
}

/**
 * Create mini HP bar for team display
 */
function createMiniHPBar(currentHP, maxHP, length = 10) {
    const percentage = Math.max(0, currentHP / maxHP);
    const filledBars = Math.floor(percentage * length);
    const emptyBars = length - filledBars;
    
    let hpEmoji = '🟢';
    if (percentage < 0.3) {
        hpEmoji = '🔴';
    } else if (percentage < 0.6) {
        hpEmoji = '🟡';
    }
    
    return hpEmoji.repeat(filledBars) + '⚫'.repeat(emptyBars);
}

/**
 * Get user fruits formatted for selection
 */
async function getUserFruitsForSelection(userId) {
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
                emoji: RARITY_EMOJIS[fruit.fruit_rarity] || '⚪'
            };
        }
    });
    
    // Sort by total CP descending
    return Object.values(fruitGroups).sort((a, b) => b.totalCP - a.totalCP);
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
        // Get defender's data for rewards
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
 * Reduce skill cooldowns
 */
function reduceCooldowns(player) {
    player.team.forEach(fruit => {
        if (fruit.cooldown > 0) {
            fruit.cooldown--;
        }
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
 * Generate unique selection ID
 */
function generateSelectionId() {
    return `selection_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Generate unique raid ID
 */
function generateRaidId() {
    return `raid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
} embed
 */
function createBattleEmbed(raidState) {
    const { attacker, defender, turn } = raidState;
    
    const embed = new EmbedBuilder()
        .setTitle('⚔️ Battle in Progress!')
        .setDescription(`**Turn ${turn}** - ${attacker.username} vs ${defender.username}`)
        .setColor(RARITY_COLORS.legendary)
        .setTimestamp();
    
    // Attacker team status
    const attackerTeamText = attacker.team.map((fruit, index) => {
        const isActive = index === attacker.activeFruitIndex;
        const hpBar = createMiniHPBar(fruit.currentHP, fruit.maxHP, 10);
        const cooldownText = fruit.cooldown > 0 ? ` (CD: ${fruit.cooldown})` : '';
        return `${isActive ? '▶️' : '▫️'} ${fruit.emoji} **${fruit.name}**${cooldownText}\n   ${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
    }).join('\n');
    
    embed.addFields({
        name: `⚔️ ${attacker.username}'s Team`,
        value: attackerTeamText,
        inline: true
    });
    
    // Defender team status
    const defenderTeamText = defender.team.map((fruit, index) => {
        const isActive = index === defender.activeFruitIndex;
        const hpBar = createMiniHPBar(fruit.currentHP, fruit.maxHP, 10);
        return `${isActive ? '▶️' : '▫️'} ${fruit.emoji} **${fruit.name}**\n   ${hpBar} ${fruit.currentHP}/${fruit.maxHP} HP`;
    }).join('\n');
    
    embed.addFields({
        name: `🛡️ ${defender.username}'s Team`,
        value: defenderTeamText,
        inline: true
    });
    
    // Battle log
    if (raidState.battleLog.length > 0) {
        const lastActions = raidState.battleLog.slice(-3).join('\n');
        embed.addFields({
            name: '📜 Recent Actions',
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

/**
 * Create battle components
 */
function createBattleComponents(raidState) {
    if (raidState.currentPlayer !== 'attacker') {
        return []; // No components during AI turn
    }
    
    const components = [];
    
    // Fruit selection for attack
    const availableFruits = raidState.attacker.team
        .map((fruit, index) => ({
            fruit,
            index,
            canUse: fruit.currentHP > 0 && fruit.cooldown === 0
        }))
        .filter(item => item.canUse);
    
    if (availableFruits.length > 0) {
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
    }
    
    return components;
}

/**
 * Setup battle collector
 */
function setupBattleCollector(interaction, raidState) {
    const filter = (i) => i.user.id === raidState.attacker.userId;
    
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: RAID_CONFIG.TURN_TIMEOUT
    });
    
    collector.on('collect', async (componentInteraction) => {
        try {
            if (componentInteraction.customId.startsWith('battle_attack_')) {
                await handleBattleAction(componentInteraction, raidState, interaction);
            }
        } catch (error) {
            console.error('Battle interaction error:', error);
            await componentInteraction.reply({
                content: '❌ An error occurred during battle!',
                ephemeral: true
            });
        }
    });
    
    collector.on('end', async (collected, reason) => {
        if (reason === 'time' && activeRaids.has(raidState.id)) {
            await endBattle(interaction, raidState, { ended: true, winner: raidState.defender.userId, reason: 'timeout' });
        }
    });
}

/**
 * Handle battle action
 */
async function handleBattleAction(componentInteraction, raidState, originalInteraction) {
    const fruitIndex = parseInt(componentInteraction.values[0].split('_')[1]);
    const attackingFruit = raidState.attacker.team[fruitIndex];
    
    // Execute attack
    const damage = await executeAttack(raidState, fruitIndex);
    
    await componentInteraction.reply({
        content: `⚔️ ${attackingFruit.name} attacks for ${damage} damage!`,
        ephemeral: true
    });
    
    // Check if battle ended
    const battleResult = checkBattleEnd(raidState);
    if (battleResult.ended) {
        await endBattle(originalInteraction, raidState, battleResult);
        return;
    }
    
    // AI turn
    await processAITurn(raidState);
    
    // Check again after AI turn
    const battleResult2 = checkBattleEnd(raidState);
    if (battleResult2.ended) {
        await endBattle(originalInteraction, raidState, battleResult2);
        return;
    }
    
    // Reduce cooldowns and continue
    reduceCooldowns(raidState.attacker);
    reduceCooldowns(raidState.defender);
    raidState.turn++;
    raidState.currentPlayer = 'attacker';
    
    // Update interface
    const embed = createBattleEmbed(raidState);
    const components = createBattleComponents(raidState);
    
    await originalInteraction.editReply({
        embeds: [embed],
        components
    });
}

/**
 * Execute attack
 */
async function executeAttack(raidState, attackerFruitIndex) {
    const attackingFruit = raidState.attacker.team[attackerFruitIndex];
    const defendingFruit = raidState.defender.team[raidState.defender.activeFruitIndex];
    
    // Get skill data
    const skillData = getSkillData(attackingFruit.id, attackingFruit.rarity) || {
        name: `${attackingFruit.name} Power`,
        damage: Math.floor(attackingFruit.totalCP / 20),
        cooldown: 2
    };
    
    // Calculate damage
    let damage = skillData.damage || Math.floor(attackingFruit.totalCP / 20);
    damage = Math.floor(damage * (0.8 + Math.random() * 0.4)); // Add variance
    
    // Apply damage
    const originalHP = defendingFruit.currentHP;
    defendingFruit.currentHP = Math.max(0, defendingFruit.currentHP - damage);
    const actualDamage = originalHP - defendingFruit.currentHP;
    
    // Set cooldown
    attackingFruit.cooldown = skillData.cooldown || 2;
    
    // Log action
    raidState.battleLog.push(`${raidState.attacker.username} uses ${attackingFruit.name} → ${actualDamage} damage to ${defendingFruit.name}!`);
    
    // If defending fruit is defeated, switch to next available
    if (defendingFruit.currentHP === 0) {
        const nextFruit = raidState.defender.team.findIndex((fruit, index) => 
            index !== raidState.defender.activeFruitIndex && fruit.currentHP > 0
        );
        if (nextFruit !== -1) {
            raidState.defender.activeFruitIndex = nextFruit;
            raidState.battleLog.push(`${defendingFruit.name} was defeated! ${raidState.defender.team[nextFruit].name} enters the battle!`);
        }
    }
    
    return actualDamage;
}

/**
 * Process AI turn
 */
async function processAITurn(raidState) {
    // Find available defender fruits
    const availableFruits = raidState.defender.team
        .map((fruit, index) => ({ fruit, index }))
        .filter(({ fruit }) => fruit.currentHP > 0 && fruit.cooldown === 0);
    
    if (availableFruits.length === 0) return;
    
    // Pick random available fruit
    const { fruit: attackingFruit, index: fruitIndex } = availableFruits[Math.floor(Math.random() * availableFruits.length)];
    const defendingFruit = raidState.attacker.team[raidState.attacker.activeFruitIndex];
    
    // Get skill data
    const skillData = getSkillData(attackingFruit.id, attackingFruit.rarity) || {
        name: `${attackingFruit.name} Power`,
        damage: Math.floor(attackingFruit.totalCP / 20),
        cooldown: 2
    };
    
    // Calculate damage
    let damage = skillData.damage || Math.floor(attackingFruit.totalCP / 20);
    damage = Math.floor(damage * (0.8 + Math.random() * 0.4));
    
    // Apply damage
    const originalHP = defendingFruit.currentHP;
    defendingFruit.currentHP = Math.max(0, defendingFruit.currentHP - damage);
    const actualDamage = originalHP - defendingFruit.currentHP;
    
    // Set cooldown
    attackingFruit.cooldown = skillData.cooldown || 2;
    
    // Log action
    raidState.battleLog.push(`${raidState.defender.username} uses ${attackingFruit.name} → ${actualDamage} damage to ${defendingFruit.name}!`);
    
    // If attacking fruit is defeated, switch to next available
    if (defendingFruit.currentHP === 0) {
        const nextFruit = raidState.attacker.team.findIndex((fruit, index) => 
            index !== raidState.attacker.activeFruitIndex && fruit.currentHP > 0
        );
        if (nextFruit !== -1) {
            raidState.attacker.activeFruitIndex = nextFruit;
            raidState.battleLog.push(`${defendingFruit.name} was defeated! ${raidState.attacker.team[nextFruit].name} enters the battle!`);
        }
    }
}

/**
 * Check if battle has ended
 */
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
        // Determine winner by remaining HP
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

/**
 * End battle and show results
 */
async function endBattle(interaction, raidState, battleResult) {
    const rewards = await calculateRewards(raidState, battleResult.winner);
    const resultEmbed = createBattleResultEmbed(raidState, battleResult, rewards);
    
    await interaction.editReply({
        embeds: [resultEmbed],
        components: []
    });
    
    activeRaids.delete(raidState.id);
}

/**
 * Create battle
