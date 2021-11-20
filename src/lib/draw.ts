import type { SongAnalysis } from "./audio";

const drawPeaks = false;

export const drawSongAnalysis = (
  canvasElement: HTMLCanvasElement,
  containerWidth: number,
  songAnalysis: SongAnalysis | null
) => {
  const width = containerWidth - 1;
  const height = canvasElement.height;
  canvasElement.width = width;
  if (!songAnalysis) {
    return;
  }
  const ctx = canvasElement.getContext("2d");
  ctx.fillStyle = "#fff";
  songAnalysis.sample.forEach((value, index) => {
    if (index % 2 === 0) {
      ctx.fillRect(
        (width * index) / (songAnalysis.sample.length - 1),
        height / 2 + ((height / 2) * value) / songAnalysis.max,
        1,
        1
      );
    }
  });
  ctx.fillStyle = "rgba(255, 0, 100, 0.1)";
  if (drawPeaks) {
    (songAnalysis.peaks || []).forEach((peakIndex) => {
      ctx.fillRect(
        (width * peakIndex) /
          (songAnalysis.sample.length * songAnalysis.sampleSize - 1),
        height * 0.3,
        1,
        height * 0.4
      );
    });
  }
};
