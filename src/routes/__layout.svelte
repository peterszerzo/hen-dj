<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import Shortcuts from "$lib/Shortcuts.svelte";
  import { crossfader } from "$lib/crossfader";

  let shortcutsExpanded: boolean = false;

  const handleEscape = (ev: any) => {
    if (ev.key === "Escape") {
      shortcutsExpanded = false;
    }
  };

  onMount(() => {
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  });
</script>

{#if shortcutsExpanded}
  <div
    class="absolute w-full h-full flex items-start justify-between top-0 left-0 bg-black p-2 space-y-4 z-20"
  >
    <Shortcuts />
    <button
      class="text-xs p-2 inline-block rounded flex-none text-gray-400 hover:bg-gray-900"
      on:click={() => {
        shortcutsExpanded = false;
      }}>Close (Esc)</button
    >
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
