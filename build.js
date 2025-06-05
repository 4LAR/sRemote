// build.js
const { execSync } = require('child_process');
const versionSuffix = new Date()
  .toISOString()
  .replace(/[:T\.-]/g, '')
  .slice(0, 12); // YYYYMMDDHHmm

execSync(`electron-builder --config.extraMetadata.version=${process.env.npm_package_version}-${versionSuffix}`, {
  stdio: 'inherit'
});
