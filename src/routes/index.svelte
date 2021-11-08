<script lang="ts">
  import Player from "$lib/Player.svelte";
</script>

<div class="container">
  <Player />
  <Player />
</div>

<style>
  .container {
    display: flex;
  }

  .container > :global(*) {
    flex-grow: 1;
  }
</style>
