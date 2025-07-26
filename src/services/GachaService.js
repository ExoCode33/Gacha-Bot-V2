// src/services/GachaService.js - UPDATED: Use DevilFruitSkills.js lookup
// Add this import at the top:
const { getFruitWithSkill } = require('../data/DevilFruits');
const { getSkillData, getFallbackSkill } = require('../data/DevilFruitSkills');

// In your pullSingleFruit method, replace the skill assignment with this:

/**
 * Pull a single devil fruit with FIXED pity system
 */
async pullSingleFruit(userId, pityCount) {
    try {
        // ... existing pity calculation code ...
        
        // Select fruit from rarity (use weighted selection for divine)
        let selectedFruit;
        if (selectedRarity === 'divine') {
            selectedFruit = selectWeightedDivineFruit(fruitsOfRarity);
            
            // Log if One Piece was pulled (ultra rare)
            if (selectedFruit.id === 'one_piece_treasure') {
                this.logger.warn(`🏆 ULTRA RARE: User ${userId} pulled ONE PIECE! (${pityCount} pity, pity used: ${pityUsed})`);
            }
        } else {
            selectedFruit = fruitsOfRarity[Math.floor(Math.random() * fruitsOfRarity.length)];
        }
        
        // NEW: Get skill data from DevilFruitSkills.js
        const skillData = getSkillData(selectedFruit.id);
        const skill = skillData || getFallbackSkill(selectedFruit.rarity);
        
        // Combine fruit data with skill
        const fruitWithSkill = {
            ...selectedFruit,
            skill
        };
        
        this.logger.debug(`User ${userId} pulled ${selectedFruit.name} (${selectedRarity}) - Pity: ${pityCount}, Used: ${pityUsed}`);
        
        return { 
            fruit: fruitWithSkill,  // Return fruit with skill data
            pityUsed: pityUsed,
            pityCount: pityCount
        };
        
    } catch (error) {
        this.logger.error(`Error pulling single fruit for user ${userId}:`, error);
        throw error;
    }
}
