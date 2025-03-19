import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        open: false,
        port: 1573,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:38888',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api/, ''),
                ws: true,
            },
            '/test_1': {
                target: 'https://epimore.cn',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/test_1/, '')
            }
        }
    }
})
