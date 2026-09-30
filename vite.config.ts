import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

// base: the site lives at https://seungwonbeck.github.io/por/ (GitHub Pages project site)
export default defineConfig({ base: '/por/', plugins: [react(), tailwind()] })
