# Fada Royale — prompts pour générer des images et des modèles 3D

**État (v1.2)** : armes (sauf revolver), kilishi, verre de thé, théière, textures (sol, banco, enduit, wax) et illustration de chargement sont **dans le jeu**. Il reste : le revolver barillet fermé, la daba en houe (facultatif), et de vrais persos 3D (voir section 3).

**Décor réaliste** (maisons, arbres, animaux, rochers, sols, ciel, carte) : voir `PROMPTS_DECOR.md`, avec la vue du ciel de la carte dans `guides/`.

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

## 1 bis. Nouvelles armes (v1.7) — idées de catégories, design original

Les images envoyées le 16/11 sont des rendus officiels de Fortnite (sniper lourd, fusil d'assaut, pompes) : ce sont des créations d'Epic Games, on ne les met **pas** dans le jeu (droits d'auteur, et Fada Royale garde son identité). On reprend seulement **les familles d'armes**, avec un dessin propre à Fada Royale : métal usé par le sable, bois, cuir, cordelettes, morceaux de tissu wax noués, peinture couleur latérite.

Mêmes règles que plus haut : vue de profil, fond gris clair uni, sans logo ni texte ; la pièce détachable (chargeur, caisse) en image séparée. Une fois en 3D (étape 2), chaque arme se branche sur la prise de la v1.7 par sa catégorie (`src/core/weapon-handling.js`).

| Arme (catégorie de prise) | Prompt |
|---|---|
| Fusil lourd « Ténéré » (sniper lourd, `sniper`) | `Low-poly game-ready heavy anti-materiel sniper rifle, ORIGINAL design, long fluted barrel with a wide two-port muzzle brake, olive green and sand-worn steel receiver, leather cheek pad stitched on the stock, folding bipod, large scope wrapped with a strip of indigo cloth, detachable box magazine as a separate part, 1.4 m long, side view, plain light grey background, no logos, no text` |
| Fusil d'assaut « Sahel » (`long`) | `Low-poly game-ready bullpup assault rifle, ORIGINAL design, magazine behind the pistol grip, laterite red painted polymer body with sand scratches, carry handle with rear sight, short suppressor, sling made of braided leather, curved magazine as a separate part, 0.75 m long, side view, plain light grey background, no logos, no text` |
| Fusil tactique « Aïr » (tir précis, `long`) | `Low-poly game-ready designated marksman rifle, ORIGINAL design, tan polymer and dark steel, free-floating handguard with vents, small 4x scope, adjustable stock with a wax fabric wrap, straight 20-round magazine as a separate part, 1.0 m long, side view, plain light grey background, no logos, no text` |
| Pompe « Kouré » (pompe semi-automatique, `long`) | `Low-poly game-ready semi-automatic tactical shotgun, ORIGINAL design, black steel receiver, olive green fore-end with deep grooves, tube magazine under a short wide barrel, folding skeleton stock, brass shell holder strip on the side, 0.95 m long, side view, plain light grey background, no logos, no text` |
| Pompe « Zinder » (pompe à bois, `long`) | `Low-poly game-ready pump-action shotgun, ORIGINAL design, hand-carved dark wood stock with geometric Hausa patterns, blued steel barrel with a bead sight, pump fore-end as a separate part, 1.0 m long, side view, plain light grey background, no logos, no text` |

## 1 ter. Ce qui manque après la v2.0 (et l'outil qu'il faut)

| Ressource | État en v2.0 | Comment l'obtenir |
|---|---|---|
| Fusil tactique et pompe tactique en vrais modèles détaillés | Modélisés dans le code (pièces en volume, 300 à 700 triangles) | Images avec les prompts « Aïr » et « Kouré » ci-dessus, puis un outil image → 3D (Higgsfield est branché ici mais **consomme des crédits payants : seulement avec ton accord**), ou un modeleur 3D (Blender) |
| Les 7 armes de la v1.2 en volume complet | Modèles « 2.5D » (silhouette extrudée, ≈ 4 cm d'épaisseur) | Même chemin, à partir des images de la v1.2 |
| Emotes naturelles (danse, salut, applaudissements, victoire) | 4 gestes construits à la main sur le squelette ; la vidéo de référence annoncée n'a pas été reçue | **Mixamo** (site gratuit d'Adobe, compte Adobe nécessaire) : « Waving », « Clapping », « Victory », « Hip Hop Dancing »… Nos persos ont un squelette Mixamo : les clips téléchargés en FBX (sans peau) se convertissent au format des animations du jeu (`assets/anim_*.js`). Je n'ai pas accès à ton compte : il faut me fournir les FBX. |
| Images d'arrivée des 8 nouveaux lieux | Pas d'image (seul le nom s'affiche) | Prompts dans le style de `PROMPTS_DECOR.md` : « panoramic photo of a Sahel military outpost / Bilma oasis with salt pans / cement plant / ruined ksar of Djado / Termit rocky massif / hilltop village of Filingué / dune village of Gouré / Gaya market », lumière d'harmattan, sans texte |

## 1 quater. Panorama du lobby (v2.0.1)

**Reçu et intégré** (v2.0.1) : 2 images 1774 × 887, pas raccordables à 360° ; la 2e est utilisée, posée sur un arc de 120° derrière l'estrade (`assets/images/lobby-panorama.jpg`, réglages `PANORAMA` dans `src/lobby/lobby.js`). Une version plus large (4096 px ou plus, même cadrage) serait plus nette sur ordinateur : il suffit de remplacer le fichier.

Le ciel du lobby est aujourd'hui un dégradé (orange à l'horizon, indigo en haut) derrière l'estrade et les murs en 3D. Une image panoramique à 360° peut le remplacer : elle est posée sur la sphère du ciel, le décor 3D (murs d'Agadez, estrade, étal) reste devant.

Format : **panorama équirectangulaire 360° × 180°, rapport 2:1** (4096 × 2048 au minimum, 8192 × 4096 idéal), bords gauche et droit qui se raccordent, horizon exactement au milieu de la hauteur, caméra à hauteur d'homme, sans inclinaison. La moitié basse (le sol) sera en grande partie cachée par le sol 3D du lobby.

Prompt :

`Seamless equirectangular 360 degree panorama, 2:1 aspect ratio, horizon exactly at the vertical center, camera at human eye height, level horizon. Sahel desert of Niger at golden hour sunset, harmattan dust haze in the air. In the distance, the old city of Agadez: the tall tapered mud-brick minaret of the Grand Mosque with protruding wooden beams (torons), flat-roofed earthen houses with crenellated parapets, warm ochre and red-earth colors. Rolling orange sand dunes, scattered acacia and doum palm silhouettes, a far caravan of dromedaries as small silhouettes on a dune. Low sun near the horizon with a soft golden glow, sky gradient from warm apricot and coral at the horizon to dusky rose then deep indigo at the zenith, a few thin high cirrus clouds lit pink. Photorealistic but slightly stylized for a video game background, clean, cinematic, rich warm palette, high detail, soft atmospheric perspective.`

À éviter (négatif) : `people in the foreground, text, letters, logo, watermark, signature, frame, border, modern buildings, cars, power lines, fish-eye distortion, tilted horizon, visible seam, Fortnite, cartoon, oversaturated neon`

Si l'outil ne sait pas faire d'équirectangulaire : une image très large **3:1** (par ex. 6144 × 2048), horizon au milieu, que j'enroulerai en cylindre derrière l'estrade.

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

**Étape 2, en 3D** : image → modèle 3D (« image to 3D ») avec 8 000 à 15 000 triangles, une texture 2048×2048, pose en T. **Attention : il faut un vrai modèle 3D complet** (outil « image to 3D » qui reconstruit le dos et le profil), pas une extrusion « 2.5D » de l'image : les persos 2.5D reçus faisaient 22 cm d'épaisseur et avaient un dos en taches de couleur, inutilisables en vue à la troisième personne.
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
