// src/commands/slash/gacha/summon.js - Complete Updated Summon Command with FULL ANIMATIONS
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { 
    createEnhancedBatchReveal, 
    createSummaryEmbed, 
    createSinglePullReveal 
} = require('../../../utils/GachaRevealUtils');

const GachaService = require('../../../services/GachaService');
const EconomyService = require('../../../services/EconomyService');
const AchievementService = require('../../../services/AchievementService');
const DatabaseManager = require('../../../database/DatabaseManager');
const { PULL_COST, RARITY_COLORS, BERRY_EMOJI, FRUIT_EMOJI } = require('../../../data/Constants');
const Logger = require('../../../utils/Logger');

// Initialize logger
const logger = new Logger('SUMMON_COMMAND');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summon')
        .setDescription('🍈 Summon devil fruits from the Grand Line!')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Number of devil fruits to summon (1-10)')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('quick')
                .setDescription('Skip animations for faster results')
                .setRequired(false)
        ),

    async execute(interaction) {
        const startTime = Date.now();
        
        try {
            const amount = interaction.options.getInteger('amount') || 1;
            const quickMode = interaction.options.getBoolean('quick') || false;
            const userId = interaction.user.id;
            const username = interaction.user.username;
            const totalCost = PULL_COST * amount;

            logger.info(`${username} (${userId}) attempting to summon ${amount} fruit(s) for ${totalCost} berries`);

            // Validate input
            if (amount < 1 || amount > 10) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Invalid Amount')
                    .setDescription('You can only summon between 1 and 10 devil fruits at a time.')
                    .setColor(RARITY_COLORS.common);
                
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Check if user exists in database
            const userExists = await EconomyService.userExists(userId);
            if (!userExists) {
                await EconomyService.createUser(userId);
                logger.info(`Created new user: ${username} (${userId})`);
            }

            // Check if user has enough berries
            const userBalance = await EconomyService.getBalance(userId);
            if (userBalance < totalCost) {
                const shortageAmount = totalCost - userBalance;
                const embed = new EmbedBuilder()
                    .setTitle(`${BERRY_EMOJI} Insufficient Berries!`)
                    .setDescription([
                        `**Cost:** ${totalCost.toLocaleString()} berries`,
                        `**Your Balance:** ${userBalance.toLocaleString()} berries`,
                        `**Shortage:** ${shortageAmount.toLocaleString()} berries`,
                        '',
                        '💡 **Earn more berries with:**',
                        '• `/work` - Earn berries through work',
                        '• `/daily` - Daily berry bonus',
                        '• `/weekly` - Weekly bonus rewards'
                    ].join('\n'))
                    .setColor(RARITY_COLORS.common)
                    .setFooter({ text: 'Keep working to afford more summons!' });
                
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Check cooldowns (if any)
            const lastSummonTime = await GachaService.getLastSummonTime(userId);
            const cooldownTime = 3000; // 3 seconds between summons
            const timeSinceLastSummon = Date.now() - (lastSummonTime || 0);
            
            if (timeSinceLastSummon < cooldownTime) {
                const remainingTime = Math.ceil((cooldownTime - timeSinceLastSummon) / 1000);
                const embed = new EmbedBuilder()
                    .setTitle('⏰ Summon Cooldown')
                    .setDescription(`Please wait ${remainingTime} more second(s) before summoning again.`)
                    .setColor(RARITY_COLORS.uncommon);
                
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Initial loading message with dramatic effect
            const loadingEmbed = new EmbedBuilder()
                .setTitle('🌊 Sailing to the Grand Line...')
                .setDescription([
                    `⚓ Searching for ${amount} devil fruit${amount > 1 ? 's' : ''}...`,
                    `💰 **Cost:** ${totalCost.toLocaleString()} berries`,
                    `${BERRY_EMOJI} **Remaining:** ${(userBalance - totalCost).toLocaleString()} berries`,
                    '',
                    `${FRUIT_EMOJI} The sea holds many mysteries...`
                ].join('\n'))
                .setColor(RARITY_COLORS.rare)
                .setFooter({ text: `${username} • Summoning in progress...` })
                .setTimestamp();

            await interaction.reply({ embeds: [loadingEmbed] });

            // Add dramatic delay unless in quick mode
            if (!quickMode) {
                // Stage 1: Ocean exploration animation
                await this.showOceanExplorationAnimation(interaction, amount, quickMode);
                
                // Stage 2: Power detection animation
                await this.showPowerDetectionAnimation(interaction, amount, quickMode);
                
                // Stage 3: Devil fruit manifestation animation
                await this.showManifestationAnimation(interaction, amount, quickMode);
            } else {
                // Quick mode: just a simple loading screen
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Update last summon time
            await GachaService.updateLastSummonTime(userId);

            // Perform the gacha pulls
            logger.info(`Performing ${amount} pulls for ${username}`);
            const pullResults = await GachaService.performPulls(userId, amount);
            
            if (!pullResults || pullResults.length === 0) {
                logger.error(`Pull failed for ${username}: No results returned`);
                
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Summon Failed')
                    .setDescription([
                        'Something went wrong with your summon.',
                        'Your berries have not been deducted.',
                        'Please try again in a moment.'
                    ].join('\n'))
                    .setColor(RARITY_COLORS.common)
                    .setFooter({ text: 'If this persists, contact support.' });
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Validate pull results
            if (pullResults.length !== amount) {
                logger.warn(`Pull count mismatch for ${username}: expected ${amount}, got ${pullResults.length}`);
            }

            // Deduct berries after successful pull
            const deductionSuccess = await EconomyService.subtractBalance(userId, totalCost);
            if (!deductionSuccess) {
                logger.error(`Failed to deduct berries for ${username}`);
                // Still continue with the reveal since pulls were successful
            }

            // Get updated user stats for summary
            const userStats = await GachaService.getUserStats(userId);

            // Process achievements
            try {
                await AchievementService.checkPullAchievements(userId, pullResults);
                await AchievementService.checkCollectionAchievements(userId, userStats);
            } catch (achievementError) {
                logger.error('Achievement processing failed:', achievementError);
                // Don't fail the entire command for achievement errors
            }

            // Log the summon for analytics
            logger.info(`${username} summoned ${amount} fruit(s) for ${totalCost} berries`);
            
            // Log individual results for debugging
            pullResults.forEach((result, index) => {
                const { fruit, isNew } = result;
                logger.debug(`Result ${index + 1}: ${fruit.id} (${fruit.rarity}) - ${isNew ? 'NEW' : 'DUPLICATE'}`);
            });

            // Calculate execution time
            const executionTime = Date.now() - startTime;
            logger.debug(`Summon execution time: ${executionTime}ms`);

            if (amount === 1) {
                // Single pull - use enhanced single reveal with dramatic animation
                await this.showSinglePullReveal(interaction, pullResults[0], quickMode);
                
                // Add user balance update after delay
                if (!quickMode) {
                    setTimeout(async () => {
                        try {
                            const newBalance = await EconomyService.getBalance(userId);
                            const balanceEmbed = new EmbedBuilder()
                                .setDescription(`${BERRY_EMOJI} **New Balance:** ${newBalance.toLocaleString()} berries`)
                                .setColor(RARITY_COLORS.uncommon)
                                .setFooter({ text: 'Use /collection to view your fruits!' });
                            
                            await interaction.followUp({ embeds: [balanceEmbed] });
                        } catch (followUpError) {
                            logger.error('Failed to send balance follow-up:', followUpError);
                        }
                    }, 1000);
                }
            } else {
                // Multi-pull - use enhanced batch system with full animations
                logger.info(`Creating batch reveal for ${amount} pulls`);
                await createEnhancedBatchReveal(interaction, pullResults, quickMode);
                
                // Send summary after all batches with slight delay
                const summaryDelay = quickMode ? 500 : 2000;
                await new Promise(resolve => setTimeout(resolve, summaryDelay));
                
                try {
                    const summaryEmbed = createSummaryEmbed(pullResults, userStats);
                    await interaction.followUp({ embeds: [summaryEmbed] });
                } catch (summaryError) {
                    logger.error('Failed to send summary embed:', summaryError);
                }
            }

            // Final logging
            const totalExecutionTime = Date.now() - startTime;
            logger.info(`Summon completed for ${username} in ${totalExecutionTime}ms`);

        } catch (error) {
            const errorId = Date.now();
            logger.error(`Summon error [${errorId}]:`, error);
            logger.error('Error details:', {
                userId: interaction.user.id,
                username: interaction.user.username,
                amount: interaction.options.getInteger('amount'),
                timestamp: new Date().toISOString(),
                stack: error.stack
            });
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('⚠️ Summon Error')
                .setDescription([
                    'An unexpected error occurred during summoning.',
                    'Your berries have been protected and not deducted.',
                    '',
                    'Please try again in a moment.',
                    '',
                    `**Error ID:** ${errorId}`
                ].join('\n'))
                .setColor(RARITY_COLORS.common)
                .setFooter({ text: 'If this persists, contact support with the Error ID.' });

            // Try to respond appropriately based on interaction state
            try {
                if (interaction.replied || interaction.deferred) {
                    if (interaction.followUp) {
                        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                    } else {
                        await interaction.editReply({ embeds: [errorEmbed] });
                    }
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            } catch (responseError) {
                logger.error(`Failed to send error response [${errorId}]:`, responseError);
            }
        }
    },

    // Animation Stage 1: Ocean Exploration
    async showOceanExplorationAnimation(interaction, amount, quickMode) {
        const frames = [
            {
                title: '🌊 Diving into the Grand Line...',
                description: '⚓ Searching the mysterious depths of the sea...',
                color: 0x0066CC
            },
            {
                title: '🌊 Exploring the Ocean Floor...',
                description: '🔍 Scanning for devil fruit energy signatures...',
                color: 0x0080FF
            },
            {
                title: '🌊 Following Ancient Currents...',
                description: '💫 Strange powers stirring in the deep...',
                color: 0x4DA6FF
            }
        ];

        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const embed = new EmbedBuilder()
                .setTitle(frame.title)
                .setDescription([
                    frame.description,
                    '',
                    `🎯 **Target:** ${amount} devil fruit${amount > 1 ? 's' : ''}`,
                    `📊 **Progress:** Exploring... (${i + 1}/3)`,
                    '',
                    '🌊 The ocean trembles with ancient power...'
                ].join('\n'))
                .setColor(frame.color)
                .setFooter({ text: 'Stage 1: Ocean Exploration' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, quickMode ? 300 : 1200));
        }
    },

    // Animation Stage 2: Power Detection
    async showPowerDetectionAnimation(interaction, amount, quickMode) {
        const frames = [
            {
                title: '⚡ Power Signatures Detected!',
                description: '🔥 Incredible energy readings approaching...',
                color: 0xFF6600
            },
            {
                title: '⚡ Devil Fruit Energy Rising!',
                description: '💥 Reality itself bends to these mysterious forces...',
                color: 0xFF8000
            },
            {
                title: '⚡ Legendary Powers Awakening!',
                description: '✨ The very air crackles with supernatural energy...',
                color: 0xFFAA00
            }
        ];

        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const embed = new EmbedBuilder()
                .setTitle(frame.title)
                .setDescription([
                    frame.description,
                    '',
                    `🎯 **Target:** ${amount} devil fruit${amount > 1 ? 's' : ''}`,
                    `📊 **Progress:** Detecting... (${i + 1}/3)`,
                    '',
                    `${'⚡'.repeat(i + 1)} Energy levels: ${['High', 'Extreme', 'LEGENDARY'][i]}!`
                ].join('\n'))
                .setColor(frame.color)
                .setFooter({ text: 'Stage 2: Power Detection' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, quickMode ? 300 : 1000));
        }
    },

    // Animation Stage 3: Devil Fruit Manifestation
    async showManifestationAnimation(interaction, amount, quickMode) {
        const frames = [
            {
                title: '🍈 Devil Fruits Materializing...',
                description: '🌟 Ancient powers taking physical form...',
                color: 0x9966FF
            },
            {
                title: '🍈 Fruits Breaking Through Dimensions!',
                description: '💫 Reality tears open to reveal forbidden powers...',
                color: 0xAA66FF
            },
            {
                title: '🍈 Your Destiny Awaits!',
                description: '✨ The sea has chosen your fate...',
                color: 0xCC66FF
            }
        ];

        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const embed = new EmbedBuilder()
                .setTitle(frame.title)
                .setDescription([
                    frame.description,
                    '',
                    `🎯 **Target:** ${amount} devil fruit${amount > 1 ? 's' : ''}`,
                    `📊 **Progress:** Manifesting... (${i + 1}/3)`,
                    '',
                    `${'🍈'.repeat(i + 1)} The fruits appear before you!`
                ].join('\n'))
                .setColor(frame.color)
                .setFooter({ text: 'Stage 3: Manifestation' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, quickMode ? 300 : 1500));
        }
    },

    // Enhanced Single Pull Reveal
    async showSinglePullReveal(interaction, pullResult, quickMode) {
        try {
            // Create dramatic single reveal with rarity-based animation
            const revealEmbed = createSinglePullReveal(pullResult);
            
            if (!quickMode) {
                // Add rarity-specific dramatic effect
                await this.showRaritySpecificAnimation(interaction, pullResult, revealEmbed);
            } else {
                // Quick reveal
                await interaction.editReply({ embeds: [revealEmbed] });
            }
        } catch (revealError) {
            logger.error('Failed to create single reveal:', revealError);
            
            // Fallback if embed creation fails
            const { fruit, isNew } = pullResult;
            const fallbackEmbed = new EmbedBuilder()
                .setTitle(`${FRUIT_EMOJI} Devil Fruit Summoned!`)
                .setDescription([
                    'Your devil fruit has been added to your collection!',
                    '',
                    `**Fruit:** ${fruit.id}`,
                    `**Rarity:** ${fruit.rarity}`,
                    `**Status:** ${isNew ? 'New!' : 'Duplicate'}`
                ].join('\n'))
                .setColor(RARITY_COLORS.rare)
                .setFooter({ text: 'Use /collection to view your fruits!' });
            
            await interaction.editReply({ embeds: [fallbackEmbed] });
        }
    },

    // Rarity-Specific Animation Effects
    async showRaritySpecificAnimation(interaction, pullResult, finalEmbed) {
        const { fruit } = pullResult;
        const rarity = fruit.rarity;
        
        if (rarity === 'divine') {
            await this.showDivineAnimation(interaction, finalEmbed);
        } else if (rarity === 'mythical') {
            await this.showMythicalAnimation(interaction, finalEmbed);
        } else if (rarity === 'legendary') {
            await this.showLegendaryAnimation(interaction, finalEmbed);
        } else if (rarity === 'epic') {
            await this.showEpicAnimation(interaction, finalEmbed);
        } else {
            // Standard reveal for common/uncommon/rare
            await this.showStandardAnimation(interaction, finalEmbed);
        }
    },

    // Divine Rarity Animation - Ultimate Rainbow Effect
    async showDivineAnimation(interaction, finalEmbed) {
        const divineColors = [
            0xFF0000, 0xFF4000, 0xFF8000, 0xFFBF00, 0xFFFF00, 
            0xBFFF00, 0x80FF00, 0x40FF00, 0x00FF00, 0x00FF40,
            0x00FF80, 0x00FFBF, 0x00FFFF, 0x00BFFF, 0x0080FF,
            0x0040FF, 0x0000FF, 0x4000FF, 0x8000FF, 0xBF00FF,
            0xFF00FF, 0xFF00BF, 0xFF0080, 0xFF0040
        ];
        
        // Ultra-fast rainbow cycling for 3 seconds
        for (let i = 0; i < 30; i++) {
            const color = divineColors[i % divineColors.length];
            const embed = new EmbedBuilder()
                .setTitle('✨ DIVINE POWER DETECTED! ✨')
                .setDescription('🌟 REALITY ITSELF BENDS TO YOUR WILL! 🌟')
                .setColor(color)
                .setFooter({ text: '✨ DIVINE TIER ACQUIRED! ✨' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Final reveal
        await interaction.editReply({ embeds: [finalEmbed] });
    },

    // Mythical Rarity Animation - Golden Glow Effect
    async showMythicalAnimation(interaction, finalEmbed) {
        const goldenColors = [0xFFD700, 0xFFA500, 0xFFB347, 0xFFD700, 0xFFA500];
        
        for (let i = 0; i < 20; i++) {
            const color = goldenColors[i % goldenColors.length];
            const embed = new EmbedBuilder()
                .setTitle('🌟 MYTHICAL POWER AWAKENS! 🌟')
                .setDescription('⚡ LEGENDARY ENERGY COURSES THROUGH YOU! ⚡')
                .setColor(color)
                .setFooter({ text: '🌟 MYTHICAL TIER ACQUIRED! 🌟' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        await interaction.editReply({ embeds: [finalEmbed] });
    },

    // Legendary Rarity Animation - Pulsing Gold Effect
    async showLegendaryAnimation(interaction, finalEmbed) {
        const legendaryColors = [0xFFD700, 0xFFC000, 0xFFD700, 0xFFE55C];
        
        for (let i = 0; i < 15; i++) {
            const color = legendaryColors[i % legendaryColors.length];
            const embed = new EmbedBuilder()
                .setTitle('👑 LEGENDARY DISCOVERY! 👑')
                .setDescription('🔥 INCREDIBLE POWER FLOWS WITHIN! 🔥')
                .setColor(color)
                .setFooter({ text: '👑 LEGENDARY TIER ACQUIRED! 👑' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        await interaction.editReply({ embeds: [finalEmbed] });
    },

    // Epic Rarity Animation - Purple Pulse Effect
    async showEpicAnimation(interaction, finalEmbed) {
        const epicColors = [0x8A2BE2, 0x9932CC, 0x8A2BE2, 0xBA55D3];
        
        for (let i = 0; i < 10; i++) {
            const color = epicColors[i % epicColors.length];
            const embed = new EmbedBuilder()
                .setTitle('⚡ EPIC POWER SURGE! ⚡')
                .setDescription('💫 EXTRAORDINARY ABILITIES MANIFEST! 💫')
                .setColor(color)
                .setFooter({ text: '⚡ EPIC TIER ACQUIRED! ⚡' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        
        await interaction.editReply({ embeds: [finalEmbed] });
    },

    // Standard Animation for Common/Uncommon/Rare
    async showStandardAnimation(interaction, finalEmbed) {
        const standardColors = [0x4A90E2, 0x5BA0F2, 0x4A90E2];
        
        for (let i = 0; i < 6; i++) {
            const color = standardColors[i % standardColors.length];
            const embed = new EmbedBuilder()
                .setTitle('🍈 Devil Fruit Acquired! 🍈')
                .setDescription('✨ New power courses through your veins! ✨')
                .setColor(color)
                .setFooter({ text: '🍈 Fruit Acquired! 🍈' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        await interaction.editReply({ embeds: [finalEmbed] });
    },

    // Additional properties for command info
    cooldown: 3, // 3 second cooldown
    category: 'gacha',
    usage: '/summon [amount] [quick]',
    examples: [
        '/summon',
        '/summon amount:5',
        '/summon amount:10 quick:true'
    ]
};

/*
SERVICE INTERFACE REQUIREMENTS:

Your services need these methods:

1. EconomyService:
   - userExists(userId) -> boolean
   - createUser(userId) -> void
   - getBalance(userId) -> number
   - subtractBalance(userId, amount) -> boolean

2. GachaService:
   - getLastSummonTime(userId) -> number (timestamp)
   - updateLastSummonTime(userId) -> void
   - performPulls(userId, amount) -> Array<{fruit: {id, rarity, count}, isNew: boolean}>
   - getUserStats(userId) -> {berries, totalFruits, uniqueFruits}

3. AchievementService (optional):
   - checkPullAchievements(userId, pullResults) -> void
   - checkCollectionAchievements(userId, userStats) -> void

PULL RESULT FORMAT:
[
    {
        fruit: {
            id: "hito_hito_no_mi_daibutsu",
            rarity: "legendary", 
            count: 4
        },
        isNew: false
    }
]
*/
