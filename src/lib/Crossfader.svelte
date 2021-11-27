<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{ change: number }>();

  export let value: number;

  let width: number;
  let container: any;

  const handleClick = (ev: any) => {
    const ratio = (ev.pageX - container.getBoundingClientRect().x) / width;
    dispatch("change", ratio);
  };
</script>

<div class="text-center">
  <p class="text-xs text-gray-400">crossfader</p>
  <div
    class="w-72 h-8 bg-gray-800 hover:bg-gray-700"
    bind:clientWidth={width}
    bind:this={container}
    on:click={handleClick}
  >
    <div
      class="absolute transform -translate-x-1/2 top-0 w-1 h-full bg-blue-500"
      style={`left: ${value * 100}%`}
    />
  </div>
</div>
