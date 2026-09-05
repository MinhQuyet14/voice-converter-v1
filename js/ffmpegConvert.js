let _ffmpegInstance = null;
let _ffmpegLoadingPromise = null;

function isFfmpegAvailable() {
  return typeof window !== 'undefined' && !!window.FFmpeg;
}

async function getFfmpeg() {
  if (!isFfmpegAvailable()) return null;
  if (_ffmpegInstance) return _ffmpegInstance;
  if (!_ffmpegLoadingPromise) {
    _ffmpegLoadingPromise = (async () => {
      const { createFFmpeg } = window.FFmpeg;
      const instance = createFFmpeg({
        log: false,
        corePath: 'lib/ffmpeg/ffmpeg-core.js',
      });
      await instance.load();
      _ffmpegInstance = instance;
      return instance;
    })();
  }
  return _ffmpegLoadingPromise;
}

async function convertWavBlob(wavBlob, targetFormat) {
  const ffmpeg = await getFfmpeg();
  if (!ffmpeg) return null;

  const { fetchFile } = window.FFmpeg;
  const inName = `in_${Date.now()}.wav`;
  const outName = `out_${Date.now()}.${targetFormat}`;

  const codecArgs =
    targetFormat === 'mp3'
      ? ['-codec:a', 'libmp3lame', '-qscale:a', '2']
      : ['-codec:a', 'libvorbis', '-qscale:a', '5'];

  ffmpeg.FS('writeFile', inName, await fetchFile(wavBlob));
  await ffmpeg.run('-i', inName, ...codecArgs, outName);
  const data = ffmpeg.FS('readFile', outName);

  try {
    ffmpeg.FS('unlink', inName);
    ffmpeg.FS('unlink', outName);
  } catch (_) {}

  const mime = targetFormat === 'mp3' ? 'audio/mpeg' : 'audio/ogg';
  return new Blob([data.buffer], { type: mime });
}
