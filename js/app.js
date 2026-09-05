(function () {
  // ============ DOM refs ============
  const els = {
    apiKeysInput: document.getElementById('apiKeysInput'),
    envFileInput: document.getElementById('envFileInput'),
    keyStatusList: document.getElementById('keyStatusList'),
    modelSelect: document.getElementById('modelSelect'),
    voiceSelect: document.getElementById('voiceSelect'),
    audioProfileSelect: document.getElementById('audioProfileSelect'),
    directorStyleSelect: document.getElementById('directorStyleSelect'),
    directorPaceSelect: document.getElementById('directorPaceSelect'),
    directorAccentSelect: document.getElementById('directorAccentSelect'),
    directorCustomInput: document.getElementById('directorCustomInput'),
    formatSelect: document.getElementById('formatSelect'),
    ffmpegNotice: document.getElementById('ffmpegNotice'),
    betweenRequestsMs: document.getElementById('betweenRequestsMs'),
    rateLimitCooldownMs: document.getElementById('rateLimitCooldownMs'),
    maxRetriesPerLine: document.getElementById('maxRetriesPerLine'),

    textInput: document.getElementById('textInput'),
    fileInput: document.getElementById('fileInput'),
    clearBtn: document.getElementById('clearBtn'),
    runAllBtn: document.getElementById('runAllBtn'),
    rerunAllBtn: document.getElementById('rerunAllBtn'),
    stopBtn: document.getElementById('stopBtn'),

    queueEmpty: document.getElementById('queueEmpty'),
    queueList: document.getElementById('queueList'),
    progressText: document.getElementById('progressText'),
    progressFill: document.getElementById('progressFill'),

    audioEl: document.getElementById('audioEl'),
    prevBtn: document.getElementById('prevBtn'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    nextBtn: document.getElementById('nextBtn'),
    nowPlayingLabel: document.getElementById('nowPlayingLabel'),
    currentTimeLabel: document.getElementById('currentTimeLabel'),
    durationLabel: document.getElementById('durationLabel'),
    seekBar: document.getElementById('seekBar'),
    autoplayToggle: document.getElementById('autoplayToggle'),
  };

  // ============ Populate static selects ============
  function fillSelect(selectEl, options, { valueKey = 'id', labelKey = 'label' } = {}) {
    selectEl.innerHTML = '';
    options.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt[valueKey];
      o.textContent = opt[labelKey];
      selectEl.appendChild(o);
    });
  }

  fillSelect(els.modelSelect, MODELS);
  fillSelect(els.voiceSelect, VOICES, { valueKey: 'name', labelKey: 'name' });

  Array.from(els.voiceSelect.options).forEach((opt, i) => {
    opt.textContent = `${VOICES[i].name} — ${VOICES[i].desc}`;
  });
  fillSelect(els.audioProfileSelect, AUDIO_PROFILES);
  fillSelect(els.directorStyleSelect, DIRECTOR_STYLES);
  fillSelect(els.directorPaceSelect, DIRECTOR_PACES);
  fillSelect(els.directorAccentSelect, DIRECTOR_ACCENTS);
  fillSelect(els.formatSelect, FORMATS);

  // ============ Load & bind settings ============
  let settings = loadSettings();

  function applySettingsToForm() {
    els.apiKeysInput.value = settings.apiKeysRaw;
    els.modelSelect.value = settings.model;
    els.voiceSelect.value = settings.voice;
    els.audioProfileSelect.value = settings.audioProfile;
    els.directorStyleSelect.value = settings.directorStyle;
    els.directorPaceSelect.value = settings.directorPace;
    els.directorAccentSelect.value = settings.directorAccent;
    els.directorCustomInput.value = settings.directorCustom;
    els.formatSelect.value = settings.format;
    els.betweenRequestsMs.value = settings.betweenRequestsMs;
    els.rateLimitCooldownMs.value = settings.rateLimitCooldownMs;
    els.maxRetriesPerLine.value = settings.maxRetriesPerLine;
  }
  applySettingsToForm();

  function readSettingsFromForm() {
    settings = {
      apiKeysRaw: els.apiKeysInput.value,
      model: els.modelSelect.value,
      voice: els.voiceSelect.value,
      audioProfile: els.audioProfileSelect.value,
      directorStyle: els.directorStyleSelect.value,
      directorPace: els.directorPaceSelect.value,
      directorAccent: els.directorAccentSelect.value,
      directorCustom: els.directorCustomInput.value,
      format: els.formatSelect.value,
      betweenRequestsMs: parseInt(els.betweenRequestsMs.value, 10) || 0,
      rateLimitCooldownMs: parseInt(els.rateLimitCooldownMs.value, 10) || 0,
      maxRetriesPerLine: Math.max(1, parseInt(els.maxRetriesPerLine.value, 10) || 1),
    };
    saveSettings(settings);
    updateFfmpegNotice();
    return settings;
  }

  function updateFfmpegNotice() {
    const needsFfmpeg = settings.format === 'mp3' || settings.format === 'ogg';
    els.ffmpegNotice.hidden = !(needsFfmpeg && !isFfmpegAvailable());
  }

  [
    els.apiKeysInput, els.modelSelect, els.voiceSelect, els.audioProfileSelect,
    els.directorStyleSelect, els.directorPaceSelect, els.directorAccentSelect,
    els.directorCustomInput, els.formatSelect, els.betweenRequestsMs,
    els.rateLimitCooldownMs, els.maxRetriesPerLine,
  ].forEach((el) => {
    el.addEventListener('change', readSettingsFromForm);
    if (el.tagName === 'TEXTAREA') el.addEventListener('input', debounce(readSettingsFromForm, 400));
  });

  updateFfmpegNotice();

  // ============ Key manager (rebuilt whenever the key textarea changes) ============
  let keyManager = new KeyManager(settings.apiKeysRaw);
  els.apiKeysInput.addEventListener('input', debounce(() => {
    keyManager = new KeyManager(els.apiKeysInput.value);
    renderKeyStatus();
  }, 500));

  function setKeysFromArray(keys) {
    els.apiKeysInput.value = keys.join('\n');
    keyManager = new KeyManager(els.apiKeysInput.value);
    renderKeyStatus();
  }

  els.envFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const keys = await loadKeysFromFile(file);
      if (!keys.length) {
        alert('Không tìm thấy key nào trong file này. Kiểm tra lại định dạng .env.');
        return;
      }
      setKeysFromArray(keys);
    } catch (err) {
      alert('Không đọc được file: ' + err.message);
    } finally {
      e.target.value = '';
    }
  });



  function renderKeyStatus() {
    const list = keyManager.getStatusList();
    els.keyStatusList.innerHTML = '';
    if (!list.length) return;
    list.forEach((k) => {
      const row = document.createElement('div');
      row.className = 'key-status-row' + (k.disabled ? ' disabled' : k.cooldownMsLeft > 0 ? ' cooldown' : '');
      const cooldownLabel = k.disabled
        ? 'đã vô hiệu hoá'
        : k.cooldownMsLeft > 0
        ? `nghỉ ${Math.ceil(k.cooldownMsLeft / 1000)}s`
        : 'sẵn sàng';
      row.innerHTML = `<span class="key-dot"></span><span>${k.masked}</span><span style="margin-left:auto;color:var(--text-faint)">${cooldownLabel}</span>`;
      els.keyStatusList.appendChild(row);
    });
  }
  renderKeyStatus();
  setInterval(renderKeyStatus, 1000);

  // ============ Queue engine ============
  const queue = new TTSQueue({ onChange: renderQueue });

  function textToLines(text) {
    return text.split('\n').map((l) => l.trim()).filter(Boolean);
  }

  els.textInput.addEventListener('input', debounce(() => {
    queue.setLinesFromText(els.textInput.value);
  }, 500));

  els.fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    els.textInput.value = text;
    queue.setLinesFromText(text);
  });

  els.clearBtn.addEventListener('click', () => {
    els.textInput.value = '';
    queue.setLinesFromText('');
  });

  els.runAllBtn.addEventListener('click', () => {
    if (!checkReadyToRun()) return;
    setRunningUiState(true);
    queue.runAll(readSettingsFromForm(), keyManager, { onlyPendingAndError: true })
      .finally(() => setRunningUiState(false));
  });

  els.rerunAllBtn.addEventListener('click', () => {
    if (!checkReadyToRun()) return;
    setRunningUiState(true);
    queue.runFromIndex(0, readSettingsFromForm(), keyManager)
      .finally(() => setRunningUiState(false));
  });

  els.stopBtn.addEventListener('click', () => queue.stop());

  function checkReadyToRun() {
    if (!queue.items.length) {
      alert('Chưa có dòng text nào trong hàng đợi.');
      return false;
    }
    if (!keyManager.hasAnyKey()) {
      alert('Vui lòng nhập ít nhất 1 API key.');
      return false;
    }
    return true;
  }

  function setRunningUiState(isRunning) {
    els.runAllBtn.disabled = isRunning;
    els.rerunAllBtn.disabled = isRunning;
    els.stopBtn.disabled = !isRunning;
    renderQueue(queue.items);
  }
  els.stopBtn.disabled = true;

  // ============ Render queue list ============
  function renderQueue(items) {
    player.setQueueItems(items);

    els.queueEmpty.hidden = items.length > 0;
    els.queueList.innerHTML = '';

    const done = items.filter((i) => i.status === LINE_STATUS.DONE).length;
    const errored = items.filter((i) => i.status === LINE_STATUS.ERROR).length;
    els.progressText.textContent = `${done} / ${items.length} dòng` + (errored ? ` · ${errored} lỗi` : '');
    els.progressFill.style.width = items.length ? `${(done / items.length) * 100}%` : '0%';

    const statusLabels = { pending: 'chờ', running: 'đang chạy', done: 'xong', error: 'lỗi' };

    items.forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'queue-row' + (player.currentIndex === i ? ' current' : '');

      const isBusy = queue.isRunning;
      const canPlay = item.status === LINE_STATUS.DONE;

      row.innerHTML = `
        <div class="queue-row-index">${i + 1}</div>
        <div class="queue-row-main">
          <div class="queue-row-text" title="${escapeHtml(item.text)}">${escapeHtml(item.text)}</div>
          <div class="queue-row-log ${item.status === 'error' ? 'error-log' : ''}">
            <span class="status-dot-wrap"><span class="status-dot ${item.status}"></span>${statusLabels[item.status]}</span>
            ${item.log ? ' · ' + escapeHtml(item.log) : ''}
          </div>
        </div>
        <div class="queue-row-actions">
          <button class="icon-btn play-icon" data-action="play" ${canPlay ? '' : 'disabled'} title="Nghe dòng này">▶</button>
          <button class="icon-btn" data-action="retry" ${isBusy ? 'disabled' : ''} title="Chạy lại dòng này">↻</button>
          <button class="icon-btn" data-action="run-from" ${isBusy ? 'disabled' : ''} title="Chạy từ dòng này trở đi">⏵⏵</button>
          <button class="icon-btn" data-action="download" ${canPlay ? '' : 'disabled'} title="Tải file">⭳</button>
        </div>
      `;

      row.querySelector('[data-action="play"]').addEventListener('click', () => player.playIndex(i));
      row.querySelector('[data-action="retry"]').addEventListener('click', () => {
        setRunningUiState(true);
        queue.runSingle(i, readSettingsFromForm(), keyManager).finally(() => setRunningUiState(false));
      });
      row.querySelector('[data-action="run-from"]').addEventListener('click', () => {
        setRunningUiState(true);
        queue.runFromIndex(i, readSettingsFromForm(), keyManager).finally(() => setRunningUiState(false));
      });
      row.querySelector('[data-action="download"]').addEventListener('click', () => downloadItem(item, i));

      els.queueList.appendChild(row);
    });
  }

  function downloadItem(item, index) {
    if (!item.audioBlob) return;
    const ext = item.format || 'wav';
    const safeName = `dong_${String(index + 1).padStart(3, '0')}.${ext}`;
    const a = document.createElement('a');
    a.href = item.audioUrl;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // ============ Player ============
  const player = new Player(els.audioEl, { onStateChange: updateTransportUi });
  player.autoplayNext = els.autoplayToggle.checked;
  els.autoplayToggle.addEventListener('change', () => {
    player.autoplayNext = els.autoplayToggle.checked;
  });

  els.playPauseBtn.addEventListener('click', () => player.togglePlayPause());
  els.prevBtn.addEventListener('click', () => player.playPrevDone());
  els.nextBtn.addEventListener('click', () => player.playNextDone());

  let isSeeking = false;
  els.seekBar.addEventListener('input', () => { isSeeking = true; });
  els.seekBar.addEventListener('change', () => {
    player.seekTo(parseInt(els.seekBar.value, 10) / 1000);
    isSeeking = false;
  });

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateTransportUi({ currentIndex, isPlaying, currentTime, duration }) {
    els.playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
    els.currentTimeLabel.textContent = formatTime(currentTime);
    els.durationLabel.textContent = formatTime(duration);
    if (!isSeeking) {
      els.seekBar.value = duration ? Math.round((currentTime / duration) * 1000) : 0;
    }
    if (currentIndex >= 0 && queue.items[currentIndex]) {
      els.nowPlayingLabel.textContent = `#${currentIndex + 1} ${queue.items[currentIndex].text}`;
    } else {
      els.nowPlayingLabel.textContent = 'Chưa phát bài nào';
    }

    document.querySelectorAll('.queue-row.current').forEach((r) => r.classList.remove('current'));
    const rows = els.queueList.children;
    if (currentIndex >= 0 && rows[currentIndex]) rows[currentIndex].classList.add('current');
  }

  // ============ Init ============
  renderQueue(queue.items);
})();
