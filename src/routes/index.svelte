<script lang="ts">
  import { onMount } from "svelte";
  import Player from "$lib/Player.svelte";
  import type { Track } from "$lib/track";

  type Selected = "left" | "right";

  let selected: Selected = "left";

  let tracks: Array<Track> = [];

  const handleKeyPress = (ev: any) => {
    if (ev.key === "t") {
      selected = selected === "left" ? "right" : "left";
    }
  };

  onMount(() => {
    fetch("/tracks")
      .then((res) => res.json())
      .then((newTracks) => {
        tracks = newTracks;
      });
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  });
</script>

<div class="grid grid-cols-2 h-full">
  <Player
    class="col-span-1"
    selected={selected === "left"}
    {tracks}
    backgroundImage="https://ipfs.io/ipfs/QmYP8wsUT9ExFC1WJiSPod18gbJPwxdZtfq7b34dxW4kKL"
    flippedLayout
  />
  <Player
    class="col-span-1"
    {tracks}
    selected={selected === "right"}
    backgroundImage="https://ipfs.io/ipfs/QmYP8wsUT9ExFC1WJiSPod18gbJPwxdZtfq7b34dxW4kKL"
  />
</div>
