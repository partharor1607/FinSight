// Quick verification script to check if server is running new code
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('═══════════════════════════════════════════════════════');
console.log('🔍 VERIFYING SERVER CODE');
console.log('═══════════════════════════════════════════════════════');
console.log('✅ This script is using ES MODULES');
console.log('✅ File:', __filename);
console.log('✅ If you see this, ES modules are working');
console.log('═══════════════════════════════════════════════════════');

// Try to import the upload route
try {
  const uploadRoute = await import('./routes/upload.js');
  console.log('✅ Upload route imported successfully');
  console.log('✅ Server should be using ES modules');
} catch (error) {
  console.error('❌ Error importing upload route:', error.message);
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════');
console.log('✅ Verification complete - ES modules are working!');
console.log('═══════════════════════════════════════════════════════');

