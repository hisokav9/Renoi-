// v2.0.1 : chute libre, parapente et nage (Battle Royale, ordinateur : clavier du jeu ; mesures sur le squelette du perso)
// 1. chute libre : corps à plat ventre (angle hanches → tête), vitesse de chute normale / en piqué (Z), direction ; SAUT ouvre le
//    parapente au-dessus de 12 m, refusé en dessous ; ouverture automatique à 44 m
// 2. parapente : sans toucher au clavier, il avance (≈ 7,5 m/s) et descend (≈ 4,6 m/s) ; en tournant, la voile et le corps s'inclinent,
//    le cap tourne d'au plus 1,6 rad/s ; arrondi avant le sol, posé en courant
// 3. nage : dans le fleuve, il flotte (hanches sous la surface, tête dehors), corps à l'horizontale, 3 m/s (3,9 au sprint), arme rangée,
//    pas de tir, pas de construction, pas d'emote ; sortie sur la berge ; un bot nage aussi et ne tire pas
// Usage : node tests/air_eau.cjs http://127.0.0.1:8000/index.html [dossier des captures]
const { chromium } = require('playwright'); const [,, base, out] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } }); await ctx.addInitScript(() => { localStorage.setItem('fr_q', 'medium'); localStorage.setItem('fr_skin', 'boss'); });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=0'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  const shot = async n => { if (out) await page.screenshot({ path: `${out}/${n}.png` }); };
  const pb = [];
  await page.evaluate(() => { const FR = window.FR; FR.SET.botCount = 19; FR.startMatch('br'); window.__freeze = true;
    window.__T = { step: n => { for (let i = 0; i < n; i++) FR.update(1 / 30); },
      key: (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code })),
      tilt: c => { const B = c.model.bones, h = new FR.THREE.Vector3(), k = new FR.THREE.Vector3(); B.Hips.getWorldPosition(k); B.Head.getWorldPosition(h); h.sub(k).normalize(); return +(Math.acos(Math.min(1, h.y)) * 57.3).toFixed(0); },
      ground: c => c.pos.y - FR.terrainH(c.pos.x, c.pos.z) }; });
  // 1. chute libre
  const f = await page.evaluate(() => { const FR = window.FR, T = window.__T, p = FR.player; FR.bus.t = 2; T.step(1); FR.jumpFromBus(); p.pos.y = 600; T.step(60); // très haut : pour mesurer la chute et le piqué sans ouverture automatique
    const r = { phase: p.phase, angleCorps: T.tilt(p), chute: +p.vel.y.toFixed(1) }; FR.setCam(FR.camYaw, -0.5);
    T.key('KeyW', true); T.step(60); r.chuteEnPique = +p.vel.y.toFixed(1); r.angleEnPique = T.tilt(p); r.vitesseHoriz = +Math.hypot(p.vel.x, p.vel.z).toFixed(1); T.key('KeyW', false); T.step(40); r.chuteApres = +p.vel.y.toFixed(1); p.pos.y = FR.terrainH(p.pos.x, p.pos.z) + 300;
    // ouverture automatique : à environ 44 m du sol
    p.pos.y = FR.terrainH(p.pos.x, p.pos.z) + 70; let n = 0; while (p.phase === 'fall' && n < 200) { T.step(1); n++; } r.ouvertureAuto = +T.ground(p).toFixed(0);
    // SAUT en chute libre : ouvre tout de suite (ici à 300 m)
    p.phase = 'fall'; p.model.glider.visible = false; p.vel.set(0, -40, 0); p.pos.y = FR.terrainH(p.pos.x, p.pos.z) + 300; T.step(2);
    T.key('Space', true); T.key('Space', false); T.step(1); r.sautHaut = p.phase; r.hauteurOuverture = +T.ground(p).toFixed(0);
    return r; });
  await shot('chute'); console.log('chute    ', JSON.stringify(f));
  if (f.angleCorps < 55 || f.chute < -42 || f.chute > -38 || f.chuteEnPique > -50 || f.angleEnPique <= f.angleCorps || Math.abs(f.ouvertureAuto - 44) > 4 || f.sautHaut !== 'glide' || f.hauteurOuverture < 250) pb.push('chute libre');
  // 2. parapente
  const g = await page.evaluate(() => { const FR = window.FR, T = window.__T, p = FR.player; T.step(45);
    const r = { vitesseSansClavier: +Math.hypot(p.vel.x, p.vel.z).toFixed(1), descente: +(-p.vel.y).toFixed(1), angleCorps: T.tilt(p) };
    const h0 = p.gHead; T.key('KeyA', true); let maxRate = 0, prev = p.gHead; for (let i = 0; i < 30; i++) { T.step(1); maxRate = Math.max(maxRate, Math.abs(Math.atan2(Math.sin(p.gHead - prev), Math.cos(p.gHead - prev))) * 30); prev = p.gHead; }
    r.capTourne = +Math.abs(Math.atan2(Math.sin(p.gHead - h0), Math.cos(p.gHead - h0))).toFixed(2); r.tourMax = +maxRate.toFixed(2); r.inclinaisonVoile = +p.model.glider.rotation.z.toFixed(2); r.inclinaisonPerso = +p.model.g.rotation.z.toFixed(2);
    T.key('KeyA', false); p.pos.y = FR.terrainH(p.pos.x, p.pos.z) + 30; let sinkLow = null, n = 0; /* on redescend à 30 m pour mesurer l'atterrissage */ while (p.phase === 'glide' && n < 900) { if (sinkLow === null && T.ground(p) < 1.2) sinkLow = +(-p.vel.y).toFixed(1); T.step(1); n++; }
    r.descenteAuSol = sinkLow; r.pose = p.phase; r.courseApres = +Math.hypot(p.vel.x, p.vel.z).toFixed(1); T.step(15); r.angleAuSol = T.tilt(p); r.voileCachee = !p.model.glider.visible; return r; });
  console.log('parapente', JSON.stringify(g));
  if (g.vitesseSansClavier < 6.5 || g.descente > 5.5 || g.capTourne < 0.3 || g.tourMax > 1.7 || Math.abs(g.inclinaisonVoile) < 0.02 || g.pose !== 'ground' || g.descenteAuSol > 3.5 || g.angleAuSol > 25 || !g.voileCachee) pb.push('parapente');
  // capture en virage (nouvelle descente)
  await page.evaluate(() => { const FR = window.FR, T = window.__T, p = FR.player; p.phase = 'fall'; p.pos.y += 80; p.vel.set(0, -20, 0); p.model.glider.visible = false; T.step(1); T.key('Space', true); T.key('Space', false); T.step(40); T.key('KeyD', true); T.step(25); FR.setCam(p.gHead + 0.6, -0.25); T.step(2); });
  await shot('parapente'); await page.evaluate(() => { window.__T.key('KeyD', false); });
  // 3. nage
  const w = await page.evaluate(() => { const FR = window.FR, T = window.__T, p = FR.player; let n = 0; while (p.phase !== 'ground' && n < 900) { T.step(1); n++; }
    // un endroit profond du fleuve, loin du pont
    let z = -100, x = 0; for (; z < 200; z += 7) { x = FR.riverX ? FR.riverX(z) : null; if (x === null) break; if (Math.abs(z - 30) > 30 && FR.terrainH(x, z) < -2.6) break; }
    p.pos.set(x, FR.terrainH(x, z) + 0.1, z); p.vel.set(0, 0, 0); p.slots = ['fusil', null, null, null, null]; p.srar = [2, 0, 0, 0, 0]; p.mag = { fusil: 30 }; FR.selectSlot(1); T.step(40);
    const r = { nage: !!p.swim, hanchesSousSurface: null, teteHorsEau: null, angleCorps: T.tilt(p), armeVisible: Object.values(p.model.w).some(o => o.visible) };
    const B = p.model.bones, v = new FR.THREE.Vector3(); B.Hips.getWorldPosition(v); r.hanchesSousSurface = +(-1.2 - v.y).toFixed(2); B.Head.getWorldPosition(v); r.teteHorsEau = +(v.y + 1.2).toFixed(2);
    FR.setCam(-Math.PI / 2, -0.15); T.key('KeyW', true); T.step(40); r.vitesse = +Math.hypot(p.vel.x, p.vel.z).toFixed(1); FR.setSprint(true); T.key('ShiftLeft', true); T.step(30); r.vitesseSprint = +Math.hypot(p.vel.x, p.vel.z).toFixed(1); T.key('ShiftLeft', false); FR.setSprint(false); T.key('KeyW', false); T.step(20);
    const m0 = p.mag.fusil; FR.setFiring(true); T.step(20); FR.setFiring(false); r.tirsEnNageant = m0 - p.mag.fusil;
    const n0 = FR.pieceList.length; FR.pieceDown('wall', true); FR.pieceUp('wall'); T.step(3); r.piecesEnNageant = FR.pieceList.length - n0; r.emote = FR.startEmote(p, 'danse');
    return r; });
  await shot('nage'); console.log('nage     ', JSON.stringify(w));
  if (!w.nage || w.hanchesSousSurface < 0 || w.teteHorsEau < 0 || w.angleCorps < 50 || w.armeVisible || w.vitesse < 2.6 || w.vitesse > 3.4 || w.vitesseSprint < 3.5 || w.tirsEnNageant || w.piecesEnNageant || w.emote) pb.push('nage');
  // sortie sur la berge + bot qui nage
  const s = await page.evaluate(() => { const FR = window.FR, T = window.__T, p = FR.player; const x0 = FR.riverX(p.pos.z); FR.setCam(-Math.PI / 2, -0.1); T.key('KeyW', true); let n = 0; while (p.swim && n < 600) { T.step(1); n++; } T.step(30); T.key('KeyW', false); T.step(10);
    const r = { sorti: !p.swim, secondes: +(n / 30).toFixed(1), distanceAuFleuve: +Math.abs(p.pos.x - x0).toFixed(1), armeRessortie: Object.values(p.model.w).some(o => o.visible), auSol: Math.abs(p.pos.y - FR.terrainH(p.pos.x, p.pos.z)) < 0.6 };
    const b = FR.bots.find(x => x.inMatch && x.alive); for (const o of FR.bots) if (o !== b) { o.alive = false; o.model.g.visible = false; } const z = p.pos.z, x = FR.riverX(z); /* seul ce bot reste */ b.phase = 'ground'; b.pos.set(x, FR.terrainH(x, z) + 0.1, z); b.vel.set(0, 0, 0); b.target = p; b.canSee = true; b.reactT = 0; b.fireCD = 0;
    p.pos.set(x + 18, FR.terrainH(x + 18, z), z); let nf = 0, sw = 0, tirs = 0; for (let i = 0; i < 60; i++) { const s0 = FR.BSTAT.shots, was = !!b.swim; T.step(1); if (was && b.swim) { sw++; tirs += FR.BSTAT.shots - s0; } nf++; } r.botNage = sw >= 15; r.imagesEnNage = sw; r.tirsDuBot = tirs; /* tirs pendant qu'il nage */
    b.pos.set(x + 18, FR.terrainH(x + 18, z), z); b.reactT = 0; b.fireCD = 0; b.target = p; const s1 = FR.BSTAT.shots; T.step(60); r.tirsDuBotHorsEau = FR.BSTAT.shots - s1; return r; });
  console.log('sortie   ', JSON.stringify(s));
  if (!s.sorti || !s.auSol || !s.armeRessortie || !s.botNage || s.tirsDuBot || !s.tirsDuBotHorsEau) pb.push('sortie de l’eau / bot');
  console.log(pb.length ? 'À REVOIR : ' + pb.join(' ; ') : 'tout est bon'); console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
