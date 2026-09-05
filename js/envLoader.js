/**
 * Parse env key to array
 */
function parseEnvKeys(text) {
  const keys = [];
  (text || '').split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    const eqIndex = line.indexOf('=');
    const value = eqIndex === -1 ? line : line.slice(eqIndex + 1).trim();
    if (!value) return;

    const unquoted = value.replace(/^['"]|['"]$/g, '');

    if (unquoted.includes(',')) {
      unquoted.split(',').map((k) => k.trim()).filter(Boolean).forEach((k) => keys.push(k));
    } else {
      keys.push(unquoted);
    }
  });
  return keys;
}

/**
 * Read file
 */
async function loadKeysFromFile(file) {
  const text = await file.text();
  return parseEnvKeys(text);
}
