import { sync } from "glob";
import path from "path";
import { defineConfig } from "vite";

const htmlFiles = sync("app/*.html").map((f) => path.resolve(f));

export default defineConfig({
    root: "app",
    build: {
        outDir: path.resolve(__dirname, "prod"),
        emptyOutDir: true,
        rollupOptions: {
            input: htmlFiles,
        },
    },
});
