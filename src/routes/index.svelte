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
    fetch("/tracks")
      .then((res) => res.json())
      .then(console.log.bind(console));
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  });
</script>

<div class="grid grid-cols-2">
  <Player
    class="col-span-1 border-r border-gray-800"
    selected={selected === "left"}
    flippedLayout
  />
  <Player class="col-span-1" selected={selected === "right"} />
</div>
