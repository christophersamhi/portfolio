import { defineConfig } from "vite";
import path from "path";
import { sync } from "glob";
import fs from "fs";
import { minify } from "html-minifier-terser";

const jsFiles = sync("app/scripts/*.js");
const input = {};
jsFiles.forEach((f) => {
    const name = path.basename(f, ".js");
    input[name] = path.resolve(f);
});

export default defineConfig({
    root: "app",
    build: {
        outDir: path.resolve(__dirname, "dist"),
        emptyOutDir: true,
        rollupOptions: {
            input,
            output: {
                entryFileNames: "scripts/[name].js",
                chunkFileNames: "scripts/[name].js",
                assetFileNames: ({ name }) => {
                    if (!name) return "[name].[ext]";
                    if (/\.(png|jpe?g|gif|svg|webp)$/.test(name))
                        return "img/[name][extname]";
                    return "[name].[ext]";
                },
                manualChunks: undefined,
            },
        },
        cssCodeSplit: true,
    },
    plugins: [
        {
            name: "copy-minified-html",
            async closeBundle() {
                // tous les fichiers html à minifier : racine + components (et sous-dossiers)
                const htmlFiles = [
                    ...sync("app/*.html"),
                    ...sync("app/components/**/*.html"),
                ];

                for (const file of htmlFiles) {
                    let content = fs.readFileSync(file, "utf-8");

                    // remplacer tous les href="... .scss" -> .css (gestion de tous les chemins)
                    content = content.replace(
                        /href="([^"]+)\.scss"/g,
                        'href="$1.css"',
                    );

                    const minified = await minify(content, {
                        collapseWhitespace: true,
                        removeComments: true,
                        minifyCSS: true,
                        minifyJS: true,
                    });

                    // conserver la structure relative (ex: components/card/foo.html -> dist/components/card/foo.html)
                    const relative = path.relative(path.resolve("app"), file);
                    const dest = path.resolve(__dirname, "dist", relative);

                    fs.mkdirSync(path.dirname(dest), { recursive: true });
                    fs.writeFileSync(dest, minified);
                }

                // Copier les assets du dossier img (comme avant)
                const imgFiles = sync("app/img/**/*.*");
                for (const img of imgFiles) {
                    const relative = path.relative(path.resolve("app"), img);
                    const destPath = path.resolve(__dirname, "dist", relative);
                    fs.mkdirSync(path.dirname(destPath), { recursive: true });
                    fs.copyFileSync(img, destPath);
                }

                // Copier autres assets présents dans app/components (images, css locaux, etc.)
                // Exclure explicitement les .html (déjà traités)
                const compAssets = sync("app/components/**/*.*").filter(
                    (p) => !p.endsWith(".html"),
                );
                for (const asset of compAssets) {
                    const relative = path.relative(path.resolve("app"), asset);
                    const destPath = path.resolve(__dirname, "dist", relative);
                    fs.mkdirSync(path.dirname(destPath), { recursive: true });
                    fs.copyFileSync(asset, destPath);
                }
            },
        },
    ],
});
