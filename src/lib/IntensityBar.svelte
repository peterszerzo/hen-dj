<script lang="ts">
  export let value = 0;
</script>

<div class="flex flex-col space-y-2">
  {#each [0, 1, 2, 3, 4] as index}
    <span
      class={`inline-block w-1 h-6 ${
        value > (4 - index) / 4 ? "bg-white" : "bg-gray-800"
      }`}
    />
  {/each}
</div>
