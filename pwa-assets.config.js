import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates the app icons from public/icon.svg.
// Run again after changing the icon:  npx pwa-assets-generator
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // The icon already has a full orange background, so no extra border.
    apple: { sizes: [180], padding: 0 },
    maskable: { sizes: [512], padding: 0 },
  },
  images: ['public/icon.svg'],
})
