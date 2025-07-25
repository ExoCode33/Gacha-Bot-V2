// src/commands/slash/economy/balance.js - Updated Balance Command
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EconomyService = require('../../../services/EconomyService');
const DatabaseManager = require('../../../database/DatabaseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('💰 Check your berry balance and stats')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Check another user\'s balance')
                .setRequired(false)
        ),
    
    category: 'economy',
    cooldown: 3,
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;
        
        try {
            // Get user data
            const user = await DatabaseManager.getUser(userId);
            if (!user) {
                return interaction.reply({
                    content: '❌ User not found! They need to use a command first.',
                    ephemeral: true
                });
            }
            
            // Get balance and income info
            const balance = await EconomyService.getBalance(userId);
            const incomeData = await EconomyService.calculateIncome(userId);
            const automaticIncome = await EconomyService.processAutomaticIncome(userId);
            
            // Get user's devil fruits count
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            const uniqueFruits = new Set(fruits.map(f => f.fruit_id)).size;
            
            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`💰 ${targetUser.username}'s Pirate Wallet`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    {
                        name: '🍓 Berry Balance',
                        value: `**${balance.toLocaleString()} Berries**`,
                        inline: true
                    },
                    {
                        name: '⚡ Combat Power',
                        value: `**${user.total_cp.toLocaleString()} CP**`,
                        inline: true
                    },
                    {
                        name: '🍈 Devil Fruits',
                        value: `**${fruits.length}** total\n**${uniqueFruits}** unique`,
                        inline: true
                    },
                    {
                        name: '💵 Income Per Hour',
                        value: `**${(incomeData.total * 6).toLocaleString()} Berries**\n` +
                               `Base: ${(incomeData.base * 6).toLocaleString()}\n` +
                               `CP Bonus: ${(incomeData.cpBonus * 6).toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: '📊 Statistics',
                        value: `Total Earned: **${user.total_earned.toLocaleString()}**\n` +
                               `Total Spent: **${user.total_spent.toLocaleString()}**\n` +
                               `Level: **${user.level}**`,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Use /income to collect berries • Use /summon to hunt for Devil Fruits` 
                })
                .setTimestamp();
            
            // Add automatic income info if available
            if (automaticIncome && automaticIncome.total > 0) {
                embed.addFields({
                    name: '✨ Automatic Income Collected!',
                    value: `You earned **${automaticIncome.total.toLocaleString()} Berries** ` +
                           `from ${automaticIncome.periods} periods ` +
                           `(${automaticIncome.hoursAccumulated.toFixed(1)} hours)`,
                    inline: false
                });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            interaction.client.logger.error('Balance command error:', error);
            await interaction.reply({
                content: '❌ An error occurred while checking the balance.',
                ephemeral: true
            });
        }
    }
};
