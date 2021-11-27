<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { clamp } from "ramda";

  const dispatch = createEventDispatcher<{ change: number }>();

  export let value: number;

  let width: number;
  let container: any;

  let dragging: boolean = false;

  const handleClick = (ev: any) => {
    const ratio = clamp(
      0,
      1,
      (ev.pageX - container.getBoundingClientRect().x) / width
    );
    dispatch("change", ratio);
  };

  const handleMouseMove = (ev: any) => {
    if (!dragging) {
      return;
    }
    const ratio = clamp(
      0,
      1,
      (ev.pageX - container.getBoundingClientRect().x) / width
    );
    dispatch("change", ratio);
  };
</script>

<svelte:body
  on:mouseup={() => {
    dragging = false;
  }} />

<div class="text-center">
  <p class="text-xs text-gray-400">crossfader</p>
  <div
    class="w-72 h-8 relative bg-gray-800 hover:bg-gray-700 cursor-move"
    bind:clientWidth={width}
    bind:this={container}
    on:click={handleClick}
    on:mousemove={handleMouseMove}
    on:mousedown={() => {
      dragging = true;
    }}
  >
    <div
      class="absolute transform -translate-x-1/2 top-0 w-1 h-full bg-blue-500"
      style={`left: ${value * 100}%`}
    />
  </div>
</div>
