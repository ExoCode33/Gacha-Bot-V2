// Minimal Railway Environment Test - Replace index.js temporarily
console.log('🚂 === RAILWAY ENVIRONMENT TEST ===');
console.log('Test started at:', new Date().toISOString());
console.log('Node.js version:', process.version);
console.log('');

// Test 1: Check if variables exist at all
console.log('🧪 TEST 1: Variable Existence');
console.log('DISCORD_TOKEN in process.env:', 'DISCORD_TOKEN' in process.env);
console.log('DATABASE_URL in process.env:', 'DATABASE_URL' in process.env);
console.log('');

// Test 2: Check actual values
console.log('🧪 TEST 2: Variable Values');
console.log('DISCORD_TOKEN value:', process.env.DISCORD_TOKEN || 'UNDEFINED');
console.log('DATABASE_URL value:', process.env.DATABASE_URL || 'UNDEFINED');
console.log('');

// Test 3: Check types and lengths
console.log('🧪 TEST 3: Variable Details');
if (process.env.DISCORD_TOKEN) {
    console.log('DISCORD_TOKEN type:', typeof process.env.DISCORD_TOKEN);
    console.log('DISCORD_TOKEN length:', process.env.DISCORD_TOKEN.length);
    console.log('DISCORD_TOKEN starts with:', process.env.DISCORD_TOKEN.substring(0, 10));
} else {
    console.log('DISCORD_TOKEN: NOT SET');
}

if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL type:', typeof process.env.DATABASE_URL);
    console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 20));
} else {
    console.log('DATABASE_URL: NOT SET');
}
console.log('');

// Test 4: Railway detection
console.log('🧪 TEST 4: Railway Detection');
console.log('RAILWAY_ENVIRONMENT_NAME:', process.env.RAILWAY_ENVIRONMENT_NAME || 'NOT DETECTED');
console.log('RAILWAY_SERVICE_NAME:', process.env.RAILWAY_SERVICE_NAME || 'NOT DETECTED');
console.log('RAILWAY_PROJECT_NAME:', process.env.RAILWAY_PROJECT_NAME || 'NOT DETECTED');
console.log('');

// Test 5: Search for related variables
console.log('🧪 TEST 5: Related Variables Search');
const allEnvKeys = Object.keys(process.env);
console.log('Total environment variables:', allEnvKeys.length);

const discordRelated = allEnvKeys.filter(key => 
    key.toLowerCase().includes('discord') || 
    key.toLowerCase().includes('token')
);
const dbRelated = allEnvKeys.filter(key => 
    key.toLowerCase().includes('database') || 
    key.toLowerCase().includes('postgres') ||
    key.toLowerCase().includes('db')
);

console.log('Discord/Token related keys:', discordRelated);
console.log('Database related keys:', dbRelated);
console.log('');

// Test 6: Show first few environment variables
console.log('🧪 TEST 6: Sample Environment Variables');
console.log('First 15 environment variable keys:');
allEnvKeys.slice(0, 15).forEach((key, index) => {
    const value = process.env[key];
    if (key.includes('TOKEN') || key.includes('PASSWORD') || key.includes('SECRET')) {
        console.log(`  ${index + 1}. ${key}: [HIDDEN]`);
    } else if (value && value.length > 50) {
        console.log(`  ${index + 1}. ${key}: ${value.substring(0, 30)}...`);
    } else {
        console.log(`  ${index + 1}. ${key}: ${value || 'NOT SET'}`);
    }
});
console.log('');

// Test 7: Final verdict
console.log('🧪 TEST 7: Final Analysis');
const hasDiscordToken = process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN.length > 0;
const hasDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0;

console.log('✅ DISCORD_TOKEN valid:', hasDiscordToken ? 'YES' : 'NO');
console.log('✅ DATABASE_URL valid:', hasDatabaseUrl ? 'YES' : 'NO');

if (hasDiscordToken && hasDatabaseUrl) {
    console.log('');
    console.log('🎉 SUCCESS: Both environment variables are properly set!');
    console.log('Your Railway configuration is correct.');
    console.log('The issue must be in your configuration loading code.');
} else {
    console.log('');
    console.log('❌ PROBLEM: Environment variables missing or invalid');
    console.log('');
    console.log('🔧 NEXT STEPS:');
    console.log('1. Go to Railway Dashboard');
    console.log('2. Click on your BOT service (not PostgreSQL database)');
    console.log('3. Go to Variables tab');
    console.log('4. Verify/add these exact variables:');
    console.log('   DISCORD_TOKEN = MTM5NzcyMjUzNDQyMTcyNTIzNA.GDQoIJ.6cwHgzUAemiRXc82xwxQx413JrPDixtH9QD6kk');
    console.log('   DATABASE_URL = postgresql://postgres:password@host:port/database');
    console.log('5. Make sure there are NO quotes around the values');
    console.log('6. Remove DATABASE_PUBLIC_URL if it exists');
}

console.log('');
console.log('🚂 === TEST COMPLETE ===');

// Keep the process alive so Railway doesn't restart immediately
console.log('Keeping process alive for 60 seconds...');
setTimeout(() => {
    console.log('Test finished. Exiting...');
    process.exit(0);
}, 60000);

// Log every 10 seconds to show it's running
let counter = 0;
const interval = setInterval(() => {
    counter += 10;
    console.log(`Still running... ${counter}s`);
    if (counter >= 60) {
        clearInterval(interval);
    }
}, 10000);
