// src/utils/SystemMonitor.js - System Monitoring and Health Checks
const os = require('os');
const Logger = require('./Logger');
const Config = require('../config/Config');

class SystemMonitor {
    constructor(client) {
        this.client = client;
        this.logger = new Logger('MONITOR');
        this.interval = null;
        this.metrics = {
            messagesSent: 0,
            commandsExecuted: 0,
            errorsLogged: 0,
            startTime: Date.now()
        };
    }
    
    start() {
        if (!Config.monitoring.enabled) {
            this.logger.info('System monitoring disabled');
            return;
        }
        
        this.interval = setInterval(() => {
            this.collectMetrics();
        }, Config.monitoring.interval);
        
        this.logger.info('System monitoring started');
    }
    
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    async collectMetrics() {
        const metrics = {
            timestamp: Date.now(),
            uptime: Date.now() - this.metrics.startTime,
            
            // Discord metrics
            guilds: this.client.guilds.cache.size,
            users: this.client.users.cache.size,
            channels: this.client.channels.cache.size,
            
            // System metrics
            memory: {
                used: process.memoryUsage().heapUsed,
                total: process.memoryUsage().heapTotal,
                percent: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
            },
            cpu: {
                usage: process.cpuUsage(),
                loadAvg: os.loadavg()
            },
            
            // Bot metrics
            commandsExecuted: this.metrics.commandsExecuted,
            messagesSent: this.metrics.messagesSent,
            errorsLogged: this.metrics.errorsLogged,
            
            // Database metrics
            database: await this.getDatabaseMetrics()
        };
        
        // Check thresholds
        this.checkThresholds(metrics);
        
        // Log metrics if in debug mode
        if (Config.development.debugMode) {
            this.logger.debug('System metrics collected', metrics);
        }
        
        return metrics;
    }
    
    async getDatabaseMetrics() {
        try {
            const db = require('../database/DatabaseManager');
            return await db.getStats();
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
    
    checkThresholds(metrics) {
        const thresholds = Config.monitoring.alertThresholds;
        
        // Memory threshold
        const memoryMB = metrics.memory.used / 1024 / 1024;
        if (memoryMB > thresholds.memory) {
            this.logger.warn(`⚠️ High memory usage: ${memoryMB.toFixed(2)} MB`);
        }
        
        // CPU threshold
        const cpuPercent = os.loadavg()[0] * 100;
        if (cpuPercent > thresholds.cpu) {
            this.logger.warn(`⚠️ High CPU usage: ${cpu
