/**
     * Connect to PostgreSQL database with retry logic
     */
    async connect() {
        while (this.connectionAttempts < this.maxRetries) {
            try {
                this.connectionAttempts++;
                this.logger.info(`🔄 Attempting database connection (${this.connectionAttempts}/${this.maxRetries})...`);

                const config = Config.database;
                
                this.pool = new Pool({
                    connectionString: config.url,
                    ssl: config.ssl ? { rejectUnauthorized: false } : false,
                    ...config.pool,
                    // Additional Railway-specific settings
                    keepAlive: true,
                    keepAliveInitialDelayMillis: 10000,
                    statement_timeout: 30000,
                    query_timeout: 30000,
                    connectionTimeoutMillis: 15000, // Increased for Railway
                    // Railway-specific connection options
                    connect_timeout: 60,
                    application_name: 'OneGachaBot_V4',
                    // Add connection retry settings
                    max: 10, // Reduced max connections for Railway free tier
                    idleTimeoutMillis: 30000,
                    acquireTimeoutMillis: 60000
                });

                // Test connection with timeout
                const testPromise = new Promise(async (resolve, reject) => {
                    try {
                        const client = await this.pool.connect();
                        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
                        client.release();
                        
                        this.logger.info('📊 Database info:', {
                            time: result.rows[0].current_time,
                            version: result.rows[0].pg_version.split(' ')[0]
                        });
                        
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });

                // Add timeout to connection test
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000);
                });

                await Promise.race([testPromise, timeoutPromise]);

                this.isConnected = true;
                this.setupEventHandlers();
                
                this.logger.success(`✅ Database connected successfully (attempt ${this.connectionAttempts})`);
                return;

            } catch (error) {
                this.logger.error(`❌ Database connection failed (attempt ${this.connectionAttempts}):`, {
                    message: error.message,
                    code: error.code,
                    host: error.host || 'unknown',
                    port: error.port || 'unknown'
                });
                
                if (this.connectionAttempts >= this.maxRetries) {
                    throw new Error(`Failed to connect to database after ${this.maxRetries} attempts: ${error.message}`);
                }
                
                // Exponential backoff with Railway-specific delays
                const delay = Math.min(2000 * Math.pow(2, this.connectionAttempts - 1), 15000);
                this.logger.info(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
