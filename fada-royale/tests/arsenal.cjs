// v2.0 : arsenal (catalogue src/core/arsenal.js) — Entraînement, ordinateur (souris : armes semi-automatiques = un coup par appui)
// 1. équiper chaque arme (les 5 catégories demandées + les autres) : modèle visible dans la main
// 2. tirer avec chaque arme : balles retirées du chargeur, pas de la réserve ; automatique = rafale, semi-automatique = un coup par appui
// 3. recharger chaque arme : chargeur rempli, réserve du BON type de munitions diminuée d'autant (pompes : cartouche par cartouche)
// 4. munitions : une caisse d'un type ne remplit que ce type, jusqu'à son plafond
// 5. ramasser une arme au sol (rareté et chargeur gardés), la lâcher (G), la reprendre, remplacer une arme quand l'inventaire est plein
// 6. les 5 raretés : couleur du faisceau et de l'anneau au sol, dégâts croissants (même arme, même cible)
// Usage : node tests/arsenal.cjs http://localhost:8000/index.html
const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=0'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  const res = await page.evaluate(() => { const FR = window.FR; FR.startMatch('train'); window.__freeze = true; window.__keepAmmo = true; /* munitions réelles (l'Entraînement les remplit sinon) */ const p = FR.player, W = FR.WEAP, out = {};
    const step = (n, f) => { for (let i = 0; i < n; i++) { if (f) f(i); FR.update(1 / 30); } };
    const open = (x, z) => !FR.solids.some(s => s.maxX > x - 10 && s.minX < x + 10 && s.maxZ > z - 10 && s.minZ < z + 10);
    let spot = null; for (let r = 0; r < 220 && !spot; r += 6) for (let a = 0; a < 6.28 && !spot; a += 0.4) { const x = 40 + Math.cos(a) * r, z = -30 + Math.sin(a) * r; if (open(x, z)) spot = [x, z]; }
    const go = () => { p.pos.set(spot[0], FR.terrainH(spot[0], spot[1]) + 0.05, spot[1]); p.vel.set(0, 0, 0); FR.setCam(0, 0.2); step(2); };
    const all = ['revolver', 'mitraillette', 'fusil', 'tactique', 'pompe', 'pompet', 'mitrailleuse', 'sniper'];
    const equip = w => { p.slots = [w, null, null, null, null]; p.srar = [W[w].rar, 0, 0, 0, 0]; p.mag = { [w]: W[w].mag }; FR.selectSlot(0); step(2); FR.selectSlot(1); step(30); };
    for (const k of ['light', 'medium', 'heavy', 'shells']) p.ammoT[k] = 40;
    // 1-3
    out.armes = [];
    for (const w of all) { go(); equip(w); for (const k of ['light', 'medium', 'heavy', 'shells']) p.ammoT[k] = 40; const vis = !!(p.model.w[w] && p.model.w[w].visible); const at = FR.ammoOf(w), r0 = p.ammoT[at], m0 = p.mag[w];
      FR.setFiring(true); step(20); FR.setFiring(false); step(2); const shot = m0 - p.mag[w];
      const others = ['light', 'medium', 'heavy', 'shells'].filter(k => k !== at).every(k => p.ammoT[k] === 40);
      const r1 = p.ammoT[at]; window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyR' }));
      let n = 0; while ((p.reloadT > 0 || n < 2) && n < 200) { step(1); n++; } step(3);
      out.armes.push({ arme: w, mode: W[w].mode, munitions: at, visible: vis, tirsEn20images: shot, reserveIntacteAuTir: r1 === r0, autresTypesIntacts: others,
        chargeurApres: p.mag[w] + '/' + W[w].mag, reservePrise: r1 - p.ammoT[at], coherent: (r1 - p.ammoT[at]) === (p.mag[w] - (m0 - shot)), dureeRecharge: +(n / 30).toFixed(1) }); }
    // 4. caisses typées
    go(); p.ammoT.heavy = 55; const box = FR.spawnItem('ammo', p.pos.x, p.pos.y, p.pos.z, 10, false, { atype: 'heavy' }); const med0 = p.ammoT.medium; step(3);
    out.caisse = { lourdesApres: p.ammoT.heavy, plafond: 60, resteAuSol: box.alive ? box.amount : 0, moyennesInchangees: p.ammoT.medium === med0 };
    // 5. ramasser / lâcher / reprendre / remplacer
    go(); p.slots = ['fusil', null, null, null, null]; p.srar = [1, 0, 0, 0, 0]; p.mag = { fusil: 12 }; FR.selectSlot(1); step(20);
    FR.spawnItem('w:tactique', p.pos.x + 0.5, p.pos.y, p.pos.z, 1, false, { rar: 3, mag: 7 }); step(5);
    const i2 = p.slots.indexOf('tactique'); out.ramasser = { case: i2 + 1, rarete: p.srar[i2], chargeur: p.mag.tactique };
    FR.selectSlot(i2 + 1); step(25); FR.dropWeapon(); step(10); const dropped = FR.items.find(it => it.alive && it.kind === 'w:tactique');
    out.lacher = { caseVide: !p.slots.includes('tactique'), auSol: !!dropped, rareteAuSol: dropped && dropped.rar, chargeurAuSol: dropped && dropped.mag, enMain: p.cur };
    step(60); p.pos.set(dropped.x, dropped.y + 0.05, dropped.z); step(5); const i3 = p.slots.indexOf('tactique'); out.reprendre = { repris: i3 >= 0, rarete: p.srar[i3], chargeur: p.mag.tactique };
    // inventaire plein : échange (E) avec l'arme en main
    go(); p.slots = ['revolver', 'mitraillette', 'fusil', 'pompe', 'sniper']; p.srar = [0, 1, 2, 2, 4]; p.mag = { revolver: 6, mitraillette: 30, fusil: 30, pompe: 5, sniper: 3 }; FR.selectSlot(5); step(30);
    FR.spawnItem('w:pompet', p.pos.x + 0.5, p.pos.y, p.pos.z, 1, false, { rar: 4, mag: 8 }); step(5); const near = !!FR.nearItem; FR.swapTake(); step(12);
    const old = FR.items.find(it => it.alive && it.kind === 'w:sniper');
    out.remplacer = { invite: near, case5: p.slots[4], rarete: p.srar[4], ancienneAuSol: !!old, ancienneRarete: old && old.rar, ancienChargeur: old && old.mag };
    // 6. raretés : couleurs au sol et dégâts sur un mannequin
    const cols = []; for (let r = 0; r < 5; r++) { const it = FR.spawnItem('w:fusil', p.pos.x + 30 + r * 2, p.pos.y, p.pos.z, 1, false, { rar: r }); cols.push('#' + it.g.children[1].material.color.getHexString() + '/#' + it.g.children[2].material.color.getHexString()); }
    const dm = FR.bots.find(b => b.dummy && b.alive); const dmg = [];
    for (let r = 0; r < 5; r++) { go(); p.slots = ['fusil', null, null, null, null]; p.srar = [r, 0, 0, 0, 0]; p.mag = { fusil: 30 }; FR.selectSlot(0); step(2); FR.selectSlot(1); step(30);
      const cam = FR.camera, dir = new FR.THREE.Vector3(); FR.setCam(0, 0); step(2); cam.getWorldDirection(dir); dir.y = 0; dir.normalize(); dm.hp = 100; dm.shield = 0;
      const tx = cam.position.x + dir.x * 12, tz = cam.position.z + dir.z * 12; dm.pos.set(tx, FR.terrainH(tx, tz), tz);
      for (let k = 0; k < 3; k++) { const dy = dm.pos.y + 1.1 - cam.position.y, dh = Math.hypot(tx - cam.position.x, tz - cam.position.z); FR.setCam(0, Math.atan2(dy, dh)); step(1); dm.pos.set(tx, FR.terrainH(tx, tz), tz); } // viser la poitrine
      const h0 = dm.hp;
      FR.setFiring(true); FR.update(1 / 30); FR.setFiring(false); dm.pos.set(tx, FR.terrainH(tx, tz), tz); step(3); dmg.push(+(h0 - dm.hp).toFixed(1)); }
    out.raretes = { couleursFaisceauAnneau: cols, degatsParBalle_communALegendaire: dmg };
    return out; });
  for (const k in res) console.log(k.padEnd(10), JSON.stringify(res[k]));
  const pb = [];
  for (const a of res.armes) { if (!a.visible) pb.push(a.arme + ' invisible'); if (a.tirsEn20images < 1) pb.push(a.arme + ' ne tire pas');
    if (a.mode === 'semi' && a.tirsEn20images > 1) pb.push(a.arme + ' : semi-automatique qui tire en rafale'); if (a.mode === 'auto' && a.tirsEn20images < 3) pb.push(a.arme + ' : automatique qui ne tire pas en rafale');
    if (!a.reserveIntacteAuTir || !a.autresTypesIntacts || !a.coherent) pb.push(a.arme + ' : munitions incohérentes'); if (a.chargeurApres.split('/')[0] !== a.chargeurApres.split('/')[1]) pb.push(a.arme + ' : chargeur pas rempli'); }
  if (res.caisse.lourdesApres !== 60 || res.caisse.resteAuSol !== 5 || !res.caisse.moyennesInchangees) pb.push('caisse de munitions');
  if (res.ramasser.rarete !== 3 || res.ramasser.chargeur !== 7) pb.push('ramasser');
  if (!res.lacher.caseVide || !res.lacher.auSol || res.lacher.rareteAuSol !== 3 || res.lacher.chargeurAuSol !== 7 || res.lacher.enMain !== 'daba') pb.push('lâcher');
  if (!res.reprendre.repris || res.reprendre.rarete !== 3 || res.reprendre.chargeur !== 7) pb.push('reprendre');
  if (!res.remplacer.invite || res.remplacer.case5 !== 'pompet' || res.remplacer.rarete !== 4 || !res.remplacer.ancienneAuSol || res.remplacer.ancienneRarete !== 4 || res.remplacer.ancienChargeur !== 3) pb.push('remplacer');
  const d = res.raretes.degatsParBalle_communALegendaire; if (!(d.every(x => x > 0) && d.every((x, i) => i === 0 || x > d[i - 1]))) pb.push('dégâts selon la rareté');
  console.log(pb.length ? 'À REVOIR : ' + pb.join(' ; ') : 'tout est bon'); console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
