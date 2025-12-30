<script lang="ts">
	import '../app.postcss';
	import { ModeWatcher } from 'mode-watcher';
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
</script>

<ModeWatcher />

<AppShell>
	<svelte:fragment slot="header">
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="text-xl uppercase">YAPPMA</strong>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<ThemeSwitcher />
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>

	<!-- Page content -->
	<slot />

	<svelte:fragment slot="pageFooter">
		<div class="p-4 text-center text-sm">
			<p>YAPPMA - Yet Another Personal Portfolio Management App</p>
		</div>
	</svelte:fragment>
</AppShell>
