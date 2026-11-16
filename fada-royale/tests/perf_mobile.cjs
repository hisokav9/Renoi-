// v2.0 : coût de calcul au téléphone (approximation) — Pixel 7 paysage, commandes tactiles, profil Faible,
// processeur ralenti ×4 par Chrome (CDP Emulation.setCPUThrottlingRate, la même approximation d'un téléphone milieu de gamme que
// Lighthouse). Ce n'est PAS un vrai téléphone : le rendu (GPU) n'est pas mesurable ici (rendu logiciel), seul le calcul du jeu l'est.
// Mesures (ms par image de jeu, logique + animation des persos, sans le rendu) :
// 1. Entraînement, chaque arme en train de tirer (8 armes)
// 2. Battle Royale, après l'atterrissage, joueur dans une ville, 29 / 39 / 59 bots répartis sur la carte (cas courant)
// 3. pire cas : tous les bots au sol dans un rayon de 150 m autour du joueur
// Usage : node tests/perf_mobile.cjs http://127.0.0.1:8000/index.html [ralentissement=4]
const { chromium, devices } = require('playwright'); const [,, base, thr = '4'] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const o = { ...devices['Pixel 7 landscape'] }; delete o.defaultBrowserType; const ctx = await browser.newContext(o); await ctx.addInitScript(() => localStorage.setItem('fr_q', 'low'));
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=1'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +thr });
  const res = {};
  // 0. lancement : première partie (les persos des bots sont créés à ce moment-là), page neuve pour chaque nombre de bots
  res.lancement = {};
  for (const n of [19, 29, 39, 59]) { const c2 = await browser.newContext(o); await c2.addInitScript(() => localStorage.setItem('fr_q', 'low')); const p2 = await c2.newPage(); p2.on('pageerror', e => errs.push(e.message));
    await p2.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
    await p2.goto(base + '?touch=1'); await p2.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
    const s2 = await c2.newCDPSession(p2); await s2.send('Emulation.setCPUThrottlingRate', { rate: +thr });
    res.lancement[n] = await p2.evaluate(n => { const FR = window.FR; FR.SET.botCount = n; window.__freeze = true; const t0 = performance.now(); FR.startMatch('br'); const t1 = performance.now(); FR.goMenu(); const t2 = performance.now(); FR.startMatch('br'); const t3 = performance.now(); FR.goMenu(); return { premiere: Math.round(t1 - t0), suivante: Math.round(t3 - t2) }; }, n);
    await c2.close(); }
  console.log('lancement (ms, persos créés à la 1re partie)', JSON.stringify(res.lancement));
  res.armes = await page.evaluate(() => { const FR = window.FR; FR.startMatch('train'); const p = FR.player; window.__freeze = true; window.__keepAmmo = false; const out = {};
    for (const w of ['revolver', 'mitraillette', 'fusil', 'tactique', 'pompe', 'pompet', 'mitrailleuse', 'sniper']) { p.slots = [w, null, null, null, null]; p.srar = [FR.WEAP[w].rar, 0, 0, 0, 0]; p.mag = { [w]: FR.WEAP[w].mag }; FR.selectSlot(1); for (let i = 0; i < 25; i++) FR.update(1 / 30);
      FR.setCam(0, -0.02); FR.setFiring(true); const t0 = performance.now(); for (let i = 0; i < 90; i++) FR.update(1 / 30); out[w] = +((performance.now() - t0) / 90).toFixed(2); FR.setFiring(false); }
    FR.goMenu(); window.__freeze = false; return out; });
  console.log('armes (ms/image en tirant)', JSON.stringify(res.armes));
  res.parties = []; res.foule = [];
  for (const n of [29, 39, 59]) {
    const r = await page.evaluate(n => { const FR = window.FR; FR.SET.botCount = n; FR.SET.botLevel = 'mixte'; FR.startMatch('br'); const p = FR.player; window.__freeze = true;
      FR.jumpFromBus(); for (let i = 0; i < 30 * 60; i++) { p.hp = 100; FR.update(1 / 30); } // une minute de jeu : les bots ont atterri
      const c = FR.CITIES.find(x => x.id === 'agadez'); p.phase = 'ground'; p.pos.set(c.x, FR.terrainH(c.x, c.z) + 0.3, c.z); p.vel.set(0, 0, 0); for (let i = 0; i < 30; i++) { p.hp = 100; FR.update(1 / 30); }
      const ts = []; for (let i = 0; i < 240; i++) { p.hp = 100; p.shield = 100; const t0 = performance.now(); FR.update(1 / 30); ts.push(performance.now() - t0); }
      ts.sort((a, b) => a - b); const near = FR.bots.filter(b => b.inMatch && b.alive && b.pos.distanceTo(p.pos) < 150).length;
      const out = { bots: n, enVie: FR.aliveCount, botsA150m: near, moyenne: +(ts.reduce((a, b) => a + b, 0) / ts.length).toFixed(2), p95: +ts[Math.floor(ts.length * 0.95)].toFixed(2) };
      // pire cas : tous les bots vivants autour du joueur
      FR.bots.filter(b => b.inMatch && b.alive).forEach((b, i) => { const a = i * 2.4, d = 8 + (i % 15) * 9.5; b.phase = 'ground'; b.grounded = true; b.model.g.visible = true; b.vel.set(0, 0, 0); const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d; b.pos.set(x, FR.terrainH(x, z) + 1, z); });
      for (let i = 0; i < 30; i++) { p.hp = 100; FR.update(1 / 30); } const t2 = []; for (let i = 0; i < 240; i++) { p.hp = 100; p.shield = 100; const t0 = performance.now(); FR.update(1 / 30); t2.push(performance.now() - t0); }
      t2.sort((a, b) => a - b); out.foule = { bots: FR.bots.filter(b => b.inMatch && b.alive).length, moyenne: +(t2.reduce((a, b) => a + b, 0) / t2.length).toFixed(2), p95: +t2[Math.floor(t2.length * 0.95)].toFixed(2) };
      FR.goMenu(); window.__freeze = false; return out; }, n);
    console.log('partie', JSON.stringify(r)); res.parties.push(r); }
  console.log('(processeur ralenti ×' + thr + ' ; budget d\'une image : 33 ms à 30 images/s, 16,7 ms à 60 ; le rendu n\'est pas compté)');
  console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
