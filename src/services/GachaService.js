// src/services/GachaService.js - Enhanced Gacha Service with BALANCED Pity System
const DatabaseManager = require('../database/DatabaseManager');
const { DEVIL_FRUITS, getFruitsByRarity } = require('../data/DevilFruits');
const { RARITY_COLORS, BASE_PULL_RATES } = require('../data/Constants');
const Logger = require('../utils/Logger');

// FIXED PITY SYSTEM - Much more balanced rates
const BALANCED_PITY_SYSTEM = {
    HARD_PITY_LIMIT: 1500,     // Hard pity at 1500 pulls
    
    // Premium rates when pity procs - MUCH LOWER
    PREMIUM_RATES: {
        legendary: 85.0,        // 85% when pity procs
        mythical: 14.5,         // 14.5% when pity procs  
        divine: 0.5             // 0.5% when pity procs
    },
    
    // Pity proc chance calculation - MUCH SLOWER SCALING
    BASE_PITY_CHANCE: 0.0,      // Base chance at 0 pulls
    MAX_PITY_CHANCE: 100.0,     // 100% chance at 1500 pulls
    
    // Pity resets when you get legendary/mythical/divine
    RESET_RARITIES: ['legendary', 'mythical', 'divine'],
    
    // BALANCED scaling - much slower ramp up
    SCALING_POWER: 2.5          // Exponential scaling factor
};

class GachaService {
    constructor() {
        this.logger = new Logger('GACHA_SERVICE');
        this.pullStatistics = new Map(); // Track user pull statistics
    }

    /**
     * Perform multiple pulls for a user with BALANCED pity mechanics
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
                
                // Check if pity should reset
                if (BALANCED_PITY_SYSTEM.RESET_RARITIES.includes(pullResult.fruit.rarity)) {
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
     * Pull a single devil fruit with BALANCED pity system
     */
    async pullSingleFruit(userId, pityCount) {
        try {
            // Calculate pity proc chance with BALANCED scaling
            const pityProcChance = this.calculateBalancedPityProcChance(pityCount);
            const pityProcs = Math.random() * 100 < pityProcChance;
            
            let selectedRarity;
            let pityUsed = false;
            
            if (pityProcs) {
                // Use premium rates when pity procs
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
            
            // Select random fruit from rarity
            const selectedFruit = fruitsOfRarity[Math.floor(Math.random() * fruitsOfRarity.length)];
            
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
     * Calculate BALANCED pity proc chance - much slower scaling
     */
    calculateBalancedPityProcChance(pityCount) {
        const maxPity = BALANCED_PITY_SYSTEM.HARD_PITY_LIMIT;
        const basePityChance = BALANCED_PITY_SYSTEM.BASE_PITY_CHANCE;
        const maxPityChance = BALANCED_PITY_SYSTEM.MAX_PITY_CHANCE;
        const scalingPower = BALANCED_PITY_SYSTEM.SCALING_POWER;
        
        // Exponential scaling that starts very slow and ramps up dramatically near the end
        const pityProgress = Math.min(pityCount / maxPity, 1.0);
        const exponentialProgress = Math.pow(pityProgress, scalingPower);
        const pityChance = basePityChance + (maxPityChance - basePityChance) * exponentialProgress;
        
        return Math.min(pityChance, 100.0);
    }

    /**
     * Select rarity using premium rates (when pity procs)
     */
    selectPremiumRarity() {
        const rates = BALANCED_PITY_SYSTEM.PREMIUM_RATES;
        const random = Math.random() * 100;
        
        let cumulative = 0;
        for (const [rarity, rate] of Object.entries(rates)) {
            cumulative += rate;
            if (random <= cumulative) {
                return rarity;
            }
        }
        
        return 'legendary'; // Fallback
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
            const pityProcChance = this.calculateBalancedPityProcChance(pityCount);
            const pullsToHardPity = Math.max(0, BALANCED_PITY_SYSTEM.HARD_PITY_LIMIT - pityCount);
            
            return {
                currentPity: pityCount,
                pityProcChance: pityProcChance,
                pullsToHardPity: pullsToHardPity,
                isAtHardPity: pityCount >= BALANCED_PITY_SYSTEM.HARD_PITY_LIMIT,
                nextMilestone: this.getNextPityMilestone(pityCount)
            };
        } catch (error) {
            this.logger.error(`Failed to get pity info for user ${userId}:`, error);
            return {
                currentPity: 0,
                pityProcChance: 0,
                pullsToHardPity: BALANCED_PITY_SYSTEM.HARD_PITY_LIMIT,
                isAtHardPity: false,
                nextMilestone: '500 pulls for 1% pity chance'
            };
        }
    }

    /**
     * Get next pity milestone description - HIDE exact chances from users
     */
    getNextPityMilestone(pityCount) {
        const milestones = [
            { pulls: 500, description: 'Making progress' },
            { pulls: 750, description: 'Building up' },
            { pulls: 1000, description: 'Getting closer' },
            { pulls: 1200, description: 'Almost there' },
            { pulls: 1350, description: 'Very close' },
            { pulls: 1450, description: 'Nearly guaranteed' },
            { pulls: 1500, description: 'Guaranteed premium!' }
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
     * Format pity display text for embeds - Simple format
     */
    formatPityDisplay(pityInfo, pityUsedInSession = false) {
        const { currentPity, isAtHardPity } = pityInfo;
        
        // Simple pity display - just the count
        let pityText = `🎯 **Pity:** ${currentPity}/1500`;
        
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
                pityUsed: results.some(r => r.pityUsed) ? 1 : 0
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
                    ($1, 'pity_used', $7, NOW())
                ON CONFLICT (user_id, stat_type) 
                DO UPDATE SET 
                    value = user_statistics.value + EXCLUDED.value,
                    updated_at = NOW()
            `, [userId, stats.totalPulls, stats.newFruits, stats.legendaryPulls, stats.mythicalPulls, stats.divinePulls, stats.pityUsed]);
            
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
            pityProcs: 0
        };

        let pityCount = pityStart;

        for (let i = 0; i < count; i++) {
            const pityProcChance = this.calculateBalancedPityProcChance(pityCount);
            const pityProcs = Math.random() * 100 < pityProcChance;
            
            let rarity;
            if (pityProcs) {
                rarity = this.selectPremiumRarity();
                results.pityProcs++;
            } else {
                rarity = this.selectNormalRarity();
            }
            
            results[rarity]++;

            if (BALANCED_PITY_SYSTEM.RESET_RARITIES.includes(rarity)) {
                pityCount = 0;
            } else {
                pityCount++;
            }
        }

        // Calculate percentages
        const percentages = {};
        Object.keys(results).forEach(key => {
            if (key !== 'pityProcs') {
                percentages[key] = ((results[key] / count) * 100).toFixed(2) + '%';
            }
        });

        return {
            counts: results,
            percentages,
            totalPulls: count,
            finalPity: pityCount,
            pityProcRate: ((results.pityProcs / count) * 100).toFixed(2) + '%'
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
        const premiumRates = BALANCED_PITY_SYSTEM.PREMIUM_RATES;
        
        const effectiveRates = {};
        
        // For legendary, mythical, divine - add pity contribution
        for (const rarity of ['legendary', 'mythical', 'divine']) {
            const normalRate = normalRates[rarity] || 0;
            const premiumRate = premiumRates[rarity] || 0;
            const pityContribution = (pityProcChance / 100) * premiumRate;
            const normalContribution = (1 - pityProcChance / 100) * normalRate;
            
            effectiveRates[rarity] = (normalContribution + pityContribution).toFixed(3) + '%';
        }
        
        // Other rarities use normal rates
        for (const rarity of ['common', 'uncommon', 'rare', 'epic']) {
            effectiveRates[rarity] = normalRates[rarity] + '%';
        }

        return {
            normalRates: Object.fromEntries(
                Object.entries(normalRates).map(([k, v]) => [k, v + '%'])
            ),
            effectiveRates,
            pityInfo,
            pityActive: pityProcChance > 0
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
            const clampedPity = Math.max(0, Math.min(pityCount, BALANCED_PITY_SYSTEM.HARD_PITY_LIMIT));
            await this.savePityCount(userId, clampedPity);
            this.logger.info(`Set pity count for user ${userId} to ${clampedPity}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to set pity for user ${userId}:`, error);
            return false;
        }
    }

    // [Additional methods remain the same...]
    async getGlobalStats() { /* ... existing implementation ... */ }
    async getUserRarityDistribution(userId) { /* ... existing implementation ... */ }
    async getPityLeaderboard(limit = 10) { /* ... existing implementation ... */ }
}

module.exports = new GachaService();
