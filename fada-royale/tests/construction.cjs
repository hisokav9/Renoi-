// v1.7 : construction (Entraînement, commandes du jeu appelées comme les boutons)
// 1. quatre pièces à la suite (mur, rampe, sol, toit) : posées sans attente, contour de matérialisation pendant la pose puis retiré,
//    pièce dessinée en instance une fois finie, matière propre libérée
// 2. rotation : touche R en construction = quart de tour de la rampe (et pas un rechargement)
// 3. édition d'un mur : raccourcis PORTE / FENÊTRE / DEMI-MUR (cases retirées, collisions), on passe par la porte
// 4. édition d'une rampe : choisir le côté qui monte la retourne
// 5. destruction : plus aucune collision ni dessin à la place de la pièce (mur entier et mur édité), on passe
// 6. impact : la pièce tremble puis retrouve exactement sa place
// Usage : node tests/construction.cjs http://localhost:8000/index.html
const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=0'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  const res = await page.evaluate(() => { const FR = window.FR; FR.startMatch('train'); window.__freeze = true; const p = FR.player, out = {};
    const step = (n, f) => { for (let i = 0; i < n; i++) { if (f) f(i); FR.update(1 / 30); } };
    const flat = (x, z) => !FR.solids.some(s => s.maxX > x - 12 && s.minX < x + 12 && s.maxZ > z - 12 && s.minZ < z + 12) && Math.abs(FR.terrainH(x + 6, z) - FR.terrainH(x - 6, z)) < 0.6 && Math.abs(FR.terrainH(x, z + 6) - FR.terrainH(x, z - 6)) < 0.6;
    let spot = null; for (let r = 0; r < 220 && !spot; r += 6) for (let a = 0; a < 6.28 && !spot; a += 0.4) { const x = 40 + Math.cos(a) * r, z = -30 + Math.sin(a) * r; if (flat(x, z)) spot = [Math.floor(x / 4) * 4 + 2, Math.floor(z / 4) * 4 + 2]; }
    const go = (dx = 0, dz = 0) => { const x = spot[0] + dx, z = spot[1] + dz; p.pos.set(x, FR.terrainH(x, z) + 0.05, z); p.vel.set(0, 0, 0); FR.setCam(0, -0.05); step(4); };
    const key = c => window.dispatchEvent(new KeyboardEvent('keydown', { code: c }));
    const keyUp = c => window.dispatchEvent(new KeyboardEvent('keyup', { code: c }));
    // 1. quatre pièces
    go(); const n0 = FR.pieceList.length, seq = [];
    for (const [t, pitch, yaw] of [['wall', -0.05, 0], ['ramp', -0.05, Math.PI / 2], ['floor', 0.5, 0], ['cone', -0.05, -Math.PI / 2]]) {
      FR.setCam(yaw, pitch); step(1); const before = FR.pieceList.length; FR.pieceDown(t, true); FR.pieceUp(t); step(1);
      const q = FR.pieceList[FR.pieceList.length - 1]; seq.push({ type: t, posee: FR.pieceList.length > before, contourPendant: !!(q && q.ol) }); }
    step(70); const built = FR.pieceList.slice(n0);
    out.quatrePieces = { pieces: seq, finies: built.filter(q => q.build >= 1).length, contourRetire: built.every(q => !q.ol), enInstance: built.filter(q => q.inst !== null).length, matiereLiberee: built.filter(q => q.inst !== null && q.mat === null).length };
    // 2. rotation
    go(16, 0); FR.setCam(0, -0.05); FR.setBuildType('ramp'); FR.toggleBuild(true); step(1); const mag0 = p.mag[p.cur];
    key('KeyR'); keyUp('KeyR'); step(1); const nb = FR.pieceList.length; FR.pieceDown('ramp', true); FR.pieceUp('ramp'); step(2);
    const rq = FR.pieceList.slice(nb).find(q => q.type === 'ramp'); out.rotation = { rotation: FR.buildRot, rampeDir: rq ? rq.ramp.dir : null, faceA: FR.dirFromYaw(0), rechargementLance: p.reloadT > 0 };
    key('KeyR'); keyUp('KeyR'); key('KeyR'); keyUp('KeyR'); key('KeyR'); keyUp('KeyR'); FR.toggleBuild(false); step(50);
    // 3. édition d'un mur (raccourcis)
    out.edition = {};
    for (const [k, pre] of [[0, 'porte'], [1, 'fenetre'], [2, 'demi']]) { go(-16, k * 12); FR.setCam(0, -0.05); const nw = FR.pieceList.length; FR.pieceDown('wall', true); FR.pieceUp('wall'); FR.toggleBuild(false); step(60);
      const w = FR.pieceList.slice(nw).find(q => q.type === 'wall'); FR.setCam(0, -0.05); step(1); FR.startEdit(); const ed = !!FR.editing; FR.editPreset(pre); step(2);
      out.edition[pre] = { editionOuverte: ed, casesRestantes: w.tiles.filter(Boolean).length, collisions: w.solids.length, retirees: w.tiles.map((v, i) => v ? null : i).filter(v => v !== null).join(',') };
      if (pre === 'porte') { const cx = w.axis === 'z' ? w.x0 + 2 : w.plane, cz = w.axis === 'z' ? w.plane : w.z0 + 2, y = w.lvl; out.edition.porte.passageLibre = FR.spaceFreeAt(cx, cz, y + 0.2, y + 1.7, 0.3); } }
    // 4. édition d'une rampe
    go(32, 0); FR.setCam(0, -0.05); const nr = FR.pieceList.length; FR.pieceDown('ramp', true); FR.pieceUp('ramp'); FR.toggleBuild(false); step(60);
    const ramp = FR.pieceList.slice(nr).find(q => q.type === 'ramp'); const dir0 = ramp.ramp.dir; FR.setCam(0, -0.4); step(1); FR.startEdit(); const edR = !!FR.editing;
    if (edR) { const want = (dir0 + 1) % 4, side = { 0: [0, 1], 1: [1, 3], 2: [2, 3], 3: [0, 2] }[want]; FR.editing.sel.fill(false); for (const i of side) FR.editing.sel[i] = true; FR.confirmEdit(); }
    out.rampe = { editionOuverte: edR, avant: dir0, apres: ramp.ramp.dir, enInstance: ramp.inst !== null };
    // 5. destruction
    go(-32, 0); FR.setCam(0, -0.05); const nd = FR.pieceList.length; FR.pieceDown('wall', true); FR.pieceUp('wall'); FR.toggleBuild(false); step(60);
    const wd = FR.pieceList.slice(nd).find(q => q.type === 'wall'); const box = FR.qBox(wd), inst0 = FR.PINST.wall.items.length; FR.destroyPiece(wd); step(5);
    const left = FR.solids.filter(s => s.piece === wd).length + FR.solids.filter(s => s.piece && s.minX < box[3] - 0.05 && s.maxX > box[0] + 0.05 && s.minZ < box[5] - 0.05 && s.maxZ > box[2] + 0.05 && s.minY < box[4] && s.maxY > box[1]).length;
    const cx = (box[0] + box[3]) / 2, cz = (box[2] + box[5]) / 2;
    out.destruction = { collisionsRestantes: left, instancesAvant: inst0, instancesApres: FR.PINST.wall.items.length, passageLibre: FR.spaceFreeAt(cx, cz, box[1] + 0.2, box[1] + 1.7, 0.3), dansLaListe: FR.pieceList.includes(wd) };
    const wed = FR.pieceList.find(q => q.type === 'wall' && q.edited && q.alive); if (wed) { const s0 = wed.solids.length; FR.destroyPiece(wed); out.destruction.murEdite = { collisionsAvant: s0, restantes: FR.solids.filter(s => s.piece === wed).length }; }
    // 6. impact
    go(48, 0); FR.setCam(0, -0.05); const ni = FR.pieceList.length; FR.pieceDown('wall', true); FR.pieceUp('wall'); FR.toggleBuild(false); step(60);
    const wi = FR.pieceList.slice(ni).find(q => q.type === 'wall'), P = FR.PINST.wall, M = new FR.THREE.Matrix4(), M0 = new FR.THREE.Matrix4();
    P.panel.getMatrixAt(wi.inst, M0); FR.damagePiece(wi, 20); step(2); P.panel.getMatrixAt(wi.inst, M); const moved = !M.equals(M0); step(10); P.panel.getMatrixAt(wi.inst, M);
    out.impact = { tremble: moved, revenuExactement: M.equals(M0), pv: Math.round(wi.hp) };
    return out; });
  for (const k in res) console.log(k.padEnd(14), JSON.stringify(res[k]));
  const pb = [], q4 = res.quatrePieces;
  if (q4.pieces.some(x => !x.posee)) pb.push('pièce non posée'); if (q4.pieces.some(x => !x.contourPendant)) pb.push('pas de contour pendant la pose');
  if (!q4.contourRetire || q4.finies < 4 || q4.enInstance < 4 || q4.matiereLiberee < 4) pb.push('fin de construction');
  if (res.rotation.rotation !== 1 || res.rotation.rampeDir !== (res.rotation.faceA + 1) % 4 || res.rotation.rechargementLance) pb.push('rotation');
  const E = res.edition; if (E.porte.retirees !== '1,4' || !E.porte.passageLibre || E.fenetre.retirees !== '4' || E.demi.retirees !== '6,7,8' || E.porte.collisions !== 7) pb.push('raccourcis d\'édition');
  if (!res.rampe.editionOuverte || res.rampe.apres !== (res.rampe.avant + 1) % 4 || !res.rampe.enInstance) pb.push('édition de rampe');
  const D = res.destruction; if (D.collisionsRestantes || !D.passageLibre || D.dansLaListe || D.instancesApres !== D.instancesAvant - 1 || (D.murEdite && D.murEdite.restantes)) pb.push('destruction');
  if (!res.impact.tremble || !res.impact.revenuExactement) pb.push('impact');
  console.log(pb.length ? 'À REVOIR : ' + pb.join(' ; ') : 'tout est bon'); console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
