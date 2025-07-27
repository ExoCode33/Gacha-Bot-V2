// src/events/client/pvp-interactions.js - Complete PvP Interaction Handler
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const PvPService = require('../../services/PvPService');
const DatabaseManager = require('../../database/DatabaseManager');
const { RARITY_COLORS, FRUIT_WEIGHTS } = require('../../data/Constants');

/**
 * Handle all PvP-related interactions
 */
async function handlePvPInteraction(interaction) {
    const customId = interaction.customId;
    
    if (customId.startsWith('pvp_accept_')) {
        await handleChallengeAccept(interaction);
    } else if (customId.startsWith('pvp_decline_')) {
        await handleChallengeDecline(interaction);
    } else if (customId.startsWith('pvp_preview_')) {
        await handleBattlePreview(interaction);
    } else if (customId.startsWith('pvp_team_select_')) {
        await handleTeamSelection(interaction);
    } else if (customId.startsWith('pvp_team_ready_')) {
        await handleTeamReady(interaction);
    } else if (customId.startsWith('pvp_team_clear_')) {
        await handleTeamClear(interaction);
    } else if (customId.startsWith('battle_action_')) {
        await handleBattleAction(interaction);
    } else if (customId.startsWith('forfeit_confirm_')) {
        await handleForfeitConfirm(interaction);
    } else if (customId.startsWith('forfeit_cancel_')) {
        await handleForfeitCancel(interaction);
    }
}

/**
 * Handle challenge acceptance
 */
async function handleChallengeAccept(interaction) {
    try {
        const [, , challengerId, opponentId, battleType] = interaction.customId.split('_');
        
        // Verify the person accepting is the challenged player
        if (interaction.user.id !== opponentId) {
            return await interaction.reply({
                content: '❌ Only the challenged player can accept this battle!',
                ephemeral: true
            });
        }
        
        // Check if either player is already in battle
        if (PvPService.isUserInBattle(challengerId) || PvPService.isUserInBattle(opponentId)) {
            return await interaction.reply({
                content: '❌ One of the players is already in an active battle!',
                ephemeral: true
            });
        }
        
        await interaction.deferReply();
        
        // Start team selection phase
        await startTeamSelectionPhase(interaction, challengerId, opponentId, battleType);
        
    } catch (error) {
        console.error('Challenge accept error:', error);
        await interaction.followUp({
            content: '❌ An error occurred while accepting the challenge.',
            ephemeral: true
        });
    }
}

/**
 * Handle challenge decline
 */
async function handleChallengeDecline(interaction) {
    try {
        const [, , challengerId, opponentId, battleType] = interaction.customId.split('_');
        
        // Verify the person declining is the challenged player
        if (interaction.user.id !== opponentId) {
            return await interaction.reply({
                content: '❌ Only the challenged player can decline this battle!',
                ephemeral: true
            });
        }
        
        // Get usernames
        const challenger = await interaction.client.users.fetch(challengerId);
        const opponent = await interaction.client.users.fetch(opponentId);
        
        // Create decline embed
        const declineEmbed = new EmbedBuilder()
            .setTitle('❌ Challenge Declined')
            .setColor('#FF6B6B')
            .setDescription(`**${opponent.username}** has declined the challenge from **${challenger.username}**.`)
            .setFooter({ text: 'Maybe next time!' })
            .setTimestamp();
        
        // Disable all buttons
        const disabledRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('declined')
                    .setLabel('❌ Challenge Declined')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        
        await interaction.update({
            content: `Challenge declined by ${opponent.username}.`,
            embeds: [declineEmbed],
            components: [disabledRow]
        });
        
    } catch (error) {
        console.error('Challenge decline error:', error);
        await interaction.reply({
            content: '❌ An error occurred while declining the challenge.',
            ephemeral: true
        });
    }
}

/**
 * Handle battle preview
 */
async function handleBattlePreview(interaction) {
    try {
        const [, , challengerId, opponentId] = interaction.customId.split('_');
        
        // Get player data
        const challengerData = await PvPService.getPlayerBattleData(challengerId);
        const opponentData = await PvPService.getPlayerBattleData(opponentId);
        
        if (!challengerData || !opponentData) {
            return await interaction.reply({
                content: '❌ Could not load player data for preview.',
                ephemeral: true
            });
        }
        
        const challenger = await interaction.client.users.fetch(challengerId);
        const opponent = await interaction.client.users.fetch(opponentId);
        
        // Calculate matchup
        const challengerHP = PvPService.calculateMaxHP(challengerData);
        const opponentHP = PvPService.calculateMaxHP(opponentData);
        const cpRatio = challengerData.totalCP / opponentData.totalCP;
        
        let matchupText = '';
        if (cpRatio > 1.2) {
            matchupText = `🔥 **${challenger.username}** has the advantage!`;
        } else if (cpRatio < 0.8) {
            matchupText = `🔥 **${opponent.username}** has the advantage!`;
        } else {
            matchupText = '⚖️ **Evenly matched battle!**';
        }
        
        const previewEmbed = new EmbedBuilder()
            .setTitle('👁️ Battle Preview Analysis')
            .setColor(RARITY_COLORS.epic)
            .setDescription(matchupText)
            .addFields(
                {
                    name: `⚔️ ${challenger.username}`,
                    value: [
                        `**Estimated HP:** ${challengerHP.toLocaleString()}`,
                        `**Total CP:** ${challengerData.totalCP.toLocaleString()}`,
                        `**Rank:** ${challengerData.rank}`,
                        `**Main Fruit:** ${challengerData.selectedFruit.fruit_name}`,
                        `**Skill:** ${challengerData.selectedFruit.skill?.name || 'Unknown'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `🛡️ ${opponent.username}`,
                    value: [
                        `**Estimated HP:** ${opponentHP.toLocaleString()}`,
                        `**Total CP:** ${opponentData.totalCP.toLocaleString()}`,
                        `**Rank:** ${opponentData.rank}`,
                        `**Main Fruit:** ${opponentData.selectedFruit.fruit_name}`,
                        `**Skill:** ${opponentData.selectedFruit.skill?.name || 'Unknown'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📊 Matchup Analysis',
                    value: [
                        `**CP Ratio:** ${cpRatio.toFixed(2)}:1`,
                        `**Estimated Battle Length:** ${estimateBattleLength(challengerHP, opponentHP)} turns`,
                        `**Power Level:** ${getPowerLevel(Math.max(challengerData.totalCP, opponentData.totalCP))}`
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({ text: 'This is an estimate - actual battle results may vary!' })
            .setTimestamp();
        
        await interaction.reply({
            embeds: [previewEmbed],
            ephemeral: true
        });
        
    } catch (error) {
        console.error('Battle preview error:', error);
        await interaction.reply({
            content: '❌ An error occurred while generating the battle preview.',
            ephemeral: true
        });
    }
}

/**
 * Start team selection phase
 */
async function startTeamSelectionPhase(interaction, challengerId, opponentId, battleType) {
    try {
        // Get player fruits
        const challengerFruits = await DatabaseManager.getUserDevilFruits(challengerId);
        const opponentFruits = await DatabaseManager.getUserDevilFruits(opponentId);
        
        const challenger = await interaction.client.users.fetch(challengerId);
        const opponent = await interaction.client.users.fetch(opponentId);
        
        // Create team selection embed
        const teamSelectionEmbed = new EmbedBuilder()
            .setTitle('🔧 Team Selection Phase')
            .setColor(RARITY_COLORS.mythical)
            .setDescription(`**Battle Type:** ${battleType.charAt(0).toUpperCase() + battleType.slice(1)}\n\n` +
                           `Both players must select their team of Devil Fruits!\n\n` +
                           `📝 **Team Building Rules:**\n` +
                           `• Maximum team weight: 20 points\n` +
                           `• Divine fruits = 10 weight\n` +
                           `• Mythical fruits = 8 weight\n` +
                           `• Legendary fruits = 6 weight\n` +
                           `• Epic fruits = 4 weight\n` +
                           `• Rare fruits = 3 weight\n` +
                           `• Uncommon fruits = 2 weight\n` +
                           `• Common fruits = 1 weight`)
            .addFields(
                {
                    name: `👤 ${challenger.username}`,
                    value: `**Status:** Selecting team...\n**Available Fruits:** ${challengerFruits.length}\n**Team Weight:** 0/20`,
                    inline: true
                },
                {
                    name: `🎯 ${opponent.username}`,
                    value: `**Status:** Selecting team...\n**Available Fruits:** ${opponentFruits.length}\n**Team Weight:** 0/20`,
                    inline: true
                },
                {
                    name: '⏰ Time Limit',
                    value: 'Players have 5 minutes to build their teams',
                    inline: true
                }
            )
            .setFooter({ text: 'Use the buttons below to select your team!' });
        
        // Create selection buttons
        const selectionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_team_select_${challengerId}`)
                    .setLabel(`🔧 ${challenger.username} - Select Team`)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`pvp_team_select_${opponentId}`)
                    .setLabel(`🔧 ${opponent.username} - Select Team`)
                    .setStyle(ButtonStyle.Primary)
            );
        
        await interaction.editReply({
            content: `⚔️ **Team Selection Phase Started!**\n${challenger} and ${opponent}, select your teams!`,
            embeds: [teamSelectionEmbed],
            components: [selectionRow]
        });
        
        // Store team selection data
        if (!global.pvpTeamSelection) {
            global.pvpTeamSelection = new Map();
        }
        
        const selectionId = `${challengerId}_${opponentId}`;
        global.pvpTeamSelection.set(selectionId, {
            challengerId,
            opponentId,
            battleType,
            teams: {
                [challengerId]: [],
                [opponentId]: []
            },
            ready: {
                [challengerId]: false,
                [opponentId]: false
            },
            startTime: Date.now(),
            messageId: (await interaction.fetchReply()).id,
            channelId: interaction.channelId
        });
        
        // Set timeout for team selection
        setTimeout(async () => {
            await handleTeamSelectionTimeout(interaction, selectionId);
        }, 5 * 60 * 1000); // 5 minutes
        
    } catch (error) {
        console.error('Team selection start error:', error);
        throw error;
    }
}

/**
 * Handle team selection
 */
async function handleTeamSelection(interaction) {
    try {
        const userId = interaction.customId.split('_')[3];
        
        // Verify correct user
        if (interaction.user.id !== userId) {
            return await interaction.reply({
                content: '❌ You can only select your own team!',
                ephemeral: true
            });
        }
        
        // Get user's fruits grouped by rarity
        const userFruits = await DatabaseManager.getUserDevilFruits(userId);
        const fruitsByRarity = groupFruitsByRarity(userFruits);
        
        // Create selection menu
        const selectMenus = [];
        let menuIndex = 0;
        
        for (const [rarity, fruits] of Object.entries(fruitsByRarity)) {
            if (fruits.length === 0) continue;
            
            const options = fruits.slice(0, 25).map(fruit => ({
                label: fruit.fruit_name,
                value: `${fruit.id}_${rarity}`,
                description: `${getRarityWeight(rarity)} weight - ${fruit.fruit_type}`,
                emoji: getRarityEmoji(rarity)
            }));
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`pvp_fruit_select_${userId}_${rarity}_${menuIndex}`)
                .setPlaceholder(`Select ${rarity} fruits...`)
                .addOptions(options)
                .setMaxValues(Math.min(options.length, 5));
            
            selectMenus.push(new ActionRowBuilder().addComponents(selectMenu));
            menuIndex++;
            
            if (selectMenus.length >= 4) break; // Discord limit
        }
        
        // Add team management buttons
        const managementRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_team_ready_${userId}`)
                    .setLabel('✅ Ready for Battle')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`pvp_team_clear_${userId}`)
                    .setLabel('🗑️ Clear Team')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        selectMenus.push(managementRow);
        
        // Get current team
        const selectionData = findSelectionData(userId);
        const currentTeam = selectionData?.teams[userId] || [];
        const currentWeight = calculateTeamWeight(currentTeam);
        
        const teamEmbed = new EmbedBuilder()
            .setTitle('🔧 Select Your Battle Team')
            .setColor(RARITY_COLORS.legendary)
            .setDescription(`Choose your Devil Fruits for battle!\n\n**Current Team Weight:** ${currentWeight}/20`)
            .addFields({
                name: '📋 Current Team',
                value: currentTeam.length > 0 ? 
                    currentTeam.map(fruit => `${getRarityEmoji(fruit.rarity)} ${fruit.name} (${getRarityWeight(fruit.rarity)} weight)`).join('\n') :
                    'No fruits selected',
                inline: false
            })
            .setFooter({ text: 'Select fruits from the dropdowns below. Maximum weight: 20 points.' });
        
        await interaction.reply({
            embeds: [teamEmbed],
            components: selectMenus,
            ephemeral: true
        });
        
    } catch (error) {
        console.error('Team selection error:', error);
        await interaction.reply({
            content: '❌ An error occurred during team selection.',
            ephemeral: true
        });
    }
}

/**
 * Helper functions
 */
function groupFruitsByRarity(fruits) {
    const grouped = {
        divine: [],
        mythical: [],
        legendary: [],
        epic: [],
        rare: [],
        uncommon: [],
        common: []
    };
    
    fruits.forEach(fruit => {
        const rarity = fruit.fruit_rarity || 'common';
        if (grouped[rarity]) {
            grouped[rarity].push(fruit);
        }
    });
    
    return grouped;
}

function getRarityWeight(rarity) {
    const weights = FRUIT_WEIGHTS || {
        common: 1,
        uncommon: 2,
        rare: 3,
        epic: 4,
        legendary: 6,
        mythical: 8,
        divine: 10
    };
    return weights[rarity] || 1;
}

function getRarityEmoji(rarity) {
    const emojis = {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        legendary: '🌟',
        mythical: '🟠',
        divine: '✨'
    };
    return emojis[rarity] || '⚪';
}

function calculateTeamWeight(team) {
    return team.reduce((total, fruit) => total + getRarityWeight(fruit.rarity), 0);
}

function findSelectionData(userId) {
    if (!global.pvpTeamSelection) return null;
    
    for (const [key, data] of global.pvpTeamSelection.entries()) {
        if (data.challengerId === userId || data.opponentId === userId) {
            return data;
        }
    }
    return null;
}

function estimateBattleLength(hp1, hp2) {
    const avgHP = (hp1 + hp2) / 2;
    const avgDamage = 150; // Estimated average damage per turn
    return Math.ceil(avgHP / avgDamage) * 2; // *2 because turns alternate
}

function getPowerLevel(cp) {
    if (cp < 1000) return 'Rookie';
    if (cp < 5000) return 'Veteran';
    if (cp < 15000) return 'Elite';
    if (cp < 50000) return 'Legendary';
    return 'Mythical';
}

async function handleTeamSelectionTimeout(interaction, selectionId) {
    // Implementation for timeout handling
    try {
        const selectionData = global.pvpTeamSelection?.get(selectionId);
        if (!selectionData) return;
        
        // Clean up and notify timeout
        global.pvpTeamSelection.delete(selectionId);
        
        const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏰ Team Selection Timeout')
            .setColor('#FF6B6B')
            .setDescription('Team selection time has expired. The battle has been cancelled.')
            .setFooter({ text: 'Challenge expired after 5 minutes' });
        
        // Try to update the message
        try {
            const channel = await interaction.client.channels.fetch(selectionData.channelId);
            const message = await channel.messages.fetch(selectionData.messageId);
            
            await message.edit({
                content: '⏰ Team selection timed out.',
                embeds: [timeoutEmbed],
                components: []
            });
        } catch (editError) {
            console.error('Could not update timeout message:', editError);
        }
        
    } catch (error) {
        console.error('Team selection timeout error:', error);
    }
}

// Complete implementations for remaining handlers
async function handleTeamReady(interaction) {
    try {
        const userId = interaction.customId.split('_')[3];
        
        if (interaction.user.id !== userId) {
            return await interaction.reply({
                content: '❌ You can only ready your own team!',
                ephemeral: true
            });
        }
        
        const selectionData = findSelectionData(userId);
        if (!selectionData) {
            return await interaction.reply({
                content: '❌ Team selection session not found!',
                ephemeral: true
            });
        }
        
        const team = selectionData.teams[userId];
        const teamWeight = calculateTeamWeight(team);
        
        if (team.length === 0) {
            return await interaction.reply({
                content: '❌ You must select at least one Devil Fruit for your team!',
                ephemeral: true
            });
        }
        
        if (teamWeight > 20) {
            return await interaction.reply({
                content: `❌ Your team weight (${teamWeight}) exceeds the limit of 20 points!`,
                ephemeral: true
            });
        }
        
        // Mark player as ready
        selectionData.ready[userId] = true;
        
        await interaction.reply({
            content: `✅ You are ready for battle! Team weight: ${teamWeight}/20`,
            ephemeral: true
        });
        
        // Check if both players are ready
        const { challengerId, opponentId } = selectionData;
        if (selectionData.ready[challengerId] && selectionData.ready[opponentId]) {
            await startBattle(interaction, selectionData);
        }
        
    } catch (error) {
        console.error('Team ready error:', error);
        await interaction.reply({
            content: '❌ An error occurred while marking ready.',
            ephemeral: true
        });
    }
}

async function handleTeamClear(interaction) {
    try {
        const userId = interaction.customId.split('_')[3];
        
        if (interaction.user.id !== userId) {
            return await interaction.reply({
                content: '❌ You can only clear your own team!',
                ephemeral: true
            });
        }
        
        const selectionData = findSelectionData(userId);
        if (!selectionData) {
            return await interaction.reply({
                content: '❌ Team selection session not found!',
                ephemeral: true
            });
        }
        
        // Clear the team
        selectionData.teams[userId] = [];
        selectionData.ready[userId] = false;
        
        await interaction.reply({
            content: '🗑️ Your team has been cleared! Select new fruits to build your team.',
            ephemeral: true
        });
        
    } catch (error) {
        console.error('Team clear error:', error);
        await interaction.reply({
            content: '❌ An error occurred while clearing team.',
            ephemeral: true
        });
    }
}

async function handleBattleAction(interaction) {
    try {
        const [, action, userId] = interaction.customId.split('_');
        
        if (interaction.user.id !== userId) {
            return await interaction.reply({
                content: '❌ You can only control your own battle actions!',
                ephemeral: true
            });
        }
        
        // Get user's active battle
        const activeBattles = PvPService.getUserActiveBattles(userId);
        if (activeBattles.length === 0) {
            return await interaction.reply({
                content: '❌ You are not in an active battle!',
                ephemeral: true
            });
        }
        
        const battle = activeBattles[0];
        
        if (battle.currentPlayer !== userId) {
            return await interaction.reply({
                content: '❌ It\'s not your turn! Wait for your opponent.',
                ephemeral: true
            });
        }
        
        await interaction.deferReply();
        
        // Execute the battle action
        const actionData = { type: action };
        const result = await PvPService.executeBattleAction(battle.id, userId, actionData);
        
        if (result.ended) {
            await handleBattleEnd(interaction, result.battle, result.winner);
        } else {
            await updateBattleDisplay(interaction, result.battle);
        }
        
    } catch (error) {
        console.error('Battle action error:', error);
        await interaction.followUp({
            content: `❌ Battle action failed: ${error.message}`,
            ephemeral: true
        });
    }
}

async function handleForfeitConfirm(interaction) {
    try {
        const userId = interaction.customId.split('_')[2];
        
        if (interaction.user.id !== userId) {
            return await interaction.reply({
                content: '❌ You can only forfeit your own battles!',
                ephemeral: true
            });
        }
        
        const activeBattles = PvPService.getUserActiveBattles(userId);
        if (activeBattles.length === 0) {
            return await interaction.reply({
                content: '❌ You are not in an active battle!',
                ephemeral: true
            });
        }
        
        const battle = activeBattles[0];
        const opponentId = Object.keys(battle.players).find(id => id !== userId);
        
        // End the battle with opponent as winner
        await PvPService.endBattle(battle.id, opponentId);
        
        const forfeitEmbed = new EmbedBuilder()
            .setTitle('🏃 Battle Forfeited')
            .setColor('#FF6B6B')
            .setDescription(`**${interaction.user.username}** has forfeited the battle!`)
            .addFields({
                name: '🏆 Victory',
                value: `**${battle.players[opponentId].username}** wins by forfeit!`,
                inline: false
            })
            .setFooter({ text: 'Better luck next time!' })
            .setTimestamp();
        
        await interaction.update({
            embeds: [forfeitEmbed],
            components: []
        });
        
    } catch (error) {
        console.error('Forfeit confirm error:', error);
        await interaction.reply({
            content: '❌ An error occurred while forfeiting.',
            ephemeral: true
        });
    }
}

async function handleForfeitCancel(interaction) {
    await interaction.update({
        content: '⚔️ Forfeit cancelled! Continue fighting!',
        components: []
    });
}

/**
 * Start the actual battle after team selection
 */
async function startBattle(interaction, selectionData) {
    try {
        const { challengerId, opponentId, battleType } = selectionData;
        
        // Create the battle
        const battle = await PvPService.createBattle(challengerId, opponentId, battleType);
        
        if (!battle) {
            throw new Error('Failed to create battle');
        }
        
        const challenger = await interaction.client.users.fetch(challengerId);
        const opponent = await interaction.client.users.fetch(opponentId);
        
        // Create battle started embed
        const battleEmbed = new EmbedBuilder()
            .setTitle('⚔️ Battle Started!')
            .setColor(RARITY_COLORS.divine)
            .setDescription(`The epic battle between **${challenger.username}** and **${opponent.username}** has begun!`)
            .addFields(
                {
                    name: `👤 ${challenger.username}`,
                    value: createBattlePlayerStatus(battle.players[challengerId]),
                    inline: true
                },
                {
                    name: '⚔️ Battle Info',
                    value: [
                        `**Type:** ${battleType.charAt(0).toUpperCase() + battleType.slice(1)}`,
                        `**Turn:** ${battle.turn}`,
                        `**Current Player:** ${battle.currentPlayer === challengerId ? challenger.username : opponent.username}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `🎯 ${opponent.username}`,
                    value: createBattlePlayerStatus(battle.players[opponentId]),
                    inline: true
                }
            )
            .setFooter({ text: 'Use /pvp-battle to take actions in your turn!' })
            .setTimestamp();
        
        // Update the original message
        try {
            const channel = await interaction.client.channels.fetch(selectionData.channelId);
            const message = await channel.messages.fetch(selectionData.messageId);
            
            await message.edit({
                content: `⚔️ **Battle Started!** ${challenger} vs ${opponent}`,
                embeds: [battleEmbed],
                components: []
            });
        } catch (editError) {
            console.error('Could not update battle start message:', editError);
        }
        
        // Clean up team selection data
        const selectionId = `${challengerId}_${opponentId}`;
        global.pvpTeamSelection?.delete(selectionId);
        
        // Notify current player
        const currentPlayer = battle.currentPlayer === challengerId ? challenger : opponent;
        
        try {
            await currentPlayer.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('⚔️ Your Turn!')
                        .setColor(RARITY_COLORS.legendary)
                        .setDescription(`It's your turn in the battle against **${battle.currentPlayer === challengerId ? opponent.username : challenger.username}**!\n\nUse \`/pvp-battle action:attack\` to take your turn.`)
                        .setFooter({ text: 'The battle awaits your decision!' })
                ]
            });
        } catch (dmError) {
            // Ignore DM errors
            console.log('Could not send DM to current player');
        }
        
    } catch (error) {
        console.error('Start battle error:', error);
        
        // Notify of error
        try {
            const channel = await interaction.client.channels.fetch(selectionData.channelId);
            await channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Battle Start Failed')
                        .setColor('#FF6B6B')
                        .setDescription('An error occurred while starting the battle. Please try challenging again.')
                        .setFooter({ text: 'Team selections have been cleared.' })
                ]
            });
        } catch (notifyError) {
            console.error('Could not notify of battle start error:', notifyError);
        }
        
        // Clean up
        const selectionId = `${selectionData.challengerId}_${selectionData.opponentId}`;
        global.pvpTeamSelection?.delete(selectionId);
    }
}

/**
 * Handle battle end
 */
async function handleBattleEnd(interaction, battle, winnerId) {
    const winnerPlayer = battle.players[winnerId];
    const loserPlayer = Object.values(battle.players).find(p => p.userId !== winnerId);
    
    const battleEndEmbed = new EmbedBuilder()
        .setTitle('🏆 Battle Concluded!')
        .setColor(winnerId ? RARITY_COLORS.legendary : RARITY_COLORS.epic)
        .setDescription(
            winnerId 
                ? `🎉 **${winnerPlayer.username}** emerges victorious!\n\nThe battle was intense, but ${winnerPlayer.username} proved stronger!`
                : `🤝 **The battle ends in a draw!**\n\nBoth pirates fought valiantly!`
        )
        .addFields(
            {
                name: '📊 Final Stats',
                value: createFinalBattleStats(battle),
                inline: false
            },
            {
                name: '📋 Battle Summary',
                value: getBattleSummary(battle),
                inline: false
            }
        )
        .setFooter({ text: 'Thanks for the epic battle! Use /pvp-challenge to fight again.' })
        .setTimestamp();
    
    await interaction.editReply({
        embeds: [battleEndEmbed],
        components: []
    });
}

/**
 * Update battle display
 */
async function updateBattleDisplay(interaction, battle) {
    const userId = interaction.user.id;
    const opponentId = Object.keys(battle.players).find(id => id !== userId);
    const player = battle.players[userId];
    const opponent = battle.players[opponentId];
    const isCurrentTurn = battle.currentPlayer === userId;
    
    const battleUpdateEmbed = new EmbedBuilder()
        .setTitle(`⚔️ Battle Update - Turn ${battle.turn}`)
        .setColor(isCurrentTurn ? RARITY_COLORS.legendary : RARITY_COLORS.epic)
        .addFields(
            {
                name: `👤 ${player.username} (You)`,
                value: createBattlePlayerStatus(player),
                inline: true
            },
            {
                name: `🎯 ${opponent.username}`,
                value: createBattlePlayerStatus(opponent),
                inline: true
            },
            {
                name: '📋 Latest Action',
                value: getLatestBattleAction(battle),
                inline: false
            }
        )
        .setFooter({ 
            text: isCurrentTurn ? 'Your turn! Use /pvp-battle to take an action.' : `Waiting for ${opponent.username}'s turn...` 
        })
        .setTimestamp();
    
    await interaction.editReply({
        embeds: [battleUpdateEmbed]
    });
}

/**
 * Helper functions for battle display
 */
function createBattlePlayerStatus(player) {
    const hpPercent = Math.round((player.hp / player.maxHp) * 100);
    const statusEffects = player.statusEffects || [];
    
    let status = `**HP:** ${player.hp}/${player.maxHp} (${hpPercent}%)\n`;
    status += `**Fruit:** ${player.selectedFruit?.fruit_name || 'None'}\n`;
    status += `**Rank:** ${player.rank}`;
    
    if (statusEffects.length > 0) {
        const effects = statusEffects
            .slice(0, 2)
            .map(effect => `${effect.icon || '🔸'} ${effect.name}`)
            .join(' ');
        status += `\n**Effects:** ${effects}`;
    }
    
    return status;
}

function createFinalBattleStats(battle) {
    const players = Object.values(battle.players);
    const duration = Math.round((Date.now() - battle.startTime) / 1000);
    
    return players.map(player => {
        const hpPercent = Math.round((player.hp / player.maxHp) * 100);
        return `**${player.username}:** ${player.hp}/${player.maxHp} HP (${hpPercent}%)`;
    }).join('\n') + `\n\n**Duration:** ${duration} seconds\n**Total Turns:** ${battle.turn}`;
}

function getBattleSummary(battle) {
    const actionCounts = {};
    
    battle.log.forEach(entry => {
        if (entry.action) {
            actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
        }
    });
    
    const summary = Object.entries(actionCounts)
        .map(([action, count]) => `${action}: ${count}`)
        .join(', ');
    
    return summary || 'An epic battle was fought!';
}

function getLatestBattleAction(battle) {
    if (!battle.log || battle.log.length === 0) {
        return 'Battle continues...';
    }
    
    const latest = battle.log[battle.log.length - 1];
    return `${latest.icon || '⚔️'} ${latest.message}`;
}

// Export the main handler
module.exports = { handlePvPInteraction };
