import { join } from 'path';
import type { Config } from 'tailwindcss';
import { skeleton } from '@skeletonlabs/tw-plugin';

const config = {
	// 1. Set the dark mode to class
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		// 2. Append the path for the Skeleton NPM package and files:
		join(require.resolve(
			'@skeletonlabs/skeleton'),
			'../**/*.{html,js,svelte,ts}'
		)
	],
	theme: {
		extend: {},
	},
	plugins: [
		// 3. Append the Skeleton plugin (no forms/typography to avoid errors if missing)
		skeleton({
			themes: {
				preset: [
					{ name: "cerberus", enhancements: true }
				]
			}
		})
	]
} satisfies Config;

export default config;
