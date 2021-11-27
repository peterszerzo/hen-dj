<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { crossfader, getCrossfaderAdjustment } from "$lib/crossfader";
  import { spring } from "svelte/motion";
  import type { Track } from "$lib/track";
  import { analyzeSong, formatSeconds } from "$lib/audio";
  import IntensityBar from "$lib/IntensityBar.svelte";
  import Waveform from "$lib/Waveform.svelte";
  import type { SongAnalysis } from "$lib/audio";
  import { validSequence } from "./keyboard";

  let highFreq = 1280.0;
  let lowFreq = 160.0;
  let midFreq = 720;

  const dispatch = createEventDispatcher<{ select: unknown }>();

  export let tracks: Array<Track> = [];

  export let first: boolean = false;

  export let active: boolean = false;

  let element: HTMLAudioElement | null = null;
  let context: AudioContext | null = null;

  let lowf: BiquadFilterNode | null = null;
  let highf: BiquadFilterNode | null = null;
  let midf: BiquadFilterNode | null = null;
  let vol: GainNode | null = null;

  const lowfValue = spring(0, {
    stiffness: 0.001,
    damping: 0.05,
  });
  const midfValue = spring(0, {
    stiffness: 0.001,
    damping: 0.05,
  });
  const highfValue = spring(0, {
    stiffness: 0.001,
    damping: 0.05,
  });
  const volValue = spring(1, {
    stiffness: 0.001,
    damping: 0.06,
  });

  let bpmDiff: number = 0;

  let playing: boolean = false;

  let songAnalysis: SongAnalysis | null = null;

  let selectedTrack: Track | null = null;

  const adjustPlayback = (bpmDiff: number) => {
    if (element && songAnalysis) {
      const baseBpm = songAnalysis.bpm;
      element.playbackRate = (baseBpm + bpmDiff) / baseBpm;
    }
  };

  $: playing ? element?.play() : element?.pause();

  $: adjustPlayback(bpmDiff);

  $: crossfaderVolumeAdjustment = getCrossfaderAdjustment($crossfader, first);

  $: if (vol) {
    vol.gain.value = $volValue & crossfaderVolumeAdjustment;
  }

  $: if (highf && context) {
    highf.gain.setValueAtTime($highfValue, context.currentTime);
  }

  $: if (midf && context) {
    midf.gain.setValueAtTime($midfValue, context.currentTime);
  }

  $: if (lowf && context) {
    lowf.gain.setValueAtTime($lowfValue, context.currentTime);
  }

  let currentTime: number = 0;

  let keys = [];

  const handleKeyPress = (ev: any) => {
    if (!active) {
      return;
    }
    // Global keys
    if (keys.length === 0 && ev.key === "t") {
      return;
    }
    if (ev.key === "Escape") {
      keys = [];
      return;
    }
    let tempKeys = [...keys, ev.key];
    const sequence = validSequence(tempKeys);
    if (sequence) {
      keys = [];
      if (sequence.verb === ",") {
        bpmDiff = Math.round(bpmDiff * 10 - 1) / 10;
        return;
      }
      if (sequence.verb === ".") {
        bpmDiff = Math.round(bpmDiff * 10 + 1) / 10;
        return;
      }
      if (sequence.verb === "/") {
        bpmDiff = 0;
        return;
      }
      if (sequence.verb === "[" && element && songAnalysis) {
        element.currentTime -= ((60 / songAnalysis.bpm) * 1) / 8;
        return;
      }
      if (sequence.verb === "]" && element && songAnalysis) {
        element.currentTime += ((60 / songAnalysis.bpm) * 1) / 8;
        return;
      }
      if (sequence.verb === "{" && element && songAnalysis) {
        element.currentTime -= (60 / songAnalysis.bpm) * 1;
        return;
      }
      if (sequence.verb === "}" && element && songAnalysis) {
        element.currentTime += (60 / songAnalysis.bpm) * 1;
        return;
      }
      if (sequence.verb === "p") {
        playing = !playing;
        return;
      }
      const ratio =
        sequence.verb === "d"
          ? 0
          : sequence.verb === "i"
          ? 1
          : sequence.verb === "s"
          ? (sequence.numberModifier || 0) / 8
          : 0;
      if (sequence.subject === "l") {
        lowfValue.update(() => -24 + 24 * ratio);
        return;
      }
      if (sequence.subject === "m") {
        midfValue.update(() => -24 + 24 * ratio);
        return;
      }
      if (sequence.subject === "h") {
        highfValue.update(() => -24 + 24 * ratio);
        return;
      }
      if (sequence.subject === "v") {
        volValue.update(() => ratio);
        return;
      }
      return;
    }
    keys = tempKeys;
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  });

  const setupAudio = (audioUrl: string) => {
    context = new AudioContext();

    if (element) {
      element.pause();
      element.remove();
    }

    element = new Audio();

    element.crossOrigin = "anonymous";

    element.src = audioUrl;

    const sourceNode = context.createMediaElementSource(element);

    lowf = context.createBiquadFilter();
    lowf.type = "lowshelf";
    lowf.frequency.setValueAtTime(lowFreq, context.currentTime);
    lowf.gain.setValueAtTime($lowfValue, context.currentTime);

    midf = context.createBiquadFilter();
    midf.type = "peaking";
    midf.frequency.setValueAtTime(midFreq, context.currentTime);
    midf.Q.setValueAtTime(1.12, context.currentTime);
    midf.gain.setValueAtTime($midfValue, context.currentTime);

    highf = context.createBiquadFilter();
    highf.type = "highshelf";
    highf.frequency.setValueAtTime(highFreq, context.currentTime);
    highf.gain.setValueAtTime($highfValue, context.currentTime);

    vol = context.createGain();
    vol.gain.value = 0.1;

    const chain = [sourceNode, lowf, midf, highf, vol];

    chain.forEach((node, index) => {
      node.connect(chain[index + 1] || context.destination);
    });

    const interval = setInterval(() => {
      if (element && playing) {
        currentTime = element.currentTime;
      }
    }, 50);

    return () => {
      clearInterval(interval);
      element.removeEventListener("canplaythrough", handleRangeInput);
    };
  };

  const getIntensity = (
    currentTime: number,
    songAnalysis: SongAnalysis | null
  ) => {
    if (!songAnalysis) {
      return 0;
    }
    const absolute =
      songAnalysis.sample[
        Math.floor(
          (currentTime / songAnalysis.duration) * songAnalysis.sample.length
        )
      ];
    const relative =
      (absolute - songAnalysis.min) / (songAnalysis.max - songAnalysis.min);
    return relative;
  };

  $: intensity = getIntensity(currentTime, songAnalysis);

  const handleRangeInput = (ev: any) => {
    const newValue = ev.target.value;
    if (element && songAnalysis) {
      element.currentTime = (songAnalysis.duration * newValue) / 100;
    }
  };

  const handleVolInput = (ev: any) => {
    volValue.update(() => ev.target.value, { hard: true });
  };

  const handleHighfInput = (ev: any) => {
    highfValue.update(() => ev.target.value, { hard: true });
  };

  const handleMidfInput = (ev: any) => {
    midfValue.update(() => ev.target.value, { hard: true });
  };

  const handleLowfInput = (ev: any) => {
    lowfValue.update(() => ev.target.value, { hard: true });
  };

  const handleFileInput = (ev: any) => {
    const file = ev.target.files[0];
    if (file) {
      songAnalysis = null;
      analyzeSong(file).then((res: SongAnalysis) => {
        songAnalysis = res;
      });
      const name = file.name;
      const type = file.type;
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        selectedTrack = { name, mimetype: type };
        setupAudio(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTrackChoose = () => {
    const trackIndex = first ? 0 : 1;
    if (!tracks[trackIndex]) {
      return;
    }
    songAnalysis = null;
    const track = tracks[trackIndex];
    selectedTrack = track;
    if (track.audio) {
      fetch(track.audio)
        .then((res) => res.blob())
        .then((blob: Blob) => {
          const file = new File([blob], blob.type);
          analyzeSong(file).then((res: SongAnalysis) => {
            songAnalysis = res;
          });
          setupAudio(track.audio);
        });
    }
  };

  let customClass: string = "";
  export { customClass as class };
</script>

<div
  class={`space-y-4 p-8  ${
    selectedTrack?.cover ? "" : first ? "pattern2" : "pattern1"
  } ${customClass}`}
  style={selectedTrack?.cover
    ? `background-image: linear-gradient( rgba(0, 0, 0, ${
        0.7 + 0.1 * intensity
      }), rgba(0, 0, 0, ${0.7 + 0.1 * intensity}) ), url(${
        selectedTrack?.cover
      })`
    : ""}
>
  <p class="text-center">
    {#if active}<button
        class="inline-block w-4 h-4 rounded-full bg-white transition-all"
        style="box-shadow: 0 0 0 2px black, 0 0 0 4px white"
        on:click={() => {
          dispatch("select");
        }}
      />{:else}<button
        class="inline-block w-4 h-4 rounded-full bg-gray-600"
        on:click={() => {
          dispatch("select");
        }}
      />
    {/if}
  </p>
  {#if selectedTrack}
    <div
      on:click={() => {
        selectedTrack = null;
      }}
      class="flex group transition-all text-left items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 cursor-pointer h-[160px]"
    >
      <div class="w-full flex flex-col justify-between h-full">
        <p class="text-lg">{selectedTrack.name}</p>
        <div class="flex items-end justify-between">
          {#if songAnalysis}
            <p>
              {formatSeconds(currentTime)} / {formatSeconds(
                songAnalysis.duration || 0
              )}
            </p>
          {:else}
            <p>...</p>
          {/if}
          {#if songAnalysis}
            <div>
              <p class="text-sm text-right">BPM</p>
              <p class="text-2xl">
                {Number(songAnalysis.bpm + bpmDiff).toFixed(1)}
                <span class="text-xs">{Number(bpmDiff).toFixed(1)}</span>
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-2 gap-x-4">
      <label
        class="flex transition-all text-center col-span-1 items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 cursor-pointer h-[160px]"
      >
        <input type="file" class="sr-only" on:input={handleFileInput} />
        <div>
          <p class="text-gray-400">Select a file</p>
          <p class="space-x-2">
            {#each ["mp3", "wav", "flac"] as extension}
              <span
                class="px-1 py-0.5 text-xs bg-gray-700 rounded text-gray-400"
                >.{extension}</span
              >
            {/each}
          </p>
        </div>
      </label>
      <button
        on:click={handleTrackChoose}
        class="col-span-1 h-[160px] bg-gray-900 hover:bg-gray-800 text-gray-400"
        >Choose from HEN</button
      >
    </div>
  {/if}
  <Waveform
    loading={selectedTrack && !songAnalysis}
    {songAnalysis}
    {currentTime}
    on:changeCurrentTime={(ev) => {
      if (element) {
        currentTime = ev.detail;
        element.currentTime = ev.detail;
      }
    }}
  />
  <div class={`flex items-end justify-between`}>
    <div class={`flex items-center space-x-8 ${first ? "order-2" : "order-1"}`}>
      {#if !first}
        <IntensityBar value={intensity} />
      {/if}
      <div class="space-y-4">
        <div class="space-y-1">
          <label class="block text-center">
            <p class="text-xs text-gray-400">highs</p>
            <input
              type="range"
              min="-24"
              max="24"
              step="0.1"
              value={$highfValue}
              on:input={handleHighfInput}
            />
          </label>
          <label class="block text-center">
            <p class="text-xs text-gray-400">mids</p>
            <input
              type="range"
              min="-24"
              max="24"
              step="0.1"
              value={$midfValue}
              on:input={handleMidfInput}
            />
          </label>
          <label class="block text-center">
            <p class="text-xs text-gray-400">lows</p>
            <input
              type="range"
              min="-24"
              max="24"
              step="0.1"
              value={$lowfValue}
              on:input={handleLowfInput}
            />
          </label>
        </div>
        <label class="block text-center">
          <p class="text-xs text-gray-400">volume</p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={$volValue}
            on:input={handleVolInput}
          />
        </label>
      </div>
      {#if first}
        <IntensityBar value={intensity} />
      {/if}
    </div>
    <div class={`${first ? "order-1" : "order-2"}`}>
      <button
        class="w-16 h-16 transition-all bg-white rounded-full text-black hover:bg-black hover:text-white border-2 border-white p-4"
        on:click={() => {
          playing = !playing;
        }}
      >
        {#if playing}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><rect x="6" y="4" width="4" height="16" /><rect
              x="14"
              y="4"
              width="4"
              height="16"
            /></svg
          >
        {:else}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg
          >
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .pattern1 {
    --color1: #020202;
    --color2: #111;
    --size: 30px;
    background-image: linear-gradient(
        135deg,
        var(--color1) 25%,
        transparent 25%
      ),
      linear-gradient(225deg, var(--color1) 25%, transparent 25%),
      linear-gradient(45deg, var(--color1) 25%, transparent 25%),
      linear-gradient(315deg, var(--color1) 25%, var(--color2) 25%);
    background-position: var(--size) 0, var(--size) 0, 0 0, 0 0;
    background-size: var(--size) var(--size);
    background-repeat: repeat;
  }

  .pattern2 {
    --color1: #020202;
    --color2: #111;
    --size: 30px;
    background-image: linear-gradient(
        135deg,
        var(--color1) 25%,
        transparent 25%
      ),
      linear-gradient(225deg, var(--color1) 25%, transparent 25%),
      linear-gradient(45deg, var(--color1) 25%, transparent 25%),
      linear-gradient(315deg, var(--color1) 25%, var(--color2) 25%);
    background-position: calc(var(--size) / 2) 0, calc(var(--size) / 2) 0, 0 0,
      0 0;
    background-size: var(--size) var(--size);
    background-repeat: repeat;
  }
</style>
