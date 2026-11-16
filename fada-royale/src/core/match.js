/* =====================================================================
   PARTIE — Fada Royale v2.0 : réglages centralisés de la carte, de la tempête (l'harmattan) et des bots
   (index.html les lit, rien n'est recopié ailleurs)
   ===================================================================== */

// Carte : demi-côté en mètres (v1.0 : 240 → 480 m de côté ; v2.0 : 340 → 680 m de côté, ≈ 2 × la surface)
export const MAP = 340;

/* Tempête : rayon de départ (couvre toute la carte), décalage max. du 1er cercle depuis le centre, puis les phases :
   wait = attente avant que la zone se resserre (s), shrink = durée du resserrement (s), r = rayon de la zone suivante (m),
   dps = dégâts par seconde hors de la zone.
   v1.0 : 5 phases, tempête finie en ≈ 5 min. v2.0 : 7 phases, tempête finie en 18 min (+ ≈ 1 min de taxi-brousse et de
   descente). Mesuré (tests/partie.cjs, 49 bots) : les derniers survivants se trouvent pendant les phases 4 à 6, une partie dure
   15 à 20 minutes. */
export const STORM = {
  startR: 500,
  firstOff: 200,
  phases: [
    { wait: 150, shrink: 90, r: 250, dps: 1 },
    { wait: 140, shrink: 80, r: 160, dps: 2 },
    { wait: 120, shrink: 70, r: 95, dps: 3 },
    { wait: 100, shrink: 60, r: 52, dps: 5 },
    { wait: 70, shrink: 50, r: 24, dps: 7 },
    { wait: 50, shrink: 40, r: 9, dps: 9 },
    { wait: 30, shrink: 35, r: 0, dps: 12 },
  ],
};
export const stormTotal = () => STORM.phases.reduce((a, p) => a + p.wait + p.shrink, 0);

/* Bots : nombre réglable dans Paramètres › Partie (joueurs = bots + toi). Par défaut : 49 sur ordinateur, 39 au téléphone,
   29 sur un téléphone modeste (profil graphique Très faible). Mesuré en v2.0 : voir TEST_REPORT. */
export const BOTS = { min: 19, max: 59, step: 5, def: { pc: 49, touch: 39, small: 29 } };

/* Profils de bots. Les valeurs multiplient le comportement « normal » (celui des versions précédentes).
   acc     : précision des tirs           react : délai de réaction en secondes [min, max] avant le 1er tir
   sight   : portée de perception         build : chance de construire un mur quand il est touché
   heal    : se met à couvert pour se soigner sous ce total vie + bouclier
   strafe  : pas de côté en combat         jump : chance de sauter en esquivant
   rotate  : marge (s) pour rejoindre la zone avant que la tempête n'avance
   loot    : rayon de recherche du butin (m) */
export const BOT_PROFILES = {
  debutant: { name: 'Débutant', acc: 0.7,  react: [1.0, 1.7], sight: 0.8,  build: 0.2,  heal: 45, strafe: 0.6, jump: 0.05, rotate: 6,  loot: 20 },
  normal:   { name: 'Normal',   acc: 1,    react: [0.7, 1.3], sight: 1,    build: 0.5,  heal: 60, strafe: 1,   jump: 0.15, rotate: 14, loot: 26 },
  avance:   { name: 'Avancé',   acc: 1.25, react: [0.4, 0.8], sight: 1.15, build: 0.85, heal: 75, strafe: 1.2, jump: 0.25, rotate: 22, loot: 34 },
};
// niveau choisi : un profil pour tous, ou « mélangé » (répartition ci-dessous)
export const BOT_LEVELS = { debutant: 'Débutants', normal: 'Normaux', avance: 'Avancés', mixte: 'Mélangés' };
export const BOT_MIX = { debutant: 0.35, normal: 0.45, avance: 0.2 };
export function botProfileFor(level, i, n) {
  if (BOT_PROFILES[level]) return level;
  // mélange réparti (pas tiré au sort) : sur n bots, 35 % débutants, 45 % normaux, 20 % avancés, entremêlés
  const u = ((i * 0.618034) % 1); return u < BOT_MIX.debutant ? 'debutant' : u < BOT_MIX.debutant + BOT_MIX.normal ? 'normal' : 'avance';
}
