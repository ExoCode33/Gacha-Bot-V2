// src/data/DevilFruits.js - COMPLETE Devil Fruits Database (Uses DevilFruitSkills.js)
const { getSkillData, getFallbackSkill } = require('./DevilFruitSkills');

const DEVIL_FRUITS = {
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

  "kage_kage_no_mi": {
    id: "kage_kage_no_mi",
    name: "Kage Kage no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Shadow",
    power: "Allows manipulation of shadows",
    description: "User can manipulate shadows and steal them from others.",
    multiplier: 1.87,
    user: "Gecko Moria"
  },

  "horo_horo_no_mi": {
    id: "horo_horo_no_mi",
    name: "Horo Horo no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Ghost",
    power: "Allows creation of ghosts",
    description: "User can create powerful negative ghosts.",
    multiplier: 1.75,
    user: "Perona"
  },

  "shari_shari_no_mi": {
    id: "shari_shari_no_mi",
    name: "Shari Shari no Mi",
    type: "Paramecia",
    rarity: "epic",
    element: "Wheel",
    power: "Allows user to transform body parts into wheels",
    description: "User can turn body parts into spinning wheels.",
    multiplier: 1.80,
    user: "Sharinguru"
  },

  "inu_inu_no_mi_wolf": {
    id: "inu_inu_no_mi_wolf",
    name: "Inu Inu no Mi, Model: Wolf",
    type: "Zoan",
    rarity: "epic",
    element: "Wolf",
    power: "Transform into wolf",
    description: "Powerful wolf transformation with pack instincts.",
    multiplier: 1.83,
    user: "Jabra"
  },

  "neko_neko_no_mi_leopard": {
    id: "neko_neko_no_mi_leopard",
    name: "Neko Neko no Mi, Model: Leopard",
    type: "Zoan",
    rarity: "epic",
    element: "Leopard",
    power: "Transform into leopard",
    description: "Swift and deadly leopard transformation.",
    multiplier: 1.85,
    user: "Rob Lucci"
  },

  "uma_uma_no_mi_pegasus": {
    id: "uma_uma_no_mi_pegasus",
    name: "Uma Uma no Mi, Model: Pegasus",
    type: "Mythical Zoan",
    rarity: "epic",
    element: "Pegasus",
    power: "Transform into pegasus",
    description: "Mythical winged horse transformation.",
    multiplier: 1.90,
    user: "Stronger"
  },

  "zou_zou_no_mi_mammoth": {
    id: "zou_zou_no_mi_mammoth",
    name: "Zou Zou no Mi, Model: Mammoth",
    type: "Ancient Zoan",
    rarity: "epic",
    element: "Mammoth",
    power: "Transform into mammoth",
    description: "Ancient mammoth transformation with massive strength.",
    multiplier: 1.95,
    user: "Jack"
  },

  "hebi_hebi_no_mi_anaconda": {
    id: "hebi_hebi_no_mi_anaconda",
    name: "Hebi Hebi no Mi, Model: Anaconda",
    type: "Zoan",
    rarity: "epic",
    element: "Anaconda",
    power: "Transform into anaconda",
    description: "Massive snake transformation with constricting power.",
    multiplier: 1.82,
    user: "Boa Sandersonia"
  },

  "taka_taka_no_mi_falcon": {
    id: "taka_taka_no_mi_falcon",
    name: "Taka Taka no Mi, Model: Falcon",
    type: "Zoan",
    rarity: "epic",
    element: "Falcon",
    power: "Transform into falcon",
    description: "Swift falcon transformation with aerial superiority.",
    multiplier: 1.78,
    user: "Pell"
  },

  "ryu_ryu_no_mi_allosaurus": {
    id: "ryu_ryu_no_mi_allosaurus",
    name: "Ryu Ryu no Mi, Model: Allosaurus",
    type: "Ancient Zoan",
    rarity: "epic",
    element: "Allosaurus",
    power: "Transform into allosaurus",
    description: "Ancient predator with devastating bite and claws.",
    multiplier: 1.92,
    user: "X Drake"
  },

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
    name: "Sube Sube no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Smooth",
    power: "Makes user's skin perfectly smooth",
    description: "Everything slides off the user's slippery skin.",
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

  "doru_doru_no_mi": {
    id: "doru_doru_no_mi",
    name: "Doru Doru no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Wax",
    power: "Allows user to create and manipulate wax",
    description: "User can create hardened wax constructs for offense and defense.",
    multiplier: 1.43,
    user: "Mr. 3"
  },

  "baku_baku_no_mi": {
    id: "baku_baku_no_mi",
    name: "Baku Baku no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Eating",
    power: "Allows user to eat anything and integrate it into their body",
    description: "User can consume and become part of anything they eat.",
    multiplier: 1.50,
    user: "Wapol"
  },

  "mane_mane_no_mi": {
    id: "mane_mane_no_mi",
    name: "Mane Mane no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Clone",
    power: "Allows user to transform into a perfect copy of anyone",
    description: "User can perfectly mimic anyone they've touched.",
    multiplier: 1.47,
    user: "Bon Clay"
  },

  "supa_supa_no_mi": {
    id: "supa_supa_no_mi",
    name: "Supa Supa no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Blade",
    power: "Allows user to turn any part of their body into steel blades",
    description: "Body becomes steel blades for slicing attacks.",
    multiplier: 1.54,
    user: "Daz Bonez"
  },

  "toge_toge_no_mi": {
    id: "toge_toge_no_mi",
    name: "Toge Toge no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Spike",
    power: "Allows user to grow spikes from their body",
    description: "User can sprout sharp spikes from any part of their body.",
    multiplier: 1.46,
    user: "Miss Doublefinger"
  },

  "ori_ori_no_mi": {
    id: "ori_ori_no_mi",
    name: "Ori Ori no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Cage",
    power: "Allows user to bind opponents with iron bonds",
    description: "User can create iron restraints to bind enemies.",
    multiplier: 1.49,
    user: "Hina"
  },

  "noro_noro_no_mi": {
    id: "noro_noro_no_mi",
    name: "Noro Noro no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Slow",
    power: "Allows user to emit photons that slow down anything for 30 seconds",
    description: "User can slow down opponents with photon beams.",
    multiplier: 1.44,
    user: "Foxy"
  },

  "kama_kama_no_mi": {
    id: "kama_kama_no_mi",
    name: "Kama Kama no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Sickle",
    power: "Allows user to create blades of wind",
    description: "User can generate cutting wind blades from their claws.",
    multiplier: 1.51,
    user: "Eric"
  },

  "yomi_yomi_no_mi": {
    id: "yomi_yomi_no_mi",
    name: "Yomi Yomi no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Resurrection",
    power: "Grants a second life and soul powers",
    description: "User gains a second life and can manipulate souls.",
    multiplier: 1.58,
    user: "Brook"
  },

  "kachi_kachi_no_mi": {
    id: "kachi_kachi_no_mi",
    name: "Kachi Kachi no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Heat",
    power: "Allows user to harden body and generate heat",
    description: "User can make body rock-hard and generate intense heat.",
    multiplier: 1.47,
    user: "Bear King"
  },

  "awa_awa_no_mi": {
    id: "awa_awa_no_mi",
    name: "Awa Awa no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Soap",
    power: "Allows user to create and manipulate soap",
    description: "User can create soap that weakens opponents.",
    multiplier: 1.42,
    user: "Kalifa"
  },

  "goe_goe_no_mi": {
    id: "goe_goe_no_mi",
    name: "Goe Goe no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Voice",
    power: "Allows user to create destructive sound waves",
    description: "User's voice can create devastating sonic attacks.",
    multiplier: 1.53,
    user: "Eldoraggo"
  },

  "hiso_hiso_no_mi": {
    id: "hiso_hiso_no_mi",
    name: "Hiso Hiso no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Whisper",
    power: "Allows user to communicate with animals",
    description: "User can understand and communicate with all animals.",
    multiplier: 1.41,
    user: "Apis"
  },

  "kama_kama_no_mi_mantis": {
    id: "kama_kama_no_mi_mantis",
    name: "Kama Kama no Mi, Model: Mantis",
    type: "Zoan",
    rarity: "rare",
    element: "Mantis",
    power: "Transform into mantis",
    description: "User can transform into a praying mantis.",
    multiplier: 1.55,
    user: "Unknown"
  },

  "noko_noko_no_mi": {
    id: "noko_noko_no_mi",
    name: "Noko Noko no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Spore",
    power: "Allows user to create and control spores",
    description: "User can release toxic and hallucinogenic spores.",
    multiplier: 1.45,
    user: "Musshuru"
  },

  "ami_ami_no_mi": {
    id: "ami_ami_no_mi",
    name: "Ami Ami no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Net",
    power: "Allows user to create nets",
    description: "User can create various types of nets and traps.",
    multiplier: 1.43,
    user: "Largo"
  },

  "kopi_kopi_no_mi": {
    id: "kopi_kopi_no_mi",
    name: "Kopi Kopi no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Copy",
    power: "Allows user to copy others' abilities",
    description: "User can temporarily copy other Devil Fruit powers.",
    multiplier: 1.59,
    user: "Charlotte Brulee"
  },

  "moa_moa_no_mi": {
    id: "moa_moa_no_mi",
    name: "Moa Moa no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "More",
    power: "Allows user to increase size and speed of objects",
    description: "User can amplify the size and speed of anything they touch.",
    multiplier: 1.57,
    user: "Byrnndi World"
  },

  "kyubu_kyubu_no_mi": {
    id: "kyubu_kyubu_no_mi",
    name: "Kyubu Kyubu no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Cube",
    power: "Allows user to transform things into cubes",
    description: "User can turn anything into compressed cubes.",
    multiplier: 1.48,
    user: "Unknown"
  },

  "jake_jake_no_mi": {
    id: "jake_jake_no_mi",
    name: "Jake Jake no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Jacket",
    power: "Allows user to become a jacket",
    description: "User can transform into a jacket to control others.",
    multiplier: 1.40,
    user: "Kelly Funk"
  },

  "ato_ato_no_mi": {
    id: "ato_ato_no_mi",
    name: "Ato Ato no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Art",
    power: "Allows user to turn people and objects into art",
    description: "User can transform anything into living art.",
    multiplier: 1.51,
    user: "Jora"
  },

  "hobi_hobi_no_mi": {
    id: "hobi_hobi_no_mi",
    name: "Hobi Hobi no Mi",
    type: "Paramecia",
    rarity: "rare",
    element: "Hobby",
    power: "Allows user to turn people into toys",
    description: "User can transform people into toys and erase memories.",
    multiplier: 1.62,
    user: "Sugar"
  },

  // =====================================================
  // UNCOMMON FRUITS (37 fruits) - 1.2x to 1.4x CP
  // =====================================================
  "gomu_gomu_no_mi": {
    id: "gomu_gomu_no_mi",
    name: "Gomu Gomu no Mi",
    type: "Paramecia", 
    rarity: "uncommon",
    element: "Rubber",
    power: "Grants rubber properties to the user's body",
    description: "The user's body becomes rubber, immune to blunt attacks and electricity.",
    multiplier: 1.25,
    user: "Monkey D. Luffy"
  },

  "bara_bara_no_mi": {
    id: "bara_bara_no_mi",
    name: "Bara Bara no Mi",
    type: "Paramecia",
    rarity: "uncommon", 
    element: "Split",
    power: "Allows user to split body into pieces",
    description: "User can separate body parts and control them remotely.",
    multiplier: 1.28,
    user: "Buggy the Clown"
  },

  "sube_sube_no_mi_basic": {
    id: "sube_sube_no_mi_basic",
    name: "Sube Sube no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Smooth",
    power: "Makes user's skin smooth",
    description: "Basic smoothness that deflects some attacks.",
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
    multiplier: 1.32,
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
    multiplier: 1.35,
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

  "hana_hana_no_mi_basic": {
    id: "hana_hana_no_mi_basic",
    name: "Hana Hana no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Flower",
    power: "Basic limb sprouting",
    description: "User can sprout extra arms for basic attacks.",
    multiplier: 1.29,
    user: "Nico Robin"
  },

  "doru_doru_no_mi_basic": {
    id: "doru_doru_no_mi_basic",
    name: "Doru Doru no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Wax",
    power: "Basic wax manipulation",
    description: "User can create simple wax constructs.",
    multiplier: 1.24,
    user: "Mr. 3"
  },

  "baku_baku_no_mi_basic": {
    id: "baku_baku_no_mi_basic",
    name: "Baku Baku no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Eating",
    power: "Basic eating abilities",
    description: "User can eat unusual things and gain minor benefits.",
    multiplier: 1.27,
    user: "Wapol"
  },

  "mane_mane_no_mi_basic": {
    id: "mane_mane_no_mi_basic",
    name: "Mane Mane no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Clone",
    power: "Basic transformation abilities",
    description: "User can copy basic appearance features.",
    multiplier: 1.25,
    user: "Bon Clay"
  },

  "supa_supa_no_mi_basic": {
    id: "supa_supa_no_mi_basic",
    name: "Supa Supa no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Blade",
    power: "Basic blade abilities",
    description: "User can turn fingers into small blades.",
    multiplier: 1.31,
    user: "Daz Bonez"
  },

  "toge_toge_no_mi_basic": {
    id: "toge_toge_no_mi_basic",
    name: "Toge Toge no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Spike",
    power: "Basic spike abilities",
    description: "User can grow small spikes from fingertips.",
    multiplier: 1.26,
    user: "Miss Doublefinger"
  },

  "ori_ori_no_mi_basic": {
    id: "ori_ori_no_mi_basic",
    name: "Ori Ori no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Cage",
    power: "Basic binding abilities",
    description: "User can create simple restraints.",
    multiplier: 1.28,
    user: "Hina"
  },

  "noro_noro_no_mi_basic": {
    id: "noro_noro_no_mi_basic",
    name: "Noro Noro no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Slow",
    power: "Basic slowing abilities",
    description: "User can slightly slow down opponents.",
    multiplier: 1.23,
    user: "Foxy"
  },

  "awa_awa_no_mi_basic": {
    id: "awa_awa_no_mi_basic",
    name: "Awa Awa no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Soap",
    power: "Basic soap creation",
    description: "User can create slippery soap bubbles.",
    multiplier: 1.22,
    user: "Kalifa"
  },

  "doa_doa_no_mi_basic": {
    id: "doa_doa_no_mi_basic",
    name: "Doa Doa no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Door",
    power: "Basic door creation",
    description: "User can create small doors in surfaces.",
    multiplier: 1.30,
    user: "Blueno"
  },

  "kama_kama_no_mi_basic": {
    id: "kama_kama_no_mi_basic",
    name: "Kama Kama no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Sickle",
    power: "Basic wind blade creation",
    description: "User can create small cutting wind.",
    multiplier: 1.29,
    user: "Eric"
  },

  "yomi_yomi_no_mi_basic": {
    id: "yomi_yomi_no_mi_basic",
    name: "Yomi Yomi no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Soul",
    power: "Basic soul abilities",
    description: "User has minor soul-based powers.",
    multiplier: 1.33,
    user: "Brook"
  },

  "gasu_gasu_no_mi_basic": {
    id: "gasu_gasu_no_mi_basic",
    name: "Gasu Gasu no Mi (Basic)",
    type: "Logia",
    rarity: "uncommon",
    element: "Gas",
    power: "Basic gas manipulation",
    description: "User can create harmless gas clouds.",
    multiplier: 1.34,
    user: "Caesar Clown"
  },

  "yuki_yuki_no_mi": {
    id: "yuki_yuki_no_mi",
    name: "Yuki Yuki no Mi",
    type: "Logia",
    rarity: "uncommon",
    element: "Snow",
    power: "Allows user to create and control snow",
    description: "User can generate and manipulate snow.",
    multiplier: 1.30,
    user: "Monet"
  },

  "sara_sara_no_mi": {
    id: "sara_sara_no_mi",
    name: "Sara Sara no Mi, Model: Axolotl",
    type: "Zoan",
    rarity: "uncommon",
    element: "Axolotl",
    power: "Transform into axolotl",
    description: "User can transform into an axolotl.",
    multiplier: 1.26,
    user: "Smiley"
  },

  "nagi_nagi_no_mi": {
    id: "nagi_nagi_no_mi",
    name: "Nagi Nagi no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Calm",
    power: "Allows user to create soundproof barriers",
    description: "User can nullify sound in designated areas.",
    multiplier: 1.28,
    user: "Rosinante"
  },

  "chiyu_chiyu_no_mi": {
    id: "chiyu_chiyu_no_mi",
    name: "Chiyu Chiyu no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Heal",
    power: "Allows user to heal others",
    description: "User can heal injuries by touch.",
    multiplier: 1.35,
    user: "Mansherry"
  },

  "soku_soku_no_mi": {
    id: "soku_soku_no_mi",
    name: "Soku Soku no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Speed",
    power: "Allows user to manipulate speed",
    description: "User can increase or decrease movement speed.",
    multiplier: 1.32,
    user: "Unknown"
  },

  "mero_mero_no_mi": {
    id: "mero_mero_no_mi",
    name: "Mero Mero no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Love",
    power: "Allows user to turn people to stone with love",
    description: "User can petrify those attracted to them.",
    multiplier: 1.37,
    user: "Boa Hancock"
  },

  "doku_doku_no_mi_basic": {
    id: "doku_doku_no_mi_basic",
    name: "Doku Doku no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Poison",
    power: "Basic poison creation",
    description: "User can create weak poisons.",
    multiplier: 1.31,
    user: "Magellan"
  },

  "horu_horu_no_mi": {
    id: "horu_horu_no_mi",
    name: "Horu Horu no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Hormone",
    power: "Allows user to control hormones",
    description: "User can manipulate hormones to change bodies.",
    multiplier: 1.34,
    user: "Emporio Ivankov"
  },

  "choki_choki_no_mi": {
    id: "choki_choki_no_mi",
    name: "Choki Choki no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Scissors",
    power: "Allows user to cut anything like paper",
    description: "User can cut through anything as if it were paper.",
    multiplier: 1.29,
    user: "Inazuma"
  },

  "gura_gura_no_mi_basic": {
    id: "gura_gura_no_mi_basic",
    name: "Gura Gura no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Tremor",
    power: "Basic earthquake abilities",
    description: "User can create small tremors.",
    multiplier: 1.38,
    user: "Edward Newgate"
  },

  "yami_yami_no_mi_basic": {
    id: "yami_yami_no_mi_basic",
    name: "Yami Yami no Mi (Basic)",
    type: "Logia",
    rarity: "uncommon",
    element: "Darkness",
    power: "Basic darkness manipulation",
    description: "User can create small areas of darkness.",
    multiplier: 1.36,
    user: "Marshall D. Teach"
  },

  "pika_pika_no_mi_basic": {
    id: "pika_pika_no_mi_basic",
    name: "Pika Pika no Mi (Basic)",
    type: "Logia",
    rarity: "uncommon",
    element: "Light",
    power: "Basic light manipulation",
    description: "User can create bright flashes of light.",
    multiplier: 1.35,
    user: "Borsalino"
  },

  "hie_hie_no_mi_basic": {
    id: "hie_hie_no_mi_basic",
    name: "Hie Hie no Mi (Basic)",
    type: "Logia",
    rarity: "uncommon",
    element: "Ice",
    power: "Basic ice manipulation",
    description: "User can create ice projectiles.",
    multiplier: 1.33,
    user: "Kuzan"
  },

  "magu_magu_no_mi_basic": {
    id: "magu_magu_no_mi_basic",
    name: "Magu Magu no Mi (Basic)",
    type: "Logia",
    rarity: "uncommon",
    element: "Magma",
    power: "Basic magma manipulation",
    description: "User can create small amounts of lava.",
    multiplier: 1.37,
    user: "Sakazuki"
  },

  "goro_goro_no_mi_basic": {
    id: "goro_goro_no_mi_basic",
    name: "Goro Goro no Mi (Basic)",
    type: "Logia",
    rarity: "uncommon",
    element: "Lightning",
    power: "Basic lightning manipulation",
    description: "User can generate electric shocks.",
    multiplier: 1.36,
    user: "Enel"
  },

  "ope_ope_no_mi_basic": {
    id: "ope_ope_no_mi_basic",
    name: "Ope Ope no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Operation",
    power: "Basic surgical abilities",
    description: "User can perform precise cuts.",
    multiplier: 1.34,
    user: "Trafalgar Law"
  },

  "hobi_hobi_no_mi_basic": {
    id: "hobi_hobi_no_mi_basic",
    name: "Hobi Hobi no Mi (Basic)",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Hobby",
    power: "Basic toy transformation",
    description: "User can turn small objects into toys.",
    multiplier: 1.32,
    user: "Sugar"
  },

  "bari_bari_no_mi": {
    id: "bari_bari_no_mi",
    name: "Bari Bari no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Barrier",
    power: "Allows user to create barriers",
    description: "User can create transparent barriers for defense.",
    multiplier: 1.33,
    user: "Bartolomeo"
  },

  "nui_nui_no_mi": {
    id: "nui_nui_no_mi",
    name: "Nui Nui no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Stitch",
    power: "Allows user to stitch anything together",
    description: "User can sew anything together like fabric.",
    multiplier: 1.27,
    user: "Leo"
  },

  "giro_giro_no_mi": {
    id: "giro_giro_no_mi",
    name: "Giro Giro no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Clairvoyance",
    power: "Allows user to see through anything",
    description: "User can see through objects and read minds.",
    multiplier: 1.31,
    user: "Viola"
  },

  "ishi_ishi_no_mi": {
    id: "ishi_ishi_no_mi",
    name: "Ishi Ishi no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Stone",
    power: "Allows user to merge with and control stone",
    description: "User can assimilate with stone and control it.",
    multiplier: 1.30,
    user: "Pica"
  },

  "hoya_hoya_no_mi": {
    id: "hoya_hoya_no_mi",
    name: "Hoya Hoya no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Lamp",
    power: "Allows user to summon genies",
    description: "User can summon and control lamp genies.",
    multiplier: 1.35,
    user: "Unknown"
  },

  "netsu_netsu_no_mi": {
    id: "netsu_netsu_no_mi",
    name: "Netsu Netsu no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Heat",
    power: "Allows user to manipulate heat",
    description: "User can absorb and redirect heat energy.",
    multiplier: 1.32,
    user: "Charlotte Oven"
  },

  "kuku_kuku_no_mi": {
    id: "kuku_kuku_no_mi",
    name: "Kuku Kuku no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Cook",
    power: "Allows user to cook anything instantly",
    description: "User can cook any ingredient perfectly.",
    multiplier: 1.25,
    user: "Streusen"
  },

  "bisu_bisu_no_mi": {
    id: "bisu_bisu_no_mi",
    name: "Bisu Bisu no Mi",
    type: "Paramecia",
    rarity: "uncommon",
    element: "Biscuit",
    power: "Allows user to create and control biscuits",
    description: "User can generate hard biscuit armor and soldiers.",
    multiplier: 1.34,
    user: "Charlotte Cracker"
  },

  // =====================================================
  // COMMON FRUITS (60 fruits) - 1.0x to 1.2x CP
  // =====================================================
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

  "buta_buta_no_mi": {
    id: "buta_buta_no_mi",
    name: "Buta Buta no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Pig",
    power: "Transform into pig",
    description: "Stubborn pig transformation.",
    multiplier: 1.06,
    user: "Unknown"
  },

  "ryu_ryu_no_mi_basic": {
    id: "ryu_ryu_no_mi_basic",
    name: "Ryu Ryu no Mi (Basic)",
    type: "Zoan",
    rarity: "common",
    element: "Dragon",
    power: "Basic dragon form",
    description: "Small dragon transformation.",
    multiplier: 1.08,
    user: "Unknown"
  },

  "kame_kame_no_mi": {
    id: "kame_kame_no_mi",
    name: "Kame Kame no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Turtle",
    power: "Transform into turtle",
    description: "Defensive turtle form.",
    multiplier: 1.05,
    user: "Unknown"
  },

  "taka_taka_no_mi_basic": {
    id: "taka_taka_no_mi_basic",
    name: "Taka Taka no Mi (Basic)",
    type: "Zoan",
    rarity: "common",
    element: "Falcon",
    power: "Basic falcon form",
    description: "Swift falcon transformation.",
    multiplier: 1.07,
    user: "Unknown"
  },

  "kani_kani_no_mi": {
    id: "kani_kani_no_mi",
    name: "Kani Kani no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Crab",
    power: "Transform into crab",
    description: "Strong crab transformation with pincers.",
    multiplier: 1.08,
    user: "Unknown"
  },

  "tako_tako_no_mi": {
    id: "tako_tako_no_mi",
    name: "Tako Tako no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Octopus",
    power: "Transform into octopus",
    description: "Multiple tentacles for versatile attacks.",
    multiplier: 1.07,
    user: "Unknown"
  },

  "ika_ika_no_mi": {
    id: "ika_ika_no_mi",
    name: "Ika Ika no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Squid",
    power: "Transform into squid",
    description: "Squid form with ink abilities.",
    multiplier: 1.06,
    user: "Unknown"
  },

  "kumo_kumo_no_mi": {
    id: "kumo_kumo_no_mi",
    name: "Kumo Kumo no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Spider",
    power: "Transform into spider",
    description: "Spider form with web creation.",
    multiplier: 1.07,
    user: "Unknown"
  },

  "ari_ari_no_mi": {
    id: "ari_ari_no_mi",
    name: "Ari Ari no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Ant",
    power: "Transform into ant",
    description: "Ant form with collective strength.",
    multiplier: 1.06,
    user: "Unknown"
  },

  "hachi_hachi_no_mi": {
    id: "hachi_hachi_no_mi",
    name: "Hachi Hachi no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Bee",
    power: "Transform into bee",
    description: "Bee form with stinger and flight.",
    multiplier: 1.07,
    user: "Unknown"
  },

  "cho_cho_no_mi": {
    id: "cho_cho_no_mi",
    name: "Cho Cho no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Butterfly",
    power: "Transform into butterfly",
    description: "Butterfly form with pollen abilities.",
    multiplier: 1.05,
    user: "Unknown"
  },

  "batto_batto_no_mi": {
    id: "batto_batto_no_mi",
    name: "Batto Batto no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Bat",
    power: "Transform into bat",
    description: "Bat form with echolocation.",
    multiplier: 1.08,
    user: "Unknown"
  },

  "nezumi_nezumi_no_mi": {
    id: "nezumi_nezumi_no_mi",
    name: "Nezumi Nezumi no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Mouse",
    power: "Transform into mouse",
    description: "Small, fast mouse form.",
    multiplier: 1.04,
    user: "Unknown"
  },

  "risu_risu_no_mi": {
    id: "risu_risu_no_mi",
    name: "Risu Risu no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Squirrel",
    power: "Transform into squirrel",
    description: "Agile squirrel with nut storage.",
    multiplier: 1.05,
    user: "Unknown"
  },

  "usagi_usagi_no_mi": {
    id: "usagi_usagi_no_mi",
    name: "Usagi Usagi no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Rabbit",
    power: "Transform into rabbit",
    description: "Fast rabbit with jumping ability.",
    multiplier: 1.06,
    user: "Unknown"
  },

  "shika_shika_no_mi": {
    id: "shika_shika_no_mi",
    name: "Shika Shika no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Deer",
    power: "Transform into deer",
    description: "Deer form with antlers.",
    multiplier: 1.07,
    user: "Unknown"
  },

  "kuma_kuma_no_mi": {
    id: "kuma_kuma_no_mi",
    name: "Kuma Kuma no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Bear",
    power: "Transform into bear",
    description: "Strong bear transformation.",
    multiplier: 1.10,
    user: "Unknown"
  },

  "ookami_ookami_no_mi_basic": {
    id: "ookami_ookami_no_mi_basic",
    name: "Ookami Ookami no Mi (Basic)",
    type: "Zoan",
    rarity: "common",
    element: "Wolf",
    power: "Basic wolf transformation",
    description: "Basic wolf form with pack instincts.",
    multiplier: 1.08,
    user: "Unknown"
  },

  "kitsune_kitsune_no_mi": {
    id: "kitsune_kitsune_no_mi",
    name: "Kitsune Kitsune no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Fox",
    power: "Transform into fox",
    description: "Cunning fox with mystical abilities.",
    multiplier: 1.08,
    user: "Unknown"
  },

  "tanuki_tanuki_no_mi": {
    id: "tanuki_tanuki_no_mi",
    name: "Tanuki Tanuki no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Raccoon Dog",
    power: "Transform into tanuki",
    description: "Shapeshifting tanuki with trickster abilities.",
    multiplier: 1.07,
    user: "Unknown"
  },

  "saru_saru_no_mi": {
    id: "saru_saru_no_mi",
    name: "Saru Saru no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Monkey",
    power: "Transform into monkey",
    description: "Agile monkey with climbing abilities.",
    multiplier: 1.07,
    user: "Unknown"
  },

  "zou_zou_no_mi_basic": {
    id: "zou_zou_no_mi_basic",
    name: "Zou Zou no Mi (Basic)",
    type: "Zoan",
    rarity: "common",
    element: "Elephant",
    power: "Basic elephant transformation",
    description: "Small elephant form with trunk.",
    multiplier: 1.09,
    user: "Unknown"
  },

  "kirin_kirin_no_mi": {
    id: "kirin_kirin_no_mi",
    name: "Kirin Kirin no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Giraffe",
    power: "Transform into giraffe",
    description: "Tall giraffe with long neck reach.",
    multiplier: 1.08,
    user: "Kaku"
  },

  "hippo_hippo_no_mi": {
    id: "hippo_hippo_no_mi",
    name: "Hippo Hippo no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Hippopotamus",
    power: "Transform into hippo",
    description: "Massive hippo with powerful jaws.",
    multiplier: 1.10,
    user: "Unknown"
  },

  "sai_sai_no_mi": {
    id: "sai_sai_no_mi",
    name: "Sai Sai no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Rhinoceros",
    power: "Transform into rhino",
    description: "Armored rhino with charging horn.",
    multiplier: 1.09,
    user: "Unknown"
  },

  "raion_raion_no_mi": {
    id: "raion_raion_no_mi",
    name: "Raion Raion no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Lion",
    power: "Transform into lion",
    description: "Majestic lion with royal presence.",
    multiplier: 1.09,
    user: "Unknown"
  },

  "tora_tora_no_mi": {
    id: "tora_tora_no_mi",
    name: "Tora Tora no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Tiger",
    power: "Transform into tiger",
    description: "Fierce tiger with deadly claws.",
    multiplier: 1.10,
    user: "Unknown"
  },

  "hyou_hyou_no_mi": {
    id: "hyou_hyou_no_mi",
    name: "Hyou Hyou no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Leopard",
    power: "Transform into leopard",
    description: "Stealthy leopard with speed.",
    multiplier: 1.08,
    user: "Unknown"
  },

  "ookami_ookami_no_mi_dire": {
    id: "ookami_ookami_no_mi_dire",
    name: "Ookami Ookami no Mi, Model: Dire Wolf",
    type: "Ancient Zoan",
    rarity: "common",
    element: "Dire Wolf",
    power: "Transform into dire wolf",
    description: "Ancient wolf species with pack leadership.",
    multiplier: 1.11,
    user: "Unknown"
  },

  "wani_wani_no_mi_basic": {
    id: "wani_wani_no_mi_basic",
    name: "Wani Wani no Mi (Basic)",
    type: "Zoan",
    rarity: "common",
    element: "Crocodile",
    power: "Basic crocodile transformation",
    description: "Crocodile form with powerful bite.",
    multiplier: 1.10,
    user: "Unknown"
  },

  "hebi_hebi_no_mi_basic": {
    id: "hebi_hebi_no_mi_basic",
    name: "Hebi Hebi no Mi (Basic)",
    type: "Zoan",
    rarity: "common",
    element: "Snake",
    power: "Basic snake transformation",
    description: "Snake form with quick strikes.",
    multiplier: 1.07,
    user: "Unknown"
  },

  "tokage_tokage_no_mi": {
    id: "tokage_tokage_no_mi",
    name: "Tokage Tokage no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Lizard",
    power: "Transform into lizard",
    description: "Lizard form with wall climbing.",
    multiplier: 1.06,
    user: "Unknown"
  },

  "kaeru_kaeru_no_mi": {
    id: "kaeru_kaeru_no_mi",
    name: "Kaeru Kaeru no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Frog",
    power: "Transform into frog",
    description: "Frog form with jumping and swimming.",
    multiplier: 1.05,
    user: "Unknown"
  },

  "sakana_sakana_no_mi": {
    id: "sakana_sakana_no_mi",
    name: "Sakana Sakana no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Fish",
    power: "Transform into fish",
    description: "Fish form with underwater breathing.",
    multiplier: 1.04,
    user: "Unknown"
  },

  "same_same_no_mi_basic": {
    id: "same_same_no_mi_basic",
    name: "Same Same no Mi (Basic)",
    type: "Zoan",
    rarity: "common",
    element: "Shark",
    power: "Basic shark transformation",
    description: "Shark form with water dominance.",
    multiplier: 1.09,
    user: "Unknown"
  },

  "kujira_kujira_no_mi": {
    id: "kujira_kujira_no_mi",
    name: "Kujira Kujira no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Whale",
    power: "Transform into whale",
    description: "Massive whale with sonic abilities.",
    multiplier: 1.11,
    user: "Unknown"
  },

  "iruka_iruka_no_mi": {
    id: "iruka_iruka_no_mi",
    name: "Iruka Iruka no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Dolphin",
    power: "Transform into dolphin",
    description: "Intelligent dolphin with echolocation.",
    multiplier: 1.08,
    user: "Unknown"
  },

  "kurage_kurage_no_mi": {
    id: "kurage_kurage_no_mi",
    name: "Kurage Kurage no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Jellyfish",
    power: "Transform into jellyfish",
    description: "Jellyfish form with stinging tentacles.",
    multiplier: 1.06,
    user: "Unknown"
  },

  "hitode_hitode_no_mi": {
    id: "hitode_hitode_no_mi",
    name: "Hitode Hitode no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Starfish",
    power: "Transform into starfish",
    description: "Starfish form with regeneration.",
    multiplier: 1.05,
    user: "Unknown"
  },

  "uni_uni_no_mi": {
    id: "uni_uni_no_mi",
    name: "Uni Uni no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Sea Urchin",
    power: "Transform into sea urchin",
    description: "Spiky sea urchin with defensive spines.",
    multiplier: 1.07,
    user: "Unknown"
  },

  "ebi_ebi_no_mi": {
    id: "ebi_ebi_no_mi",
    name: "Ebi Ebi no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Shrimp",
    power: "Transform into shrimp",
    description: "Shrimp form with water jets.",
    multiplier: 1.05,
    user: "Unknown"
  },

  "hotate_hotate_no_mi": {
    id: "hotate_hotate_no_mi",
    name: "Hotate Hotate no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Scallop",
    power: "Transform into scallop",
    description: "Scallop form with shell protection.",
    multiplier: 1.06,
    user: "Unknown"
  },

  "namako_namako_no_mi": {
    id: "namako_namako_no_mi",
    name: "Namako Namako no Mi",
    type: "Zoan",
    rarity: "common",
    element: "Sea Cucumber",
    power: "Transform into sea cucumber",
    description: "Sea cucumber with slippery defense.",
    multiplier: 1.04,
    user: "Unknown"
  },

  "kaisou_kaisou_no_mi": {
    id: "kaisou_kaisou_no_mi",
    name: "Kaisou Kaisou no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Seaweed",
    power: "Control and become seaweed",
    description: "User can manipulate seaweed for binding.",
    multiplier: 1.05,
    user: "Unknown"
  },

  "sango_sango_no_mi": {
    id: "sango_sango_no_mi",
    name: "Sango Sango no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Coral",
    power: "Create and control coral",
    description: "User can grow hard coral structures.",
    multiplier: 1.08,
    user: "Unknown"
  },

  "shinjyu_shinjyu_no_mi": {
    id: "shinjyu_shinjyu_no_mi",
    name: "Shinjyu Shinjyu no Mi",
    type: "Paramecia",
    rarity: "common",
    element: "Pearl",
    power: "Create and control pearls",
    description: "User can produce lustrous pearls for defense.",
    multiplier: 1.07,
    user: "Unknown"
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
