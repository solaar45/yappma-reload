<script lang="ts">
  import { theme, setTheme } from '$lib/stores/theme';

  const themes = ['light', 'dark', 'cupcake', 'nord', 'sunset', 'cyberpunk'];
  
  let currentTheme: string;
  theme.subscribe(value => currentTheme = value);
</script>

<div class="dropdown dropdown-end">
  <div tabindex="0" role="button" class="btn btn-ghost gap-2">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
    <span class="hidden sm:inline">{currentTheme}</span>
  </div>
  <ul tabindex="0" class="dropdown-content menu bg-base-200 rounded-box z-[1] w-52 p-2 shadow-2xl">
    {#each themes as themeOption}
      <li>
        <button 
          class="flex justify-between"
          class:active={currentTheme === themeOption}
          on:click={() => setTheme(themeOption)}
        >
          <span class="capitalize">{themeOption}</span>
          {#if currentTheme === themeOption}
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</div>