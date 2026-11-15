// v1.4 : construction en solo sur téléphone (Pixel 7 paysage, commandes tactiles), avec les VRAIS boutons de pièces
// (appui = pose, doigt gardé = pose en continu), à l'Entraînement.
// Vérifie : barre de pièces visible et sans chevauchement, montée mur + rampe en courant, pose en continu, boîte autour de soi,
// édition validée en relâchant, « poser au toucher » désactivé, touches du clavier, effacer ses constructions,
// appels de dessin avec beaucoup de pièces, invite de rebord qui ne cache plus les barres de vie.
// Usage : node tests/build.cjs http://localhost:8000/index.html /tmp/fr-build
const { chromium, devices } = require('playwright'); const path = require('path'); const fs = require('fs');
const [,, base, out = '/tmp/fr-build'] = process.argv; fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const o = { ...devices['Pixel 7 landscape'] }; delete o.defaultBrowserType;
  const ctx = await browser.newContext(o); await ctx.addInitScript(() => localStorage.setItem('fr_q', 'low'));
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=1'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  const cdp = await ctx.newCDPSession(page);
  const step = n => page.evaluate(n => { for (let i = 0; i < n; i++) window.FR.update(1 / 30); }, n);
  const center = sel => page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
  const touch = async (type, sel, id = 7) => { const c = await center(sel); await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: c.x, y: c.y, id }] }); };
  const tap = async sel => { await touch('touchStart', sel); await touch('touchEnd', sel); };
  const P = t => `#pick button[data-p="${t}"]`;
  const res = {};
  await page.evaluate(() => { const FR = window.FR; FR.startMatch('train'); window.__freeze = true; for (let i = 0; i < 20; i++) FR.update(1 / 30);
    // chaque essai part d'un endroit dégagé (aucun obstacle ni pièce à moins de 10 m), près du départ de l'Entraînement
    const sx = FR.player.pos.x, sz = FR.player.pos.z;
    window.__goto = (ox, oz) => { const p = FR.player; let x = sx + ox, z = sz + oz;
      for (let k = 0; k < 36; k++) { const tx = sx + ox + (k % 6) * 9, tz = sz + oz + Math.floor(k / 6) * 9; if (!FR.solids.some(s => s.maxX > tx - 10 && s.minX < tx + 10 && s.maxZ > tz - 10 && s.minZ < tz + 10 && s.maxY > FR.terrainH(tx, tz) - 1)) { x = tx; z = tz; break; } }
      x = Math.floor(x / 4) * 4 + 2; z = Math.floor(z / 4) * 4 + 2; // au milieu d'une case de construction
      p.pos.set(x, FR.terrainH(x, z) + 0.5, z); p.vel.set(0, 0, 0); for (let i = 0; i < 30; i++) FR.update(1 / 30); }; });

  // 1. barre de pièces
  res.barre = await page.evaluate(() => { const pick = document.getElementById('pick'), r = pick.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom; const over = [];
    for (const id of ['bBuild', 'bEdit', 'bAim', 'bFire', 'bJump', 'bReload', 'bCrouch', 'bSprint', 'gear', 'bottom']) { const e = document.getElementById(id); if (e && e.offsetParent && hit(r, e.getBoundingClientRect())) over.push(id); }
    return { visible: !pick.classList.contains('hidden'), boutons: pick.querySelectorAll('button').length, dansEcran: r.left >= 0 && r.right <= W && r.top >= 0 && r.bottom <= H, chevauche: over }; });

  // 2. un appui sur MUR : passe en construction et pose le mur
  res.appuiMur = await (async () => { const n0 = await page.evaluate(() => window.FR.pieceList.length); await tap(P('wall')); await step(2);
    return await page.evaluate(n0 => { const FR = window.FR; return { construction: FR.buildMode, piecesPosees: FR.pieceList.length - n0, type: FR.pieceList.at(-1) && FR.pieceList.at(-1).type }; }, n0); })();

  // 3. montée mur + rampe en courant (appuis alternés RAMPE / MUR, comme au doigt)
  res.montee = await (async () => {
    await page.evaluate(() => { const FR = window.FR, p = FR.player; window.__goto(40, 0); FR.setCam(0, 0.05); for (let i = 0; i < 10; i++) FR.update(1 / 30); window.__y0 = p.pos.y; window.__n0 = FR.pieceList.length; });
    const pts = []; let flat = 0, prev = 0;
    for (let s = 0; s < 10; s++) { for (let k = 0; k < 3; k++) { await page.evaluate(() => { window.FR.keys.KeyW = true; }); await tap(P('ramp')); await step(5); await tap(P('wall')); await step(5); }
      const h = await page.evaluate(() => window.FR.player.pos.y - window.__y0); pts.push(h.toFixed(1)); if (h - prev < 0.5) flat++; prev = h; }
    await page.evaluate(() => { window.FR.keys.KeyW = false; });
    const end = await page.evaluate(() => { const FR = window.FR, t = {}; for (const q of FR.pieceList.slice(window.__n0)) t[q.type] = (t[q.type] || 0) + 1; return t; });
    return { hauteurParSeconde: pts.join(' '), secondesSansMonter: flat, pieces: end }; })();
  await page.screenshot({ path: path.join(out, 'montee.png') });

  // 4. pose en continu : doigt gardé sur RAMPE en avançant 3 s (montée sans lever le doigt), puis doigt gardé sur SOL : un pont en hauteur
  res.continu = await (async () => {
    await page.evaluate(() => { const FR = window.FR, p = FR.player; window.__goto(-60, 40); FR.setCam(Math.PI / 2, 0.05); for (let i = 0; i < 10; i++) FR.update(1 / 30); window.__n0 = FR.pieceList.length; window.__y0 = p.pos.y; });
    await touch('touchStart', P('ramp')); for (let i = 0; i < 9; i++) { await page.evaluate(() => { window.FR.keys.KeyW = true; }); await step(10); }
    const held = await page.evaluate(() => window.FR.pieceHeld); await touch('touchEnd', P('ramp')); await step(2);
    const r1 = await page.evaluate(held => { const FR = window.FR, nw = FR.pieceList.slice(window.__n0); window.__n1 = FR.pieceList.length; window.__y1 = FR.player.pos.y; return { rampesEn3s: nw.filter(q => q.type === 'ramp').length, monte: +(FR.player.pos.y - window.__y0).toFixed(1), doigtGarde: held, apresRelache: FR.pieceHeld }; }, held);
    // le perso finit la dernière rampe, puis marche sur les sols posés devant lui : il reste en hauteur (il ne tombe pas)
    const ys = []; await touch('touchStart', P('floor')); for (let i = 0; i < 6; i++) { await page.evaluate(() => { window.FR.keys.KeyW = true; }); await step(10); ys.push(await page.evaluate(() => window.FR.player.pos.y)); } await touch('touchEnd', P('floor')); await step(2);
    const r2 = await page.evaluate(ys => { const FR = window.FR; FR.keys.KeyW = false; const nw = FR.pieceList.slice(window.__n1), last = ys.slice(-3);
      return { solsEn2s: nw.filter(q => q.type === 'floor').length, hauteurs: ys.map(y => +(y - window.__y0).toFixed(1)).join(' '), resteEnHauteur: Math.max(...last) - Math.min(...last) < 0.3 && last[2] - window.__y0 > 3 }; }, ys);
    return { ...r1, ...r2 }; })();

  // 5. boîte autour de soi : 4 murs (un appui par direction) + toit au-dessus
  res.boite = await (async () => {
    await page.evaluate(() => { const FR = window.FR, p = FR.player; window.__goto(0, 90); for (let i = 0; i < 10; i++) FR.update(1 / 30); window.__n0 = FR.pieceList.length; });
    for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { await page.evaluate(y => window.FR.setCam(y, 0.05), yaw); await step(1); await tap(P('wall')); await step(2); }
    await page.evaluate(() => window.FR.setCam(0, 0.5)); await step(1); await tap(P('cone')); await step(2);
    return await page.evaluate(() => { const FR = window.FR, p = FR.player, cx = Math.floor(p.pos.x / 4), cz = Math.floor(p.pos.z / 4); const nw = FR.pieceList.slice(window.__n0);
      const walls = nw.filter(q => q.type === 'wall'), cone = nw.find(q => q.type === 'cone');
      const around = walls.every(q => (q.axis === 'z' && Math.floor(q.x0 / 4) === cx && [cz * 4, cz * 4 + 4].includes(q.plane)) || (q.axis === 'x' && Math.floor(q.z0 / 4) === cz && [cx * 4, cx * 4 + 4].includes(q.plane)));
      return { murs: walls.length, autourDuJoueur: around, toitAuDessus: !!cone && cone.ramp.cx === cx && cone.ramp.cz === cz && cone.lvl > p.pos.y }; }); })();
  await page.evaluate(() => window.FR.setCam(0.5, 0.3)); await step(3); await page.screenshot({ path: path.join(out, 'boite.png') });

  // 6. édition : ÉDITER, glisser sur une case avec CASE (TIRER), relâcher = validé, retour en construction
  res.edition = await (async () => {
    await page.evaluate(() => window.FR.setCam(0, 0.12)); await step(2); const wasBuild = await page.evaluate(() => window.FR.buildMode);
    await tap('#bEdit'); await step(1); const ed = await page.evaluate(() => !!window.FR.editing);
    await touch('touchStart', '#bFire', 9); await step(4); await touch('touchEnd', '#bFire', 9); await step(2);
    return await page.evaluate(([ed, wasBuild]) => { const FR = window.FR, w = FR.pieceList.filter(q => q.type === 'wall' && q.edited); return { editionOuverte: ed, valideeAuRelache: !FR.editing, caseRetiree: w.length > 0 && w.some(q => q.tiles.includes(false)), retourConstruction: wasBuild && FR.buildMode }; }, [ed, wasBuild]); })();

  // 7. « poser au toucher » désactivé : l'appui choisit la pièce sans la poser
  res.sansPoseAuToucher = await (async () => { await page.evaluate(() => { window.FR.SET.tapBuild = false; window.FR.selectSlot(1); window.__n0 = window.FR.pieceList.length; }); await step(1); await tap(P('ramp')); await step(2);
    return await page.evaluate(() => { const FR = window.FR, r = { construction: FR.buildMode, piecesPosees: FR.pieceList.length - window.__n0 }; FR.SET.tapBuild = true; return r; }); })();

  // 8. clavier : V = rampe, Q = mur
  res.clavier = await (async () => { await page.evaluate(() => window.FR.selectSlot(1)); await page.keyboard.press('KeyV'); await step(1); const a = await page.evaluate(() => [window.FR.buildMode, document.querySelector('#pick button.on') && document.querySelector('#pick button.on').dataset.p]);
    await page.keyboard.press('KeyQ'); await step(1); const b = await page.evaluate(() => document.querySelector('#pick button.on').dataset.p); return { V: a, Q: b }; })();

  // 9. banco illimité, puis effacer ses constructions (menu pause)
  res.entrainement = await page.evaluate(() => { const FR = window.FR; FR.update(1 / 30); const banco = document.getElementById('nBanco').textContent, n = FR.pieceList.filter(q => q.owner === FR.player).length;
    FR.openSettings(); const vis = !document.getElementById('sClear').classList.contains('hidden'); document.getElementById('sClear').click(); FR.update(1 / 30);
    return { banco, piecesAvant: n, boutonVisible: vis, piecesApres: FR.pieceList.filter(q => q.owner === FR.player).length }; });

  // 10. appels de dessin : 0 puis ~160 pièces terminées, même vue
  res.appels = await page.evaluate(() => { const FR = window.FR, p = FR.player, R = FR.renderer; const m = () => { FR.update(1 / 30); R.render(FR.scene, FR.camera); return R.info.render.calls; };
    const x0 = Math.floor(p.pos.x / 4) * 4 + 2, z0 = Math.floor(p.pos.z / 4) * 4 + 2, view = () => { p.pos.set(x0, FR.terrainH(x0, z0 + 6) + 1, z0 + 6); p.vel.set(0, 0, 0); FR.setCam(0, 0.15); for (let i = 0; i < 60; i++) FR.update(1 / 30); };
    view(); const c0 = m(); let n = 0; const T = ['wall', 'floor', 'ramp', 'wall'];
    for (let lv = 0; n < 160 && lv < 12; lv++) for (let i = -2; i <= 2 && n < 160; i++) for (let j = 1; j <= 4 && n < 160; j++) { p.pos.set(x0 + i * 4, FR.terrainH(x0 + i * 4, z0 - j * 4) + lv * 4 + 0.05, z0 - j * 4); p.buildCD = 0; FR.setCam(0, 0); if (FR.tryBuild(p, T[(i + j + lv) & 3], (i + j) & 3)) n++; }
    view(); const c1 = m(); return { sansPiece: c0, pieces: n, avecPieces: c1 }; });
  await page.screenshot({ path: path.join(out, 'tour.png') });

  // 11. invite de rebord : plus sur les barres de vie
  res.inviteRebord = await page.evaluate(() => { const h = document.getElementById('hint'); h.innerHTML = 'SAUT : se hisser'; h.classList.remove('hidden'); const a = h.getBoundingClientRect(), b = document.getElementById('bars').getBoundingClientRect(); h.classList.add('hidden');
    return { chevaucheLesBarres: a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom }; });

  for (const k in res) console.log(k.padEnd(18), JSON.stringify(res[k]));
  console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
