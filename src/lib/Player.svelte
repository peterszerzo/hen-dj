<script context="module" lang="ts">
  export const ssr = false;
</script>

<script lang="ts">
  let highShelfFreq = 1280.0;
  let lowShelfFreq = 160.0;

  let element: HTMLAudioElement | null = null;
  let context: AudioContext | null = null;

  let lpf: BiquadFilterNode | null = null;
  let hpf: BiquadFilterNode | null = null;
  let vol: GainNode | null = null;

  let lpfValue: number = 1;
  let hpfValue: number = 1;
  let volValue: number = 1;

  let playing: boolean = false;

  let loadedFile: { name: string; type: string; duration?: number } | null =
    null;

  $: playing ? element?.play() : element?.pause();

  $: if (vol) {
    vol.gain.value = volValue;
  }

  $: if (hpf && context) {
    hpf.gain.setValueAtTime(hpfValue, context.currentTime);
  }

  $: if (lpf && context) {
    lpf.gain.setValueAtTime(lpfValue, context.currentTime);
  }

  let currentTime: number = 0;

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

    lpf = context.createBiquadFilter();
    lpf.type = "lowshelf";
    lpf.frequency.setValueAtTime(lowShelfFreq, context.currentTime);
    lpf.gain.setValueAtTime(lpfValue, context.currentTime);

    hpf = context.createBiquadFilter();
    hpf.type = "highshelf";
    hpf.frequency.setValueAtTime(highShelfFreq, context.currentTime);
    hpf.gain.setValueAtTime(hpfValue, context.currentTime);

    vol = context.createGain();
    vol.gain.value = 0.1;

    sourceNode.connect(lpf);
    lpf.connect(hpf);
    hpf.connect(vol);
    vol.connect(context.destination);

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

  const handleHpfInput = (ev: any) => {
    hpfValue = ev.target.value;
  };

  const handleLpfInput = (ev: any) => {
    lpfValue = ev.target.value;
  };

  const handleFileInput = (ev: any) => {
    const file = ev.target.files[0];
    if (file) {
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
  <label>
    <input type="file" on:input={handleFileInput} />
    <span class="file-picker">Select a file</span>
  </label>
  {#if loadedFile}
    <p>{loadedFile.name}</p>
    <p>{loadedFile.duration || "..."}</p>
  {/if}
  <div>
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
      min="0"
      max="1"
      step="0.01"
      value={hpfValue}
      on:input={handleHpfInput}
    />
  </label>
  <label class="slider">
    <span>Low</span>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={lpfValue}
      on:input={handleLpfInput}
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

  .slider {
    display: block;
  }

  .file-picker {
    padding: 10px;
    cursor: pointer;
  }

  .file-picker:hover {
    background-color: #efefef;
  }

  .play-pause-button {
    display: inline-block;
    padding: 25px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 0;
    background-color: #000;
    color: #fff;
  }

  .play-pause-button:hover {
    background-color: #343434;
  }
</style>
