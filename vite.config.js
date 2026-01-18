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
        name: '제주가이드 - 실시간 제주 날씨, 낚시, 생활 정보',
        short_name: '제주가이드',
        description: '제주도 실시간 날씨, 미세먼지, 낚시 물때, 약국, 클린하우스 등 제주 생활/여행의 모든 정보를 제공하는 종합 가이드 앱',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        lang: 'ko-KR',
        orientation: 'portrait',
        categories: ['travel', 'lifestyle', 'utilities'],
        shortcuts: [
          {
            name: '실시간 날씨',
            url: '/#weather',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: '낚시 포인트',
            url: '/#fishing',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: '생활 지도',
            url: '/#map',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ],
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
      },
      '/api/pharmacy': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/pharmacy/, '/getPharmacy')
      },
      '/api/subscribe-alerts': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/subscribe-alerts/, '/subscribeToWeatherAlerts')
      },
      '/api/hospital': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/hospital/, '/getHospital')
      },
      '/api/ads': {
        target: 'https://us-central1-jair-guide.cloudfunctions.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ads/, '/getCoupangAds')
      }
    }
  }
})
