# PWA Setup Guide for Jeju Air Guide

This project is configured as a Progressive Web App (PWA) using `vite-plugin-pwa`.

## 1. Icon Generation
To make the PWA installable, you need valid icons in the `public` directory.
You must generate the following files and place them in `d:\mySource\airguide\public\`:

- `pwa-192x192.png`: 192x192 px icon (PNG)
- `pwa-512x512.png`: 512x512 px icon (PNG)
- `favicon.ico`: Standard favicon
- `apple-touch-icon.png`: 180x180 px icon (PNG) for iOS
- `masked-icon.svg`: Monochromatic icon (SVG) for Android adaptive icons (optional but recommended)

**Tip:** You can use online tools like [PWA Asset Generator](https://tools.crawlink.com/tools/pwa-icon-generator/) to create these easily.

## 2. Configuration (`vite.config.js`)
The `vite-plugin-pwa` is already configured with `registerType: 'autoUpdate'`, which means the app will automatically update when a new version is deployed.

The `manifest` object in `vite.config.js` defines how the app appears on the home screen:
```javascript
manifest: {
  name: 'Jeju Air Guide - Seogwipo',
  short_name: 'JejuAir',
  description: 'Real-time air quality in Seogwipo, Jeju',
  theme_color: '#ffffff',
  icons: [...]
}
```

## 3. Deployment to Firebase
The user requested Firebase Hosting.

1.  **Build the App:**
    ```bash
    npm run build
    ```
    This creates the `dist` folder containing your compiled assets and `sw.js`.

2.  **Initialize Firebase:**
    ```bash
    npm install -g firebase-tools
    firebase login
    firebase init hosting
    ```
    - Select **"Use an existing project"** or **"Create a new project"**.
    - **Public directory:** `dist`
    - **Configure as a single-page app:** `Yes`
    - **Set up automatic builds and deploys with GitHub:** (Optional)

3.  **Deploy:**
    ```bash
    firebase deploy
    ```

## 4. Offline Support
The service worker is configured to cache assets (CSS, JS, HTML) and will serve them when offline. The API calls (`Open-Meteo`) might fail offline unless we implement a specific runtime caching strategy for the API, but the App Shell will load.

To cache API responses (advanced), you can add `workbox` config to `vite.config.js`:
```javascript
workbox: {
  runtimeCaching: [{
    urlPattern: /^https:\/\/air-quality-api\.open-meteo\.com\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 // 1 day
      },
      cacheableResponse: {
        statuses: [0, 200]
      }
    }
  }]
}
```
