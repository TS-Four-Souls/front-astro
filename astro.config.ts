import { defineConfig, envField } from "astro/config";
import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [react()],

  env: {
    schema: {
      BASE_URL: envField.string({ context: "client", access: "public" }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
