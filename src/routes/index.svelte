<script lang="ts">
  import Player from "$lib/Player.svelte";
</script>

<div class="container">
  <Player />
  <Player />
</div>

<style>
  .container {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 20px;
  }
</style>
