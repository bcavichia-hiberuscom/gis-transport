import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
            '@gis/shared': path.resolve(__dirname, '../../packages/shared/src'),
            '@gis/database': path.resolve(__dirname, '../../packages/database/src'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
    },
});
