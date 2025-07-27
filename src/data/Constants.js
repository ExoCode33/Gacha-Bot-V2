// src/data/Constants.js - UPDATED: Added PvP Constants
const { ActivityType } = require('discord.js');

// =====================================================
// EXISTING CONSTANTS (keeping your current ones)
// =====================================================

// Rarity colors for embeds
const RARITY_COLORS = {
    common: '#808080',     // Gray
    uncommon: '#00FF00',   // Green
    rare: '#0080FF',       // Blue
    epic: '#800080',       // Purple
    legendary: '#FFD700',  // Gold
    mythical: '#FF8000',   // Orange
    divine: '#FFFFFF'      // White
};

// Rarity emojis
const RARITY_EMOJIS = {
    common: '⚪',
    uncommon: '🟢',
    rare: '🔵', 
    epic: '🟣',
    legendary: '🌟',
    mythical: '🟠',
    divine: '✨'
};

// Base pull rates (percentages)
const BASE_PULL_RATES = {
    common: 45.0,      // 45%
    uncommon: 30.0,    // 30%
    rare: 15.0,        // 15%
    epic: 7.0,         // 7%
    legendary: 2.5,    // 2.5%
    mythical: 0.45,    // 0.45%
    divine: 0.05       // 0.05%
};

// Pity system configuration
const PITY_SYSTEM = {
    HARD_PITY_LIMIT: 200,        // Guaranteed at 200 pulls
    SCALING_POWER: 2,            // Exponential scaling
    MAX_PITY_CHANCE: 85,         // Max 85% chance
    PREMIUM_RATES: {
        divine: 15,              // 15% for divine when pity triggers
        mythical: 85             // 85% for mythical when pity triggers
    }
};

// Bot activity messages
const BOT_ACTIVITIES = [
    { name: 'the Grand Line for Devil Fruits! 🍈', type: ActivityType.Watching },
    { name: 'pirates battle for supremacy! ⚔️', type: ActivityType.Watching },
    { name: 'Devil Fruit powers awaken! ✨', type: ActivityType.Watching },
    { name: 'treasure hunters on their journey! 🏴‍☠️', type: ActivityType.Watching },
    { name: 'epic battles unfold! 💥', type: ActivityType.Watching }
];

// =====================================================
// NEW PvP CONSTANTS
// =====================================================

// Fruit weight system for PvP team building
const FRUIT_WEIGHTS = {
    common: 1,        // 1 weight point
    uncommon: 2,      // 2 weight points
    rare: 3,          // 3 weight points
    epic: 4,          // 4 weight points
    legendary: 6,     // 6 weight points
    mythical: 8,      // 8 weight points
    divine: 10        // 10 weight points
};

// Maximum team weight allowed
const MAX_TEAM_WEIGHT = 20;

// Battle constants for PvP combat
const BATTLE_CONSTANTS = {
    BASE_HP: 1000,                    // Base HP for all players
    HP_PER_LEVEL: 50,                 // HP bonus per level
    CP_TO_HP_RATIO: 0.5,              // CP to HP conversion ratio
    MAX_TURNS: 50,                    // Maximum turns before draw
    CRIT_CHANCE: 0.15,                // 15% critical hit chance
    CRIT_MULTIPLIER: 1.5,             // 1.5x damage on critical
    DODGE_CHANCE: 0.1,                // 10% dodge chance
    STATUS_STACK_LIMIT: 3,            // Maximum status effect stacks
    TURN_TIME_LIMIT: 120,             // 2 minutes per turn (in seconds)
    BATTLE_TIME_LIMIT: 1800           // 30 minutes total battle time
};

// PvP rank system
const PVP_RANKS = {
    UNRANKED: { name: 'Unranked', minPoints: 0, color: '#808080', emoji: '⚪' },
    ROOKIE: { name: 'Rookie', minPoints: 800, color: '#8B4513', emoji: '🌰' },
    SUPERNOVA: { name: 'Supernova', minPoints: 1200, color: '#32CD32', emoji: '⭐' },
    SHICHIBUKAI: { name: 'Shichibukai', minPoints: 1600, color: '#4169E1', emoji: '👑' },
    YONKO: { name: 'Yonko', minPoints: 2000, color: '#FF4500', emoji: '👑' },
    PIRATE_KING: { name: 'Pirate King', minPoints: 2500, color: '#FFD700', emoji: '🏆' }
};

// Battle emojis
const BATTLE_EMOJIS = {
    WIN: '🏆',
    LOSS: '💀',
    DRAW: '🤝',
    CRITICAL: '💥',
    DODGE: '💨',
    HEAL: '💚',
    DAMAGE: '⚡',
    DEFEND: '🛡️',
    SKILL: '✨',
    ATTACK: '⚔️',
    FORFEIT: '🏃',
    TIMEOUT: '⏰'
};

// Status effects for battle system
const STATUS_EFFECTS = {
    // Damage over time
    burn: {
        type: 'dot',
        duration: 3,
        value: 50,
        stackable: true,
        icon: '🔥',
        name: 'Burn'
    },
    poison: {
        type: 'dot',
        duration: 2,
        value: 40,
        stackable: true,
        icon: '☠️',
        name: 'Poison'
    },
    bleed: {
        type: 'dot',
        duration: 2,
        value: 30,
        stackable: true,
        icon: '🩸',
        name: 'Bleeding'
    },
    
    // Debuffs
    freeze: {
        type: 'disable',
        duration: 1,
        icon: '❄️',
        name: 'Frozen'
    },
    stun: {
        type: 'disable',
        duration: 1,
        icon: '⚡',
        name: 'Stunned'
    },
    slow: {
        type: 'debuff',
        duration: 2,
        value: -0.3,
        effect: 'speed',
        icon: '🐌',
        name: 'Slowed'
    },
    weaken: {
        type: 'debuff',
        duration: 3,
        value: -0.2,
        effect: 'damage',
        icon: '💔',
        name: 'Weakened'
    },
    
    // Buffs
    strength: {
        type: 'buff',
        duration: 3,
        value: 0.3,
        effect: 'damage',
        stackable: false,
        icon: '💪',
        name: 'Strengthened'
    },
    speed: {
        type: 'buff',
        duration: 2,
        value: 0.2,
        effect: 'speed',
        stackable: false,
        icon: '💨',
        name: 'Haste'
    },
    regen: {
        type: 'heal',
        duration: 3,
        value: 80,
        stackable: true,
        icon: '💚',
        name: 'Regeneration'
    },
    
    // Special effects
    immunity: {
        type: 'immunity',
        duration: 2,
        effect: 'debuff',
        icon: '🛡️',
        name: 'Immunity'
    },
    reflect: {
        type: 'reflect',
        duration: 1,
        value: 0.5,
        icon: '🪞',
        name: 'Reflect'
    }
};

// Battle action types
const BATTLE_ACTIONS = {
    ATTACK: 'attack',
    SKILL: 'skill',
    DEFEND: 'defend',
    SWITCH: 'switch',
    FORFEIT: 'forfeit'
};

// Battle types
const BATTLE_TYPES = {
    RANKED: 'ranked',
    FRIENDLY: 'friendly',
    TOURNAMENT: 'tournament',
    CHALLENGE: 'challenge'
};

// Matchmaking preferences
const MATCHMAKING = {
    MAX_QUEUE_TIME: 300,              // 5 minutes max queue time
    CP_TOLERANCE: 0.3,                // 30% CP difference tolerance
    RANK_TOLERANCE: 2,                // Maximum 2 rank difference
    PREFERRED_QUEUE_SIZE: 10,         // Ideal queue size for matching
    QUEUE_CHECK_INTERVAL: 5000        // Check queue every 5 seconds
};

// Reward calculations
const REWARD_MULTIPLIERS = {
    WIN: {
        berries: 1000,
        rankPoints: 25,
        experienceBonus: 1.5
    },
    LOSS: {
        berries: 200,
        rankPoints: -10,
        experienceBonus: 1.0
    },
    DRAW: {
        berries: 400,
        rankPoints: 5,
        experienceBonus: 1.2
    },
    FORFEIT: {
        berries: 50,
        rankPoints: -20,
        experienceBonus: 0.5
    }
};

// Team building constraints
const TEAM_BUILDING = {
    MIN_TEAM_SIZE: 1,                 // Minimum fruits in team
    MAX_TEAM_SIZE: 8,                 // Maximum fruits in team
    MAX_WEIGHT: 20,                   // Maximum total weight
    SELECTION_TIME_LIMIT: 300,        // 5 minutes to select team
    PRESET_SLOTS: 5                   // Number of preset team slots
};

// Battle phases
const BATTLE_PHASES = {
    CHALLENGE: 'challenge',           // Initial challenge phase
    TEAM_SELECTION: 'team_selection', // Team building phase
    PREPARATION: 'preparation',       // Pre-battle preparation
    COMBAT: 'combat',                 // Active combat
    RESOLUTION: 'resolution',         // Battle end and rewards
    COMPLETED: 'completed'            // Battle fully completed
};

// Challenge timeouts
const CHALLENGE_TIMEOUTS = {
    CHALLENGE_ACCEPT: 600,            // 10 minutes to accept challenge
    TEAM_SELECTION: 300,              // 5 minutes for team selection
    TURN_TIME: 120,                   // 2 minutes per turn
    TOTAL_BATTLE: 1800               // 30 minutes total battle time
};

// Skill cooldown categories
const SKILL_COOLDOWNS = {
    BASIC: 0,                         // No cooldown
    SHORT: 1,                         // 1 turn cooldown
    MEDIUM: 3,                        // 3 turn cooldown
    LONG: 5,                          // 5 turn cooldown
    ULTIMATE: 8                       // 8 turn cooldown
};

// Combat calculation modifiers
const COMBAT_MODIFIERS = {
    RARITY_DAMAGE_BONUS: {
        common: 1.0,
        uncommon: 1.1,
        rare: 1.2,
        epic: 1.4,
        legendary: 1.7,
        mythical: 2.0,
        divine: 2.5
    },
    TYPE_EFFECTIVENESS: {
        // Future type effectiveness system
        // logia: { paramecia: 1.1, zoan: 0.9, logia: 1.0 },
        // paramecia: { logia: 0.9, zoan: 1.1, paramecia: 1.0 },
        // zoan: { paramecia: 0.9, logia: 1.1, zoan: 1.0 }
    },
    LEVEL_SCALING: 0.05,              // 5% damage bonus per level difference
    CP_SCALING: 0.0001                // Tiny CP scaling for balance
};

// Tournament system
const TOURNAMENTS = {
    BRACKET_SIZES: [4, 8, 16, 32],    // Supported tournament sizes
    REGISTRATION_TIME: 1800,          // 30 minutes registration
    MATCH_TIME_LIMIT: 900,            // 15 minutes per match
    ADVANCEMENT_TIMEOUT: 300,         // 5 minutes to advance to next round
    MIN_PARTICIPANTS: 4,              // Minimum players for tournament
    MAX_PARTICIPANTS: 32              // Maximum players for tournament
};

// Leaderboard configurations
const LEADERBOARDS = {
    GLOBAL_TOP: 100,                  // Show top 100 globally
    GUILD_TOP: 50,                    // Show top 50 per guild
    SEASON_LENGTH: 90,                // 90 days per season
    RESET_REWARDS: {
        TOP_1: { berries: 100000, title: 'Season Champion' },
        TOP_10: { berries: 50000, title: 'Elite Fighter' },
        TOP_100: { berries: 25000, title: 'Skilled Warrior' }
    }
};

// Error messages for PvP
const PVP_ERROR_MESSAGES = {
    USER_IN_BATTLE: 'You are already in an active battle!',
    OPPONENT_IN_BATTLE: 'Your opponent is already in a battle!',
    INVALID_TEAM_WEIGHT: 'Your team exceeds the maximum weight limit!',
    INSUFFICIENT_FRUITS: 'You need at least one Devil Fruit to battle!',
    BATTLE_NOT_FOUND: 'Battle not found or has already ended!',
    NOT_YOUR_TURN: 'It\'s not your turn! Wait for your opponent.',
    SKILL_ON_COOLDOWN: 'This skill is on cooldown!',
    INVALID_ACTION: 'Invalid battle action!',
    TEAM_SELECTION_TIMEOUT: 'Team selection time has expired!',
    CHALLENGE_EXPIRED: 'The challenge has expired!',
    CHALLENGE_DECLINED: 'The challenge was declined!',
    QUEUE_TIMEOUT: 'Matchmaking timed out. Please try again.',
    RANK_TOO_DIFFERENT: 'Rank difference is too large for matchmaking!'
};

// Success messages for PvP
const PVP_SUCCESS_MESSAGES = {
    CHALLENGE_SENT: 'Challenge sent successfully!',
    CHALLENGE_ACCEPTED: 'Challenge accepted! Prepare for battle!',
    TEAM_READY: 'Team is ready for battle!',
    BATTLE_WON: 'Victory achieved! Well fought!',
    BATTLE_LOST: 'Defeat... but you fought with honor!',
    RANKED_UP: 'Congratulations! You have ranked up!',
    RANKED_DOWN: 'You have been demoted to a lower rank.',
    QUEUE_JOINED: 'Joined matchmaking queue!',
    MATCH_FOUND: 'Match found! Prepare for battle!',
    TOURNAMENT_REGISTERED: 'Successfully registered for tournament!',
    TOURNAMENT_WON: 'Tournament victory! You are the champion!'
};

// Export all constants
module.exports = {
    // Existing constants
    RARITY_COLORS,
    RARITY_EMOJIS,
    BASE_PULL_RATES,
    PITY_SYSTEM,
    BOT_ACTIVITIES,
    
    // New PvP constants
    FRUIT_WEIGHTS,
    MAX_TEAM_WEIGHT,
    BATTLE_CONSTANTS,
    PVP_RANKS,
    BATTLE_EMOJIS,
    STATUS_EFFECTS,
    BATTLE_ACTIONS,
    BATTLE_TYPES,
    MATCHMAKING,
    REWARD_MULTIPLIERS,
    TEAM_BUILDING,
    BATTLE_PHASES,
    CHALLENGE_TIMEOUTS,
    SKILL_COOLDOWNS,
    COMBAT_MODIFIERS,
    TOURNAMENTS,
    LEADERBOARDS,
    PVP_ERROR_MESSAGES,
    PVP_SUCCESS_MESSAGES
};
