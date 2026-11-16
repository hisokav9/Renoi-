// v2.0 : graphismes et HUD
// 1. les 5 profils (Très faible, Faible, Moyen, Élevé, Personnalisé) choisis par les vrais boutons du menu : appels de dessin, triangles, ombres, sol, résolution
// 2. Personnalisé : part du profil en cours, puis ombres / sol / effets / végétation changent vraiment le rendu
// 3. limite d'images : fréquence de l'écran mesurée, limites proposées, et la porte de limite sur 2 s d'images à 60 Hz et 120 Hz
//    (puis mesure réelle dans le navigateur de test, limite 30)
// 4. HUD (téléphone) : déplacer / agrandir / opacité / masquer dans l'éditeur, enregistrer, recharger la page : tout est gardé ; dispositions toutes faites
// Usage : node tests/graphismes.cjs http://localhost:8000/index.html
const { chromium, devices } = require('playwright'); const [,, base] = process.argv;
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const abort = page => page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
(async () => {
  const browser = await chromium.launch({ args: ARGS }); const pb = []; const errs = [];
  // ---------- 1-3 : ordinateur ----------
  { const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } }); await ctx.addInitScript(() => { if (!localStorage.getItem('fr_q')) localStorage.setItem('fr_q', 'high'); });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message)); await abort(page);
    await page.goto(base + '?touch=0'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
    await page.waitForTimeout(2500); // fréquence de l'écran mesurée sur les premières images
    await page.evaluate(() => { const FR = window.FR; FR.startMatch('train'); window.__freeze = true; for (let i = 0; i < 20; i++) FR.update(1 / 30); });
    const snap = () => page.evaluate(() => { const FR = window.FR, R = FR.renderer; for (let i = 0; i < 4; i++) FR.update(1 / 30);
      R.info.autoReset = false; R.info.reset(); R.render(FR.scene, FR.camera); const i = R.info.render; R.info.autoReset = true;
      let bushes = null; FR.scene.traverse(o => { if (o.name === 'bushes' || (o.userData && o.userData.lod === 'bushes')) bushes = o.visible; });
      return { profil: FR.Q.name, appels: i.calls, ktri: Math.round(i.triangles / 1000), ombres: R.shadowMap.enabled, carteOmbres: FR.Q.shadow ? FR.Q.smap : 0, solDetaille: !!FR.Q.splat,
        particulesMax: FR.Q.pmax, buissons: FR.Q.bushes, resolution: +R.getPixelRatio().toFixed(2), vue: FR.SET.viewDist }; });
    const click = sel => page.evaluate(sel => { const FR = window.FR; FR.openSettings(); FR.renderTab('gfx'); const b = document.querySelector(sel); if (!b) return false; b.click(); FR.closeSettings(); return true; }, sel);
    const prof = {};
    for (const q of ['vlow', 'low', 'medium', 'high']) { if (!await click(`.seg button[data-q="${q}"]`)) pb.push('bouton ' + q + ' absent'); prof[q] = await snap(); console.log(q.padEnd(7), JSON.stringify(prof[q])); }
    const P = prof; if (!(P.vlow.appels <= P.low.appels && P.low.appels <= P.medium.appels && P.medium.appels <= P.high.appels)) pb.push('appels de dessin pas croissants');
    if (P.vlow.ombres || P.low.ombres || !P.medium.ombres || !P.high.ombres) pb.push('ombres des profils'); if (P.vlow.solDetaille || !P.high.solDetaille) pb.push('sol des profils');
    if (!(P.vlow.vue < P.low.vue && P.low.vue < P.medium.vue && P.medium.vue < P.high.vue)) pb.push('distance de vue');
    // 2. Personnalisé depuis Élevé : identique au départ, puis chaque réglage
    await click('.seg button[data-q="custom"]'); const c0 = await snap(); console.log('perso   ', JSON.stringify(c0));
    const rows = await page.evaluate(() => { const FR = window.FR; FR.openSettings(); FR.renderTab('gfx'); const r = [...document.querySelectorAll('#sBody .lab span:first-child')].map(x => x.textContent); FR.closeSettings(); return r; });
    if (c0.appels !== P.high.appels || c0.ombres !== true || c0.carteOmbres !== 2048) pb.push('Personnalisé ne part pas du profil en cours');
    if (!rows.includes('Ombres') || !rows.includes('Textures du sol')) pb.push('réglages séparés absents en Personnalisé');
    const seg = (k, v) => page.evaluate(([k, v]) => { const FR = window.FR; FR.openSettings(); FR.renderTab('gfx'); const row = [...document.querySelectorAll('#sBody .srow')].find(d => d.querySelector(`button[data-v="${v}"]`) && d.textContent.includes(k)); row.querySelector(`button[data-v="${v}"]`).click(); FR.closeSettings(); }, [k, v]);
    await seg('Ombres', 'off'); const c1 = await snap(); await seg('Textures du sol', 'simple'); const c2 = await snap(); await seg('Effets', 'low'); const c3 = await snap(); await seg('Végétation', 'low'); const c4 = await snap();
    const perso = { depart: c0.appels, sansOmbres: [c1.ombres, c1.appels], solSimple: c2.solDetaille, effetsReduits: c3.particulesMax, vegetationReduite: [c4.buissons, c4.appels] }; console.log('perso→  ', JSON.stringify(perso));
    if (c1.ombres || c1.appels >= c0.appels || c2.solDetaille || c3.particulesMax > 100 || c4.buissons || c4.appels > c3.appels) pb.push('réglages du profil Personnalisé');
    const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('fr_set')));
    if (kept.cShadow !== 'off' || kept.cVeg !== 'low' ) pb.push('réglages personnalisés pas enregistrés');
    // 3. limite d'images
    const fps = await page.evaluate(() => { const FR = window.FR; const opts = (() => { FR.openSettings(); FR.renderTab('gfx'); const row = [...document.querySelectorAll('#sBody .srow')].find(d => d.textContent.includes('Limite')); const o = [...row.querySelectorAll('button')].map(b => b.textContent); FR.closeSettings(); return o; })();
      let t0 = 1e6; const gate = (cap, hz) => { let n = 0; const iv = 1000 / hz; t0 += 5000; FR.fpsGate(t0, cap, hz); for (let k = 1; k <= hz * 2; k++) if (FR.fpsGate(t0 + k * iv + (k % 3 - 1) * 0.6, cap, hz)) n++; return n / 2; }; // 2 s d'images, avec un peu de gigue
      return { ecranMesure: FR.screenHz, limitesProposees: opts, porte60Hz: { 30: gate(30, 60), 45: gate(45, 60), 60: gate(60, 60), aucune: gate(0, 60) }, porte120Hz: { 30: gate(30, 120), 45: gate(45, 120), 60: gate(60, 120), 90: gate(90, 120), 120: gate(120, 120) } }; });
    console.log('fps     ', JSON.stringify(fps));
    const g6 = fps.porte60Hz, g12 = fps.porte120Hz, near = (a, b) => Math.abs(a - b) <= 1;
    if (!near(g6[30], 30) || !near(g6[45], 45) || !near(g6[60], 60) || !near(g12[30], 30) || !near(g12[45], 45) || !near(g12[60], 60) || !near(g12[90], 90) || !near(g12[120], 120)) pb.push('porte de limite d’images');
    if (fps.ecranMesure <= 75 && fps.limitesProposees.some(t => t === '90' || t === '120')) pb.push('limites au-delà de l’écran proposées');
    // mesure réelle (menu, limite 30) : images dessinées par seconde
    await ctx.close(); }
  // mesure réelle dans une petite fenêtre, au menu (le navigateur de test dessine en logiciel : en grand, il n'atteint pas 30 images/s)
  { const ctx = await browser.newContext({ viewport: { width: 320, height: 180 } }); await ctx.addInitScript(() => localStorage.setItem('fr_q', 'vlow'));
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message)); await abort(page);
    await page.goto(base + '?touch=0'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 }); await page.waitForTimeout(4000);
    const real = {}; for (const cap of [0, 45, 30]) real[cap || 'aucune'] = await page.evaluate(async cap => { const FR = window.FR; FR.SET.fpsCap = cap; let n = 0, done = false; const f = () => { n++; if (!done) requestAnimationFrame(f); };
      await new Promise(r => setTimeout(r, 500)); const r0 = FR.renderer.info.render.frame; requestAnimationFrame(f); await new Promise(r => setTimeout(r, 3000)); done = true; const frames = FR.renderer.info.render.frame - r0; FR.SET.fpsCap = 0;
      return { rafParSeconde: +(n / 3).toFixed(1), imagesDessineesParSeconde: +(frames / 3).toFixed(1) }; }, cap);
    console.log('réel    ', JSON.stringify(real));
    if (real.aucune.imagesDessineesParSeconde > 40 && (real[30].imagesDessineesParSeconde > 32 || real[45].imagesDessineesParSeconde > 47 || real[45].imagesDessineesParSeconde < real[30].imagesDessineesParSeconde + 5)) pb.push('limite d’images non respectée en vrai');
    await ctx.close(); }
  // ---------- 4 : HUD au téléphone ----------
  { const o = { ...devices['Pixel 7 landscape'] }; delete o.defaultBrowserType; const ctx = await browser.newContext(o); await ctx.addInitScript(() => { if (!localStorage.getItem('fr_q')) localStorage.setItem('fr_q', 'low'); });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message)); await abort(page);
    await page.goto(base + '?touch=1'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
    await page.evaluate(() => { window.FR.startMatch('train'); }); await page.waitForTimeout(800);
    const box = id => page.evaluate(id => { const el = document.getElementById(id), r = el.getBoundingClientRect(), cs = getComputedStyle(el); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), op: +(+cs.opacity).toFixed(2), vis: cs.visibility }; }, id);
    const f0 = await box('bFire'), j0 = await box('bJump');
    await page.evaluate(() => { window.FR.openSettings(); window.FR.renderTab('hud'); [...document.querySelectorAll('#sBody .sbtn')].find(b => b.textContent.includes('Personnaliser')).click(); }); await page.waitForTimeout(400);
    // déplacer TIRER de 120 px vers la gauche et 60 px vers le haut au doigt
    await page.touchscreen.tap(f0.x, f0.y); const cdp = await ctx.newCDPSession(page);
    const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    await touch('touchStart', f0.x, f0.y); for (let k = 1; k <= 8; k++) await touch('touchMove', f0.x - 15 * k, f0.y - 7.5 * k); await touch('touchEnd');
    await page.evaluate(() => { const s = document.getElementById('heSize'), o = document.getElementById('heOp'); s.value = 130; s.dispatchEvent(new Event('input')); o.value = 60; o.dispatchEvent(new Event('input')); });
    await page.touchscreen.tap(j0.x, j0.y); await page.evaluate(() => { const h = document.getElementById('heHide'); h.checked = true; h.dispatchEvent(new Event('change')); });
    const inEditor = await box('bJump'); await page.evaluate(() => document.getElementById('heSave').click()); await page.waitForTimeout(300);
    const f1 = await box('bFire'), j1 = await box('bJump');
    await page.reload(); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 }); await page.evaluate(() => { window.FR.startMatch('train'); }); await page.waitForTimeout(800);
    const f2 = await box('bFire'), j2 = await box('bJump'), set = await page.evaluate(() => ({ preset: window.FR.SET.hudPreset, perso: !!window.FR.SET.layoutPerso }));
    const hud = { tirerAvant: f0, tirerApres: f1, tirerApresRechargement: f2, sautMasqueDansEditeur: inEditor, sautApres: j1, sautApresRechargement: j2, disposition: set };
    for (const k in hud) console.log(k.padEnd(22), JSON.stringify(hud[k]));
    if (!(f1.x < f0.x - 80 && f1.y < f0.y - 30) || Math.abs(f2.x - f1.x) > 2 || Math.abs(f2.y - f1.y) > 2) pb.push('déplacement de TIRER pas gardé');
    if (!(f2.w > f0.w * 1.2) || Math.abs(f2.op - 0.6) > 0.05) pb.push('taille / opacité de TIRER pas gardées');
    if (j2.vis !== 'hidden' || inEditor.vis === 'hidden') pb.push('SAUT masqué pas gardé (ou invisible dans l’éditeur)');
    if (set.preset !== 'perso' || !set.perso) pb.push('disposition Personnalisée pas enregistrée');
    // dispositions toutes faites (menu HUD), puis retour à la personnalisée
    const pre = {}; for (const p of ['compact', 'construction', 'classique', 'perso']) { await page.evaluate(p => { window.FR.openSettings(); window.FR.renderTab('hud'); document.querySelector(`#sBody button[data-v="${p}"]`).click(); window.FR.closeSettings(); }, p);
      await page.waitForTimeout(150); pre[p] = { tirer: await box('bFire'), pieces: await box('pick'), saut: (await box('bJump')).vis }; }
    console.log('dispositions          ', JSON.stringify(Object.fromEntries(Object.entries(pre).map(([k, v]) => [k, { tirerLargeur: v.tirer.w, tirerOpacite: v.tirer.op, piecesLargeur: v.pieces.w, saut: v.saut }]))));
    if (!(pre.compact.tirer.w < pre.classique.tirer.w) || !(pre.construction.pieces.w > pre.classique.pieces.w) || pre.classique.saut === 'hidden' || pre.perso.saut !== 'hidden' || Math.abs(pre.perso.tirer.x - f2.x) > 2) pb.push('dispositions toutes faites');
    await page.screenshot({ path: process.env.SHOT || '/tmp/hud_perso.png' });
    await ctx.close(); }
  console.log(pb.length ? 'À REVOIR : ' + pb.join(' ; ') : 'tout est bon'); console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
