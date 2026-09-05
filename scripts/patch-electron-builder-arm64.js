const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'apps', 'shell', 'electron-builder.cjs');
let content = fs.readFileSync(configPath, 'utf8');

function replaceObjectBlock(source, blockName, replacement) {
  const blockStart = `${blockName}:`;
  const start = source.indexOf(blockStart);
  if (start === -1) {
    throw new Error(`Could not find ${blockName} block in ${configPath}`);
  }

  const openBrace = source.indexOf('{', start);
  if (openBrace === -1) {
    throw new Error(`Could not find opening brace for ${blockName} block in ${configPath}`);
  }

  let depth = 0;
  let closeBrace = -1;
  for (let i = openBrace; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        closeBrace = i;
        break;
      }
    }
  }

  if (closeBrace === -1) {
    throw new Error(`Could not find closing brace for ${blockName} block in ${configPath}`);
  }

  const commaIndex = source.indexOf(',', closeBrace);
  if (commaIndex === -1) {
    throw new Error(`Could not find trailing comma for ${blockName} block in ${configPath}`);
  }

  return source.slice(0, start) + replacement + source.slice(commaIndex + 1);
}

// Replace linux block: only deb for arm64.
content = replaceObjectBlock(
  content,
  'linux',
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
 },`
);

// Replace deb block: use electron-builder ${version} placeholder.
// Backslash-escape the dollar to write literal ${version} into the file.
content = replaceObjectBlock(
  content,
  'deb',
  `deb: {
  artifactName: 'genoffice_\${version}_arm64.deb',
  packageName: 'genoffice',
 },`
);

fs.writeFileSync(configPath, content);
console.log('Patched electron-builder config for ARM64');
