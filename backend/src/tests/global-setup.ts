import { isDatabaseAvailable } from './setup-db.js';

export default async function setup() {
  console.log('🔧 Setting up test environment...');
  
  // Check if test database is available
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    console.error('❌ Test database is not available. Please run:');
    console.error('   bash scripts/test-services-start.sh');
    process.exit(1);
  }

  console.log('✅ Test environment ready');
}

export async function teardown() {
  console.log('🧹 Cleaning up test environment...');
  // Cleanup handled by individual test transaction rollbacks
  console.log('✅ Test environment cleaned up');
}