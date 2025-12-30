<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton';
</script>

<div class="container mx-auto p-8 space-y-8">
	<h1 class="h1">Skeleton UI Styleguide</h1>
	<p class="text-lg">Testing all Skeleton components and theming system</p>

	<!-- Buttons Section -->
	<section class="space-y-4">
		<h2 class="h2">Buttons</h2>
		<div class="flex flex-wrap gap-4">
			<button class="btn variant-filled">Default</button>
			<button class="btn variant-filled-primary">Primary</button>
			<button class="btn variant-filled-secondary">Secondary</button>
			<button class="btn variant-filled-tertiary">Tertiary</button>
			<button class="btn variant-filled-success">Success</button>
			<button class="btn variant-filled-warning">Warning</button>
			<button class="btn variant-filled-error">Error</button>
		</div>
		<div class="flex flex-wrap gap-4">
			<button class="btn variant-ghost">Ghost</button>
			<button class="btn variant-ghost-primary">Primary Ghost</button>
			<button class="btn variant-soft">Soft</button>
			<button class="btn variant-ringed">Ringed</button>
		</div>
	</section>

	<!-- Cards Section -->
	<section class="space-y-4">
		<h2 class="h2">Cards</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="card p-4 variant-ghost">
				<header class="card-header">
					<h3 class="h3">Card Title</h3>
				</header>
				<section class="p-4">
					<p>This is a card with variant-ghost styling.</p>
				</section>
				<footer class="card-footer">
					<button class="btn variant-filled-primary">Action</button>
				</footer>
			</div>

			<div class="card p-4 variant-soft-primary">
				<header class="card-header">
					<h3 class="h3">Primary Card</h3>
				</header>
				<section class="p-4">
					<p>This is a card with variant-soft-primary styling.</p>
				</section>
			</div>

			<div class="card p-4 variant-filled-secondary">
				<header class="card-header">
					<h3 class="h3 text-white">Secondary Card</h3>
				</header>
				<section class="p-4">
					<p class="text-white">This is a card with variant-filled-secondary styling.</p>
				</section>
			</div>
		</div>
	</section>

	<!-- Forms Section -->
	<section class="space-y-4">
		<h2 class="h2">Form Elements</h2>
		<div class="space-y-4 max-w-md">
			<label class="label">
				<span>Text Input</span>
				<input class="input" type="text" placeholder="Enter your name..." />
			</label>

			<label class="label">
				<span>Email Input</span>
				<input class="input" type="email" placeholder="email@example.com" />
			</label>

			<label class="label">
				<span>Select</span>
				<select class="select">
					<option value="1">Option 1</option>
					<option value="2">Option 2</option>
					<option value="3">Option 3</option>
				</select>
			</label>

			<label class="label">
				<span>Textarea</span>
				<textarea class="textarea" rows="4" placeholder="Enter some text..."></textarea>
			</label>

			<label class="flex items-center space-x-2">
				<input class="checkbox" type="checkbox" />
				<p>Checkbox Option</p>
			</label>

			<label class="flex items-center space-x-2">
				<input class="radio" type="radio" name="radio-group" />
				<p>Radio Option 1</p>
			</label>
			<label class="flex items-center space-x-2">
				<input class="radio" type="radio" name="radio-group" />
				<p>Radio Option 2</p>
			</label>
		</div>
	</section>

	<!-- App Bar Section -->
	<section class="space-y-4">
		<h2 class="h2">Navigation (App Bar)</h2>
		<AppBar background="bg-surface-100-800-token">
			<svelte:fragment slot="lead">
				<strong class="text-xl">Navigation</strong>
			</svelte:fragment>
			<svelte:fragment slot="default">
				<div class="flex gap-4">
					<a href="/" class="btn btn-sm variant-ghost-surface">Home</a>
					<a href="/dashboard" class="btn btn-sm variant-ghost-surface">Dashboard</a>
					<a href="/styleguide" class="btn btn-sm variant-filled-primary">Styleguide</a>
				</div>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<button class="btn btn-sm variant-filled">Login</button>
			</svelte:fragment>
		</AppBar>
	</section>

	<!-- Typography Section -->
	<section class="space-y-4">
		<h2 class="h2">Typography</h2>
		<div class="space-y-2">
			<h1 class="h1">Heading 1</h1>
			<h2 class="h2">Heading 2</h2>
			<h3 class="h3">Heading 3</h3>
			<h4 class="h4">Heading 4</h4>
			<p class="text-xl">Large paragraph text</p>
			<p>Regular paragraph text</p>
			<p class="text-sm">Small text</p>
			<p class="text-xs">Extra small text</p>
		</div>
	</section>

	<!-- Color Swatches -->
	<section class="space-y-4">
		<h2 class="h2">Color Palette</h2>
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
			<div class="card p-4 variant-filled-primary">
				<p class="text-white font-bold">Primary</p>
			</div>
			<div class="card p-4 variant-filled-secondary">
				<p class="text-white font-bold">Secondary</p>
			</div>
			<div class="card p-4 variant-filled-tertiary">
				<p class="text-white font-bold">Tertiary</p>
			</div>
			<div class="card p-4 variant-filled-success">
				<p class="text-white font-bold">Success</p>
			</div>
			<div class="card p-4 variant-filled-warning">
				<p class="text-white font-bold">Warning</p>
			</div>
			<div class="card p-4 variant-filled-error">
				<p class="text-white font-bold">Error</p>
			</div>
			<div class="card p-4 variant-filled-surface">
				<p class="font-bold">Surface</p>
			</div>
		</div>
	</section>
</div>
