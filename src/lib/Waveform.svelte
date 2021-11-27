<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { SongAnalysis } from "./audio";
  import { drawSongAnalysis } from "./draw";

  let container: HTMLDivElement;

  const dispatch = createEventDispatcher<{ changeCurrentTime: number }>();

  export let loading: boolean = false;

  export let songAnalysis: SongAnalysis | null = null;

  export let currentTime: number = 0;

  let width: number;

  const drawSongAnalysisAction = (
    node: HTMLCanvasElement,
    songAnalysis: SongAnalysis | null
  ) => {
    drawSongAnalysis(node, width, songAnalysis);
    return {
      update(newSongAnalysis: SongAnalysis) {
        drawSongAnalysis(node, width, newSongAnalysis);
      },
    };
  };

  const handleClick = (ev: any) => {
    if (songAnalysis) {
      const ratio = (ev.pageX - container.getBoundingClientRect().x) / width;
      dispatch("changeCurrentTime", ratio * songAnalysis.duration);
    }
  };
</script>

<div
  bind:this={container}
  bind:clientWidth={width}
  class="bg-gray-900 relative"
  class:pulse={loading}
  on:click={handleClick}
>
  <canvas width="100%" height="80" use:drawSongAnalysisAction={songAnalysis} />
  {#if songAnalysis}
    <div
      class="h-full absolute bg-blue-500 top-0"
      style={`width: 1px; left: ${
        (currentTime / songAnalysis.duration) * width
      }px`}
    />
  {/if}
</div>

<style>
  @keyframes pulseFrames {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 1;
    }
  }

  .pulse {
    animation-name: pulseFrames;
    animation-duration: 1600ms;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  }
</style>
