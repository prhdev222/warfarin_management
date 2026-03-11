import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // สำหรับ GitHub Pages: เปลี่ยน base เป็นชื่อ repo
  // base: '/warfarin-calculator/',
  // สำหรับ Vercel/Netlify: ใช้ '/' (default)
  base: '/',
})
