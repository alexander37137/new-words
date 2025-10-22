import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineNuxtConfig } from 'nuxt/config';

// Disable vue-macros to avoid module.createRequire error
if (typeof process !== 'undefined') {
  process.env.NUXT_DISABLE_VUE_MACROS = 'true';
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  workspaceDir: '../../',
  srcDir: 'src',
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 4200,
  },
  typescript: {
    typeCheck: false,
    tsConfig: {
      extends: '../../../tsconfig.base.json',
    },
  },
  imports: {
    autoImport: true,
  },
  modules: [
    // Disable vue-macros to avoid module.createRequire error
  ],
  css: ['~/assets/css/styles.css'],
  nitro: {
    preset: 'node-server',
    experimental: {
      wasm: false,
    },
    storage: {
      db: {
        driver: 'memory'
      }
    }
  },
  vite: {
    plugins: [nxViteTsPaths()],
  },
  compatibilityDate: '2025-10-22',
  experimental: {
    payloadExtraction: false,
    viewTransition: false,
  },
  features: {
    noScripts: true,
  },
  build: {
    transpile: ['@vue-macros/nuxt'],
  },
});