<script lang="ts">
  import Player from "$lib/Player.svelte";

  type Selected = "left" | "right";

  let selected: Selected = "left";
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
