/* =====================================================================
   ARSENAL — Fada Royale v2.0 : catalogue unique des armes, raretés et munitions
   Toutes les valeurs de jeu des armes sont ici (index.html les lit, rien n'est recopié ailleurs).
   - rar   : rareté de base de l'arme (ses statistiques ci-dessous sont celles de cette rareté)
   - rars  : raretés possibles au sol [min, max]
   - mode  : 'auto' (tir continu en gardant le doigt) ou 'semi' (un coup par appui à la souris ; au doigt, garder appuyé
             retire à la cadence de l'arme, comme sur les jeux mobiles)
   - ammo  : type de munitions (AMMO)
   - dmg (par balle ou par plomb), head (multiplicateur tête), rate (s entre deux tirs), mag (chargeur), reload (s),
     spread (dispersion, rad), adsSpread (en visée à la lunette), range (m), piece (dégâts aux constructions), bloom (dispersion
     ajoutée par tir), kick (recul de la caméra, rad), fore (main gauche : distance de la poignée au garde-main), slow (vitesse),
     bot (réglages des bots : dégâts, délais, rafales, précision)
   Rareté : chaque cran au-dessus de la rareté de base = +6 % de dégâts (aussi aux constructions), −6 % de temps de rechargement,
   −5 % de dispersion ; en dessous, l'inverse. Une arme à sa rareté de base garde exactement les valeurs du tableau.
   ===================================================================== */

export const RARITY = [
  { name: 'Commun',     css: '#9aa0a6', col: 0x9aa0a6 },
  { name: 'Peu commun', css: '#63c74d', col: 0x63c74d },
  { name: 'Rare',       css: '#3d8bff', col: 0x3d8bff },
  { name: 'Épique',     css: '#b65cff', col: 0xb65cff },
  { name: 'Légendaire', css: '#ff9a1f', col: 0xff9a1f },
];
export const RAR_COL = RARITY.map(r => r.col), RAR_CSS = RARITY.map(r => r.css);

// munitions : plafond transporté, contenu d'une caisse au sol, couleur de la caisse
export const AMMO = {
  light:  { name: 'Munitions légères',  short: 'LÉGÈRES',   cap: 360, box: 30, col: 0xe0c060 },
  medium: { name: 'Munitions moyennes', short: 'MOYENNES',  cap: 300, box: 30, col: 0x6fbf5a },
  heavy:  { name: 'Munitions lourdes',  short: 'LOURDES',   cap: 60,  box: 6,  col: 0xd0503a },
  shells: { name: 'Cartouches',         short: 'CARTOUCHES', cap: 60, box: 10, col: 0x4a8fd8 },
};
export const AMMO_TYPES = Object.keys(AMMO);

export const WEAP = {
  daba: { name: 'Daba', sn: 'DABA', melee: true, rate: 0.45, rar: 0, rars: [0, 0], mode: 'semi' },
  revolver: { name: 'Revolver', sn: 'COLT', mode: 'semi', ammo: 'light', rars: [0, 2], dmg: 40, head: 2, rate: 0.42, mag: 6, reload: 2.0, spread: 0.007, range: 140, piece: 35, bloom: 0.3, kick: 0.03, rar: 1, fore: -0.02, bot: { dmg: 15, cd: [0.55, 0.95], acc: 1.05 } },
  mitraillette: { name: 'Mitraillette', sn: 'MITRA', mode: 'auto', ammo: 'light', rars: [0, 3], dmg: 14, head: 1.6, rate: 0.075, mag: 30, reload: 1.8, spread: 0.022, range: 85, piece: 16, bloom: 0.07, kick: 0.005, rar: 1, fore: 0.2, bot: { dmg: 6, cd: 0.085, burst: [6, 10], pause: [0.6, 1.2], acc: 0.9 } },
  fusil: { name: "Fusil d'assaut", sn: 'FUSIL', mode: 'auto', ammo: 'medium', rars: [0, 4], dmg: 25, head: 1.6, rate: 0.13, mag: 30, reload: 1.9, spread: 0.011, range: 170, piece: 30, bloom: 0.12, kick: 0.007, rar: 2, fore: 0.3, bot: { dmg: 11, cd: 0.16, burst: [3, 6], pause: [0.8, 1.6], acc: 1 } },
  // v2.0 : fusil tactique beige (tir précis semi-automatique), modèle construit dans le code (weapon-models.js)
  tactique: { name: 'Fusil tactique', sn: 'TACTIQUE', mode: 'semi', ammo: 'medium', rars: [1, 4], dmg: 36, head: 2, rate: 0.24, mag: 20, reload: 2.0, spread: 0.007, range: 220, piece: 34, bloom: 0.08, kick: 0.014, rar: 3, fore: 0.3, bot: { dmg: 15, cd: [0.32, 0.55], acc: 1.05 } },
  pompe: { name: 'Pompe', sn: 'POMPE', mode: 'semi', ammo: 'shells', rars: [0, 3], dmg: 11, pellets: 9, head: 1.5, rate: 0.85, mag: 5, reload: 2.2, spread: 0.075, range: 55, piece: 12, bloom: 0, kick: 0.035, rar: 2, fore: 0.33, bot: { shotgun: true, cd: [0.9, 1.3] } },
  // v2.0 : pompe tactique noire à canon long (semi-automatique : moins de dégâts par plomb, tire plus vite), modèle construit dans le code
  pompet: { name: 'Pompe tactique', sn: 'P. TACT.', mode: 'semi', ammo: 'shells', rars: [1, 4], dmg: 8.5, pellets: 8, head: 1.5, rate: 0.34, mag: 8, reload: 2.4, spread: 0.065, range: 50, piece: 10, bloom: 0, kick: 0.022, rar: 2, fore: 0.32, bot: { shotgun: true, cd: [0.42, 0.65] } },
  mitrailleuse: { name: 'Mitrailleuse', sn: 'MINIMI', mode: 'auto', ammo: 'medium', rars: [2, 4], dmg: 22, head: 1.5, rate: 0.1, mag: 80, reload: 4.0, spread: 0.019, range: 150, piece: 34, bloom: 0.05, kick: 0.009, rar: 3, fore: 0.28, slow: 0.85, bot: { dmg: 9, cd: 0.1, burst: [8, 14], pause: [0.9, 1.6], acc: 0.95 } },
  sniper: { name: 'Sniper', sn: 'SNIPER', mode: 'semi', ammo: 'heavy', rars: [2, 4], dmg: 95, head: 2.5, rate: 1.5, mag: 5, reload: 2.8, spread: 0.05, adsSpread: 0.0006, range: 450, piece: 70, bloom: 0, kick: 0.05, rar: 4, fore: 0.36, scope: true, bot: { dmg: 45, cd: [1.8, 2.8], sniper: true } },
};
export const GUNS = ['revolver', 'mitraillette', 'fusil', 'tactique', 'pompe', 'pompet', 'mitrailleuse', 'sniper'];
// fréquence au sol (boost 0) et dans les coffres (boost 1) : les armes puissantes sont plus rares
const LOOT_W = { revolver: [24, -8], mitraillette: [20, -4], fusil: [20, 0], tactique: [8, 3], pompe: [14, 2], pompet: [7, 3], mitrailleuse: [6, 4], sniper: [5, 4] };
export function randGun(boost = 0) { let tot = 0; for (const g of GUNS) tot += Math.max(1, LOOT_W[g][0] + LOOT_W[g][1] * boost); let r = Math.random() * tot;
  for (const g of GUNS) { r -= Math.max(1, LOOT_W[g][0] + LOOT_W[g][1] * boost); if (r <= 0) return g; } return 'fusil'; }
// rareté tirée au sort dans les raretés possibles de l'arme (les plus communes plus fréquentes ; les coffres font mieux)
const RAR_W = [[46, 30, 16, 6, 2], [18, 30, 28, 16, 8]];
export function rollRarity(type, boost = 0) { const [a, b] = WEAP[type].rars || [WEAP[type].rar, WEAP[type].rar], w = RAR_W[boost ? 1 : 0];
  let tot = 0; for (let r = a; r <= b; r++) tot += w[r]; let x = Math.random() * tot; for (let r = a; r <= b; r++) { x -= w[r]; if (x <= 0) return r; } return a; }
// effet de la rareté (par rapport à la rareté de base de l'arme)
export function rarMul(type, rar) { const d = (rar ?? WEAP[type].rar) - WEAP[type].rar; return { dmg: 1 + 0.06 * d, reload: Math.max(0.6, 1 - 0.06 * d), spread: Math.max(0.6, 1 - 0.05 * d) }; }
export const ammoOf = type => (WEAP[type] && WEAP[type].ammo) || null;
