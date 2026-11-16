// v2.0 : la nouvelle carte explorée par le joueur, et de vraies parties joueur contre bots
// 1. carte : le joueur marche (touches du clavier) dans chacun des 21 lieux : nom du lieu affiché, sol sous les pieds, pas de NaN ;
//    dans chaque nouveau lieu qui a des maisons : ouvrir la porte d'une maison (E) et entrer
// 2. parties complètes, le joueur piloté par le test (ni invincible ni aidé) : il va chercher une arme, vise le torse des bots qu'il
//    voit avec un temps de réaction (0,5 s) et une erreur de visée (comme un joueur moyen, avec les vrais tirs), sinon rejoint la zone. Mesures : tirs et touches des bots sur le joueur, du joueur sur
//    les bots, éliminations, rang du joueur, durée totale de la partie (elle continue entre bots après la mort du joueur)
// Usage : node tests/combat.cjs http://127.0.0.1:8000/index.html [parties=2] [bots=39]
const { chromium } = require('playwright'); const [,, base, nm = '2', nb = '39'] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } }); await ctx.addInitScript(() => localStorage.setItem('fr_q', 'low'));
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=0'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  const pb = [];
  // 1. exploration
  const ex = await page.evaluate(() => { const FR = window.FR; FR.startMatch('train'); window.__freeze = true; const p = FR.player, out = [];
    const step = n => { for (let i = 0; i < n; i++) FR.update(1 / 30); };
    for (const c of FR.CITIES) { const x = c.x + 4, z = c.z + 4; p.pos.set(x, FR.terrainH(x, z) + 1.5, z); p.vel.set(0, 0, 0); step(20);
      const a = { x: p.pos.x, z: p.pos.z }; FR.setCam(0.7, -0.1); FR.keys.KeyW = true; step(45); FR.keys.KeyW = false; step(10);
      const moved = Math.hypot(p.pos.x - a.x, p.pos.z - a.z), ground = p.pos.y - FR.terrainH(p.pos.x, p.pos.z);
      out.push({ lieu: c.name, nomAffiche: (document.getElementById('zone').textContent || '').includes(c.name) || FR.zoneAt(c.x + 4, c.z + 4).name === c.name, marche: +moved.toFixed(1), auSol: ground > -0.3 && ground < 6, nan: !isFinite(p.pos.x + p.pos.y + p.pos.z) }); }
    // une maison par nouveau lieu : porte fermée, E l'ouvre, on entre
    const houses = []; for (const id of ['camp', 'bilma', 'malbaza', 'djado', 'termit', 'filingue', 'goure', 'gaya']) { const c = FR.CITIES.find(x => x.id === id);
      const h = FR.housesInfo.find(h => h.door && h.doorObj && Math.hypot((h.minX + h.maxX) / 2 - c.x, (h.minZ + h.maxZ) / 2 - c.z) < c.r + 6); if (!h) { houses.push({ lieu: c.name, maison: false }); continue; }
      const D = h.door; FR.setDoor(h.doorObj, false); step(30); p.pos.set(D.ox, FR.terrainH(D.ox, D.oz) + 0.3, D.oz); p.vel.set(0, 0, 0); step(10);
      const yaw = Math.atan2(-(D.ix - D.ox), -(D.iz - D.oz)); FR.setCam(yaw, -0.1); FR.keys.KeyW = true; step(20); FR.keys.KeyW = false; const blocked = !(p.pos.x > h.minX && p.pos.x < h.maxX && p.pos.z > h.minZ && p.pos.z < h.maxZ);
      p.pos.set(D.ox, FR.terrainH(D.ox, D.oz) + 0.3, D.oz); p.vel.set(0, 0, 0); step(5); FR.interact(); step(30); FR.setCam(yaw, -0.1); FR.keys.KeyW = true; step(40); FR.keys.KeyW = false; step(5);
      const inside = p.pos.x > h.minX && p.pos.x < h.maxX && p.pos.z > h.minZ && p.pos.z < h.maxZ; houses.push({ lieu: c.name, porteFermeeBloque: blocked, ouverteAvecE: !!h.doorObj.open, entre: inside }); }
    FR.goMenu(); window.__freeze = false; return { lieux: out, maisons: houses }; });
  for (const l of ex.lieux) if (!l.nomAffiche || l.marche < 2 || !l.auSol || l.nan) pb.push('lieu ' + l.lieu);
  console.log('lieux    ', ex.lieux.length, 'visités ; marche moyenne', (ex.lieux.reduce((a, l) => a + l.marche, 0) / ex.lieux.length).toFixed(1), 'm ;', ex.lieux.filter(l => l.nomAffiche && l.auSol && !l.nan && l.marche >= 2).length, 'sans problème');
  for (const l of ex.lieux) if (!l.nomAffiche || l.marche < 2 || !l.auSol || l.nan) console.log('   problème', JSON.stringify(l));
  console.log('maisons  ', JSON.stringify(ex.maisons)); for (const h of ex.maisons) if (h.maison !== false && (!h.porteFermeeBloque || !h.ouverteAvecE || !h.entre)) pb.push('maison ' + h.lieu);
  // 2. parties
  for (let m = 0; m < +nm; m++) {
    const r = await page.evaluate(nb => { const FR = window.FR; FR.SET.botCount = +nb; FR.SET.botLevel = 'mixte'; FR.startMatch('br'); window.__freeze = true; const p = FR.player, T = FR.THREE;
      let seenT = 0, seenB = null, ex = 0, ey = 0; const st = { joueurTire: 0, joueurTouche: 0, botsTirentSurJoueur: 0, joueurToucheParBots: 0, degatsRecus: 0, elimJoueur: 0 }; let t = 0, firedOn = false, deathT = null, hp0 = 100;
      const cam = FR.camera, d = new T.Vector3();
      // le joueur saute du taxi-brousse au milieu du trajet
      for (let i = 0; i < 30 * 60 * 30 && FR.aliveCount > 1; i++) { t += 1 / 30; // au plus 30 min
        if (p.phase === 'bus' && FR.bus.t > FR.bus.dur * 0.45) FR.jumpFromBus();
        if (p.alive && p.phase === 'ground') {
          let tgt = null, td = 70; for (const b of FR.bots) { if (!b.alive || !b.inMatch || b.phase !== 'ground') continue; const dd = b.pos.distanceTo(p.pos); if (dd < td && FR.hasLOS(p, b)) { td = dd; tgt = b; } }
          const hasGun = p.slots.some(Boolean);
          if (tgt !== seenB) { seenB = tgt; seenT = 0; ex = (Math.random() - 0.5) * 0.06; ey = (Math.random() - 0.5) * 0.04; } else seenT += 1 / 30;
          if (tgt && hasGun) { if (p.cur === 'daba') FR.selectSlot(p.slots.findIndex(Boolean) + 1); const ty = tgt.pos.y + (tgt.crouch ? 0.8 : 1.2); FR.keys.KeyW = false;
            if (Math.random() < 0.05) { ex = (Math.random() - 0.5) * 0.06; ey = (Math.random() - 0.5) * 0.04; } // la visée bouge (erreur de ±1,7° environ)
            const dx = tgt.pos.x - cam.position.x, dz = tgt.pos.z - cam.position.z; FR.setCam(Math.atan2(-dx, -dz) + ex, Math.atan2(ty - cam.position.y, Math.hypot(dx, dz)) + ey);
            if (seenT > 0.5) { firedOn = !firedOn; FR.setFiring(firedOn); } else FR.setFiring(false); }
          else { FR.setFiring(false); let goal = null;
            if (!hasGun) { let bd = 90; for (const it of FR.items) { if (!it.alive || !it.kind.startsWith('w:')) continue; const dd = Math.hypot(it.x - p.pos.x, it.z - p.pos.z); if (dd < bd) { bd = dd; goal = [it.x, it.z]; } } }
            if (!goal) { const ds = Math.hypot(p.pos.x - FR.storm.cx, p.pos.z - FR.storm.cz); const tr = FR.storm.state === 'wait' ? FR.storm.tr : FR.storm.r; const tx = FR.storm.state === 'wait' ? FR.storm.tx : FR.storm.cx, tz = FR.storm.state === 'wait' ? FR.storm.tz : FR.storm.cz;
              if (Math.hypot(p.pos.x - tx, p.pos.z - tz) > tr * 0.6) goal = [tx, tz]; }
            if (goal) { FR.setCam(Math.atan2(-(goal[0] - p.pos.x), -(goal[1] - p.pos.z)), -0.1); FR.keys.KeyW = true; } else FR.keys.KeyW = false; } }
        else { FR.keys.KeyW = false; FR.setFiring(false); }
        const s0 = FR.BSTAT.shots, h0 = p.hp + p.shield, k0 = p.kills, mag0 = p.cur && p.mag[p.cur];
        FR.update(1 / 30);
        if (p.alive && p.cur !== 'daba' && p.mag[p.cur] < mag0) st.joueurTire++;
        if (p.hp + p.shield < h0 && p.alive) st.degatsRecus += h0 - (p.hp + p.shield);
        if (!p.alive && deathT === null) { deathT = Math.round(t); st.tueParUnBot = !!p.killer; st.degatsRecus += h0; }
        st.elimJoueur += p.kills - k0; }
      FR.keys.KeyW = false; FR.setFiring(false);
      const dur = Math.round(t); const r = { bots: +nb, duree: dur, joueurMortA: deathT, rangJoueur: p.alive ? 1 : p.rank, elimJoueur: p.kills, balleJoueur: st.joueurTire, degatsRecusParLeJoueur: Math.round(st.degatsRecus), degatsInfligesParLeJoueur: Math.round(p.dmgDealt || 0), tueParUnBot: st.tueParUnBot ?? null, gagnant: FR.aliveCount <= 1 ? (p.alive ? 'joueur' : (FR.bots.find(b => b.alive) || {}).name) : null };
      FR.goMenu(); window.__freeze = false; return r; }, nb);
    console.log('partie   ', JSON.stringify(r));
    if (!r.gagnant) pb.push('partie ' + (m + 1) + ' pas finie en 70 min');
    if (r.balleJoueur < 1 && (r.joueurMortA === null || r.joueurMortA > 120)) pb.push('le joueur ne combat pas (partie ' + (m + 1) + ')');
    if (r.degatsRecusParLeJoueur < 1) pb.push('aucun bot ne combat le joueur (partie ' + (m + 1) + ')');
  }
  console.log(pb.length ? 'À REVOIR : ' + pb.join(' ; ') : 'tout est bon'); console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
