import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    // La 3D (three.js) est chargée à part, en arrière-plan : c'est normal qu'elle soit plus lourde.
    chunkSizeWarningLimit: 1200,
  },
})
