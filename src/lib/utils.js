const getPeakLevel = (analyzer) => {
  const array = new Uint8Array(analyzer.fftSize);

  analyzer.getByteTimeDomainData(array);
  return array.reduce((max, current) => Math.max(max, Math.abs(current - 127)), 0) / 128;
};

const createMediaStream = (stream, isRecording, callback) => {
  const context = new AudioContext();

  const source = context.createMediaStreamSource(stream);

  const analyzer = context.createAnalyser();

  source.connect(analyzer);

  const tick = () => {
    const peak = getPeakLevel(analyzer);

    if (isRecording) {
      callback(peak);

      requestAnimationFrame(tick);
    }
  };

  tick();
};

const blobToBase64 = (blob, callback) => {
  const reader = new FileReader();
  reader.onload = function () {
    const base64data = reader?.result?.split(",")[1];
    callback(base64data);
  };
  reader.readAsDataURL(blob);
};

function encodeWAV(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 32 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk length
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Convert to 16-bit PCM
  floatTo16BitPCM(view, 44, samples);

  return view;
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}


function exportWAV(samples, sampleRate) {
  const dataView = encodeWAV(samples, sampleRate);
const audioBlob = new Blob([dataView], { type: 'audio/wav' });
  return audioBlob;
}



export { createMediaStream, blobToBase64, exportWAV };
