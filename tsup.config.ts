import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2022",
  outDir: "build",
  clean: true,
  dts: false,
  sourcemap: true,
});
