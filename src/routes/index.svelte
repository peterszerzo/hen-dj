<script lang="ts">
  import { onMount } from "svelte";
  import Player from "$lib/Player.svelte";
  import Crossfader from "$lib/Crossfader.svelte";
  import { crossfader } from "$lib/crossfader";
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
    fetch("/hictracks")
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
    active={selected === "left"}
    {tracks}
    first
    on:select={() => {
      selected = "left";
    }}
  />
  <Player
    class="col-span-1"
    {tracks}
    active={selected === "right"}
    on:select={() => {
      selected = "right";
    }}
  />
</div>
<div class="p-4 flex items-center justify-center">
  <Crossfader
    value={$crossfader}
    on:change={(ev) => {
      crossfader.set(ev.detail);
    }}
  />
</div>
