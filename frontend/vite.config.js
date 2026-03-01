import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@domusvita/shared-auth': path.resolve(__dirname, '../../domusvita-platform/packages/shared-auth'),
      '@domusvita/shared-ui': path.resolve(__dirname, '../../domusvita-platform/packages/shared-ui'),
      '@/components/ui': path.resolve(__dirname, '../../domusvita-platform/packages/shared-ui/components/ui'),
      '@/hooks/use-toast': path.resolve(__dirname, '../../domusvita-platform/packages/shared-ui/hooks/use-toast'),
      '@/lib/utils': path.resolve(__dirname, '../../domusvita-platform/packages/shared-ui/lib/utils'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: { port: 3003, open: false },
  build: { outDir: 'build', sourcemap: false },
  define: { 'process.env': '({})' },
})
