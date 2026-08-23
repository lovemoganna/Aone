import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['diff']
	},
	ssr: {
		noExternal: ['diff']
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) {
						if (id.includes('@codemirror') || id.includes('codemirror')) {
							return 'vendor-codemirror';
						}
						if (id.includes('@viz-js') || id.includes('dagre')) {
							return 'vendor-graph';
						}
						if (id.includes('lucide-svelte')) {
							return 'vendor-icons';
						}
						if (
							id.includes('diff') ||
							id.includes('highlight.js') ||
							id.includes('fuse.js') ||
							id.includes('jsonpath-plus') ||
							id.includes('js-yaml')
						) {
							return 'vendor-utils';
						}
					}
				}
			}
		},
		chunkSizeWarningLimit: 1000
	}
});
