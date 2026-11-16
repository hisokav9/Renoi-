// v2.0 : construction continue, mode simple / avancé, PV des constructions (Entraînement, commandes du jeu appelées comme les boutons)
// 1. dix murs à la suite sans lever le doigt (on garde MUR, on tourne et on avance)
// 2. changer de pièce pendant la construction (doigt sur MUR puis RAMPE) : la pièce suivante est une rampe, le mode construction reste
// 3. mode simple / avancé : bouton TOURNER, rotation, pose au toucher, place voisine pour un sol
// 4. construire pendant un combat : tir, mur, tir, rampe… sans blocage
// 5. PV réels : nombre de tirs pour détruire un mur fini, selon l'arme (avant v2.0 : mur de 150 PV)
// Usage : node tests/construction2.cjs http://localhost:8000/index.html
const { chromium, devices } = require('playwright'); const [,, base] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const o = { ...devices['Pixel 7 landscape'] }; delete o.defaultBrowserType; const ctx = await browser.newContext(o); await ctx.addInitScript(() => localStorage.setItem('fr_q', 'low'));
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=1'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  const res = await page.evaluate(() => { const FR = window.FR; FR.startMatch('train'); window.__freeze = true; window.__keepAmmo = true; const p = FR.player, out = {};
    const step = (n, f) => { for (let i = 0; i < n; i++) { if (f) f(i); FR.update(1 / 30); } };
    const flat = (x, z) => !FR.solids.some(s => s.maxX > x - 16 && s.minX < x + 16 && s.maxZ > z - 16 && s.minZ < z + 16) && Math.abs(FR.terrainH(x + 8, z) - FR.terrainH(x - 8, z)) < 0.8;
    let spot = null; for (let r = 0; r < 240 && !spot; r += 6) for (let a = 0; a < 6.28 && !spot; a += 0.4) { const x = 40 + Math.cos(a) * r, z = -30 + Math.sin(a) * r; if (flat(x, z)) spot = [Math.floor(x / 4) * 4 + 2, Math.floor(z / 4) * 4 + 2]; }
    const go = (dx = 0, dz = 0) => { const x = spot[0] + dx, z = spot[1] + dz; p.pos.set(x, FR.terrainH(x, z) + 0.05, z); p.vel.set(0, 0, 0); FR.setCam(0, -0.05); step(3); };
    const clear = () => { for (const q of [...FR.pieceList]) FR.destroyPiece(q, true); step(2); };
    FR.setSet('buildStyle', 'simple');
    // 1. dix murs
    clear(); go(); const n1 = FR.pieceList.length; let yaw = 0, t0 = 0; FR.pieceDown('wall', true);
    for (let i = 0; i < 90 && FR.pieceList.length - n1 < 10; i++) { if (i % 3 === 2) { yaw += Math.PI / 2; FR.setCam(yaw, -0.05); } if (i % 12 === 11) { p.pos.z -= 4; p.pos.y = FR.terrainH(p.pos.x, p.pos.z) + 0.05; } step(1); t0 = i + 1; }
    FR.pieceUp('wall'); const walls = FR.pieceList.slice(n1).filter(q => q.type === 'wall').length;
    out.dixMurs = { murs: walls, images: t0, secondes: +(t0 / 30).toFixed(1), doigtLeve: false };
    // 2. changer de pièce pendant la construction
    clear(); go(8, 0); FR.setCam(0, -0.05); FR.pieceDown('wall', true); step(2); const before = FR.pieceList.length; FR.pieceDown('ramp', true); step(2); FR.pieceUp('ramp'); FR.pieceUp('wall');
    const last = FR.pieceList[FR.pieceList.length - 1]; out.changerDePiece = { construction: FR.buildMode, pieceSuivante: last && last.type, posee: FR.pieceList.length > before };
    // 3. simple / avancé
    const bRot = () => !document.getElementById('bRot').classList.contains('hidden');
    FR.toggleBuild(true); FR.setBuildType('ramp'); step(1); const simpleRot = bRot(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' })); step(1); const rotSimple = FR.buildRot;
    FR.setSet('buildStyle', 'avance'); step(1); const avRot = bRot(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' })); step(1); const rotAv = FR.buildRot;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' })); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' })); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' })); step(1);
    // place voisine (simple) : sol devant soi déjà pris → le sol va sous les pieds ou au-dessus
    // place voisine (simple) : debout sur une plateforme, regard vers le bas : le sol « sous les pieds » est déjà là → il va devant
    FR.setSet('buildStyle', 'simple'); clear(); go(-8, 0); FR.setCam(0, -0.05); FR.pieceDown('wall', true); FR.pieceUp('wall'); step(2); FR.setCam(0, 0.5); FR.pieceDown('floor', true); FR.pieceUp('floor'); FR.toggleBuild(false); step(50);
    const plat = FR.pieceList.find(q => q.type === 'floor'); p.pos.y = plat.lvl + 0.05; p.vel.set(0, 0, 0); step(5); FR.setCam(0, -0.9); step(1);
    const nf = FR.pieceList.length; FR.pieceDown('floor', true); FR.pieceUp('floor'); step(3); const placed = FR.pieceList.slice(nf);
    out.simpleAvance = { toumerVisibleEnSimple: simpleRot, rotationEnSimple: rotSimple, tournerVisibleEnAvance: avRot, rotationEnAvance: rotAv, solVoisinPose: placed.length === 1 && placed[0].type === 'floor' && placed[0].lvl === plat.lvl };
    FR.toggleBuild(false);
    // 4. construire pendant un combat : tir / pièce / tir / pièce
    clear(); go(16, 0); FR.selectSlot(1); step(20); const mag0 = p.mag[p.cur], n4 = FR.pieceList.length; let seq = [];
    for (const t of ['wall', 'ramp', 'wall', 'floor']) { FR.setCam(0, 0.05); FR.toggleBuild(false); FR.setFiring(true); step(4); FR.setFiring(false); FR.setCam(Math.PI, -0.05); FR.pieceDown(t, true); FR.pieceUp(t); step(2); seq.push(t); }
    FR.toggleBuild(false); step(15); out.combat = { tirs: mag0 - p.mag[p.cur], pieces: FR.pieceList.length - n4, enchainement: seq.join(' ') };
    // 5. PV : tirs pour détruire un mur fini (les vrais tirs du jeu)
    out.pv = { mur: FR.BUILD.wall.hp, rampe: FR.BUILD.ramp.hp, sol: FR.BUILD.floor.hp, toit: FR.BUILD.cone.hp, tirsPourDetruireUnMur: {} };
    for (const [w, slot] of [['fusil', 1], ['pompe', 2], ['sniper', 3], ['daba', 0]]) { clear(); go(24, 0); FR.setCam(0, -0.05); FR.pieceDown('wall', true); FR.pieceUp('wall'); FR.toggleBuild(false); step(60);
      const wall = FR.pieceList.find(q => q.type === 'wall' && q.alive); const hp0 = Math.round(wall.hp); FR.selectSlot(slot); step(25); FR.setCam(0, -0.12); let shots = 0, f = 0;
      while (wall.alive && f < 900) { const m0 = w === 'daba' ? 0 : p.mag[p.cur], sw0 = p.swingT; FR.setFiring(true); FR.update(1 / 30); FR.setFiring(false); f++; if (w !== 'daba' && p.mag[p.cur] < m0) shots++; if (w === 'daba' && p.swingT > sw0 + 0.1) shots++; if (w !== 'daba' && p.mag[p.cur] === 0) p.mag[p.cur] = 30; }
      out.pv.tirsPourDetruireUnMur[w] = { pvDepart: hp0, tirs: shots, detruit: !wall.alive }; }
    return out; });
  for (const k in res) console.log(k.padEnd(15), JSON.stringify(res[k]));
  const pb = [];
  if (res.dixMurs.murs < 10) pb.push('dix murs'); if (!res.changerDePiece.construction || res.changerDePiece.pieceSuivante !== 'ramp') pb.push('changer de pièce');
  const S = res.simpleAvance; if (S.toumerVisibleEnSimple || S.rotationEnSimple !== 0 || !S.tournerVisibleEnAvance || S.rotationEnAvance !== 1 || !S.solVoisinPose) pb.push('simple / avancé');
  if (res.combat.tirs < 4 || res.combat.pieces < 4) pb.push('construire en combat');
  const T = res.pv.tirsPourDetruireUnMur; if (res.pv.mur !== 300 || !Object.values(T).every(x => x.detruit && x.pvDepart === 300)) pb.push('PV des murs');
  console.log(pb.length ? 'À REVOIR : ' + pb.join(' ; ') : 'tout est bon'); console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
