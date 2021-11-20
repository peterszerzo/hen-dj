import type { SongAnalysis } from "./audio";

export const drawSongAnalysis = (
  canvasElement: HTMLCanvasElement,
  songAnalysis: SongAnalysis | null
) => {
  const width = (canvasElement.parentNode as any)?.offsetWidth;
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
  if (false) {
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
