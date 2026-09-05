const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'apps', 'shell', 'electron-builder.cjs');
let content = fs.readFileSync(configPath, 'utf8');

// Replace linux block: only deb for arm64
content = content.replace(
  /linux:\s*\{[\s\S]*?\},/,
  `linux: {
  target: [
    { target: 'deb', arch: ['arm64'] }
  ],
  executableName: 'genoffice',
  syncDesktopName: true,
  extraResources: [
    {
      from: '../sheets/native/xlsx-engine/target/release/xlsx-sidecar',
      to: 'native/xlsx-sidecar',
    },
  ],
}`
);

// Replace deb block: use electron-builder ${version} placeholder
// Backslash-escape the dollar to write literal ${version} into the file
content = content.replace(
  /deb:\s*\{[\s\S]*?\},/,
  `deb: {
  artifactName: 'genoffice_\${version}_arm64.deb',
  packageName: 'genoffice',
}`
);

fs.writeFileSync(configPath, content);
console.log('Patched electron-builder config for ARM64');
