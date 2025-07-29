// src/commands/slash/pvp/pvp-raid-history.js - PvP Raid History with Pagination
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../../../database/DatabaseManager');
const { RARITY_COLORS, RARITY_EMOJIS } = require('../../../data/Constants');

// Configuration
const HISTORY_CONFIG = {
    RAIDS_PER_PAGE: 5,
    MAX_RAIDS: 100,
    PAGE_TIMEOUT: 300000 // 5 minutes
};

// Active history sessions
const activeHistorySessions = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid-history')
        .setDescription('📜 View the last 100 PvP raids with details and drops!')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('View raids for a specific user (leave empty for server history)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('filter')
                .setDescription('Filter raids by type')
                .setRequired(false)
                .addChoices(
                    { name: 'All Raids', value: 'all' },
                    { name: 'Victories Only', value: 'victories' },
                    { name: 'Defeats Only', value: 'defeats' },
                    { name: 'With Drops', value: 'drops' }
                )
        ),
    
    category: 'pvp',
    cooldown: 3,
    
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const targetUser = interaction.options.getUser('user');
            const filter = interaction.options.getString('filter') || 'all';
            const requesterId = interaction.user.id;
            
            // Get raid history
            const raidHistory = await getRaidHistory(targetUser?.id, filter);
            
            if (!raidHistory || raidHistory.length === 0) {
                return interaction.editReply({
                    embeds: [createNoRaidsEmbed(targetUser, filter)]
                });
            }
            
            // Create session
            const sessionId = generateSessionId();
            activeHistorySessions.set(sessionId, {
                requesterId,
                targetUserId: targetUser?.id,
                filter,
                raids: raidHistory,
                currentPage: 0,
                totalPages: Math.ceil(raidHistory.length / HISTORY_CONFIG.RAIDS_PER_PAGE),
                createdAt: Date.now()
            });
            
            // Show first page
            await showHistoryPage(interaction, sessionId, 0);
            
            // Setup collector
            setupHistoryCollector(interaction, sessionId);
            
        } catch (error) {
            interaction.client.logger.error('PvP Raid History error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Error')
                .setDescription('Failed to load raid history. Please try again.')
                .setTimestamp();
            
            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};

/**
 * Get raid history from database
 */
async function getRaidHistory(userId = null, filter = 'all') {
    try {
        let query = `
            SELECT 
                rh.*,
                attacker.username as attacker_name,
                defender.username as defender_name
            FROM raid_history rh
            LEFT JOIN users attacker ON rh.attacker_id = attacker.user_id
            LEFT JOIN users defender ON rh.defender_id = defender.user_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        // Filter by user
        if (userId) {
            query += ` AND (rh.attacker_id = $${paramIndex} OR rh.defender_id = $${paramIndex})`;
            params.push(userId);
            paramIndex++;
        }
        
        // Filter by result
        if (filter === 'victories' && userId) {
            query += ` AND rh.winner_id = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        } else if (filter === 'defeats' && userId) {
            query += ` AND rh.winner_id != $${paramIndex} AND rh.winner_id IS NOT NULL`;
            params.push(userId);
            paramIndex++;
        } else if (filter === 'drops') {
            query += ` AND (rh.berries_stolen > 0 OR rh.fruits_stolen IS NOT NULL)`;
        }
        
        query += ` ORDER BY rh.ended_at DESC LIMIT $${paramIndex}`;
        params.push(HISTORY_CONFIG.MAX_RAIDS);
        
        const result = await DatabaseManager.query(query, params);
        return result.rows;
        
    } catch (error) {
        console.error('Error getting raid history:', error);
        
        // If table doesn't exist, create it and return empty array
        if (error.code === '42P01') {
            await createRaidHistoryTable();
            return [];
        }
        
        throw error;
    }
}

/**
 * Create raid history table if it doesn't exist
 */
async function createRaidHistoryTable() {
    try {
        await DatabaseManager.query(`
            CREATE TABLE IF NOT EXISTS raid_history (
                id SERIAL PRIMARY KEY,
                attacker_id TEXT NOT NULL,
                defender_id TEXT NOT NULL,
                winner_id TEXT,
                battle_duration INTEGER DEFAULT 0,
                total_turns INTEGER DEFAULT 0,
                berries_stolen BIGINT DEFAULT 0,
                fruits_stolen JSONB DEFAULT '[]'::jsonb,
                battle_log JSONB DEFAULT '[]'::jsonb,
                started_at TIMESTAMP DEFAULT NOW(),
                ended_at TIMESTAMP DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_raid_history_attacker ON raid_history(attacker_id);
            CREATE INDEX IF NOT EXISTS idx_raid_history_defender ON raid_history(defender_id);
            CREATE INDEX IF NOT EXISTS idx_raid_history_ended_at ON raid_history(ended_at);
        `);
    } catch (error) {
        console.error('Error creating raid history table:', error);
    }
}

/**
 * Show specific page of raid history
 */
async function showHistoryPage(interaction, sessionId, pageNumber) {
    const session = activeHistorySessions.get(sessionId);
    if (!session) return;
    
    session.currentPage = pageNumber;
    
    const startIndex = pageNumber * HISTORY_CONFIG.RAIDS_PER_PAGE;
    const endIndex = startIndex + HISTORY_CONFIG.RAIDS_PER_PAGE;
    const pageRaids = session.raids.slice(startIndex, endIndex);
    
    const embed = createHistoryEmbed(session, pageRaids, pageNumber);
    const components = createHistoryComponents(sessionId, session);
    
    await interaction.editReply({
        embeds: [embed],
        components
    });
}

/**
 * Create history embed for current page
 */
function createHistoryEmbed(session, raids, pageNumber) {
    const { targetUserId, filter, totalPages } = session;
    
    const embed = new EmbedBuilder()
        .setColor(RARITY_COLORS.legendary)
        .setTitle('📜 PvP Raid History')
        .setFooter({ 
            text: `Page ${pageNumber + 1}/${totalPages} • ${session.raids.length} total raids • Filter: ${filter}` 
        })
        .setTimestamp();
    
    if (targetUserId) {
        embed.setDescription(`Showing raids for <@${targetUserId}>`);
    } else {
        embed.setDescription('Showing server raid history');
    }
    
    if (raids.length === 0) {
        embed.addFields({
            name: '📭 No Raids Found',
            value: 'No raids match your criteria.',
            inline: false
        });
        return embed;
    }
    
    // Add each raid as a field
    raids.forEach((raid, index) => {
        const raidNumber = pageNumber * HISTORY_CONFIG.RAIDS_PER_PAGE + index + 1;
        const raidInfo = formatRaidInfo(raid, targetUserId);
        
        embed.addFields({
            name: `🏴‍☠️ Raid #${raidNumber} - ${raidInfo.title}`,
            value: raidInfo.description,
            inline: false
        });
    });
    
    return embed;
}

/**
 * Format individual raid information
 */
function formatRaidInfo(raid, targetUserId = null) {
    const attackerName = raid.attacker_name || 'Unknown';
    const defenderName = raid.defender_name || 'Unknown';
    const winnerId = raid.winner_id;
    const endTime = new Date(raid.ended_at);
    
    // Determine result
    let resultIcon = '⚔️';
    let resultText = 'Battle';
    
    if (winnerId === raid.attacker_id) {
        resultIcon = '🏆';
        resultText = `${attackerName} Victory`;
    } else if (winnerId === raid.defender_id) {
        resultIcon = '🛡️';
        resultText = `${defenderName} Victory`;
    } else {
        resultIcon = '🤝';
        resultText = 'Draw';
    }
    
    // Build description
    let description = `**${attackerName}** vs **${defenderName}**\n`;
    description += `${resultIcon} **Result:** ${resultText}\n`;
    description += `⏰ **Date:** <t:${Math.floor(endTime.getTime() / 1000)}:R>\n`;
    
    if (raid.total_turns) {
        description += `🔄 **Turns:** ${raid.total_turns}\n`;
    }
    
    if (raid.battle_duration) {
        const minutes = Math.floor(raid.battle_duration / 60);
        const seconds = raid.battle_duration % 60;
        description += `⌛ **Duration:** ${minutes}m ${seconds}s\n`;
    }
    
    // Add rewards section
    const rewards = [];
    
    if (raid.berries_stolen > 0) {
        rewards.push(`💰 ${raid.berries_stolen.toLocaleString()} berries`);
    }
    
    if (raid.fruits_stolen && Array.isArray(raid.fruits_stolen) && raid.fruits_stolen.length > 0) {
        const fruitList = raid.fruits_stolen.map(fruit => {
            const emoji = RARITY_EMOJIS[fruit.rarity] || '🍈';
            return `${emoji} ${fruit.name}`;
        }).join(', ');
        rewards.push(`🍈 **Fruits:** ${fruitList}`);
    }
    
    if (rewards.length > 0) {
        description += `\n🎁 **Rewards:** ${rewards.join(' • ')}`;
    } else {
        description += `\n🎁 **Rewards:** None`;
    }
    
    return {
        title: `${attackerName} vs ${defenderName}`,
        description
    };
}

/**
 * Create navigation components
 */
function createHistoryComponents(sessionId, session) {
    const components = [];
    const { currentPage, totalPages } = session;
    
    const navRow = new ActionRowBuilder();
    
    // First page button
    if (currentPage > 0) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`history_first_${sessionId}`)
                .setLabel('⏮️ First')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0)
        );
    }
    
    // Previous page button
    if (currentPage > 0) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`history_prev_${sessionId}`)
                .setLabel('⬅️ Previous')
                .setStyle(ButtonStyle.Primary)
        );
    }
    
    // Page indicator
    navRow.addComponents(
        new ButtonBuilder()
            .setCustomId(`history_page_${sessionId}`)
            .setLabel(`${currentPage + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
    );
    
    // Next page button
    if (currentPage < totalPages - 1) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`history_next_${sessionId}`)
                .setLabel('➡️ Next')
                .setStyle(ButtonStyle.Primary)
        );
    }
    
    // Last page button
    if (currentPage < totalPages - 1) {
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`history_last_${sessionId}`)
                .setLabel('⏭️ Last')
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    components.push(navRow);
    
    // Refresh button
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`history_refresh_${sessionId}`)
                .setLabel('🔄 Refresh')
                .setStyle(ButtonStyle.Success)
        );
    
    components.push(actionRow);
    
    return components;
}

/**
 * Setup collector for navigation
 */
function setupHistoryCollector(interaction, sessionId) {
    const filter = (i) => {
        const session = activeHistorySessions.get(sessionId);
        return session && i.user.id === session.requesterId;
    };
    
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: HISTORY_CONFIG.PAGE_TIMEOUT
    });
    
    collector.on('collect', async (componentInteraction) => {
        try {
            const session = activeHistorySessions.get(sessionId);
            if (!session) {
                return componentInteraction.reply({
                    content: '❌ History session expired!',
                    ephemeral: true
                });
            }
            
            const customId = componentInteraction.customId;
            
            if (customId.startsWith('history_first_')) {
                await componentInteraction.deferUpdate();
                await showHistoryPage(interaction, sessionId, 0);
            } else if (customId.startsWith('history_prev_')) {
                await componentInteraction.deferUpdate();
                const newPage = Math.max(0, session.currentPage - 1);
                await showHistoryPage(interaction, sessionId, newPage);
            } else if (customId.startsWith('history_next_')) {
                await componentInteraction.deferUpdate();
                const newPage = Math.min(session.totalPages - 1, session.currentPage + 1);
                await showHistoryPage(interaction, sessionId, newPage);
            } else if (customId.startsWith('history_last_')) {
                await componentInteraction.deferUpdate();
                await showHistoryPage(interaction, sessionId, session.totalPages - 1);
            } else if (customId.startsWith('history_refresh_')) {
                await componentInteraction.deferUpdate();
                
                // Reload raid history
                const newHistory = await getRaidHistory(session.targetUserId, session.filter);
                session.raids = newHistory;
                session.totalPages = Math.ceil(newHistory.length / HISTORY_CONFIG.RAIDS_PER_PAGE);
                session.currentPage = Math.min(session.currentPage, session.totalPages - 1);
                
                await showHistoryPage(interaction, sessionId, session.currentPage);
            }
            
        } catch (error) {
            console.error('History collector error:', error);
            await componentInteraction.reply({
                content: '❌ An error occurred!',
                ephemeral: true
            });
        }
    });
    
    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            interaction.editReply({
                components: []
            }).catch(() => {});
        }
        activeHistorySessions.delete(sessionId);
    });
}

/**
 * Create embed for no raids found
 */
function createNoRaidsEmbed(targetUser, filter) {
    const embed = new EmbedBuilder()
        .setColor(RARITY_COLORS.uncommon)
        .setTitle('📭 No Raids Found')
        .setTimestamp();
    
    if (targetUser) {
        embed.setDescription(`No raids found for ${targetUser.username} with filter: ${filter}`);
    } else {
        embed.setDescription(`No raids found in server history with filter: ${filter}`);
    }
    
    embed.addFields({
        name: '💡 Tips',
        value: [
            '• Try changing the filter option',
            '• Check if the user has participated in any raids',
            '• Server raid history may be limited to recent raids'
        ].join('\n'),
        inline: false
    });
    
    return embed;
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
    return `history_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Record a raid in history (to be called from pvp-raid.js)
 */
async function recordRaidInHistory(raidData) {
    try {
        const {
            attackerId,
            defenderId,
            winnerId,
            battleDuration,
            totalTurns,
            berriesStolen,
            fruitsStolen,
            battleLog,
            startTime,
            endTime
        } = raidData;
        
        await DatabaseManager.query(`
            INSERT INTO raid_history (
                attacker_id, defender_id, winner_id, battle_duration, 
                total_turns, berries_stolen, fruits_stolen, battle_log,
                started_at, ended_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            attackerId,
            defenderId,
            winnerId,
            battleDuration || 0,
            totalTurns || 0,
            berriesStolen || 0,
            JSON.stringify(fruitsStolen || []),
            JSON.stringify(battleLog || []),
            new Date(startTime),
            new Date(endTime || Date.now())
        ]);
        
    } catch (error) {
        console.error('Error recording raid in history:', error);
    }
}

// Export the record function for use in pvp-raid.js
module.exports.recordRaidInHistory = recordRaidInHistory;
