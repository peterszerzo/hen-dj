import { toPairs, sortBy } from "ramda";

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

          getPeaks(data, buffer.sampleRate);

          resolve(data);
        };
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

const getPeaks = (
  arr: Float32Array,
  sampleRate: number
): null | { peaks: Array<number>; bpm: number } => {
  const peaks = [];
  let index = 0;
  const max = arr.reduce((a, b) => Math.max(a, b), -Infinity);
  while (index < arr.length) {
    if (arr[index] > max * 0.75) {
      peaks.push(index);
      index += 5000;
    } else {
      index += 1;
    }
  }
  const bpmCandidates = {};
  peaks.forEach((peakIndex, index) => {
    if (index === peaks.length - 1) {
      return;
    }
    const diff = peaks[index + 1] - peakIndex;
    let bpmCandidate = Math.round(60 / (diff / sampleRate));
    while (bpmCandidate !== 0 && bpmCandidate < 85) {
      bpmCandidate *= 2;
    }
    bpmCandidates[bpmCandidate] = [
      ...(bpmCandidates[bpmCandidate] || []),
      peakIndex,
    ];
  });
  let bestBpmCandidate = sortBy(
    ([_bpm, peaks]) => -peaks.length,
    toPairs(bpmCandidates)
  )[0];
  if (!bestBpmCandidate) {
    return null;
  }
  return {
    peaks,
    bpm: Number(bestBpmCandidate[0]),
  };
};
