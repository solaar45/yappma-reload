<script lang="ts">
  let modal: HTMLDialogElement;
</script>

<div class="space-y-12 max-w-6xl mx-auto py-8">
  
  <section>
    <h1 class="text-4xl font-bold mb-8">DaisyUI Styleguide</h1>
    <p class="text-lg text-base-content/70">Teste alle Theme-Varianten mit den wichtigsten Komponenten</p>
  </section>

  <!-- Buttons -->
  <section class="space-y-4">
    <h2 class="text-2xl font-bold">Buttons</h2>
    <div class="flex flex-wrap gap-4">
      <button class="btn">Default</button>
      <button class="btn btn-primary">Primary</button>
      <button class="btn btn-secondary">Secondary</button>
      <button class="btn btn-accent">Accent</button>
      <button class="btn btn-ghost">Ghost</button>
      <button class="btn btn-outline">Outline</button>
      <button class="btn btn-outline btn-primary">Primary Outline</button>
      <button class="btn btn-active">Active</button>
      <button class="btn" disabled>Disabled</button>
    </div>
  </section>

  <!-- Forms -->
  <section class="space-y-4">
    <h2 class="text-2xl font-bold">Forms</h2>
    <div class="grid md:grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Text Input</span>
        </label>
        <input type="text" placeholder="Type here" class="input input-bordered w-full" />
      </div>
      
      <div class="form-control">
        <label class="label">
          <span class="label-text">Primary Input</span>
        </label>
        <input type="text" placeholder="Primary" class="input input-bordered input-primary w-full" />
      </div>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">Checkbox</span>
          <input type="checkbox" class="checkbox checkbox-primary" checked />
        </label>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Select</span>
        </label>
        <select class="select select-bordered w-full">
          <option>Option 1</option>
          <option>Option 2</option>
          <option>Option 3</option>
        </select>
      </div>
    </div>
  </section>

  <!-- Badges -->
  <section class="space-y-4">
    <h2 class="text-2xl font-bold">Badges</h2>
    <div class="flex flex-wrap gap-2">
      <div class="badge">Default</div>
      <div class="badge badge-primary">Primary</div>
      <div class="badge badge-secondary">Secondary</div>
      <div class="badge badge-accent">Accent</div>
      <div class="badge badge-ghost">Ghost</div>
      <div class="badge badge-outline">Outline</div>
    </div>
  </section>

  <!-- Cards -->
  <section class="space-y-4">
    <h2 class="text-2xl font-bold">Cards</h2>
    <div class="grid md:grid-cols-3 gap-4">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h3 class="card-title">Card Title</h3>
          <p>This is a card with base-200 background.</p>
          <div class="card-actions justify-end">
            <button class="btn btn-primary btn-sm">Action</button>
          </div>
        </div>
      </div>

      <div class="card bg-primary text-primary-content shadow-xl">
        <div class="card-body">
          <h3 class="card-title">Primary Card</h3>
          <p>This card uses primary colors.</p>
          <div class="card-actions justify-end">
            <button class="btn btn-ghost btn-sm">Action</button>
          </div>
        </div>
      </div>

      <div class="card bg-secondary text-secondary-content shadow-xl">
        <div class="card-body">
          <h3 class="card-title">Secondary Card</h3>
          <p>This card uses secondary colors.</p>
          <div class="card-actions justify-end">
            <button class="btn btn-ghost btn-sm">Action</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Table -->
  <section class="space-y-4">
    <h2 class="text-2xl font-bold">Table</h2>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Job</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr class="hover">
            <th>1</th>
            <td>Cy Ganderton</td>
            <td>Quality Control</td>
            <td><div class="badge badge-success">Active</div></td>
          </tr>
          <tr class="hover">
            <th>2</th>
            <td>Hart Hagerty</td>
            <td>Desktop Support</td>
            <td><div class="badge badge-warning">Pending</div></td>
          </tr>
          <tr class="hover">
            <th>3</th>
            <td>Brice Swyre</td>
            <td>Tax Accountant</td>
            <td><div class="badge badge-error">Inactive</div></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Alerts -->
  <section class="space-y-4">
    <h2 class="text-2xl font-bold">Alerts</h2>
    <div class="space-y-2">
      <div class="alert">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Info alert</span>
      </div>
      <div class="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Success alert</span>
      </div>
      <div class="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <span>Warning alert</span>
      </div>
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Error alert</span>
      </div>
    </div>
  </section>

  <!-- Modal Demo -->
  <section class="space-y-4">
    <h2 class="text-2xl font-bold">Modal</h2>
    <button class="btn btn-primary" on:click={() => modal?.showModal()}>Open Modal</button>
    <dialog bind:this={modal} class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Modal Title</h3>
        <p class="py-4">This is a modal dialog. Press ESC or click the button below to close.</p>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn">Close</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </section>

</div>