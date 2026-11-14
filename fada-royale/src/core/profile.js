/* =====================================================================
   PROFIL LOCAL DU JOUEUR — Fada Royale v1.0
   Tout est enregistré sur CET appareil (localStorage « fr_profile »). Pas de serveur, pas de compte,
   pas d'achat réel : les cauris sont une monnaie de jeu gagnée en jouant.
   Les statistiques ne contiennent que ce qui a réellement été mesuré pendant les parties
   (compteurs démarrés en v1.0 : rien n'est inventé pour les parties jouées avant).
   ===================================================================== */
const KEY = 'fr_profile';
const VERSION = 1;

const newStats = () => ({ games: 0, wins: 0, kills: 0, dmg: 0, built: 0, chests: 0, harvest: 0, top10: 0, top5: 0, bestRank: 0, time: 0 });
const newCounters = () => ({ games: 0, wins: 0, kills: 0, dmg: 0, built: 0, chests: 0, harvest: 0, top10: 0, top5: 0 });

function defaults() {
  return {
    v: VERSION, name: '', skin: 'boss', xp: 0, cauris: 0,
    frame: 'bronze', glider: 0, outfits: {},            // outfits : { boss: index de tenue ou -1 (d'origine) }
    owned: { frame_bronze: true, glider_0: true },
    stats: newStats(), since: Date.now(),
    periods: { daily: null, weekly: null },
    last: null,                                          // résumé de la dernière partie (écran de fin)
  };
}

export function loadProfile() {
  let p = null;
  try { p = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { p = null; }
  const d = defaults();
  if (!p || typeof p !== 'object') {
    p = d;
    // reprise des réglages de la v0.9 (pseudo et perso)
    try { p.name = (localStorage.getItem('fr_name') || '').slice(0, 14); p.skin = localStorage.getItem('fr_skin') || 'boss'; } catch (e) {}
  }
  for (const k in d) if (p[k] === undefined) p[k] = d[k];
  p.stats = Object.assign(newStats(), p.stats || {});
  p.owned = Object.assign({}, d.owned, p.owned || {});
  p.outfits = p.outfits && typeof p.outfits === 'object' ? p.outfits : {};
  p.periods = p.periods || { daily: null, weekly: null };
  return p;
}

export function saveProfile(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); localStorage.setItem('fr_name', p.name || ''); localStorage.setItem('fr_skin', p.skin); } catch (e) {}
}

/* ---------- niveau ---------- */
// passer du niveau L au niveau L+1 coûte 200 + 100×(L−1) XP
export function levelInfo(xp) {
  let level = 1, need = 200, rest = Math.max(0, xp | 0);
  while (rest >= need && level < 99) { rest -= need; level++; need = 200 + 100 * (level - 1); }
  return { level, cur: rest, need, pct: rest / need };
}

/* ---------- récompenses d'une partie (Battle Royale uniquement) ---------- */
export function matchRewards(r) {
  let xp = 40 + r.kills * 30 + Math.round(r.dmg / 10) + Math.min(40, Math.round(r.built / 2));
  let cauris = 5 + r.kills * 3;
  if (r.won) { xp += 200; cauris += 40; }
  else if (r.rank <= 5) { xp += 80; cauris += 15; }
  else if (r.rank <= 10) { xp += 35; cauris += 6; }
  return { xp, cauris };
}

/* ---------- missions ---------- */
const TEMPLATES = {
  daily: [
    { id: 'kills', t: 'Élimine {n} adversaires', n: [3, 5], xp: 120, c: 15 },
    { id: 'games', t: 'Joue {n} parties de Battle Royale', n: [2, 3], xp: 100, c: 10 },
    { id: 'top10', t: 'Termine {n} fois dans le top 10', n: [1, 2], xp: 120, c: 15 },
    { id: 'built', t: 'Pose {n} pièces de banco', n: [20, 40], xp: 100, c: 12 },
    { id: 'dmg', t: 'Inflige {n} dégâts', n: [400, 800], xp: 120, c: 15 },
    { id: 'chests', t: 'Ouvre {n} coffres', n: [3, 5], xp: 90, c: 10 },
    { id: 'harvest', t: 'Récolte {n} banco à la daba', n: [100, 200], xp: 90, c: 10 },
  ],
  weekly: [
    { id: 'wins', t: 'Gagne une partie (TOP 1)', n: [1, 1], xp: 500, c: 80 },
    { id: 'kills', t: 'Élimine {n} adversaires', n: [20, 30], xp: 400, c: 60 },
    { id: 'games', t: 'Joue {n} parties', n: [10, 12], xp: 350, c: 50 },
    { id: 'built', t: 'Pose {n} pièces de banco', n: [150, 250], xp: 350, c: 50 },
    { id: 'top5', t: 'Termine {n} fois dans le top 5', n: [3, 5], xp: 400, c: 60 },
    { id: 'dmg', t: 'Inflige {n} dégâts', n: [3000, 5000], xp: 400, c: 60 },
  ],
};
const pad = n => String(n).padStart(2, '0');
export function dayKey(d = new Date()) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
export function weekKey(d = new Date()) { // semaine ISO 8601
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return t.getUTCFullYear() + '-S' + pad(Math.ceil(((t - y0) / 86400000 + 1) / 7));
}
function seeded(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
function roundNice(n) { return n >= 1000 ? Math.round(n / 100) * 100 : n >= 100 ? Math.round(n / 10) * 10 : n >= 20 ? Math.round(n / 5) * 5 : Math.round(n); }

function periodFor(p, kind, now) {
  const key = kind === 'daily' ? dayKey(now) : weekKey(now);
  let per = p.periods[kind];
  if (!per || per.key !== key) {
    const rnd = seeded(kind + key); const pool = [...TEMPLATES[kind]]; const list = [];
    while (list.length < 3 && pool.length) { const i = Math.floor(rnd() * pool.length); const t = pool.splice(i, 1)[0];
      const n = roundNice(t.n[0] + (t.n[1] - t.n[0]) * rnd()); list.push({ id: kind[0] + '_' + t.id, metric: t.id, text: t.t.replace('{n}', n), n, xp: t.xp, c: t.c }); }
    per = p.periods[kind] = { key, list, c: newCounters(), claimed: {} };
  }
  return per;
}
export function missions(p, now = new Date()) {
  const out = {};
  for (const kind of ['daily', 'weekly']) {
    const per = periodFor(p, kind, now);
    out[kind] = per.list.map(m => { const v = Math.min(m.n, per.c[m.metric] || 0); return { ...m, kind, value: v, done: v >= m.n, claimed: !!per.claimed[m.id] }; });
  }
  return out;
}
export function claimable(p) { const m = missions(p); return [...m.daily, ...m.weekly].filter(x => x.done && !x.claimed).length; }
export function claimMission(p, kind, id) {
  const per = periodFor(p, kind, new Date()); const m = per.list.find(x => x.id === id); if (!m) return null;
  if (per.claimed[id] || (per.c[m.metric] || 0) < m.n) return null;
  per.claimed[id] = true; p.xp += m.xp; p.cauris += m.c; saveProfile(p); return { xp: m.xp, cauris: m.c };
}

/* ---------- enregistrement d'une partie terminée ---------- */
// r : { mode, rank, total, kills, dmg, built, chests, harvest, won, time }
export function recordMatch(p, r) {
  const before = levelInfo(p.xp).level;
  const done0 = new Set([...missions(p).daily, ...missions(p).weekly].filter(m => m.done).map(m => m.id));
  const s = p.stats;
  s.games++; s.kills += r.kills; s.dmg += Math.round(r.dmg); s.built += r.built; s.chests += r.chests; s.harvest += r.harvest; s.time += Math.round(r.time);
  if (r.won) s.wins++; if (r.rank <= 10) s.top10++; if (r.rank <= 5) s.top5++;
  if (!s.bestRank || r.rank < s.bestRank) s.bestRank = r.rank;
  const inc = { games: 1, wins: r.won ? 1 : 0, kills: r.kills, dmg: Math.round(r.dmg), built: r.built, chests: r.chests, harvest: r.harvest, top10: r.rank <= 10 ? 1 : 0, top5: r.rank <= 5 ? 1 : 0 };
  for (const kind of ['daily', 'weekly']) { const per = periodFor(p, kind, new Date()); for (const k in inc) per.c[k] = (per.c[k] || 0) + inc[k]; }
  const rw = matchRewards(r); p.xp += rw.xp; p.cauris += rw.cauris;
  const after = levelInfo(p.xp).level;
  const newly = [...missions(p).daily, ...missions(p).weekly].filter(m => m.done && !done0.has(m.id)).map(m => m.text);
  p.last = { ...r, xp: rw.xp, cauris: rw.cauris, levelUp: after > before ? after : 0, missions: newly, at: Date.now() };
  saveProfile(p);
  return p.last;
}

/* ---------- boutique (locale) ---------- */
export function owns(p, id) { return !!p.owned[id]; }
export function buy(p, id, price) {
  if (owns(p, id)) return 'déjà';
  if (p.cauris < price) return 'cauris';
  p.cauris -= price; p.owned[id] = true; saveProfile(p); return 'ok';
}
