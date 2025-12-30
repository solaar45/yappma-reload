<script>
  import '../app.css';
  import ThemeController from '$lib/components/ThemeController.svelte';
</script>

<div class="min-h-screen bg-base-100">
  <nav class="navbar bg-base-200 shadow-lg">
    <div class="flex-1">
      <a href="/" class="btn btn-ghost text-xl">YAPPMA</a>
    </div>
    <div class="flex-none gap-2">
      <ul class="menu menu-horizontal px-1">
        <li><a href="/styleguide">Styleguide</a></li>
      </ul>
      <ThemeController />
    </div>
  </nav>

  <main class="container mx-auto p-4">
    <slot />
  </main>
</div>