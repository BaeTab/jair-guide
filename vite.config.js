import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '제주바람 - 실시간 제주 공기 모니터',
        short_name: '제주바람',
        description: '제주도 실시간 공기질 및 날씨 정보',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  server: {
    proxy: {
      '/api/airport-weather': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/airport-weather/, '/getJejuAirportWeather')
      },
      '/api/weather': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/weather/, '/getKmaWeather')
      },
      '/api/air': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/air/, '/getAirKoreaQuality')
      },
      '/api/reverse-geocode': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/reverse-geocode/, '/getReverseGeocode')
      },
      '/api/sea-trip': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/sea-trip/, '/getSeaTripIndex')
      },
      '/api/fishing': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/fishing/, '/getSeaFishingIndex')
      },
      '/api/flights': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/flights/, '/getJejuFlights')
      },
      '/api/clean-house': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/clean-house/, '/getCleanHouse')
      }
    }
  }
})
