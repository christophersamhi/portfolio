# Alto International

Site statique d'Alto International, construit avec Vite, SCSS et JavaScript vanilla.

## Stack

- **Build** : [Vite 7](https://vitejs.dev/)
- **Styles** : SCSS ([Sass](https://sass-lang.com/)) + PostCSS / cssnano
- **Scripts** : JavaScript (ES modules) + [jQuery](https://jquery.com/)
- **Animations** : [GSAP](https://gsap.com/), [Lenis](https://github.com/studio-freight/lenis) (smooth scroll)
- **Carrousels** : [Swiper](https://swiperjs.com/)
- **Qualité** : ESLint, Stylelint, Prettier, Husky + lint-staged

## Prérequis

- Node.js ≥ 18
- npm

## Installation

```bash
npm install
```

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance le serveur de développement Vite. |
| `npm run build` | Build complet : JS via Vite puis CSS via Sass. |
| `npm run build:js` | Build des scripts uniquement. |
| `npm run build:css` | Compile les SCSS dans `dist/styles`. |
| `npm run build-prod` | Build de production (config `vite.config.prod.js`). |
| `npm run preview` | Sert le build local pour prévisualisation. |
| `npm run lint` / `lint:fix` | Lint des fichiers JS. |
| `npm run lint:css` / `lint:css:fix` | Lint des fichiers SCSS. |

## Structure

```
app/
├── components/   # Fragments HTML (header, footer, blocks…)
├── img/          # Images sources
├── scripts/      # Points d'entrée JS (un fichier = un bundle)
├── styles/       # SCSS (partials + feuilles par bloc)
└── index.html    # Page racine
dist/             # Sortie du build
vite.config.js
vite.config.prod.js
```

Chaque fichier de `app/scripts/*.js` est traité comme un point d'entrée par Vite et compilé vers `dist/scripts/`. Les SCSS sont compilés en parallèle vers `dist/styles/`. Les fichiers HTML (racine + `components/**`) sont minifiés et copiés dans `dist/`, avec réécriture automatique des références `.scss` → `.css`.

## Workflow Git

Husky exécute `lint-staged` au pre-commit :

- `*.js`, `*.scss` → Prettier + Stylelint + ESLint
- `*.html` → Prettier
