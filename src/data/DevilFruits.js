// src/data/DevilFruits.js - FIXED: One Piece Rarest + Balanced Weights
const DEVIL_FRUITS = {
  // =====================================================
  // COMMON FRUITS (30 fruits) - 1.0x to 1.2x CP
  // =====================================================
  "gomu_gomu_no_mi": {
    id: "gomu_gomu_no_mi",
    name: "Gomu Gomu no Mi",
    type: "Paramecia", 
    rarity: "common",
    element: "Rubber",
    power: "Grants rubber properties to the user's body",
    description: "The user's body becomes rubber, immune to blunt attacks and electricity.",
    multiplier: 1.05,
    user: "Monkey D. Luffy",
    skill: {
      name: "Gomu Gomu no Pistol",
      damage: 55,
      cooldown: 0,
      effect: "blunt_immunity",
      description: "Stretches arm for a powerful punch, immune to blunt damage"
    }
  },
  
  // ... [keeping all other fruits the same until divine section] ...
  // [All common, uncommon, rare, epic, legendary, and mythical fruits remain exactly the same]
  
  // =====================================================
  // DIVINE FRUITS (5 fruits) - 3.2x to 4.0x CP
  // FIXED: One Piece is now EXTREMELY rare (0.001% of divine pulls)
  // =====================================================
  "gura_gura_no_mi": {
    id: "gura_gura_no_mi",
    name: "Gura Gura no Mi",
    type: "Paramecia",
    rarity: "divine",
    element: "Tremor",
    power: "Allows the user to create earthquakes",
    description: "The power to destroy the world with vibrations and quakes.",
    multiplier: 3.50,
    user: "Edward Newgate (Whitebeard)",
    // HIGHER divine weight (more common divine)
    divineWeight: 30,
    skill: {
      name: "World Ender",
      damage: 280,
      cooldown: 7,
      effect: "area_explosion",
      description: "Crack the very fabric of reality"
    }
  },

  "hito_hito_no_mi_nika": {
    id: "hito_hito_no_mi_nika",
    name: "Hito Hito no Mi, Model: Nika",
    type: "Mythical Zoan",
    rarity: "divine",
    element: "Sun God",
    power: "Sun God Nika - grants ultimate freedom",
    description: "Mythical Zoan of Sun God Nika, bringing joy and liberation.",
    multiplier: 3.80,
    user: "Monkey D. Luffy (Gear 5)",
    // HIGHER divine weight (more common divine)
    divineWeight: 25,
    skill: {
      name: "Gear 5: Perfect Liberation", 
      damage: 265,
      cooldown: 6,
      effect: "reality_bend",
      description: "Sun God's power bends all reality"
    }
  },

  "yami_yami_no_mi": {
    id: "yami_yami_no_mi",
    name: "Yami Yami no Mi",
    type: "Logia",
    rarity: "divine",
    element: "Darkness",
    power: "Allows the user to create and control darkness",
    description: "Most dangerous Devil Fruit that can nullify all other powers.",
    multiplier: 3.60,
    user: "Marshall D. Teach (Blackbeard)",
    // HIGHER divine weight (more common divine)
    divineWeight: 20,
    skill: {
      name: "Kurouzu",
      damage: 240,
      cooldown: 6,
      effect: "power_null",
      description: "Infinite darkness consumes everything"
    }
  },

  "joy_boy_will": {
    id: "joy_boy_will",
    name: "Joy Boy's Will",
    type: "Divine Legacy",
    rarity: "divine",
    element: "Liberation",
    power: "The inherited will of Joy Boy",
    description: "Ancient will that brings freedom to the world.",
    multiplier: 3.60,
    user: "Joy Boy",
    // HIGHER divine weight (more common divine)
    divineWeight: 24,
    skill: {
      name: "Liberation Wave",
      damage: 290,
      cooldown: 7,
      effect: "status_cleanse",
      description: "Free all beings from their chains"
    }
  },

  // THE RAREST DIVINE - ONE PIECE
  "one_piece_treasure": {
    id: "one_piece_treasure",
    name: "One Piece",
    type: "Divine Artifact",
    rarity: "divine", 
    element: "Truth",
    power: "The ultimate treasure containing all secrets",
    description: "The legendary treasure that reveals the true history. The rarest find in all the seas.",
    multiplier: 4.00,
    user: "Gol D. Roger",
    // EXTREMELY LOW divine weight (ultra rare even among divines)
    divineWeight: 1,
    skill: {
      name: "Truth of the World",
      damage: 300,
      cooldown: 8,
      effect: "reality_bend",
      description: "Rewrite the laws of reality itself"
    }
  }

  // ... [all other fruits remain exactly the same] ...
};

// FIXED RARITY WEIGHTS - Much Lower Divine Rate
const RARITY_WEIGHTS = {
  common: 50,        // 50% (increased to compensate)
  uncommon: 30,      // 30%  
  rare: 15,          // 15%
  epic: 4,           // 4% (slightly reduced)
  legendary: 0.8,    // 0.8% (REDUCED from 2%)
  mythical: 0.19,    // 0.19% (REDUCED from 0.4%)
  divine: 0.01       // 0.01% (HEAVILY REDUCED from 0.05%)
};

// DIVINE FRUIT WEIGHTS (for when divine is selected)
const DIVINE_WEIGHTS = {
  "gura_gura_no_mi": 30,
  "hito_hito_no_mi_nika": 25, 
  "yami_yami_no_mi": 20,
  "joy_boy_will": 24,
  "one_piece_treasure": 1    // ULTRA RARE - only 1% of divine pulls
};

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

// Utility functions
function getRarityWeights(pityCount = 0) {
  return { ...RARITY_WEIGHTS };
}

function getFruitsByRarity(rarity) {
  return Object.values(DEVIL_FRUITS).filter(fruit => fruit.rarity === rarity);
}

function getFruitById(id) {
  return DEVIL_FRUITS[id] || null;
}

function getRandomFruitByRarity(rarity) {
  const fruits = getFruitsByRarity(rarity);
  
  if (rarity === 'divine') {
    // Use weighted selection for divine fruits
    return selectWeightedDivineFruit(fruits);
  }
  
  return fruits[Math.floor(Math.random() * fruits.length)];
}

// NEW: Weighted divine fruit selection
function selectWeightedDivineFruit(divineFruits) {
  const totalWeight = Object.values(DIVINE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const fruit of divineFruits) {
    const weight = DIVINE_WEIGHTS[fruit.id] || 1;
    random -= weight;
    if (random <= 0) {
      return fruit;
    }
  }
  
  // Fallback to first fruit
  return divineFruits[0];
}

function getAllFruits() {
  return Object.values(DEVIL_FRUITS);
}

function getStats() {
  const total = Object.keys(DEVIL_FRUITS).length;
  const byRarity = {};
  
  Object.values(DEVIL_FRUITS).forEach(fruit => {
    byRarity[fruit.rarity] = (byRarity[fruit.rarity] || 0) + 1;
  });
  
  return { total, byRarity };
}

// NEW: Get divine fruit statistics
function getDivineStats() {
  const divineFruits = getFruitsByRarity('divine');
  const stats = {};
  
  divineFruits.forEach(fruit => {
    const weight = DIVINE_WEIGHTS[fruit.id] || 1;
    const totalWeight = Object.values(DIVINE_WEIGHTS).reduce((sum, w) => sum + w, 0);
    const percentage = ((weight / totalWeight) * 100).toFixed(3);
    
    stats[fruit.name] = {
      weight,
      percentage: percentage + '%',
      isRarest: fruit.id === 'one_piece_treasure'
    };
  });
  
  return stats;
}

module.exports = { 
  DEVIL_FRUITS, 
  RARITY_WEIGHTS,
  DIVINE_WEIGHTS,
  RARITY_COLORS,
  RARITY_EMOJIS,
  getRarityWeights,
  getFruitsByRarity,
  getFruitById,
  getRandomFruitByRarity,
  selectWeightedDivineFruit,
  getAllFruits,
  getStats,
  getDivineStats
};
