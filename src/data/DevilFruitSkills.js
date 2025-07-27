// src/data/DevilFruitSkills.js - Complete One Piece Lore-Based Skills System
const Logger = require('../utils/Logger');

/**
 * DEVIL FRUIT SKILLS - ORGANIZED BY RARITY TIERS
 * Each skill is lore-accurate and designed for meaningful turn-based PvP combat
 * 
 * Skill Structure:
 * - name: Display name of the technique
 * - damage: Base damage (modified by fruit multiplier and user stats)
 * - cooldown: Turns before skill can be used again
 * - effect: Status effect applied (references SkillEffectService)
 * - description: Lore-accurate description of the technique
 * - type: Category (attack/defense/support/ultimate)
 * - range: single/multi/area/all
 * - cost: Optional stamina/energy cost for powerful moves
 */

// =====================================================
// DIVINE TIER SKILLS - Reality-Bending Ultimate Powers
// =====================================================

const DIVINE_TIER_SKILLS = {
  // Blackbeard's Dual Devil Fruit Power
  "yami_yami_gura_gura_no_mi": {
    name: "Darkness Quake Devastation",
    damage: 350,
    cooldown: 8,
    effect: "reality_bend",
    description: "Combine the nullifying void of darkness with world-destroying earthquakes, creating a reality-warping catastrophe",
    type: "ultimate",
    range: "all",
    cost: 100,
    special: {
      nullifyAbilities: true,
      earthquakeAura: 3, // turns
      gravityPull: true
    }
  },

  // Luffy's Gear 5 Sun God Nika Power
  "gomu_gomu_nika_no_mi": {
    name: "Bajrang Liberation",
    damage: 320,
    cooldown: 7,
    effect: "toon_force_reality",
    description: "Channel the Sun God's power to bend reality like rubber, creating an island-sized fist of pure liberation",
    type: "ultimate",
    range: "area",
    cost: 90,
    special: {
      cartoonPhysics: true,
      environmentRubber: true,
      immuneToLogic: 2 // turns
    }
  },

  // Whitebeard's World-Destroying Earthquake Power
  "gura_gura_no_mi": {
    name: "Seismic World Ender",
    damage: 330,
    cooldown: 7,
    effect: "world_shaker",
    description: "Crack the very air itself and shatter space with vibrations that can destroy the world",
    type: "ultimate",
    range: "all",
    cost: 95,
    special: {
      crackAir: true,
      tsunamiWaves: true,
      spaceShatter: true
    }
  },

  // Kaido's Azure Dragon Mythical Power
  "uo_uo_no_mi_seiryu": {
    name: "Azure Dragon Storm Lord",
    damage: 300,
    cooldown: 6,
    effect: "elemental_mastery",
    description: "Command the elements as the Azure Dragon - fire, lightning, wind, and weather itself bow to your will",
    type: "ultimate",
    range: "area",
    cost: 85,
    special: {
      weatherControl: true,
      islandLevitation: true,
      drunkMaster: true // unpredictable pattern
    }
  }
};

// =====================================================
// MYTHICAL TIER SKILLS - Emperor/Admiral Level Powers
// =====================================================

const MYTHICAL_TIER_SKILLS = {
  // Enel's Lightning God Power
  "goro_goro_no_mi": {
    name: "Divine Lightning Judgment",
    damage: 280,
    cooldown: 6,
    effect: "lightning_god",
    description: "Strike with the fury of a thunder god - lightning that moves at light speed and judges all",
    type: "special",
    range: "multi",
    cost: 70,
    special: {
      lightSpeed: true,
      heartRestart: true, // revival ability
      electromagneticSight: true
    }
  },

  // Aokiji's Absolute Ice Power
  "hie_hie_no_mi": {
    name: "Ice Age Absolute Zero",
    damage: 260,
    cooldown: 6,
    effect: "ice_age",
    description: "Freeze entire oceans and bring forth an ice age that stops all movement and life",
    type: "special",
    range: "area",
    cost: 65,
    special: {
      freezeOcean: true,
      iceTime: 4, // turns of freeze
      climateChange: true
    }
  },

  // Kizaru's Light Speed Power
  "pika_pika_no_mi": {
    name: "Yasakani Sacred Jewel",
    damage: 270,
    cooldown: 5,
    effect: "light_speed_barrage",
    description: "Move and attack at the speed of light with beams that pierce through everything",
    type: "special",
    range: "multi",
    cost: 60,
    special: {
      lightSpeedMovement: true,
      undodgeable: true,
      blindingFlash: true
    }
  },

  // Akainu's Absolute Justice Magma
  "magu_magu_no_mi": {
    name: "Molten Absolute Justice",
    damage: 290,
    cooldown: 6,
    effect: "molten_justice",
    description: "Burn through everything with magma hotter than fire itself - absolute justice that melts all",
    type: "special",
    range: "single",
    cost: 65,
    special: {
      meltAll: true,
      elementalSuperiority: ["mera_mera_no_mi"], // beats fire
      persistentLava: 3
    }
  },

  // Big Mom's Soul Manipulation
  "soru_soru_no_mi": {
    name: "Soul Pocus Terror",
    damage: 250,
    cooldown: 6,
    effect: "soul_manipulation",
    description: "Steal the very souls of those who fear you and command them as living weapons",
    type: "special",
    range: "multi",
    cost: 70,
    special: {
      fearRequired: true,
      createHomies: true,
      soulDrain: true
    }
  },

  // Fujitora's Gravity Control
  "zushi_zushi_no_mi": {
    name: "Gravity Meteor Drop",
    damage: 275,
    cooldown: 7,
    effect: "gravity_mastery",
    description: "Pull meteors from space itself and control gravity to crush enemies with the weight of heaven",
    type: "special",
    range: "area",
    cost: 75,
    special: {
      meteorSummon: true,
      gravityCrush: true,
      spacePull: true
    }
  },

  // Sabo's Flame Emperor Power
  "mera_mera_no_mi": {
    name: "Flame Emperor's Wrath",
    damage: 255,
    cooldown: 5,
    effect: "flame_emperor",
    description: "Command fire itself as the Flame Emperor - flames that burn with the spirit of revolution",
    type: "special",
    range: "area",
    cost: 55,
    special: {
      revolutionFlame: true,
      fireImmunity: true,
      flameClones: true
    }
  },

  // Green Bull's Forest Power
  "mori_mori_no_mi": {
    name: "Nature's Absolute Dominion",
    damage: 240,
    cooldown: 6,
    effect: "forest_god",
    description: "Become one with nature itself - forests that devour enemies and drain their life force",
    type: "special",
    range: "area",
    cost: 60,
    special: {
      lifeDrain: true,
      forestSanctuary: true,
      plantControl: true
    }
  },

  // Doflamingo's String Mastery
  "ito_ito_no_mi": {
    name: "Parasitic String God Thread",
    damage: 235,
    cooldown: 5,
    effect: "heavenly_strings",
    description: "Control the very heavens with strings that can slice clouds and puppeteer enemies",
    type: "special",
    range: "multi",
    cost: 55,
    special: {
      puppetControl: true,
      cloudSlicing: true,
      stringClone: true
    }
  },

  // Marco's Phoenix Regeneration
  "tori_tori_no_mi_phoenix": {
    name: "Phoenix Resurrection Flames",
    damage: 220,
    cooldown: 6,
    effect: "phoenix_rebirth",
    description: "Blue flames of regeneration that heal allies while burning enemies - the immortal phoenix rises",
    type: "special",
    range: "area",
    cost: 65,
    special: {
      healAllies: true,
      resurrection: true,
      blueFlames: true
    }
  },

  // Bullet's Combination Power
  "gasha_gasha_no_mi": {
    name: "Bullet Fest Combination",
    damage: 265,
    cooldown: 7,
    effect: "weapon_fusion",
    description: "Combine and fuse anything into ultimate weapons - create mechanical monsters from the battlefield",
    type: "special",
    range: "area",
    cost: 70,
    special: {
      mechanicalFusion: true,
      weaponCreation: true,
      giantMecha: true
    }
  },

  // Uta's Song Reality
  "uta_uta_no_mi": {
    name: "New Genesis Song World",
    damage: 230,
    cooldown: 8,
    effect: "song_reality",
    description: "Trap enemies in a world of song where your voice becomes reality itself",
    type: "special",
    range: "all",
    cost: 80,
    special: {
      alternateReality: true,
      songPrison: true,
      emotionControl: true
    }
  }
};

// =====================================================
// LEGENDARY TIER SKILLS - Superior Tactical Powers
// =====================================================

const LEGENDARY_TIER_SKILLS = {
  // Kuma's Paw Repulsion
  "nikyu_nikyu_no_mi": {
    name: "Ursus Shock Wave",
    damage: 200,
    cooldown: 5,
    effect: "paw_repulsion",
    description: "Repel everything - even pain itself - and compress air into devastating paw-shaped bombs",
    type: "attack",
    range: "area",
    cost: 50,
    special: {
      repelEverything: true,
      painExtraction: true,
      airCompression: true
    }
  },

  // Law's Spatial Surgery
  "ope_ope_no_mi": {
    name: "ROOM - Puncture Wille",
    damage: 190,
    cooldown: 4,
    effect: "spatial_surgery",
    description: "Create a surgical room where you are the absolute doctor - cut space itself with precision",
    type: "attack",
    range: "multi",
    cost: 45,
    special: {
      spatialCut: true,
      organDamage: true,
      positionSwap: true
    }
  },

  // Crocodile's Desert King
  "suna_suna_no_mi": {
    name: "Desert Spada Dehydration",
    damage: 180,
    cooldown: 4,
    effect: "desert_king",
    description: "Command the desert itself - sand that drains moisture and life from everything it touches",
    type: "attack",
    range: "area",
    cost: 40,
    special: {
      moistureDrain: true,
      sandstorm: true,
      desertTerrain: true
    }
  },

  // Magellan's Poison Hell
  "doku_doku_no_mi": {
    name: "Venom Demon Hell's Judgment",
    damage: 175,
    cooldown: 5,
    effect: "poison_hell",
    description: "Become a demon of poison - toxic death that spreads and corrupts everything nearby",
    type: "attack",
    range: "area",
    cost: 45,
    special: {
      poisonSpread: true,
      venomDemon: true,
      toxicImmunity: true
    }
  },

  // Shiki's Float Control
  "fuwa_fuwa_no_mi": {
    name: "Lion's Threat Earth Float",
    damage: 185,
    cooldown: 5,
    effect: "float_mastery",
    description: "Make the earth itself your weapon - floating islands and seas that crush from above",
    type: "attack",
    range: "area",
    cost: 50,
    special: {
      islandFloat: true,
      earthWeapons: true,
      aerialAdvantage: true
    }
  },

  // Bartolomeo's Absolute Defense
  "bari_bari_no_mi": {
    name: "Barrier Crash Absolute Defense",
    damage: 160,
    cooldown: 3,
    effect: "absolute_barrier",
    description: "Create barriers that nothing can break - defense becomes the ultimate offense",
    type: "defense",
    range: "area",
    cost: 35,
    special: {
      unbreakableBarrier: true,
      barrierCrash: true,
      reflectAll: true
    }
  },

  // Kid's Magnetic Force
  "jiki_jiki_no_mi": {
    name: "Electromagnetic Railgun Punk",
    damage: 195,
    cooldown: 4,
    effect: "magnetic_force",
    description: "Turn the battlefield's metal into weapons - electromagnetic force that attracts destruction",
    type: "attack",
    range: "multi",
    cost: 40,
    special: {
      metalControl: true,
      electromagneticRail: true,
      ironWill: true
    }
  },

  // Katakuri's Perfect Mochi
  "mochi_mochi_no_mi": {
    name: "Power Mochi Future Sight",
    damage: 170,
    cooldown: 4,
    effect: "future_sight_mochi",
    description: "See the future and shape mochi accordingly - attacks that hit before they're thrown",
    type: "attack",
    range: "multi",
    cost: 45,
    special: {
      futureSight: true,
      mochiTrap: true,
      perfectDodge: true
    }
  },

  // Rob Lucci's Predator Instinct
  "neko_neko_no_mi_leopard": {
    name: "Leopard Rokushiki Rampage",
    damage: 185,
    cooldown: 3,
    effect: "predator_instinct",
    description: "Unleash the perfect predator - leopard speed combined with martial arts mastery",
    type: "attack",
    range: "single",
    cost: 35,
    special: {
      rokushikiMastery: true,
      predatorSpeed: true,
      criticalHunt: true
    }
  },

  // Ancient Zoan Powers
  "zou_zou_no_mi_mammoth": {
    name: "Ancient Mammoth Rampage",
    damage: 200,
    cooldown: 4,
    effect: "ancient_mammoth",
    description: "Channel the fury of ancient giants - mammoth strength that crushes everything",
    type: "attack",
    range: "area",
    cost: 40,
    special: {
      ancientStrength: true,
      trample: true,
      tuskCrush: true
    }
  },

  "ryu_ryu_no_mi_pteranodon": {
    name: "Aerial Pteranodon Hunter",
    damage: 190,
    cooldown: 4,
    effect: "aerial_predator",
    description: "Soar as an ancient flying predator - aerial dominance with devastating dive attacks",
    type: "attack",
    range: "multi",
    cost: 40,
    special: {
      aerialSuperiority: true,
      diveBomb: true,
      windSlash: true
    }
  },

  "ryu_ryu_no_mi_brachiosaurus": {
    name: "Brachio Launcher Serpent",
    damage: 185,
    cooldown: 5,
    effect: "brachio_cannon",
    description: "Launch attacks with ancient dinosaur power - neck that becomes a serpentine cannon",
    type: "attack",
    range: "area",
    cost: 45,
    special: {
      neckCannon: true,
      serpentStrike: true,
      ancientEndurance: true
    }
  },

  // Buddha's Enlightened Power
  "hito_hito_no_mi_daibutsu": {
    name: "Buddha Impact Shockwave",
    damage: 175,
    cooldown: 4,
    effect: "buddha_enlightenment",
    description: "Channel the wisdom and power of Buddha - golden shockwaves that purify and punish",
    type: "attack",
    range: "area",
    cost: 40,
    special: {
      goldenLight: true,
      shockwavePalm: true,
      wisdomBoost: true
    }
  },

  // Yamato's Guardian Wolf
  "inu_inu_no_mi_okuchi_no_makami": {
    name: "Divine Wolf Ice Fang",
    damage: 180,
    cooldown: 4,
    effect: "divine_wolf",
    description: "Become the guardian wolf deity - ice fangs that protect Wano with divine power",
    type: "attack",
    range: "multi",
    cost: 40,
    special: {
      iceFangs: true,
      guardianSpirit: true,
      wanoProtection: true
    }
  }
};

// =====================================================
// EPIC TIER SKILLS - Game-Changing Abilities
// =====================================================

const EPIC_TIER_SKILLS = {
  // Sugar's Reality Erasure
  "hobi_hobi_no_mi": {
    name: "Toy Transformation Erasure",
    damage: 120,
    cooldown: 6,
    effect: "existential_erasure",
    description: "One touch turns enemies into toys while erasing their existence from memory",
    type: "special",
    range: "single",
    cost: 60,
    special: {
      toyTransformation: true,
      memoryErase: true,
      contractBinding: true
    }
  },

  // Caesar's Gas Master
  "gasu_gasu_no_mi": {
    name: "Shinokuni Death Gas",
    damage: 140,
    cooldown: 4,
    effect: "death_gas",
    description: "Become a master of gas - poisonous death that spreads through the air",
    type: "attack",
    range: "area",
    cost: 35,
    special: {
      gasSpread: true,
      oxygenRemoval: true,
      chemicalWeapons: true
    }
  },

  // Moria's Shadow Army
  "kage_kage_no_mi": {
    name: "Shadow's Asgard Army",
    damage: 130,
    cooldown: 5,
    effect: "shadow_mastery",
    description: "Command an army of shadows - steal shadows to create undead warriors",
    type: "support",
    range: "area",
    cost: 40,
    special: {
      shadowArmy: true,
      shadowAbsorption: true,
      nightmareForm: true
    }
  },

  // Pica's Stone Assimilation
  "ishi_ishi_no_mi": {
    name: "Stone Giant Assimilation",
    damage: 150,
    cooldown: 4,
    effect: "stone_giant",
    description: "Become one with stone itself - merge with buildings to become a colossal warrior",
    type: "attack",
    range: "area",
    cost: 35,
    special: {
      stoneAssimilation: true,
      giantForm: true,
      buildingMerge: true
    }
  },

  // Mansherry's Miracle Healing
  "chiyu_chiyu_no_mi": {
    name: "Heal Everything Miracle",
    damage: 0,
    cooldown: 3,
    effect: "miracle_healing",
    description: "Heal any wound instantly - the power to cure even the most fatal injuries",
    type: "support",
    range: "area",
    cost: 30,
    special: {
      instantHeal: true,
      cureAll: true,
      lifeRestoration: true
    }
  },

  // Avalo Pizarro's Island Control
  "shima_shima_no_mi": {
    name: "Island Ship Manipulation",
    damage: 160,
    cooldown: 5,
    effect: "island_control",
    description: "Merge with entire islands - control landmasses as extensions of your body",
    type: "attack",
    range: "all",
    cost: 45,
    special: {
      islandMerge: true,
      landmassControl: true,
      territoryDominance: true
    }
  },

  // Robin's Thousand Arms
  "hana_hana_no_mi": {
    name: "Thousand Fleur Clutch",
    damage: 135,
    cooldown: 3,
    effect: "body_bloom",
    description: "Bloom body parts anywhere - grab and crush with the power of a thousand arms",
    type: "attack",
    range: "multi",
    cost: 25,
    special: {
      multipleGrab: true,
      jointCrush: true,
      spinalSnap: true
    }
  },

  // Cracker's Infinite Biscuits
  "bisu_bisu_no_mi": {
    name: "Biscuit Soldier Army",
    damage: 145,
    cooldown: 4,
    effect: "biscuit_army",
    description: "Create an endless army of hardened biscuit soldiers that fight with unwavering loyalty",
    type: "support",
    range: "area",
    cost: 35,
    special: {
      biscuitArmy: true,
      infiniteGeneration: true,
      hardenedDefense: true
    }
  },

  // Daifuku's Genie Power
  "hoya_hoya_no_mi": {
    name: "Genie Lamp Rampage",
    damage: 140,
    cooldown: 4,
    effect: "genie_summon",
    description: "Summon a massive genie from your body - wish for destruction and it shall be granted",
    type: "attack",
    range: "area",
    cost: 30,
    special: {
      genieSummon: true,
      wishPower: true,
      spectralAttack: true
    }
  },

  // Smoothie's Liquid Extraction
  "shibo_shibo_no_mi": {
    name: "Life Juice Extraction",
    damage: 155,
    cooldown: 4,
    effect: "liquid_extraction",
    description: "Wring out the very life essence from enemies - grow stronger by draining their fluids",
    type: "attack",
    range: "single",
    cost: 30,
    special: {
      fluidDrain: true,
      sizeIncrease: true,
      strengthAbsorption: true
    }
  },

  // Hawkins' Voodoo Power
  "wara_wara_no_mi": {
    name: "Straw Voodoo Redirect",
    damage: 125,
    cooldown: 5,
    effect: "voodoo_doll",
    description: "Create voodoo dolls that redirect all damage - let others suffer for your pain",
    type: "defense",
    range: "self",
    cost: 35,
    special: {
      damageRedirect: true,
      voodooDoll: true,
      fateManipulation: true
    }
  },

  // More Epic Skills...
  "shiro_shiro_no_mi": {
    name: "Castle Tank Formation",
    damage: 150,
    cooldown: 4,
    effect: "fortress_mode",
    description: "Transform into a mobile fortress - become an impregnable castle with artillery",
    type: "defense",
    range: "area",
    cost: 40,
    special: {
      fortressForm: true,
      artilleryFire: true,
      mobileCastle: true
    }
  }
};

// Continue with remaining tiers following the same pattern...
// This structure makes it much cleaner and easier to maintain!

// =====================================================
// SKILL RETRIEVAL AND UTILITY FUNCTIONS
// =====================================================

/**
 * Get skill data by fruit ID - now organized by rarity
 */
function getSkillData(fruitId) {
  // Search through all tiers
  const allSkills = {
    ...DIVINE_TIER_SKILLS,
    ...MYTHICAL_TIER_SKILLS,
    ...LEGENDARY_TIER_SKILLS,
    ...EPIC_TIER_SKILLS
    // Add other tiers as we implement them
  };
  
  return allSkills[fruitId] || null;
}

/**
 * Get all skills for a specific rarity tier
 */
function getSkillsByRarity(rarity) {
  const skillMaps = {
    'divine': DIVINE_TIER_SKILLS,
    'mythical': MYTHICAL_TIER_SKILLS,
    'legendary': LEGENDARY_TIER_SKILLS,
    'epic': EPIC_TIER_SKILLS
  };
  
  return skillMaps[rarity] || {};
}

/**
 * Generate fallback skill based on rarity (much improved)
 */
function getFallbackSkill(fruitRarity, fruitName = "Unknown Fruit", fruitElement = "Unknown") {
  const rarityTemplates = {
    divine: { damage: [320, 350], cooldown: [7, 9], type: "ultimate" },
    mythical: { damage: [240, 290], cooldown: [5, 7], type: "special" },
    legendary: { damage: [170, 220], cooldown: [3, 5], type: "attack" },
    epic: { damage: [120, 170], cooldown: [3, 5], type: "attack" },
    rare: { damage: [90, 130], cooldown: [2, 4], type: "attack" },
    uncommon: { damage: [70, 100], cooldown: [2, 3], type: "attack" },
    common: { damage: [50, 80], cooldown: [1, 2], type: "attack" }
  };

  const template = rarityTemplates[fruitRarity] || rarityTemplates.common;
  
  const damage = Math.floor(
    Math.random() * (template.damage[1] - template.damage[0] + 1) + template.damage[0]
  );
  
  const cooldown = Math.floor(
    Math.random() * (template.cooldown[1] - template.cooldown[0] + 1) + template.cooldown[0]
  );

  return {
    name: `${fruitName} Power`,
    damage,
    cooldown,
    effect: null,
    description: `A ${fruitRarity}-level devil fruit technique channeling the power of ${fruitElement}`,
    type: template.type,
    range: "single",
    cost: Math.floor(damage * 0.2)
  };
}

/**
 * Validate skill data structure
 */
function validateSkillData(skillData) {
  const required = ['name', 'damage', 'cooldown', 'description', 'type'];
  
  for (const field of required) {
    if (!skillData.hasOwnProperty(field)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  if (typeof skillData.damage !== 'number' || skillData.damage < 0) {
    return { valid: false, error: 'Damage must be a non-negative number' };
  }
  
  if (typeof skillData.cooldown !== 'number' || skillData.cooldown < 0) {
    return { valid: false, error: 'Cooldown must be a non-negative number' };
  }
  
  return { valid: true };
}

/**
 * Get comprehensive skill statistics
 */
function getSkillStats() {
  const allSkills = {
    ...DIVINE_TIER_SKILLS,
    ...MYTHICAL_TIER_SKILLS,
    ...LEGENDARY_TIER_SKILLS,
    ...EPIC_TIER_SKILLS
  };
  
  const stats = {
    totalSkills: Object.keys(allSkills).length,
    byRarity: {
      divine: Object.keys(DIVINE_TIER_SKILLS).length,
      mythical: Object.keys(MYTHICAL_TIER_SKILLS).length,
      legendary: Object.keys(LEGENDARY_TIER_SKILLS).length,
      epic: Object.keys(EPIC_TIER_SKILLS).length
    },
    averageDamage: {},
    averageCooldown: {}
  };
  
  // Calculate averages by rarity
  const rarityMaps = {
    divine: DIVINE_TIER_SKILLS,
    mythical: MYTHICAL_TIER_SKILLS,
    legendary: LEGENDARY_TIER_SKILLS,
    epic: EPIC_TIER_SKILLS
  };
  
  Object.entries(rarityMaps).forEach(([rarity, skills]) => {
    const damages = Object.values(skills).map(s => s.damage);
    const cooldowns = Object.values(skills).map(s => s.cooldown);
    
    stats.averageDamage[rarity] = damages.length > 0 
      ? Math.round(damages.reduce((a, b) => a + b, 0) / damages.length)
      : 0;
      
    stats.averageCooldown[rarity] = cooldowns.length > 0
      ? Math.round(cooldowns.reduce((a, b) => a + b, 0) / cooldowns.length * 10) / 10
      : 0;
  });
  
  return stats;
}

// Initialize logger
const logger = new Logger('DEVIL_FRUIT_SKILLS');
logger.info(`Devil Fruit Skills system initialized with ${Object.keys({...DIVINE_TIER_SKILLS, ...MYTHICAL_TIER_SKILLS, ...LEGENDARY_TIER_SKILLS, ...EPIC_TIER_SKILLS}).length} lore-accurate skills`);

// =====================================================
// RARE TIER SKILLS - Enhanced Tactical Abilities
// =====================================================

const RARE_TIER_SKILLS = {
  // Blueno's Door Master
  "doa_doa_no_mi": {
    name: "Air Door Dimension Strike",
    damage: 120,
    cooldown: 3,
    effect: "dimensional_door",
    description: "Create doors in air itself - escape to pocket dimensions and strike from impossible angles",
    type: "attack",
    range: "single",
    cost: 25,
    special: {
      dimensionalEscape: true,
      airDoor: true,
      surpriseAttack: true
    }
  },

  // Baby 5's Weapon Transformation
  "buki_buki_no_mi": {
    name: "Full Arsenal Transformation",
    damage: 110,
    cooldown: 3,
    effect: "weapon_arsenal",
    description: "Transform into any weapon imaginable - become the perfect tool for destruction",
    type: "attack",
    range: "multi",
    cost: 20,
    special: {
      weaponShift: true,
      explosiveForm: true,
      precisionStrike: true
    }
  },

  // Pudding's Memory Editor
  "memo_memo_no_mi": {
    name: "Memory Film Editing",
    damage: 80,
    cooldown: 4,
    effect: "memory_manipulation",
    description: "Edit memories like film reels - make enemies forget their abilities or create false experiences",
    type: "support",
    range: "single",
    cost: 30,
    special: {
      memoryEdit: true,
      abilityForget: true,
      falseMemory: true
    }
  },

  // Vegapunk's Brain Enhancement
  "nomi_nomi_no_mi": {
    name: "Genius Brain Overdrive",
    damage: 90,
    cooldown: 5,
    effect: "brain_boost",
    description: "Expand brain capacity infinitely - store unlimited knowledge and predict enemy patterns",
    type: "support",
    range: "self",
    cost: 35,
    special: {
      infiniteKnowledge: true,
      patternPrediction: true,
      geniusMode: true
    }
  },

  // Hancock's Love Love Beam
  "mero_mero_no_mi": {
    name: "Love Love Mellow Petrification",
    damage: 130,
    cooldown: 4,
    effect: "petrification",
    description: "Turn hearts to stone with overwhelming beauty - those who feel attraction become statues",
    type: "attack",
    range: "area",
    cost: 25,
    special: {
      beautyAura: true,
      stoneBeam: true,
      empressKick: true
    }
  },

  // Toki's Time Travel
  "toki_toki_no_mi": {
    name: "Time Leap to Future",
    damage: 0,
    cooldown: 8,
    effect: "time_travel",
    description: "Send yourself or others forward through time - escape death by jumping to the future",
    type: "support",
    range: "area",
    cost: 50,
    special: {
      futureJump: true,
      escapeTime: true,
      prophesy: true
    }
  },

  // Bonney's Age Control
  "toshi_toshi_no_mi": {
    name: "Age Age Distortion Field",
    damage: 100,
    cooldown: 3,
    effect: "age_manipulation",
    description: "Control the flow of age itself - turn enemies into helpless children or frail elders",
    type: "attack",
    range: "multi",
    cost: 20,
    special: {
      ageReverse: true,
      rapidAging: true,
      primeForm: true
    }
  },

  // San Juan Wolf's Size Growth
  "deka_deka_no_mi": {
    name: "Colossal Battleship Growth",
    damage: 140,
    cooldown: 4,
    effect: "giant_growth",
    description: "Grow to the size of a battleship - become a walking fortress of destruction",
    type: "attack",
    range: "area",
    cost: 35,
    special: {
      colossalSize: true,
      shipForm: true,
      massiveReach: true
    }
  },

  // Kanjuro's Living Art
  "fude_fude_no_mi": {
    name: "Ink Ink Living Nightmare",
    damage: 105,
    cooldown: 4,
    effect: "living_art",
    description: "Bring nightmarish drawings to life - ink creatures that fight with artistic fury",
    type: "support",
    range: "area",
    cost: 25,
    special: {
      inkCreatures: true,
      artisticFury: true,
      nightmareForm: true
    }
  },

  // Doc Q's Disease Control
  "shiku_shiku_no_mi": {
    name: "Plague Doctor's Epidemic",
    damage: 95,
    cooldown: 5,
    effect: "disease_spread",
    description: "Spread deadly diseases and plagues - weaken enemies with supernatural sickness",
    type: "attack",
    range: "area",
    cost: 30,
    special: {
      plagueSpread: true,
      diseaseImmunity: true,
      weakenAll: true
    }
  },

  // Jozu's Diamond Defense
  "kira_kira_no_mi": {
    name: "Diamond Jozu Brilliance",
    damage: 125,
    cooldown: 3,
    effect: "diamond_body",
    description: "Transform into the hardest substance - diamond body that reflects and refracts attacks",
    type: "defense",
    range: "self",
    cost: 20,
    special: {
      diamondHardness: true,
      lightRefraction: true,
      brilliantCutter: true
    }
  },

  // Additional Rare Tier Skills...
  "inu_inu_no_mi_kyubi": {
    name: "Nine-Tailed Fox Illusion",
    damage: 115,
    cooldown: 4,
    effect: "fox_illusion",
    description: "Create illusions with nine-tailed fox power - confuse enemies with false realities",
    type: "support",
    range: "area",
    cost: 25,
    special: {
      nineTails: true,
      illusionMaster: true,
      foxFire: true
    }
  },

  "hebi_hebi_no_mi_yamata": {
    name: "Eight-Headed Serpent Rampage",
    damage: 135,
    cooldown: 4,
    effect: "eight_heads",
    description: "Become the legendary eight-headed serpent - multiple attacks with venomous fury",
    type: "attack",
    range: "multi",
    cost: 30,
    special: {
      eightHeads: true,
      serpentVenom: true,
      multiStrike: true
    }
  }
};

// =====================================================
// UNCOMMON TIER SKILLS - Improved Basic Abilities
// =====================================================

const UNCOMMON_TIER_SKILLS = {
  // Otama's Animal Taming
  "kibi_kibi_no_mi": {
    name: "Dango Taming Command",
    damage: 70,
    cooldown: 2,
    effect: "animal_taming",
    description: "Tame any animal with magical dango - turn beasts into loyal companions",
    type: "support",
    range: "single",
    cost: 15,
    special: {
      animalTaming: true,
      dangoMagic: true,
      beastArmy: true
    }
  },

  // Monet's Snow Power
  "yuki_yuki_no_mi": {
    name: "Snow Woman's Blizzard",
    damage: 85,
    cooldown: 3,
    effect: "snow_storm",
    description: "Become snow itself - create blizzards that blind and freeze enemies",
    type: "attack",
    range: "area",
    cost: 18,
    special: {
      snowForm: true,
      blizzardStorm: true,
      snowWall: true
    }
  },

  // Karasu's Soot Power
  "susu_susu_no_mi": {
    name: "Soot Storm Concealment",
    damage: 75,
    cooldown: 2,
    effect: "soot_cloud",
    description: "Create concealing clouds of soot - hide your movements while choking enemies",
    type: "support",
    range: "area",
    cost: 15,
    special: {
      sootCloud: true,
      concealment: true,
      chokingDust: true
    }
  },

  // Buggy's Chop Chop
  "bara_bara_no_mi": {
    name: "Bara Bara Festival Split",
    damage: 80,
    cooldown: 2,
    effect: "body_split",
    description: "Split your body into pieces - become immune to slicing attacks and surprise enemies",
    type: "defense",
    range: "self",
    cost: 12,
    special: {
      sliceImmunity: true,
      bodyParts: true,
      surpriseFly: true
    }
  },

  // Mr. 5's Explosion Power
  "bomu_bomu_no_mi": {
    name: "Nose Fancy Cannon",
    damage: 90,
    cooldown: 2,
    effect: "explosion_body",
    description: "Turn body parts into explosives - breath explosive attacks and immune to blasts",
    type: "attack",
    range: "area",
    cost: 15,
    special: {
      explosiveBody: true,
      blastImmunity: true,
      noseCannon: true
    }
  },

  // Daz Bonez's Steel Blades
  "supa_supa_no_mi": {
    name: "Steel Blade Body Slicer",
    damage: 95,
    cooldown: 2,
    effect: "blade_body",
    description: "Transform into living steel blades - cut through anything with metallic precision",
    type: "attack",
    range: "multi",
    cost: 16,
    special: {
      steelBody: true,
      bladeEdges: true,
      metalPrecision: true
    }
  },

  // Mr. 3's Candle Power
  "doru_doru_no_mi": {
    name: "Candle Champion Fortress",
    damage: 70,
    cooldown: 3,
    effect: "wax_creation",
    description: "Create wax constructs harder than steel - build fortresses and weapons from candle wax",
    type: "defense",
    range: "area",
    cost: 18,
    special: {
      waxHardening: true,
      fortressWax: true,
      candleWeapons: true
    }
  },

  // Additional Uncommon Skills continuing the pattern...
  "numa_numa_no_mi": {
    name: "Swamp Storage Ambush",
    damage: 65,
    cooldown: 3,
    effect: "swamp_storage",
    description: "Become a living swamp - store unlimited items and ambush from muddy terrain",
    type: "support",
    range: "area",
    cost: 20,
    special: {
      infiniteStorage: true,
      swampAmbush: true,
      mudTrap: true
    }
  }
};

// =====================================================
// COMMON TIER SKILLS - Basic But Creative Abilities
// =====================================================

const COMMON_TIER_SKILLS = {
  // Miss Valentine's Weight Control
  "kiro_kiro_no_mi": {
    name: "Ten Thousand Kilo Press",
    damage: 65,
    cooldown: 2,
    effect: "weight_crush",
    description: "Control your weight from feather-light to crushing heavy - drop with devastating force",
    type: "attack",
    range: "single",
    cost: 10,
    special: {
      weightControl: true,
      crushingDrop: true,
      floatLight: true
    }
  },

  // Miss Doublefinger's Spikes
  "toge_toge_no_mi": {
    name: "Spike Spike Needle Storm",
    damage: 70,
    cooldown: 2,
    effect: "spike_body",
    description: "Grow sharp spikes from any part of your body - become a walking pincushion of pain",
    type: "attack",
    range: "area",
    cost: 12,
    special: {
      spikeGrowth: true,
      needleStorm: true,
      punctureWounds: true
    }
  },

  // Bellamy's Spring Power
  "bane_bane_no_mi": {
    name: "Spring Hopper Bounce",
    damage: 75,
    cooldown: 1,
    effect: "spring_bounce",
    description: "Transform legs into springs - bounce around the battlefield with unpredictable attacks",
    type: "attack",
    range: "multi",
    cost: 8,
    special: {
      springLegs: true,
      bounceAttack: true,
      ricocheted: true
    }
  },

  // Very Good's Berry Spheres
  "beri_beri_no_mi": {
    name: "Berry Berry Sphere Shield",
    damage: 60,
    cooldown: 2,
    effect: "berry_split",
    description: "Split into berry-like spheres - create defensive formations while maintaining attack capability",
    type: "defense",
    range: "self",
    cost: 10,
    special: {
      sphereSplit: true,
      rollingDefense: true,
      reforming: true
    }
  },

  // Shu's Rust Power
  "sabi_sabi_no_mi": {
    name: "Rust Rust Metal Decay",
    damage: 55,
    cooldown: 2,
    effect: "metal_rust",
    description: "Rust and corrode all metal on contact - weapons become useless against your touch",
    type: "support",
    range: "single",
    cost: 8,
    special: {
      metalCorrosion: true,
      weaponDestroy: true,
      rustSpread: true
    }
  },

  // More common tier skills...
  "shari_shari_no_mi": {
    name: "Wheel Wheel Spinning Strike",
    damage: 68,
    cooldown: 1,
    effect: "wheel_body",
    description: "Transform body parts into spinning wheels - roll into battle with momentum attacks",
    type: "attack",
    range: "single",
    cost: 6,
    special: {
      wheelSpin: true,
      momentumBuild: true,
      rollAttack: true
    }
  },

  "jake_jake_no_mi": {
    name: "Jacket Possession Control",
    damage: 50,
    cooldown: 3,
    effect: "jacket_control",
    description: "Transform into a jacket to control whoever wears you - dominate through fashion",
    type: "support",
    range: "single",
    cost: 15,
    special: {
      bodyControl: true,
      wearerDomination: true,
      clothingForm: true
    }
  }
};

// =====================================================
// MAIN EXPORT MODULE WITH ALL FUNCTIONALITY
// =====================================================

module.exports = {
  // Skill data by tier (organized and clean)
  DIVINE_TIER_SKILLS,
  MYTHICAL_TIER_SKILLS,
  LEGENDARY_TIER_SKILLS,
  EPIC_TIER_SKILLS,
  RARE_TIER_SKILLS,
  UNCOMMON_TIER_SKILLS,
  COMMON_TIER_SKILLS,

  // Main functions
  getSkillData,
  getFallbackSkill,
  getSkillsByRarity,
  validateSkillData,
  getSkillStats,

  // Utility functions
  hasCustomSkill: (fruitId) => {
    const allSkills = {
      ...DIVINE_TIER_SKILLS,
      ...MYTHICAL_TIER_SKILLS,
      ...LEGENDARY_TIER_SKILLS,
      ...EPIC_TIER_SKILLS,
      ...RARE_TIER_SKILLS,
      ...UNCOMMON_TIER_SKILLS,
      ...COMMON_TIER_SKILLS
    };
    return allSkills.hasOwnProperty(fruitId);
  },

  // Get all skills as flat object
  getAllSkills: () => ({
    ...DIVINE_TIER_SKILLS,
    ...MYTHICAL_TIER_SKILLS,
    ...LEGENDARY_TIER_SKILLS,
    ...EPIC_TIER_SKILLS,
    ...RARE_TIER_SKILLS,
    ...UNCOMMON_TIER_SKILLS,
    ...COMMON_TIER_SKILLS
  }),

  // Get skill count by rarity
  getSkillCounts: () => ({
    divine: Object.keys(DIVINE_TIER_SKILLS).length,
    mythical: Object.keys(MYTHICAL_TIER_SKILLS).length,
    legendary: Object.keys(LEGENDARY_TIER_SKILLS).length,
    epic: Object.keys(EPIC_TIER_SKILLS).length,
    rare: Object.keys(RARE_TIER_SKILLS).length,
    uncommon: Object.keys(UNCOMMON_TIER_SKILLS).length,
    common: Object.keys(COMMON_TIER_SKILLS).length
  }),

  // Search functions
  searchSkillsByName: (query) => {
    const allSkills = {
      ...DIVINE_TIER_SKILLS,
      ...MYTHICAL_TIER_SKILLS,
      ...LEGENDARY_TIER_SKILLS,
      ...EPIC_TIER_SKILLS,
      ...RARE_TIER_SKILLS,
      ...UNCOMMON_TIER_SKILLS,
      ...COMMON_TIER_SKILLS
    };
    
    const results = [];
    const lowercaseQuery = query.toLowerCase();
    
    Object.entries(allSkills).forEach(([fruitId, skill]) => {
      if (skill.name.toLowerCase().includes(lowercaseQuery) ||
          skill.description.toLowerCase().includes(lowercaseQuery)) {
        results.push({ fruitId, ...skill });
      }
    });
    
    return results;
  },

  // Get skills by damage range
  getSkillsByDamageRange: (minDamage, maxDamage) => {
    const allSkills = {
      ...DIVINE_TIER_SKILLS,
      ...MYTHICAL_TIER_SKILLS,
      ...LEGENDARY_TIER_SKILLS,
      ...EPIC_TIER_SKILLS,
      ...RARE_TIER_SKILLS,
      ...UNCOMMON_TIER_SKILLS,
      ...COMMON_TIER_SKILLS
    };
    
    return Object.entries(allSkills).filter(([_, skill]) => 
      skill.damage >= minDamage && skill.damage <= maxDamage
    );
  },

  // Tier validation
  isValidRarity: (rarity) => {
    const validRarities = ['divine', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
    return validRarities.includes(rarity);
  }
};
