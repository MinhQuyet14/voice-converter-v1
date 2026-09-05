const STORAGE_KEY = 'tts_app_settings_v1';

const DEFAULT_SETTINGS = {
  apiKeysRaw: '',
  model: MODELS[0].id,
  voice: 'Kore',
  audioProfile: '',
  directorStyle: '',
  directorPace: '',
  directorAccent: '',
  directorCustom: '',
  format: 'wav',
  betweenRequestsMs: 800,
  rateLimitCooldownMs: 15000,
  maxRetriesPerLine: 6,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);

    delete parsed.apiKeysRaw;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.warn('Không đọc được settings đã lưu, dùng mặc định.', e);
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  try {
    const { apiKeysRaw, ...toPersist } = settings;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch (e) {
    console.warn('Không lưu được settings.', e);
  }
}

(function scrubLegacyStoredKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && 'apiKeysRaw' in parsed) {
      delete parsed.apiKeysRaw;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch (_) {}
})();
