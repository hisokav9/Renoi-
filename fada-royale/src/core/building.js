/* =====================================================================
   CONSTRUCTIONS — Fada Royale v2.0 : réglages centralisés (index.html les lit, rien n'est recopié ailleurs)
   hp    : points de vie une fois finie (pendant la pose, la pièce part de 10 % et monte jusqu'au maximum)
   time  : temps de pose (s) ; cost : banco par pièce
   resist: dégâts reçus = dégâts de l'attaque × DMG_TAKEN[type d'attaque] / resist
   v2.0 : PV doublés (mur 150 → 300, autres 140 → 280) : un mur tient ≈ 10 balles de fusil d'assaut au lieu de 5.
   ===================================================================== */
export const BUILD = {
  wall:  { hp: 300, time: 1.6, cost: 10, resist: 1 },
  ramp:  { hp: 280, time: 1.6, cost: 10, resist: 1 },
  floor: { hp: 280, time: 1.3, cost: 10, resist: 1 },
  cone:  { hp: 280, time: 1.3, cost: 10, resist: 1 },
};
// part des dégâts de chaque type d'attaque appliquée aux constructions (balles du joueur, des bots, coups de daba)
export const DMG_TAKEN = { bullet: 1, bot: 1, melee: 1 };
export const BUILD_START_HP = 0.1; // part des PV au début de la pose
