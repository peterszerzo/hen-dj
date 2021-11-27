import { spring } from "svelte/motion";

export const crossfader = spring(0.5, {
  stiffness: 0.01,
  damping: 0.28,
});

const threshold = 0.3;

export const getCrossfaderAdjustment = (value: number, first: boolean) =>
  first
    ? value > 1 - threshold
      ? 1 - (value - (1 - threshold)) / threshold
      : 1
    : value < threshold
    ? 1 - (threshold - value) / threshold
    : 1;
