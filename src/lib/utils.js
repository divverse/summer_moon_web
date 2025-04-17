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
    // console.log("Base64 data:", base64data);
    callback(base64data);
  };
  reader.readAsDataURL(blob);
};

export { createMediaStream, blobToBase64 };
