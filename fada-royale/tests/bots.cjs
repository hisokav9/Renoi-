// v2.0 : carte agrandie, tempête, nombre et niveau des bots
// 1. carte : 21 lieux (13 + 8 nouveaux), les 8 nouveaux ont des maisons ouvertes (porte), du butin et un coffre ; le nom de la zone s'affiche
// 2. tempête : 7 phases, durée totale, rayon de départ qui couvre la carte
// 3. nombre de bots réglé dans Paramètres › Partie (19, 39, 59) : bots en jeu, hors jeu, joueurs affichés dans le HUD
// 4. niveaux : répartition « mélangés », et effet réel du profil : 1 tireur débutant puis 1 avancé contre la même cible
//    (précision et délai avant le 1er tir, mesurés sur les vrais tirs du jeu)
// 5. calcul : tous les bots au sol dans un rayon de 150 m autour du joueur (pire cas), ms par image de jeu (logique + animation)
// Usage : node tests/bots.cjs http://127.0.0.1:8000/index.html
const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } }); await ctx.addInitScript(() => localStorage.setItem('fr_q', 'low'));
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=0'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  const pb = [];
  // 1-2. carte et tempête
  const map = await page.evaluate(() => { const FR = window.FR; const C = FR.CITIES, N = ['camp', 'bilma', 'malbaza', 'djado', 'termit', 'filingue', 'goure', 'gaya'];
    const zones = N.map(id => { const c = C.find(x => x.id === id); const hs = FR.housesInfo.filter(h => Math.hypot((h.minX + h.maxX) / 2 - c.x, (h.minZ + h.maxZ) / 2 - c.z) < c.r + 6);
      const loot = FR.lootSpots.filter(s => Math.hypot(s[0] - c.x, s[2] - c.z) < c.r + 8).length, chest = FR.chestSpots.filter(s => Math.hypot(s[0] - c.x, s[2] - c.z) < c.r + 8).length;
      return { zone: c.name, maisons: hs.length, avecPorte: hs.filter(h => h.door).length, butin: loot, coffres: chest, nomAffiche: FR.zoneAt(c.x + 3, c.z + 3).name }; });
    return { lieux: C.length, cote: FR.MAP * 2, zones, tempete: { phases: FR.STORM.phases.length, total: FR.stormTotal(), rayonDepart: FR.STORM.startR, coinCouvert: Math.hypot(FR.MAP, FR.MAP) < FR.STORM.startR } }; });
  console.log('carte    ', JSON.stringify({ lieux: map.lieux, cote: map.cote, tempete: map.tempete }));
  for (const z of map.zones) console.log('  ', JSON.stringify(z));
  if (map.lieux !== 21 || map.zones.some(z => z.butin < 4 || z.coffres < 1 || z.nomAffiche !== z.zone || (z.zone !== 'Termit' && z.avecPorte < 3))) pb.push('nouvelles zones');
  if (map.tempete.phases !== 7 || map.tempete.total < 15 * 60 || map.tempete.total > 20 * 60 || !map.tempete.coinCouvert) pb.push('tempête');
  // 3. nombre de bots
  const counts = [];
  for (const n of [19, 59, 39]) { counts.push(await page.evaluate(n => { const FR = window.FR; FR.openSettings(); FR.renderTab('match'); const inp = document.querySelector('#sBody input[type=range]'); inp.value = n; inp.dispatchEvent(new Event('input')); FR.closeSettings();
      FR.startMatch('br'); window.__freeze = true; FR.update(1 / 30); const chip = document.getElementById('aliveChip').textContent;
      const r = { reglage: FR.SET.botCount, enJeu: FR.bots.filter(b => b.inMatch).length, horsJeu: FR.bots.filter(b => !b.inMatch).length, horsJeuVisibles: FR.bots.filter(b => !b.inMatch && (b.alive || b.model.g.visible)).length, joueurs: FR.aliveCount, hud: chip.trim() };
      FR.goMenu(); window.__freeze = false; return r; }, n)); }
  console.log('nombre   ', JSON.stringify(counts));
  if (counts.some(c => c.enJeu !== c.reglage || c.joueurs !== c.reglage + 1 || c.horsJeuVisibles || !c.hud.includes('/ ' + (c.reglage + 1)))) pb.push('nombre de bots');
  // 4. niveaux
  const mix = await page.evaluate(() => { const FR = window.FR; FR.SET.botLevel = 'mixte'; FR.SET.botCount = 49; FR.startMatch('br'); const inm = FR.bots.filter(b => b.inMatch), k = {}; for (const b of inm) k[b.profKey] = (k[b.profKey] || 0) + 1; FR.goMenu(); return k; });
  console.log('mélangés ', JSON.stringify(mix)); if (!(mix.debutant >= 15 && mix.debutant <= 19 && mix.normal >= 20 && mix.normal <= 24 && mix.avance >= 8 && mix.avance <= 12)) pb.push('répartition des niveaux');
  // duels sur un terrain dégagé connu (zone d'Entraînement, plate et sans obstacle), ligne de vue vérifiée ; 6 duels de 40 s par niveau
  const duel = {};
  for (const lvl of ['debutant', 'normal', 'avance']) duel[lvl] = await page.evaluate(lvl => { const FR = window.FR; let shots = 0, hits = 0, firsts = [], runs = 0, skipped = 0;
    for (let rep = 0; rep < 6; rep++) { FR.SET.botLevel = lvl; FR.SET.botCount = 19; FR.startMatch('br'); window.__freeze = true; FR.spectate();
      const step = n => { for (let i = 0; i < n; i++) FR.update(1 / 30); }; FR.bus.t = FR.bus.dur; step(2);
      const [a, t] = FR.bots; for (const b of FR.bots.slice(2)) { b.alive = false; b.model.g.visible = false; }
      const x0 = 62, z0 = -42 + rep * 7;
      for (const [b, dx] of [[a, -11], [t, 11]]) { b.phase = 'ground'; b.grounded = true; b.pos.set(x0 + dx, FR.terrainH(x0 + dx, z0) + 0.1, z0); b.vel.set(0, 0, 0); b.model.g.visible = true; b.hp = 100; b.shield = 0; b.landedAt = -99; }
      a.slots = ['fusil', null, null, null, null]; a.srar = [2, 0, 0, 0, 0]; a.mag = { fusil: 30 }; a.sel = 1; a.cur = 'fusil'; a.yaw = -Math.PI / 2; a.banco = 0;
      t.slots = [null, null, null, null, null]; t.cur = 'daba'; t.banco = 0; t.yaw = Math.PI / 2;
      FR.storm.state = 'done'; FR.storm.r = 9999; step(1); if (!FR.hasLOS(a, t)) { skipped++; FR.goMenu(); continue; }
      FR.BSTAT.shots = 0; FR.BSTAT.hits = 0; let first = -1;
      for (let i = 0; i < 30 * 40; i++) { t.hp = 100; t.shield = 0; t.target = null; t.moveTarget = null; t.pos.set(x0 + 11, FR.terrainH(x0 + 11, z0) + 0.05, z0); t.vel.set(0, 0, 0); a.ammoT.medium = 999; if (a.mag.fusil < 5) a.mag.fusil = 30;
        a.pos.x = x0 - 11; a.pos.z = z0; step(1); if (first < 0 && FR.BSTAT.shots > 0) first = i / 30; }
      shots += FR.BSTAT.shots; hits += FR.BSTAT.hits; if (first >= 0) firsts.push(first); runs++; FR.goMenu(); }
    window.__freeze = false; return { profil: FR.SET.botLevel, duels: runs, sansLigneDeVue: skipped, tirs: shots, touches: hits, precision: +(hits / Math.max(1, shots) * 100).toFixed(1), premierTirMoyen: +(firsts.reduce((x, y) => x + y, 0) / Math.max(1, firsts.length)).toFixed(2) }; }, lvl);
  console.log('duel     ', JSON.stringify(duel));
  if (!(duel.debutant.precision < duel.normal.precision && duel.normal.precision < duel.avance.precision) || !(duel.debutant.premierTirMoyen > duel.avance.premierTirMoyen) || Object.values(duel).some(d => d.duels < 4)) pb.push('effet des niveaux');
  // 5. calcul, pire cas : tous les bots au sol autour du joueur
  const perf = [];
  for (const n of [19, 39, 49, 59]) perf.push(await page.evaluate(n => { const FR = window.FR; FR.SET.botLevel = 'mixte'; FR.SET.botCount = n; FR.startMatch('br'); window.__freeze = true;
      const p = FR.player; FR.bus.t = FR.bus.dur; FR.update(1 / 30); const c = FR.CITIES.find(x => x.id === 'agadez'); p.phase = 'ground'; p.pos.set(c.x, FR.terrainH(c.x, c.z) + 0.2, c.z);
      FR.bots.filter(b => b.inMatch).forEach((b, i) => { const a = i * 2.4, d = 8 + (i % 15) * 9.5; b.phase = 'ground'; b.grounded = true; b.model.g.visible = true; b.vel.set(0, 0, 0); const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d; b.pos.set(x, FR.terrainH(x, z) + 1, z); b.landedAt = -99; });
      for (let i = 0; i < 60; i++) { p.hp = 100; FR.update(1 / 30); }
      const t0 = performance.now(); let k = 0; for (; k < 300; k++) { p.hp = 100; p.shield = 100; FR.update(1 / 30); } const ms = (performance.now() - t0) / k;
      const vis = FR.bots.filter(b => b.inMatch && b.alive && b.model.g.visible).length; const r = { bots: n, msParImage: +ms.toFixed(2), botsVivantsAffiches: vis, enVie: FR.aliveCount }; FR.goMenu(); window.__freeze = false; return r; }, n));
  console.log('calcul   ', JSON.stringify(perf));
  console.log(pb.length ? 'À REVOIR : ' + pb.join(' ; ') : 'tout est bon'); console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
