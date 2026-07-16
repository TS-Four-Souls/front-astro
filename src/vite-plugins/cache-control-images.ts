import type { Plugin } from "vite";

const CACHE_CONTROL = "public, max-age=604800, immutable";
const IMAGE_PREFIX = "/images/";

export function cacheControlImages(): Plugin {
  return {
    name: "cache-control-images",
    enforce: "pre",
    /* For development */
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? "").split("?")[0];
        if (pathname.startsWith(IMAGE_PREFIX)) {
          res.setHeader("Cache-Control", CACHE_CONTROL);
        }
        next();
      });
    },
    /* For production */
    transform(code, id) {
      const normalizedId = id.replaceAll("\\", "/");
      if (!normalizedId.includes("/@astrojs/node/dist/serve-static")) {
        return;
      }
      if (code.includes(`startsWith("${IMAGE_PREFIX}")`)) {
        return;
      }

      // Set header before send() so it is not overwritten with max-age=0.
      const marker = "const stream = send(req, normalizedPathname, {";
      if (!code.includes(marker)) {
        return;
      }

      return code.replace(
        marker,
        `if (normalizedPathname.startsWith("${IMAGE_PREFIX}")) {
        res.setHeader("Cache-Control", "${CACHE_CONTROL}");
      }
      const stream = send(req, normalizedPathname, {`,
      );
    },
  };
}
