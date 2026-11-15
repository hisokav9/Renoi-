// v1.5 : tenue des pièces, effondrement et saut tolérant (Entraînement, commandes du jeu appelées comme les boutons)
// 1. bug signalé : 5 rampes, on monte jusqu'à la dernière, puis MUR -> le mur doit se poser au bout de la rampe et tenir (v1.4 : dans le vide)
// 2. montée mur + rampe dans les deux ordres d'appui (MUR avant RAMPE : l'appui est gardé en mémoire jusqu'à la rampe)
// 3. effondrement : on détruit le bas d'une tour de rampes ; tout ce qui n'est plus relié au sol tombe, la maison voisine reste
// 4. saut tolérant : appui juste après avoir quitté le haut d'une rampe, appui juste avant de toucher le sol
// 5. une pièce qui ne tient sur rien est refusée
// Usage : node tests/support.cjs http://localhost:8000/index.html
const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  const fresh = async () => { await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
    await page.evaluate(() => { const FR = window.FR; FR.startMatch('train'); window.__freeze = true; for (let i = 0; i < 20; i++) FR.update(1 / 30);
      window.__tient = q => { const b = FR.qBox(q); return FR.boxGrounded(b) || FR.pieceList.some(o => o !== q && o.alive && FR.boxTouch(b, FR.qBox(o), 0.3)); };
      window.__step = (n, f) => { for (let i = 0; i < n; i++) { if (f) f(i); FR.update(1 / 30); } }; }); };
  const res = {};

  await fresh();
  res.murApres5Rampes = await page.evaluate(() => { const FR = window.FR, p = FR.player, out = []; FR.setCam(0, 0.05);
    for (const where of ['haut', 'bas']) {
      const n0 = FR.pieceList.length; FR.pieceDown('ramp', true); let f = 0; while (FR.pieceList.length - n0 < 5 && f < 400) { FR.keys.KeyW = true; FR.update(1 / 30); f++; } FR.pieceUp('ramp');
      const top = Math.max(...FR.pieceList.slice(n0).map(q => q.lvl));
      f = 0; while (f < 300) { FR.keys.KeyW = true; FR.update(1 / 30); f++; const r = p.onRamp; if (r && r.lvl === top && (where === 'haut' ? p.pos.y > top + 2.6 : p.pos.y > top + 0.6)) break; }
      FR.keys.KeyW = false; window.__step(4);
      const n1 = FR.pieceList.length, endLine = Math.floor(p.pos.z / 4) * 4; FR.pieceDown('wall', true); FR.pieceUp('wall'); window.__step(14);
      const w = FR.pieceList.slice(n1).find(q => q.type === 'wall');
      out.push({ moitie: where, mur: !!w, auBoutDeLaRampe: !!w && w.plane === endLine, tient: !!w && window.__tient(w), hauteur: w ? (w.lvl === top ? 'sous le bord' : w.lvl === top + 4 ? 'au-dessus du bord' : 'ailleurs') : '-' });
      p.pos.x += 24; p.pos.y = FR.terrainH(p.pos.x, p.pos.z) + 1; window.__step(40); }
    return out; });

  res.monteeDeuxOrdres = [];
  for (const order of [['ramp', 'wall'], ['wall', 'ramp']]) {
    await fresh();
    res.monteeDeuxOrdres.push(await page.evaluate(order => { const FR = window.FR, p = FR.player; FR.setCam(0, 0.05); const y0 = p.pos.y, n0 = FR.pieceList.length;
      FR.pieceDown('ramp', true); FR.pieceUp('ramp'); window.__step(12, () => { FR.keys.KeyW = true; }); // première rampe, on monte dessus
      window.__step(270, i => { FR.keys.KeyW = true; const ph = i % 10; if (ph === 0) FR.pieceDown(order[0], true); if (ph === 2) FR.pieceUp(order[0]); if (ph === 5) FR.pieceDown(order[1], true); if (ph === 7) FR.pieceUp(order[1]); });
      FR.keys.KeyW = false; const nw = FR.pieceList.slice(n0); return { ordre: order.join(' puis '), monteEn9s: +(p.pos.y - y0).toFixed(1), rampes: nw.filter(q => q.type === 'ramp').length, murs: nw.filter(q => q.type === 'wall').length, mursDansLeVide: nw.filter(q => q.type === 'wall' && !window.__tient(q)).length }; }, order)); }

  await fresh();
  res.effondrement = await page.evaluate(() => { const FR = window.FR, p = FR.player; FR.setCam(0, 0.05); const n0 = FR.pieceList.length;
    window.__step(150, i => { FR.keys.KeyW = true; const ph = i % 10; if (ph === 0) FR.pieceDown('ramp', true); if (ph === 2) FR.pieceUp('ramp'); if (ph === 5) FR.pieceDown('wall', true); if (ph === 7) FR.pieceUp('wall'); });
    FR.keys.KeyW = false; window.__step(60); const tower = FR.pieceList.slice(n0), low = Math.min(...tower.map(q => q.lvl)), bottom = tower.filter(q => q.lvl === low);
    p.pos.x += 20; p.pos.y = FR.terrainH(p.pos.x, p.pos.z) + 0.5; window.__step(30); const n1 = FR.pieceList.length;
    for (const y of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { FR.setCam(y, 0.05); FR.update(1 / 30); FR.pieceDown('wall', true); FR.pieceUp('wall'); FR.update(1 / 30); }
    const house = FR.pieceList.slice(n1); for (const q of bottom) FR.destroyPiece(q); const left = []; window.__step(150, i => { if (i % 30 === 0) left.push(tower.filter(q => q.alive).length); });
    return { tour: tower.length, detruitesEnBas: bottom.length, deboutApres0_1_2_3_4s: left.join(' '), deboutApres5s: tower.filter(q => q.alive).length, maisonVoisine: house.filter(q => q.alive).length + ' / ' + house.length }; });

  await fresh();
  res.sautTolerant = await page.evaluate(() => { const FR = window.FR, p = FR.player, tap = () => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })); };
    FR.setCam(0, 0.05); FR.pieceDown('ramp', true); FR.pieceUp('ramp'); FR.selectSlot(1); window.__step(2);
    let left = -1, a = false; for (let f = 0; f < 120; f++) { FR.keys.KeyW = true; const g = p.grounded; FR.update(1 / 30); if (left < 0 && g && !p.grounded && p.vel.y <= 0.5) left = f; if (left >= 0 && f === left + 2) tap(); if (left >= 0 && f > left + 2 && p.vel.y > 5) { a = true; break; } if (left >= 0 && f > left + 8) break; }
    FR.keys.KeyW = false; window.__step(60);
    p.pos.x += 12; const g0 = FR.terrainH(p.pos.x, p.pos.z); p.pos.y = g0 + 3; p.vel.set(0, 0, 0); p.grounded = false; let pressed = false, b = false;
    for (let f = 0; f < 60; f++) { const t = p.vel.y < 0 ? (p.pos.y - g0) / Math.max(1, -p.vel.y) : 9; if (!pressed && p.vel.y < 0 && t < 0.11) { tap(); pressed = true; } FR.update(1 / 30); if (pressed && p.vel.y > 5) { b = true; break; } if (pressed && p.grounded && f > 40) break; }
    return { appuiApresLeBord: left < 0 ? 'bord non quitté' : a ? 'saute' : 'ne saute pas', appuiAvantLeSol: b ? 'saute à la réception' : 'ne saute pas' }; });

  res.pieceDansLeVide = await page.evaluate(() => { const FR = window.FR, p = FR.player; p.pos.x += 30; const g = FR.terrainH(p.pos.x, p.pos.z); p.pos.y = g + 14; p.vel.set(0, 0, 0); p.grounded = false; FR.setCam(0, 0.05);
    const n0 = FR.pieceList.length; FR.update(1 / 30); FR.pieceDown('wall', true); FR.pieceUp('wall'); FR.update(1 / 30); const placed = FR.pieceList.length - n0; window.__step(60);
    return { enPleinAirA14m: placed ? 'posée (anormal)' : 'refusée', message: document.getElementById('msg').textContent }; });

  for (const k in res) console.log(k.padEnd(18), JSON.stringify(res[k]));
  console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
