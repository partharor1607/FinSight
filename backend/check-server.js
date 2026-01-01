// Diagnostic script to check if server is running new code
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import http from 'http';

const PORT = process.env.PORT || 5000;

console.log('🔍 Checking server at http://localhost:' + PORT);
console.log('═══════════════════════════════════════════════════════');

// Check health endpoint
const checkHealth = () => {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${PORT}/api/upload/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + data));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout - server may not be running'));
    });
  });
};

checkHealth()
  .then((response) => {
    console.log('✅ Server is running');
    console.log('📋 Response:', JSON.stringify(response, null, 2));
    console.log('═══════════════════════════════════════════════════════');
    
    if (response.version && response.version.includes('ES-MODULES')) {
      console.log('✅ Server is running NEW ES MODULES code!');
      console.log('✅ Version:', response.version);
    } else if (response.version && response.version.includes('TXT-ONLY')) {
      console.log('⚠️  Server is running OLD code (pre-ES-modules)');
      console.log('⚠️  Version:', response.version);
      console.log('⚠️  You need to restart the server!');
    } else {
      console.log('❌ Server version not recognized');
      console.log('❌ This might be very old cached code');
      console.log('❌ KILL the server and restart!');
    }
    
    if (response.allowedTypes && response.allowedTypes.includes('.txt')) {
      console.log('✅ TXT files are allowed');
    } else {
      console.log('❌ TXT files NOT in allowed types!');
      console.log('❌ This is OLD CODE - restart server!');
    }
  })
  .catch((error) => {
    console.log('❌ Error checking server:', error.message);
    console.log('═══════════════════════════════════════════════════════');
    console.log('Server may not be running or not responding.');
    console.log('Start the server with: cd backend && node server.js');
  });

