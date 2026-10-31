import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the app at https://<username>.github.io/<repo-name>/,
// so the built app needs that sub-path. Change REPO_NAME if your repository is named differently.
const REPO_NAME = 'gym-tracker'

// https://vite.dev/config/
// The dev server stays at "/" for convenience; the build and its preview use the sub-path.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? `/${REPO_NAME}/` : '/',
  plugins: [
    react(),
    VitePWA({
      // New versions install themselves in the background and apply on next open.
      registerType: 'autoUpdate',
      // Uses the icons made by pwa-assets.config.js and adds their tags to index.html.
      pwaAssets: { config: true },
      manifest: {
        name: 'Gym Tracker',
        short_name: 'Gym',
        description: 'Log your sets and track your progress week by week.',
        theme_color: '#13213c',
        background_color: '#13213c',
        display: 'standalone',
        orientation: 'portrait',
      },
      workbox: {
        // Cache the whole app so it opens with no signal at the gym.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
}))
