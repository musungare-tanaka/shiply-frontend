import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react()],
    define: {
      "import.meta.env.GOOGLE_CLIENT_ID": JSON.stringify(env.GOOGLE_CLIENT_ID ?? ""),
    },
    test: {
      environment: "jsdom",
      globals: false,
      setupFiles: "./src/test/setupTests.ts",
    },
  }
})
