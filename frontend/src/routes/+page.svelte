<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-8 text-center">
		<h1 class="h1 text-primary-500">Welcome to YAPPMA</h1>
		<p class="text-xl">Yet Another Personal Portfolio Management App</p>
		<div class="flex justify-center gap-4">
			<button class="btn variant-filled-primary" on:click={() => goto('/styleguide')}>
				View Styleguide
			</button>
			<button class="btn variant-ghost-surface" on:click={() => goto('/dashboard')}>
				Go to Dashboard
			</button>
		</div>
	</div>
</div>
