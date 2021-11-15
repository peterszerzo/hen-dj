<script lang="ts">
  import { onMount } from "svelte";
  import Player from "$lib/Player.svelte";

  type Selected = "left" | "right";

  let selected: Selected = "left";

  const handleKeyPress = (ev: any) => {
    if (ev.key === "t") {
      selected = selected === "left" ? "right" : "left";
    }
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  });
</script>

<div class="grid grid-cols-2 gap-x-8 p-8">
  <Player selected={selected === "left"} flippedLayout />
  <Player selected={selected === "right"} />
</div>
