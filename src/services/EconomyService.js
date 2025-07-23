// src/services/EconomyService.js - Professional Economy Service
const DatabaseManager = require('../database/DatabaseManager');
const Logger = require('../utils/Logger');
const Config = require('../config/Config');

class EconomyService {
    constructor() {
        this.logger = new Logger('ECONOMY');
        this.incomeCache = new Map(); // Cache for manual income cooldowns
    }

    /**
     * Get user's current berry balance
     */
    async getBalance(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            return user?.berries || 0;
        } catch (error) {
            this.logger.error(`Failed to get balance for ${userId}:`, error);
            return 0;
        }
    }

    /**
     * Add berries to user account
     */
    async addBerries(userId, amount, reason = 'unknown') {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        try {
            const newBalance = await DatabaseManager.updateUserBerries(userId, amount, reason);
            this.logger.debug(`Added ${amount} berries to ${userId} (${reason}). New balance: ${newBalance}`);
            return newBalance;
        } catch (error) {
            this.logger.error(`Failed to add berries to ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Deduct berries from user account
     */
    async deductBerries(userId, amount, reason = 'unknown') {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        const currentBalance = await this.getBalance(userId);
        if (currentBalance < amount) {
            throw new Error('Insufficient berries');
        }

        try {
            const newBalance = await DatabaseManager.updateUserBerries(userId, -amount, reason);
            this.logger.debug(`Deducted ${amount} berries from ${userId} (${reason}). New balance: ${newBalance}`);
            return newBalance;
        } catch (error) {
            this.logger.error(`Failed to deduct berries from ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Calculate income based on user's CP
     */
    async calculateIncome(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            const totalCP = user?.total_cp || 100;
            
            const gameConfig = Config.game;
            const baseIncome = gameConfig.baseIncome;
            const incomeRate = gameConfig.incomeRate;
            
            // Base income + CP-based bonus
            const cpBonus = Math.floor(totalCP * incomeRate);
            const totalIncome = baseIncome + cpBonus;

            return {
                base: baseIncome,
                cpBonus,
                total: totalIncome,
                totalCP
            };
        } catch (error) {
            this.logger.error(`Failed to calculate income for ${userId}:`, error);
            return {
                base: 50,
                cpBonus: 10,
                total: 60,
                totalCP: 100
            };
        }
    }

    /**
     * Process automatic income (accumulated over time)
     */
    async processAutomaticIncome(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            if (!user) return null;

            const lastIncome = new Date(user.last_income);
            const now = new Date();
            const hoursSinceLastIncome = (now - lastIncome) / (1000 * 60 * 60);

            // Minimum interval is 10 minutes
            if (hoursSinceLastIncome < (1 / 6)) {
                return null;
            }

            const maxHours = Config.game.maxStoredHours || 24;
            const effectiveHours = Math.min(hoursSinceLastIncome, maxHours);
            const periods = Math.floor(effectiveHours * 6); // 6 periods per hour (10 min each)

            const incomeData = await this.calculateIncome(userId);
            const totalIncome = incomeData.total * periods;

            if (totalIncome > 0) {
                await this.addBerries(userId, totalIncome, 'automatic_income');
                await DatabaseManager.recordIncome(userId, totalIncome, user.total_cp, 'automatic');
            }

            return {
                periods,
                perPeriod: incomeData.total,
                total: totalIncome,
                hoursAccumulated: effectiveHours
            };
        } catch (error) {
            this.logger.error(`Failed to process automatic income for ${userId}:`, error);
            return null;
        }
    }

    /**
     * Process manual income (with cooldown)
     */
    async processManualIncome(userId) {
        const lastManual = this.incomeCache.get(userId);
        const now = Date.now();
        const cooldown = (Config.game.manualIncomeCooldown || 60) * 1000;

        if (lastManual && (now - lastManual) < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastManual)) / 1000);
            return { success: false, cooldown: remaining };
        }

        try {
            const incomeData = await this.calculateIncome(userId);
            const multiplier = Config.game.manualIncomeMultiplier || 6;
            const manualIncome = Math.floor(incomeData.total * multiplier);

            await this.addBerries(userId, manualIncome, 'manual_income');
            await DatabaseManager.recordIncome(userId, manualIncome, incomeData.totalCP, 'manual');

            this.incomeCache.set(userId, now);

            return {
                success: true,
                income: manualIncome,
                multiplier,
                baseIncome: incomeData.total
            };
        } catch (error) {
            this.logger.error(`Failed to process manual income for ${userId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Transfer berries between users
     */
    async transferBerries(fromUserId, toUserId, amount, reason = 'transfer') {
        if (fromUserId === toUserId) {
            throw new Error('Cannot transfer to yourself');
        }

        try {
            await this.deductBerries(fromUserId, amount, `transfer_to_${toUserId}`);
            await this.addBerries(toUserId, amount, `transfer_from_${fromUserId}`);

            this.logger.info(`Transfer: ${amount} berries from ${fromUserId} to ${toUserId} (${reason})`);
            return true;
        } catch (error) {
            this.logger.error('Transfer failed:', error);
            throw error;
        }
    }

    /**
     * Get top berry balances
     */
    async getTopBalances(limit = 10) {
        try {
            const result = await DatabaseManager.query(`
                SELECT user_id, username, berries, total_earned, total_spent
                FROM users
                ORDER BY berries DESC
                LIMIT $1
            `, [limit]);

            return result.rows;
        } catch (error) {
            this.logger.error('Failed to get top balances:', error);
            return [];
        }
    }

    /**
     * Get economy statistics
     */
    async getEconomyStats() {
        try {
            const result = await DatabaseManager.query(`
                SELECT 
                    COUNT(*) as total_users,
                    SUM(berries) as total_berries,
                    AVG(berries) as avg_berries,
                    MAX(berries) as max_berries,
                    SUM(total_earned) as total_earned,
                    SUM(total_spent) as total_spent
                FROM users
            `);

            const stats = result.rows[0];
            return {
                totalUsers: parseInt(stats.total_users),
                totalBerries: parseInt(stats.total_berries) || 0,
                avgBerries: Math.floor(parseFloat(stats.avg_berries)) || 0,
                maxBerries: parseInt(stats.max_berries) || 0,
                totalEarned: parseInt(stats.total_earned) || 0,
                totalSpent: parseInt(stats.total_spent) || 0
            };
        } catch (error) {
            this.logger.error('Failed to get economy stats:', error);
            return {
                totalUsers: 0,
                totalBerries: 0,
                avgBerries: 0,
                maxBerries: 0,
                totalEarned: 0,
                totalSpent: 0
            };
        }
    }

    /**
     * Check if user can afford amount
     */
    async canAfford(userId, amount) {
        const balance = await this.getBalance(userId);
        return balance >= amount;
    }

    /**
     * Get manual income cooldown remaining
     */
    getManualIncomeCooldown(userId) {
        const lastManual = this.incomeCache.get(userId);
        if (!lastManual) return 0;

        const now = Date.now();
        const cooldown = (Config.game.manualIncomeCooldown || 60) * 1000;
        const remaining = Math.max(0, cooldown - (now - lastManual));

        return Math.ceil(remaining / 1000);
    }

    /**
     * Format berry amount for display
     */
    formatBerries(amount) {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`;
        }
        return amount.toLocaleString();
    }
}

module.exports = new EconomyService();
