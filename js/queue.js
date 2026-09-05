const LINE_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  DONE: 'done',
  ERROR: 'error',
};

class TTSQueue {
  constructor({ onChange }) {
    this.items = [];
    this.keyManager = null;
    this.isRunning = false;
    this.abortController = null;
    this.onChange = onChange || (() => {});
  }

  setLinesFromText(rawText) {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    this.items.forEach((it) => it.audioUrl && URL.revokeObjectURL(it.audioUrl));

    this.items = lines.map((text, index) => ({
      id: `line-${index}-${Date.now()}`,
      index,
      text,
      status: LINE_STATUS.PENDING,
      audioBlob: null,
      audioUrl: null,
      format: null,
      errorMsg: null,
      log: '',
    }));
    this._emit();
  }

  _emit() {
    this.onChange(this.items);
  }

  _setItem(index, patch) {
    const item = this.items[index];
    if (!item) return;
    Object.assign(item, patch);
    this._emit();
  }

  stop() {
    this.isRunning = false;
    this.abortController?.abort();
  }

  async runAll(settings, keyManager, { onlyPendingAndError = true } = {}) {
    await this._runFromIndex(0, settings, keyManager, { onlyPendingAndError });
  }

  async runFromIndex(startIndex, settings, keyManager) {
    await this._runFromIndex(startIndex, settings, keyManager, { onlyPendingAndError: false, forceFrom: startIndex });
  }

  async runSingle(index, settings, keyManager) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.abortController = new AbortController();
    this.keyManager = keyManager;
    try {
      await this._processLine(index, settings, keyManager, this.abortController.signal);
    } finally {
      this.isRunning = false;
    }
  }

  async _runFromIndex(startIndex, settings, keyManager, { onlyPendingAndError, forceFrom } = {}) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.abortController = new AbortController();
    this.keyManager = keyManager;
    const signal = this.abortController.signal;

    try {
      for (let i = startIndex; i < this.items.length; i++) {
        if (!this.isRunning || signal.aborted) break;

        const item = this.items[i];
        const shouldSkip =
          onlyPendingAndError &&
          forceFrom === undefined &&
          item.status === LINE_STATUS.DONE;

        if (shouldSkip) continue;

        await this._processLine(i, settings, keyManager, signal);

        if (i < this.items.length - 1 && this.isRunning) {
          await sleep(settings.betweenRequestsMs);
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  async _processLine(index, settings, keyManager, signal) {
    const item = this.items[index];
    if (!item) return;

    if (item.audioUrl) {
      URL.revokeObjectURL(item.audioUrl);
    }

    this._setItem(index, {
      status: LINE_STATUS.RUNNING,
      errorMsg: null,
      audioBlob: null,
      audioUrl: null,
      log: 'Bắt đầu...',
    });

    try {
      const { pcmBytes, sampleRate } = await synthesizeLine({
        text: item.text,
        settings,
        keyManager,
        signal,
        onAttemptLog: (msg) => this._setItem(index, { log: msg }),
      });

      const wavBlob = pcmToWavBlob(pcmBytes, sampleRate);
      let finalBlob = wavBlob;
      let finalFormat = 'wav';

      if (settings.format === 'mp3' || settings.format === 'ogg') {
        this._setItem(index, { log: `Đang chuyển sang ${settings.format.toUpperCase()}...` });
        const converted = await convertWavBlob(wavBlob, settings.format).catch((e) => {
          console.warn('ffmpeg convert failed, fallback to WAV', e);
          return null;
        });
        if (converted) {
          finalBlob = converted;
          finalFormat = settings.format;
        } else {
          this._setItem(index, {
            log: `ffmpeg.wasm chưa sẵn sàng — giữ WAV (xem README để bật ${settings.format.toUpperCase()}).`,
          });
        }
      }

      const url = URL.createObjectURL(finalBlob);
      this._setItem(index, {
        status: LINE_STATUS.DONE,
        audioBlob: finalBlob,
        audioUrl: url,
        format: finalFormat,
        log: 'Hoàn thành.',
      });
    } catch (err) {
      if (err.kind === 'aborted') {
        this._setItem(index, { status: LINE_STATUS.PENDING, log: 'Đã dừng.' });
        return;
      }
      this._setItem(index, {
        status: LINE_STATUS.ERROR,
        errorMsg: err.message || String(err),
        log: `Lỗi: ${err.message || err}`,
      });
    }
  }
}
