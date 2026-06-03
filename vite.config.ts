import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    //    // ✅ ADD THIS BLOCK
    // optimizeDeps: {
    //     include: ['quill'],
    // },

    // build: {
    //     commonjsOptions: {
    //         include: [/node_modules/],
    //     },
    // },
    // server: {
    //     host: '0.0.0.0', // Explicitly set the host
    //     port: 5173,
    //     cors: true,
    //     hmr: {
    //         // host: '192.168.1.37',
    //         host: '192.168.18.112',
    //         protocol: 'ws',
    //     }
    // }
});




