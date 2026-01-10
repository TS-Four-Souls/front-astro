import { defineConfig, envField } from "astro/config";
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  env: {
    schema: {
      BASE_URL: envField.string({ context: "client", access: "public" }),
    }
  }
});