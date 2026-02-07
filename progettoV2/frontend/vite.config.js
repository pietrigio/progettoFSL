import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/index': 'http://localhost:3000',
      '/upload': 'http://localhost:3000'
    }
  }
})


/** 
 *PROGETTO INIZIALE
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
*/