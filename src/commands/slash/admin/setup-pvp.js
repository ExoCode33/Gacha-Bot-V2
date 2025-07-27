// src/commands/slash/admin/setup-pvp.js - PvP Setup Command (Admin Only)
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pvpDatabaseSetup = require('../../../database/setupPvPTables');
const { RARITY_COLORS } = require('../../../data/Constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-pvp')
        .setDescription('🔧 Setup PvP database tables (Admin Only)')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Setup action to perform')
                .setRequired(false)
                .addChoices(
                    { name: '🔧 Setup Tables', value: 'setup' },
                    { name: '📊 Check Status', value: 'status' },
                    { name: '👥 Create User Stats', value: 'create_stats' },
                    { name: '⚠️ Reset All Tables', value: 'reset' }
                )
        ),
    
    category: 'admin',
    adminOnly: true,
    cooldown: 10,
    
    async execute(interaction) {
        const action = interaction.options.getString('action') || 'status';
        
        try {
            await interaction.deferReply({ ephemeral: true });
            
            switch (action) {
                case 'setup':
                    await this.handleSetup(interaction);
                    break;
                case 'status':
                    await this.handleStatus(interaction);
                    break;
                case 'create_stats':
                    await this.handleCreateStats(interaction);
                    break;
                case 'reset':
                    await this.handleReset(interaction);
                    break;
                default:
                    await this.handleStatus(interaction);
            }
            
        } catch (error) {
            interaction.client.logger.error('PvP setup command error:', error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle('❌ Setup Error')
                        .setDescription(`An error occurred during PvP setup: ${error.message}`)
                        .setFooter({ text: 'Check logs for more details' })
                ]
            });
        }
    },
    
    async handleSetup(interaction) {
        const setupEmbed = new EmbedBuilder()
            .setTitle('🔧 Setting up PvP System...')
            .setColor(RARITY_COLORS.legendary)
            .setDescription('Creating database tables and initial data...')
            .setTimestamp();
        
        await interaction.editReply({ embeds: [setupEmbed] });
        
        // Perform setup
        const success = await pvpDatabaseSetup.setupPvPDatabase();
        
        if (success) {
            // Create stats for existing users
            await pvpDatabaseSetup.createStatsForExistingUsers();
            
            // Get final status
            const status = await pvpDatabaseSetup.getPvPDatabaseStatus();
            
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ PvP Setup Complete!')
                .setColor(RARITY_COLORS.divine)
                .setDescription('The PvP system has been successfully initialized!')
                .addFields(
                    {
                        name: '📊 Database Status',
                        value: [
                            `**Tables Created:** ${status.tablesExisting}/${status.tablesTotal}`,
                            `**User Stats:** ${status.userStatsCount} players ready`,
                            `**Seasons:** ${status.seasonsCount} season(s) created`,
                            `**Status:** ${status.status}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🎮 Available Commands',
                        value: [
                            '`/pvp-challenge @user` - Challenge someone to battle',
                            '`/pvp-battle action:view` - View your active battle',
                            '`/pvp-battle action:attack` - Attack in battle',
                            '`/pvp-battle action:skill` - Use Devil Fruit skill',
                            '`/pvp-battle action:defend` - Defend and recover HP'
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({ text: 'PvP system is now ready for epic battles!' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [successEmbed] });
            
        } else {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ PvP Setup Failed')
                .setColor('#FF6B6B')
                .setDescription('There was an error setting up the PvP system. Check the logs for details.')
                .setFooter({ text: 'Try running the setup again or contact support' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
    
    async handleStatus(interaction) {
        const status = await pvpDatabaseSetup.getPvPDatabaseStatus();
        
        const statusColor = status.tablesReady ? RARITY_COLORS.divine : '#FF6B6B';
        const statusIcon = status.tablesReady ? '✅' : '❌';
        const statusText = status.tablesReady ? 'Ready' : 'Incomplete';
        
        const statusEmbed = new EmbedBuilder()
            .setTitle(`${statusIcon} PvP System Status`)
            .setColor(statusColor)
            .setDescription(`**Overall Status:** ${statusText}`)
            .addFields(
                {
                    name: '📊 Database Tables',
                    value: [
                        `**Tables Ready:** ${status.tablesExisting}/${status.tablesTotal}`,
                        `**Status:** ${status.status}`,
                        status.missingTables?.length > 0 ? `**Missing:** ${status.missingTables.join(', ')}` : ''
                    ].filter(Boolean).join('\n'),
                    inline: true
                },
                {
                    name: '📈 Statistics',
                    value: [
                        `**Players with PvP Stats:** ${status.userStatsCount || 0}`,
                        `**Active Battles:** ${status.activeBattlesCount || 0}`,
                        `**Seasons Created:** ${status.seasonsCount || 0}`
                    ].join('\n'),
                    inline: true
                }
            )
            .setFooter({ 
                text: status.tablesReady ? 
                    'PvP system is operational!' : 
                    'Run /setup-pvp action:setup to initialize the system'
            })
            .setTimestamp();
        
        if (status.error) {
            statusEmbed.addFields({
                name: '❌ Error Details',
                value: status.error,
                inline: false
            });
        }
        
        await interaction.editReply({ embeds: [statusEmbed] });
    },
    
    async handleCreateStats(interaction) {
        const statusEmbed = new EmbedBuilder()
            .setTitle('👥 Creating PvP Stats...')
            .setColor(RARITY_COLORS.legendary)
            .setDescription('Creating PvP statistics for existing users...')
            .setTimestamp();
        
        await interaction.editReply({ embeds: [statusEmbed] });
        
        await pvpDatabaseSetup.createStatsForExistingUsers();
        
        const finalStatus = await pvpDatabaseSetup.getPvPDatabaseStatus();
        
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ User Stats Created!')
            .setColor(RARITY_COLORS.divine)
            .setDescription(`PvP statistics have been created for ${finalStatus.userStatsCount} users.`)
            .setFooter({ text: 'All users are now ready for PvP battles!' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [successEmbed] });
    },
    
    async handleReset(interaction) {
        const warningEmbed = new EmbedBuilder()
            .setTitle('⚠️ Reset PvP System')
            .setColor('#FF6B6B')
            .setDescription('**WARNING:** This will delete ALL PvP data including:\n\n• All battle history\n• Player rankings and stats\n• Tournament data\n• Everything PvP-related\n\n**This action cannot be undone!**')
            .setFooter({ text: 'Type "CONFIRM RESET" in the next message to proceed' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [warningEmbed] });
        
        // Wait for confirmation (simplified - in a real implementation, you'd use a proper confirmation system)
        const confirmEmbed = new EmbedBuilder()
            .setTitle('🔄 Reset Cancelled')
            .setColor(RARITY_COLORS.epic)
            .setDescription('Reset operation cancelled for safety. To reset the PvP system, please contact a developer.')
            .setFooter({ text: 'Use /setup-pvp action:setup to initialize a fresh system' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [confirmEmbed] });
    }
};
