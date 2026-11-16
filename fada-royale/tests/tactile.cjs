// v1.7 : commandes tactiles utilisées EN MÊME TEMPS (vrais événements tactiles multi-doigts envoyés par le protocole de Chrome, Pixel 7 paysage)
// 1. joystick + glisser pour viser + TIRER, trois doigts à la fois : le perso avance, la caméra tourne, l'arme tire
// 2. on relâche les doigts dans le désordre : chaque commande s'arrête seule
// 3. construction en courant : joystick + doigt sur MUR + glisser pour viser
// 4. changement d'arme en courant (toucher une case d'arme) puis bouton ÉCHANGE (arme précédente)
// Usage : node tests/tactile.cjs http://localhost:8000/index.html
const { chromium, devices } = require('playwright'); const [,, base] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const o = { ...devices['Pixel 7 landscape'] }; delete o.defaultBrowserType; const ctx = await browser.newContext(o); await ctx.addInitScript(() => localStorage.setItem('fr_q', 'low'));
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=1'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  await page.evaluate(() => { const FR = window.FR; FR.startMatch('train'); window.__freeze = true; const p = FR.player;
    const open = (x, z) => !FR.solids.some(s => s.maxX > x - 14 && s.minX < x + 14 && s.maxZ > z - 14 && s.minZ < z + 14) && Math.abs(FR.terrainH(x, z - 10) - FR.terrainH(x, z + 4)) < 0.6 && Math.abs(FR.terrainH(x - 8, z) - FR.terrainH(x + 8, z)) < 0.6; // dégagé et plat (une pente change la hauteur des pièces)
    let spot = null; for (let r = 0; r < 220 && !spot; r += 6) for (let a = 0; a < 6.28 && !spot; a += 0.4) { const x = 40 + Math.cos(a) * r, z = -30 + Math.sin(a) * r; if (open(x, z)) spot = [Math.floor(x / 4) * 4 + 2, Math.floor(z / 4) * 4 + 2]; } // au centre d'une case de construction (le résultat ne dépend plus d'où tombe le point)
    window.__spot = spot; p.pos.set(spot[0], FR.terrainH(spot[0], spot[1]) + 0.05, spot[1]); FR.setCam(0, -0.05); for (let i = 0; i < 10; i++) FR.update(1 / 30); });
  const cdp = await ctx.newCDPSession(page); const W = 915, H = 412;
  const fingers = {}; const send = async type => { await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: Object.values(fingers) }); };
  const ids = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6 }; const down = async (id, x, y) => { fingers[id] = { x, y, id: ids[id], radiusX: 4, radiusY: 4, force: 1 }; await send('touchStart'); };
  const move = async (id, x, y) => { fingers[id].x = x; fingers[id].y = y; await send('touchMove'); };
  // lever UN doigt : on renvoie la liste des doigts restants (Chrome relâche celui qui manque) ; touchEnd (liste vide) = dernier doigt levé
  const up = async id => { delete fingers[id]; const rest = Object.values(fingers); await cdp.send('Input.dispatchTouchEvent', rest.length ? { type: 'touchMove', touchPoints: rest } : { type: 'touchEnd', touchPoints: [] }); };
  const step = n => page.evaluate(n => { for (let i = 0; i < n; i++) window.FR.update(1 / 30); }, n);
  const st = () => page.evaluate(() => { const FR = window.FR, p = FR.player; return { x: p.pos.x, z: p.pos.z, yaw: FR.camYaw, mag: p.mag[p.cur], cur: p.cur, pieces: FR.pieceList.length, build: FR.buildMode, sw: p.switchT }; });
  const center = async sel => page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
  const res = {};
  // 1. trois doigts à la fois
  await page.evaluate(() => { const p = window.FR.player; p.mag[p.cur] = 30; p.ammo = 300; });
  const s0 = await st(); const fire = await center('#bFire');
  await down('A', W * 0.18, H * 0.68); await down('B', W * 0.62, H * 0.35); await down('C', fire[0], fire[1]);
  for (let i = 0; i < 12; i++) { await move('A', W * 0.18, H * 0.68 - 50); await move('B', W * 0.62 + i * 6, H * 0.35); await step(2); }
  const s1 = await st(); res.troisDoigts = { avance: +Math.hypot(s1.x - s0.x, s1.z - s0.z).toFixed(1), cameraTournee: +(s0.yaw - s1.yaw).toFixed(2), ballesTirees: s0.mag - s1.mag };
  // 2. relâchés dans le désordre
  await up('B'); await step(10); const s2 = await st(); await up('C'); await step(10); const s3 = await st(); await up('A'); await step(15); const s4 = await st(); await step(10); const s5 = await st();
  res.relaches = { sansViseurLaCameraNeBougePlus: Math.abs(s2.yaw - s1.yaw) < 0.03, /* seul reste le petit écart aléatoire du recul au tir */ tirContinueSansViseur: s1.mag > s2.mag, tirArreteApresTIRER: s3.mag === (await st()).mag, avanceApresTIRER: Math.hypot(s3.x - s2.x, s3.z - s2.z) > 0.5, arreteApresJoystick: Math.hypot(s5.x - s4.x, s5.z - s4.z) < 0.05 };
  // 3. construction en courant
  const wallBtn = await center('#pick button[data-p="wall"]'); const b0 = await st();
  await down('A', W * 0.18, H * 0.68); await move('A', W * 0.18, H * 0.68 - 50); await down('B', W * 0.62, H * 0.35); await down('D', wallBtn[0], wallBtn[1]);
  for (let i = 0; i < 30; i++) { await move('A', W * 0.18, H * 0.68 - 50); await move('B', W * 0.62 + i * 2, H * 0.35); await step(2); } // 2 s : assez pour changer de case quel que soit le point de départ sur la grille
  const b1 = await st(); await up('D'); await up('B'); await up('A'); await step(5);
  res.constructionEnCourant = { piecesPosees: b1.pieces - b0.pieces, avance: +Math.hypot(b1.x - b0.x, b1.z - b0.z).toFixed(1), cameraTournee: +(b0.yaw - b1.yaw).toFixed(2), modeConstruction: b1.build };
  // 4. changement d'arme en courant, puis ÉCHANGE
  await page.evaluate(() => { const FR = window.FR; FR.toggleBuild(false); const p = FR.player; p.slots = ['fusil', 'pompe', 'sniper', null, null]; FR.selectSlot(1); for (let i = 0; i < 30; i++) FR.update(1 / 30); });
  const w0 = await st(); await down('A', W * 0.18, H * 0.68); await move('A', W * 0.18, H * 0.68 - 50); await step(3);
  const slot3 = await center('.slot[data-s="3"]'); await down('E', slot3[0], slot3[1]); await up('E');
  for (let i = 0; i < 25; i++) { await move('A', W * 0.18, H * 0.68 - 50); await step(1); }
  const w1 = await st(); const swapBtn = await center('#bSwap'); await down('F', swapBtn[0], swapBtn[1]); await up('F'); await step(25); const w2 = await st(); await up('A'); await step(5);
  res.changementEnCourant = { avant: w0.cur, apres: w1.cur, avanceAuChangement: +Math.hypot(w1.x - w0.x, w1.z - w0.z).toFixed(1), echange: w2.cur };
  for (const k in res) console.log(k.padEnd(22), JSON.stringify(res[k]));
  const pb = [], T = res.troisDoigts, Rl = res.relaches, C = res.constructionEnCourant, S = res.changementEnCourant;
  if (T.avance < 2 || T.cameraTournee < 0.1 || T.ballesTirees < 2) pb.push('trois doigts');
  if (!Rl.sansViseurLaCameraNeBougePlus || !Rl.tirContinueSansViseur || !Rl.tirArreteApresTIRER || !Rl.avanceApresTIRER || !Rl.arreteApresJoystick) pb.push('relâchés dans le désordre');
  if (C.piecesPosees < 2 || C.avance < 2 || C.cameraTournee < 0.05) pb.push('construction en courant');
  if (S.avant !== 'fusil' || S.apres !== 'sniper' || S.avanceAuChangement < 2 || S.echange !== 'fusil') pb.push('changement en courant / échange');
  console.log(pb.length ? 'À REVOIR : ' + pb.join(' ; ') : 'tout est bon'); console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
