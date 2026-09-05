class KeyManager {
  constructor(rawKeysText) {
    this.keys = this._parse(rawKeysText);
    this._cursor = 0;
  }

  _parse(rawKeysText) {
    return (rawKeysText || '')
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean)
      .map((key) => ({
        key,
        disabled: false,
        cooldownUntil: 0,
        failCount: 0,
      }));
  }

  hasAnyKey() {
    return this.keys.length > 0;
  }

  getNextAvailable() {
    const now = Date.now();
    const n = this.keys.length;
    if (n === 0) return null;
    for (let i = 0; i < n; i++) {
      const idx = (this._cursor + i) % n;
      const k = this.keys[idx];
      if (!k.disabled && k.cooldownUntil <= now) {
        this._cursor = (idx + 1) % n;
        return k;
      }
    }
    return null;
  }

  msUntilNextAvailable() {
    const now = Date.now();
    const active = this.keys.filter((k) => !k.disabled);
    if (active.length === 0) return Infinity;
    const soonest = Math.min(...active.map((k) => Math.max(0, k.cooldownUntil - now)));
    return soonest;
  }

  markRateLimited(keyObj, cooldownMs) {
    keyObj.cooldownUntil = Date.now() + cooldownMs;
    keyObj.failCount++;
  }

  markInvalid(keyObj) {
    keyObj.disabled = true;
  }

  markTransientError(keyObj, cooldownMs) {
    keyObj.cooldownUntil = Date.now() + Math.min(cooldownMs, 5000);
    keyObj.failCount++;
  }

  markSuccess(keyObj) {
    keyObj.failCount = 0;
  }

  allDisabled() {
    return this.keys.length > 0 && this.keys.every((k) => k.disabled);
  }

  getStatusList() {
    const now = Date.now();
    return this.keys.map((k) => ({
      masked: maskKey(k.key),
      disabled: k.disabled,
      cooldownMsLeft: Math.max(0, k.cooldownUntil - now),
      failCount: k.failCount,
    }));
  }
}

function maskKey(key) {
  if (key.length <= 8) return key[0] + '***' + key[key.length - 1];
  return key.slice(0, 4) + '...' + key.slice(-4);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
