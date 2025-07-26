// src/data/DevilFruits.js - Complete Devil Fruits Database with Standard PvP Effects
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
  
  "bara_bara_no_mi": {
    id: "bara_bara_no_mi", 
    name: "Bara Bara no Mi",
    type: "Paramecia",
    rarity: "common", 
    element: "Separation",
    power: "Allows the user to split their body into pieces",
    description: "User can separate body parts and control them independently.",
    multiplier: 1.02,
    user: "Buggy",
    skill: {
      name: "Bara Bara Festival",
      damage: 50,
      cooldown: 1,
      effect: "cutting_immunity", 
      description: "Split body parts attack independently, immune to slashing"
    }
  },

  "sube_sube_no_mi": {
    id: "sube_sube_no_mi",
    name: "Sube Sube no Mi", 
    type: "Paramecia",
    rarity: "common",
    element: "Smooth",
    power: "Makes the user's skin slippery",
    description: "Everything slides off the user's smooth skin.",
    multiplier: 1.01,
    user: "Alvida", 
    skill: {
      name: "Slip Away",
      damage: 45,
      cooldown: 0,
      effect: "dodge_boost",
      description: "Slippery skin deflects attacks"
    }
  },

  "bomu_bomu_no_mi": {
    id: "bomu_bomu_no_mi",
    name: "Bomu Bomu no Mi",
    type: "Paramecia",
    rarity: "common", 
    element: "Explosion",
    power: "Makes the user a bomb human",
    description: "User can make any part of their body explode.",
    multiplier: 1.12,
    user: "Mr. 5",
    skill: {
      name: "Explosive Barrage", 
      damage: 60,
      cooldown: 1,
      effect: "area_explosion",
      description: "Multiple explosive body parts detonate"
    }
  },

  "kilo_kilo_no_mi": {
    id: "kilo_kilo_no_mi",
    name: "Kilo Kilo no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Weight", 
    power: "Allows the user to change their weight",
    description: "User can alter weight from 1 kg to 10,000 kg.",
    multiplier: 1.08,
    user: "Miss Valentine",
    skill: {
      name: "10,000 Kilo Press",
      damage: 58,
      cooldown: 1, 
      effect: "heavy_slow",
      description: "Massive weight crushes through defenses"
    }
  },

  "doru_doru_no_mi": {
    id: "doru_doru_no_mi",
    name: "Doru Doru no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Wax",
    power: "Allows the user to create and control wax", 
    description: "User can produce candle wax that hardens to steel strength.",
    multiplier: 1.06,
    user: "Mr. 3",
    skill: {
      name: "Candle Champion",
      damage: 53,
      cooldown: 1,
      effect: "damage_reduction",
      description: "Create hardened wax constructs"
    }
  },

  "bane_bane_no_mi": {
    id: "bane_bane_no_mi", 
    name: "Bane Bane no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Spring",
    power: "Turns the user's legs into springs",
    description: "User's legs become springs for powerful jumping attacks.",
    multiplier: 1.03,
    user: "Bellamy",
    skill: {
      name: "Spring Launcher",
      damage: 52,
      cooldown: 0,
      effect: "multi_strike", 
      description: "Spring-powered bouncing attacks"
    }
  },

  "supa_supa_no_mi": {
    id: "supa_supa_no_mi",
    name: "Supa Supa no Mi", 
    type: "Paramecia",
    rarity: "common",
    element: "Blade",
    power: "Turns the user's body into blades",
    description: "User can turn any body part into steel blades.",
    multiplier: 1.10,
    user: "Daz Bonez",
    skill: {
      name: "Blade Storm",
      damage: 57,
      cooldown: 1,
      effect: "multi_strike",
      description: "Multiple blade attacks from body"
    }
  },

  "toge_toge_no_mi": {
    id: "toge_toge_no_mi",
    name: "Toge Toge no Mi",
    type: "Paramecia", 
    rarity: "common",
    element: "Spike",
    power: "Allows the user to grow spikes from their body",
    description: "User can grow spikes from any body part.",
    multiplier: 1.07,
    user: "Miss Doublefinger",
    skill: {
      name: "Spike Barrier",
      damage: 54,
      cooldown: 1,
      effect: "damage_reflection",
      description: "Spikes damage anyone who attacks"
    }
  },

  "ori_ori_no_mi": {
    id: "ori_ori_no_mi",
    name: "Ori Ori no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Cage",
    power: "Allows the user to bind opponents with iron",
    description: "User can create iron shackles and cages.",
    multiplier: 1.04,
    user: "Hina",
    skill: {
      name: "Iron Cage", 
      damage: 48,
      cooldown: 2,
      effect: "movement_bind",
      description: "Create iron restraints around enemy"
    }
  },

  "baku_baku_no_mi": {
    id: "baku_baku_no_mi",
    name: "Baku Baku no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Munch",
    power: "Allows the user to eat anything",
    description: "User can consume anything and transform into it.",
    multiplier: 1.09,
    user: "Wapol",
    skill: {
      name: "Munch Munch Factory",
      damage: 56,
      cooldown: 1,
      effect: "power_drain", 
      description: "Transform into combination of eaten objects"
    }
  },

  "mane_mane_no_mi": {
    id: "mane_mane_no_mi",
    name: "Mane Mane no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Clone",
    power: "Allows the user to copy appearances",
    description: "User can transform into anyone they've touched.",
    multiplier: 1.05,
    user: "Bon Clay",
    skill: {
      name: "Perfect Clone",
      damage: 51,
      cooldown: 1,
      effect: "stealth_mode",
      description: "Copy enemy's appearance and basic abilities"
    }
  },

  "hana_hana_no_mi": {
    id: "hana_hana_no_mi",
    name: "Hana Hana no Mi", 
    type: "Paramecia",
    rarity: "common",
    element: "Flower",
    power: "Allows the user to sprout body parts anywhere",
    description: "User can sprout copies of body parts from any surface.",
    multiplier: 1.11,
    user: "Nico Robin",
    skill: {
      name: "Dos Fleur",
      damage: 59,
      cooldown: 0,
      effect: "multi_strike",
      description: "Sprout multiple arms for combo attacks"
    }
  },

  "shari_shari_no_mi": {
    id: "shari_shari_no_mi",
    name: "Shari Shari no Mi",
    type: "Paramecia", 
    rarity: "common",
    element: "Wheel",
    power: "Turns the user's limbs into wheels",
    description: "User can transform limbs into spinning wheels.",
    multiplier: 1.03,
    user: "Sharinguru",
    skill: {
      name: "Wheel Cannon",
      damage: 49,
      cooldown: 1,
      effect: "speed_boost",
      description: "High-speed spinning wheel attacks"
    }
  },

  "beri_beri_no_mi": {
    id: "beri_beri_no_mi",
    name: "Beri Beri no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Berry",
    power: "Allows the user to turn into berries", 
    description: "User can split body into small berry-like orbs.",
    multiplier: 1.02,
    user: "Very Good",
    skill: {
      name: "Berry Scatter Shot",
      damage: 47,
      cooldown: 1,
      effect: "dodge_boost",
      description: "Split into berries to confuse and attack"
    }
  },

  // Zoan fruits
  "hito_hito_no_mi": {
    id: "hito_hito_no_mi",
    name: "Hito Hito no Mi",
    type: "Zoan",
    rarity: "common", 
    element: "Human",
    power: "Transforms the user into a human",
    description: "Grants human intelligence and transformation ability.",
    multiplier: 1.20,
    user: "Tony Tony Chopper",
    skill: {
      name: "Human Intelligence",
      damage: 45,
      cooldown: 0,
      effect: "tactical_advantage",
      description: "Enhanced intelligence improves tactics"
    }
  },

  "tori_tori_no_mi_falcon": {
    id: "tori_tori_no_mi_falcon",
    name: "Tori Tori no Mi, Model: Falcon",
    type: "Zoan",
    rarity: "common",
    element: "Falcon", 
    power: "Transforms the user into a falcon",
    description: "User can transform into falcon or falcon-human hybrid.",
    multiplier: 1.33,
    user: "Pell",
    skill: {
      name: "Falcon Dive",
      damage: 46,
      cooldown: 0,
      effect: "speed_boost",
      description: "High-speed diving attack from above"
    }
  },

  "inu_inu_no_mi_dachshund": {
    id: "inu_inu_no_mi_dachshund",
    name: "Inu Inu no Mi, Model: Dachshund",
    type: "Zoan",
    rarity: "common",
    element: "Dachshund",
    power: "Transforms the user into a dachshund",
    description: "User can transform into dachshund or hybrid form.",
    multiplier: 1.24,
    user: "Lassoo",
    skill: {
      name: "Launcher Attack",
      damage: 54,
      cooldown: 0,
      effect: "area_explosion", 
      description: "Transform into bazooka for ranged attack"
    }
  },

  "mogu_mogu_no_mi": {
    id: "mogu_mogu_no_mi",
    name: "Mogu Mogu no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Mole",
    power: "Transforms the user into a mole",
    description: "User can transform into mole or mole-human hybrid.",
    multiplier: 1.27,
    user: "Miss Merry Christmas",
    skill: {
      name: "Underground Strike",
      damage: 56,
      cooldown: 1,
      effect: "stealth_mode",
      description: "Attack from underground tunnels"
    }
  },

  "inu_inu_no_mi_jackal": {
    id: "inu_inu_no_mi_jackal", 
    name: "Inu Inu no Mi, Model: Jackal",
    type: "Zoan",
    rarity: "common",
    element: "Jackal",
    power: "Transforms the user into a jackal",
    description: "User can transform into jackal or jackal-human hybrid.",
    multiplier: 1.31,
    user: "Chaka",
    skill: {
      name: "Desert Fang",
      damage: 52,
      cooldown: 1,
      effect: "vision_impair",
      description: "Jackal fangs with sand manipulation"
    }
  },

  "uma_uma_no_mi": {
    id: "uma_uma_no_mi",
    name: "Uma Uma no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Horse",
    power: "Transforms the user into a horse", 
    description: "User can transform into horse or horse-human hybrid.",
    multiplier: 1.37,
    user: "Pierre",
    skill: {
      name: "Galloping Kick",
      damage: 51,
      cooldown: 0,
      effect: "speed_boost",
      description: "High-speed horse kick"
    }
  },

  "neko_neko_no_mi_leopard": {
    id: "neko_neko_no_mi_leopard",
    name: "Neko Neko no Mi, Model: Leopard",
    type: "Zoan",
    rarity: "common",
    element: "Leopard",
    power: "Transforms the user into a leopard",
    description: "User can transform into leopard or leopard-human hybrid.",
    multiplier: 1.39,
    user: "Rob Lucci",
    skill: {
      name: "Leopard Pounce",
      damage: 49,
      cooldown: 1,
      effect: "stealth_mode",
      description: "Stealthy leopard attack"
    }
  },

  "inu_inu_no_mi_wolf": {
    id: "inu_inu_no_mi_wolf",
    name: "Inu Inu no Mi, Model: Wolf",
    type: "Zoan", 
    rarity: "common",
    element: "Wolf",
    power: "Transforms the user into a wolf",
    description: "User can transform into wolf or wolf-human hybrid.",
    multiplier: 1.34,
    user: "Jabra",
    skill: {
      name: "Wolf Pack Strike",
      damage: 48,
      cooldown: 1,
      effect: "multi_strike",
      description: "Wolf instincts enhance combat"
    }
  },

  "zou_zou_no_mi": {
    id: "zou_zou_no_mi",
    name: "Zou Zou no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Elephant",
    power: "Transforms the user into an elephant",
    description: "User can transform into elephant or elephant-human hybrid.",
    multiplier: 1.40,
    user: "Funkfreed",
    skill: {
      name: "Elephant Stomp",
      damage: 47,
      cooldown: 1,
      effect: "heavy_slow",
      description: "Massive elephant stomp creates tremors"
    }
  },

  "ushi_ushi_no_mi_bison": {
    id: "ushi_ushi_no_mi_bison",
    name: "Ushi Ushi no Mi, Model: Bison",
    type: "Zoan",
    rarity: "common",
    element: "Bison",
    power: "Transforms the user into a bison",
    description: "User can transform into bison or bison-human hybrid.",
    multiplier: 1.38,
    user: "Dalton",
    skill: {
      name: "Bison Charge",
      damage: 46,
      cooldown: 1,
      effect: "paralysis",
      description: "Massive charging attack"
    }
  },

  // =====================================================
  // UNCOMMON FRUITS (40 fruits) - 1.2x to 1.4x CP  
  // =====================================================
  "noro_noro_no_mi": {
    id: "noro_noro_no_mi",
    name: "Noro Noro no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Slow",
    power: "Allows the user to slow down anything",
    description: "User can emit photons that slow anything for 30 seconds.",
    multiplier: 1.41,
    user: "Foxy",
    skill: {
      name: "Slow Photon",
      damage: 75,
      cooldown: 2,
      effect: "heavy_slow",
      description: "Photons drastically slow enemy movement"
    }
  },

  "doa_doa_no_mi": {
    id: "doa_doa_no_mi",
    name: "Doa Doa no Mi",
    type: "Paramecia",
    rarity: "uncommon", 
    element: "Door",
    power: "Allows the user to create doors anywhere",
    description: "User can create doors on any surface, including air.",
    multiplier: 1.22,
    user: "Blueno",
    skill: {
      name: "Door Surprise",
      damage: 74,
      cooldown: 2,
      effect: "teleport_strike",
      description: "Attack through dimensional doors"
    }
  },

  "awa_awa_no_mi": {
    id: "awa_awa_no_mi",
    name: "Awa Awa no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Bubble",
    power: "Allows the user to create and control bubbles",
    description: "User can generate soap bubbles that weaken enemies.",
    multiplier: 1.28,
    user: "Kalifa",
    skill: {
      name: "Bubble Trap",
      damage: 73,
      cooldown: 2,
      effect: "status_cleanse",
      description: "Soap bubbles wash away strength"
    }
  },

  "beta_beta_no_mi": {
    id: "beta_beta_no_mi",
    name: "Beta Beta no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Sticky",
    power: "Allows the user to create and control sticky liquid",
    description: "User can create and control sticky substances.",
    multiplier: 1.32,
    user: "Trebol",
    skill: {
      name: "Sticky Prison",
      damage: 72,
      cooldown: 2,
      effect: "movement_bind",
      description: "Trap enemies in sticky mucus"
    }
  },

  "bari_bari_no_mi": {
    id: "bari_bari_no_mi",
    name: "Bari Bari no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Barrier",
    power: "Allows the user to create barriers",
    description: "User can create invisible barriers that are indestructible.",
    multiplier: 1.38,
    user: "Bartolomeo",
    skill: {
      name: "Barrier Crash",
      damage: 71,
      cooldown: 2,
      effect: "damage_reflection",
      description: "Unbreakable barriers reflect attacks"
    }
  },

  "ryu_ryu_no_mi_spinosaurus": {
    id: "ryu_ryu_no_mi_spinosaurus",
    name: "Ryu Ryu no Mi, Model: Spinosaurus",
    type: "Ancient Zoan",
    rarity: "uncommon",
    element: "Spinosaurus",
    power: "Transforms the user into a Spinosaurus",
    description: "User can transform into Spinosaurus or hybrid form.",
    multiplier: 1.38,
    user: "X Drake",
    skill: {
      name: "Sail Slash",
      damage: 60,
      cooldown: 2,
      effect: "multi_strike",
      description: "Back sail creates powerful attacks"
    }
  },

  "ryu_ryu_no_mi_pteranodon": {
    id: "ryu_ryu_no_mi_pteranodon", 
    name: "Ryu Ryu no Mi, Model: Pteranodon",
    type: "Ancient Zoan",
    rarity: "uncommon",
    element: "Pteranodon",
    power: "Transforms the user into a Pteranodon",
    description: "User can transform into Pteranodon or hybrid form.",
    multiplier: 1.37,
    user: "King",
    skill: {
      name: "Aerial Crash",
      damage: 61,
      cooldown: 2,
      effect: "speed_boost",
      description: "High-speed pteranodon dive attack"
    }
  },

  // =====================================================  
  // RARE FRUITS (40 fruits) - 1.4x to 1.7x CP
  // =====================================================
  "suke_suke_no_mi": {
    id: "suke_suke_no_mi",
    name: "Suke Suke no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Clear",
    power: "Grants the user invisibility", 
    description: "User can become invisible and make touched objects invisible.",
    multiplier: 1.55,
    user: "Absalom",
    skill: {
      name: "Invisible Assault",
      damage: 110,
      cooldown: 3,
      effect: "stealth_mode",
      description: "Attack while completely invisible"
    }
  },

  "horo_horo_no_mi": {
    id: "horo_horo_no_mi",
    name: "Horo Horo no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Hollow",
    power: "Allows the user to create and control ghosts",
    description: "User can create ghosts that drain enemy willpower.",
    multiplier: 1.25,
    user: "Perona",
    skill: {
      name: "Negative Hollow",
      damage: 108,
      cooldown: 3,
      effect: "morale_break",
      description: "Ghosts drain fighting spirit completely"
    }
  },

  "yomi_yomi_no_mi": {
    id: "yomi_yomi_no_mi",
    name: "Yomi Yomi no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Revive",
    power: "Grants the user a second life",
    description: "User's soul returns after death and gains soul abilities.",
    multiplier: 1.30,
    user: "Brook",
    skill: {
      name: "Soul Parade",
      damage: 107,
      cooldown: 3,
      effect: "life_drain",
      description: "Soul power freezes enemies to the bone"
    }
  },

  "kage_kage_no_mi": {
    id: "kage_kage_no_mi",
    name: "Kage Kage no Mi", 
    type: "Paramecia",
    rarity: "rare",
    element: "Shadow",
    power: "Allows the user to control shadows",
    description: "User can manipulate shadows and create shadow zombies.",
    multiplier: 1.35,
    user: "Gecko Moria",
    skill: {
      name: "Shadow Revolution",
      damage: 106,
      cooldown: 3,
      effect: "power_drain",
      description: "Command army of shadow zombies"
    }
  },

  "horu_horu_no_mi": {
    id: "horu_horu_no_mi",
    name: "Horu Horu no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Hormone",
    power: "Allows the user to control hormones",
    description: "User can inject hormones to heal and enhance abilities.",
    multiplier: 1.26,
    user: "Emporio Ivankov",
    skill: {
      name: "Emporio Face Growth",
      damage: 105,
      cooldown: 3,
      effect: "healing_boost",
      description: "Hormone injection alters enemy abilities"
    }
  },

  "doku_doku_no_mi": {
    id: "doku_doku_no_mi",
    name: "Doku Doku no Mi",
    type: "Paramecia", 
    rarity: "rare",
    element: "Poison",
    power: "Allows the user to create and control poison",
    description: "User can create various poisons and is immune to toxins.",
    multiplier: 1.58,
    user: "Magellan",
    skill: {
      name: "Venom Demon",
      damage: 101,
      cooldown: 3,
      effect: "poison_3_turns",
      description: "Deadly multi-layered poison attack"
    }
  },

  "moku_moku_no_mi": {
    id: "moku_moku_no_mi",
    name: "Moku Moku no Mi",
    type: "Logia",
    rarity: "rare",
    element: "Smoke",
    power: "Allows the user to create and control smoke",
    description: "User becomes smoke and can create/control smoke.",
    multiplier: 1.45,
    user: "Smoker",
    skill: {
      name: "White Blow",
      damage: 144,
      cooldown: 3,
      effect: "vision_impair", 
      description: "Dense smoke blinds and confuses"
    }
  },

  "suna_suna_no_mi": {
    id: "suna_suna_no_mi",
    name: "Suna Suna no Mi",
    type: "Logia",
    rarity: "rare",
    element: "Sand",
    power: "Allows the user to create and control sand",
    description: "User becomes sand and can dehydrate anything.",
    multiplier: 1.60,
    user: "Crocodile",
    skill: {
      name: "Desert Spada",
      damage: 143,
      cooldown: 3,
      effect: "life_drain",
      description: "Sand blade drains all moisture"
    }
  },

  // =====================================================
  // EPIC FRUITS (25 fruits) - 1.7x to 2.1x CP
  // =====================================================
  "hie_hie_no_mi": {
    id: "hie_hie_no_mi",
    name: "Hie Hie no Mi",
    type: "Logia",
    rarity: "epic",
    element: "Ice",
    power: "Allows the user to create and control ice",
    description: "User becomes ice and can freeze anything.",
    multiplier: 1.63,
    user: "Kuzan (Aokiji)",
    skill: {
      name: "Ice Block: Pheasant Beak",
      damage: 142,
      cooldown: 3,
      effect: "freeze_3_turns",
      description: "Ice bird freezes enemies solid"
    }
  },

  "mera_mera_no_mi": {
    id: "mera_mera_no_mi",
    name: "Mera Mera no Mi",
    type: "Logia",
    rarity: "epic",
    element: "Fire",
    power: "Allows the user to create and control fire",
    description: "User becomes fire and can create/control flames.",
    multiplier: 1.65,
    user: "Portgas D. Ace",
    skill: {
      name: "Hiken (Fire Fist)",
      damage: 141,
      cooldown: 3,
      effect: "burn_4_turns", 
      description: "Devastating fire punch burns continuously"
    }
  },

  "goro_goro_no_mi": {
    id: "goro_goro_no_mi",
    name: "Goro Goro no Mi",
    type: "Logia",
    rarity: "epic",
    element: "Lightning",
    power: "Allows the user to create and control lightning",
    description: "User becomes lightning with incredible speed.",
    multiplier: 1.70,
    user: "Enel",
    skill: {
      name: "El Thor",
      damage: 140,
      cooldown: 3,
      effect: "paralysis",
      description: "Lightning pillar paralyzes enemies"
    }
  },

  "gasu_gasu_no_mi": {
    id: "gasu_gasu_no_mi",
    name: "Gasu Gasu no Mi",
    type: "Logia",
    rarity: "epic",
    element: "Gas",
    power: "Allows the user to create and control gas",
    description: "User becomes gas and can create poisonous gases.",
    multiplier: 1.52,
    user: "Caesar Clown",
    skill: {
      name: "Gastille",
      damage: 147,
      cooldown: 3,
      effect: "poison_3_turns",
      description: "Poisonous gas cloud suffocates enemies"
    }
  },

  "yuki_yuki_no_mi": {
    id: "yuki_yuki_no_mi",
    name: "Yuki Yuki no Mi",
    type: "Logia",
    rarity: "epic",
    element: "Snow",
    power: "Allows the user to create and control snow",
    description: "User becomes snow and can create blizzards.",
    multiplier: 1.48,
    user: "Monet",
    skill: {
      name: "Blizzard Storm",
      damage: 146,
      cooldown: 3,
      effect: "freeze_3_turns",
      description: "Create blinding blizzard that freezes all"
    }
  },

  "numa_numa_no_mi": {
    id: "numa_numa_no_mi",
    name: "Numa Numa no Mi",
    type: "Logia",
    rarity: "epic",
    element: "Swamp",
    power: "Allows the user to create and control swamps",
    description: "User becomes swamp matter and can trap enemies.",
    multiplier: 1.50,
    user: "Caribou",
    skill: {
      name: "Swamp Prison",
      damage: 145,
      cooldown: 3,
      effect: "movement_bind",
      description: "Trap enemies in bottomless swamp"
    }
  },

  "kira_kira_no_mi": {
    id: "kira_kira_no_mi",
    name: "Kira Kira no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Diamond",
    power: "Allows the user to turn into diamond",
    description: "User can transform body into diamond, hardest substance.",
    multiplier: 1.62,
    user: "Jozu",
    skill: {
      name: "Diamond Jozu",
      damage: 159,
      cooldown: 4,
      effect: "damage_reduction",
      description: "Diamond body provides ultimate defense"
    }
  },

  "ito_ito_no_mi": {
    id: "ito_ito_no_mi",
    name: "Ito Ito no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "String",
    power: "Allows the user to create and control strings",
    description: "User can create razor-sharp strings and control people.",
    multiplier: 1.64,
    user: "Donquixote Doflamingo",
    skill: {
      name: "Overheat",
      damage: 237,
      cooldown: 6,
      effect: "movement_bind",
      description: "Razor strings control everything"
    }
  },

  "zushi_zushi_no_mi": {
    id: "zushi_zushi_no_mi",
    name: "Zushi Zushi no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Gravity",
    power: "Allows the user to control gravity",
    description: "User can manipulate gravitational forces.",
    multiplier: 1.67,
    user: "Fujitora",
    skill: {
      name: "Gravity Blade",
      damage: 97,
      cooldown: 3,
      effect: "heavy_slow",
      description: "Gravity pulls enemies helplessly down"
    }
  },

  // =====================================================
  // LEGENDARY FRUITS (20 fruits) - 2.1x to 2.6x CP
  // =====================================================
  "ope_ope_no_mi": {
    id: "ope_ope_no_mi",
    name: "Ope Ope no Mi",
    type: "Paramecia",
    rarity: "legendary",
    element: "Operation",
    power: "Grants surgical powers within a Room",
    description: "User can manipulate anything within their Room space.",
    multiplier: 2.50,
    user: "Trafalgar D. Water Law",
    skill: {
      name: "Room: Shambles",
      damage: 236,
      cooldown: 5,
      effect: "teleport_strike",
      description: "Surgical manipulation of space itself"
    }
  },

  "nikyu_nikyu_no_mi": {
    id: "nikyu_nikyu_no_mi",
    name: "Nikyu Nikyu no Mi",
    type: "Paramecia",
    rarity: "legendary",
    element: "Paw",
    power: "Grants paw pads that can repel anything",
    description: "User has paw pads that can repel damage, pain, and air.",
    multiplier: 2.38,
    user: "Bartholomew Kuma",
    skill: {
      name: "Ursus Shock",
      damage: 239,
      cooldown: 6,
      effect: "area_explosion",
      description: "Compressed air creates devastating explosion"
    }
  },

  "mochi_mochi_no_mi": {
    id: "mochi_mochi_no_mi",
    name: "Mochi Mochi no Mi",
    type: "Special Paramecia",
    rarity: "legendary",
    element: "Mochi",
    power: "Allows the user to create and control mochi",
    description: "User can create, control and become mochi like a Logia.",
    multiplier: 1.95,
    user: "Charlotte Katakuri",
    skill: {
      name: "Zan Giri Mochi",
      damage: 235,
      cooldown: 5,
      effect: "dodge_boost",
      description: "Perfect mochi control and prediction"
    }
  },

  "pika_pika_no_mi": {
    id: "pika_pika_no_mi",
    name: "Pika Pika no Mi",
    type: "Logia",
    rarity: "legendary",
    element: "Light",
    power: "Allows the user to create and control light",
    description: "User becomes light and moves at light speed.",
    multiplier: 2.05,
    user: "Borsalino (Kizaru)",
    skill: {
      name: "Yasakani no Magatama",
      damage: 234,
      cooldown: 5,
      effect: "multi_strike",
      description: "Light-speed projectile barrage"
    }
  },

  "magu_magu_no_mi": {
    id: "magu_magu_no_mi",
    name: "Magu Magu no Mi",
    type: "Logia",
    rarity: "legendary",
    element: "Magma",
    power: "Allows the user to create and control magma",
    description: "User becomes magma, superior to fire.",
    multiplier: 2.10,
    user: "Sakazuki (Akainu)",
    skill: {
      name: "Dai Funka",
      damage: 233,
      cooldown: 6,
      effect: "burn_4_turns",
      description: "Massive magma eruption destroys all"
    }
  },

  "tori_tori_no_mi_phoenix": {
    id: "tori_tori_no_mi_phoenix",
    name: "Tori Tori no Mi, Model: Phoenix",
    type: "Mythical Zoan",
    rarity: "legendary",
    element: "Phoenix",
    power: "Transforms the user into a phoenix",
    description: "User can transform into phoenix and regenerate from any injury.",
    multiplier: 2.40,
    user: "Marco",
    skill: {
      name: "Phoenix Brand",
      damage: 232,
      cooldown: 5,
      effect: "healing_boost",
      description: "Blue flames heal while burning enemies"
    }
  },

  "hito_hito_no_mi_daibutsu": {
    id: "hito_hito_no_mi_daibutsu",
    name: "Hito Hito no Mi, Model: Daibutsu",
    type: "Mythical Zoan",
    rarity: "legendary",
    element: "Great Buddha",
    power: "Transforms the user into a giant golden Buddha",
    description: "User becomes giant Buddha with shockwave attacks.",
    multiplier: 2.45,
    user: "Sengoku",
    skill: {
      name: "Buddha Impact",
      damage: 231,
      cooldown: 5,
      effect: "area_explosion",
      description: "Divine shockwave purifies everything"
    }
  },

  "uo_uo_no_mi_seiryu": {
    id: "uo_uo_no_mi_seiryu",
    name: "Uo Uo no Mi, Model: Seiryu",
    type: "Mythical Zoan",
    rarity: "legendary",
    element: "Azure Dragon",
    power: "Transforms the user into an Azure Dragon",
    description: "User can transform into massive dragon with weather control.",
    multiplier: 2.55,
    user: "Kaido",
    skill: {
      name: "Bolo Breath",
      damage: 197,
      cooldown: 5,
      effect: "burn_4_turns",
      description: "Concentrated heat beam breath"
    }
  },

  "soru_soru_no_mi": {
    id: "soru_soru_no_mi",
    name: "Soru Soru no Mi",
    type: "Paramecia",
    rarity: "legendary",
    element: "Soul",
    power: "Allows the user to manipulate souls",
    description: "User can extract souls and put them into objects.",
    multiplier: 2.08,
    user: "Charlotte Linlin (Big Mom)",
    skill: {
      name: "Soul Extraction",
      damage: 200,
      cooldown: 5,
      effect: "life_drain",
      description: "Extract and manipulate enemy souls"
    }
  },

  "toki_toki_no_mi": {
    id: "toki_toki_no_mi",
    name: "Toki Toki no Mi",
    type: "Paramecia",
    rarity: "legendary",
    element: "Time",
    power: "Allows the user to travel through time",
    description: "User can send themselves or others forward in time.",
    multiplier: 2.20,
    user: "Kozuki Toki",
    skill: {
      name: "Time Skip",
      damage: 198,
      cooldown: 6,
      effect: "speed_boost",
      description: "Send attacks through time"
    }
  },

  // =====================================================
  // MYTHICAL FRUITS (10 fruits) - 2.6x to 3.2x CP
  // =====================================================
  "gomu_gomu_no_mi_awakened": {
    id: "gomu_gomu_no_mi_awakened",
    name: "Gomu Gomu no Mi (Awakened)",
    type: "Mythical Zoan",
    rarity: "mythical",
    element: "Sun God",
    power: "Sun God Nika's true power awakened",
    description: "True form of Hito Hito no Mi, Model: Nika with reality manipulation.",
    multiplier: 3.00,
    user: "Monkey D. Luffy",
    skill: {
      name: "Gear 5: Liberation",
      damage: 265,
      cooldown: 6,
      effect: "reality_bend",
      description: "Sun God's power bends all reality"
    }
  },

  "yami_yami_no_mi_dual": {
    id: "yami_yami_no_mi_dual",
    name: "Yami Yami no Mi + Gura Gura no Mi",
    type: "Dual Logia/Paramecia",
    rarity: "mythical",
    element: "Darkness + Tremor",
    power: "Dual Devil Fruit powers of darkness and earthquakes",
    description: "Unique ability to wield both darkness and earthquake powers.",
    multiplier: 3.20,
    user: "Marshall D. Teach (Blackbeard)",
    skill: {
      name: "Dark Quake",
      damage: 280,
      cooldown: 7,
      effect: "area_explosion",
      description: "Darkness and tremors crack reality itself"
    }
  },

  "soru_soru_no_mi_awakened": {
    id: "soru_soru_no_mi_awakened",
    name: "Soru Soru no Mi (Awakened)",
    type: "Paramecia",
    rarity: "mythical",
    element: "Soul",
    power: "Complete soul manipulation awakened",
    description: "Awakened soul power can affect all living beings.",
    multiplier: 2.80,
    user: "Charlotte Linlin (Awakened)",
    skill: {
      name: "Soul Dominion",
      damage: 260,
      cooldown: 6,
      effect: "power_null",
      description: "Control souls of all nearby beings"
    }
  },

  "magu_magu_no_mi_awakened": {
    id: "magu_magu_no_mi_awakened", 
    name: "Magu Magu no Mi (Awakened)",
    type: "Logia",
    rarity: "mythical",
    element: "Magma",
    power: "Awakened magma that affects environment",
    description: "Awakened magma can permanently change terrain.",
    multiplier: 3.05,
    user: "Sakazuki (Awakened)",
    skill: {
      name: "Meteor Volcano Awakening",
      damage: 275,
      cooldown: 6,
      effect: "burn_4_turns",
      description: "Transform entire battlefield into volcanic wasteland"
    }
  },

  "pika_pika_no_mi_awakened": {
    id: "pika_pika_no_mi_awakened",
    name: "Pika Pika no Mi (Awakened)",
    type: "Logia", 
    rarity: "mythical",
    element: "Light",
    power: "Awakened light beyond speed limits",
    description: "Awakened light transcends physical limitations.",
    multiplier: 2.95,
    user: "Borsalino (Awakened)",
    skill: {
      name: "Light Speed Infinity",
      damage: 270,
      cooldown: 6,
      effect: "speed_boost",
      description: "Move so fast time seems to stop"
    }
  },

  "goro_goro_no_mi_awakened": {
    id: "goro_goro_no_mi_awakened",
    name: "Goro Goro no Mi (Awakened)",
    type: "Logia",
    rarity: "mythical",
    element: "Lightning",
    power: "Divine lightning that commands storms",
    description: "Awakened lightning controls weather across islands.",
    multiplier: 3.15,
    user: "Enel (Awakened)",
    skill: {
      name: "Raijin's Wrath",
      damage: 285,
      cooldown: 7,
      effect: "paralysis",
      description: "Call down wrath of the Thunder God"
    }
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
    skill: {
      name: "Kurouzu",
      damage: 240,
      cooldown: 6,
      effect: "power_null",
      description: "Infinite darkness consumes everything"
    }
  },

  "one_piece_treasure": {
    id: "one_piece_treasure",
    name: "One Piece",
    type: "Divine Artifact",
    rarity: "divine", 
    element: "Truth",
    power: "The ultimate treasure containing all secrets",
    description: "The legendary treasure that reveals the true history.",
    multiplier: 4.00,
    user: "Gol D. Roger",
    skill: {
      name: "Truth of the World",
      damage: 300,
      cooldown: 8,
      effect: "reality_bend",
      description: "Rewrite the laws of reality itself"
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
    skill: {
      name: "Liberation Wave",
      damage: 290,
      cooldown: 7,
      effect: "status_cleanse",
      description: "Free all beings from their chains"
    }
  }
};

// Rarity weights for gacha system
const RARITY_WEIGHTS = {
  common: 47,      // 47%
  uncommon: 30,    // 30%  
  rare: 15,        // 15%
  epic: 5,         // 5%
  legendary: 2,    // 2%
  mythical: 0.8,   // 0.8%
  divine: 0.2      // 0.2%
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
  const baseWeights = { ...RARITY_WEIGHTS };
  
  // Pity system implementation
  if (pityCount >= 90) {
    // Guaranteed legendary+ at 90 pulls
    return {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 60,
      mythical: 30,
      divine: 10
    };
  } else if (pityCount >= 75) {
    // Increased rare+ chances after 75 pulls
    return {
      common: 20,
      uncommon: 20,
      rare: 30,
      epic: 20,
      legendary: 7,
      mythical: 2.5,
      divine: 0.5
    };
  } else if (pityCount >= 50) {
    // Soft pity after 50 pulls
    const pityMultiplier = 1 + ((pityCount - 50) * 0.02);
    return {
      common: Math.max(20, baseWeights.common - (pityCount - 50) * 0.5),
      uncommon: Math.max(15, baseWeights.uncommon - (pityCount - 50) * 0.3),
      rare: baseWeights.rare * 1.2,
      epic: baseWeights.epic * 1.5,
      legendary: baseWeights.legendary * pityMultiplier,
      mythical: baseWeights.mythical * pityMultiplier,
      divine: baseWeights.divine * pityMultiplier
    };
  }
  
  return baseWeights;
}

function getFruitsByRarity(rarity) {
  return Object.values(DEVIL_FRUITS).filter(fruit => fruit.rarity === rarity);
}

function getFruitById(id) {
  return DEVIL_FRUITS[id] || null;
}

function getRandomFruitByRarity(rarity) {
  const fruits = getFruitsByRarity(rarity);
  return fruits[Math.floor(Math.random() * fruits.length)];
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

module.exports = { 
  DEVIL_FRUITS, 
  RARITY_WEIGHTS,
  RARITY_COLORS,
  RARITY_EMOJIS,
  getRarityWeights,
  getFruitsByRarity,
  getFruitById,
  getRandomFruitByRarity,
  getAllFruits,
  getStats
};
