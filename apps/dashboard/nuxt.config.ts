import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineNuxtConfig } from 'nuxt/config';

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
});