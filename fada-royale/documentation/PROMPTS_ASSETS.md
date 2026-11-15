# Fada Royale — prompts pour générer des images et des modèles 3D

Ce qui aiderait vraiment le jeu, par ordre d'importance. Les prompts sont en anglais (les générateurs 3D et d'images les comprennent mieux) ; l'explication est en français.

Quand tu as un résultat, envoie-moi le fichier (GLB pour la 3D, PNG pour les images) : je l'intègre, je le règle (taille, prise en main, chargeur qui tombe…) et je vérifie qu'il ne ralentit pas le jeu.

**Règles pour tout ce que tu génères**
- Rien qui copie un jeu existant, une marque ou un logo réel.
- Garde les fichiers d'origine et note l'outil utilisé : ça sert pour la licence (les modèles que tu génères toi-même règlent le problème des armes sous licence « pas d'usage commercial »).

---

## 1. Armes (priorité 1 : remplace les modèles sous licence non commerciale)

Le MP5 et le fusil à pompe actuels sont sous licence CC BY-NC (interdits en usage commercial) ; le sniper, la Minimi et le Colt n'ont pas d'auteur crédité. Des modèles générés par toi règlent ça.

**Format attendu pour chaque arme** : GLB, 1 500 à 4 000 triangles, une seule texture 1024×1024 (couleur + rugosité/métal si possible), échelle réelle en mètres, canon vers l'avant, crosse vers l'arrière. Si l'outil le permet, des pièces séparées et nommées : `mag` (chargeur), `bolt` (culasse), `pump` (garde-main du pompe), `cylinder` (barillet) — je pourrai alors animer la vraie pièce pendant le rechargement.

| Arme du jeu | Prompt |
|---|---|
| Fusil d'assaut | `Low-poly game-ready assault rifle, generic Kalashnikov-style design, worn wooden stock and handguard, dark blued steel receiver, curved 30-round magazine as a separate part, desert wear and scratches, realistic proportions 0.88 m long, PBR textures, side view, no logos, no text` |
| Mitraillette | `Low-poly game-ready compact submachine gun, generic design inspired by 1980s police SMGs, black polymer and steel, straight magazine as a separate part, retractable stock, realistic proportions 0.55 m long, PBR textures, no logos, no text` |
| Fusil à pompe | `Low-poly game-ready pump-action shotgun, generic design, walnut wood stock and pump fore-end, blued steel barrel and tube magazine, pump fore-end as a separate part, sand-worn finish, 1.0 m long, PBR textures, no logos, no text` |
| Revolver | `Low-poly game-ready six-shot revolver, generic classic design, steel frame with worn bluing, wooden grip, swing-out cylinder as a separate part, 0.28 m long, PBR textures, no logos, no text` |
| Sniper | `Low-poly game-ready bolt-action sniper rifle, generic design, desert tan stock, black barrel, large scope, detachable box magazine and bolt handle as separate parts, 1.15 m long, PBR textures, no logos, no text` |
| Mitrailleuse | `Low-poly game-ready light machine gun, generic belt-fed design, olive and black finish, folding bipod, carry handle, ammunition box as a separate part, 1.0 m long, PBR textures, no logos, no text` |
| Daba (outil de récolte) | `Low-poly game-ready Sahelian daba hoe, hand-forged iron blade, curved wooden handle with leather wrap, traditional Niger farming tool, 0.9 m long, PBR textures` |

### Étape 2 : passer les images en 3D

Les images des 7 armes sont faites (merci). Une image n'est pas encore un modèle 3D : il faut la convertir avec un outil « image to 3D » (Tripo, Meshy, Hunyuan3D…). Plusieurs ont une offre gratuite (vérifier sur leur site).

- Je fournis les images **découpées sur fond transparent**, chaque arme séparée de sa pièce détachable (chargeur, garde-main, culasse, caisse de munitions). Convertir **chaque fichier séparément**.
- Réglages : une seule image, textures oui (PBR si proposé), 5 000 à 10 000 faces pour une arme, 1 000 à 3 000 pour une pièce (« low poly » si l'option existe), export **GLB**.
- Garder les noms : `fusil-arme.glb`, `fusil-piece1.glb`, etc.

**Deux images à refaire avant la conversion :**

| Image | Problème | Prompt |
|---|---|---|
| Revolver | Le barillet est dessiné **ouvert** : en 3D, l'arme resterait ouverte en permanence. Il faut le revolver fermé, et le barillet seul à part (pour l'animation de rechargement). | Revolver : `Low-poly game-ready six-shot revolver, same design as the reference, cylinder CLOSED inside the frame, steel frame with worn bluing, wooden grip, side view, plain light grey background, no logos, no text` · Barillet seul : `Low-poly game prop, a single six-shot revolver cylinder with its crane arm, worn blued steel, three-quarter view, plain light grey background` |
| Daba | L'image montre un **couperet** (lame dans l'axe du manche). Une daba est une **houe** : lame plate fixée en travers du manche. Le couperet peut rester si tu préfères (un coupe-coupe marche aussi pour récolter). | `Low-poly game-ready Sahelian daba hoe, short curved wooden handle with leather wrap, wide flat hand-forged iron blade fixed PERPENDICULAR to the handle like a hoe, side view, plain light grey background, PBR textures` |

## 2. Accessoires des animations (kilishi, thé)

Aujourd'hui ce sont des formes simples dessinées par le code. Format : GLB, moins de 600 triangles, texture 512×512.

| Objet | Prompt |
|---|---|
| Kilishi | `Low-poly game prop, a thin sheet of Nigerien kilishi (dried spiced beef jerky), dark red-brown with visible chili and peanut spice crust, slightly wavy, irregular edges, 20 cm long, PBR textures` |
| Verre à thé | `Low-poly game prop, small clear Sahel tea glass (atai glass), slightly frosted, filled two thirds with dark amber tea and a layer of foam on top, 8 cm tall, PBR textures` |
| Théière | `Low-poly game prop, small enamelled metal Sahel teapot (blue with white dots), curved spout, used look, 15 cm tall, PBR textures` |

## 3. Nouveaux personnages

Le plus simple : générer d'abord une image de face, puis la transformer en 3D, puis la passer dans **Mixamo** (site gratuit d'Adobe) pour qu'elle reçoive un squelette standard. Avec ce squelette, toutes les animations du jeu fonctionnent directement.

**Étape 1, image de référence** (format portrait, fond uni) :

| Perso | Prompt |
|---|---|
| Touareg | `Full body character concept, front view, T-pose, arms straight out, neutral background, stylized semi-realistic game character, young Tuareg man from Agadez, indigo tagelmust veil and turban, long light-blue boubou over dark trousers, leather sandals, silver Agadez cross pendant, desert explorer gear, battle royale game style, clean readable shapes` |
| Commerçante de Niamey | `Full body character concept, front view, T-pose, arms straight out, neutral background, stylized semi-realistic game character, confident young woman from Niamey, colourful wax print pagne and fitted top, matching headwrap, sneakers, crossbody bag, battle royale game style, clean readable shapes` |
| Chasseur du Parc W | `Full body character concept, front view, T-pose, arms straight out, neutral background, stylized semi-realistic game character, Sahel park ranger, khaki shirt with rolled sleeves, cargo trousers, boots, bush hat, binoculars on the chest, battle royale game style, clean readable shapes` |

**Étape 2, en 3D** : image → modèle 3D (« image to 3D ») avec 8 000 à 15 000 triangles, une texture 2048×2048, pose en T.
**Étape 3** : envoyer le GLB/FBX sur Mixamo, placer les repères (menton, poignets, coudes, genoux, bassin), télécharger en FBX « T-pose, without skin animation », et me l'envoyer.

## 4. Textures (sols, murs, tissus)

Format : PNG carré 1024×1024 ou 2048×2048, **raccordable** (le motif se répète sans couture visible). Dans l'outil, cocher « seamless / tileable » si l'option existe.

| Texture | Prompt |
|---|---|
| Mur en banco | `Seamless tileable texture, Sahel banco mud-brick wall, smooth hand-plastered earth with straw fibres, small cracks, warm ochre and sienna tones, even lighting, no shadows, top-down orthographic, 2048x2048` |
| Mur enduit (Niamey) | `Seamless tileable texture, painted cement plaster wall, slightly dusty and weathered, faint water stains at the bottom, off-white, even lighting, orthographic, 2048x2048` |
| Sable / sol | `Seamless tileable texture, Sahel desert ground, fine orange sand with small pebbles and dry grass bits, even lighting, no shadows, top-down orthographic, 2048x2048` |
| Wax (3 ou 4 motifs) | `Seamless tileable African wax print fabric pattern, bold geometric shapes, [orange, indigo and gold] colours, flat print, no folds, no shadows, 1024x1024` — change les couleurs entre crochets à chaque essai |

## 5. Images (icône, écran de chargement, fond de lobby)

| Image | Prompt |
|---|---|
| Icône de l'appli | `App icon, square, bold simple composition, a Sahel mud-brick minaret silhouette in front of a huge setting sun, warm orange and deep brown gradient, thin cyan neon line on the horizon, flat stylized game art, no text, readable at small size` |
| Écran de chargement | `Wide 16:9 key art for a stylized battle royale video game set in Niger, sunset over Agadez mud-brick architecture, a flying bush taxi minibus in the sky with characters gliding down under wax-print paragliders, dust in the air, warm cinematic light, vibrant stylized 3D game art, no text, no logos` |
| Fond du lobby (option) | `Wide 16:9 background, Sahel village square at golden hour, mud-brick walls with wooden beams sticking out, wax-print awning, palm trees, soft bokeh, stylized 3D game art, empty center for a character, no text` |

---

**Le plus utile en premier** : les armes (section 1), parce qu'elles règlent la licence avant toute diffusion, puis le kilishi et le verre de thé (section 2). Le reste améliore le look mais n'est pas bloquant.
