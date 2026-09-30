import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

// base: the site lives at https://seungwonbeck.github.io/Portfolio2.0/ (GitHub Pages project site)
export default defineConfig({ base: '/Portfolio2.0/', plugins: [react(), tailwind()] })
