// v1.7 : changement d'arme en étapes, sortie de sprint, arme basse
// 1. paires d'armes : durée, une seule arme visible à chaque image, pas de téléportation (déplacement de la main droite d'une image à
//    l'autre : un saut isolé, bien plus grand que les images voisines), échange à l'étui (loin de la position de tir)
// 2. changements rapides entre toutes les armes : pas de blocage, l'arme affichée finit par être l'arme choisie
// 3. demi-tour : on redemande l'arme qu'on rangeait → elle ressort depuis où elle est (plus court qu'un changement complet)
// 4. tir pendant le changement : bloqué jusqu'à la fin de la sortie
// 5. sortie du sprint : le premier tir attend que l'arme remonte
// 6. saut pendant un changement d'arme
// 7. bot éloigné (non dessiné) qui change d'arme : son changement se termine (avant v1.7 il restait bloqué et ne tirait plus)
// 8. arme basse face à un mur
// Usage : node tests/changement.cjs http://localhost:8000/index.html
const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=0'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  const res = await page.evaluate(() => { const FR = window.FR, T = FR.THREE; FR.startMatch('train'); window.__freeze = true; const p = FR.player, out = {};
    const step = (n, f) => { for (let i = 0; i < n; i++) { if (f) f(i); FR.update(1 / 30); } };
    const open = (x, z) => !FR.solids.some(s => s.maxX > x - 9 && s.minX < x + 9 && s.maxZ > z - 9 && s.minZ < z + 9);
    let spot = null; for (let r = 0; r < 200 && !spot; r += 6) for (let a = 0; a < 6.28 && !spot; a += 0.5) { const x = 60 + Math.cos(a) * r, z = -40 + Math.sin(a) * r; if (open(x, z)) spot = [x, z]; }
    const reset = () => { const [x, z] = spot; p.pos.set(x, FR.terrainH(x, z) + 0.05, z); p.vel.set(0, 0, 0); p.yaw = 0; FR.setCam(0, -0.05); FR.keys.KeyW = false; FR.setFiring(false); FR.setAds(false); FR.setSprint(false); };
    p.slots = ['revolver', 'mitraillette', 'fusil', 'sniper', 'mitrailleuse']; p.ammo = 300; for (const w of p.slots) p.mag[w] = 30;
    const slot = w => w === 'daba' ? 0 : p.slots.indexOf(w) + 1, m = p.model, hand = new T.Vector3(), prev = new T.Vector3();
    const vis = () => Object.keys(m.w).filter(k => m.w[k].visible);
    // 1. paires
    out.paires = [];
    for (const [a, b] of [['fusil', 'revolver'], ['revolver', 'sniper'], ['sniper', 'daba'], ['daba', 'mitrailleuse'], ['mitraillette', 'fusil']]) {
      reset(); FR.selectSlot(slot(a)); step(40); p.combatT = 5; step(10); m.bones.RightHand.getWorldPosition(prev);
      const ready = prev.clone(); FR.selectSlot(slot(b)); let n = 0, maxJump = 0, multi = 0, swapDist = 0, lastShown = a; const d = [];
      while (p.switchT > 0 && n < 90) { p.combatT = 5; FR.update(1 / 30); n++; const v = vis(); if (v.length > 1) multi++; m.bones.RightHand.getWorldPosition(hand);
        d.push(hand.distanceTo(prev)); maxJump = Math.max(maxJump, d[d.length - 1]); prev.copy(hand); if (v[0] && v[0] !== lastShown) { swapDist = hand.distanceTo(ready); lastShown = v[0]; } }
      for (let i = 0; i < 4; i++) { FR.update(1 / 30); m.bones.RightHand.getWorldPosition(hand); d.push(hand.distanceTo(prev)); prev.copy(hand); }
      // téléportation = saut isolé : grand (> 15 cm) et bien plus grand que les images voisines (un geste rapide accélère et ralentit)
      let spikes = 0; for (let i = 0; i < d.length; i++) { const nb = Math.max(d[i - 1] || 0, d[i + 1] || 0); if (d[i] > 0.15 && d[i] > 2.5 * nb) spikes++; }
      step(4); out.paires.push({ de: a, vers: b, duree: +(n / 30).toFixed(2), deuxArmesVisibles: multi, vitesseMaxMain: +(maxJump * 30).toFixed(1) + ' m/s', sautsIsoles: spikes, echangeLoinDeLaPositionDeTir: +swapDist.toFixed(2), armeFinale: vis().join(',') }); }
    // 2. changements rapides
    reset(); const seq = [1, 2, 3, 4, 5, 0, 3, 1, 4, 2]; for (const s of seq) { FR.selectSlot(s); step(3); } step(40);
    out.rapides = { choisie: p.cur, affichee: vis().join(','), enCours: p.switchT > 0 };
    // 3. demi-tour
    reset(); FR.selectSlot(slot('fusil')); step(40); FR.selectSlot(slot('sniper')); step(3); FR.selectSlot(slot('fusil')); let n3 = 0; while (p.switchT > 0 && n3 < 60) { FR.update(1 / 30); n3++; }
    out.demiTour = { revenuA: p.cur, affichee: vis().join(','), dureeApresDemiTour: +(n3 / 30).toFixed(2), changementComplet: 0.5 };
    // 4. tir pendant le changement
    reset(); FR.selectSlot(slot('revolver')); step(40); FR.selectSlot(slot('fusil')); p.mag.fusil = 30; let firstShot = -1;
    for (let i = 0; i < 40; i++) { FR.setFiring(true); FR.update(1 / 30); if (firstShot < 0 && p.mag.fusil < 30) firstShot = i + 1; } FR.setFiring(false);
    out.tirPendantChangement = { premierTirApres: +(firstShot / 30).toFixed(2), dureeChangement: +p.switchDur.toFixed(2) };
    // 5. sortie du sprint
    reset(); FR.selectSlot(slot('fusil')); step(30); FR.setSprint(true); step(30, () => { FR.keys.KeyW = true; }); const wasSprint = p.sprint; p.mag.fusil = 30; let shot5 = -1;
    for (let i = 0; i < 20; i++) { FR.keys.KeyW = true; FR.setFiring(true); FR.update(1 / 30); if (shot5 < 0 && p.mag.fusil < 30) shot5 = i + 1; } FR.setFiring(false); FR.keys.KeyW = false; FR.setSprint(false);
    out.sortieSprint = { enSprint: wasSprint, premierTirApres: +(shot5 / 30).toFixed(2) };
    // 6. saut pendant un changement
    reset(); FR.selectSlot(slot('fusil')); step(30); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); step(3); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    const air = !p.grounded; FR.selectSlot(slot('revolver')); let n6 = 0; while (p.switchT > 0 && n6 < 60) { FR.update(1 / 30); n6++; } step(40);
    out.sautPendantChangement = { enLAir: air, termine: p.switchT <= 0, affichee: vis().join(','), auSol: p.grounded };
    // 7. bot éloigné
    const b = FR.bots.find(x => x.alive) || FR.bots[0]; b.alive = true; b.phase = 'ground'; b.pos.set(p.pos.x + 400, 0, p.pos.z); b.model.g.visible = false; window.__noDrawBot = b; b.pos.y = FR.terrainH(b.pos.x, b.pos.z);
    b.slots = ['revolver', 'fusil', null, null, null]; b.mag.fusil = 30; FR.selectSlot; b.sel = 1; b.cur = 'revolver';
    const from = b.cur; b.sel = 2; b.cur = 'fusil'; FR.beginSwitch(b, from); step(30, () => { b.pos.set(p.pos.x + 400, b.pos.y, p.pos.z); });
    out.botEloigne = { changementRestant: +b.switchT.toFixed(2) }; // le changement est décompté dans la logique (updateTimers), plus dans l'animation
    // 8. arme basse face à un mur
    reset(); FR.selectSlot(slot('fusil')); step(20); p.combatT = 5; step(15); const pivFree = m.pivot.rotation.x;
    const wall = FR.solids.find(s => !s.piece && s.maxY - s.minY > 2.5 && s.maxX - s.minX > 3 && s.maxZ - s.minZ < 1.2) ;
    let lowered = null; if (wall) { const z = wall.maxZ + 0.6, x = (wall.minX + wall.maxX) / 2; p.pos.set(x, FR.terrainH(x, z), z); p.yaw = 0; FR.setCam(0, -0.05); step(25, () => { p.combatT = 5; }); lowered = +(pivFree - m.pivot.rotation.x).toFixed(2); }
    out.armeBasseContreMur = { mur: !!wall, abaissement: lowered };
    return out; });
  for (const k in res) console.log(k.padEnd(22), JSON.stringify(res[k]));
  const pb = [];
  for (const q of res.paires) { if (q.deuxArmesVisibles) pb.push(q.de + '→' + q.vers + ' : deux armes visibles'); if (q.sautsIsoles) pb.push(q.de + '→' + q.vers + ' : main téléportée'); if (q.echangeLoinDeLaPositionDeTir < 0.15) pb.push(q.de + '→' + q.vers + ' : échange à la position de tir'); if (q.armeFinale !== q.vers) pb.push(q.de + '→' + q.vers + ' : arme finale ' + q.armeFinale); }
  if (res.rapides.affichee !== res.rapides.choisie || res.rapides.enCours) pb.push('changements rapides : bloqué');
  if (res.demiTour.revenuA !== 'fusil' || res.demiTour.dureeApresDemiTour >= res.demiTour.changementComplet) pb.push('demi-tour : pas repris depuis la pose');
  if (res.tirPendantChangement.premierTirApres < 0.3) pb.push('tir pendant le changement');
  if (res.sortieSprint.enSprint && res.sortieSprint.premierTirApres < 0.15) pb.push('tir en sortie de sprint sans montée de l\'arme');
  if (!res.sautPendantChangement.termine || res.sautPendantChangement.affichee !== 'revolver') pb.push('saut pendant le changement');
  if (res.botEloigne.changementRestant > 0) pb.push('bot éloigné bloqué');
  if (res.armeBasseContreMur.mur && !(res.armeBasseContreMur.abaissement > 0.3)) pb.push('arme pas abaissée contre le mur');
  console.log(pb.length ? 'À REVOIR : ' + pb.join(' ; ') : 'tout est bon'); console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
