# Fada Royale — Prompts pour un décor réaliste

Maisons, arbres, plantes, animaux, rochers, sols, ciel et carte. Les prompts sont en anglais (les générateurs les comprennent mieux), les explications en français.

« Réaliste » sur un téléphone, ça veut dire **proportions réelles, vraies matières (banco, enduit, bois, granite), textures de qualité**, mais **peu de faces**. Un modèle « photo-scan » de 200 000 triangles ferait ramer le jeu : chaque catégorie a donc un budget à demander au générateur.

---

## 0. À lire avant de générer

### La méthode, en 3 étapes

1. **Image de référence** (générateur d'images). L'objet entier, seul, centré, vu de trois quarts, sur fond gris clair uni, lumière douce. Pas d'ombre forte, pas de décor autour.
2. **Image → 3D** (Tripo, Meshy, Hunyuan3D, Rodin…). Une image à la fois. Choisir : textures PBR, « low poly » ou le nombre de faces indiqué plus bas, export **GLB**.
3. **M'envoyer** le fichier GLB, l'image qui a servi, et le nom de l'outil (pour la licence). Je règle l'échelle, la collision et le niveau de détail, et je vérifie que le jeu reste fluide.

### Règles techniques (à respecter pour tout)

| Règle | Pourquoi |
|---|---|
| **GLB**, unités en **mètres**, le haut vers **+Y**, l'objet **posé au sol** (bas de l'objet à 0) | Il se pose directement sur le terrain, à la bonne taille |
| **Textures PBR** : couleur, normal map, rugosité. **1024 × 1024** (2048 pour un monument, 512 pour un petit objet) | Le relief et la matière se voient sans ajouter de faces |
| **Pas d'ombres ni de lumière peintes dans la texture** (« no baked lighting ») | Le jeu fait ses propres ombres : sinon on voit des ombres en double |
| **Pièces mobiles séparées** (porte, volets) | Je peux les animer (les portes s'ouvrent depuis la v1.3) |
| **Pas de texte, de logo ou de marque**, rien qui copie un jeu existant | Licence et originalité |
| **Garder les fichiers d'origine** et noter l'outil utilisé | Preuve de création si le jeu est diffusé |

### Budget de faces (triangles) par catégorie

| Catégorie | Faces |
|---|---|
| Module de mur, porte, volet | 100 à 600 |
| Petit bâtiment (case, grenier, étal, tente) | 500 à 1 500 |
| Monument (minaret, porte du Birni, château d'eau) | 3 000 à 6 000 |
| Arbre (tronc et branches) | 1 500 à 4 000, plus une version simplifiée de 300 à 700 |
| Buisson, touffe d'herbe | 50 à 600 |
| Grand animal (girafe, dromadaire, zébu) | 3 000 à 7 000 |
| Petit animal (chèvre, pintade, oiseau) | 500 à 3 000 |
| Rocher | 300 à 1 500 |

### Le style commun (à ajouter à la fin de chaque prompt d'objet)

> `, realistic game-ready 3D asset, Sahel region of Niger, warm natural colors, PBR materials, real-world proportions, plain light grey background, soft even studio lighting, no cast shadow, no text, no logo`

### Planche de style (à faire en premier)

Une image qui fixe la palette, la lumière et le niveau de détail de tout le décor. On la joint ensuite comme **image de référence** à chaque génération pour que tout se ressemble.

> `Art direction board for a realistic mobile battle royale game set in Niger, Sahel. One sheet showing: a mud-brick banco house with protruding wooden beams, a painted cement house from Niamey with blue shutters, an acacia tree, a doum palm, a baobab, granite boulders, a dromedary, a giraffe, ochre sand ground and red laterite ground swatches. Warm golden-hour light, dusty atmosphere, natural earth palette (ochre, sienna, terracotta, indigo, faded blue and green accents), consistent realistic game-ready style, no text, no logo`

---

## 1. Maisons et bâtiments

### Pourquoi un « kit » plutôt qu'une maison entière

Dans le jeu, on **entre** dans les maisons : portes qui s'ouvrent, escalier, étage, murs qui arrêtent les balles. Une maison générée d'un bloc est fermée : on ne pourrait pas y entrer. La bonne méthode des jeux pros : un **kit de modules** aux mesures de notre grille, que j'assemble en maisons variées (avec leurs collisions). Les monuments, eux, peuvent être d'un bloc (on ne rentre pas dedans).

**Mesures du kit** : mur de **4,0 m de long, 3,6 m de haut, 0,3 m d'épaisseur** ; porte de **1,4 × 2,45 m** ; battant de porte de **1,36 × 2,3 × 0,06 m** ; fenêtre de **1,0 × 1,0 m** à 1,2 m du sol.

### 1.1 Kit banco (Agadez, villages)

| Module | Prompt |
|---|---|
| Mur plein | `Modular wall segment for a Sahel mud-brick house, exactly 4 m wide, 3.6 m high, 0.3 m thick, smooth hand-plastered banco earth in ochre and sienna, subtle straw fibres and small cracks, slightly rounded edges, front view` |
| Mur avec porte | `Same modular banco wall segment, 4 m wide, 3.6 m high, 0.3 m thick, with a rectangular door opening 1.4 m wide and 2.45 m high in the middle, thick rounded jambs, small wooden lintel visible above the opening, no door leaf` |
| Mur avec fenêtre | `Same modular banco wall segment, 4 m wide, 3.6 m high, 0.3 m thick, with one small square window opening 1 m by 1 m, 1.2 m above the ground, wooden frame` |
| Angle | `Corner piece for a Sahel mud-brick house, rounded buttress corner, 3.6 m high, 0.6 m by 0.6 m footprint, hand-plastered banco earth` |
| Rebord de toit | `Flat-roof parapet segment for a Sahel mud-brick house, 4 m long, 0.5 m high, 0.3 m thick, with three protruding wooden toron beams (palm wood sticks) and one small terracotta water spout (gargoyle)` |
| Escalier extérieur | `Exterior mud-brick staircase for a Sahel house, 1.1 m wide, rising 3.6 m to a flat roof, about 8 steps, solid banco side wall, worn rounded edges` |
| Porte (battant seul) | `Traditional wooden door leaf for a Sahel house, 1.36 m wide, 2.3 m high, 6 cm thick, made of vertical planks of weathered palm and acacia wood, iron studs and a simple iron latch, isolated, front view` |
| Volet | `Single wooden window shutter for a Sahel mud-brick house, 1 m by 1 m, weathered planks, iron hinges, isolated` |

### 1.2 Kit haoussa décoré (Zinder, Maradi)

| Module | Prompt |
|---|---|
| Façade décorée | `Modular wall segment of a Hausa mud-brick house from Zinder, Niger, 4 m wide, 3.6 m high, 0.3 m thick, with traditional geometric relief decorations moulded in the earth plaster (interlaced patterns, arches), ochre and white lime accents` |
| Façade avec porte | `Same Hausa decorated wall segment, 4 m wide, 3.6 m high, with a 1.4 m by 2.45 m door opening framed by a large moulded relief arch` |
| Pinacles d'angle | `Corner pinnacle for a Hausa mud-brick roof, a tapering earth horn about 1.2 m high, ochre plaster, to sit on top of a house corner` |

### 1.3 Kit enduit (Niamey)

| Module | Prompt |
|---|---|
| Mur enduit | `Modular wall segment of a modern West African cement house, 4 m wide, 3.6 m high, 0.3 m thick, painted plaster in off-white with dusty lower part and faint water stains` |
| Mur avec porte métallique | `Same painted cement wall segment, 4 m wide, 3.6 m high, with a 1.4 m by 2.45 m opening and a separate painted steel door leaf (faded blue), simple pattern of rectangular panels` |
| Fenêtre à volets | `Same painted cement wall segment with a 1 m by 1 m window and two separate louvered metal shutters painted faded green` |
| Auvent en tôle | `Corrugated iron awning for a Niamey house front, 4 m wide, 1.5 m deep, slightly rusted sheet metal on two thin wooden poles` |

### 1.4 Bâtiments d'un bloc (on n'y entre pas)

| Bâtiment | Prompt |
|---|---|
| Minaret en banco | `Tall Sahel mud-brick minaret inspired by the Sudano-Sahelian architecture of Agadez, tapering pyramid tower about 25 m high, square base about 10 m wide, dozens of protruding wooden toron beams on every side, smooth ochre earth plaster, small openings, game-ready monument` |
| Porte du Birni | `Fortified mud-brick city gate of an old Sahel walled town (birni), arched passage 4 m wide and 5 m high, thick earth walls with crenellations and small towers on both sides, total width about 16 m, ochre banco plaster` |
| Case ronde | `Traditional round hut of rural Niger, 4.6 m diameter mud-brick wall 2 m high, conical thatched roof of dry millet straw, small wooden door, game-ready` |
| Grenier à mil | `Traditional millet granary of Niger, round woven straw and clay container about 2 m high on four short stone feet, conical straw lid` |
| Étal de marché | `Market stall of a Niger street market, wooden frame 4 m by 3.5 m, colourful wax-print fabric awning, simple wooden table, empty` |
| Château d'eau | `Concrete water tower of a Sahel town, round tank on four concrete legs, total height about 18 m, weathered paint` |
| Tente touarègue | `Traditional Tuareg tent made of tanned leather and woven mats on curved wooden arches, about 5 m long, open on one side, desert camp` |
| Puits | `Traditional Sahel well, round low wall of stones and earth about 1.5 m diameter, wooden forked post frame with a pulley and rope, leather bucket` |
| Chevalement de mine | `Steel mining headframe of a desert uranium mine, lattice tower about 15 m high with a big pulley wheel on top, rust and dust, game-ready industrial asset` |
| Pirogue | `Traditional wooden pirogue canoe of the Niger river, long narrow hull about 8 m, painted stripes in faded colours, wooden bench seats` |

---

## 2. Arbres et plantes

### Comment on fait un bel arbre de jeu

Les générateurs « image → 3D » rendent souvent le feuillage comme une boule pleine, lourde et peu réaliste. La méthode pro : **(1)** le tronc et les branches en 3D, **sans feuilles** ; **(2)** une **planche de feuillage** (image PNG sur fond transparent) que je pose moi-même sur des plans légers autour des branches. Pour chaque arbre, il faut donc 2 générations, plus une image de l'arbre entier comme modèle.

| Élément | Prompt |
|---|---|
| Tronc et branches (modèle à adapter) | `Trunk and bare branches only of a [ESPÈCE] tree, no leaves, realistic bark, about [HAUTEUR] m tall, game-ready 3D model, branches ending in thin twigs` |
| Planche de feuillage (image) | `Texture atlas of [ESPÈCE] leaf clusters and small twigs, 8 clusters arranged on a grid, isolated on a transparent background, top-down flat lighting, no shadow, 2048x2048 PNG` |
| Écorce raccordable | `Seamless tileable bark texture of [ESPÈCE], even lighting, no shadows, 1024x1024` |

**Les espèces du jeu** (remplacer `[ESPÈCE]` et `[HAUTEUR]`, ajouter la description à l'image de l'arbre entier) :

| Arbre | Où | Description à ajouter |
|---|---|---|
| Acacia parasol (*Acacia tortilis*), 4 à 6 m | partout | `flat umbrella-shaped crown, thorny twisted branches, tiny leaves, dry savanna` |
| Gao (*Faidherbia albida*), 8 à 12 m | Dosso, Tahoua | `pale grey-white bark, wide crown, small blue-green leaves` |
| Baobab (*Adansonia digitata*), 10 à 14 m | Parc du W, villages | `massive swollen grey trunk 3 m wide, short stubby branches` ; deux versions : `bare dry season` et `rainy season with green leaves` |
| Palmier doum (*Hyphaene thebaica*), 8 à 12 m | bord du fleuve, Ayorou | `forked trunk that splits in two then four, fan-shaped leaves, clusters of orange-brown fruits` |
| Palmier dattier, 10 à 15 m | oasis, Agadez | `straight rough trunk with old leaf bases, crown of long feathery fronds, date clusters` |
| Neem (*Azadirachta indica*), 8 à 12 m | rues de Niamey | `dense dark green rounded crown, straight trunk, shade tree` |
| Caïlcédrat, « arbre à palabres » (*Khaya senegalensis*), 15 m | Dosso | `huge spreading crown, thick trunk, wide shade, majestic village meeting tree` |
| Arbre du Ténéré | Ténéré | `lone gnarled acacia standing alone in an empty sand desert, twisted trunk leaning, sparse thorny crown` |

| Plante | Prompt (faces : 50 à 600) |
|---|---|
| Pommier de Sodome | `Calotropis procera desert shrub, about 2 m, large pale grey-green leaves, purple-white flowers, low poly game-ready` |
| Buisson épineux | `Thorny Sahel scrub bush, about 1.2 m, dry tangled branches with few leaves, low poly game-ready` |
| Touffes d'herbe sèche | `Clumps of dry yellow savanna grass, 5 variations, alpha cutout cards, isolated on transparent background, 1024x1024 PNG` |
| Mil (champ) | `Millet plants, tall stalks about 2.5 m with pearl millet heads, 4 variations, isolated on transparent background, 1024x1024 PNG` |

---

## 3. Animaux

### Ce qu'il faut savoir

Un animal qui marche a besoin d'un **squelette** et d'**animations** (marcher, rester immobile, brouter). Mixamo ne fait que les humains. Deux possibilités :
- Si ton outil propose le **squelette automatique pour quadrupède** (« auto-rig », « animal rig ») : demande les animations `walk`, `idle`, `eat` et exporte en GLB avec le squelette.
- Sinon : un modèle **immobile en pose neutre** (pattes droites et un peu écartées, bouche fermée, queue pendante). Je l'animerai simplement par le code, comme les girafes actuelles.

Image de référence : **vue de profil**, pose neutre, animal entier, fond gris clair uni.

| Animal | Où | Prompt |
|---|---|---|
| Girafe d'Afrique de l'Ouest | Kouré | `West African giraffe (Giraffa camelopardalis peralta), very pale coat with light orange-tan patches and white lower legs, about 5 m tall, side view, neutral standing pose, legs straight` |
| Dromadaire | Agadez, Ténéré | `Sahel dromedary camel, sandy beige coat, single hump, about 2.1 m at the shoulder, side view, neutral standing pose` ; version sellée : `with a traditional Tuareg saddle with high pommel cross and colourful leather bags` |
| Zébu peul | Dosso, Tahoua | `Mbororo zebu cattle of Niger, deep red coat, very large lyre-shaped horns, hump on the shoulders, side view, neutral standing pose` |
| Chèvre rousse de Maradi | Maradi, villages | `Red Maradi goat (Sokoto red goat), short shiny mahogany-red coat, small horns, side view, neutral standing pose` |
| Mouton bali-bali | villages | `Tall Sahel sheep (Uda / bali-bali breed), front half black and back half white, long legs, side view, neutral standing pose` |
| Âne | partout | `Small grey Sahel donkey with a dark stripe on the back, side view, neutral standing pose` |
| Pintade | villages | `Helmeted guinea fowl, grey plumage with white dots, side view, neutral pose` |
| Vautour (dans le ciel) | partout | `African white-backed vulture with wings fully spread in gliding flight, seen from below, game-ready low poly` |
| Hippopotame | fleuve, Ayorou | `Hippopotamus half submerged in a river, only head and back above water, game-ready` |
| Éléphant | Parc du W | `West African savanna elephant, side view, neutral standing pose, game-ready` |

---

## 4. Rochers, sols et textures

### 4.1 Rochers (300 à 1 500 faces, 4 à 6 variantes par type)

| Type | Où | Prompt |
|---|---|---|
| Boules de granite | Aïr, nord | `Rounded granite boulders of the Aïr mountains, Niger, orange-grey stone with dark desert varnish and fine cracks, single boulder about 2 m, game-ready rock asset with normal map` |
| Chaos granitique | Aïr | `Pile of stacked rounded granite boulders, about 5 m high, orange-grey with desert varnish, natural balancing rock formation` |
| Dalle de grès | Ténéré, falaise | `Layered sandstone outcrop slab, flat horizontal strata, ochre and pale pink, weathered edges, about 4 m wide` |
| Termitière | Parc du W, savane | `Tall cathedral termite mound of the West African savanna, red laterite earth, about 2.5 m high, fluted pillars` |
| Cailloux | reg | `Cluster of small dark pebbles and gravel scattered on sand, game-ready decal-like low mesh` |

### 4.2 Sols raccordables (le motif se répète sans couture)

Format : PNG carré **2048 × 2048**, avec si possible la normal map et la rugosité. Cocher « seamless / tileable ».

| Sol | Prompt |
|---|---|
| Sable à rides | `Seamless tileable texture, Sahel desert sand with fine wind ripples, warm ochre, top-down orthographic, even lighting, no shadows, 2048x2048` |
| Dune fine | `Seamless tileable texture, very fine pale golden dune sand of the Ténéré, soft ripples, top-down, even lighting, 2048x2048` |
| Latérite rouge | `Seamless tileable texture, compacted red laterite ground of a Niamey street, small gravel, dust, faint tyre marks, top-down, even lighting, 2048x2048` |
| Argile craquelée | `Seamless tileable texture, dry cracked clay mud of a dried pond near Lake Chad, polygonal cracks, top-down, even lighting, 2048x2048` |
| Reg (plaine de graviers) | `Seamless tileable texture, desert reg gravel plain, dark varnished pebbles on pale sand, top-down, even lighting, 2048x2048` |
| Berge du fleuve | `Seamless tileable texture, wet riverbank mud of the Niger river with hoof prints and grass blades, top-down, even lighting, 2048x2048` |
| Savane sèche | `Seamless tileable texture, dry savanna ground with short yellow grass, leaves and bare soil patches, top-down, even lighting, 2048x2048` |
| Piste | `Seamless tileable texture along one direction, sandy dirt track with two tyre ruts, top-down, even lighting, 2048x1024` |

| Marques au sol (PNG transparent, 1024) | Prompt |
|---|---|
| Traces de pneus | `Tyre tracks in sand, top-down, isolated on transparent background, 1024x1024 PNG` |
| Traces de pas | `Footprints of sandals and bare feet in sand, top-down, isolated on transparent background, 1024x1024 PNG` |
| Fissures | `Ground cracks decal, top-down, isolated on transparent background, 1024x1024 PNG` |

---

## 5. La carte, le ciel et les lieux

### 5.1 Carte illustrée (mini-carte et grande carte)

Le terrain du jeu est **calculé par le code** : une carte générée « au hasard » ne correspondrait pas aux vraies positions des villes. J'ai donc fait une **vue du ciel de notre vraie carte** à utiliser comme image de référence :

- `documentation/guides/carte_guide_sans_texte.jpg` : à donner au générateur (option « image de référence », « image to image » ou « structure reference », force 60 à 80 %) ;
- `documentation/guides/carte_guide_avec_noms.jpg` : pour toi, pour savoir ce qui est où (nord en haut, 480 m de côté).

> `Top-down illustrated game map, same layout as the reference image (keep every river, lake, town and road exactly at the same place): Sahel landscape of Niger seen from above, the Niger river on the left with a bridge, Lake Chad bottom right, a rocky dark ridge in the north, golden dunes in the north-east, villages of mud-brick houses, markets and trees, savanna with green trees in the south. Hand-painted realistic cartography style, warm ochre and sand palette, soft relief shading, no text, no labels, no legend, square 2048x2048`

**Pas de texte** dans l'image : les générateurs écrivent mal les noms. Le jeu affiche lui-même les noms des villes par-dessus.

**Pas de carte de relief** (« heightmap ») : le relief vient du code, il est réglé pour le jeu (rampes, maisons, collisions).

### 5.2 Ciel (panorama autour de la carte)

Format : panorama **équirectangulaire 4096 × 2048** (rapport 2 : 1), **le ciel seul**, sans sol.

| Ciel | Prompt |
|---|---|
| Midi | `Equirectangular 360 sky panorama, Sahel noon sky, deep blue at the zenith fading to a pale dusty white near the horizon, a few thin high clouds, sky only, no ground, no sun flare, 4096x2048` |
| Fin d'après-midi | `Equirectangular 360 sky panorama, Sahel golden hour, warm orange and pink horizon, soft scattered clouds lit from below, sky only, no ground, 4096x2048` |
| Harmattan | `Equirectangular 360 sky panorama, dusty harmattan haze over the Sahel, pale beige-orange sky, the sun a dim white disc behind the dust, sky only, no ground, 4096x2048` |

### 5.3 Bannières des lieux (quand on arrive dans une ville)

Format : **1920 × 640** (bandeau 3 : 1), sans texte.

> `Wide banner illustration, realistic painted game art, [LIEU], warm Sahel light, no text, no logo, 1920x640`

| Lieu | À mettre à la place de `[LIEU]` |
|---|---|
| Niamey | `the Kennedy bridge over the Niger river at sunset, pirogues on the water, the Grand Market roofs` |
| Agadez | `the mud-brick minaret with wooden beams above the old town of Agadez, camels in the foreground` |
| Ténéré | `a lone acacia in an endless golden dune sea of the Ténéré desert` |
| Zinder | `the old walled town (birni) of Zinder with decorated Hausa mud-brick houses and granite rocks` |
| Maradi | `a busy market with wax-print awnings, red goats and millet sacks` |
| Kouré | `pale West African giraffes among tiger bush and acacias at dawn` |
| Dosso | `a huge palaver tree with villagers resting in its shade` |
| Arlit | `a desert mining town with a steel headframe, dusty trucks and workers' houses` |
| Ayorou | `a riverside cattle and fish market on the Niger river with pirogues and hippos` |
| Tahoua | `a crossroads town at the foot of eroded plateaus, trucks and cement houses` |
| Diffa / lac Tchad | `the shore of Lake Chad with reeds, fishing canoes and cracked mud` |
| Parc du W | `a savanna with baobabs, a river bend and elephants` |
| Tillabéri | `a calm riverside town on the far bank of the Niger, rice fields and palm trees` |

---

## 6. Par quoi commencer, et comment m'envoyer les fichiers

Ordre conseillé (le plus visible d'abord) :

1. **Planche de style** (§ 0) : elle sert de référence à tout le reste.
2. **Kit banco** (§ 1.1) : mur, mur avec porte, mur avec fenêtre, rebord de toit, battant de porte. C'est ce qu'on voit le plus.
3. **Acacia, doum et baobab** (§ 2), plus les touffes d'herbe.
4. **Rochers de granite** et **sols** sable, latérite, reg (§ 4).
5. **Carte illustrée** et **ciel** (§ 5).
6. **Animaux** : girafe, dromadaire, chèvre rousse (§ 3).
7. Le reste : kits haoussa et enduit, monuments, bannières.

Pour chaque envoi : le **GLB** (ou le PNG pour une texture), l'**image** qui a servi, le **nom de l'outil**, et à quoi il sert (par exemple : « kit banco, mur avec porte »). Tu peux m'envoyer les fichiers par lots. Je les intègre, je règle leur taille et leur collision, et je mesure avant et après pour que le jeu reste fluide sur téléphone.
