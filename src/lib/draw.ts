import type { SongAnalysis } from "./audio";

export const drawSongAnalysis = (
  canvasElement: HTMLCanvasElement,
  songAnalysis: SongAnalysis | null
) => {
  if (!songAnalysis) {
    return;
  }
  const width = (canvasElement.parentNode as any)?.offsetWidth;
  const height = canvasElement.height;
  canvasElement.width = width;
  const ctx = canvasElement.getContext("2d");
  ctx.fillStyle = "#fff";
  songAnalysis.raw.forEach((value, index) => {
    if (index % 500 === 0) {
      ctx.fillRect(
        (width * index) / (songAnalysis.raw.length - 1),
        height / 2 + ((height / 2) * value) / songAnalysis.max,
        1,
        1
      );
    }
  });
  ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
  (songAnalysis.peaks || []).forEach((peakIndex) => {
    ctx.fillRect(
      (width * peakIndex) / (songAnalysis.raw.length - 1),
      height * 0.1,
      1,
      height * 0.8
    );
  });
};
