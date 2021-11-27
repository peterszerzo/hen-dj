import { spring } from "svelte/motion";

export const crossfader = spring(0.5, {
  stiffness: 0.1,
  damping: 0.25,
});
