// src/data/DevilFruitSkills.js - Complete Devil Fruit Skills Database
// Add this file to your bot: src/data/DevilFruitSkills.js

const DEVIL_FRUIT_SKILLS = {
  // ===== DIVINE TIER (5 FRUITS) =====
  "gura_gura_no_mi": {
    name: "World Ender",
    damage: 280,
    cooldown: 7,
    effect: "area_explosion",
    description: "Crack the very fabric of reality with devastating quakes",
    type: "ultimate"
  },
  "hito_hito_no_mi_nika": {
    name: "Gear 5: Perfect Liberation", 
    damage: 265,
    cooldown: 6,
    effect: "reality_bend",
    description: "Sun God's power bends all reality to your will",
    type: "ultimate"
  },
  "yami_yami_no_mi": {
    name: "Kurouzu",
    damage: 240,
    cooldown: 6,
    effect: "power_null",
    description: "Infinite darkness consumes and nullifies all powers",
    type: "ultimate"
  },
  "joy_boy_will": {
    name: "Liberation Wave",
    damage: 290,
    cooldown: 7,
    effect: "status_cleanse",
    description: "Free all beings from their chains and limitations",
    type: "ultimate"
  },
  "one_piece_treasure": {
    name: "Truth of the World",
    damage: 300,
    cooldown: 8,
    effect: "reality_bend",
    description: "Rewrite the laws of reality itself with ultimate truth",
    type: "ultimate"
  },

  // ===== MYTHICAL TIER (2 FRUITS) =====
  "tori_tori_no_mi_phoenix": {
    name: "Immortal Flames",
    damage: 210,
    cooldown: 5,
    effect: "phoenix_rebirth",
    description: "Blue flames heal wounds while burning enemies to ash",
    type: "special"
  },
  "ancient_weapon_pluton": {
    name: "World Destroyer Cannon",
    damage: 230,
    cooldown: 6,
    effect: "devastating_blast",
    description: "Ancient weapon's planet-shattering cannon destroys everything",
    type: "special"
  },

  // ===== LEGENDARY TIER (4 FRUITS) =====
  "mera_mera_no_mi": {
    name: "Fire Fist",
    damage: 180,
    cooldown: 4,
    effect: "burn_3_turns",
    description: "Massive fire punch engulfs enemy in eternal flames",
    type: "attack"
  },
  "hie_hie_no_mi": {
    name: "Ice Age",
    damage: 170,
    cooldown: 5,
    effect: "freeze_2_turns",
    description: "Absolute zero freezes time and space itself",
    type: "attack"
  },
  "pika_pika_no_mi": {
    name: "Light Speed Kick",
    damage: 190,
    cooldown: 4,
    effect: "cannot_dodge",
    description: "Strike at light speed - impossible to avoid or counter",
    type: "attack"
  },
  "ope_ope_no_mi": {
    name: "Room: Shambles",
    damage: 160,
    cooldown: 5,
    effect: "position_swap",
    description: "Create surgical room to manipulate space and matter",
    type: "utility"
  },

  // ===== EPIC TIER (15 FRUITS) =====
  "suna_suna_no_mi": {
    name: "Desert Spada",
    damage: 140,
    cooldown: 3,
    effect: "dehydrate_3_turns",
    description: "Sand blade drains all moisture from the enemy",
    type: "attack"
  },
  "moku_moku_no_mi": {
    name: "White Smoke Prison",
    damage: 120,
    cooldown: 3,
    effect: "trap_2_turns",
    description: "Impenetrable smoke cage traps enemy completely",
    type: "utility"
  },
  "gasu_gasu_no_mi": {
    name: "Toxic Cloud",
    damage: 130,
    cooldown: 4,
    effect: "poison_2_turns",
    description: "Deadly gas cloud poisons air and lungs",
    type: "attack"
  },
  "doku_doku_no_mi": {
    name: "Venom Demon",
    damage: 150,
    cooldown: 4,
    effect: "deadly_poison_3_turns",
    description: "Apocalyptic poison that corrupts body and soul",
    type: "attack"
  },
  "doa_doa_no_mi": {
    name: "Air Door",
    damage: 110,
    cooldown: 2,
    effect: "teleport_strike",
    description: "Open door in air to strike from impossible angles",
    type: "utility"
  },
  "kage_kage_no_mi": {
    name: "Shadow's Asgard",
    damage: 145,
    cooldown: 4,
    effect: "steal_strength",
    description: "Absorb enemy's shadow to steal their power",
    type: "special"
  },
  "horo_horo_no_mi": {
    name: "Negative Hollow",
    damage: 100,
    cooldown: 3,
    effect: "depression_debuff",
    description: "Ghostly hollows drain enemy's will to fight",
    type: "debuff"
  },
  "shari_shari_no_mi": {
    name: "Wheel Crash",
    damage: 125,
    cooldown: 3,
    effect: "knockback",
    description: "Transform into massive wheel for crushing impact",
    type: "attack"
  },
  "inu_inu_no_mi_wolf": {
    name: "Pack Hunt",
    damage: 140,
    cooldown: 3,
    effect: "pack_bonus",
    description: "Call upon the strength of the entire wolf pack",
    type: "buff"
  },
  "neko_neko_no_mi_leopard": {
    name: "Predator Strike",
    damage: 145,
    cooldown: 3,
    effect: "critical_boost",
    description: "Perfect predator instincts guarantee critical strike",
    type: "attack"
  },
  "uma_uma_no_mi_pegasus": {
    name: "Divine Stampede",
    damage: 130,
    cooldown: 3,
    effect: "speed_boost",
    description: "Winged horse charges with celestial speed",
    type: "buff"
  },
  "zou_zou_no_mi_mammoth": {
    name: "Trunk Slam",
    damage: 150,
    cooldown: 4,
    effect: "stun_1_turn",
    description: "Colossal trunk slams with earth-shaking force",
    type: "attack"
  },
  "hebi_hebi_no_mi_anaconda": {
    name: "Constrictor Crush",
    damage: 125,
    cooldown: 3,
    effect: "squeeze_3_turns",
    description: "Massive coils slowly crush enemy to death",
    type: "attack"
  },
  "taka_taka_no_mi_falcon": {
    name: "Diving Talon",
    damage: 135,
    cooldown: 3,
    effect: "precision_strike",
    description: "Perfect aerial dive with razor-sharp talons",
    type: "attack"
  },
  "ryu_ryu_no_mi_allosaurus": {
    name: "Ancient Rage",
    damage: 155,
    cooldown: 4,
    effect: "rage_boost",
    description: "Prehistoric fury increases power with each hit",
    type: "buff"
  },

  // ===== RARE TIER (27 FRUITS) =====
  "bane_bane_no_mi": {
    name: "Spring Bounce",
    damage: 95,
    cooldown: 2,
    effect: "deflect_next_attack",
    description: "Elastic body bounces back the next incoming attack",
    type: "defense"
  },
  "sube_sube_no_mi": {
    name: "Slip Away",
    damage: 85,
    cooldown: 2,
    effect: "dodge_boost",
    description: "Perfect smoothness makes attacks slide away",
    type: "defense"
  },
  "bomu_bomu_no_mi": {
    name: "Body Bomb",
    damage: 110,
    cooldown: 3,
    effect: "explosion_radius",
    description: "Transform body parts into devastating explosives",
    type: "attack"
  },
  "kilo_kilo_no_mi": {
    name: "10,000 Kilo Press",
    damage: 100,
    cooldown: 3,
    effect: "crush_effect",
    description: "Become incredibly heavy to crush opponents flat",
    type: "attack"
  },
  "hana_hana_no_mi": {
    name: "Cien Fleur",
    damage: 90,
    cooldown: 2,
    effect: "multi_strike",
    description: "Sprout hundred arms for simultaneous strikes",
    type: "attack"
  },
  "doru_doru_no_mi": {
    name: "Wax Wall",
    damage: 80,
    cooldown: 2,
    effect: "shield_next_turn",
    description: "Create protective wax barrier for defense",
    type: "defense"
  },
  "baku_baku_no_mi": {
    name: "Devour Strike",
    damage: 105,
    cooldown: 3,
    effect: "heal_on_hit",
    description: "Bite attack that heals by consuming enemy",
    type: "attack"
  },
  "mane_mane_no_mi": {
    name: "Copy Technique",
    damage: 95,
    cooldown: 2,
    effect: "mimic_last_attack",
    description: "Perfectly copy and redirect enemy's last move",
    type: "utility"
  },
  "supa_supa_no_mi": {
    name: "Blade Flurry",
    damage: 100,
    cooldown: 2,
    effect: "bleed_effect",
    description: "Body becomes steel blades for slicing fury",
    type: "attack"
  },
  "toge_toge_no_mi": {
    name: "Spike Shield",
    damage: 85,
    cooldown: 2,
    effect: "reflect_damage",
    description: "Spiky body reflects damage back to attacker",
    type: "defense"
  },
  "ori_ori_no_mi": {
    name: "Iron Bind",
    damage: 90,
    cooldown: 3,
    effect: "reduce_enemy_damage",
    description: "Metal restraints limit enemy's attack power",
    type: "debuff"
  },
  "noro_noro_no_mi": {
    name: "Slow Beam",
    damage: 75,
    cooldown: 2,
    effect: "speed_debuff",
    description: "Photon beam slows enemy to crawling pace",
    type: "debuff"
  },
  "kama_kama_no_mi": {
    name: "Wind Blade",
    damage: 95,
    cooldown: 2,
    effect: "ranged_attack",
    description: "Sharp wind blades slice from any distance",
    type: "attack"
  },
  "yomi_yomi_no_mi": {
    name: "Soul Parade",
    damage: 100,
    cooldown: 3,
    effect: "fear_effect",
    description: "Haunting melody fills enemy with supernatural dread",
    type: "debuff"
  },
  "kachi_kachi_no_mi": {
    name: "Heat Wave",
    damage: 90,
    cooldown: 2,
    effect: "burn_1_turn",
    description: "Intense body heat creates scorching waves",
    type: "attack"
  },
  "awa_awa_no_mi": {
    name: "Soap Prison",
    damage: 85,
    cooldown: 2,
    effect: "slippery_debuff",
    description: "Slippery bubbles make enemy fumble attacks",
    type: "debuff"
  },
  "goe_goe_no_mi": {
    name: "Sonic Scream",
    damage: 95,
    cooldown: 2,
    effect: "sound_stun",
    description: "Powerful voice creates devastating sound waves",
    type: "attack"
  },
  "hiso_hiso_no_mi": {
    name: "Animal Command",
    damage: 80,
    cooldown: 3,
    effect: "animal_ally",
    description: "Communicate with animals to aid in battle",
    type: "utility"
  },
  "kama_kama_no_mi_mantis": {
    name: "Mantis Slice",
    damage: 105,
    cooldown: 3,
    effect: "precise_cut",
    description: "Lightning-fast mantis strikes with perfect precision",
    type: "attack"
  },
  "noko_noko_no_mi": {
    name: "Poison Spore",
    damage: 85,
    cooldown: 2,
    effect: "poison_1_turn",
    description: "Release toxic spores that poison on contact",
    type: "attack"
  },
  "ami_ami_no_mi": {
    name: "Web Trap",
    damage: 75,
    cooldown: 2,
    effect: "immobilize_1_turn",
    description: "Create inescapable nets to trap enemies",
    type: "utility"
  },
  "kopi_kopi_no_mi": {
    name: "Power Copy",
    damage: 90,
    cooldown: 3,
    effect: "copy_ability",
    description: "Temporarily copy enemy's special abilities",
    type: "utility"
  },
  "moa_moa_no_mi": {
    name: "Size Amplify",
    damage: 100,
    cooldown: 3,
    effect: "size_boost",
    description: "Increase size and power of attacks dramatically",
    type: "buff"
  },
  "kyubu_kyubu_no_mi": {
    name: "Cube Compression",
    damage: 95,
    cooldown: 2,
    effect: "compress_damage",
    description: "Compress attacks into concentrated cubic force",
    type: "attack"
  },
  "jake_jake_no_mi": {
    name: "Body Control",
    damage: 80,
    cooldown: 2,
    effect: "control_boost",
    description: "Become living jacket to control movements",
    type: "utility"
  },
  "ato_ato_no_mi": {
    name: "Living Art",
    damage: 85,
    cooldown: 3,
    effect: "summon_ally",
    description: "Bring artistic creations to life as allies",
    type: "utility"
  },
  "hobi_hobi_no_mi": {
    name: "Toy Transform",
    damage: 90,
    cooldown: 3,
    effect: "transformation_curse",
    description: "Transform enemy into helpless toy briefly",
    type: "debuff"
  },

  // ===== UNCOMMON TIER (37 FRUITS) =====
  "gomu_gomu_no_mi": {
    name: "Gomu Gomu no Pistol",
    damage: 55,
    cooldown: 0,
    effect: "blunt_immunity",
    description: "Stretches arm for powerful punch, immune to blunt damage",
    type: "attack"
  },
  "bara_bara_no_mi": {
    name: "Chop Chop Cannon",
    damage: 75,
    cooldown: 1,
    effect: "split_damage",
    description: "Launch body parts as projectile weapons",
    type: "attack"
  },
  "sube_sube_no_mi_basic": {
    name: "Smooth Slide",
    damage: 70,
    cooldown: 1,
    effect: "dodge_next",
    description: "Slippery skin deflects next incoming attack",
    type: "defense"
  },
  "moku_moku_no_mi_basic": {
    name: "Smoke Screen",
    damage: 65,
    cooldown: 1,
    effect: "blind_1_turn",
    description: "Create concealing smoke cloud around enemy",
    type: "utility"
  },
  "mera_mera_no_mi_basic": {
    name: "Fire Punch",
    damage: 80,
    cooldown: 2,
    effect: "burn_1_turn",
    description: "Flaming fist leaves burning wounds behind",
    type: "attack"
  },
  "ton_ton_no_mi": {
    name: "Heavy Strike",
    damage: 85,
    cooldown: 2,
    effect: "knockdown",
    description: "Incredibly heavy punch knocks enemy down",
    type: "attack"
  },
  "hana_hana_no_mi_basic": {
    name: "Extra Arms",
    damage: 70,
    cooldown: 1,
    effect: "combo_strike",
    description: "Sprout extra arms for combination attacks",
    type: "attack"
  },
  "doru_doru_no_mi_basic": {
    name: "Wax Bullet",
    damage: 75,
    cooldown: 1,
    effect: "slow_effect",
    description: "Hardened wax projectiles slow enemy movement",
    type: "attack"
  },
  "baku_baku_no_mi_basic": {
    name: "Hungry Bite",
    damage: 80,
    cooldown: 2,
    effect: "small_heal",
    description: "Bite attack that heals minor wounds",
    type: "attack"
  },
  "mane_mane_no_mi_basic": {
    name: "Face Copy",
    damage: 70,
    cooldown: 1,
    effect: "confuse_enemy",
    description: "Copy appearance to confuse and mislead",
    type: "utility"
  },
  "supa_supa_no_mi_basic": {
    name: "Dice Slash",
    damage: 85,
    cooldown: 2,
    effect: "precise_cut",
    description: "Body becomes sharp blade for clean cuts",
    type: "attack"
  },
  "toge_toge_no_mi_basic": {
    name: "Spike Jab",
    damage: 75,
    cooldown: 1,
    effect: "puncture",
    description: "Sharp spikes pierce through defenses",
    type: "attack"
  },
  "ori_ori_no_mi_basic": {
    name: "Metal Grip",
    damage: 70,
    cooldown: 1,
    effect: "hold_enemy",
    description: "Metal restraints briefly hold enemy in place",
    type: "utility"
  },
  "noro_noro_no_mi_basic": {
    name: "Slow Touch",
    damage: 65,
    cooldown: 1,
    effect: "slow_1_turn",
    description: "Touch that slows enemy for one turn",
    type: "debuff"
  },
  "awa_awa_no_mi_basic": {
    name: "Soap Bubble",
    damage: 70,
    cooldown: 1,
    effect: "slippery_debuff",
    description: "Slippery bubbles reduce enemy accuracy",
    type: "debuff"
  },
  "doa_doa_no_mi_basic": {
    name: "Quick Exit",
    damage: 75,
    cooldown: 1,
    effect: "escape_counter",
    description: "Open door to avoid and counter attacks",
    type: "utility"
  },
  "kama_kama_no_mi_basic": {
    name: "Wind Cut",
    damage: 80,
    cooldown: 1,
    effect: "wind_slice",
    description: "Sharp wind cuts through air to strike",
    type: "attack"
  },
  "yomi_yomi_no_mi_basic": {
    name: "Soul Chill",
    damage: 70,
    cooldown: 2,
    effect: "fear_minor",
    description: "Ghostly presence unnerves the enemy",
    type: "debuff"
  },
  "gasu_gasu_no_mi_basic": {
    name: "Gas Cloud",
    damage: 75,
    cooldown: 2,
    effect: "visibility_reduce",
    description: "Create concealing gas cloud around area",
    type: "utility"
  },
  "yuki_yuki_no_mi": {
    name: "Snow Storm",
    damage: 80,
    cooldown: 2,
    effect: "chill_effect",
    description: "Freezing snow reduces enemy movement speed",
    type: "attack"
  },
  "sara_sara_no_mi": {
    name: "Flame Body",
    damage: 75,
    cooldown: 1,
    effect: "heat_aura",
    description: "Body radiates heat that damages on contact",
    type: "attack"
  },
  "nagi_nagi_no_mi": {
    name: "Silent Step",
    damage: 70,
    cooldown: 1,
    effect: "sound_null",
    description: "Move in complete silence for surprise strikes",
    type: "utility"
  },
  "chiyu_chiyu_no_mi": {
    name: "Healing Touch",
    damage: 60,
    cooldown: 3,
    effect: "self_heal",
    description: "Healing powers restore own health while attacking",
    type: "utility"
  },
  "soku_soku_no_mi": {
    name: "Burst Speed",
    damage: 75,
    cooldown: 2,
    effect: "speed_burst",
    description: "Sudden speed increase for multiple quick strikes",
    type: "buff"
  },
  "mero_mero_no_mi": {
    name: "Love Beam",
    damage: 70,
    cooldown: 2,
    effect: "charm_1_turn",
    description: "Heart-shaped beam charms enemy briefly",
    type: "debuff"
  },
  "doku_doku_no_mi_basic": {
    name: "Poison Touch",
    damage: 80,
    cooldown: 2,
    effect: "poison_weak",
    description: "Weak poison that slowly drains enemy health",
    type: "attack"
  },
  "horu_horu_no_mi": {
    name: "Power Hormone",
    damage: 75,
    cooldown: 2,
    effect: "stat_boost",
    description: "Inject hormones that temporarily boost abilities",
    type: "buff"
  },
  "choki_choki_no_mi": {
    name: "Paper Cut",
    damage: 70,
    cooldown: 1,
    effect: "precise_snip",
    description: "Sharp scissors cut with surgical precision",
    type: "attack"
  },
  "gura_gura_no_mi_basic": {
    name: "Mini Quake",
    damage: 85,
    cooldown: 2,
    effect: "ground_shake",
    description: "Small earthquake disrupts enemy footing",
    type: "attack"
  },
  "yami_yami_no_mi_basic": {
    name: "Dark Pull",
    damage: 80,
    cooldown: 2,
    effect: "gravity_pull",
    description: "Darkness gravity pulls enemy closer for attacks",
    type: "utility"
  },
  "pika_pika_no_mi_basic": {
    name: "Flash Bang",
    damage: 75,
    cooldown: 1,
    effect: "blind_brief",
    description: "Bright flash temporarily blinds the enemy",
    type: "utility"
  },
  "hie_hie_no_mi_basic": {
    name: "Ice Shard",
    damage: 80,
    cooldown: 2,
    effect: "chill_1_turn",
    description: "Sharp ice projectiles that slow enemy",
    type: "attack"
  },
  "magu_magu_no_mi_basic": {
    name: "Lava Punch",
    damage: 85,
    cooldown: 2,
    effect: "magma_burn",
    description: "Molten fist leaves severe burning wounds",
    type: "attack"
  },
  "goro_goro_no_mi_basic": {
    name: "Shock Touch",
    damage: 80,
    cooldown: 1,
    effect: "electric_stun",
    description: "Electric touch briefly stuns the enemy",
    type: "attack"
  },
  "ope_ope_no_mi_basic": {
    name: "Scalpel Cut",
    damage: 75,
    cooldown: 2,
    effect: "surgical_cut",
    description: "Precise surgical cut that bypasses defenses",
    type: "attack"
  },
  "hobi_hobi_no_mi_basic": {
    name: "Toy Touch",
    damage: 70,
    cooldown: 2,
    effect: "playful_debuff",
    description: "Touch that makes enemy less serious in combat",
    type: "debuff"
  },
  "bari_bari_no_mi": {
    name: "Barrier Bash",
    damage: 75,
    cooldown: 2,
    effect: "shield_counter",
    description: "Create barrier that damages while defending",
    type: "defense"
  },

  // ===== COMMON TIER (60 FRUITS) =====
  "suke_suke_no_mi": {
    name: "Vanish Strike",
    damage: 60,
    cooldown: 1,
    effect: "next_attack_surprise",
    description: "Turn invisible for surprise attack advantage",
    type: "utility"
  },
  "kage_kage_no_mi_basic": {
    name: "Shadow Punch",
    damage: 55,
    cooldown: 0,
    effect: "dark_damage",
    description: "Attack using shadows for extra darkness damage",
    type: "attack"
  },
  "horo_horo_no_mi_basic": {
    name: "Mini Ghost",
    damage: 50,
    cooldown: 1,
    effect: "spook_effect",
    description: "Small ghost that spooks enemy briefly",
    type: "debuff"
  },
  "shiro_shiro_no_mi": {
    name: "Castle Wall",
    damage: 55,
    cooldown: 2,
    effect: "defense_boost",
    description: "Summon protective castle wall for defense",
    type: "defense"
  },
  "beri_beri_no_mi": {
    name: "Berry Barrage",
    damage: 60,
    cooldown: 1,
    effect: "scatter_shot",
    description: "Launch multiple berry projectiles at once",
    type: "attack"
  },
  "sabi_sabi_no_mi": {
    name: "Rust Touch",
    damage: 65,
    cooldown: 2,
    effect: "weapon_degrade",
    description: "Touch that rusts and weakens enemy weapons",
    type: "debuff"
  },
  "shabon_shabon_no_mi": {
    name: "Soap Slick",
    damage: 50,
    cooldown: 1,
    effect: "slip_hazard",
    description: "Create slippery soap surface under enemy",
    type: "utility"
  },
  "mogu_mogu_no_mi": {
    name: "Underground Strike",
    damage: 60,
    cooldown: 1,
    effect: "surprise_attack",
    description: "Burrow underground for surprise attack",
    type: "attack"
  },
  "tori_tori_no_mi_basic": {
    name: "Wing Buffet",
    damage: 55,
    cooldown: 1,
    effect: "wind_gust",
    description: "Powerful wing flaps create damaging wind",
    type: "attack"
  },
  "inu_inu_no_mi_basic": {
    name: "Loyal Bite",
    damage: 60,
    cooldown: 1,
    effect: "faithful_strike",
    description: "Faithful dog bite that never misses target",
    type: "attack"
  },
  "neko_neko_no_mi_basic": {
    name: "Cat Pounce",
    damage: 55,
    cooldown: 0,
    effect: "agile_attack",
    description: "Quick cat-like pounce with natural agility",
    type: "attack"
  },
  "uma_uma_no_mi_basic": {
    name: "Hoof Kick",
    damage: 65,
    cooldown: 1,
    effect: "speed_strike",
    description: "Swift horse kick with natural speed boost",
    type: "attack"
  },
  "ushi_ushi_no_mi": {
    name: "Bull Charge",
    damage: 70,
    cooldown: 2,
    effect: "ram_attack",
    description: "Powerful charging attack with horned head",
    type: "attack"
  },
  "hitsuji_hitsuji_no_mi": {
    name: "Wool Shield",
    damage: 50,
    cooldown: 2,
    effect: "soft_defense",
    description: "Fluffy wool absorbs incoming damage",
    type: "defense"
  },
  "buta_buta_no_mi": {
    name: "Pig Rush",
    damage: 60,
    cooldown: 1,
    effect: "stubborn_attack",
    description: "Determined pig charge that pushes through",
    type: "attack"
  },
  "ryu_ryu_no_mi_basic": {
    name: "Dragon Breath",
    damage: 65,
    cooldown: 2,
    effect: "fire_puff",
    description: "Small dragon breath with hint of flame",
    type: "attack"
  },
  "kame_kame_no_mi": {
    name: "Shell Defense",
    damage: 50,
    cooldown: 2,
    effect: "turtle_shell",
    description: "Retreat into shell for damage reduction",
    type: "defense"
  },
  "taka_taka_no_mi_basic": {
    name: "Talon Swipe",
    damage: 60,
    cooldown: 1,
    effect: "aerial_strike",
    description: "Sharp talon attack from above",
    type: "attack"
  },
  "kani_kani_no_mi": {
    name: "Pincer Grab",
    damage: 65,
    cooldown: 1,
    effect: "grab_hold",
    description: "Strong crab pincers grab and squeeze",
    type: "attack"
  },
  "tako_tako_no_mi": {
    name: "Tentacle Slap",
    damage: 55,
    cooldown: 1,
    effect: "multi_arm_strike",
    description: "Multiple tentacles strike simultaneously",
    type: "attack"
  },
  "ika_ika_no_mi": {
    name: "Ink Cloud",
    damage: 50,
    cooldown: 2,
    effect: "ink_blind",
    description: "Release ink cloud to blind enemy",
    type: "utility"
  },
  "kumo_kumo_no_mi": {
    name: "Web Shot",
    damage: 55,
    cooldown: 1,
    effect: "web_trap",
    description: "Shoot sticky web to slow enemy movement",
    type: "utility"
  },
  "ari_ari_no_mi": {
    name: "Colony Strength",
    damage: 60,
    cooldown: 1,
    effect: "worker_boost",
    description: "Channel collective strength of ant colony",
    type: "buff"
  },
  "hachi_hachi_no_mi": {
    name: "Stinger Jab",
    damage: 55,
    cooldown: 1,
    effect: "poison_weak",
    description: "Sharp stinger with mild poison effect",
    type: "attack"
  },
  "cho_cho_no_mi": {
    name: "Pollen Cloud",
    damage: 50,
    cooldown: 2,
    effect: "sleep_powder",
    description: "Release drowsy pollen that makes enemy sluggish",
    type: "debuff"
  },
  "batto_batto_no_mi": {
    name: "Sonic Screech",
    damage: 60,
    cooldown: 1,
    effect: "sound_wave",
    description: "High-pitched screech that disrupts enemy",
    type: "attack"
  },
  "nezumi_nezumi_no_mi": {
    name: "Quick Nibble",
    damage: 55,
    cooldown: 0,
    effect: "speed_bite",
    description: "Fast mouse bite that's hard to avoid",
    type: "attack"
  },
  "risu_risu_no_mi": {
    name: "Nut Throw",
    damage: 50,
    cooldown: 1,
    effect: "projectile_barrage",
    description: "Throw multiple nuts as projectile weapons",
    type: "attack"
  },
  "usagi_usagi_no_mi": {
    name: "Bunny Hop",
    damage: 55,
    cooldown: 1,
    effect: "jump_strike",
    description: "High jumping attack with powerful legs",
    type: "attack"
  },
  "shika_shika_no_mi": {
    name: "Antler Charge",
    damage: 65,
    cooldown: 1,
    effect: "horn_attack",
    description: "Charge forward with sharp antlers",
    type: "attack"
  },
  "kuma_kuma_no_mi": {
    name: "Bear Hug",
    damage: 70,
    cooldown: 2,
    effect: "crushing_embrace",
    description: "Powerful bear hug that squeezes enemy",
    type: "attack"
  },
  "ookami_ookami_no_mi_basic": {
    name: "Lone Howl",
    damage: 60,
    cooldown: 1,
    effect: "intimidate",
    description: "Intimidating howl that reduces enemy courage",
    type: "debuff"
  },
  "kitsune_kitsune_no_mi": {
    name: "Fox Fire",
    damage: 60,
    cooldown: 1,
    effect: "mystical_flame",
    description: "Mysterious fox fire with magical properties",
    type: "attack"
  },
  "tanuki_tanuki_no_mi": {
    name: "Leaf Disguise",
    damage: 55,
    cooldown: 2,
    effect: "transformation_trick",
    description: "Transform appearance to confuse enemy",
    type: "utility"
  },
  "saru_saru_no_mi": {
    name: "Banana Toss",
    damage: 50,
    cooldown: 1,
    effect: "slip_trap",
    description: "Throw banana peel to make enemy slip",
    type: "utility"
  },
  "zou_zou_no_mi_basic": {
    name: "Memory Strike",
    damage: 65,
    cooldown: 2,
    effect: "never_forget",
    description: "Elephant memory makes attacks more accurate",
    type: "attack"
  },
  "kirin_kirin_no_mi": {
    name: "Long Neck Slam",
    damage: 60,
    cooldown: 1,
    effect: "reach_advantage",
    description: "Use long neck for extended reach attacks",
    type: "attack"
  },
  "hippo_hippo_no_mi": {
    name: "Jaw Snap",
    damage: 70,
    cooldown: 2,
    effect: "powerful_bite",
    description: "Massive hippo jaws deliver crushing bite",
    type: "attack"
  },
  "sai_sai_no_mi": {
    name: "Horn Drill",
    damage: 65,
    cooldown: 1,
    effect: "piercing_horn",
    description: "Sharp horn pierces through defenses",
    type: "attack"
  },
  "raion_raion_no_mi": {
    name: "King's Roar",
    damage: 65,
    cooldown: 1,
    effect: "royal_intimidation",
    description: "Majestic roar that commands respect and fear",
    type: "debuff"
  },
  "tora_tora_no_mi": {
    name: "Tiger Swipe",
    damage: 70,
    cooldown: 1,
    effect: "claw_slash",
    description: "Powerful tiger claw leaves deep scratches",
    type: "attack"
  },
  "hyou_hyou_no_mi": {
    name: "Stealth Pounce",
    damage: 60,
    cooldown: 1,
    effect: "stealth_attack",
    description: "Stealthy leopard pounce from hiding",
    type: "attack"
  },
  "ookami_ookami_no_mi_dire": {
    name: "Pack Leader",
    damage: 65,
    cooldown: 2,
    effect: "alpha_presence",
    description: "Command presence of pack leader intimidates",
    type: "debuff"
  },
  "wani_wani_no_mi_basic": {
    name: "Death Roll",
    damage: 70,
    cooldown: 2,
    effect: "spinning_attack",
    description: "Crocodile death roll spins and crushes",
    type: "attack"
  },
  "hebi_hebi_no_mi_basic": {
    name: "Slither Strike",
    damage: 60,
    cooldown: 1,
    effect: "quick_strike",
    description: "Lightning-fast snake strike from any angle",
    type: "attack"
  },
  "tokage_tokage_no_mi": {
    name: "Tail Whip",
    damage: 55,
    cooldown: 1,
    effect: "balance_strike",
    description: "Strong tail whip that throws off balance",
    type: "attack"
  },
  "kaeru_kaeru_no_mi": {
    name: "Tongue Lash",
    damage: 50,
    cooldown: 1,
    effect: "sticky_grab",
    description: "Long sticky tongue grabs and pulls enemy",
    type: "utility"
  },
  "sakana_sakana_no_mi": {
    name: "Water Splash",
    damage: 50,
    cooldown: 1,
    effect: "water_spray",
    description: "Splash water to temporarily blind enemy",
    type: "utility"
  },
  "same_same_no_mi_basic": {
    name: "Fin Slice",
    damage: 65,
    cooldown: 1,
    effect: "cutting_fin",
    description: "Sharp dorsal fin slices through defenses",
    type: "attack"
  },
  "kujira_kujira_no_mi": {
    name: "Whale Song",
    damage: 60,
    cooldown: 2,
    effect: "sound_wave_stun",
    description: "Deep whale song creates stunning sound waves",
    type: "attack"
  },
  "iruka_iruka_no_mi": {
    name: "Sonar Pulse",
    damage: 55,
    cooldown: 1,
    effect: "echolocation",
    description: "Sonar pulse reveals weak points for precise strikes",
    type: "utility"
  },
  "kurage_kurage_no_mi": {
    name: "Poison Sting",
    damage: 50,
    cooldown: 1,
    effect: "jellyfish_poison",
    description: "Venomous tentacles deliver paralyzing sting",
    type: "attack"
  },
  "hitode_hitode_no_mi": {
    name: "Regeneration",
    damage: 45,
    cooldown: 3,
    effect: "health_restore",
    description: "Starfish regeneration slowly heals wounds",
    type: "utility"
  },
  "uni_uni_no_mi": {
    name: "Spine Shield",
    damage: 55,
    cooldown: 2,
    effect: "spike_defense",
    description: "Sharp spines protect and damage attackers",
    type: "defense"
  },
  "ebi_ebi_no_mi": {
    name: "Bubble Jet",
    damage: 50,
    cooldown: 1,
    effect: "water_jet",
    description: "High-pressure water jet with stunning force",
    type: "attack"
  },
  "hotate_hotate_no_mi": {
    name: "Shell Clap",
    damage: 55,
    cooldown: 1,
    effect: "sonic_clap",
    description: "Powerful shell clap creates damaging sound wave",
    type: "attack"
  },
  "namako_namako_no_mi": {
    name: "Slime Coat",
    damage: 45,
    cooldown: 2,
    effect: "slippery_coating",
    description: "Slippery slime makes enemy attacks slide off",
    type: "defense"
  },
  "kaisou_kaisou_no_mi": {
    name: "Kelp Wrap",
    damage: 50,
    cooldown: 2,
    effect: "entangle",
    description: "Long seaweed fronds wrap and restrict movement",
    type: "utility"
  },
  "sango_sango_no_mi": {
    name: "Calcium Spike",
    damage: 60,
    cooldown: 1,
    effect: "hard_growth",
    description: "Grow hard coral spikes for piercing attacks",
    type: "attack"
  },
  "shinjyu_shinjyu_no_mi": {
    name: "Lustrous Shield",
    damage: 55,
    cooldown: 2,
    effect: "reflective_barrier",
    description: "Beautiful pearl creates light-reflecting protective barrier",
    type: "defense"
  }
};

// Utility function to get skill data by fruit ID
function getSkillData(fruitId) {
  return DEVIL_FRUIT_SKILLS[fruitId] || null;
}

// Utility function to get all skills by rarity
function getSkillsByRarity(rarity) {
  return Object.entries(DEVIL_FRUIT_SKILLS)
    .filter(([id, skill]) => {
      // You'll need to cross-reference with your existing fruit data for rarity
      // For now, we can use naming conventions or add rarity to skill data
      if (rarity === 'divine') return ['gura_gura_no_mi', 'hito_hito_no_mi_nika', 'yami_yami_no_mi', 'joy_boy_will', 'one_piece_treasure'].includes(id);
      if (rarity === 'mythical') return ['tori_tori_no_mi_phoenix', 'ancient_weapon_pluton'].includes(id);
      if (rarity === 'legendary') return ['mera_mera_no_mi', 'hie_hie_no_mi', 'pika_pika_no_mi', 'ope_ope_no_mi'].includes(id);
      // Add more logic as needed
      return false;
    })
    .map(([id, skill]) => ({ id, ...skill }));
}

// Utility function to check if fruit has custom skill
function hasCustomSkill(fruitId) {
  return DEVIL_FRUIT_SKILLS.hasOwnProperty(fruitId);
}

// Get fallback skill for fruits without custom skills
function getFallbackSkill(fruitRarity) {
  const fallbackDamage = {
    'divine': 250,
    'mythical': 200,
    'legendary': 150,
    'epic': 120,
    'rare': 90,
    'uncommon': 70,
    'common': 50
  };

  const fallbackCooldown = {
    'divine': 6,
    'mythical': 5,
    'legendary': 4,
    'epic': 3,
    'rare': 2,
    'uncommon': 1,
    'common': 1
  };

  return {
    name: "Devil Fruit Power",
    damage: fallbackDamage[fruitRarity] || 50,
    cooldown: fallbackCooldown[fruitRarity] || 1,
    effect: null,
    description: "A mysterious devil fruit ability",
    type: "attack"
  };
}

// Export everything for use in your bot
module.exports = {
  DEVIL_FRUIT_SKILLS,
  getSkillData,
  getSkillsByRarity,
  hasCustomSkill,
  getFallbackSkill
};
