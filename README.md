# samir. — Portfolio de Samir Abdoulaye Seyni

Portfolio cinématique : dunes du Ténéré en 3D au coucher du soleil, nom en lettres 3D qui sortent du sable, textes animés lettre par lettre, défilement fluide.

## Ce qu'il y a dedans

- **Héro 3D** (Three.js / React Three Fiber) : dunes, ciel, poussière, lettres « samir. » dorées, caméra qui avance au défilement.
- **Écran d'ouverture** avec compteur pendant le chargement de la 3D.
- **Sections** : chiffres, approche, projets, concepts Renoi Studio (galerie horizontale), services, preuve Selv Digital, tarifs, méthode, à propos, FAQ, contact WhatsApp, pied de page.
- Formulaire qui prépare le message WhatsApp.
- Version de secours sans 3D si le téléphone ne gère pas WebGL ou si le visiteur a réduit les animations.

## Modifier le contenu

Tout le texte est dans **`src/data/content.ts`** : coordonnées, projets, services, prix, FAQ.

Pour mettre une vraie capture d'un projet :
1. Ajoutez l'image dans `public/img/` (format `.webp` conseillé, 1200 px de large).
2. Dans `src/data/content.ts`, ajoutez `image: '/img/nom-du-fichier.webp'` au projet.

## Lancer en local

```bash
npm install
npm run dev
```

## Mettre en ligne (Netlify)

Le fichier `netlify.toml` est prêt : connectez le dépôt à Netlify, il lance `npm run build` et publie le dossier `dist`.

## Technique

React 19, TypeScript, Vite, Tailwind CSS 4, Motion, Lenis, Three.js, React Three Fiber, Drei.
La police 3D est générée à partir de Bricolage Grotesque avec `node scripts/make-typeface.mjs`.
