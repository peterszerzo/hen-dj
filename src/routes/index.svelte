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

<div class="container">
  <Player selected={selected === "left"} />
  <Player selected={selected === "right"} />
</div>

<style>
  .container {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 20px;
  }
</style>
