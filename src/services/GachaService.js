// src/services/GachaService.js - Professional Gacha Service
const DatabaseManager = require('../database/DatabaseManager');
const { getRarityWeights, getRandomFruitByRarity } = require('../data/DevilFruits');
const Logger = require('../utils/Logger');

class GachaService {
    constructor() {
        this.logger = new Logger('GACHA_SERVICE');
        this.pitySystem = new Map(); // Store pity counts for users
    }

    /**
     * Perform multiple pulls for a user
     */
    async performPulls(userId, count) {
        const results = [];
        
        for (let i = 0; i < count; i++) {
            const fruit = await this.pullSingleFruit(userId);
            const result = await DatabaseManager.addDevilFruit(userId, fruit);
            results.push({
                fruit: result.fruit,
                isNew: result.isNewFruit,
                duplicateCount: result.duplicateCount
            });
        }

        // Update user statistics
        await this.updatePullStatistics(userId, results);
        
        this.logger.info(`User ${userId} performed ${count} pulls`);
        return results;
    }

    /**
     * Pull a single devil fruit
     */
    async pullSingleFruit(userId) {
        const pityCount = this.getPityCount(userId);
        const weights = getRarityWeights(pityCount);
        
        // Select rarity based on weights
        const rarity = this.selectRarity(weights);
        
        // Get random fruit of selected rarity
        const fruit = getRandomFruitByRarity(rarity);
        
        // Update pity counter
        if (rarity === 'legendary' || rarity === 'mythical') {
            this.resetPityCount(userId);
        } else {
            this.incrementPityCount(userId);
        }
        
        this.logger.debug(`User ${userId} pulled ${fruit.name} (${rarity}) - Pity: ${pityCount}`);
        return fruit;
    }

    /**
     * Select rarity based on weighted probabilities
     */
    selectRarity(weights) {
        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        
        for (const [rarity, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return rarity;
            }
        }
        
        return 'common'; // Fallback
    }

    /**
     * Get current pity count for user
     */
    getPityCount(userId) {
        return this.pitySystem.get(userId) || 0;
    }

    /**
     * Increment pity count
     */
    incrementPityCount(userId) {
        const current = this.getPityCount(userId);
        this.pitySystem.set(userId, current + 1);
    }

    /**
     * Reset pity count after getting rare fruit
     */
    resetPityCount(userId) {
        this.pitySystem.delete(userId);
    }

    /**
     * Update user pull statistics
     */
    async updatePullStatistics(userId, results) {
        const stats = {
            totalPulls: results.length,
            newFruits: results.filter(r => r.isNew).length,
            legendaryPulls: results.filter(r => r.fruit.fruit_rarity === 'legendary').length,
            mythicalPulls: results.filter(r => r.fruit.fruit_rarity === 'mythical').length
        };

        try {
            await DatabaseManager.query(`
                INSERT INTO user_statistics (user_id, stat_type, value, updated_at)
                VALUES 
                    ($1, 'total_pulls', $2, NOW()),
                    ($1, 'new_fruits', $3, NOW()),
                    ($1, 'legendary_pulls', $4, NOW()),
                    ($1, 'mythical_pulls', $5, NOW())
                ON CONFLICT (user_id, stat_type) 
                DO UPDATE SET 
                    value = user_statistics.value + EXCLUDED.value,
                    updated_at = NOW()
            `, [userId, stats.totalPulls, stats.newFruits, stats.legendaryPulls, stats.mythicalPulls]);
        } catch (error) {
            // Statistics table might not exist yet, that's okay
            this.logger.debug('Could not update statistics:', error.message);
        }
    }

    /**
     * Get user's pull statistics
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

            return {
                totalPulls: stats.total_pulls || 0,
                newFruits: stats.new_fruits || 0,
                legendaryPulls: stats.legendary_pulls || 0,
                mythicalPulls: stats.mythical_pulls || 0,
                currentPity: this.getPityCount(userId)
            };
        } catch (error) {
            this.logger.debug('Could not get user stats:', error.message);
            return {
                totalPulls: 0,
                newFruits: 0,
                legendaryPulls: 0,
                mythicalPulls: 0,
                currentPity: this.getPityCount(userId)
            };
        }
    }

    /**
     * Simulate pulls for testing
     */
    async simulatePulls(count, pityStart = 0) {
        const results = {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            mythical: 0,
            legendary: 0
        };

        let pityCount = pityStart;

        for (let i = 0; i < count; i++) {
            const weights = getRarityWeights(pityCount);
            const rarity = this.selectRarity(weights);
            results[rarity]++;

            if (rarity === 'legendary' || rarity === 'mythical') {
                pityCount = 0;
            } else {
                pityCount++;
            }
        }

        return results;
    }

    /**
     * Get pull probability info
     */
    getPullRates(pityCount = 0) {
        const weights = getRarityWeights(pityCount);
        const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
        
        const rates = {};
        for (const [rarity, weight] of Object.entries(weights)) {
            rates[rarity] = ((weight / total) * 100).toFixed(2) + '%';
        }

        return rates;
    }
}

module.exports = new GachaService();
