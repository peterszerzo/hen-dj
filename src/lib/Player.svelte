<script lang="ts">
  import { onMount } from "svelte";
  import { equals } from "ramda";
  import { analyzeSong } from "$lib/audio";

  let highFreq = 1280.0;
  let lowFreq = 160.0;
  let midFreq = 720;

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

  let worker: any;

  let playing: boolean = false;

  let d: Float32Array | null = null;

  let canvasElement: HTMLCanvasElement;

  const drawWaveform = (canvasElement: HTMLCanvasElement, d: Float32Array) => {
    const dim = (canvasElement.parentNode as any)?.offsetWidth;
    canvasElement.width = dim;
    const ctx = canvasElement.getContext("2d");
    ctx.fillStyle = "#fff";
    d.forEach((value, index) => {
      if (index % 500 === 0) {
        ctx.fillRect((dim * index) / (d.length - 1), 50 + 30 * value, 1, 1);
      }
    });
  };

  $: d && drawWaveform(canvasElement, d);

  let loadedFile: { name: string; type: string; duration?: number } | null =
    null;

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
    if (ev.key === "Escape") {
      keys = [];
      return;
    }
    let tempKeys = [...keys, ev.key];
    if (equals(tempKeys, [" "])) {
      keys = [];
      playing = !playing;
      return;
    }
    if (equals(tempKeys, ["d", "l"])) {
      keys = [];
      lowfValue = -24;
      return;
    }
    if (equals(tempKeys, ["i", "l"])) {
      keys = [];
      lowfValue = 0;
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
      analyzeSong(file).then((res) => {
        d = res;
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

<div class="player">
  <p class="select-bar">
    {#if selected}*{:else}.{/if}
  </p>
  {#if loadedFile}
    <div class="song">
      <p>{loadedFile.name}</p>
      <p>{Math.floor(currentTime)} / {Math.floor(loadedFile.duration || 0)}</p>
      {#if loadedFile?.duration}
        <input
          type="range"
          min="0"
          max="100"
          step="0.01"
          style="width: 100%"
          value={(currentTime / loadedFile.duration) * 100}
          on:input={handleRangeInput}
        />
      {/if}
    </div>
  {:else}
    <label class="file-input">
      <input type="file" on:input={handleFileInput} />
      <span>Select a file</span>
    </label>
  {/if}
  <canvas width="100%" height="100" bind:this={canvasElement} />
  <label class="slider">
    <span>Volume</span>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={volValue}
      on:input={handleVolInput}
    />
  </label>
  <label class="slider">
    <span>High</span>
    <input
      type="range"
      min="-24"
      max="24"
      step="0.1"
      value={highfValue}
      on:input={handleHighfInput}
    />
  </label>
  <label class="slider">
    <span>Mid</span>
    <input
      type="range"
      min="-24"
      max="24"
      step="0.1"
      value={midfValue}
      on:input={handleMidfInput}
    />
  </label>
  <label class="slider">
    <span>Low</span>
    <input
      type="range"
      min="-24"
      max="24"
      step="0.1"
      value={lowfValue}
      on:input={handleLowfInput}
    />
  </label>
  <button
    class="play-pause-button"
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

<style>
  .player > * + * {
    margin-top: 20px;
  }

  .file-input {
    display: flex;
    width: 100%;
    height: 180px;
    align-items: center;
    justify-content: center;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
  }

  input[type="file"] {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .file-input:hover {
    background-color: #232323;
  }

  .song {
    height: 180px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.3);
    align-items: center;
    justify-content: center;
  }

  .slider {
    display: block;
  }

  .play-pause-button {
    display: inline-block;
    padding: 15px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 0;
    background-color: #fff;
    color: #000;
  }

  .select-bar {
    text-align: center;
  }

  .play-pause-button:hover {
    background-color: #efefef;
  }
</style>
