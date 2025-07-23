// src/data/DevilFruits.js - Complete Devil Fruits Database
const DEVIL_FRUITS = [
    // Legendary Fruits (1%)
    {
        id: 'gomu_gomu_no_mi',
        name: 'Gomu Gomu no Mi',
        type: 'Paramecia',
        rarity: 'legendary',
        element: 'Rubber',
        power: 'Grants the user a rubber body',
        description: 'The legendary fruit that turns the user\'s body into rubber, granting immunity to blunt attacks and electricity.',
        multiplier: 3.5,
        imageUrl: 'https://i.imgur.com/GomuGomu.png'
    },
    {
        id: 'yami_yami_no_mi',
        name: 'Yami Yami no Mi',
        type: 'Logia',
        rarity: 'legendary',
        element: 'Darkness',
        power: 'Control over darkness and gravity',
        description: 'The most dangerous Devil Fruit, allowing the user to control darkness and nullify other Devil Fruit powers.',
        multiplier: 4.0,
        imageUrl: 'https://i.imgur.com/YamiYami.png'
    },
    {
        id: 'ope_ope_no_mi',
        name: 'Ope Ope no Mi',
        type: 'Paramecia',
        rarity: 'legendary',
        element: 'Surgery',
        power: 'Create a spherical space and manipulate everything within',
        description: 'The ultimate Devil Fruit that grants the user surgical abilities and can grant eternal youth.',
        multiplier: 3.8,
        imageUrl: 'https://i.imgur.com/OpeOpe.png'
    },
    
    // Mythical Fruits (2%)
    {
        id: 'mera_mera_no_mi',
        name: 'Mera Mera no Mi',
        type: 'Logia',
        rarity: 'mythical',
        element: 'Fire',
        power: 'Transform into and control fire',
        description: 'Allows the user to create, control, and transform into fire at will.',
        multiplier: 3.0,
        imageUrl: 'https://i.imgur.com/MeraMera.png'
    },
    {
        id: 'pika_pika_no_mi',
        name: 'Pika Pika no Mi',
        type: 'Logia',
        rarity: 'mythical',
        element: 'Light',
        power: 'Transform into and control light',
        description: 'Grants the power to create, control, and transform into light at the speed of light.',
        multiplier: 3.2,
        imageUrl: 'https://i.imgur.com/PikaPika.png'
    },
    {
        id: 'gura_gura_no_mi',
        name: 'Gura Gura no Mi',
        type: 'Paramecia',
        rarity: 'mythical',
        element: 'Earthquake',
        power: 'Create devastating earthquakes',
        description: 'Known as the strongest Paramecia, capable of destroying the world.',
        multiplier: 3.5,
        imageUrl: 'https://i.imgur.com/GuraGura.png'
    },
    
    // Epic Fruits (5%)
    {
        id: 'hie_hie_no_mi',
        name: 'Hie Hie no Mi',
        type: 'Logia',
        rarity: 'epic',
        element: 'Ice',
        power: 'Transform into and control ice',
        description: 'Grants the power to create, control, and transform into ice.',
        multiplier: 2.5,
        imageUrl: 'https://i.imgur.com/HieHie.png'
    },
    {
        id: 'magu_magu_no_mi',
        name: 'Magu Magu no Mi',
        type: 'Logia',
        rarity: 'epic',
        element: 'Magma',
        power: 'Transform into and control magma',
        description: 'Superior to fire, allows complete control over molten rock.',
        multiplier: 2.8,
        imageUrl: 'https://i.imgur.com/MaguMagu.png'
    },
    {
        id: 'doku_doku_no_mi',
        name: 'Doku Doku no Mi',
        type: 'Paramecia',
        rarity: 'epic',
        element: 'Poison',
        power: 'Generate and control poison',
        description: 'Creates various types of poison from the user\'s body.',
        multiplier: 2.3,
        imageUrl: 'https://i.imgur.com/DokuDoku.png'
    },
    {
        id: 'nikyu_nikyu_no_mi',
        name: 'Nikyu Nikyu no Mi',
        type: 'Paramecia',
        rarity: 'epic',
        element: 'Paws',
        power: 'Repel anything with paw pads',
        description: 'Can repel anything including pain, fatigue, and even air itself.',
        multiplier: 2.6,
        imageUrl: 'https://i.imgur.com/NikyuNikyu.png'
    },
    
    // Rare Fruits (15%)
    {
        id: 'suna_suna_no_mi',
        name: 'Suna Suna no Mi',
        type: 'Logia',
        rarity: 'rare',
        element: 'Sand',
        power: 'Transform into and control sand',
        description: 'Allows manipulation of sand and the ability to dry up anything.',
        multiplier: 2.0,
        imageUrl: 'https://i.imgur.com/SunaSuna.png'
    },
    {
        id: 'moku_moku_no_mi',
        name: 'Moku Moku no Mi',
        type: 'Logia',
        rarity: 'rare',
        element: 'Smoke',
        power: 'Transform into and control smoke',
        description: 'Grants the ability to create, control, and transform into smoke.',
        multiplier: 1.8,
        imageUrl: 'https://i.imgur.com/MokuMoku.png'
    },
    {
        id: 'bomu_bomu_no_mi',
        name: 'Bomu Bomu no Mi',
        type: 'Paramecia',
        rarity: 'rare',
        element: 'Explosion',
        power: 'Make any part of the body explode',
        description: 'Turns the user into a bomb human, capable of creating explosions.',
        multiplier: 1.9,
        imageUrl: 'https://i.imgur.com/BomuBomu.png'
    },
    {
        id: 'hana_hana_no_mi',
        name: 'Hana Hana no Mi',
        type: 'Paramecia',
        rarity: 'rare',
        element: 'Flower',
        power: 'Sprout body parts on any surface',
        description: 'Allows the user to replicate and sprout pieces of their body.',
        multiplier: 1.7,
        imageUrl: 'https://i.imgur.com/HanaHana.png'
    },
    {
        id: 'bari_bari_no_mi',
        name: 'Bari Bari no Mi',
        type: 'Paramecia',
        rarity: 'rare',
        element: 'Barrier',
        power: 'Create unbreakable barriers',
        description: 'Creates transparent barriers that can block any attack.',
        multiplier: 2.1,
        imageUrl: 'https://i.imgur.com/BariBari.png'
    },
    
    // Uncommon Fruits (30%)
    {
        id: 'kibi_kibi_no_mi',
        name: 'Kibi Kibi no Mi',
        type: 'Paramecia',
        rarity: 'uncommon',
        element: 'Millet',
        power: 'Create dango that can tame animals',
        description: 'Creates dumplings that can tame any animal when eaten.',
        multiplier: 1.5,
        imageUrl: 'https://i.imgur.com/KibiKibi.png'
    },
    {
        id: 'mane_mane_no_mi',
        name: 'Mane Mane no Mi',
        type: 'Paramecia',
        rarity: 'uncommon',
        element: 'Clone',
        power: 'Transform into anyone you touch',
        description: 'Allows perfect physical transformation into anyone touched.',
        multiplier: 1.4,
        imageUrl: 'https://i.imgur.com/ManeMane.png'
    },
    {
        id: 'sube_sube_no_mi',
        name: 'Sube Sube no Mi',
        type: 'Paramecia',
        rarity: 'uncommon',
        element: 'Smooth',
        power: 'Make everything slide off your body',
        description: 'Makes the user\'s skin perfectly smooth, deflecting attacks.',
        multiplier: 1.3,
        imageUrl: 'https://i.imgur.com/SubeSube.png'
    },
    {
        id: 'noro_noro_no_mi',
        name: 'Noro Noro no Mi',
        type: 'Paramecia',
        rarity: 'uncommon',
        element: 'Slow',
        power: 'Emit beams that slow down anything',
        description: 'Slows down anything hit by the user\'s special beam.',
        multiplier: 1.6,
        imageUrl: 'https://i.imgur.com/NoroNoro.png'
    },
    {
        id: 'doa_doa_no_mi',
        name: 'Doa Doa no Mi',
        type: 'Paramecia',
        rarity: 'uncommon',
        element: 'Door',
        power: 'Create doors on any surface',
        description: 'Can create doors on any surface, including the air itself.',
        multiplier: 1.5,
        imageUrl: 'https://i.imgur.com/DoaDoa.png'
    },
    
    // Common Fruits (47%)
    {
        id: 'awa_awa_no_mi',
        name: 'Awa Awa no Mi',
        type: 'Paramecia',
        rarity: 'common',
        element: 'Soap',
        power: 'Create and control soap bubbles',
        description: 'Allows the user to create soap and bubbles.',
        multiplier: 1.2,
        imageUrl: 'https://i.imgur.com/AwaAwa.png'
    },
    {
        id: 'ori_ori_no_mi',
        name: 'Ori Ori no Mi',
        type: 'Paramecia',
        rarity: 'common',
        element: 'Cage',
        power: 'Pass through and manipulate iron',
        description: 'Allows passing through iron bars and creating restraints.',
        multiplier: 1.1,
        imageUrl: 'https://i.imgur.com/OriOri.png'
    },
    {
        id: 'kilo_kilo_no_mi',
        name: 'Kilo Kilo no Mi',
        type: 'Paramecia',
        rarity: 'common',
        element: 'Weight',
        power: 'Change body weight from 1 to 10,000 kg',
        description: 'Allows the user to change their weight at will.',
        multiplier: 1.0,
        imageUrl: 'https://i.imgur.com/KiloKilo.png'
    },
    {
        id: 'shari_shari_no_mi',
        name: 'Shari Shari no Mi',
        type: 'Paramecia',
        rarity: 'common',
        element: 'Wheel',
        power: 'Turn body parts into wheels',
        description: 'Allows transformation of body parts into wheels.',
        multiplier: 1.1,
        imageUrl: 'https://i.imgur.com/ShariShari.png'
    },
    {
        id: 'baku_baku_no_mi',
        name: 'Baku Baku no Mi',
        type: 'Paramecia',
        rarity: 'common',
        element: 'Munch',
        power: 'Eat and become anything consumed',
        description: 'Allows eating anything and becoming part of what is eaten.',
        multiplier: 1.2,
        imageUrl: 'https://i.imgur.com/BakuBaku.png'
    },
    {
        id: 'toge_toge_no_mi',
        name: 'Toge Toge no Mi',
        type: 'Paramecia',
        rarity: 'common',
        element: 'Spike',
        power: 'Grow spikes from any part of the body',
        description: 'Allows growing sharp spikes from any part of the body.',
        multiplier: 1.1,
        imageUrl: 'https://i.imgur.com/TogeToge.png'
    }
];

// Rarity weights with pity system
function getRarityWeights(pityCount = 0) {
    const baseWeights = {
        common: 47,
        uncommon: 30,
        rare: 15,
        epic: 5,
        mythical: 2,
        legendary: 1
    };
    
    // Pity system implementation
    if (pityCount >= 90) {
        // Guaranteed legendary at 90 pulls
        return {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            mythical: 0,
            legendary: 100
        };
    } else if (pityCount >= 75) {
        // High chance for legendary/mythical after 75 pulls
        return {
            common: 20,
            uncommon: 20,
            rare: 20,
            epic: 20,
            mythical: 15,
            legendary: 5
        };
    } else if (pityCount >= 50) {
        // Increased rare+ chances after 50 pulls
        return {
            common: 30,
            uncommon: 25,
            rare: 20,
            epic: 15,
            mythical: 7,
            legendary: 3
        };
    }
    
    // Apply soft pity scaling
    const pityMultiplier = 1 + (pityCount * 0.01);
    return {
        common: Math.max(0, baseWeights.common - pityCount * 0.3),
        uncommon: Math.max(0, baseWeights.uncommon - pityCount * 0.2),
        rare: baseWeights.rare,
        epic: baseWeights.epic + pityCount * 0.1,
        mythical: baseWeights.mythical * pityMultiplier,
        legendary: baseWeights.legendary * pityMultiplier
    };
}

// Get fruits by rarity
function getFruitsByRarity(rarity) {
    return DEVIL_FRUITS.filter(fruit => fruit.rarity === rarity);
}

// Get fruit by ID
function getFruitById(id) {
    return DEVIL_FRUITS.find(fruit => fruit.id === id);
}

// Get random fruit of specific rarity
function getRandomFruitByRarity(rarity) {
    const fruits = getFruitsByRarity(rarity);
    return fruits[Math.floor(Math.random() * fruits.length)];
}

module.exports = { 
    DEVIL_FRUITS, 
    getRarityWeights,
    getFruitsByRarity,
    getFruitById,
    getRandomFruitByRarity
};
