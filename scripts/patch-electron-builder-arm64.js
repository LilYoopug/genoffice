const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'apps', 'shell', 'electron-builder.cjs');
let content = fs.readFileSync(configPath, 'utf8');

function findMatchingBracket(source, start, openChar, closeChar, context) {
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === openChar) depth += 1;
    if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error(`Could not find closing ${closeChar} for ${context} in ${configPath}`);
}

function replaceObjectBlock(source, blockName, replacer) {
  const blockStart = `${blockName}:`;
  const start = source.indexOf(blockStart);
  if (start === -1) {
    throw new Error(`Could not find ${blockName} block in ${configPath}`);
  }

  const openBrace = source.indexOf('{', start);
  if (openBrace === -1) {
    throw new Error(`Could not find opening brace for ${blockName} block in ${configPath}`);
  }

  const closeBrace = findMatchingBracket(source, openBrace, '{', '}', `${blockName} block`);
  const commaIndex = source.indexOf(',', closeBrace);
  if (commaIndex === -1) {
    throw new Error(`Could not find trailing comma for ${blockName} block in ${configPath}`);
  }

  const block = source.slice(start, commaIndex + 1);
  const replacement = replacer(block);
  return source.slice(0, start) + replacement + source.slice(commaIndex + 1);
}

function replaceArrayProperty(block, propertyName, replacement) {
  const propStart = block.indexOf(`${propertyName}:`);
  if (propStart === -1) {
    throw new Error(`Could not find ${propertyName} property in block:\n${block}`);
  }

  const arrayStart = block.indexOf('[', propStart);
  if (arrayStart === -1) {
    throw new Error(`Could not find array opening bracket for ${propertyName} in block:\n${block}`);
  }

  const arrayEnd = findMatchingBracket(block, arrayStart, '[', ']', `${propertyName} property`);
  const commaIndex = block.indexOf(',', arrayEnd);
  if (commaIndex === -1) {
    throw new Error(`Could not find trailing comma for ${propertyName} in block:\n${block}`);
  }

  return block.slice(0, propStart) + replacement + block.slice(commaIndex + 1);
}

function replaceStringProperty(block, propertyName, replacementValueLiteral) {
  const regex = new RegExp(`(${propertyName}:\\s*)['"\`][^'"\`]*['"\`]`);
  if (!regex.test(block)) {
    throw new Error(`Could not find string property ${propertyName} in block:\n${block}`);
  }
  return block.replace(regex, `$1${replacementValueLiteral}`);
}

// Patch linux target only so maintainer/vendor/category/icon and any future metadata stay intact.
content = replaceObjectBlock(content, 'linux', (linuxBlock) =>
  replaceArrayProperty(
    linuxBlock,
    'target',
    `target: [
      { target: 'deb', arch: ['arm64'] },
    ],`,
  ),
);

// Patch only deb artifact name for ARM output naming.
content = replaceObjectBlock(content, 'deb', (debBlock) =>
  replaceStringProperty(debBlock, 'artifactName', "'genoffice_\\${version}_arm64.deb'"),
);

fs.writeFileSync(configPath, content);
console.log('Patched electron-builder config for ARM64');
