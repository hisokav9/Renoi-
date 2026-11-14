const { chromium } = require('playwright'); const [,, base, w='1366', h='768'] = process.argv;
(async () => { const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: +w, height: +h } }); await ctx.addInitScript(() => { localStorage.setItem('fr_q','high');
    // mesure de la durée de chaque image de la vraie boucle
    const raf=window.requestAnimationFrame.bind(window); window.__frames=[]; window.requestAnimationFrame=cb=>raf(t=>{ const a=performance.now(); cb(t); window.__frames.push(Math.round(performance.now()-a)); if(window.__frames.length>40) window.__frames.shift(); }); });
  const page = await ctx.newPage(); page.on('pageerror', e => console.log('[pageerror]', e.message)); await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
  await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 90000 });
  await page.waitForTimeout(1500); console.log('lobby, images (ms):', (await page.evaluate(() => window.__frames.slice(-8))).join(' '));
  await page.click('#play'); await page.click('#lbMGo');
  for (let k=0;k<6;k++){ await page.waitForTimeout(2500); const t0=Date.now(); const r = await Promise.race([page.evaluate(() => ({ st: window.FR.state, f: window.__frames.slice(-6), calls: window.FR.renderer.info.render.calls, tri: window.FR.renderer.info.render.triangles })), new Promise(res => setTimeout(() => res('PAS DE RÉPONSE'), 8000))]); console.log('t+'+(k+1)*2.5+'s', Date.now()-t0+'ms', JSON.stringify(r)); }
  await browser.close(); })();
