// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/signer.ts"], // entry point
  format: ["esm", "cjs"], // for both CommonJS and ESModule outputs
  target: "es2017",
  dts: true, // generate .d.ts files for TypeScript
  sourcemap: true,
  minify: false,
  clean: true,
  metafile: true,
  platform: "node",
  splitting: false,
  noExternal: ["elliptic"], // only bundle these dependencies
});
