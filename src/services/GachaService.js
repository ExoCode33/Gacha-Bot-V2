// src/services/GachaService.js - Enhanced Gacha Service with PvP Integration
const DatabaseManager = require('../database/DatabaseManager');
const { DEVIL_FRUITS, getRarityWeights, getFruitsByRarity } = require('../data/DevilFruits');
const { RARITY_COLORS, PITY_SYSTEM, BASE_PULL_RATES } = require('../data/Constants');
const Logger = require('../utils/Logger');

class GachaService {
    constructor() {
        this.logger = new Logger('GACHA_SERVICE');
        this.pitySystem = new Map(); // Store pity counts for users
        this.pullStatistics = new Map(); // Track user pull statistics
    }

    /**
     * Perform multiple pulls for a user with enhanced mechanics
     */
    async performPulls(userId, count) {
        const results = [];
        
        try {
            // Get user's current pity count
            let pityCount = await this.getPityCount(userId);
            
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
                    pityCount: pityCount
                });
                
                // Update pity count
                if (pullResult.fruit.rarity === 'legendary' || 
                    pullResult.fruit.rarity === 'mythical' || 
                    pullResult.fruit.rarity === 'divine') {
                    pityCount = 0; // Reset pity on rare pulls
                } else {
                    pityCount++;
                }
            }
            
            // Save updated pity count
            await this.savePityCount(userId, pityCount);
            
            // Update pull statistics
            await this.updatePullStatistics(userId, results);
            
            this.logger.info(`User ${userId} completed ${count} pulls, new pity: ${pityCount}`);
            return results;
            
        } catch (error) {
            this.logger.error(`Error performing pulls for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Pull a single devil fruit with enhanced rarity system
     */
    async pullSingleFruit(userId, pityCount) {
        try {
            // Get weighted rarity rates based on pity
            const weights = this.calculateWeights(pityCount);
            
            // Select rarity based on weights
            const selectedRarity = this.selectRarity(weights);
            
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
            
            // Check if this was a pity pull
            const isPityPull = pityCount >= PITY_SYSTEM.SOFT_PITY_START;
            
            this.logger.debug(`User ${userId} pulled ${selectedFruit.name} (${selectedRarity}) - Pity: ${pityCount}`);
            
            return { 
                fruit: selectedFruit, 
                pityUsed: isPityPull,
                pityCount: pityCount
            };
            
        } catch (error) {
            this.logger.error(`Error pulling single fruit for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Calculate weights based on pity system
     */
    calculateWeights(pityCount) {
        let weights = { ...BASE_PULL_RATES };
        
        // Divine fruit guarantee at 500 pulls
        if (pityCount >= PITY_SYSTEM.GUARANTEED_DIVINE) {
            return {
                common: 0,
                uncommon: 0,
                rare: 0,
                epic: 0,
                legendary: 0,
                mythical: 0,
                divine: 100
            };
        }
        
        // Mythical guarantee at 150 pulls
        if (pityCount >= PITY_SYSTEM.GUARANTEED_MYTHICAL) {
            return {
                common: 0,
                uncommon: 0,
                rare: 0,
                epic: 0,
                legendary: 30,
                mythical: 60,
                divine: 10
            };
        }
        
        // Legendary guarantee at 90 pulls
        if (pityCount >= PITY_SYSTEM.GUARANTEED_LEGENDARY) {
            return {
                common: 0,
                uncommon: 0,
                rare: 0,
                epic: 20,
                legendary: 60,
                mythical: 18,
                divine: 2
            };
        }
        
        // Hard pity at 75 pulls
        if (pityCount >= PITY_SYSTEM.HARD_PITY_START) {
            const pityMultiplier = 1 + ((pityCount - PITY_SYSTEM.HARD_PITY_START) * 0.05);
            return {
                common: Math.max(10, weights.common - (pityCount - 75) * 2),
                uncommon: Math.max(10, weights.uncommon - (pityCount - 75) * 1.5),
                rare: weights.rare * 1.2,
                epic: weights.epic * 1.8,
                legendary: weights.legendary * pityMultiplier * 2,
                mythical: weights.mythical * pityMultiplier * 3,
                divine: weights.divine * pityMultiplier * 4
            };
        }
        
        // Soft pity at 50 pulls
        if (pityCount >= PITY_SYSTEM.SOFT_PITY_START) {
            const softPityMultiplier = 1 + ((pityCount - PITY_SYSTEM.SOFT_PITY_START) * 0.02);
            return {
                common: Math.max(20, weights.common - (pityCount - 50) * 0.8),
                uncommon: Math.max(15, weights.uncommon - (pityCount - 50) * 0.5),
                rare: weights.rare * 1.1,
                epic: weights.epic * 1.3,
                legendary: weights.legendary * softPityMultiplier,
                mythical: weights.mythical * softPityMultiplier * 1.5,
                divine: weights.divine * softPityMultiplier * 2
            };
        }
        
        return weights;
    }

    /**
     * Select rarity based on weighted probabilities
     */
    selectRarity(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        const rarities = ['divine', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        
        for (const rarity of rarities) {
            random -= weights[rarity] || 0;
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
     * Update user pull statistics
     */
    async updatePullStatistics(userId, results) {
        try {
            const stats = {
                totalPulls: results.length,
                newFruits: results.filter(r => r.isNew).length,
                legendaryPulls: results.filter(r => r.rarity === 'legendary').length,
                mythicalPulls: results.filter(r => r.rarity === 'mythical').length,
                divinePulls: results.filter(r => r.rarity === 'divine').length
            };

            // Try to insert/update pull statistics
            await DatabaseManager.query(`
                INSERT INTO user_statistics (user_id, stat_type, value, updated_at)
                VALUES 
                    ($1, 'total_pulls', $2, NOW()),
                    ($1, 'new_fruits', $3, NOW()),
                    ($1, 'legendary_pulls', $4, NOW()),
                    ($1, 'mythical_pulls', $5, NOW()),
                    ($1, 'divine_pulls', $6, NOW())
                ON CONFLICT (user_id, stat_type) 
                DO UPDATE SET 
                    value = user_statistics.value + EXCLUDED.value,
                    updated_at = NOW()
            `, [userId, stats.totalPulls, stats.newFruits, stats.legendaryPulls, stats.mythicalPulls, stats.divinePulls]);
            
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

            const pityCount = await this.getPityCount(userId);

            return {
                totalPulls: stats.total_pulls || 0,
                newFruits: stats.new_fruits || 0,
                legendaryPulls: stats.legendary_pulls || 0,
                mythicalPulls: stats.mythical_pulls || 0,
                divinePulls: stats.divine_pulls || 0,
                currentPity: pityCount,
                nextGuarantee: this.getNextGuarantee(pityCount)
            };
        } catch (error) {
            this.logger.debug('Could not get user stats:', error.message);
            return {
                totalPulls: 0,
                newFruits: 0,
                legendaryPulls: 0,
                mythicalPulls: 0,
                divinePulls: 0,
                currentPity: 0,
                nextGuarantee: 'Legendary at 90 pulls'
            };
        }
    }

    /**
     * Get next guarantee info based on pity count
     */
    getNextGuarantee(pityCount) {
        if (pityCount >= PITY_SYSTEM.GUARANTEED_DIVINE) {
            return 'Divine fruit guaranteed!';
        } else if (pityCount >= PITY_SYSTEM.GUARANTEED_MYTHICAL) {
            return `Divine in ${PITY_SYSTEM.GUARANTEED_DIVINE - pityCount} pulls`;
        } else if (pityCount >= PITY_SYSTEM.GUARANTEED_LEGENDARY) {
            return `Mythical in ${PITY_SYSTEM.GUARANTEED_MYTHICAL - pityCount} pulls`;
        } else if (pityCount >= PITY_SYSTEM.HARD_PITY_START) {
            return `Legendary in ${PITY_SYSTEM.GUARANTEED_LEGENDARY - pityCount} pulls`;
        } else if (pityCount >= PITY_SYSTEM.SOFT_PITY_START) {
            return `Hard pity in ${PITY_SYSTEM.HARD_PITY_START - pityCount} pulls`;
        } else {
            return `Soft pity in ${PITY_SYSTEM.SOFT_PITY_START - pityCount} pulls`;
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
            divine: 0
        };

        let pityCount = pityStart;

        for (let i = 0; i < count; i++) {
            const weights = this.calculateWeights(pityCount);
            const rarity = this.selectRarity(weights);
            results[rarity]++;

            if (['legendary', 'mythical', 'divine'].includes(rarity)) {
                pityCount = 0;
            } else {
                pityCount++;
            }
        }

        // Calculate percentages
        const percentages = {};
        Object.keys(results).forEach(rarity => {
            percentages[rarity] = ((results[rarity] / count) * 100).toFixed(2) + '%';
        });

        return {
            counts: results,
            percentages,
            totalPulls: count,
            finalPity: pityCount
        };
    }

    /**
     * Get pull probability info for display
     */
    getPullRates(pityCount = 0) {
        const weights = this.calculateWeights(pityCount);
        const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
        
        const rates = {};
        for (const [rarity, weight] of Object.entries(weights)) {
            rates[rarity] = ((weight / total) * 100).toFixed(3) + '%';
        }

        return {
            rates,
            pityCount,
            nextGuarantee: this.getNextGuarantee(pityCount),
            softPityActive: pityCount >= PITY_SYSTEM.SOFT_PITY_START,
            hardPityActive: pityCount >= PITY_SYSTEM.HARD_PITY_START
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
     * Get global gacha statistics
     */
    async getGlobalStats() {
        try {
            const result = await DatabaseManager.query(`
                SELECT 
                    fruit_rarity,
                    COUNT(*) as count,
                    COUNT(DISTINCT user_id) as unique_users
                FROM user_devil_fruits 
                GROUP BY fruit_rarity
                ORDER BY 
                    CASE fruit_rarity 
                        WHEN 'divine' THEN 7
                        WHEN 'mythical' THEN 6
                        WHEN 'legendary' THEN 5
                        WHEN 'epic' THEN 4
                        WHEN 'rare' THEN 3
                        WHEN 'uncommon' THEN 2
                        ELSE 1
                    END DESC
            `);

            const totalPulls = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
            
            const stats = {
                totalPulls,
                byRarity: {},
                usersByRarity: {}
            };

            result.rows.forEach(row => {
                const rarity = row.fruit_rarity;
                const count = parseInt(row.count);
                const users = parseInt(row.unique_users);
                
                stats.byRarity[rarity] = {
                    count,
                    percentage: ((count / totalPulls) * 100).toFixed(2) + '%'
                };
                
                stats.usersByRarity[rarity] = users;
            });

            return stats;
        } catch (error) {
            this.logger.error('Failed to get global stats:', error);
            return {
                totalPulls: 0,
                byRarity: {},
                usersByRarity: {}
            };
        }
    }

    /**
     * Get rarity distribution for a specific user
     */
    async getUserRarityDistribution(userId) {
        try {
            const result = await DatabaseManager.query(`
                SELECT 
                    fruit_rarity,
                    COUNT(*) as count
                FROM user_devil_fruits 
                WHERE user_id = $1
                GROUP BY fruit_rarity
            `, [userId]);

            const distribution = {};
            let total = 0;
            
            result.rows.forEach(row => {
                const count = parseInt(row.count);
                distribution[row.fruit_rarity] = count;
                total += count;
            });

            // Calculate percentages
            const percentages = {};
            Object.keys(distribution).forEach(rarity => {
                percentages[rarity] = total > 0 ? 
                    ((distribution[rarity] / total) * 100).toFixed(1) + '%' : '0%';
            });

            return {
                counts: distribution,
                percentages,
                total
            };
        } catch (error) {
            this.logger.error(`Failed to get rarity distribution for user ${userId}:`, error);
            return {
                counts: {},
                percentages: {},
                total: 0
            };
        }
    }
}

module.exports = new GachaService();
