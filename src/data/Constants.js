// src/data/Constants.js - Game Constants and Configuration
module.exports = {
    // Economy Constants
    PULL_COST: 1000,
    MULTI_PULL_DISCOUNT: 0.9, // 10% discount for 10-pulls
    BASE_INCOME: 50,
    INCOME_MULTIPLIER: 0.1,
    MANUAL_INCOME_MULTIPLIER: 6,
    MANUAL_INCOME_COOLDOWN: 60, // seconds
    
    // Rarity Colors for embeds
    RARITY_COLORS: {
        common: '#808080',     // Gray
        uncommon: '#00FF00',   // Green
        rare: '#0080FF',       // Blue
        epic: '#800080',       // Purple
        mythical: '#FF8000',   // Orange
        legendary: '#FFD700'   // Gold
    },
    
    // Rarity Emojis
    RARITY_EMOJIS: {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        mythical: '🟠',
        legendary: '🌟'
    },

    // Rarity Names (formatted)
    RARITY_NAMES: {
        common: 'Common',
        uncommon: 'Uncommon',
        rare: 'Rare',
        epic: 'Epic',
        mythical: 'Mythical',
        legendary: 'Legendary'
    },
    
    // Battle System Constants
    BATTLE_CONSTANTS: {
        MAX_TURNS: 15,
        TURN_TIME: 30, // seconds
        TYPE_ADVANTAGES: {
            'Paramecia': { strong: ['Zoan'], weak: ['Logia'] },
            'Logia': { strong: ['Paramecia'], weak: ['Zoan'] },
            'Zoan': { strong: ['Logia'], weak: ['Paramecia'] }
        },
        CRIT_CHANCE: 0.1,
        CRIT_MULTIPLIER: 1.5,
        DODGE_CHANCE: 0.05
    },
    
    // Trading Constants
    TRADE_TAX: 0.05, // 5% tax on trades
    MIN_TRADE_LEVEL: 5,
    TRADE_COOLDOWN: 300, // 5 minutes
    
    // Pull Animation Frames
    ANIMATION_FRAMES: [
        '```\n🏴‍☠️ Setting sail...\n⛵ ～～～～～～～～\n```',
        '```\n🏴‍☠️ Navigating the waters...\n⛵ ～～🌊～～～～～\n```',
        '```\n🏴‍☠️ Storm approaching!\n⛵ ～～🌊🌊🌊～～～\n```',
        '```\n🏴‍☠️ Devil Fruit spotted!\n⛵ ～～🌊🍈🌊～～～\n```',
        '```\n🏴‍☠️ Retrieving the fruit...\n⛵ ～～🌊✨🌊～～～\n```'
    ],

    // Success Messages
    SUCCESS_MESSAGES: [
        'Congratulations! You found a Devil Fruit!',
        'Amazing! The sea has blessed you!',
        'Incredible! A Devil Fruit emerges from the depths!',
        'Fantastic! Your adventure pays off!',
        'Wonderful! The Grand Line rewards your courage!'
    ],

    // Achievements
    ACHIEVEMENTS: {
        FIRST_PULL: { 
            id: 'first_pull', 
            name: 'First Steps', 
            description: 'Make your first pull',
            reward: 500
        },
        LEGENDARY_HUNTER: { 
            id: 'legendary_hunter', 
            name: 'Legendary Hunter', 
            description: 'Pull a legendary fruit',
            reward: 5000
        },
        COLLECTOR_10: { 
            id: 'collector_10', 
            name: 'Novice Collector', 
            description: 'Collect 10 unique fruits',
            reward: 2000
        },
        COLLECTOR_50: { 
            id: 'collector_50', 
            name: 'Expert Collector', 
            description: 'Collect 50 unique fruits',
            reward: 10000
        },
        RICH_PIRATE: { 
            id: 'rich_pirate', 
            name: 'Rich Pirate', 
            description: 'Accumulate 1,000,000 berries',
            reward: 100000
        },
        MYTHICAL_MASTER: {
            id: 'mythical_master',
            name: 'Mythical Master',
            description: 'Pull 5 mythical fruits',
            reward: 15000
        }
    },

    // Error Messages
    ERROR_MESSAGES: {
        INSUFFICIENT_BERRIES: 'You don\'t have enough berries! 💸',
        USER_NOT_FOUND: 'User not found in the database. 👤',
        FRUIT_NOT_FOUND: 'Devil Fruit not found. 🍈',
        COOLDOWN_ACTIVE: 'This action is on cooldown. ⏰',
        PERMISSION_DENIED: 'You don\'t have permission to do this. 🚫',
        DATABASE_ERROR: 'A database error occurred. Please try again. 🗄️',
        NETWORK_ERROR: 'A network error occurred. Please check your connection. 🌐'
    },

    // Command Categories
    COMMAND_CATEGORIES: {
        GACHA: 'gacha',
        ECONOMY: 'economy',
        PVP: 'pvp',
        ADMIN: 'admin',
        GENERAL: 'general'
    },

    // Embed Limits
    EMBED_LIMITS: {
        TITLE: 256,
        DESCRIPTION: 4096,
        FIELD_NAME: 256,
        FIELD_VALUE: 1024,
        FOOTER: 2048,
        AUTHOR: 256
    },

    // Pagination
    PAGINATION: {
        ITEMS_PER_PAGE: 10,
        MAX_PAGES: 25
    },

    // Time Constants
    TIME: {
        SECOND: 1000,
        MINUTE: 60 * 1000,
        HOUR: 60 * 60 * 1000,
        DAY: 24 * 60 * 60 * 1000,
        WEEK: 7 * 24 * 60 * 60 * 1000
    },

    // Bot Status Messages
    BOT_ACTIVITIES: [
        { name: 'the Grand Line for Devil Fruits! 🍈', type: 3 }, // Watching
        { name: '/pull to find Devil Fruits!', type: 2 }, // Listening
        { name: 'One Piece adventures!', type: 0 }, // Playing
        { name: 'pirates searching for treasure!', type: 3 }, // Watching
        { name: 'the ocean waves 🌊', type: 2 } // Listening
    ],

    // Level System
    LEVEL_SYSTEM: {
        BASE_EXP: 100,
        EXP_MULTIPLIER: 1.5,
        CP_PER_LEVEL: 10,
        MAX_LEVEL: 100
    },

    // CP Multipliers by rarity
    CP_MULTIPLIERS: {
        common: 1.0,
        uncommon: 1.3,
        rare: 1.7,
        epic: 2.3,
        mythical: 3.0,
        legendary: 3.5
    },

    // Pull Rates (base percentages)
    BASE_PULL_RATES: {
        common: 47,
        uncommon: 30,
        rare: 15,
        epic: 5,
        mythical: 2,
        legendary: 1
    },

    // Pity System
    PITY_SYSTEM: {
        SOFT_PITY_START: 50,
        HARD_PITY_START: 75,
        GUARANTEED_LEGENDARY: 90
    },

    // Berry Emojis
    BERRY_EMOJI: '🍓',
    
    // Devil Fruit Emoji
    FRUIT_EMOJI: '🍈',

    // Navigation Emojis
    NAVIGATION_EMOJIS: {
        PREVIOUS: '⬅️',
        NEXT: '➡️',
        FIRST: '⏮️',
        LAST: '⏭️',
        SUMMARY: '📊'
    }
};
