class Player {
  constructor(audioEl, { onStateChange } = {}) {
    this.audio = audioEl;
    this.queueItems = [];
    this.currentIndex = -1;
    this.autoplayNext = true;
    this.onStateChange = onStateChange || (() => {});

    this.audio.addEventListener('timeupdate', () => this._emit());
    this.audio.addEventListener('loadedmetadata', () => this._emit());
    this.audio.addEventListener('play', () => this._emit());
    this.audio.addEventListener('pause', () => this._emit());
    this.audio.addEventListener('ended', () => {
      if (this.autoplayNext) this.playNextDone();
      this._emit();
    });
  }

  setQueueItems(items) {
    this.queueItems = items;
  }

  _doneIndices() {
    return this.queueItems
      .map((it, i) => (it.status === 'done' ? i : -1))
      .filter((i) => i !== -1);
  }

  playIndex(index) {
    const item = this.queueItems[index];
    if (!item || item.status !== 'done' || !item.audioUrl) return;
    this.currentIndex = index;
    this.audio.src = item.audioUrl;
    this.audio.play().catch((e) => console.warn('Không phát được:', e));
    this._emit();
  }

  togglePlayPause() {
    if (!this.audio.src) {
      const doneIdx = this._doneIndices();
      if (doneIdx.length) this.playIndex(doneIdx[0]);
      return;
    }
    if (this.audio.paused) this.audio.play();
    else this.audio.pause();
  }

  playNextDone() {
    const doneIdx = this._doneIndices();
    if (!doneIdx.length) return;
    const pos = doneIdx.indexOf(this.currentIndex);
    const nextPos = pos === -1 ? 0 : pos + 1;
    if (nextPos < doneIdx.length) this.playIndex(doneIdx[nextPos]);
  }

  playPrevDone() {
    const doneIdx = this._doneIndices();
    if (!doneIdx.length) return;
    const pos = doneIdx.indexOf(this.currentIndex);
    const prevPos = pos === -1 ? doneIdx.length - 1 : pos - 1;
    if (prevPos >= 0) this.playIndex(doneIdx[prevPos]);
  }

  seekTo(fraction) {
    if (!this.audio.duration) return;
    this.audio.currentTime = fraction * this.audio.duration;
  }

  _emit() {
    this.onStateChange({
      currentIndex: this.currentIndex,
      isPlaying: !this.audio.paused && !this.audio.ended && this.audio.src,
      currentTime: this.audio.currentTime || 0,
      duration: this.audio.duration || 0,
    });
  }
}
