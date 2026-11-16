// v2.0 : emotes (gestes construits à la main sur le squelette : le projet n'a pas de clip de danse)
// Pour chaque emote, sur les 2 personnages animés (Boss, Guerrière) : lancée par le vrai bouton du HUD, arme rangée, position des
// mains mesurée sur le squelette (os des mains) par rapport à la tête et aux épaules, puis annulée en marchant (arme ressortie).
// Bot : après une élimination, il lance parfois une emote, immobile, et l'arrête s'il voit une cible.
// Usage : node tests/emotes.cjs http://127.0.0.1:8000/index.html [dossier des captures]
const { chromium, devices } = require('playwright'); const [,, base, out] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pb = [], errs = [];
  for (const skin of ['boss', 'guerriere']) {
    const o = { ...devices['Pixel 7 landscape'] }; delete o.defaultBrowserType; const ctx = await browser.newContext(o);
    await ctx.addInitScript(s => { localStorage.setItem('fr_q', 'medium'); localStorage.setItem('fr_skin', s); }, skin);
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message));
    await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
    await page.goto(base + '?touch=1'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
    await page.evaluate(() => { const FR = window.FR; FR.startMatch('train'); window.__freeze = true; for (let i = 0; i < 40; i++) FR.update(1 / 30); FR.setCam(Math.PI, -0.1); });
    for (const k of ['salut', 'bravo', 'victoire', 'danse']) {
      // le vrai bouton du HUD, puis le choix dans la barre
      const bar = await page.evaluate(k => { document.getElementById('bEmote').dispatchEvent(new Event('click')); const open = !document.getElementById('emoteBar').classList.contains('hidden');
        document.querySelector(`#emoteBar button[data-em="${k}"]`).dispatchEvent(new Event('click')); return open; }, k);
      const r = await page.evaluate(k => { const FR = window.FR, p = FR.player, B = p.model.bones, V = () => new FR.THREE.Vector3(); const smp = [];
        for (let i = 0; i < 75; i++) { FR.update(1 / 30); if (i % 3) continue; const h = V(), rh = V(), lh = V(), rs = V(), ls = V(); B.Head.getWorldPosition(h); B.RightHand.getWorldPosition(rh); B.LeftHand.getWorldPosition(lh); B.RightArm.getWorldPosition(rs); B.LeftArm.getWorldPosition(ls);
          const fw = V().set(-Math.sin(p.yaw), 0, -Math.cos(p.yaw)); smp.push({ rUp: rh.y - h.y, lUp: lh.y - h.y, mains: rh.distanceTo(lh), devant: (rh.clone().add(lh).multiplyScalar(0.5).sub(rs.clone().add(ls).multiplyScalar(0.5))).dot(fw), rMinusL: rh.y - lh.y }); }
        const W = Object.values(p.model.w).some(w => w.visible), act = !!p.emote;
        const mn = f => Math.min(...smp.slice(3).map(f)), mx = f => Math.max(...smp.slice(3).map(f));
        return { emote: k, active: act, armeVisible: W, mainDroiteAuDessusTete: +mx(s => s.rUp).toFixed(2), mainGaucheAuDessusTete: +mx(s => s.lUp).toFixed(2), ecartMainsMin: +mn(s => s.mains).toFixed(2), ecartMainsMax: +mx(s => s.mains).toFixed(2), mainsDevant: +mx(s => s.devant).toFixed(2), alternance: [+mn(s => s.rMinusL).toFixed(2), +mx(s => s.rMinusL).toFixed(2)] }; }, k);
      if (out) await page.screenshot({ path: `${out}/emote_${skin}_${k}.png` });
      // marcher annule l'emote et ressort l'arme
      const c = await page.evaluate(() => { const FR = window.FR, p = FR.player; FR.keys.KeyW = true; for (let i = 0; i < 20; i++) FR.update(1 / 30); FR.keys.KeyW = false; for (let i = 0; i < 25; i++) FR.update(1 / 30);
        return { annuleeEnMarchant: !p.emote, armeRessortie: Object.values(p.model.w).some(w => w.visible) }; });
      Object.assign(r, { barreOuverte: bar }, c); console.log(skin.padEnd(10), JSON.stringify(r));
      const ok = r.barreOuverte && r.active && !r.armeVisible && r.annuleeEnMarchant && r.armeRessortie && (
        k === 'salut' ? r.mainDroiteAuDessusTete > 0.05 && r.mainGaucheAuDessusTete < -0.4 :
        k === 'bravo' ? r.ecartMainsMin < 0.16 && r.ecartMainsMax > 0.25 && r.mainsDevant > 0.15 :
        k === 'victoire' ? r.mainDroiteAuDessusTete > 0.1 && r.mainGaucheAuDessusTete > 0.1 :
        r.alternance[0] < -0.4 && r.alternance[1] > 0.4);
      if (!ok) pb.push(skin + ' ' + k);
      await page.evaluate(() => { const FR = window.FR, p = FR.player; p.pos.x += 0; p.vel.set(0, 0, 0); for (let i = 0; i < 10; i++) FR.update(1 / 30); });
    }
    if (skin === 'boss') { // bot qui célèbre
      const b = await page.evaluate(() => { const FR = window.FR; FR.SET.botCount = 19; FR.startMatch('br'); window.__freeze = true; FR.spectate(); FR.bus.t = FR.bus.dur; FR.update(1 / 30);
        const [a, v] = FR.bots; for (const x of FR.bots.slice(2)) { x.alive = false; x.model.g.visible = false; }
        const x0 = 60, z0 = -40; for (const [c, dx] of [[a, 0], [v, 6]]) { c.phase = 'ground'; c.grounded = true; c.pos.set(x0 + dx, FR.terrainH(x0 + dx, z0) + 0.1, z0); c.vel.set(0, 0, 0); c.model.g.visible = true; c.landedAt = -99; }
        // vraie élimination (killChar, comme un tir mortel) : le bot célèbre dans 30 % des cas ; on recommence jusqu'à 40 fois
        let kills = 0, seen = null; for (let k = 0; k < 40 && !seen; k++) { v.alive = true; v.hp = 100; v.phase = 'ground'; v.model.g.visible = true; FR.update(1 / 30);
          FR.killChar(v, a, 'fusil'); kills++; a.target = null; for (let i = 0; i < 60; i++) { FR.update(1 / 30); if (a.emote) { seen = a.emote.k; break; } } }
        const still = seen ? Math.hypot(a.vel.x, a.vel.z) : -1; return { eliminations: kills, emoteDuBot: seen, vitesse: +still.toFixed(2) }; });
      console.log('bot       ', JSON.stringify(b)); if (!b.emoteDuBot || b.vitesse > 0.8) pb.push('emote du bot');
    }
    await ctx.close();
  }
  console.log(pb.length ? 'À REVOIR : ' + pb.join(' ; ') : 'tout est bon'); console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
