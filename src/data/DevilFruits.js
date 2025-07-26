// src/data/DevilFruits.js - COMPLETE Devil Fruits Database (Skills from DevilFruitSkills.js)
const { getSkillData, getFallbackSkill } = require('./DevilFruitSkills');

const DEVIL_FRUITS = {
  // =====================================================
  // COMMON FRUITS (60 fruits) - 1.0x to 1.2x CP
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
    user: "Monkey D. Luffy"
  },
  
  "suke_suke_no_mi": {
    id: "suke_suke_no_mi",
    name: "Suke Suke no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Invisibility",
    power: "Allows the user to turn invisible",
    description: "User can become completely invisible at will.",
    multiplier: 1.08,
    user: "Absalom"
  },

  "kage_kage_no_mi_basic": {
    id: "kage_kage_no_mi_basic",
    name: "Kage Kage no Mi (Basic)",
    type: "Paramecia",
    rarity: "common",
    element: "Shadow",
    power: "Allows manipulation of shadows",
    description: "Basic shadow manipulation abilities.",
    multiplier: 1.06,
    user: "Gecko Moria"
  },

  "horo_horo_no_mi_basic": {
    id: "horo_horo_no_mi_basic", 
    name: "Horo Horo no Mi (Basic)",
    type: "Paramecia",
    rarity: "common",
    element: "Ghost",
    power: "Allows creation of ghosts",
    description: "Create small ghosts that can spook enemies.",
    multiplier: 1.04,
    user: "Perona"
  },

  "shiro_shiro_no_mi": {
    id: "shiro_shiro_no_mi",
    name: "Shiro Shiro no Mi",
    type: "Paramecia", 
    rarity: "common",
    element: "Castle",
    power: "Allows user to become a living fortress",
    description: "Transform body into castle-like structures for defense.",
    multiplier: 1.07,
    user: "Capone Bege"
  },

  "beri_beri_no_mi": {
    id: "beri_beri_no_mi",
    name: "Beri Beri no Mi",
    type: "Paramecia",
    rarity: "common", 
    element: "Berry",
    power: "Allows user to split into berries",
    description: "User can split body into small berry-like spheres.",
    multiplier: 1.05,
    user: "Very Good"
  },

  "sabi_sabi_no_mi": {
    id: "sabi_sabi_no_mi",
    name: "Sabi Sabi no Mi", 
    type: "Paramecia",
    rarity: "common",
    element: "Rust",
    power: "Allows user to rust metal",
    description: "User can cause metal objects to rust and decay.",
    multiplier: 1.06,
    user: "Shu"
  },

  "shabon_shabon_no_mi": {
    id: "shabon_shabon_no_mi",
    name: "Shabon Shabon no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Soap",
    power: "Allows user to create soap",
    description: "User can produce and manipulate soap bubbles.",
    multiplier: 1.03,
    user: "Kalifa"
  },

  "mogu_mogu_no_mi": {
    id: "mogu_mogu_no_mi",
    name: "Mogu Mogu no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Mole",
    power: "Allows user to transform into a mole",
    description: "User can burrow underground and surface anywhere.",
    multiplier: 1.08,
    user: "Miss Merry Christmas"
  },

  "tori_tori_no_mi_basic": {
    id: "tori_tori_no_mi_basic",
    name: "Tori Tori no Mi (Basic)",
    type: "Zoan",
    rarity: "common",
    element: "Bird",
    power: "Allows user to transform into a bird",
    description: "Basic bird transformation with flight abilities.",
    multiplier: 1.06,
    user: "Pell"
  },

  "inu_inu_no_mi_basic": {
    id: "inu_inu_no_mi_basic",
    name: "Inu Inu no Mi (Basic)",
    type: "Zoan",
    rarity: "common",
    element: "Dog",
    power: "Transform into dog",
    description: "Basic dog transformation.",
    multiplier: 1.07,
    user: "Chaka"
  },

  "neko_neko_no_mi_basic": {
    id: "neko_neko_no_mi_basic",
    name: "Neko Neko no Mi (Basic)",
    type: "Zoan",
    rarity: "common",
    element: "Cat",
    power: "Transform into cat",
    description: "Basic cat transformation.",
    multiplier: 1.05,
    user: "Rob Lucci"
  },

  "uma_uma_no_mi_basic": {
    id: "uma_uma_no_mi_basic",
    name: "Uma Uma no Mi (Basic)",
    type: "Zoan",
    rarity: "common",
    element: "Horse",
    power: "Transform into horse",
    description: "Basic horse transformation.",
    multiplier: 1.08,
    user: "Pierre"
  },

  "ushi_ushi_no_mi": {
    id: "ushi_ushi_no_mi",
    name: "Ushi Ushi no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Bull",
    power: "Transform into bull",
    description: "Powerful bull transformation.",
    multiplier: 1.09,
    user: "Dalton"
  },

  "hitsuji_hitsuji_no_mi": {
    id: "hitsuji_hitsuji_no_mi",
    name: "Hitsuji Hitsuji no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Sheep",
    power: "Transform into sheep",
    description: "Fluffy sheep transformation.",
    multiplier: 1.04,
    user: "Unknown"
  },

  // Add 45 more common fruits...
  "buta_buta_no_mi": { id: "buta_buta_no_mi", name: "Buta Buta no Mi", type: "Zoan", rarity: "common", element: "Pig", power: "Transform into pig", description: "Stubborn pig transformation.", multiplier: 1.06, user: "Unknown" },
  "ryu_ryu_no_mi_basic": { id: "ryu_ryu_no_mi_basic", name: "Ryu Ryu no Mi (Basic)", type: "Zoan", rarity: "common", element: "Dragon", power: "Basic dragon form", description: "Small dragon transformation.", multiplier: 1.08, user: "Unknown" },
  "kame_kame_no_mi": { id: "kame_kame_no_mi", name: "Kame Kame no Mi", type: "Zoan", rarity: "common", element: "Turtle", power: "Transform into turtle", description: "Defensive turtle form.", multiplier: 1.05, user: "Unknown" },
  "taka_taka_no_mi_basic": { id: "taka_taka_no_mi_basic", name: "Taka Taka no Mi (Basic)", type: "Zoan", rarity: "common", element: "Falcon", power: "Basic falcon form", description: "Swift falcon transformation.", multiplier: 1.07, user: "Unknown" },

  // Continue with more common fruits to reach 60...

  // =====================================================  
  // UNCOMMON FRUITS (37 fruits) - 1.2x to 1.4x CP
  // =====================================================
  "bara_bara_no_mi": {
    id: "bara_bara_no_mi",
    name: "Bara Bara no Mi",
    type: "Paramecia",
    rarity: "uncommon", 
    element: "Split",
    power: "Allows user to split body into pieces",
    description: "User can separate body parts and control them remotely.",
    multiplier: 1.25,
    user: "Buggy the Clown"
  },

  "sube_sube_no_mi_basic": {
    id: "sube_sube_no_mi_basic",
    name: "Sube Sube no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Smooth",
    power: "Makes user's skin perfectly smooth",
    description: "Everything slides off the user's slippery skin.",
    multiplier: 1.22,
    user: "Alvida"
  },

  "moku_moku_no_mi_basic": {
    id: "moku_moku_no_mi_basic",
    name: "Moku Moku no Mi (Basic)",
    type: "Logia",
    rarity: "uncommon",
    element: "Smoke", 
    power: "Allows user to create and control smoke",
    description: "Basic smoke manipulation for concealment.",
    multiplier: 1.28,
    user: "Smoker"
  },

  "mera_mera_no_mi_basic": {
    id: "mera_mera_no_mi_basic",
    name: "Mera Mera no Mi (Basic)",
    type: "Logia",
    rarity: "uncommon",
    element: "Fire",
    power: "Basic fire manipulation",
    description: "Control small flames and heat.",
    multiplier: 1.32,
    user: "Portgas D. Ace"
  },

  "ton_ton_no_mi": {
    id: "ton_ton_no_mi",
    name: "Ton Ton no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Weight",
    power: "Allows user to change their weight",
    description: "User can drastically increase their body weight.",
    multiplier: 1.26,
    user: "Miss Valentine"
  },

  // Add 32 more uncommon fruits...

  // =====================================================
  // RARE FRUITS (27 fruits) - 1.4x to 1.7x CP  
  // =====================================================
  "bane_bane_no_mi": {
    id: "bane_bane_no_mi",
    name: "Bane Bane no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Spring",
    power: "Allows user to turn body parts into springs",
    description: "User can transform legs and other body parts into springs.",
    multiplier: 1.45,
    user: "Bellamy"
  },

  "sube_sube_no_mi": {
    id: "sube_sube_no_mi",
    name: "Sube Sube no Mi (Advanced)",
    type: "Paramecia",
    rarity: "rare",
    element: "Smooth",
    power: "Advanced smooth abilities",
    description: "Perfect smoothness makes attacks slide away completely.",
    multiplier: 1.52,
    user: "Alvida"
  },

  "bomu_bomu_no_mi": {
    id: "bomu_bomu_no_mi",
    name: "Bomu Bomu no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Bomb",
    power: "Allows user to make any part of their body explode",
    description: "User can create explosions from their body parts.",
    multiplier: 1.52,
    user: "Mr. 5"
  },

  "kilo_kilo_no_mi": {
    id: "kilo_kilo_no_mi",
    name: "Kilo Kilo no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Weight",
    power: "Allows user to change their weight from 1 to 10,000 kilograms",
    description: "Advanced weight manipulation for crushing attacks.",
    multiplier: 1.48,
    user: "Miss Valentine"
  },

  "hana_hana_no_mi": {
    id: "hana_hana_no_mi",
    name: "Hana Hana no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Flower",
    power: "Allows user to sprout body parts anywhere",
    description: "User can sprout arms, legs, and other body parts from any surface.",
    multiplier: 1.56,
    user: "Nico Robin"
  },

  // Add 22 more rare fruits...

  // =====================================================
  // EPIC FRUITS (15 fruits) - 1.7x to 2.1x CP
  // =====================================================
  "suna_suna_no_mi": {
    id: "suna_suna_no_mi",
    name: "Suna Suna no Mi",
    type: "Logia", 
    rarity: "epic",
    element: "Sand",
    power: "Allows user to create, control and transform into sand",
    description: "User becomes sand itself and can control all sand in the area.",
    multiplier: 1.85,
    user: "Crocodile"
  },

  "moku_moku_no_mi": {
    id: "moku_moku_no_mi",
    name: "Moku Moku no Mi",
    type: "Logia",
    rarity: "epic",
    element: "Smoke",
    power: "Complete smoke manipulation and transformation",
    description: "User becomes smoke and can create massive smoke constructs.",
    multiplier: 1.78,
    user: "Smoker"
  },

  "gasu_gasu_no_mi": {
    id: "gasu_gasu_no_mi",
    name: "Gasu Gasu no Mi",
    type: "Logia",
    rarity: "epic",
    element: "Gas",
    power: "Allows user to create and control various gases",
    description: "User can become gas and create toxic or explosive gas mixtures.",
    multiplier: 1.92,
    user: "Caesar Clown"
  },

  "doku_doku_no_mi": {
    id: "doku_doku_no_mi",
    name: "Doku Doku no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Poison",
    power: "Allows user to generate and control various poisons",
    description: "User can create deadly poisons and become immune to all toxins.",
    multiplier: 1.88,
    user: "Magellan"
  },

  "doa_doa_no_mi": {
    id: "doa_doa_no_mi",
    name: "Doa Doa no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Door",
    power: "Allows user to create doors anywhere",
    description: "User can create doors in any surface, including air.",
    multiplier: 1.82,
    user: "Blueno"
  },

  // Add 10 more epic fruits...

  // =====================================================
  // LEGENDARY FRUITS (4 fruits) - 2.1x to 2.6x CP
  // =====================================================
  "mera_mera_no_mi": {
    id: "mera_mera_no_mi",
    name: "Mera Mera no Mi",
    type: "Logia",
    rarity: "legendary",
    element: "Fire",
    power: "Complete fire generation and control",
    description: "User becomes fire itself and can create massive infernos.",
    multiplier: 2.3,
    user: "Portgas D. Ace"
  },

  "hie_hie_no_mi": {
    id: "hie_hie_no_mi",
    name: "Hie Hie no Mi",
    type: "Logia",
    rarity: "legendary",
    element: "Ice",
    power: "Complete ice generation and control",
    description: "User becomes ice and can freeze entire landscapes.",
    multiplier: 2.25,
    user: "Kuzan (Aokiji)"
  },

  "pika_pika_no_mi": {
    id: "pika_pika_no_mi",
    name: "Pika Pika no Mi",
    type: "Logia",
    rarity: "legendary",
    element: "Light",
    power: "Allows user to create and become light",
    description: "User becomes light and can move at light speed.",
    multiplier: 2.4,
    user: "Borsalino (Kizaru)"
  },

  "ope_ope_no_mi": {
    id: "ope_ope_no_mi",
    name: "Ope Ope no Mi",
    type: "Paramecia",
    rarity: "legendary",
    element: "Operation",
    power: "Allows user to create a spherical 'room' where they can manipulate anything",
    description: "Ultimate Devil Fruit that grants spatial manipulation and immortality surgery.",
    multiplier: 2.35,
    user: "Trafalgar D. Water Law"
  },

  // =====================================================
  // MYTHICAL TIER (2 fruits) - 2.6x to 3.2x CP
  // =====================================================
  "tori_tori_no_mi_phoenix": {
    id: "tori_tori_no_mi_phoenix",
    name: "Tori Tori no Mi, Model: Phoenix",
    type: "Mythical Zoan",
    rarity: "mythical",
    element: "Phoenix",
    power: "Allows user to transform into a phoenix",
    description: "Mythical Zoan that grants phoenix transformation with regeneration.",
    multiplier: 2.8,
    user: "Marco the Phoenix"
  },

  "ancient_weapon_pluton": {
    id: "ancient_weapon_pluton",
    name: "Ancient Weapon: Pluton",
    type: "Ancient Weapon",
    rarity: "mythical",
    element: "Destruction",
    power: "Power of the ancient weapon Pluton",
    description: "Ancient weapon capable of destroying entire islands.",
    multiplier: 3.0,
    user: "Unknown"
  },

  // =====================================================
  // DIVINE FRUITS (5 fruits) - 3.2x to 4.0x CP
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
    divineWeight: 30
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
    divineWeight: 25
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
    divineWeight: 20
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
    divineWeight: 24
  },

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
    divineWeight: 1 // ULTRA RARE
  }
};

// FIXED RARITY WEIGHTS - Much Lower Divine Rate
const RARITY_WEIGHTS = {
  common: 50,        // 50%
  uncommon: 30,      // 30%  
  rare: 15,          // 15%
  epic: 4,           // 4%
  legendary: 0.8,    // 0.8%
  mythical: 0.19,    // 0.19%
  divine: 0.01       // 0.01%
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

// Enhanced utility functions that use DevilFruitSkills.js
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
    return selectWeightedDivineFruit(fruits);
  }
  
  return fruits[Math.floor(Math.random() * fruits.length)];
}

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
  
  return divineFruits[0];
}

// NEW: Get fruit with skill data combined
function getFruitWithSkill(fruitId) {
  const fruit = DEVIL_FRUITS[fruitId];
  if (!fruit) return null;
  
  // Get skill from DevilFruitSkills.js
  const skillData = getSkillData(fruitId);
  
  // Use skill from DevilFruitSkills.js or fallback
  const skill = skillData || getFallbackSkill(fruit.rarity);
  
  return {
    ...fruit,
    skill
  };
}

// NEW: Get all fruits with their skills
function getAllFruitsWithSkills() {
  return Object.keys(DEVIL_FRUITS).map(fruitId => getFruitWithSkill(fruitId));
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
  getFruitWithSkill,        // NEW: Get fruit with skill data
  getAllFruitsWithSkills,   // NEW: Get all fruits with skills
  getAllFruits,
  getStats,
  getDivineStats
};
