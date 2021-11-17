import { toPairs, sortBy } from "ramda";

export interface SongAnalysis {
  bufferLength: number;
  sampleRate: number;
  sampleSize: number;
  sample: Array<number>;
  duration: number;
  max: number;
  min: number;
  bpm?: number;
  peaks?: Array<number>;
  offset?: number;
}

const sampleSize = 10;

export const downsample = (arr: Float32Array, n: number): Array<number> => {
  let i = 0;
  let sampled = [];
  while (i < arr.length - n + 1) {
    const chunk: Float32Array = arr.slice(i, i + n);
    const sum = chunk.reduce((a, b) => a + b, 0);
    const average = sum / n;
    sampled.push(average);
    i += n;
  }
  return sampled;
};

export const formatSeconds = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds - 60 * minutes);
  return `${minutes < 10 ? "0" : ""}${minutes}:${
    seconds < 10 ? "0" : ""
  }${seconds}`;
};

export const analyzeSong = (file: File): Promise<SongAnalysis> => {
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

          const max = data.reduce((a, b) => Math.max(a, b), -Infinity);
          const min = data.reduce((a, b) => Math.min(a, b), +Infinity);

          const peaksAnalysis = analyzePeaks(data, {
            sampleRate: buffer.sampleRate,
            min,
            max,
          });

          resolve({
            bufferLength: data.length,
            sampleSize,
            sample: downsample(data, sampleSize),
            duration: buffer.duration,
            max,
            min,
            bpm: peaksAnalysis?.bpm,
            peaks: peaksAnalysis?.peaks,
            offset: peaksAnalysis?.offset,
            sampleRate: buffer.sampleRate,
          });
        };
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

const analyzePeaks = (
  arr: Float32Array,
  context: {
    min: number;
    max: number;
    sampleRate: number;
  }
): null | { peaks: Array<number>; offset: number; bpm: number } => {
  const peaks = [];
  let index = 0;
  while (index < arr.length) {
    if (arr[index] > context.max * 0.75) {
      peaks.push(index);
      index += 5000;
    } else {
      index += 1;
    }
  }
  const bpmCandidates: Record<string, Array<number>> = {};
  if (peaks.length < 3) {
    return null;
  }
  peaks.forEach((peakIndex, index) => {
    if (index === peaks.length - 1) {
      return;
    }
    const diff = peaks[index + 1] - peakIndex;
    let bpmCandidate = Math.round((60 * context.sampleRate) / diff);
    if (bpmCandidate < 20) {
      return;
    }
    while (bpmCandidate < 90) {
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
  const bpm = Number(bestBpmCandidate[0]);
  const bpmIndexDiff = (60 * context.sampleRate) / bpm;

  let offsets: Record<string, number> = {};
  peaks.forEach((peak) => {
    const offset = Math.round(peak % bpmIndexDiff);
    const simplifiedOffset = Math.round(offset / 10) * 10;
    offsets[simplifiedOffset] = (offsets[simplifiedOffset] || 0) + 1;
  });

  const offsetCandidate = Number(
    sortBy(
      ([_offsetCandidate, occurrance]) => -occurrance,
      toPairs(offsets)
    )[0]?.[0]
  );

  return {
    peaks,
    offset: isNaN(offsetCandidate) ? 0 : offsetCandidate,
    bpm: Number(bestBpmCandidate[0]),
  };
};
