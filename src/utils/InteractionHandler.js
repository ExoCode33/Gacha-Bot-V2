// src/utils/InteractionHandler.js - Safe Interaction Management System
const Logger = require('./Logger');

class InteractionHandler {
    constructor() {
        this.logger = new Logger('INTERACTION_HANDLER');
        this.processedInteractions = new Set();
        this.interactionTimeouts = new Map();
        
        // Cleanup old interactions every 5 minutes
        setInterval(() => this.cleanup(), 300000);
    }

    /**
     * Check if interaction is still valid and not expired
     */
    isInteractionValid(interaction) {
        if (!interaction) return false;
        
        // Check if interaction is too old (15 minutes = Discord's limit)
        const interactionAge = Date.now() - interaction.createdTimestamp;
        if (interactionAge > 900000) { // 15 minutes
            this.logger.debug('Interaction expired due to age', {
                id: interaction.id,
                age: interactionAge
            });
            return false;
        }
        
        // Check if already processed
        if (this.processedInteractions.has(interaction.id)) {
            this.logger.debug('Interaction already processed', {
                id: interaction.id
            });
            return false;
        }
        
        return true;
    }

    /**
     * Safely reply to an interaction with fallback handling
     */
    async safeReply(interaction, options) {
        try {
            if (!this.isInteractionValid(interaction)) {
                this.logger.debug('Skipping reply to invalid interaction');
                return false;
            }

            // Mark as processed
            this.processedInteractions.add(interaction.id);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(options);
            } else {
                await interaction.reply(options);
            }

            return true;

        } catch (error) {
            this.logger.error('Safe reply failed:', {
                error: error.message,
                code: error.code,
                interactionId: interaction.id
            });

            // Try followUp as fallback if reply failed
            if (error.code === 40060 && !interaction.replied) {
                try {
                    await interaction.followUp(options);
                    return true;
                } catch (followUpError) {
                    this.logger.error('Followup also failed:', followUpError.message);
                }
            }

            return false;
        }
    }

    /**
     * Safely defer an interaction
     */
    async safeDefer(interaction, options = {}) {
        try {
            if (!this.isInteractionValid(interaction)) {
                this.logger.debug('Skipping defer of invalid interaction');
                return false;
            }

            if (interaction.deferred || interaction.replied) {
                this.logger.debug('Interaction already deferred or replied');
                return true;
            }

            // Mark as processed
            this.processedInteractions.add(interaction.id);

            await interaction.deferReply(options);
            return true;

        } catch (error) {
            this.logger.error('Safe defer failed:', {
                error: error.message,
                code: error.code,
                interactionId: interaction.id
            });
            return false;
        }
    }

    /**
     * Safely update an interaction
     */
    async safeUpdate(interaction, options) {
        try {
            if (!this.isInteractionValid(interaction)) {
                this.logger.debug('Skipping update of invalid interaction');
                return false;
            }

            await interaction.update(options);
            return true;

        } catch (error) {
            this.logger.error('Safe update failed:', {
                error: error.message,
                code: error.code,
                interactionId: interaction.id
            });

            // Try editReply as fallback
            try {
                await interaction.editReply(options);
                return true;
            } catch (editError) {
                this.logger.error('Edit reply fallback failed:', editError.message);
            }

            return false;
        }
    }

    /**
     * Create a safe message component collector
     */
    createSafeCollector(channel, options = {}) {
        try {
            // Set default timeout if not provided
            if (!options.time) {
                options.time = 300000; // 5 minutes default
            }

            const collector = channel.createMessageComponentCollector(options);

            // Store collector for cleanup
            const collectorId = Date.now().toString() + Math.random().toString(36);
            this.interactionTimeouts.set(collectorId, {
                collector,
                createdAt: Date.now()
            });

            // Auto-cleanup when collector ends
            collector.on('end', () => {
                this.interactionTimeouts.delete(collectorId);
            });

            return collector;

        } catch (error) {
            this.logger.error('Failed to create safe collector:', error);
            throw error;
        }
    }

    /**
     * Handle component interaction safely
     */
    async handleComponentInteraction(interaction, handler) {
        try {
            if (!this.isInteractionValid(interaction)) {
                this.logger.debug('Ignoring invalid component interaction');
                return false;
            }

            await handler(interaction);
            return true;

        } catch (error) {
            this.logger.error('Component interaction handler failed:', {
                error: error.message,
                customId: interaction.customId,
                interactionId: interaction.id
            });

            // Try to send error response
            try {
                const errorMessage = {
                    content: '❌ An error occurred processing your action. Please try again.',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            } catch (replyError) {
                this.logger.error('Failed to send error response:', replyError.message);
            }

            return false;
        }
    }

    /**
     * Create safe interaction context
     */
    createContext(interaction) {
        return {
            interaction,
            isValid: () => this.isInteractionValid(interaction),
            safeReply: (options) => this.safeReply(interaction, options),
            safeDefer: (options) => this.safeDefer(interaction, options),
            safeUpdate: (options) => this.safeUpdate(interaction, options)
        };
    }

    /**
     * Cleanup old processed interactions and timeouts
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 1800000; // 30 minutes

        // Clean processed interactions
        const oldInteractions = [];
        this.processedInteractions.forEach(id => {
            // Remove old interaction IDs (Discord snowflakes contain timestamps)
            try {
                const timestamp = (BigInt(id) >> 22n) + 1420070400000n;
                if (now - Number(timestamp) > maxAge) {
                    oldInteractions.push(id);
                }
            } catch (error) {
                // If we can't parse the timestamp, remove it anyway
                oldInteractions.push(id);
            }
        });

        oldInteractions.forEach(id => this.processedInteractions.delete(id));

        // Clean interaction timeouts
        const oldTimeouts = [];
        this.interactionTimeouts.forEach((data, id) => {
            if (now - data.createdAt > maxAge) {
                oldTimeouts.push(id);
                try {
                    data.collector.stop('cleanup');
                } catch (error) {
                    // Ignore errors when stopping collectors
                }
            }
        });

        oldTimeouts.forEach(id => this.interactionTimeouts.delete(id));

        if (oldInteractions.length > 0 || oldTimeouts.length > 0) {
            this.logger.debug(`Cleaned up ${oldInteractions.length} old interactions and ${oldTimeouts.length} old timeouts`);
        }
    }

    /**
     * Force cleanup specific interaction
     */
    forceCleanup(interactionId) {
        this.processedInteractions.delete(interactionId);
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            processedInteractions: this.processedInteractions.size,
            activeTimeouts: this.interactionTimeouts.size
        };
    }
}

module.exports = new InteractionHandler();
