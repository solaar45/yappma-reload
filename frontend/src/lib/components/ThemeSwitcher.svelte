<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { toggleMode } from 'mode-watcher';

	let currentTheme = 'skeleton';

	const themes = [
		'skeleton',
		'wintry',
		'modern',
		'rocket',
		'seafoam',
		'vintage',
		'sahara',
		'hamlindigo',
		'gold-nouveau',
		'crimson'
	];

	onMount(() => {
		if (browser) {
			const savedTheme = localStorage.getItem('theme') || 'skeleton';
			currentTheme = savedTheme;
			document.body.setAttribute('data-theme', savedTheme);
		}
	});

	function changeTheme(theme: string) {
		if (browser) {
			currentTheme = theme;
			document.body.setAttribute('data-theme', theme);
			localStorage.setItem('theme', theme);
		}
	}
</script>

<div class="flex items-center gap-4">
	<!-- Dark/Light Mode Toggle -->
	<button
		on:click={toggleMode}
		class="btn btn-sm variant-ghost-surface"
		aria-label="Toggle dark mode"
	>
		<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
			/>
		</svg>
	</button>

	<!-- Theme Selector -->
	<select
		bind:value={currentTheme}
		on:change={() => changeTheme(currentTheme)}
		class="select select-sm w-32"
	>
		{#each themes as theme}
			<option value={theme}>{theme}</option>
		{/each}
	</select>
</div>
