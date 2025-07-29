// src/commands/slash/pvp/pvp-raid.js - SIMPLIFIED TEST VERSION
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp-raid')
        .setDescription('⚔️ Launch an automated raid against another pirate\'s collection!')
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
        
        // Basic validation
        if (!target || target.bot) {
            return interaction.reply({
                content: '❌ Cannot raid bots or invalid users!',
                ephemeral: true
            });
        }
        
        if (attacker.id === target.id) {
            return interaction.reply({
                content: '❌ Cannot raid yourself!',
                ephemeral: true
            });
        }
        
        // Simple test response
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚔️ PvP Raid System - Test')
            .setDescription(`**${attacker.username}** is preparing to raid **${target.username}**!`)
            .addFields(
                {
                    name: '🚧 Status',
                    value: 'PvP Raid command is loading correctly!\nFull automated battle system coming soon.',
                    inline: false
                },
                {
                    name: '🎯 Raid Features (Coming Soon)',
                    value: '• Automated CP vs CP battles\n• Berry stealing (15% of opponent)\n• Fruit drops (1-3 fruits based on rarity)\n• 5-minute cooldowns\n• Detailed combat simulation',
                    inline: false
                }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
