<script lang="ts">
  import { onMount } from "svelte";
  import Player from "$lib/Player.svelte";
  import Crossfader from "$lib/Crossfader.svelte";
  import { crossfader } from "$lib/crossfader";
  import type { Track } from "$lib/track";

  type Selected = "left" | "right";

  let selected: Selected = "left";

  let tracks: Array<Track> = [];

  let loadingTracks: boolean = false;

  let page = 0;

  const handleKeyPress = (ev: any) => {
    if (ev.key === "t") {
      selected = selected === "left" ? "right" : "left";
    }
  };

  const loadNewPage = async () => {
    loadingTracks = true;
    try {
      const res = await fetch(`/hictracks?page=${page}`);
      const newTracks = await res.json();
      tracks = [...tracks, ...newTracks];
      page = page + 1;
      loadingTracks = false;
    } catch (err) {
      console.warn(err);
      loadingTracks = false;
    }
  };

  onMount(() => {
    loadNewPage();
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
    {loadingTracks}
    first
    on:select={() => {
      selected = "left";
    }}
    on:requestNewTracks={loadNewPage}
  />
  <Player
    class="col-span-1"
    {tracks}
    {loadingTracks}
    active={selected === "right"}
    on:select={() => {
      selected = "right";
    }}
    on:requestNewTracks={loadNewPage}
  />
</div>
<div class="p-4 flex items-center justify-center">
  <Crossfader
    value={$crossfader}
    on:change={(ev) => {
      crossfader.set(ev.detail, { hard: true });
    }}
  />
</div>
