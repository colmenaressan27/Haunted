import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

// base './' => rutas relativas: funciona igual en GitHub Pages (/<repo>/), en LAN y en preview.
// mode 'lan' => HTTPS con certificado autofirmado para abrir el servidor desde el teléfono en la misma Wi-Fi.
export default defineConfig(({mode}) => ({
  base: './',
  plugins: [react(), ...(mode === 'lan' ? [basicSsl()] : [])],
  build: {
    target: 'es2022',
    sourcemap: true,
    // El chunk diferido de three.js (~700 kB, ~180 kB gzip) es inevitable: XR8.Threejs exige el
    // namespace completo en window.THREE, sin tree-shaking. La portada (index) no lo espera.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
