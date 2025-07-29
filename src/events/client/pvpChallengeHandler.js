// src/events/client/pvpChallengeHandler.js - PvP Challenge Selection and Battle Handler
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../../database/DatabaseManager');
const { getSkillData } = require('../../data/DevilFruitSkills');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../data/Constants');

// Import the active selections and battles from the command
let activeSelections = new Map();
let activeBattles = new Map();

// Challenge configuration
const CHALLENGE_CONFIG = {
    TEAM_SIZE: 5,
    BANS_PER_SIDE: 2,
    TURN_TIMEOUT: 120000,
    FRUITS_PER_PAGE: 20,
    MAX_BATTLE_TURNS: 30
};

module.exports = {
    name: 'interactionCreate',
    
    async execute(interaction) {
        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
        
        const customId = interaction.customId;
        
        // Handle PvP Challenge interactions
        if (customId.includes('select_') || customId.includes('ban_') || customId.includes('battle_')) {
            await handlePvPChallengeInteraction(interaction);
        }
    }
};

/**
 * Handle all PvP Challenge related interactions
 */
async function handlePvPChallengeInteraction(interaction) {
    const customId = interaction.customId;
    
    try {
        // Selection phase interactions
        if (customId.startsWith('select_prev_') || customId.startsWith('select_next_')) {
            await handlePageNavigation(interaction);
        } else if (customId.startsWith('select_fruit_')) {
            await handleFruitSelection(interaction);
        } else if (customId.startsWith('clear_selection_')) {
            await handleClearSelection(interaction);
        } else if (customId.startsWith('confirm_team_')) {
            await handleTeamConfirmation(interaction);
        }
        // Banning phase interactions
        else if (customId.startsWith('ban_fruit_')) {
            await handleFruitBanning(interaction);
        } else if (customId.startsWith('confirm_bans_')) {
            await handleBanConfirmation(interaction);
        }
        // Battle phase interactions
        else if (customId.startsWith('battle_attack_') || customId.startsWith('battle_skill_') || customId.startsWith('battle_defend_')) {
            await handleBattleAction(interaction);
        }
        
    } catch (error) {
        console.error('PvP Challenge interaction error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Interaction Error')
            .setDescription('An error occurred processing your action. Please try again.')
            .setTimestamp();
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

/**
 * Handle page navigation for fruit selection
 */
async function handlePageNavigation(interaction) {
    const parts = interaction.customId.split('_');
    const direction = parts[1]; // 'prev' or 'next'
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your selection interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    const totalPages = Math.ceil(userData.fruits.length / CHALLENGE_CONFIG.FRUITS_PER_PAGE);
    
    if (direction === 'prev' && userData.currentPage > 0) {
        userData.currentPage--;
    } else if (direction === 'next' && userData.currentPage < totalPages - 1) {
        userData.currentPage++;
    }
    
    // Update the interface
    const embed = createSelectionEmbed(userData, role);
    const components = createSelectionComponents(selectionId, userData, role);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle fruit selection from dropdown
 */
async function handleFruitSelection(interaction) {
    const parts = interaction.customId.split('_');
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your selection interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    const selectedValues = interaction.values;
    
    // Process selections
    selectedValues.forEach(value => {
        const fruitIndex = parseInt(value.split('_')[1]);
        const fruit = userData.fruits[fruitIndex];
        
        if (fruit && !userData.selectedTeam.some(s => s.id === fruit.id)) {
            if (userData.selectedTeam.length < CHALLENGE_CONFIG.TEAM_SIZE) {
                userData.selectedTeam.push(fruit);
            }
        }
    });
    
    // Update the interface
    const embed = createSelectionEmbed(userData, role);
    const components = createSelectionComponents(selectionId, userData, role);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle clear selection
 */
async function handleClearSelection(interaction) {
    const parts = interaction.customId.split('_');
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your selection interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    userData.selectedTeam = [];
    
    // Update the interface
    const embed = createSelectionEmbed(userData, role);
    const components = createSelectionComponents(selectionId, userData, role);
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle team confirmation
 */
async function handleTeamConfirmation(interaction) {
    const parts = interaction.customId.split('_');
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your selection interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    
    if (userData.selectedTeam.length !== CHALLENGE_CONFIG.TEAM_SIZE) {
        return interaction.reply({ 
            content: `❌ You must select exactly ${CHALLENGE_CONFIG.TEAM_SIZE} fruits!`, 
            ephemeral: true 
        });
    }
    
    userData.selectionComplete = true;
    
    const confirmEmbed = new EmbedBuilder()
        .setColor(RARITY_COLORS.epic)
        .setTitle('✅ Team Confirmed!')
        .setDescription('Your team has been locked in. Waiting for opponent...')
        .addFields({
            name: '🏴‍☠️ Your Team',
            value: userData.selectedTeam
                .map((fruit, index) => `${index + 1}. ${fruit.emoji} **${fruit.name}** (${fruit.totalCP} CP)`)
                .join('\n'),
            inline: false
        })
        .setTimestamp();
    
    await interaction.update({ embeds: [confirmEmbed], components: [] });
    
    // Check if both teams are ready
    if (selection.challenger.selectionComplete && selection.opponent.selectionComplete) {
        setTimeout(() => startBanningPhase(interaction, selectionId), 2000);
    }
}

/**
 * Start the banning phase
 */
async function startBanningPhase(interaction, selectionId) {
    const selection = activeSelections.get(selectionId);
    if (!selection) return;
    
    selection.phase = 'banning';
    selection.challenger.bannedFruits = [];
    selection.opponent.bannedFruits = [];
    selection.challenger.bansComplete = false;
    selection.opponent.bansComplete = false;
    
    // Send banning interfaces
    await sendBanningInterface(interaction, selectionId, selection.challenger.userId, 'challenger', selection.opponent.selectedTeam);
    await sendBanningInterface(interaction, selectionId, selection.opponent.userId, 'opponent', selection.challenger.selectedTeam);
}

/**
 * Send banning interface to user
 */
async function sendBanningInterface(interaction, selectionId, userId, role, opponentTeam) {
    const selection = activeSelections.get(selectionId);
    const userData = selection[role];
    
    try {
        const user = await interaction.client.users.fetch(userId);
        
        const embed = new EmbedBuilder()
            .setColor(RARITY_COLORS.rare)
            .setTitle(`🚫 Ban Phase (${userData.bannedFruits?.length || 0}/${CHALLENGE_CONFIG.BANS_PER_SIDE})`)
            .setDescription(`Choose ${CHALLENGE_CONFIG.BANS_PER_SIDE} fruits to ban from your opponent's team!`)
            .setFooter({ text: 'Select fruits to prevent your opponent from using them' })
            .setTimestamp();
        
        // Show opponent's team
        const teamText = opponentTeam
            .map((fruit, index) => {
                const isBanned = userData.bannedFruits?.some(b => b.id === fruit.id);
                const status = isBanned ? '🚫' : `${index + 1}.`;
                return `${status} ${fruit.emoji} **${fruit.name}** (${fruit.totalCP} CP)`;
            })
            .join('\n');
        
        embed.addFields({
            name: '⚔️ Opponent\'s Team',
            value: teamText,
            inline: false
        });
        
        // Create ban selection dropdown
        const availableForBan = opponentTeam.filter(fruit => 
            !userData.bannedFruits?.some(b => b.id === fruit.id)
        );
        
        const components = [];
        
        if (availableForBan.length > 0 && (userData.bannedFruits?.length || 0) < CHALLENGE_CONFIG.BANS_PER_SIDE) {
            const options = availableForBan.map((fruit, index) => ({
                label: `${fruit.name}`.substring(0, 100),
                description: `${fruit.rarity} • ${fruit.totalCP} CP`.substring(0, 100),
                value: `ban_${fruit.id}`,
                emoji: fruit.emoji
            }));
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`ban_fruit_${selectionId}_${role}`)
                .setPlaceholder('Select fruits to ban...')
                .setMinValues(0)
                .setMaxValues(Math.min(options.length, CHALLENGE_CONFIG.BANS_PER_SIDE - (userData.bannedFruits?.length || 0)))
                .addOptions(options);
            
            components.push(new ActionRowBuilder().addComponents(selectMenu));
        }
        
        // Add confirmation button if bans are complete
        if ((userData.bannedFruits?.length || 0) === CHALLENGE_CONFIG.BANS_PER_SIDE) {
            const confirmButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm_bans_${selectionId}_${role}`)
                        .setLabel('✅ Confirm Bans')
                        .setStyle(ButtonStyle.Success)
                );
            components.push(confirmButton);
        }
        
        if (userData.bannedFruits?.length > 0) {
            const bannedText = userData.bannedFruits
                .map(fruit => `🚫 ${fruit.emoji} **${fruit.name}**`)
                .join('\n');
            
            embed.addFields({
                name: '🚫 Your Bans',
                value: bannedText,
                inline: false
            });
        }
        
        await user.send({ embeds: [embed], components });
        
    } catch (error) {
        console.error('Failed to send ban interface:', error);
    }
}

/**
 * Handle fruit banning
 */
async function handleFruitBanning(interaction) {
    const parts = interaction.customId.split('_');
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your banning interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    const selectedValues = interaction.values;
    const opponentTeam = role === 'challenger' ? selection.opponent.selectedTeam : selection.challenger.selectedTeam;
    
    if (!userData.bannedFruits) userData.bannedFruits = [];
    
    // Process ban selections
    selectedValues.forEach(value => {
        const fruitId = value.split('_')[1];
        const fruit = opponentTeam.find(f => f.id === fruitId);
        
        if (fruit && !userData.bannedFruits.some(b => b.id === fruit.id)) {
            if (userData.bannedFruits.length < CHALLENGE_CONFIG.BANS_PER_SIDE) {
                userData.bannedFruits.push(fruit);
            }
        }
    });
    
    // Update the interface
    const embed = new EmbedBuilder()
        .setColor(RARITY_COLORS.rare)
        .setTitle(`🚫 Ban Phase (${userData.bannedFruits.length}/${CHALLENGE_CONFIG.BANS_PER_SIDE})`)
        .setDescription(`Choose ${CHALLENGE_CONFIG.BANS_PER_SIDE} fruits to ban from your opponent's team!`)
        .setFooter({ text: 'Select fruits to prevent your opponent from using them' })
        .setTimestamp();
    
    // Show opponent's team with bans marked
    const teamText = opponentTeam
        .map((fruit, index) => {
            const isBanned = userData.bannedFruits.some(b => b.id === fruit.id);
            const status = isBanned ? '🚫' : `${index + 1}.`;
            return `${status} ${fruit.emoji} **${fruit.name}** (${fruit.totalCP} CP)`;
        })
        .join('\n');
    
    embed.addFields({
        name: '⚔️ Opponent\'s Team',
        value: teamText,
        inline: false
    });
    
    if (userData.bannedFruits.length > 0) {
        const bannedText = userData.bannedFruits
            .map(fruit => `🚫 ${fruit.emoji} **${fruit.name}**`)
            .join('\n');
        
        embed.addFields({
            name: '🚫 Your Bans',
            value: bannedText,
            inline: false
        });
    }
    
    // Create updated components
    const components = [];
    const availableForBan = opponentTeam.filter(fruit => 
        !userData.bannedFruits.some(b => b.id === fruit.id)
    );
    
    if (availableForBan.length > 0 && userData.bannedFruits.length < CHALLENGE_CONFIG.BANS_PER_SIDE) {
        const options = availableForBan.map(fruit => ({
            label: `${fruit.name}`.substring(0, 100),
            description: `${fruit.rarity} • ${fruit.totalCP} CP`.substring(0, 100),
            value: `ban_${fruit.id}`,
            emoji: fruit.emoji
        }));
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`ban_fruit_${selectionId}_${role}`)
            .setPlaceholder('Select more fruits to ban...')
            .setMinValues(0)
            .setMaxValues(Math.min(options.length, CHALLENGE_CONFIG.BANS_PER_SIDE - userData.bannedFruits.length))
            .addOptions(options);
        
        components.push(new ActionRowBuilder().addComponents(selectMenu));
    }
    
    if (userData.bannedFruits.length === CHALLENGE_CONFIG.BANS_PER_SIDE) {
        const confirmButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_bans_${selectionId}_${role}`)
                    .setLabel('✅ Confirm Bans')
                    .setStyle(ButtonStyle.Success)
            );
        components.push(confirmButton);
    }
    
    await interaction.update({ embeds: [embed], components });
}

/**
 * Handle ban confirmation
 */
async function handleBanConfirmation(interaction) {
    const parts = interaction.customId.split('_');
    const selectionId = parts[2];
    const role = parts[3];
    
    const selection = activeSelections.get(selectionId);
    if (!selection) {
        return interaction.reply({ content: '❌ Selection session expired!', ephemeral: true });
    }
    
    if (interaction.user.id !== selection[role].userId) {
        return interaction.reply({ content: '❌ This is not your banning interface!', ephemeral: true });
    }
    
    const userData = selection[role];
    
    if (userData.bannedFruits.length !== CHALLENGE_CONFIG.BANS_PER_SIDE) {
        return interaction.reply({ 
            content: `❌ You must ban exactly ${CHALLENGE_CONFIG.BANS_PER_SIDE} fruits!`, 
            ephemeral: true 
        });
    }
    
    userData.bansComplete = true;
    
    const confirmEmbed = new EmbedBuilder()
        .setColor(RARITY_COLORS.epic)
        .setTitle('✅ Bans Confirmed!')
        .setDescription('Your bans have been locked in. Waiting for opponent...')
        .addFields({
            name: '🚫 Your Bans',
            value: userData.bannedFruits
                .map(fruit => `🚫 ${fruit.emoji} **${fruit.name}**`)
                .join('\n'),
            inline: false
        })
        .setTimestamp();
    
    await interaction.update({ embeds: [confirmEmbed], components: [] });
    
    // Check if both players have completed bans
    if (selection.challenger.bansComplete && selection.opponent.bansComplete) {
        setTimeout(() => startBattle(interaction, selectionId), 2000);
    }
}

/**
 * Start the battle phase
 */
async function startBattle(interaction, selectionId) {
    const selection = activeSelections.get(selectionId);
    if (!selection) return;
    
    // Create battle state
    const battleId = generateBattleId();
    const battle = {
        id: battleId,
        challengerId: selection.challenger.userId,
        opponentId: selection.opponent.userId,
        currentTurn: selection.challenger.userId, // Challenger goes first
        turn: 1,
        
        // Filter out banned fruits and add battle stats
        challenger: {
            userId: selection.challenger.userId,
            team: selection.challenger.selectedTeam.filter(fruit => 
                !selection.opponent.bannedFruits.some(ban => ban.id === fruit.id)
            ).map(fruit => addBattleStats(fruit)),
            activeFruit: 0, // Index of current active fruit
            bannedFruits: selection.challenger.bannedFruits
        },
        
        opponent: {
            userId: selection.opponent.userId,
            team: selection.opponent.selectedTeam.filter(fruit => 
                !selection.challenger.bannedFruits.some(ban => ban.id === fruit.id)
            ).map(fruit => addBattleStats(fruit)),
            activeFruit: 0,
            bannedFruits: selection.opponent.bannedFruits
        },
        
        battleLog: [],
        status: 'active',
        createdAt: Date.now()
    };
    
    // Store battle
    activeBattles.set(battleId, battle);
    
    // Clean up selection data
    activeSelections.delete(selectionId);
    
    // Send battle interfaces
    await sendBattleInterface(interaction, battleId, battle.challengerId);
    await sendBattleInterface(interaction, battleId, battle.opponentId);
    
    // Add initial battle log entry
    battle.battleLog.push({
        turn: 0,
        action: 'battle_start',
        message: '⚔️ **Battle Begins!** May the strongest pirate win!',
        timestamp: Date.now()
    });
}

/**
 * Add battle stats to a fruit
 */
function addBattleStats(fruit) {
    const maxHP = Math.floor(fruit.totalCP * 1.5); // HP based on CP
    
    return {
        ...fruit,
        currentHP: maxHP,
        maxHP: maxHP,
        statusEffects: [],
        skillCooldowns: {}
    };
}

/**
 * Send battle interface to user
 */
async function sendBattleInterface(interaction, battleId, userId) {
    const battle = activeBattles.get(battleId);
    if (!battle) return;
    
    const isChallenger = userId === battle.challengerId;
    const playerData = isChallenger ? battle.challenger : battle.opponent;
    const opponentData = isChallenger ? battle.opponent : battle.challenger;
    const isPlayerTurn = battle.currentTurn === userId;
    
    try {
        const user = await interaction.client.users.fetch(userId);
        
        const embed = createBattleEmbed(battle, playerData, opponentData, isPlayerTurn);
        const components = isPlayerTurn ? createBattleComponents(battleId, playerData, isChallenger) : [];
        
        await user.send({ embeds: [embed], components });
        
    } catch (error) {
        console.error('Failed to send battle interface:', error);
    }
}

/**
 * Create battle embed
 */
function createBattleEmbed(battle, playerData, opponentData, isPlayerTurn) {
    const playerFruit = playerData.team[playerData.activeFruit];
    const opponentFruit = opponentData.team[opponentData.activeFruit];
    
    const embed = new EmbedBuilder()
        .setColor(isPlayerTurn ? RARITY_COLORS.legendary : RARITY_COLORS.rare)
        .setTitle(`⚔️ PvP Battle - Turn ${battle.turn}`)
        .setDescription(isPlayerTurn ? '🔥 **Your Turn!** Choose your action.' : '⏳ **Opponent\'s Turn** - Wait for their move.')
        .setFooter({ text: `Battle ID: ${battle.id}` })
        .setTimestamp();
    
    // Player's active fruit
    if (playerFruit) {
        const hpBar = createHPBar(playerFruit.currentHP, playerFruit.maxHP);
        embed.addFields({
            name: `🏴‍☠️ Your Active Fruit`,
            value: [
                `${playerFruit.emoji} **${playerFruit.name}**`,
                `❤️ HP: ${playerFruit.currentHP}/${playerFruit.maxHP} ${hpBar}`,
                `⚡ CP: ${playerFruit.totalCP}`,
                `🔮 Type: ${playerFruit.type}`
            ].join('\n'),
            inline: true
        });
    }
    
    // Opponent's active fruit
    if (opponentFruit) {
        const hpBar = createHPBar(opponentFruit.currentHP, opponentFruit.maxHP);
        embed.addFields({
            name: `⚔️ Opponent's Active Fruit`,
            value: [
                `${opponentFruit.emoji} **${opponentFruit.name}**`,
                `❤️ HP: ${opponentFruit.currentHP}/${opponentFruit.maxHP} ${hpBar}`,
                `⚡ CP: ${opponentFruit.totalCP}`,
                `🔮 Type: ${opponentFruit.type}`
            ].join('\n'),
            inline: true
        });
    }
    
    // Team status
    const playerTeamStatus = playerData.team.map((fruit, index) => {
        const isActive = index === playerData.activeFruit;
        const status = fruit.currentHP <= 0 ? '💀' : isActive ? '⚔️' : '🛡️';
        const hp = fruit.currentHP > 0 ? `(${fruit.currentHP}HP)` : '(KO)';
        return `${status} ${fruit.emoji} ${fruit.name} ${hp}`;
    }).join('\n');
    
    const opponentTeamStatus = opponentData.team.map((fruit, index) => {
        const isActive = index === opponentData.activeFruit;
        const status = fruit.currentHP <= 0 ? '💀' : isActive ? '⚔️' : '🛡️';
        const hp = fruit.currentHP > 0 ? `(${fruit.currentHP}HP)` : '(KO)';
        return `${status} ${fruit.emoji} ${fruit.name} ${hp}`;
    }).join('\n');
    
    embed.addFields(
        {
            name: '🏴‍☠️ Your Team',
            value: playerTeamStatus.substring(0, 1024),
            inline: true
        },
        {
            name: '⚔️ Opponent Team', 
            value: opponentTeamStatus.substring(0, 1024),
            inline: true
        }
    );
    
    // Recent battle log
    if (battle.battleLog.length > 0) {
        const recentLog = battle.battleLog.slice(-3).map(entry => entry.message).join('\n');
        embed.addFields({
            name: '📜 Recent Actions',
            value: recentLog.substring(0, 1024),
            inline: false
        });
    }
    
    return embed;
}

/**
 * Create HP bar visualization
 */
function createHPBar(current, max, length = 10) {
    const percentage = current / max;
    const filled = Math.floor(percentage * length);
    const empty = length - filled;
    
    let color = '🟩'; // Green
    if (percentage < 0.3) color = '🟥'; // Red
    else if (percentage < 0.6) color = '🟨'; // Yellow
    
    return color.repeat(filled) + '⬜'.repeat(empty);
}

/**
 * Create battle action components
 */
function createBattleComponents(battleId, playerData, isChallenger) {
    const role = isChallenger ? 'challenger' : 'opponent';
    const activeFruit = playerData.team[playerData.activeFruit];
    
    if (!activeFruit || activeFruit.currentHP <= 0) {
        // Need to switch fruit
        const aliveFruits = playerData.team.filter((fruit, index) => 
            fruit.currentHP > 0 && index !== playerData.activeFruit
        );
        
        if (aliveFruits.length === 0) {
            return []; // No actions available - battle over
        }
        
        const options = aliveFruits.map((fruit, index) => ({
            label: `${fruit.name} (${fruit.currentHP}HP)`.substring(0, 100),
            description: `${fruit.rarity} • ${fruit.totalCP} CP`.substring(0, 100),
            value: `switch_${playerData.team.indexOf(fruit)}`,
            emoji: fruit.emoji
        }));
        
        return [
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`battle_switch_${battleId}_${role}`)
                    .setPlaceholder('Choose a fruit to switch to...')
                    .addOptions(options)
            )
        ];
    }
    
    // Get skill data for the active fruit
    const skillData = getSkillData(activeFruit.id, activeFruit.rarity);
    const skill = skillData || { name: 'Devil Fruit Power', damage: 100, cooldown: 2 };
    
    // Check skill cooldown
    const skillOnCooldown = activeFruit.skillCooldowns[skill.name] > 0;
    
    const components = [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`battle_attack_${battleId}_${role}`)
                .setLabel('🗡️ Attack')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`battle_skill_${battleId}_${role}`)
                .setLabel(`✨ ${skill.name}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(skillOnCooldown),
            new ButtonBuilder()
                .setCustomId(`battle_defend_${battleId}_${role}`)
                .setLabel('🛡️ Defend')
                .setStyle(ButtonStyle.Success)
        )
    ];
    
    // Add switch option if other fruits are alive
    const aliveFruits = playerData.team.filter((fruit, index) => 
        fruit.currentHP > 0 && index !== playerData.activeFruit
    );
    
    if (aliveFruits.length > 0) {
        const options = aliveFruits.map(fruit => ({
            label: `${fruit.name} (${fruit.currentHP}HP)`.substring(0, 100),
            description: `Switch to ${fruit.rarity}`.substring(0, 100),
            value: `switch_${playerData.team.indexOf(fruit)}`,
            emoji: fruit.emoji
        }));
        
        components.push(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`battle_switch_${battleId}_${role}`)
                    .setPlaceholder('Switch fruit (optional)...')
                    .addOptions(options)
            )
        );
    }
    
    return components;
}

/**
 * Handle battle actions
 */
async function handleBattleAction(interaction) {
    const parts = interaction.customId.split('_');
    const action = parts[1]; // 'attack', 'skill', 'defend', 'switch'
    const battleId = parts[2];
    const role = parts[3];
    
    const battle = activeBattles.get(battleId);
    if (!battle) {
        return interaction.reply({ content: '❌ Battle session expired!', ephemeral: true });
    }
    
    const isChallenger = role === 'challenger';
    const userId = isChallenger ? battle.challengerId : battle.opponentId;
    
    if (interaction.user.id !== userId) {
        return interaction.reply({ content: '❌ This is not your battle!', ephemeral: true });
    }
    
    if (battle.currentTurn !== userId) {
        return interaction.reply({ content: '❌ It\'s not your turn!', ephemeral: true });
    }
    
    const playerData = isChallenger ? battle.challenger : battle.opponent;
    const opponentData = isChallenger ? battle.opponent : battle.challenger;
    
    let actionResult = null;
    
    switch (action) {
        case 'attack':
            actionResult = await executeAttack(playerData, opponentData);
            break;
        case 'skill':
            actionResult = await executeSkill(playerData, opponentData);
            break;
        case 'defend':
            actionResult = await executeDefend(playerData);
            break;
        case 'switch':
            if (interaction.isStringSelectMenu()) {
                const targetIndex = parseInt(interaction.values[0].split('_')[1]);
                actionResult = await executeSwitchFruit(playerData, targetIndex);
            }
            break;
    }
    
    if (actionResult) {
        // Add to battle log
        battle.battleLog.push({
            turn: battle.turn,
            action: action,
            message: actionResult.message,
            timestamp: Date.now()
        });
        
        // Process status effects and cooldowns
        processStatusEffects(playerData);
        processStatusEffects(opponentData);
        reduceCooldowns(playerData);
        reduceCooldowns(opponentData);
        
        // Check for battle end
        const battleEnd = checkBattleEnd(battle);
        if (battleEnd.ended) {
            await endBattle(interaction, battleId, battleEnd);
            return;
        }
        
        // Switch turns
        battle.currentTurn = battle.currentTurn === battle.challengerId ? battle.opponentId : battle.challengerId;
        battle.turn++;
        
        // Update battle interfaces for both players
        await updateBattleInterface(interaction, battleId, battle.challengerId);
        await updateBattleInterface(interaction, battleId, battle.opponentId);
    }
    
    await interaction.deferUpdate();
}

/**
 * Execute attack action
 */
async function executeAttack(attacker, defender) {
    const attackerFruit = attacker.team[attacker.activeFruit];
    const defenderFruit = defender.team[defender.activeFruit];
    
    if (!attackerFruit || !defenderFruit || attackerFruit.currentHP <= 0 || defenderFruit.currentHP <= 0) {
        return { message: '❌ Invalid attack - fruit not available!' };
    }
    
    // Calculate damage
    const baseDamage = Math.floor(attackerFruit.totalCP * 0.3); // 30% of CP as base damage
    const variance = 0.8 + (Math.random() * 0.4); // 80-120% variance
    const damage = Math.floor(baseDamage * variance);
    
    // Apply damage
    defenderFruit.currentHP = Math.max(0, defenderFruit.currentHP - damage);
    
    const message = `🗡️ **${attackerFruit.name}** attacks **${defenderFruit.name}** for ${damage} damage! (${defenderFruit.currentHP}/${defenderFruit.maxHP} HP remaining)`;
    
    // Check if defender fruit is KO'd
    if (defenderFruit.currentHP <= 0) {
        // Try to auto-switch to next available fruit
        const nextFruit = defender.team.findIndex((fruit, index) => 
            fruit.currentHP > 0 && index !== defender.activeFruit
        );
        
        if (nextFruit !== -1) {
            defender.activeFruit = nextFruit;
            return { 
                message: message + `\n💀 **${defenderFruit.name}** is KO'd! **${defender.team[nextFruit].name}** enters battle!`
            };
        } else {
            return { message: message + `\n💀 **${defenderFruit.name}** is KO'd!` };
        }
    }
    
    return { message };
}

/**
 * Execute skill action
 */
async function executeSkill(attacker, defender) {
    const attackerFruit = attacker.team[attacker.activeFruit];
    const defenderFruit = defender.team[defender.activeFruit];
    
    if (!attackerFruit || !defenderFruit || attackerFruit.currentHP <= 0 || defenderFruit.currentHP <= 0) {
        return { message: '❌ Invalid skill use - fruit not available!' };
    }
    
    // Get skill data
    const skillData = getSkillData(attackerFruit.id, attackerFruit.rarity);
    const skill = skillData || { name: 'Devil Fruit Power', damage: 100, cooldown: 2 };
    
    // Check cooldown
    if (attackerFruit.skillCooldowns[skill.name] > 0) {
        return { message: `❌ ${skill.name} is on cooldown for ${attackerFruit.skillCooldowns[skill.name]} more turns!` };
    }
    
    // Set cooldown
    attackerFruit.skillCooldowns[skill.name] = skill.cooldown || 2;
    
    // Calculate skill damage
    const baseDamage = skill.damage || 100;
    const cpMultiplier = attackerFruit.totalCP / 1000; // Scale with CP
    const damage = Math.floor(baseDamage * (1 + cpMultiplier));
    
    // Apply damage
    defenderFruit.currentHP = Math.max(0, defenderFruit.currentHP - damage);
    
    let message = `✨ **${attackerFruit.name}** uses **${skill.name}** on **${defenderFruit.name}** for ${damage} damage!`;
    
    // Check if defender fruit is KO'd
    if (defenderFruit.currentHP <= 0) {
        const nextFruit = defender.team.findIndex((fruit, index) => 
            fruit.currentHP > 0 && index !== defender.activeFruit
        );
        
        if (nextFruit !== -1) {
            defender.activeFruit = nextFruit;
            message += `\n💀 **${defenderFruit.name}** is KO'd! **${defender.team[nextFruit].name}** enters battle!`;
        } else {
            message += `\n💀 **${defenderFruit.name}** is KO'd!`;
        }
    }
    
    return { message };
}

/**
 * Execute defend action
 */
async function executeDefend(player) {
    const playerFruit = player.team[player.activeFruit];
    
    if (!playerFruit || playerFruit.currentHP <= 0) {
        return { message: '❌ Invalid defend - fruit not available!' };
    }
    
    // Heal 10% of max HP
    const healAmount = Math.floor(playerFruit.maxHP * 0.1);
    playerFruit.currentHP = Math.min(playerFruit.maxHP, playerFruit.currentHP + healAmount);
    
    // Add defense buff (reduce next damage by 50%)
    playerFruit.statusEffects = playerFruit.statusEffects || [];
    playerFruit.statusEffects.push({
        type: 'defense',
        name: 'Defensive Stance',
        duration: 1,
        effect: 0.5 // 50% damage reduction
    });
    
    return { 
        message: `🛡️ **${playerFruit.name}** takes a defensive stance! (+${healAmount} HP, 50% damage reduction next turn)`
    };
}

/**
 * Execute fruit switch
 */
async function executeSwitchFruit(player, targetIndex) {
    const currentFruit = player.team[player.activeFruit];
    const targetFruit = player.team[targetIndex];
    
    if (!targetFruit || targetFruit.currentHP <= 0) {
        return { message: '❌ Cannot switch to KO\'d fruit!' };
    }
    
    if (targetIndex === player.activeFruit) {
        return { message: '❌ That fruit is already active!' };
    }
    
    player.activeFruit = targetIndex;
    
    return { 
        message: `🔄 **${currentFruit?.name || 'Previous fruit'}** switches out! **${targetFruit.name}** enters battle!`
    };
}

/**
 * Process status effects
 */
function processStatusEffects(playerData) {
    playerData.team.forEach(fruit => {
        if (fruit.statusEffects) {
            fruit.statusEffects = fruit.statusEffects.filter(effect => {
                effect.duration--;
                return effect.duration > 0;
            });
        }
    });
}

/**
 * Reduce skill cooldowns
 */
function reduceCooldowns(playerData) {
    playerData.team.forEach(fruit => {
        if (fruit.skillCooldowns) {
            Object.keys(fruit.skillCooldowns).forEach(skill => {
                if (fruit.skillCooldowns[skill] > 0) {
                    fruit.skillCooldowns[skill]--;
                }
            });
        }
    });
}

/**
 * Check if battle has ended
 */
function checkBattleEnd(battle) {
    const challengerAlive = battle.challenger.team.some(fruit => fruit.currentHP > 0);
    const opponentAlive = battle.opponent.team.some(fruit => fruit.currentHP > 0);
    
    if (!challengerAlive && !opponentAlive) {
        return { ended: true, winner: null, reason: 'draw' };
    } else if (!challengerAlive) {
        return { ended: true, winner: battle.opponentId, reason: 'victory' };
    } else if (!opponentAlive) {
        return { ended: true, winner: battle.challengerId, reason: 'victory' };
    } else if (battle.turn > CHALLENGE_CONFIG.MAX_BATTLE_TURNS) {
        // Time limit - winner has more HP
        const challengerHP = battle.challenger.team.reduce((sum, fruit) => sum + fruit.currentHP, 0);
        const opponentHP = battle.opponent.team.reduce((sum, fruit) => sum + fruit.currentHP, 0);
        
        if (challengerHP > opponentHP) {
            return { ended: true, winner: battle.challengerId, reason: 'time_limit' };
        } else if (opponentHP > challengerHP) {
            return { ended: true, winner: battle.opponentId, reason: 'time_limit' };
        } else {
            return { ended: true, winner: null, reason: 'draw' };
        }
    }
    
    return { ended: false };
}

/**
 * End the battle
 */
async function endBattle(interaction, battleId, battleEnd) {
    const battle = activeBattles.get(battleId);
    if (!battle) return;
    
    // Create result embed
    const resultEmbed = new EmbedBuilder()
        .setTitle('⚔️ PvP Challenge Complete!')
        .setColor(battleEnd.winner ? RARITY_COLORS.legendary : RARITY_COLORS.uncommon)
        .setTimestamp();
    
    if (battleEnd.winner) {
        const winner = battleEnd.winner === battle.challengerId ? 'Challenger' : 'Opponent';
        resultEmbed.setDescription(`🏆 **${winner} Wins!**`);
        
        if (battleEnd.reason === 'time_limit') {
            resultEmbed.addFields({
                name: '⏰ Victory Condition',
                value: 'Won by having more HP when turn limit reached',
                inline: false
            });
        }
    } else {
        resultEmbed.setDescription('🤝 **Draw!** Both teams fought valiantly.');
    }
    
    // Add battle stats
    const challengerHP = battle.challenger.team.reduce((sum, fruit) => sum + fruit.currentHP, 0);
    const opponentHP = battle.opponent.team.reduce((sum, fruit) => sum + fruit.currentHP, 0);
    
    resultEmbed.addFields(
        {
            name: '📊 Final Stats',
            value: [
                `**Turns:** ${battle.turn}`,
                `**Challenger HP:** ${challengerHP}`,
                `**Opponent HP:** ${opponentHP}`
            ].join('\n'),
            inline: true
        },
        {
            name: '🏆 Battle Summary',
            value: `Epic ${battle.turn}-turn battle with strategic fruit switching and skill usage!`,
            inline: false
        }
    );
    
    // Send to both players
    try {
        const challenger = await interaction.client.users.fetch(battle.challengerId);
        const opponent = await interaction.client.users.fetch(battle.opponentId);
        
        await challenger.send({ embeds: [resultEmbed] });
        await opponent.send({ embeds: [resultEmbed] });
    } catch (error) {
        console.error('Failed to send battle results:', error);
    }
    
/**
 * Update battle interface for a user
 */
async function updateBattleInterface(interaction, battleId, userId) {
    const battle = activeBattles.get(battleId);
    if (!battle) return;
    
    const isChallenger = userId === battle.challengerId;
    const playerData = isChallenger ? battle.challenger : battle.opponent;
    const opponentData = isChallenger ? battle.opponent : battle.challenger;
    const isPlayerTurn = battle.currentTurn === userId;
    
    try {
        const user = await interaction.client.users.fetch(userId);
        
        const embed = createBattleEmbed(battle, playerData, opponentData, isPlayerTurn);
        const components = isPlayerTurn ? createBattleComponents(battleId, playerData, isChallenger) : [];
        
        await user.send({ embeds: [embed], components });
        
    } catch (error) {
        console.error('Failed to update battle interface:', error);
    }
}

/**
 * Create selection embed (shared function)
 */
function createSelectionEmbed(userData, role) {
    const selectedCount = userData.selectedTeam.length;
    const remainingSlots = CHALLENGE_CONFIG.TEAM_SIZE - selectedCount;
    
    const embed = new EmbedBuilder()
        .setColor(RARITY_COLORS.legendary)
        .setTitle(`🍈 Select Your Team (${selectedCount}/${CHALLENGE_CONFIG.TEAM_SIZE})`)
        .setDescription(`Choose ${remainingSlots} more Devil Fruit${remainingSlots !== 1 ? 's' : ''} for your team!`)
        .setFooter({ text: `Page ${userData.currentPage + 1} • Use buttons to navigate and select` })
        .setTimestamp();
    
    // Show current selections
    if (userData.selectedTeam.length > 0) {
        const selectedText = userData.selectedTeam
            .map((fruit, index) => `${index + 1}. ${fruit.emoji} **${fruit.name}** (${fruit.totalCP} CP)`)
            .join('\n');
        
        embed.addFields({
            name: '✅ Selected Team',
            value: selectedText,
            inline: false
        });
    }
    
    // Show available fruits for current page
    const startIndex = userData.currentPage * CHALLENGE_CONFIG.FRUITS_PER_PAGE;
    const endIndex = startIndex + CHALLENGE_CONFIG.FRUITS_PER_PAGE;
    const pageFruits = userData.fruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0) {
        const availableText = pageFruits
            .map((fruit, index) => {
                const globalIndex = startIndex + index;
                const isSelected = userData.selectedTeam.some(s => s.id === fruit.id);
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

/**
 * Create selection components (shared function)
 */
function createSelectionComponents(selectionId, userData, role) {
    const components = [];
    
    // Navigation buttons
    const navRow = new ActionRowBuilder();
    
    if (userData.currentPage > 0) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`select_prev_${selectionId}_${role}`)
                .setLabel('⬅️ Previous')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    const totalPages = Math.ceil(userData.fruits.length / CHALLENGE_CONFIG.FRUITS_PER_PAGE);
    if (userData.currentPage < totalPages - 1) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`select_next_${selectionId}_${role}`)
                .setLabel('➡️ Next')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    if (navRow.components.length > 0) {
        components.push(navRow);
    }
    
    // Fruit selection dropdown
    const startIndex = userData.currentPage * CHALLENGE_CONFIG.FRUITS_PER_PAGE;
    const endIndex = startIndex + CHALLENGE_CONFIG.FRUITS_PER_PAGE;
    const pageFruits = userData.fruits.slice(startIndex, endIndex);
    
    if (pageFruits.length > 0) {
        const options = pageFruits.map((fruit, index) => {
            const globalIndex = startIndex + index;
            const isSelected = userData.selectedTeam.some(s => s.id === fruit.id);
            
            return {
                label: `${fruit.name} (${fruit.totalCP} CP)`.substring(0, 100),
                description: `${fruit.rarity} • ${fruit.type}`.substring(0, 100),
                value: `fruit_${globalIndex}`,
                emoji: fruit.emoji,
                default: isSelected
            };
        });
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select_fruit_${selectionId}_${role}`)
            .setPlaceholder('Select a Devil Fruit for your team...')
            .setMinValues(0)
            .setMaxValues(Math.min(options.length, CHALLENGE_CONFIG.TEAM_SIZE - userData.selectedTeam.length))
            .addOptions(options);
        
        components.push(new ActionRowBuilder().addComponents(selectMenu));
    }
    
    // Action buttons
    const actionRow = new ActionRowBuilder();
    
    if (userData.selectedTeam.length > 0) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`clear_selection_${selectionId}_${role}`)
                .setLabel('🗑️ Clear All')
                .setStyle(ButtonStyle.Danger)
        );
    }
    
    if (userData.selectedTeam.length === CHALLENGE_CONFIG.TEAM_SIZE) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_team_${selectionId}_${role}`)
                .setLabel('✅ Confirm Team')
                .setStyle(ButtonStyle.Success)
        );
    }
    
    if (actionRow.components.length > 0) {
        components.push(actionRow);
    }
    
    return components;
}

/**
 * Generate unique battle ID
 */
function generateBattleId() {
    return `battle_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Export the active maps so the command can access them
module.exports.activeSelections = activeSelections;
module.exports.activeBattles = activeBattles;
