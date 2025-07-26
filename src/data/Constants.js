// src/data/Constants.js - Updated with NEW Pity System
module.exports = {
    // Economy Constants
    PULL_COST: 1000,
    MULTI_PULL_DISCOUNT: 0.9, // 10% discount for 10-pulls
    BASE_INCOME: 50,
    INCOME_MULTIPLIER: 0.1,
    MANUAL_INCOME_MULTIPLIER: 6,
    MANUAL_INCOME_COOLDOWN: 60, // seconds
    
    // Enhanced Rarity Colors for embeds
    RARITY_COLORS: {
        common: '#808080',     // Gray
        uncommon: '#00FF00',   // Green
        rare: '#0080FF',       // Blue
        epic: '#800080',       // Purple
        legendary: '#FFD700',  // Gold
        mythical: '#FF8000',   // Orange
        divine: '#FFFFFF'      // White (Divine Tier)
    },
    
    // Enhanced Rarity Emojis
    RARITY_EMOJIS: {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        legendary: '🌟',
        mythical: '🟠',
        divine: '✨'           // Divine Tier
    },

    // Rarity Names (formatted)
    RARITY_NAMES: {
        common: 'Common',
        uncommon: 'Uncommon',
        rare: 'Rare',
        epic: 'Epic',
        legendary: 'Legendary',
        mythical: 'Mythical',
        divine: 'Divine'       // Divine Tier
    },
    
    // UPDATED Pull Rates (NEW DIVINE & MYTHICAL RATES)
    BASE_PULL_RATES: {
        common: 47,
        uncommon: 30,
        rare: 15,
        epic: 5,
        legendary: 2,
        mythical: 0.4,         // UPDATED from 0.8%
        divine: 0.05           // UPDATED from 0.2%
    },

    // NEW PITY SYSTEM - Premium Rates Proc System
    PITY_SYSTEM: {
        HARD_PITY_LIMIT: 1500,     // Hard pity at 1500 pulls
        
        // Premium rates when pity procs
        PREMIUM_RATES: {
            legendary: 60.0,        // 60% when pity procs
            mythical: 39.8,         // 39.8% when pity procs  
            divine: 0.2             // 0.2% when pity procs
        },
        
        // Pity proc chance calculation
        BASE_PITY_CHANCE: 0.0,      // Base chance at 0 pulls
        MAX_PITY_CHANCE: 100.0,     // 100% chance at 1500 pulls
        
        // Pity resets when you get legendary/mythical/divine
        RESET_RARITIES: ['legendary', 'mythical', 'divine']
    },

    // UPDATED Rarity Drop Rates for Display
    RARITY_DROP_RATES: {
        common: '47%',
        uncommon: '30%', 
        rare: '15%',
        epic: '5%',
        legendary: '2%',
        mythical: '0.4%',      // UPDATED from 0.8%
        divine: '0.05%'        // UPDATED from 0.2%
    },
    
    // Enhanced PvP Battle System Constants
    BATTLE_CONSTANTS: {
        MAX_TURNS: 20,         // Increased for more strategic battles
        TURN_TIME: 45,         // Increased time for skill selection
        BASE_HP: 200,          // Base HP for all users
        HP_PER_LEVEL: 15,      // HP gain per level
        CP_TO_HP_RATIO: 0.5,   // CP contributes to HP
        
        // Type advantages for PvP
        TYPE_ADVANTAGES: {
            'Paramecia': { strong: ['Zoan'], weak: ['Logia'], neutral: ['Ancient Zoan', 'Mythical Zoan'] },
            'Logia': { strong: ['Paramecia'], weak: ['Zoan'], neutral: ['Ancient Zoan', 'Mythical Zoan'] },
            'Zoan': { strong: ['Logia'], weak: ['Paramecia'], neutral: ['Ancient Zoan', 'Mythical Zoan'] },
            'Ancient Zoan': { strong: ['Paramecia', 'Logia'], weak: ['Mythical Zoan'], neutral: ['Zoan'] },
            'Mythical Zoan': { strong: ['Ancient Zoan', 'Zoan'], weak: ['Divine'], neutral: ['Paramecia', 'Logia'] },
            'Divine': { strong: ['All'], weak: ['None'], neutral: [] }
        },
        
        // Enhanced battle mechanics
        CRIT_CHANCE: 0.15,       // Increased crit chance
        CRIT_MULTIPLIER: 1.8,    // Higher crit damage
        DODGE_CHANCE: 0.08,      // Base dodge chance
        BLOCK_CHANCE: 0.12,      // Base block chance
        COUNTER_CHANCE: 0.05,    // Chance to counter-attack
        
        // Status effect durations
        MAX_STATUS_DURATION: 5,
        STATUS_STACK_LIMIT: 3
    },
    
    // CP Multipliers by rarity (enhanced)
    CP_MULTIPLIERS: {
        common: { min: 1.0, max: 1.2 },
        uncommon: { min: 1.2, max: 1.4 },
        rare: { min: 1.4, max: 1.7 },
        epic: { min: 1.7, max: 2.1 },
        legendary: { min: 2.1, max: 2.6 },
        mythical: { min: 2.6, max: 3.2 },
        divine: { min: 3.2, max: 4.0 }    // Divine Tier
    },

    // PvP Skill Categories
    SKILL_CATEGORIES: {
        ATTACK: 'attack',
        DEFENSE: 'defense', 
        SUPPORT: 'support',
        ULTIMATE: 'ultimate',
        PASSIVE: 'passive'
    },

    // Status Effects for PvP
    STATUS_EFFECTS: {
        // Damage over time
        POISON: { type: 'dot', icon: '☠️' },
        BURN: { type: 'dot', icon: '🔥' },
        BLEED: { type: 'dot', icon: '🩸' },
        FREEZE: { type: 'dot', icon: '❄️' },
        
        // Debuffs
        SLOW: { type: 'debuff', icon: '🐌' },
        WEAK: { type: 'debuff', icon: '😵' },
        BLIND: { type: 'debuff', icon: '🙈' },
        SILENCE: { type: 'debuff', icon: '🤐' },
        
        // Buffs
        STRENGTH: { type: 'buff', icon: '💪' },
        SPEED: { type: 'buff', icon: '💨' },
        DEFENSE: { type: 'buff', icon: '🛡️' },
        REGENERATION: { type: 'buff', icon: '💚' },
        
        // Special
        INVINCIBLE: { type: 'special', icon: '✨' },
        INVISIBLE: { type: 'special', icon: '👻' },
        REFLECT: { type: 'special', icon: '🪞' }
    },

    // Enhanced Trading Constants  
    TRADE_TAX: 0.05, // 5% tax on trades
    MIN_TRADE_LEVEL: 5,
    TRADE_COOLDOWN: 300, // 5 minutes
    MAX_TRADE_VALUE: 1000000, // Max berries per trade
    
    // Achievements System
    ACHIEVEMENTS: {
        FIRST_PULL: { 
            id: 'first_pull', 
            name: 'First Steps on the Grand Line', 
            description: 'Make your first devil fruit pull',
            reward: 500,
            icon: '🍈'
        },
        LEGENDARY_HUNTER: { 
            id: 'legendary_hunter', 
            name: 'Legendary Pirate', 
            description: 'Pull a legendary devil fruit',
            reward: 5000,
            icon: '🌟'
        },
        MYTHICAL_MASTER: {
            id: 'mythical_master',
            name: 'Mythical Legend',
            description: 'Pull a mythical devil fruit',
            reward: 15000,
            icon: '🟠'
        },
        DIVINE_ASCENSION: {
            id: 'divine_ascension',
            name: 'Divine Ascension',
            description: 'Pull a divine devil fruit',
            reward: 50000,
            icon: '✨'
        },
        COLLECTOR_10: { 
            id: 'collector_10', 
            name: 'Novice Collector', 
            description: 'Collect 10 unique fruits',
            reward: 2000,
            icon: '📚'
        },
        COLLECTOR_25: {
            id: 'collector_25',
            name: 'Expert Collector',
            description: 'Collect 25 unique fruits', 
            reward: 5000,
            icon: '📖'
        },
        COLLECTOR_50: { 
            id: 'collector_50', 
            name: 'Master Collector', 
            description: 'Collect 50 unique fruits',
            reward: 10000,
            icon: '📜'
        },
        COLLECTOR_100: {
            id: 'collector_100',
            name: 'Legendary Collector',
            description: 'Collect 100 unique fruits',
            reward: 25000,
            icon: '🗞️'
        },
        RICH_PIRATE: { 
            id: 'rich_pirate', 
            name: 'Rich Pirate', 
            description: 'Accumulate 1,000,000 berries',
            reward: 100000,
            icon: '💰'
        },
        MILLIONAIRE: {
            id: 'millionaire',
            name: 'Pirate Millionaire',
            description: 'Accumulate 10,000,000 berries',
            reward: 500000,
            icon: '💎'
        },
        PVP_ROOKIE: {
            id: 'pvp_rookie',
            name: 'Battle Rookie',
            description: 'Win your first PvP battle',
            reward: 3000,
            icon: '⚔️'
        },
        PVP_VETERAN: {
            id: 'pvp_veteran', 
            name: 'Battle Veteran',
            description: 'Win 10 PvP battles',
            reward: 10000,
            icon: '🏆'
        },
        PVP_CHAMPION: {
            id: 'pvp_champion',
            name: 'Battle Champion',
            description: 'Win 50 PvP battles',
            reward: 50000,
            icon: '👑'
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
        NETWORK_ERROR: 'A network error occurred. Please check your connection. 🌐',
        PVP_BATTLE_ACTIVE: 'You are already in a PvP battle! ⚔️',
        INVALID_TARGET: 'Invalid battle target selected. 🎯',
        SKILL_ON_COOLDOWN: 'That skill is still on cooldown! ⏳'
    },

    // Enhanced Command Categories
    COMMAND_CATEGORIES: {
        GACHA: 'gacha',
        ECONOMY: 'economy',
        PVP: 'pvp',
        COLLECTION: 'collection',
        ADMIN: 'admin',
        GENERAL: 'general',
        LEADERBOARD: 'leaderboard'
    },

    // Embed Limits (Discord limits)
    EMBED_LIMITS: {
        TITLE: 256,
        DESCRIPTION: 4096,
        FIELD_NAME: 256,
        FIELD_VALUE: 1024,
        FOOTER: 2048,
        AUTHOR: 256,
        FIELDS_MAX: 25
    },

    // Enhanced Pagination
    PAGINATION: {
        ITEMS_PER_PAGE: 12,  // Optimized for Discord
        MAX_PAGES: 30,
        TIMEOUT: 300000      // 5 minutes
    },

    // Time Constants
    TIME: {
        SECOND: 1000,
        MINUTE: 60 * 1000,
        HOUR: 60 * 60 * 1000,
        DAY: 24 * 60 * 60 * 1000,
        WEEK: 7 * 24 * 60 * 60 * 1000
    },

    // Enhanced Bot Status Messages
    BOT_ACTIVITIES: [
        { name: 'the Grand Line for Devil Fruits! 🍈', type: 3 }, // Watching
        { name: '/pull to find Devil Fruits!', type: 2 }, // Listening
        { name: 'One Piece adventures!', type: 0 }, // Playing
        { name: 'pirates battling in PvP! ⚔️', type: 3 }, // Watching
        { name: 'the ocean waves 🌊', type: 2 }, // Listening
        { name: 'with devil fruit powers! 💪', type: 0 }, // Playing
        { name: 'legendary battles unfold! 🌟', type: 3 } // Watching
    ],

    // Enhanced Level System
    LEVEL_SYSTEM: {
        BASE_EXP: 100,
        EXP_MULTIPLIER: 1.4,      // Slightly reduced for balance
        CP_PER_LEVEL: 12,         // Increased CP gain per level
        MAX_LEVEL: 150,           // Increased max level
        PRESTIGE_LEVEL: 100,      // Level needed for prestige
        PRESTIGE_BONUS: 1.5       // Multiplier after prestige
    },

    // Navigation Emojis for pagination
    NAVIGATION_EMOJIS: {
        FIRST: '⏮️',
        PREVIOUS: '⬅️',
        NEXT: '➡️',
        LAST: '⏭️',
        SUMMARY: '📊',
        BATTLE: '⚔️',
        COLLECTION: '📚'
    },

    // PvP Queue System
    PVP_QUEUE: {
        MAX_WAIT_TIME: 120000,    // 2 minutes max wait
        RANK_DIFFERENCE: 3,       // Max rank difference for matching
        CP_DIFFERENCE: 500,       // Max CP difference for fair matches
        TIMEOUT_PENALTY: 300000   // 5 min penalty for timing out
    },

    // Berry Emoji
    BERRY_EMOJI: '🍓',
    
    // Devil Fruit Emoji  
    FRUIT_EMOJI: '🍈',

    // Enhanced Battle Emojis
    BATTLE_EMOJIS: {
        ATTACK: '⚔️',
        DEFEND: '🛡️',
        SKILL: '✨',
        CRITICAL: '💥',
        MISS: '💨',
        DODGE: '💫',
        BLOCK: '🚧',
        COUNTER: '🔄',
        WIN: '🏆',
        LOSE: '💀',
        DRAW: '🤝'
    },

    // Maximum values for various systems
    MAX_VALUES: {
        BERRIES: 999999999,       // Max berry amount
        CP: 999999,               // Max CP
        LEVEL: 150,               // Max level
        COLLECTION_SIZE: 1000,    // Max fruits in collection
        DAILY_PULLS: 100,         // Max pulls per day
        PVP_BATTLES_DAILY: 50     // Max PvP battles per day
    },

    // Cooldown periods (in seconds)
    COOLDOWNS: {
        PULL: 3,                  // Basic pull cooldown
        INCOME: 60,               // Manual income cooldown
        PVP_BATTLE: 300,          // PvP battle cooldown after loss
        TRADE: 300,               // Trade cooldown
        PRESTIGE: 86400,          // Prestige cooldown (24 hours)
        DAILY_RESET: 86400        // Daily reset cooldown
    },

    // Special Events Configuration
    EVENTS: {
        DOUBLE_RATES: {
            name: 'Double Drop Rates',
            description: 'All rarity rates doubled!',
            multiplier: 2,
            icon: '🎉'
        },
        BERRY_BONUS: {
            name: 'Berry Bonus Weekend',
            description: '50% more berries from income!',
            multiplier: 1.5,
            icon: '💰'
        },
        PVP_TOURNAMENT: {
            name: 'PvP Tournament',
            description: 'Special PvP rewards available!',
            multiplier: 1,
            icon: '🏆'
        }
    }
};
