<script lang="ts">
  import { onMount } from "svelte";
  import { repeat } from "ramda";

  let dots = 2;

  const tick = () => {
    dots = (dots + 1) % 3;
  };

  onMount(() => {
    const interval = setInterval(tick, 500);
    return () => {
      clearInterval(interval);
    };
  });
</script>

<p class="text-sm px-2 py-1">loading{repeat(".", dots + 1).join("")}</p>
