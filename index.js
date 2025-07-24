// Database Debug Test - Replace index.js temporarily
console.log('🔍 === DATABASE DEBUG TEST ===');
console.log('Time:', new Date().toISOString());

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('DATABASE_URL exists:', 'DATABASE_URL' in process.env);
console.log('DATABASE_PUBLIC_URL exists:', 'DATABASE_PUBLIC_URL' in process.env);
console.log('DATABASE_PRIVATE_URL exists:', 'DATABASE_PRIVATE_URL' in process.env);

if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL value:', process.env.DATABASE_URL);
    console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
} else {
    console.log('DATABASE_URL: NOT SET');
}

if (process.env.DATABASE_PUBLIC_URL) {
    console.log('DATABASE_PUBLIC_URL value:', process.env.DATABASE_PUBLIC_URL);
    console.log('DATABASE_PUBLIC_URL length:', process.env.DATABASE_PUBLIC_URL.length);
} else {
    console.log('DATABASE_PUBLIC_URL: NOT SET');
}

if (process.env.DATABASE_PRIVATE_URL) {
    console.log('DATABASE_PRIVATE_URL value:', process.env.DATABASE_PRIVATE_URL);
    console.log('DATABASE_PRIVATE_URL length:', process.env.DATABASE_PRIVATE_URL.length);
} else {
    console.log('DATABASE_PRIVATE_URL: NOT SET');
}

// Test which URL to use
const testUrls = [
    { name: 'DATABASE_PUBLIC_URL', url: process.env.DATABASE_PUBLIC_URL },
    { name: 'DATABASE_URL', url: process.env.DATABASE_URL },
    { name: 'DATABASE_PRIVATE_URL', url: process.env.DATABASE_PRIVATE_URL }
];

console.log('\n🧪 URL Analysis:');
testUrls.forEach(({ name, url }) => {
    if (url) {
        console.log(`\n${name}:`);
        console.log('  Full URL:', url);
        console.log('  Contains "internal":', url.includes('railway.internal'));
        console.log('  Contains "proxy":', url.includes('proxy.rlwy.net'));
        console.log('  Contains "containers":', url.includes('containers-'));
        console.log('  Starts with "postgresql":', url.startsWith('postgresql://'));
        
        // Try to parse URL
        try {
            const parsedUrl = new URL(url);
            console.log('  Host:', parsedUrl.hostname);
            console.log('  Port:', parsedUrl.port);
            console.log('  Database:', parsedUrl.pathname);
            console.log('  Username:', parsedUrl.username);
            console.log('  Has password:', !!parsedUrl.password);
        } catch (error) {
            console.log('  URL parsing failed:', error.message);
        }
    } else {
        console.log(`${name}: NOT SET`);
    }
});

// Test actual connection
const { Pool } = require('pg');

async function testConnection(name, url) {
    if (!url) {
        console.log(`\n❌ ${name}: No URL to test`);
        return;
    }
    
    console.log(`\n🔄 Testing ${name}...`);
    console.log('URL:', url.substring(0, 50) + '...');
    
    const pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        statement_timeout: 10000,
        query_timeout: 10000
    });
    
    try {
        const client = await pool.connect();
        console.log(`✅ ${name}: Connection successful!`);
        
        try {
            const result = await client.query('SELECT NOW() as time, version() as version');
            console.log('  Database time:', result.rows[0].time);
            console.log('  PostgreSQL version:', result.rows[0].version.split(' ')[0]);
        } catch (queryError) {
            console.log('  Query failed:', queryError.message);
        } finally {
            client.release();
        }
        
        await pool.end();
        return true;
        
    } catch (error) {
        console.log(`❌ ${name}: Connection failed`);
        console.log('  Error code:', error.code);
        console.log('  Error message:', error.message);
        console.log('  Error errno:', error.errno);
        console.log('  Error syscall:', error.syscall);
        console.log('  Error address:', error.address);
        console.log('  Error port:', error.port);
        
        try {
            await pool.end();
        } catch (poolError) {
            // Ignore pool cleanup errors
        }
        
        return false;
    }
}

async function runTests() {
    console.log('\n🧪 === CONNECTION TESTS ===');
    
    for (const { name, url } of testUrls) {
        if (url) {
            const success = await testConnection(name, url);
            if (success) {
                console.log(`\n🎉 SUCCESS: ${name} works! Use this one.`);
                break;
            }
        }
    }
    
    console.log('\n📋 === RAILWAY SETUP INSTRUCTIONS ===');
    console.log('1. Go to your PostgreSQL service in Railway');
    console.log('2. Click "Connect" tab');
    console.log('3. Copy the "Public Network" connection string');
    console.log('4. In your bot service, set: DATABASE_URL=<public_connection_string>');
    console.log('5. Make sure the URL starts with postgresql:// and contains containers- or proxy.rlwy.net');
    
    console.log('\n🔍 === TEST COMPLETE ===');
}

// Run the tests
runTests().catch(error => {
    console.error('Test failed:', error);
}).finally(() => {
    // Keep process alive for a minute to see results
    setTimeout(() => {
        console.log('Exiting...');
        process.exit(0);
    }, 60000);
});
