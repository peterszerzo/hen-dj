<script lang="ts">
  import "../app.css";

  let shortcutsExpanded: boolean = false;
</script>

{#if shortcutsExpanded}
  <div class="absolute w-full h-full top-0 left-0 bg-black p-8 space-y-4 z-20">
    <button
      class="text-xs inline-block"
      on:click={() => {
        shortcutsExpanded = false;
      }}>[x] Close</button
    >
    <h1 class="text-xl">Keybindings</h1>
    <p>Keybindings are VIM-inspired :).</p>
    <ul>
      <li>t - switch deck</li>
      <li>p - play track</li>
      <li>, - decrease BPM</li>
      <li>. - increase BPM</li>
      <li>/ - reset BPM</li>
      <li>[ - nudge forward</li>
      <li>] - nudge backward</li>
      <li>{"{"} - move one bar forward</li>
      <li>{"}"} - move one bar backward</li>
      <li>dv - remove volume</li>
      <li>dh - remove highs</li>
      <li>dm - remove mids</li>
      <li>dl - remove lows</li>
      <li>iv - insert volume</li>
      <li>ih - insert highs</li>
      <li>im - insert mids</li>
      <li>il - insert lows</li>
    </ul>
  </div>
{/if}

<header
  class="py-4 px-8 border-b border-gray-800 flex justify-between items-center"
>
  <a class="inline-block" href="/">HEN DJ</a>
  <button
    class="text-xs inline-block text-gray-500 hover:text-gray-400"
    on:click={() => {
      shortcutsExpanded = true;
    }}>Keybindings</button
  >
</header>

<main class="flex-grow">
  <slot />
</main>

<footer class="py-4 px-8 border-t border-gray-800">
  <p class="text-gray-500 text-xs text-right">
    by <a
      class="border-b border-current hover:text-gray-400"
      href="https://peterszerzo.com">Captain Concern</a
    >
  </p>
</footer>
