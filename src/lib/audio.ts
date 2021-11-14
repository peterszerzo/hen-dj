export const analyzeSong = (file: File) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer: ArrayBuffer = reader.result as ArrayBuffer;

      new AudioContext().decodeAudioData(arrayBuffer).then((buffer) => {
        // Create offline context
        const offlineContext = new OfflineAudioContext(
          1,
          buffer.length,
          buffer.sampleRate
        );

        // Create buffer source
        const source = offlineContext.createBufferSource();
        source.buffer = buffer;

        // Create filter
        const filter = offlineContext.createBiquadFilter();
        filter.type = "lowpass";

        // Pipe the song into the filter, and the filter into the offline context
        source.connect(filter);
        filter.connect(offlineContext.destination);

        source.start(0);

        // Render the song
        offlineContext.startRendering();

        // Act on the result
        offlineContext.oncomplete = function (event) {
          // Filtered buffer!
          const filteredBuffer = event.renderedBuffer;
          const data = filteredBuffer.getChannelData(0);

          resolve(data);
        };
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

const getPeaks = (arr: Array<number>) => {
  const peaks = [];
  let index = 0;
  while (index < arr.length) {
    if (arr[index] > arr[index + 5]) {
      peaks.push(index);
    }
    index += 5;
  }
  return peaks;
};
