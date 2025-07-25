// src/data/Constants.js - Updated Game Constants for Enhanced Devil Fruit System
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
        divine: '#FFFFFF'      // White (New Divine Tier)
    },
    
    // Enhanced Rarity Emojis
    RARITY_EMOJIS: {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        legendary: '🌟',
        mythical: '🟠',
        divine: '✨'           // New Divine Tier
    },

    // Rarity Names (formatted)
    RARITY_NAMES: {
        common: 'Common',
        uncommon: 'Uncommon',
        rare: 'Rare',
        epic: 'Epic',
        legendary: 'Legendary',
        mythical: 'Mythical',
        divine: 'Divine'       // New Divine Tier
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
    
    // Enhanced Pull Rates (updated for divine tier)
    BASE_PULL_RATES: {
        common: 47,
        uncommon: 30,
        rare: 15,
        epic: 5,
        legendary: 2,
        mythical: 0.8,
        divine: 0.2            // New Divine Tier
    },

    // Enhanced Pity System
    PITY_SYSTEM: {
        SOFT_PITY_START: 50,
        HARD_PITY_START: 75,
        GUARANTEED_LEGENDARY: 90,
        GUARANTEED_MYTHICAL: 150,  // Very rare guarantee
        GUARANTEED_DIVINE: 500,    // Ultra rare guarantee
        PITY_INCREASE_PER_PULL: 0.5 // % increase per pull
    },
    
    // CP Multipliers by rarity (enhanced)
    CP_MULTIPLIERS: {
        common: { min: 1.0, max: 1.2 },
        uncommon: { min: 1.2, max: 1.4 },
        rare: { min: 1.4, max: 1.7 },
        epic: { min: 1.7, max: 2.1 },
        legendary: { min: 2.1, max: 2.6 },
        mythical: { min: 2.6, max: 3.2 },
        divine: { min: 3.2, max: 4.0 }    // New Divine Tier
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
    TRADE
