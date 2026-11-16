// v2.0.1 : corrections vues dans une vidéo de jeu (téléphone 800 × 480)
// 1. le nom du lieu ne clignote plus : 40 s à longer le bord de Zinder (entre 0,85 et 0,99 fois son rayon) → une seule affiche
// 2. caméra collée au perso (contre le mur d'une maison) : le perso devient transparent ; les bots qui ont le même perso, non
// 3. textes du HUD sur un écran 800 × 480 : munitions des cases, compteurs, nom de l'arme ≥ 11 px
// Usage : node tests/lieu_camera.cjs http://127.0.0.1:8000/index.html
const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 800, height: 480 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 }); await ctx.addInitScript(() => { localStorage.setItem('fr_q', 'low'); localStorage.setItem('fr_skin', 'boss'); });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=1'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  const pb = [];
  const z = await page.evaluate(() => { const FR = window.FR; FR.SET.botCount = 19; FR.startMatch('br'); window.__freeze = true; FR.bus.t = FR.bus.dur; FR.update(1 / 30); const p = FR.player, c = FR.CITIES.find(x => x.id === 'zinder');
    let shown = 0, last = ''; const el = document.getElementById('zone'); const names = [];
    for (let i = 0; i < 1200; i++) { const a = i / 1200 * 2.2, rr = c.r * (0.92 + 0.07 * Math.sin(i / 25)); const x = c.x + Math.cos(a) * rr, zz = c.z + Math.sin(a) * rr; p.phase = 'ground'; p.pos.set(x, FR.terrainH(x, zz) + 0.1, zz); p.vel.set(0, 0, 0);
      const before = el.style.opacity; FR.update(1 / 30); const t = el.textContent; if (el.style.opacity === '1' && (before !== '1' || t !== last)) { shown++; names.push(t.slice(0, 14)); } last = t; }
    return { affichagesEn40s: shown, noms: names }; });
  console.log('lieu     ', JSON.stringify(z)); if (z.affichagesEn40s > 2) pb.push('nom du lieu qui clignote');
  const f = await page.evaluate(() => { const FR = window.FR, p = FR.player, T = FR.THREE; const step = n => { for (let i = 0; i < n; i++) FR.update(1 / 30); };
    const op = c => { let o = 1; c.model.g.traverse(m => { if (m.isSkinnedMesh) o = Math.min(o, m.material.opacity); }); return +o.toFixed(2); };
    const twin = FR.bots.find(b => b.inMatch && b.skin === p.skin) || FR.bots.find(b => b.inMatch);
    // loin de tout : opaque
    const c = FR.CITIES.find(x => x.id === 'tenere'); p.pos.set(c.x + 20, FR.terrainH(c.x + 20, c.z + 20), c.z + 20); FR.setCam(0, -0.1); step(20); const libre = op(p);
    // dos à un mur de maison : la caméra est collée au perso
    const h = FR.housesInfo.find(h => h.door && Math.hypot((h.minX + h.maxX) / 2 - 10, (h.minZ + h.maxZ) / 2 - 18) < 400 && h.maxX - h.minX > 6);
    const x = (h.minX + h.maxX) / 2, zz = h.minZ - 0.6; p.pos.set(x, FR.terrainH(x, zz) + 0.05, zz); p.vel.set(0, 0, 0); FR.setCam(0, -0.1); step(25); /* dos au mur : la caméra, derrière lui, bute contre la maison */
    const d = FR.camera.position.distanceTo(new T.Vector3(p.pos.x, p.pos.y + 1.55, p.pos.z));
    const r = { opaciteLoinDesMurs: libre, distanceCamera: +d.toFixed(2), opaciteContreLeMur: op(p), opaciteDuBotJumeau: twin ? op(twin) : null };
    p.pos.set(c.x + 20, FR.terrainH(c.x + 20, c.z + 20), c.z + 20); FR.setCam(0, -0.1); step(30); r.opaciteApres = op(p); return r; });
  console.log('caméra   ', JSON.stringify(f)); if (f.opaciteLoinDesMurs < 1 || f.distanceCamera >= 1.4 || f.opaciteContreLeMur > 0.9 || f.opaciteDuBotJumeau !== 1 || f.opaciteApres < 1) pb.push('transparence du perso');
  const t = await page.evaluate(() => { const px = sel => { const e = document.querySelector(sel); return e ? parseFloat(getComputedStyle(e).fontSize) : null; };
    return { munitionsCase: px('.slot span'), nomArme: px('#wname'), compteur: px('.chip small'), ecran: innerWidth + '×' + innerHeight }; });
  console.log('textes   ', JSON.stringify(t)); if (t.munitionsCase < 11 || t.nomArme < 11 || t.compteur < 11) pb.push('textes trop petits');
  console.log(pb.length ? 'À REVOIR : ' + pb.join(' ; ') : 'tout est bon'); console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
