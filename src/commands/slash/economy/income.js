// src/commands/slash/economy/income.js - Income Command
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EconomyService = require('../../../services/EconomyService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('income')
        .setDescription('💵 Collect your manual income with a bonus multiplier!'),
    
    category: 'economy',
    cooldown: 3,
    
    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            // Process automatic income first
            const automaticIncome = await EconomyService.processAutomaticIncome(userId);
            
            // Try to process manual income
            const manualResult = await EconomyService.processManualIncome(userId);
            
            if (!manualResult.success) {
                // Manual income on cooldown
                if (manualResult.cooldown) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF8000')
                        .setTitle('⏰ Manual Income on Cooldown')
                        .setDescription(`You can collect manual income again in **${manualResult.cooldown} seconds**.`)
                        .addFields({
                            name: '💡 Tip',
                            value: 'Automatic income is always collecting in the background!\nCheck your balance with `/balance` to see accumulated income.',
                            inline: false
                        })
                        .setFooter({ text: 'Manual income has a higher multiplier but requires waiting!' });
                    
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
                
                // Other error
                return interaction.reply({
                    content: `❌ Failed to process income: ${manualResult.error || 'Unknown error'}`,
                    ephemeral: true
                });
            }
            
            // Success! Show income collected
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('💰 Income Collected!')
                .setDescription(`You earned **${manualResult.income.toLocaleString()} Berries**!`)
                .addFields(
                    {
                        name: '📈 Manual Income Details',
                        value: `Base Income: **${manualResult.baseIncome.toLocaleString()}** per period\n` +
                               `Multiplier: **x${manualResult.multiplier}**\n` +
                               `Total Earned: **${manualResult.income.toLocaleString()} Berries**`,
                        inline: false
                    }
                )
                .setFooter({ text: 'Come back in 60 seconds for more manual income!' })
                .setTimestamp();
            
            // Add automatic income info if any was collected
            if (automaticIncome && automaticIncome.total > 0) {
                embed.addFields({
                    name: '✨ Bonus: Automatic Income Collected!',
                    value: `You also earned **${automaticIncome.total.toLocaleString()} Berries** ` +
                           `from ${automaticIncome.periods} periods of automatic income!`,
                    inline: false
                });
                
                embed.setDescription(
                    `You earned **${(manualResult.income + automaticIncome.total).toLocaleString()} Berries** total!`
                );
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            interaction.client.logger.error('Income command error:', error);
            
            if (error.message === 'Insufficient berries') {
                await interaction.reply({
                    content: '❌ An unexpected error occurred with your balance.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ An error occurred while processing your income.',
                    ephemeral: true
                });
            }
        }
    }
};
