// src/data/DevilFruitEffects.js - Special Effects System for Devil Fruits
const { DEVIL_FRUITS } = require('./DevilFruits');

/**
 * SPECIAL EFFECTS CATEGORIES
 */
const EFFECT_TYPES = {
    // Combat Effects
    IMMUNITY: 'immunity',           // Immune to certain damage types
    RESISTANCE: 'resistance',       // Reduced damage from certain sources
    VULNERABILITY: 'vulnerability', // Increased damage from certain sources
    
    // Status Effects
    PARALYSIS: 'paralysis',         // Cannot move/act
    POISON: 'poison',               // Damage over time
    BURN: 'burn',                   // Fire damage over time
    FREEZE: 'freeze',               // Cannot act for turns
    CHARM: 'charm',                 // Enemy becomes ally temporarily
    FEAR: 'fear',                   // Reduced attack power
    
    // Utility Effects
    FLIGHT: 'flight',               // Can fly/hover
    UNDERWATER: 'underwater',       // Can breathe/move underwater
    REGENERATION: 'regeneration',   // Health restoration over time
    STEALTH: 'stealth',            // Become invisible/hidden
    TELEPORT: 'teleport',          // Instant movement
    TRANSFORMATION: 'transformation', // Change form/appearance
    
    // Environmental Effects
    WEATHER_CONTROL: 'weather_control', // Control weather patterns
    TERRAIN_CHANGE: 'terrain_change',   // Alter battlefield
    GRAVITY_MANIPULATION: 'gravity',    // Control gravity
    TIME_MANIPULATION: 'time',          // Affect time flow
    
    // Special Abilities
    SOUL_MANIPULATION: 'soul',          // Affect souls/spirits
    MEMORY_MANIPULATION: 'memory',      // Alter memories
    EMOTION_MANIPULATION: 'emotion',    // Control emotions
    DIMENSIONAL: 'dimensional',         // Cross dimensions/spaces
    PROBABILITY: 'probability',         // Affect luck/chance
    REVIVAL: 'revival'                  // Return from death
};

/**
 * SPECIAL EFFECTS DATABASE
 * Each fruit can have multiple special effects beyond basic combat
 */
const DEVIL_FRUIT_EFFECTS = {
    // ===== DIVINE TIER EFFECTS =====
    "yami_yami_gura_gura_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.IMMUNITY,
                name: "Devil Fruit Nullification",
                description: "Completely nullifies other Devil Fruit powers on contact",
                trigger: "on_touch",
                duration: "instant",
                power_level: 10
            },
            {
                type: EFFECT_TYPES.TERRAIN_CHANGE,
                name: "World Destruction",
                description: "Can literally crack the world and destroy islands",
                trigger: "active",
                duration: "permanent",
                power_level: 10
            }
        ],
        passive_effects: [
            {
                type: EFFECT_TYPES.VULNERABILITY,
                name: "Increased Pain Sensitivity",
                description: "Takes 2x damage from all attacks due to darkness absorption",
                condition: "always_active"
            }
        ],
        ultimate_ability: {
            name: "Black Hole Earthquake",
            description: "Creates a gravitational vortex that destroys everything while causing massive earthquakes",
            cooldown: 300,
            power_level: 10
        }
    },

    "gomu_gomu_nika_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.IMMUNITY,
                name: "Blunt Force Immunity",
                description: "Completely immune to blunt attacks, bullets, and physical strikes",
                trigger: "on_hit",
                duration: "permanent",
                power_level: 9
            },
            {
                type: EFFECT_TYPES.PROBABILITY,
                name: "Toon Force",
                description: "Reality bends to create the most ridiculous and joyful outcome",
                trigger: "when_laughing",
                duration: "combat",
                power_level: 10
            },
            {
                type: EFFECT_TYPES.TRANSFORMATION,
                name: "Gear Transformations",
                description: "Multiple powerful transformation modes (Gear 2, 3, 4, 5)",
                trigger: "active",
                duration: "sustained",
                power_level: 9
            }
        ],
        awakened_effects: [
            {
                type: EFFECT_TYPES.TERRAIN_CHANGE,
                name: "Rubber Environment",
                description: "Turn surroundings into rubber for enhanced mobility and attacks",
                trigger: "awakening",
                duration: "sustained"
            }
        ],
        liberation_power: {
            name: "Liberation of All",
            description: "Frees people from oppression and brings joy to the world",
            scope: "global",
            power_level: 10
        }
    },

    "gura_gura_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.TERRAIN_CHANGE,
                name: "Earthquake Generation",
                description: "Create devastating earthquakes that can split islands",
                trigger: "active",
                duration: "instant",
                power_level: 9
            },
            {
                type: EFFECT_TYPES.WEATHER_CONTROL,
                name: "Tsunami Creation",
                description: "Generate massive tsunamis by shaking the ocean",
                trigger: "active",
                duration: "extended",
                power_level: 9
            }
        ],
        special_techniques: [
            {
                name: "Air Quake",
                description: "Punch the air itself to create shockwaves",
                range: "long_distance"
            },
            {
                name: "Focused Tremor",
                description: "Concentrate all power into a single devastating point",
                effect: "single_target_destruction"
            }
        ]
    },

    // ===== MYTHICAL TIER EFFECTS =====
    "goro_goro_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.TELEPORT,
                name: "Lightning Speed Travel",
                description: "Move at literal speed of light through conductors",
                trigger: "active",
                duration: "instant",
                power_level: 8
            },
            {
                type: EFFECT_TYPES.PARALYSIS,
                name: "Electric Paralysis",
                description: "Paralyze enemies with electric shocks",
                trigger: "on_hit",
                duration: "3_turns",
                power_level: 7
            }
        ],
        observation_enhancement: {
            name: "Electromagnetic Mantra",
            description: "Enhanced observation Haki through electromagnetic waves",
            range: "island_wide"
        },
        ultimate_techniques: [
            {
                name: "200 Million Volt Amaru",
                description: "Transform into a giant lightning god form",
                power_level: 9
            },
            {
                name: "Raigo",
                description: "Drop massive lightning spheres that destroy everything",
                power_level: 8
            }
        ]
    },

    "mera_mera_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.BURN,
                name: "Intense Flames",
                description: "Burns continue to damage over time",
                trigger: "on_hit",
                duration: "5_turns",
                power_level: 7
            },
            {
                type: EFFECT_TYPES.FLIGHT,
                name: "Fire Propulsion",
                description: "Fly using flames as propulsion",
                trigger: "active",
                duration: "sustained",
                power_level: 6
            }
        ],
        elemental_interactions: {
            strong_against: ["ice", "plant", "paper"],
            weak_against: ["magma", "water"],
            neutral: ["lightning", "earth"]
        }
    },

    // ===== LEGENDARY TIER EFFECTS =====
    "ope_ope_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.DIMENSIONAL,
                name: "Room Creation",
                description: "Create spherical space where user has complete control",
                trigger: "active",
                duration: "sustained",
                power_level: 8
            },
            {
                type: EFFECT_TYPES.TELEPORT,
                name: "Shambles",
                description: "Instantly swap positions of objects within Room",
                trigger: "active",
                duration: "instant",
                power_level: 7
            }
        ],
        medical_abilities: [
            {
                name: "Surgery",
                description: "Perform impossible surgeries without harming the patient",
                effect: "healing"
            },
            {
                name: "Personality Swap",
                description: "Switch personalities between bodies",
                effect: "mind_control"
            }
        ],
        ultimate_technique: {
            name: "Immortality Surgery",
            description: "Grant eternal life at the cost of the user's own life",
            power_level: 10,
            cost: "user_death"
        }
    },

    "nikyu_nikyu_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.TELEPORT,
                name: "Paw Bubble Travel",
                description: "Travel anywhere at light speed via paw bubble",
                trigger: "active",
                duration: "instant",
                power_level: 8
            },
            {
                type: EFFECT_TYPES.EMOTION_MANIPULATION,
                name: "Pain Extraction",
                description: "Extract and redistribute pain and fatigue",
                trigger: "active",
                duration: "permanent",
                power_level: 7
            }
        ],
        unique_abilities: [
            {
                name: "Memory Repel",
                description: "Push out memories from someone's mind",
                effect: "memory_manipulation"
            },
            {
                name: "Damage Repel",
                description: "Repel any attack or damage taken",
                effect: "damage_immunity"
            }
        ]
    },

    // ===== EPIC TIER EFFECTS =====
    "hobi_hobi_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.TRANSFORMATION,
                name: "Toy Transformation",
                description: "Transform anyone into a toy permanently",
                trigger: "on_touch",
                duration: "permanent",
                power_level: 9
            },
            {
                type: EFFECT_TYPES.MEMORY_MANIPULATION,
                name: "Memory Erasure",
                description: "Erase all memories of transformed person from everyone",
                trigger: "on_transformation",
                duration: "permanent",
                power_level: 8
            }
        ],
        contract_system: {
            name: "Toy Contract",
            description: "Transformed toys must obey absolute commands",
            breaking_condition: "user_unconsciousness"
        }
    },

    "hana_hana_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.DIMENSIONAL,
                name: "Body Part Sprouting",
                description: "Sprout body parts from any visible surface",
                trigger: "active",
                duration: "sustained",
                power_level: 6
            }
        ],
        advanced_techniques: [
            {
                name: "Gigantesco Mano",
                description: "Create giant limbs for massive attacks",
                power_multiplier: 10
            },
            {
                name: "Demonio Fleur",
                description: "Demonic form with enhanced sprouting abilities",
                awakening_hint: true
            }
        ],
        utility_uses: [
            "Espionage (eyes and ears anywhere)",
            "Restraint (multiple arms for capturing)",
            "Assassination (snap necks instantly)"
        ]
    },

    // ===== RARE TIER EFFECTS =====
    "mero_mero_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.CHARM,
                name: "Love Beam Petrification",
                description: "Turn those attracted to user into stone",
                trigger: "active",
                duration: "permanent",
                power_level: 7
            }
        ],
        immunity_conditions: [
            "No attraction to user",
            "Pure hatred",
            "Complete focus on something else"
        ]
    },

    "yomi_yomi_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.REVIVAL,
                name: "Second Life",
                description: "Return from death once",
                trigger: "on_death",
                duration: "one_time",
                power_level: 8
            },
            {
                type: EFFECT_TYPES.SOUL_MANIPULATION,
                name: "Soul Projection",
                description: "Separate soul from body for astral projection",
                trigger: "active",
                duration: "sustained",
                power_level: 6
            }
        ],
        soul_abilities: [
            {
                name: "Soul Solid",
                description: "Solidify soul energy into ice-like attacks",
                element: "soul_ice"
            },
            {
                name: "Soul Parade",
                description: "Command souls of the dead",
                power_level: 7
            }
        ]
    },

    // ===== COMMON/UNCOMMON EXAMPLES =====
    "bara_bara_no_mi": {
        primary_effects: [
            {
                type: EFFECT_TYPES.IMMUNITY,
                name: "Slash Immunity",
                description: "Completely immune to cutting/slashing attacks",
                trigger: "on_hit",
                duration: "permanent",
                power_level: 5
            }
        ],
        limitations: [
            "Feet must remain on ground",
            "Body parts have limited range",
            "Vulnerable to blunt attacks"
        ]
    }
};

/**
 * EFFECT CALCULATION FUNCTIONS
 */
class DevilFruitEffectManager {
    static getEffects(fruitId) {
        return DEVIL_FRUIT_EFFECTS[fruitId] || null;
    }

    static hasEffect(fruitId, effectType) {
        const effects = this.getEffects(fruitId);
        if (!effects) return false;

        return (
            effects.primary_effects?.some(e => e.type === effectType) ||
            effects.passive_effects?.some(e => e.type === effectType) ||
            effects.awakened_effects?.some(e => e.type === effectType)
        );
    }

    static getEffectPower(fruitId, effectType) {
        const effects = this.getEffects(fruitId);
        if (!effects) return 0;

        const allEffects = [
            ...(effects.primary_effects || []),
            ...(effects.passive_effects || []),
            ...(effects.awakened_effects || [])
        ];

        const effect = allEffects.find(e => e.type === effectType);
        return effect?.power_level || 0;
    }

    static formatEffectsForDisplay(fruitId) {
        const effects = this.getEffects(fruitId);
        if (!effects) return "No special effects documented.";

        let display = "";

        // Primary Effects
        if (effects.primary_effects?.length) {
            display += "🌟 **Primary Effects:**\n";
            effects.primary_effects.forEach(effect => {
                display += `• **${effect.name}**: ${effect.description}\n`;
            });
            display += "\n";
        }

        // Passive Effects
        if (effects.passive_effects?.length) {
            display += "🔄 **Passive Effects:**\n";
            effects.passive_effects.forEach(effect => {
                display += `• **${effect.name}**: ${effect.description}\n`;
            });
            display += "\n";
        }

        // Ultimate Abilities
        if (effects.ultimate_ability || effects.ultimate_technique) {
            const ultimate = effects.ultimate_ability || effects.ultimate_technique;
            display += `💥 **Ultimate Technique:**\n`;
            display += `• **${ultimate.name}**: ${ultimate.description}\n\n`;
        }

        // Elemental Interactions
        if (effects.elemental_interactions) {
            const interactions = effects.elemental_interactions;
            display += "⚔️ **Elemental Interactions:**\n";
            if (interactions.strong_against?.length) {
                display += `• Strong vs: ${interactions.strong_against.join(', ')}\n`;
            }
            if (interactions.weak_against?.length) {
                display += `• Weak vs: ${interactions.weak_against.join(', ')}\n`;
            }
            display += "\n";
        }

        // Limitations
        if (effects.limitations?.length) {
            display += "⚠️ **Limitations:**\n";
            effects.limitations.forEach(limitation => {
                display += `• ${limitation}\n`;
            });
        }

        return display.trim();
    }

    static getEffectsByType(effectType) {
        const fruitsWithEffect = [];
        
        Object.entries(DEVIL_FRUIT_EFFECTS).forEach(([fruitId, effects]) => {
            if (this.hasEffect(fruitId, effectType)) {
                const fruitData = DEVIL_FRUITS[fruitId];
                if (fruitData) {
                    fruitsWithEffect.push({
                        fruitId,
                        name: fruitData.name,
                        rarity: fruitData.rarity,
                        user: fruitData.user,
                        power: this.getEffectPower(fruitId, effectType)
                    });
                }
            }
        });

        return fruitsWithEffect.sort((a, b) => b.power - a.power);
    }

    static searchEffects(query) {
        const results = [];
        const searchTerm = query.toLowerCase();

        Object.entries(DEVIL_FRUIT_EFFECTS).forEach(([fruitId, effects]) => {
            const fruitData = DEVIL_FRUITS[fruitId];
            if (!fruitData) return;

            const allEffects = [
                ...(effects.primary_effects || []),
                ...(effects.passive_effects || []),
                ...(effects.awakened_effects || [])
            ];

            const matchingEffects = allEffects.filter(effect => 
                effect.name.toLowerCase().includes(searchTerm) ||
                effect.description.toLowerCase().includes(searchTerm) ||
                effect.type.includes(searchTerm)
            );

            if (matchingEffects.length > 0) {
                results.push({
                    fruitId,
                    name: fruitData.name,
                    rarity: fruitData.rarity,
                    user: fruitData.user,
                    matchingEffects
                });
            }
        });

        return results;
    }

    static getRandomEffect() {
        const allFruitIds = Object.keys(DEVIL_FRUIT_EFFECTS);
        const randomFruitId = allFruitIds[Math.floor(Math.random() * allFruitIds.length)];
        const effects = DEVIL_FRUIT_EFFECTS[randomFruitId];
        
        const allEffects = [
            ...(effects.primary_effects || []),
            ...(effects.passive_effects || []),
            ...(effects.awakened_effects || [])
        ];

        if (allEffects.length === 0) return null;

        const randomEffect = allEffects[Math.floor(Math.random() * allEffects.length)];
        const fruitData = DEVIL_FRUITS[randomFruitId];

        return {
            fruitId: randomFruitId,
            fruitName: fruitData.name,
            fruitUser: fruitData.user,
            effect: randomEffect
        };
    }
}

/**
 * INTEGRATION WITH EXISTING SYSTEMS
 */
function enhanceFruitWithEffects(fruitData) {
    const effects = DevilFruitEffectManager.getEffects(fruitData.id);
    
    return {
        ...fruitData,
        special_effects: effects,
        has_special_effects: !!effects,
        effect_count: effects ? (
            (effects.primary_effects?.length || 0) + 
            (effects.passive_effects?.length || 0) + 
            (effects.awakened_effects?.length || 0)
        ) : 0
    };
}

module.exports = {
    EFFECT_TYPES,
    DEVIL_FRUIT_EFFECTS,
    DevilFruitEffectManager,
    enhanceFruitWithEffects
};
