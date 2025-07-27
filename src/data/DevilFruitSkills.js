// src/data/DevilFruitSkills.js - PLACEHOLDER SKILLS for New Devil Fruit System
const Logger = require('../utils/Logger');

// Placeholder skill effects by rarity
const RARITY_SKILL_TEMPLATES = {
  divine: {
    damageRange: [280, 350],
    cooldownRange: [6, 8],
    effects: ['reality_bend', 'power_null', 'area_explosion', 'devastating_blast', 'world_shaker'],
    type: 'ultimate'
  },
  mythical: {
    damageRange: [200, 280],
    cooldownRange: [5, 7],
    effects: ['phoenix_rebirth', 'elemental_mastery', 'logia_immunity', 'mythical_power'],
    type: 'special'
  },
  legendary: {
    damageRange: [150, 200],
    cooldownRange: [4, 6],
    effects: ['spatial_control', 'gravity_field', 'legendary_technique', 'master_strike'],
    type: 'attack'
  },
  epic: {
    damageRange: [120, 150],
    cooldownRange: [3, 5],
    effects: ['epic_ability', 'enhanced_power', 'special_technique', 'strong_attack'],
    type: 'attack'
  },
  rare: {
    damageRange: [90, 120],
    cooldownRange: [2, 4],
    effects: ['rare_technique', 'focused_strike', 'tactical_ability'],
    type: 'attack'
  },
  uncommon: {
    damageRange: [70, 90],
    cooldownRange: [1, 3],
    effects: ['enhanced_strike', 'improved_technique', 'basic_power'],
    type: 'attack'
  },
  common: {
    damageRange: [50, 70],
    cooldownRange: [1, 2],
    effects: ['basic_attack', 'simple_technique', 'common_ability'],
    type: 'attack'
  }
};

// Placeholder skill database - will be expanded later
const DEVIL_FRUIT_SKILLS = {
  // Divine skills - Ultimate powers
  "yami_yami_gura_gura_no_mi": {
    name: "Darkness Quake",
    damage: 320,
    cooldown: 8,
    effect: "reality_bend",
    description: "Combine darkness nullification with world-destroying earthquakes",
    type: "ultimate"
  },
  
  "gomu_gomu_nika_no_mi": {
    name: "Gear 5: Liberation",
    damage: 300,
    cooldown: 7,
    effect: "reality_bend", 
    description: "Sun God's power to liberate and bend reality",
    type: "ultimate"
  },

  "gura_gura_no_mi": {
    name: "World Ender Quake",
    damage: 310,
    cooldown: 7,
    effect: "area_explosion",
    description: "Devastating earthquakes that crack the very air",
    type: "ultimate"
  },

  "uo_uo_no_mi_seiryu": {
    name: "Azure Dragon Storm",
    damage: 290,
    cooldown: 6,
    effect: "elemental_mastery",
    description: "Command wind, fire, and lightning as the Azure Dragon",
    type: "ultimate"
  },

  // Mythical skills - Special powers
  "goro_goro_no_mi": {
    name: "Thunder God's Judgment",
    damage: 250,
    cooldown: 6,
    effect: "lightning_mastery",
    description: "Divine lightning strikes with godlike power",
    type: "special"
  },

  "hie_hie_no_mi": {
    name: "Absolute Zero",
    damage: 240,
    cooldown: 6,
    effect: "freeze_everything",
    description: "Freeze time and space with absolute cold",
    type: "special"
  },

  "pika_pika_no_mi": {
    name: "Light Speed Barrage",
    damage: 245,
    cooldown: 5,
    effect: "light_speed",
    description: "Attack at the speed of light with devastating precision",
    type: "special"
  },

  // Add more specific skills as needed...
};

/**
 * Get skill data for a fruit, with fallback generation
 */
function getSkillData(fruitId) {
  // Check if we have a specific skill defined
  if (DEVIL_FRUIT_SKILLS[fruitId]) {
    return DEVIL_FRUIT_SKILLS[fruitId];
  }
  
  // If no specific skill, return null to use fallback
  return null;
}

/**
 * Generate fallback skill based on fruit rarity and info
 */
function getFallbackSkill(fruitRarity, fruitName = "Unknown Fruit", fruitElement = "Unknown") {
  const template = RARITY_SKILL_TEMPLATES[fruitRarity] || RARITY_SKILL_TEMPLATES.common;
  
  // Generate damage within range
  const damage = Math.floor(
    Math.random() * (template.damageRange[1] - template.damageRange[0] + 1) + template.damageRange[0]
  );
  
  // Generate cooldown within range
  const cooldown = Math.floor(
    Math.random() * (template.cooldownRange[1] - template.cooldownRange[0] + 1) + template.cooldownRange[0]
  );
  
  // Select random effect
  const effect = template.effects[Math.floor(Math.random() * template.effects.length)];
  
  // Generate skill name based on fruit
  const skillName = generateSkillName(fruitName, fruitElement, fruitRarity);
  
  // Generate description
  const description = generateSkillDescription(fruitName, fruitElement, fruitRarity, effect);
  
  return {
    name: skillName,
    damage: damage,
    cooldown: cooldown,
    effect: effect,
    description: description,
    type: template.type
  };
}

/**
 * Generate skill name based on fruit properties
 */
function generateSkillName(fruitName, element, rarity) {
  const rarityPrefixes = {
    divine: ['Divine', 'Godly', 'Supreme', 'Ultimate'],
    mythical: ['Mythical', 'Legendary', 'Ancient', 'Eternal'],
    legendary: ['Legendary', 'Master', 'Grand', 'Elite'],
    epic: ['Epic', 'Great', 'Mighty', 'Powerful'],
    rare: ['Enhanced', 'Advanced', 'Superior', 'Special'],
    uncommon: ['Improved', 'Focused', 'Refined', 'Skilled'],
    common: ['Basic', 'Simple', 'Standard', 'Regular']
  };
  
  const elementActions = {
    Lightning: ['Strike', 'Bolt', 'Storm', 'Judgment'],
    Ice: ['Freeze', 'Blizzard', 'Shard', 'Glacier'],
    Fire: ['Blaze', 'Inferno', 'Flame', 'Burn'],
    Light: ['Beam', 'Flash', 'Ray', 'Brilliance'],
    Darkness: ['Void', 'Shadow', 'Abyss', 'Eclipse'],
    Magma: ['Eruption', 'Flow', 'Blast', 'Heat'],
    Sand: ['Storm', 'Whirlwind', 'Burial', 'Desert'],
    Smoke: ['Cloud', 'Veil', 'Shroud', 'Mist'],
    Rubber: ['Bounce', 'Stretch', 'Slam', 'Impact'],
    String: ['Web', 'Bind', 'Cut', 'Control'],
    Earthquake: ['Quake', 'Tremor', 'Shatter', 'Crack'],
    Soul: ['Drain', 'Command', 'Harvest', 'Bind'],
    Gravity: ['Crush', 'Pull', 'Field', 'Force'],
    Operation: ['Cut', 'Swap', 'Room', 'Surgery'],
    Poison: ['Cloud', 'Bite', 'Spread', 'Decay'],
    Diamond: ['Shine', 'Cut', 'Barrier', 'Reflection'],
    Barrier: ['Wall', 'Shield', 'Block', 'Guard'],
    Magnetism: ['Attract', 'Repel', 'Field', 'Storm'],
    Mochi: ['Trap', 'Bind', 'Stretch', 'Form'],
    Phoenix: ['Rebirth', 'Flame', 'Rise', 'Heal'],
    Dragon: ['Roar', 'Claw', 'Breath', 'Rage'],
    Leopard: ['Pounce', 'Claw', 'Hunt', 'Strike'],
    Mammoth: ['Charge', 'Stomp', 'Tusk', 'Trumpet'],
    Wolf: ['Howl', 'Pack', 'Hunt', 'Bite'],
    Human: ['Punch', 'Kick', 'Grapple', 'Technique']
  };
  
  const prefixes = rarityPrefixes[rarity] || rarityPrefixes.common;
  const actions = elementActions[element] || ['Strike', 'Attack', 'Power', 'Force'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  
  return `${prefix} ${element} ${action}`;
}

/**
 * Generate skill description
 */
function generateSkillDescription(fruitName, element, rarity, effect) {
  const rarityDescriptors = {
    divine: 'world-altering',
    mythical: 'legendary',
    legendary: 'masterful',
    epic: 'powerful',
    rare: 'enhanced',
    uncommon: 'improved',
    common: 'basic'
  };
  
  const elementDescriptions = {
    Lightning: 'devastating electrical energy',
    Ice: 'freezing cold that chills to the bone',
    Fire: 'intense flames that burn everything',
    Light: 'blinding radiance and laser precision',
    Darkness: 'consuming void that nullifies power',
    Magma: 'molten rock with extreme heat',
    Sand: 'dehydrating desert force',
    Smoke: 'concealing mist and toxic clouds',
    Rubber: 'elastic force and blunt immunity',
    String: 'razor-sharp cutting threads',
    Earthquake: 'earth-shaking tremors',
    Soul: 'life force manipulation',
    Gravity: 'crushing gravitational force',
    Operation: 'surgical precision and spatial control',
    Poison: 'deadly toxins and corrosive effects',
    Diamond: 'indestructible crystalline power',
    Barrier: 'impenetrable defensive force',
    Magnetism: 'magnetic field manipulation',
    Mochi: 'sticky binding and flexible assault',
    Phoenix: 'regenerative flames of rebirth',
    Dragon: 'ancient mythical beast power',
    Leopard: 'predatory hunting instincts',
    Mammoth: 'colossal ancient strength',
    Wolf: 'pack hunting coordination',
    Human: 'human intelligence and adaptability'
  };
  
  const descriptor = rarityDescriptors[rarity] || 'basic';
  const elementDesc = elementDescriptions[element] || 'mysterious devil fruit energy';
  
  return `A ${descriptor} technique that harnesses ${elementDesc} to devastating effect.`;
}

/**
 * Check if fruit has custom skill
 */
function hasCustomSkill(fruitId) {
  return DEVIL_FRUIT_SKILLS.hasOwnProperty(fruitId);
}

/**
 * Get all skills by rarity for analysis
 */
function getSkillsByRarity(rarity) {
  const skills = [];
  
  // Get defined skills
  Object.entries(DEVIL_FRUIT_SKILLS).forEach(([fruitId, skill]) => {
    if (typeof skill === 'object' && skill.damage) {
      // Estimate rarity based on damage ranges
      let estimatedRarity = 'common';
      if (skill.damage >= 280) estimatedRarity = 'divine';
      else if (skill.damage >= 200) estimatedRarity = 'mythical';
      else if (skill.damage >= 150) estimatedRarity = 'legendary';
      else if (skill.damage >= 120) estimatedRarity = 'epic';
      else if (skill.damage >= 90) estimatedRarity = 'rare';
      else if (skill.damage >= 70) estimatedRarity = 'uncommon';
      
      if (estimatedRarity === rarity) {
        skills.push({ id: fruitId, ...skill });
      }
    }
  });
  
  return skills;
}

/**
 * Add custom skill for a specific fruit
 */
function addCustomSkill(fruitId, skillData) {
  DEVIL_FRUIT_SKILLS[fruitId] = skillData;
}

/**
 * Remove custom skill
 */
function removeCustomSkill(fruitId) {
  delete DEVIL_FRUIT_SKILLS[fruitId];
}

/**
 * Get skill template for rarity
 */
function getSkillTemplate(rarity) {
  return RARITY_SKILL_TEMPLATES[rarity] || RARITY_SKILL_TEMPLATES.common;
}

/**
 * Generate multiple skill options for a fruit
 */
function generateSkillOptions(fruitName, fruitElement, fruitRarity, count = 3) {
  const options = [];
  
  for (let i = 0; i < count; i++) {
    options.push(getFallbackSkill(fruitRarity, fruitName, fruitElement));
  }
  
  return options;
}

/**
 * Validate skill data
 */
function validateSkillData(skillData) {
  const required = ['name', 'damage', 'cooldown', 'description', 'type'];
  
  for (const field of required) {
    if (!skillData.hasOwnProperty(field)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  if (typeof skillData.damage !== 'number' || skillData.damage < 1) {
    return { valid: false, error: 'Damage must be a positive number' };
  }
  
  if (typeof skillData.cooldown !== 'number' || skillData.cooldown < 0) {
    return { valid: false, error: 'Cooldown must be a non-negative number' };
  }
  
  return { valid: true };
}

/**
 * Get skill statistics
 */
function getSkillStats() {
  const stats = {
    totalCustomSkills: Object.keys(DEVIL_FRUIT_SKILLS).length,
    byRarity: {},
    byType: {},
    averageDamage: {},
    averageCooldown: {}
  };
  
  // Analyze by rarity and type
  Object.values(DEVIL_FRUIT_SKILLS).forEach(skill => {
    // Estimate rarity from damage
    let rarity = 'common';
    if (skill.damage >= 280) rarity = 'divine';
    else if (skill.damage >= 200) rarity = 'mythical';
    else if (skill.damage >= 150) rarity = 'legendary';
    else if (skill.damage >= 120) rarity = 'epic';
    else if (skill.damage >= 90) rarity = 'rare';
    else if (skill.damage >= 70) rarity = 'uncommon';
    
    // Count by rarity
    stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + 1;
    
    // Count by type
    const type = skill.type || 'attack';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    
    // Calculate averages
    if (!stats.averageDamage[rarity]) {
      stats.averageDamage[rarity] = [];
      stats.averageCooldown[rarity] = [];
    }
    stats.averageDamage[rarity].push(skill.damage);
    stats.averageCooldown[rarity].push(skill.cooldown);
  });
  
  // Calculate final averages
  Object.keys(stats.averageDamage).forEach(rarity => {
    const damages = stats.averageDamage[rarity];
    const cooldowns = stats.averageCooldown[rarity];
    
    stats.averageDamage[rarity] = Math.round(
      damages.reduce((a, b) => a + b, 0) / damages.length
    );
    stats.averageCooldown[rarity] = Math.round(
      cooldowns.reduce((a, b) => a + b, 0) / cooldowns.length * 10
    ) / 10;
  });
  
  return stats;
}

/**
 * Export custom skills to JSON
 */
function exportCustomSkills() {
  return JSON.stringify(DEVIL_FRUIT_SKILLS, null, 2);
}

/**
 * Import custom skills from JSON
 */
function importCustomSkills(jsonData) {
  try {
    const skills = JSON.parse(jsonData);
    
    // Validate each skill
    for (const [fruitId, skillData] of Object.entries(skills)) {
      const validation = validateSkillData(skillData);
      if (!validation.valid) {
        throw new Error(`Invalid skill data for ${fruitId}: ${validation.error}`);
      }
    }
    
    // Import if all valid
    Object.assign(DEVIL_FRUIT_SKILLS, skills);
    return { success: true, imported: Object.keys(skills).length };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get recommended skill for fruit based on its properties
 */
function getRecommendedSkill(fruitData) {
  const { name, rarity, element, type, user } = fruitData;
  
  // Check if we have a custom skill
  const customSkill = getSkillData(fruitData.id);
  if (customSkill) {
    return customSkill;
  }
  
  // Generate appropriate fallback
  return getFallbackSkill(rarity, name, element);
}

/**
 * Batch generate skills for multiple fruits
 */
function batchGenerateSkills(fruitsData) {
  const results = {};
  
  fruitsData.forEach(fruit => {
    results[fruit.id] = getRecommendedSkill(fruit);
  });
  
  return results;
}

/**
 * Search skills by name or effect
 */
function searchSkills(query) {
  const results = [];
  const lowercaseQuery = query.toLowerCase();
  
  Object.entries(DEVIL_FRUIT_SKILLS).forEach(([fruitId, skill]) => {
    if (
      skill.name.toLowerCase().includes(lowercaseQuery) ||
      skill.description.toLowerCase().includes(lowercaseQuery) ||
      (skill.effect && skill.effect.toLowerCase().includes(lowercaseQuery))
    ) {
      results.push({ fruitId, ...skill });
    }
  });
  
  return results;
}

/**
 * Get skills that need balancing (damage too high/low for rarity)
 */
function getUnbalancedSkills() {
  const unbalanced = [];
  
  Object.entries(DEVIL_FRUIT_SKILLS).forEach(([fruitId, skill]) => {
    // Determine expected rarity from damage
    let expectedRarity = 'common';
    if (skill.damage >= 280) expectedRarity = 'divine';
    else if (skill.damage >= 200) expectedRarity = 'mythical';
    else if (skill.damage >= 150) expectedRarity = 'legendary';
    else if (skill.damage >= 120) expectedRarity = 'epic';
    else if (skill.damage >= 90) expectedRarity = 'rare';
    else if (skill.damage >= 70) expectedRarity = 'uncommon';
    
    // Check if damage is appropriate for rarity
    const template = RARITY_SKILL_TEMPLATES[expectedRarity];
    if (skill.damage < template.damageRange[0] || skill.damage > template.damageRange[1]) {
      unbalanced.push({
        fruitId,
        skill,
        expectedRarity,
        issue: skill.damage < template.damageRange[0] ? 'too_low' : 'too_high'
      });
    }
  });
  
  return unbalanced;
}

// Initialize logger
const logger = new Logger('SKILLS');

// Log initialization
logger.info(`Devil Fruit Skills system initialized with ${Object.keys(DEVIL_FRUIT_SKILLS).length} custom skills`);

module.exports = {
  DEVIL_FRUIT_SKILLS,
  RARITY_SKILL_TEMPLATES,
  getSkillData,
  getFallbackSkill,
  hasCustomSkill,
  getSkillsByRarity,
  addCustomSkill,
  removeCustomSkill,
  getSkillTemplate,
  generateSkillOptions,
  validateSkillData,
  getSkillStats,
  exportCustomSkills,
  importCustomSkills,
  getRecommendedSkill,
  batchGenerateSkills,
  searchSkills,
  getUnbalancedSkills,
  generateSkillName,
  generateSkillDescription
};
