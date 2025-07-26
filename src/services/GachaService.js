// src/services/GachaService.js - FIXED: Mythical/Divine Only Pity + One Piece Ultra Rare
const DatabaseManager = require('../database/DatabaseManager');
const { DEVIL_FRUITS, getFruitsByRarity, selectWeightedDivineFruit } = require('../data/DevilFruits');
const { RARITY_COLORS, BASE_PULL_RATES } = require('../data/Constants');
const Logger = require('../utils/Logger');

// FIXED PITY SYSTEM - ONLY Mythical/Divine, 1500 limit
const FIXED_PITY_SYSTEM = {
    HARD_PITY_LIMIT: 1500,     // Back to 1500
    
    // Premium rates when pity procs - ONLY mythical/divine
    PREMIUM_RATES: {
        mythical: 99.0,         // 99% when pity procs
        divine: 1.0             // 1% when pity procs (very low)
    },
    
    // Pity proc chance calculation - MUCH SLOWER SCALING
    BASE_PITY_CHANCE: 0.0,      // Base chance at 0 pulls
    MAX_PITY_CHANCE: 100.0,     // 100% chance at 1500 pulls
    
    // Pity resets ONLY when you get mythical/divine (REMOVED legendary)
    RESET_RARITIES: ['mythical', 'divine'],
    
    // MUCH SLOWER scaling - starts extremely slow
    SCALING_POWER: 3.0          // Increased from 2.5
};

class GachaService {
    constructor() {
        this.logger = new Logger('GACHA_SERVICE');
        this.pullStatistics = new Map(); // Track user pull statistics
    }

    /**
     * Perform multiple pulls for a user with FIXED pity mechanics
     */
    async performPulls(userId, count) {
        const results = [];
        
        try {
            // Get user's current pity count
            let pityCount = await this.getPityCount(userId);
            let pityUsedThisSession = false;
            
            this.logger.info(`User ${userId} performing ${count} pulls (pity: ${pityCount})`);
            
            for (let i = 0; i < count; i++) {
                const pullResult = await this.pullSingleFruit(userId, pityCount);
                
                // Add fruit to database
                const dbResult = await DatabaseManager.addDevilFruit(userId, pullResult.fruit);
                
                results.push({
                    fruit: dbResult.fruit,
                    isNew: dbResult.isNewFruit,
                    duplicateCount: dbResult.duplicateCount,
                    rarity: pullResult.fruit.rarity,
                    pityCount: pityCount,
                    pityUsed: pullResult.pityUsed
                });
                
                // Track if pity was used in this session
                if (pullResult.pityUsed) {
                    pityUsedThisSession = true;
                }
                
                // Check if pity should reset (ONLY mythical/divine)
                if (FIXED_PITY_SYSTEM.RESET_RARITIES.includes(pullResult.fruit.rarity)) {
                    pityCount = 0; // Reset pity
                    this.logger.info(`Pity reset for user ${userId} after pulling ${pullResult.fruit.rarity}`);
                } else {
                    pityCount++; // Increment pity
                }
            }
            
            // Save updated pity count
            await this.savePityCount(userId, pityCount);
            
            // Update pull statistics
            await this.updatePullStatistics(userId, results);
            
            this.logger.info(`User ${userId} completed ${count} pulls, new pity: ${pityCount}, pity used: ${pityUsedThisSession}`);
            
            return {
                results,
                finalPityCount: pityCount,
                pityUsedInSession: pityUsedThisSession
            };
            
        } catch (error) {
            this.logger.error(`Error performing pulls for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Pull a single devil fruit with FIXED pity system
     */
    async pullSingleFruit(userId, pityCount) {
        try {
            // Calculate pity proc chance with MUCH SLOWER scaling
            const pityProcChance = this.calculateFixedPityProcChance(pityCount);
            const pityProcs = Math.random() * 100 < pityProcChance;
            
            let selectedRarity;
            let pityUsed = false;
            
            if (pityProcs) {
                // Use premium rates when pity procs (ONLY mythical/divine)
                selectedRarity = this.selectPremiumRarity();
                pityUsed = true;
                this.logger.info(`Pity proc for user ${userId} at ${pityCount} pulls (${pityProcChance.toFixed(4)}% chance)`);
            } else {
                // Use normal rates
                selectedRarity = this.selectNormalRarity();
            }
            
            // Get fruits of selected rarity
            const fruitsOfRarity = getFruitsByRarity(selectedRarity);
            
            if (fruitsOfRarity.length === 0) {
                this.logger.warn(`No fruits found for rarity: ${selectedRarity}, defaulting to common`);
                const commonFruits = getFruitsByRarity('common');
                const selectedFruit = commonFruits[Math.floor(Math.random() * commonFruits.length)];
                return { fruit: selectedFruit, pityUsed: false };
            }
            
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
            
            this.logger.debug(`User ${userId} pulled ${selectedFruit.name} (${selectedRarity}) - Pity: ${pityCount}, Used: ${pityUsed}`);
            
            return { 
                fruit: selectedFruit, 
                pityUsed: pityUsed,
                pityCount: pityCount
            };
            
        } catch (error) {
            this.logger.error(`Error pulling single fruit for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Calculate FIXED pity proc chance - MUCH slower scaling
     */
    calculateFixedPityProcChance(pityCount) {
        const maxPity = FIXED_PITY_SYSTEM.HARD_PITY_LIMIT;
        const basePityChance = FIXED_PITY_SYSTEM.BASE_PITY_CHANCE;
        const maxPityChance = FIXED_PITY_SYSTEM.MAX_PITY_CHANCE;
        const scalingPower = FIXED_PITY_SYSTEM.SCALING_POWER;
        
        // Exponential scaling that starts VERY slow and ramps up dramatically near the end
        const pityProgress = Math.min(pityCount / maxPity, 1.0);
        const exponentialProgress = Math.pow(pityProgress, scalingPower);
        const pityChance = basePityChance + (maxPityChance - basePityChance) * exponentialProgress;
        
        return Math.min(pityChance, 100.0);
    }

    /**
     * Select rarity using premium rates (when pity procs) - ONLY mythical/divine
     */
    selectPremiumRarity() {
        const rates = FIXED_PITY_SYSTEM.PREMIUM_RATES;
        const random = Math.random() * 100;
        
        let cumulative = 0;
        for (const [rarity, rate] of Object.entries(rates)) {
            cumulative += rate;
            if (random <= cumulative) {
                return rarity;
            }
        }
        
        return 'mythical'; // Fallback
    }

    /**
     * Select rarity using normal rates
     */
    selectNormalRarity() {
        const rates = BASE_PULL_RATES;
        const totalWeight = Object.values(rates).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        const rarities = ['divine', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        
        for (const rarity of rarities) {
            random -= rates[rarity] || 0;
            if (random <= 0) {
                return rarity;
            }
        }
        
        return 'common'; // Fallback
    }

    /**
     * Get current pity count for user
     */
    async getPityCount(userId) {
        try {
            const result = await DatabaseManager.query(
                'SELECT pity_count FROM users WHERE user_id = $1',
                [userId]
            );
            
            return result.rows[0]?.pity_count || 0;
        } catch (error) {
            this.logger.error(`Failed to get pity count for user ${userId}:`, error);
            return 0;
        }
    }

    /**
     * Save pity count for user
     */
    async savePityCount(userId, pityCount) {
        try {
            await DatabaseManager.query(
                'UPDATE users SET pity_count = $2, updated_at = NOW() WHERE user_id = $1',
                [userId, pityCount]
            );
        } catch (error) {
            this.logger.error(`Failed to save pity count for user ${userId}:`, error);
        }
    }

    /**
     * Get pity information for display
     */
    async getPityInfo(userId) {
        try {
            const pityCount = await this.getPityCount(userId);
            const pityProcChance = this.calculateFixedPityProcChance(pityCount);
            const pullsToHardPity = Math.max(0, FIXED_PITY_SYSTEM.HARD_PITY_LIMIT - pityCount);
            
            return {
                currentPity: pityCount,
                pityProcChance: pityProcChance,
                pullsToHardPity: pullsToHardPity,
                isAtHardPity: pityCount >= FIXED_PITY_SYSTEM.HARD_PITY_LIMIT,
                nextMilestone: this.getNextPityMilestone(pityCount)
            };
        } catch (error) {
            this.logger.error(`Failed to get pity info for user ${userId}:`, error);
            return {
                currentPity: 0,
                pityProcChance: 0,
                pullsToHardPity: FIXED_PITY_SYSTEM.HARD_PITY_LIMIT,
                isAtHardPity: false,
                nextMilestone: '1000 pulls for progress'
            };
        }
    }

    /**
     * Get next pity milestone description - Updated for 1500 limit
     */
    getNextPityMilestone(pityCount) {
        const milestones = [
            { pulls: 300, description: 'Starting the journey' },
            { pulls: 600, description: 'Building momentum' },
            { pulls: 900, description: 'Getting warmer' },
            { pulls: 1100, description: 'Approaching power' },
            { pulls: 1250, description: 'Very close now' },
            { pulls: 1350, description: 'Almost guaranteed' },
            { pulls: 1450, description: 'Nearly there' },
            { pulls: 1500, description: 'Guaranteed mythical/divine!' }
        ];
        
        for (const milestone of milestones) {
            if (pityCount < milestone.pulls) {
                const pullsNeeded = milestone.pulls - pityCount;
                return `${pullsNeeded} pulls - ${milestone.description}`;
            }
        }
        
        return 'Maximum pity reached!';
    }

    /**
     * Format pity display text for embeds - Updated
     */
    formatPityDisplay(pityInfo, pityUsedInSession = false) {
        const { currentPity, isAtHardPity } = pityInfo;
        
        // Simple pity display - just the count
        let pityText = `🎯 **Pity:** ${currentPity}/1500 (Mythical/Divine only)`;
        
        if (isAtHardPity) {
            pityText += ' 🔥 **GUARANTEED!**';
        }
        
        if (pityUsedInSession) {
            pityText += '\n✨ **PITY ACTIVATED THIS SESSION!**';
        }
        
        return pityText;
    }

    /**
     * Update user pull statistics
     */
    async updatePullStatistics(userId, results) {
        try {
            const stats = {
                totalPulls: results.length,
                newFruits: results.filter(r => r.isNew).length,
                legendaryPulls: results.filter(r => r.rarity === 'legendary').length,
                mythicalPulls: results.filter(r => r.rarity === 'mythical').length,
                divinePulls: results.filter(r => r.rarity === 'divine').length,
                pityUsed: results.some(r => r.pityUsed) ? 1 : 0,
                onePiecePulls: results.filter(r => r.fruit?.fruit_id === 'one_piece_treasure' || r.fruit?.fruit_name === 'One Piece').length
            };

            // Try to insert/update pull statistics
            await DatabaseManager.query(`
                INSERT INTO user_statistics (user_id, stat_type, value, updated_at)
                VALUES 
                    ($1, 'total_pulls', $2, NOW()),
                    ($1, 'new_fruits', $3, NOW()),
                    ($1, 'legendary_pulls', $4, NOW()),
                    ($1, 'mythical_pulls', $5, NOW()),
                    ($1, 'divine_pulls', $6, NOW()),
                    ($1, 'pity_used', $7, NOW()),
                    ($1, 'one_piece_pulls', $8, NOW())
                ON CONFLICT (user_id, stat_type) 
                DO UPDATE SET 
                    value = user_statistics.value + EXCLUDED.value,
                    updated_at = NOW()
            `, [userId, stats.totalPulls, stats.newFruits, stats.legendaryPulls, stats.mythicalPulls, stats.divinePulls, stats.pityUsed, stats.onePiecePulls]);
            
            // Special logging for One Piece pulls
            if (stats.onePiecePulls > 0) {
                this.logger.warn(`🏆 ONE PIECE PULLED by ${userId}! Total One Piece pulls by this user: ${stats.onePiecePulls}`);
            }
            
        } catch (error) {
            // Statistics table might not exist yet, that's okay
            this.logger.debug('Could not update statistics:', error.message);
        }
    }

    /**
     * Get user's pull statistics with enhanced data
     */
    async getUserStats(userId) {
        try {
            const result = await DatabaseManager.query(`
                SELECT stat_type, value 
                FROM user_statistics 
                WHERE user_id = $1
            `, [userId]);

            const stats = {};
            result.rows.forEach(row => {
                stats[row.stat_type] = parseInt(row.value);
            });

            const pityInfo = await this.getPityInfo(userId);

            return {
                totalPulls: stats.total_pulls || 0,
                newFruits: stats.new_fruits || 0,
                legendaryPulls: stats.legendary_pulls || 0,
                mythicalPulls: stats.mythical_pulls || 0,
                divinePulls: stats.divine_pulls || 0,
                onePiecePulls: stats.one_piece_pulls || 0,
                pityUsed: stats.pity_used || 0,
                currentPity: pityInfo.currentPity,
                pityProcChance: pityInfo.pityProcChance,
                nextMilestone: pityInfo.nextMilestone
            };
        } catch (error) {
            this.logger.debug('Could not get user stats:', error.message);
            const pityInfo = await this.getPityInfo(userId);
            return {
                totalPulls: 0,
                newFruits: 0,
                legendaryPulls: 0,
                mythicalPulls: 0,
                divinePulls: 0,
                onePiecePulls: 0,
                pityUsed: 0,
                currentPity: pityInfo.currentPity,
                pityProcChance: pityInfo.pityProcChance,
                nextMilestone: pityInfo.nextMilestone
            };
        }
    }

    /**
     * Simulate pulls for testing and rate verification
     */
    async simulatePulls(count, pityStart = 0) {
        const results = {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            legendary: 0,
            mythical: 0,
            divine: 0,
            pityProcs: 0,
            onePiecePulls: 0
        };

        let pityCount = pityStart;

        for (let i = 0; i < count; i++) {
            const pityProcChance = this.calculateFixedPityProcChance(pityCount);
            const pityProcs = Math.random() * 100 < pityProcChance;
            
            let rarity;
            if (pityProcs) {
                rarity = this.selectPremiumRarity();
                results.pityProcs++;
            } else {
                rarity = this.selectNormalRarity();
            }
            
            results[rarity]++;

            // Special tracking for divine fruits
            if (rarity === 'divine') {
                const fruitsOfRarity = getFruitsByRarity('divine');
                const selectedFruit = selectWeightedDivineFruit(fruitsOfRarity);
                if (selectedFruit.id === 'one_piece_treasure') {
                    results.onePiecePulls++;
                }
            }

            // Reset pity only for mythical/divine
            if (FIXED_PITY_SYSTEM.RESET_RARITIES.includes(rarity)) {
                pityCount = 0;
            } else {
                pityCount++;
            }
        }

        // Calculate percentages
        const percentages = {};
        Object.keys(results).forEach(key => {
            if (key !== 'pityProcs' && key !== 'onePiecePulls') {
                percentages[key] = ((results[key] / count) * 100).toFixed(4) + '%';
            }
        });

        return {
            counts: results,
            percentages,
            totalPulls: count,
            finalPity: pityCount,
            pityProcRate: ((results.pityProcs / count) * 100).toFixed(4) + '%',
            onePieceRate: ((results.onePiecePulls / count) * 100).toFixed(6) + '%'
        };
    }

    /**
     * Get pull probability info for display
     */
    async getPullRates(userId) {
        const pityInfo = await this.getPityInfo(userId);
        const { pityProcChance } = pityInfo;
        
        // Calculate effective rates (normal rates + pity contribution)
        const normalRates = { ...BASE_PULL_RATES };
        const premiumRates = FIXED_PITY_SYSTEM.PREMIUM_RATES;
        
        const effectiveRates = {};
        
        // For mythical, divine - add pity contribution
        for (const rarity of ['mythical', 'divine']) {
            const normalRate = normalRates[rarity] || 0;
            const premiumRate = premiumRates[rarity] || 0;
            const pityContribution = (pityProcChance / 100) * premiumRate;
            const normalContribution = (1 - pityProcChance / 100) * normalRate;
            
            effectiveRates[rarity] = (normalContribution + pityContribution).toFixed(4) + '%';
        }
        
        // Other rarities use normal rates (no pity boost)
        for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
            effectiveRates[rarity] = normalRates[rarity] + '%';
        }

        return {
            normalRates: Object.fromEntries(
                Object.entries(normalRates).map(([k, v]) => [k, v + '%'])
            ),
            effectiveRates,
            pityInfo,
            pityActive: pityProcChance > 0,
            pityAffects: 'Only Mythical & Divine'
        };
    }

    /**
     * Reset user's pity count (admin function)
     */
    async resetPity(userId) {
        try {
            await this.savePityCount(userId, 0);
            this.logger.info(`Reset pity count for user ${userId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to reset pity for user ${userId}:`, error);
            return false;
        }
    }

    /**
     * Set custom pity count (admin function)
     */
    async setPityCount(userId, pityCount) {
        try {
            const clampedPity = Math.max(0, Math.min(pityCount, FIXED_PITY_SYSTEM.HARD_PITY_LIMIT));
            await this.savePityCount(userId, clampedPity);
            this.logger.info(`Set pity count for user ${userId} to ${clampedPity}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to set pity for user ${userId}:`, error);
            return false;
        }
    }

    /**
     * Get global One Piece statistics
     */
    async getOnePieceStats() {
        try {
            const result = await DatabaseManager.query(`
                SELECT 
                    COUNT(*) as total_one_piece_pulls,
                    COUNT(DISTINCT user_id) as unique_holders
                FROM user_devil_fruits 
                WHERE fruit_id = 'one_piece_treasure' OR fruit_name = 'One Piece'
            `);
            
            const stats = result.rows[0];
            
            return {
                totalOnePiecePulls: parseInt(stats.total_one_piece_pulls || 0),
                uniqueHolders: parseInt(stats.unique_holders || 0)
            };
        } catch (error) {
            this.logger.error('Failed to get One Piece stats:', error);
            return { totalOnePiecePulls: 0, uniqueHolders: 0 };
        }
    }
}

module.exports = new GachaService();
