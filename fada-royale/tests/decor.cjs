// v1.6 : décor du pack (sols, ciel, animaux, arbres, rochers)
// 1. coût de rendu de chaque nouveauté au même endroit (Agadez, ordinateur 1280x720) : tout, sans le ciel, sans les arbres, sans les rochers,
//    sans les animaux, avec le sol de la v1.5, sans aucune nouveauté (temps médian de 3 images, réserve : rendu logiciel SwiftShader)
// 2. programmes GPU compilés en cours de partie en arrivant près des animaux, des rochers, et quand la tempête commence (doit rester à +0)
// Usage : node tests/decor.cjs http://localhost:8000/index.html medium   (ou low, high)
const { chromium } = require('playwright'); const [,, base, q = 'medium'] = process.argv;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); await ctx.addInitScript(q => localStorage.setItem('fr_q', q), q);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await p.goto(base); await p.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  await p.waitForFunction(() => window.FR.AMB.length > 30, null, { timeout: 120000 }); await p.waitForTimeout(5000); // le décor du pack se charge après le lobby
  const r = await p.evaluate(() => { const FR = window.FR; window.__freeze = true; FR.startMatch('train'); FR.warmGPU(); for (let i = 0; i < 10; i++) FR.update(1 / 30);
    const pl = FR.player; pl.pos.set(-10, FR.terrainH(-10, -80) + 1, -80); for (let i = 0; i < 30; i++) FR.update(1 / 30);
    const R = FR.renderer, gl = R.getContext(), px = new Uint8Array(4); R.setPixelRatio(1);
    const time = () => { const t = []; for (let k = 0; k < 4; k++) { const t0 = performance.now(); R.render(FR.scene, FR.camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); t.push(performance.now() - t0); } t.shift(); t.sort((a, b) => a - b); return Math.round(t[1]) + ' ms, ' + R.info.render.calls + ' appels, ' + Math.round(R.info.render.triangles / 1000) + 'k tri'; };
    const by = pre => { const L = []; FR.scene.traverse(o => { if (o.name && o.name.startsWith(pre)) L.push(o); }); return L; };
    const off = (L, swapSol) => { const v = L.map(o => o.visible); L.forEach(o => o.visible = false); const m0 = FR.TERRAIN.material; if (swapSol) FR.TERRAIN.material = FR.TERRAIN_MAT0; const s = time(); FR.TERRAIN.material = m0; L.forEach((o, i) => o.visible = v[i]); return s; };
    const sol = FR.TERRAIN.material === FR.TERRAIN_MAT0 ? 'sol v1.5 (Basse)' : 'mélange de 6 sols', anim = FR.AMB.map(a => a.g);
    const out = { sol, animaux: anim.length, tout: time(), sansCiel: off(by('sky')), sansArbres: off(by('arbre-')), sansRochers: off(by('rocher-')), sansAnimaux: off(anim), solV15: off([], true), sansRien: off([...by('sky'), ...by('arbre-'), ...by('rocher-'), ...anim], true) };
    const np = () => R.info.programs.length, fr = () => { FR.update(1 / 30); R.render(FR.scene, FR.camera); }; const comp = [];
    for (const [n, x, z] of [['Agadez', -10, -80], ['Ténéré', 110, -100], ['Kouré', -40, 120], ['Parc W', 150, 190], ['Ayorou', -120, -20]]) { const a = np(); window.__camOv = { p: [x, 12, z], t: [x + 20, 2, z + 20] }; for (let k = 0; k < 12; k++) fr(); comp.push(n + ' +' + (np() - a)); }
    window.__camOv = null; { const a = np(); FR.storm.r = 1; FR.storm.cx = 999; FR.storm.cz = 999; for (let k = 0; k < 60; k++) fr(); comp.push('tempête +' + (np() - a)); }
    out.programmesEnPartie = comp.join(', '); return out; });
  for (const k in r) console.log(k.padEnd(18), r[k]);
  console.log(errs.join('\n') || 'aucune erreur'); await b.close(); })();
