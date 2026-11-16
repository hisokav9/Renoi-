// v1.7 : prise en main des armes, mesurée (Boss et Guerrière, les 7 armes, plusieurs situations)
// - main droite / main gauche : écart entre le poignet et son point d'appui sur l'arme (une main « qui flotte » = écart > 3 cm)
// - canon : direction de l'arme par rapport à l'avant du perso (combat et visée : doit viser devant)
// - buste : distance la plus courte entre l'arme (12 points sur sa longueur) et l'axe du buste (hanches → cou) : < 7 cm = l'arme traverse le corps
// - daba : la main est-elle sur le manche (repère de la daba, manche de z = 0,12 à −0,18) ; pointe vers l'avant au moment du coup
// Usage : node tests/prise.cjs http://localhost:8000/index.html
const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const rows = []; let errs = [];
  for (const skin of ['boss', 'guerriere']) {
    const ctx = await browser.newContext({ viewport: { width: 400, height: 300 } }); await ctx.addInitScript(s => { localStorage.setItem('fr_skin', s); localStorage.setItem('fr_q', 'medium'); }, skin);
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message)); await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
    await page.goto(base + '?touch=0'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
    const r = await page.evaluate(() => { const FR = window.FR, T = FR.THREE; FR.startMatch('train'); window.__freeze = true; const pl = FR.player;
      const step = (n, f) => { for (let i = 0; i < n; i++) { if (f) f(i); FR.update(1 / 30); } };
      const open = (x, z) => !FR.solids.some(s => s.maxX > x - 8 && s.minX < x + 8 && s.maxZ > z - 8 && s.minZ < z + 8);
      let spot = null; for (let r = 0; r < 200 && !spot; r += 6) for (let a = 0; a < 6.28 && !spot; a += 0.5) { const x = 60 + Math.cos(a) * r, z = -40 + Math.sin(a) * r; if (open(x, z)) spot = [x, z]; }
      pl.slots = ['revolver', 'mitraillette', 'fusil', 'pompe', 'sniper']; pl.ammo = 300; for (const w of ['revolver', 'fusil', 'pompe', 'sniper', 'mitrailleuse', 'mitraillette']) pl.mag[w] = 1;
      const m = pl.model, A = new T.Vector3(), Bv = new T.Vector3(), out = [];
      const meas = (w, st) => { const g = m.g; g.updateMatrixWorld(true); const an = m.an, wo = m.w[w]; if (!wo || !wo.visible) { out.push({ w, st, vis: false }); return; }
        const res = side => { const tl = side === 'R' ? an.tRl : an.tLl; if (!tl) return null; const t = g.localToWorld(tl.clone()); m.bones[side === 'R' ? 'RightHand' : 'LeftHand'].getWorldPosition(A); return A.distanceTo(t); };
        const wR = an.ikWR || 0, wL = an.ikWL || 0; const fw = new T.Vector3(-Math.sin(pl.yaw), 0, -Math.cos(pl.yaw)); const dir = new T.Vector3(0, 0, -1).transformDirection(wo.matrixWorld);
        const box = new T.Box3().setFromObject(FR.ASSETS.w[w].scene); const hip = m.bones.Hips.getWorldPosition(new T.Vector3()), neck = m.bones.Neck.getWorldPosition(new T.Vector3());
        let dmin = 9; const seg = new T.Line3(hip, neck), cp = new T.Vector3();
        for (let k = 0; k <= 11; k++) { const z = box.max.z + (box.min.z - box.max.z) * k / 11; const p = wo.localToWorld(new T.Vector3(0, (box.min.y + box.max.y) / 2 * 0.5, z)); seg.closestPointToPoint(p, true, cp); dmin = Math.min(dmin, cp.distanceTo(p)); }
        const o = { w, st, vis: true, mainD: wR > 0.5 ? +res('R').toFixed(3) : null, mainG: wL > 0.5 ? +res('L').toFixed(3) : null, canon: +dir.dot(fw).toFixed(2), buste: +dmin.toFixed(3) };
        if (w === 'daba') { m.bones.RightHand.getWorldPosition(A); m.bones.RightForeArm.getWorldPosition(Bv); const palm = A.clone().addScaledVector(A.clone().sub(Bv).normalize(), 0.08); const lp = wo.worldToLocal(palm); o.manche = +lp.z.toFixed(2); o.mancheEcart = +Math.hypot(lp.x, lp.y).toFixed(2); }
        out.push(o); };
      const reset = () => { const [x, z] = spot; pl.pos.set(x, FR.terrainH(x, z) + 0.05, z); pl.vel.set(0, 0, 0); pl.yaw = 0; FR.setCam(0, -0.05); FR.keys.KeyW = false; FR.setFiring(false); FR.setAds(false); FR.setSprint(false); pl.combatT = 0; };
      const slotOf = w => w === 'daba' ? 0 : w === 'mitrailleuse' ? (pl.slots[4] = 'mitrailleuse', 5) : pl.slots.indexOf(w) + 1;
      for (const w of ['daba', 'revolver', 'mitraillette', 'fusil', 'pompe', 'sniper', 'mitrailleuse']) {
        pl.slots[4] = 'sniper'; reset(); FR.selectSlot(0); step(2); FR.selectSlot(slotOf(w)); step(40);
        meas(w, 'repos'); step(20, () => { FR.keys.KeyW = true; }); meas(w, 'course'); FR.keys.KeyW = false;
        FR.setSprint(true); step(25, () => { FR.keys.KeyW = true; }); meas(w, 'sprint'); FR.setSprint(false); FR.keys.KeyW = false; step(15);
        if (w === 'daba') { FR.setFiring(true); step(1); FR.setFiring(false); for (const n of [3, 4, 3, 5]) { step(n); meas(w, 'coup ' + (pl.swingT > 0 ? (1 - pl.swingT / 0.45).toFixed(2) : 'fin')); } continue; }
        pl.combatT = 5; step(12); meas(w, 'combat'); FR.setAds(true); step(15); meas(w, 'visee'); FR.setAds(false);
        pl.mag[w] = 0; pl.combatT = 5; FR.setFiring(true); step(2); FR.setFiring(false); step(Math.round((pl.reloadDur || 2) * 30 * 0.45)); meas(w, 'recharge'); step(120); }
      return out; });
    for (const o of r) rows.push(Object.assign({ perso: skin }, o)); await ctx.close();
  }
  let bad = 0;
  for (const o of rows) { const pb = [];
    if (!o.vis) pb.push('arme invisible');
    if (o.mainD !== null && o.mainD !== undefined && o.mainD > 0.03) pb.push('main droite à ' + o.mainD + ' m');
    if (o.mainG !== null && o.mainG !== undefined && o.mainG > 0.03) pb.push('main gauche à ' + o.mainG + ' m');
    if ((o.st === 'combat' || o.st === 'visee') && o.canon < 0.95) pb.push('canon pas devant (' + o.canon + ')');
    if (o.vis && o.w !== 'daba' && o.buste < 0.07) pb.push('arme dans le buste (' + o.buste + ' m)');
    if (o.w === 'daba' && o.vis && (o.manche > 0.16 || o.manche < -0.2 || o.mancheEcart > 0.1)) pb.push('main hors du manche (z ' + o.manche + ', écart ' + o.mancheEcart + ')');
    if (o.w === 'daba' && /^coup 0\.(5|6)/.test(o.st) && o.canon < 0.5) pb.push('lame pas vers l\'avant au coup (' + o.canon + ')');
    if (pb.length) bad++;
    console.log((o.perso + ' ' + o.w + ' ' + o.st).padEnd(32), JSON.stringify({ mainD: o.mainD, mainG: o.mainG, canon: o.canon, buste: o.buste, manche: o.manche }), pb.length ? '  <- ' + pb.join(', ') : '');
  }
  console.log(bad ? bad + ' situation(s) à revoir sur ' + rows.length : 'les ' + rows.length + ' situations sont bonnes');
  console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
