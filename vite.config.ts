import { defineConfig } from 'vite'
import express from './express-plugin' //Add this

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [express('server')],  // Adjust this
})
