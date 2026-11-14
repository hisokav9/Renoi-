// Simulation accélérée de parties complètes via l'API de debug window.FR
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [,, base, threeDir, matches='2'] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const logs = [];
  page.on('console', m => { if (m.type()==='error'||m.type()==='warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
  await page.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, async route => {
    const rel = route.request().url().split('three@0.160.0/')[1];
    const f = path.join(threeDir, rel);
    if (fs.existsSync(f)) route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(f) });
    else route.fulfill({ status: 404 });
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => { logs.push('[externe bloqué] '+r.request().url()); r.abort(); });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 60000 });
  for (let m = 0; m < +matches; m++) {
    const res = await page.evaluate(async (godmode) => {
      const FR = window.FR; const out = { errors: [], nan: 0, log: [] };
      FR.startMatch();
      FR.SET.dmgNums = true;
      const p = FR.player;
      let t = 0, step = 1/30, landed = 0, firstKill = null;
      const t0 = performance.now();
      for (let i = 0; i < 30*360; i++) { // 6 minutes de jeu
        if (godmode) { p.hp = 100; }
        try { FR.update(step); } catch (e) { out.errors.push((e && e.stack || String(e)).split('\n').slice(0,3).join(' | ')); if (out.errors.length > 5) break; }
        t += step;
        for (const c of FR.chars) { if (!isFinite(c.pos.x) || !isFinite(c.pos.y) || !isFinite(c.pos.z)) out.nan++; }
        if (i % (30*30) === 0) out.log.push(`t=${t.toFixed(0)}s vivants=${FR.aliveCount} storm=${FR.storm.state}/${FR.storm.phase} r=${FR.storm.r.toFixed(0)} pieces=${FR.pieces.size} items=${FR.items.length} player=${p.alive?p.phase:'mort'}`);
        if (FR.aliveCount <= 1) break;
      }
      out.wall = ((performance.now() - t0)/1000).toFixed(1) + 's réels';
      out.end = { t: t.toFixed(0), alive: FR.aliveCount, playerAlive: p.alive, kills: p.kills, rank: p.rank };
      const byPhase = {}; for (const b of FR.bots) { const k = b.alive ? b.phase : 'mort'; byPhase[k] = (byPhase[k]||0)+1; }
      out.bots = byPhase;
      out.killsByStorm = FR.bots.filter(b => !b.alive && !b.killer).length;
      out.solids = FR.solids.length;
      return out;
    }, m === 0);
    console.log(JSON.stringify(res, null, 1));
  }
  console.log(logs.slice(0, 30).join('\n'));
  await browser.close();
})();
