<script lang="ts">
  import { onMount } from "svelte";
  import { analyzeSong, formatSeconds } from "$lib/audio";
  import type { SongAnalysis } from "$lib/audio";
  import { drawSongAnalysis } from "./draw";
  import { validSequence } from "./keyboard";

  let highFreq = 1280.0;
  let lowFreq = 160.0;
  let midFreq = 720;

  export let flippedLayout: boolean = false;

  export let selected: boolean = false;

  let element: HTMLAudioElement | null = null;
  let context: AudioContext | null = null;

  let lowf: BiquadFilterNode | null = null;
  let highf: BiquadFilterNode | null = null;
  let midf: BiquadFilterNode | null = null;
  let vol: GainNode | null = null;

  let lowfValue: number = 0;
  let midfValue: number = 0;
  let highfValue: number = 0;
  let volValue: number = 1;

  let playing: boolean = false;

  let songAnalysis: SongAnalysis | null = null;

  let loadedFile: { name: string; type: string; duration?: number } | null =
    null;

  const drawSongAnalysisAction = (
    node: HTMLCanvasElement,
    songAnalysis: SongAnalysis | null
  ) => {
    drawSongAnalysis(node, songAnalysis);
    return {
      update(newSongAnalysis: SongAnalysis) {
        drawSongAnalysis(node, newSongAnalysis);
      },
    };
  };

  $: playing ? element?.play() : element?.pause();

  $: if (vol) {
    vol.gain.value = volValue;
  }

  $: if (highf && context) {
    highf.gain.setValueAtTime(highfValue, context.currentTime);
  }

  $: if (midf && context) {
    midf.gain.setValueAtTime(midfValue, context.currentTime);
  }

  $: if (lowf && context) {
    lowf.gain.setValueAtTime(lowfValue, context.currentTime);
  }

  let currentTime: number = 0;

  let keys = [];

  const handleKeyPress = (ev: any) => {
    if (!selected) {
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
        lowfValue = -24 + 24 * ratio;
        return;
      }
      if (sequence.subject === "m") {
        midfValue = -24 + 24 * ratio;
        return;
      }
      if (sequence.subject === "h") {
        highfValue = -24 + 24 * ratio;
        return;
      }
      if (sequence.subject === "v") {
        volValue = ratio;
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

  const handlePlaythrough = () => {
    if (element && loadedFile) {
      loadedFile = { ...loadedFile, duration: element.duration };
    }
  };

  const setupAudio = (audioUrl: string) => {
    context = new AudioContext();
    if (element) {
      element.pause();
      element.removeEventListener("canplaythrough", handlePlaythrough);
      element.remove();
    }

    element = new Audio();

    element.addEventListener("canplaythrough", handlePlaythrough);

    element.src = audioUrl;

    const sourceNode = context.createMediaElementSource(element);

    lowf = context.createBiquadFilter();
    lowf.type = "lowshelf";
    lowf.frequency.setValueAtTime(lowFreq, context.currentTime);
    lowf.gain.setValueAtTime(lowfValue, context.currentTime);

    midf = context.createBiquadFilter();
    midf.type = "peaking";
    midf.frequency.setValueAtTime(midFreq, context.currentTime);
    midf.Q.setValueAtTime(1.12, context.currentTime);
    midf.gain.setValueAtTime(midfValue, context.currentTime);

    highf = context.createBiquadFilter();
    highf.type = "highshelf";
    highf.frequency.setValueAtTime(highFreq, context.currentTime);
    highf.gain.setValueAtTime(highfValue, context.currentTime);

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
    }, 1000);

    return () => {
      clearInterval(interval);
      element.removeEventListener("canplaythrough", handleRangeInput);
    };
  };

  const handleRangeInput = (ev: any) => {
    const newValue = ev.target.value;
    if (element && loadedFile.duration) {
      element.currentTime = (loadedFile.duration * newValue) / 100;
    }
  };

  const handleVolInput = (ev: any) => {
    volValue = ev.target.value;
  };

  const handleHighfInput = (ev: any) => {
    highfValue = ev.target.value;
  };

  const handleMidfInput = (ev: any) => {
    midfValue = ev.target.value;
  };

  const handleLowfInput = (ev: any) => {
    lowfValue = ev.target.value;
  };

  const handleFileInput = (ev: any) => {
    const file = ev.target.files[0];
    if (file) {
      analyzeSong(file).then((res: SongAnalysis) => {
        songAnalysis = res;
      });
      const name = file.name;
      const type = file.type;
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        loadedFile = { name, type };
        setupAudio(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
</script>

<div class="space-y-4 col-span-1">
  <p class="text-center">
    {#if selected}<span
        class="inline-block w-4 h-4 rounded-full bg-white transition-all"
        style="box-shadow: 0 0 0 2px black, 0 0 0 4px white"
      />{:else}<span class="inline-block w-4 h-4 rounded-full bg-gray-600" />
    {/if}
  </p>
  <label
    class="flex transition-all items-center justify-center p-4 border border-gray-700 hover:bg-gray-900 cursor-pointer h-[180px]"
  >
    <input type="file" class="sr-only" on:input={handleFileInput} />
    {#if loadedFile}
      <div class="w-full flex flex-col justify-between h-full">
        <p class="text-lg">{loadedFile.name}</p>
        <div class="flex items-end justify-between">
          <p>
            {formatSeconds(currentTime)} / {formatSeconds(
              loadedFile.duration || 0
            )}
          </p>
          {#if songAnalysis}
            <div>
              <p class="text-sm text-right">BPM</p>
              <p class="text-2xl">{songAnalysis.bpm}</p>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <span>Select a file (mp3, wav, flac)</span>
    {/if}
  </label>
  <canvas
    class="border border-gray-700"
    width="100%"
    height="100"
    use:drawSongAnalysisAction={songAnalysis}
  />
  <input
    type="range"
    min="0"
    max="100"
    step="0.01"
    style="width: 100%"
    value={(currentTime / (loadedFile?.duration || 400)) * 100}
    on:input={handleRangeInput}
  />
  <div class={`flex items-end justify-between`}>
    <div class={`space-y-4 ${flippedLayout ? "order-2" : "order-1"}`}>
      <div class="space-y-1">
        <label class="block">
          <p class="text-xs">highs</p>
          <input
            type="range"
            min="-24"
            max="24"
            step="0.1"
            value={highfValue}
            on:input={handleHighfInput}
          />
        </label>
        <label class="block">
          <p class="text-xs">mids</p>
          <input
            type="range"
            min="-24"
            max="24"
            step="0.1"
            value={midfValue}
            on:input={handleMidfInput}
          />
        </label>
        <label class="block">
          <p class="text-xs">lows</p>
          <input
            type="range"
            min="-24"
            max="24"
            step="0.1"
            value={lowfValue}
            on:input={handleLowfInput}
          />
        </label>
      </div>
      <label class="block">
        <p class="text-xs">volume</p>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volValue}
          on:input={handleVolInput}
        />
      </label>
    </div>
    <div class={`${flippedLayout ? "order-1" : "order-2"}`}>
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
  .song {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
