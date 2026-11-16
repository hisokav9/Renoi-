// v2.0 : parties complètes de Battle Royale entre bots (le joueur regarde : FR.spectate), pour mesurer l'IA et la durée
// Mesures par partie : durée, morts (tempête / bots), bots morts sans arme, durée de vie, tirs et précision des bots, distance des combats,
// soins, constructions, abris, et le temps de calcul d'une image de jeu (logique + animation des persos, sans le rendu).
// Usage : node tests/partie.cjs http://127.0.0.1:8000/index.html [parties=2] [bots=défaut] [niveau=défaut]
const { chromium } = require('playwright'); const [,, base, nm = '2', nb = '', lvl = ''] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } }); await ctx.addInitScript(() => localStorage.setItem('fr_q', 'low'));
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1') && !u.toString().startsWith('http://localhost'), r => r.abort());
  await page.goto(base + '?touch=0'); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
  const all = [];
  for (let m = 0; m < +nm; m++) {
    const r = await page.evaluate(([nb, lvl]) => { const FR = window.FR; window.__freeze = true;
      if (nb && 'botCount' in FR.SET) FR.SET.botCount = +nb; if (lvl && 'botLevel' in FR.SET) FR.SET.botLevel = lvl;
      FR.startMatch('br'); FR.spectate(); const step = 1 / 30; let t = 0; const cost = { vol: [0, 0], sol: [0, 0] }, log = [], nan = [0];
      const active = FR.bots.filter(b => b.alive).length;
      for (let i = 0; i < 30 * 60 * 26; i++) { const t0 = performance.now(); FR.update(step); const dtm = performance.now() - t0; t += step;
        const onGround = FR.bots.filter(b => b.alive && b.phase === 'ground').length; const k = onGround > active * 0.8 ? 'sol' : t < 60 ? 'vol' : null; if (k) { cost[k][0] += dtm; cost[k][1]++; }
        if (i % 30 === 0) for (const c of FR.chars) if (!isFinite(c.pos.x) || !isFinite(c.pos.z)) nan[0]++;
        if (i % (30 * 120) === 0) log.push(`${Math.round(t)}s:${FR.aliveCount}/${FR.storm.phase}/${Math.round(FR.storm.r)}m`);
        if (FR.aliveCount <= 1) break; }
      const dead = FR.bots.filter(b => b.diedAt !== undefined && !b.alive && b.inMatch !== false), life = dead.map(b => b.diedAt).sort((a, b) => a - b), S = FR.BSTAT;
      return { bots: active, niveau: FR.SET.botLevel || '—', duree: Math.round(t), restants: FR.aliveCount, mortsTempete: dead.filter(b => !b.killer).length, mortsParBots: dead.filter(b => b.killer).length,
        mortsSansArme: dead.filter(b => !b.diedArmed).length, vieMediane: Math.round(life[Math.floor(life.length / 2)] || 0), tirs: S.shots, precision: +(S.hits / Math.max(1, S.shots) * 100).toFixed(1),
        distanceCombat: Math.round(S.engD / Math.max(1, S.shots)), soins: S.heals, constructions: S.builds, abris: S.cover, rotations: S.rotations,
        msParImageVol: +(cost.vol[0] / Math.max(1, cost.vol[1])).toFixed(2), msParImageAuSol: +(cost.sol[0] / Math.max(1, cost.sol[1])).toFixed(2), nan: nan[0], deroule: log.join(' ') }; }, [nb, lvl]);
    all.push(r); console.log(JSON.stringify(r)); }
  const avg = k => +(all.reduce((a, r) => a + r[k], 0) / all.length).toFixed(1);
  console.log('MOYENNE', JSON.stringify(Object.fromEntries(['bots', 'duree', 'mortsTempete', 'mortsParBots', 'mortsSansArme', 'vieMediane', 'precision', 'distanceCombat', 'soins', 'constructions', 'abris', 'rotations', 'msParImageVol', 'msParImageAuSol'].map(k => [k, avg(k)]))));
  console.log(errs.join('\n') || 'aucune erreur'); await browser.close(); })();
