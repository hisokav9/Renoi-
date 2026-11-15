const { chromium, devices } = require('playwright');
const path = require('path'), fs = require('fs');
const [,, base, threeDir, outDir, mode='desktop'] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctxOpts = mode==='mobile' ? { ...devices['iPhone 13 landscape'] } : { viewport: { width: 1280, height: 720 } };
  if (mode==='mobile') delete ctxOpts.defaultBrowserType;
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => { if (m.type()==='error'||m.type()==='warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
  await page.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, async route => {
    const rel = route.request().url().split('three@0.160.0/')[1]; const f = path.join(threeDir, rel);
    if (fs.existsSync(f)) route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(f) }); else route.fulfill({ status: 404 }); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => { logs.push('[externe bloqué] '+r.request().url()); r.abort(); });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 60000 });
  await page.screenshot({ path: path.join(outDir, mode+'-menu.png') });
  const step = (n) => page.evaluate(n => { for (let i=0;i<n;i++) window.FR.update(1/30); }, n);
  await page.evaluate(() => window.FR.startMatch());
  await step(10);
  await page.screenshot({ path: path.join(outDir, mode+'-bus.png') });
  // sauter et atterrir près d'une ville
  const r = await page.evaluate(async () => { const FR=window.FR; FR.jumpFromBus(); const p=FR.player;
    // téléporter au-dessus d'Agadez pour tester
    p.pos.set(-10, 60, -80); for (let i=0;i<30*25 && p.phase!=='ground';i++) FR.update(1/30);
    return { phase:p.phase, y:p.pos.y.toFixed(2), state:FR.state }; });
  console.log('atterrissage', JSON.stringify(r));
  await step(20);
  await page.screenshot({ path: path.join(outDir, mode+'-ground.png') });
  const res = await page.evaluate(() => { const FR=window.FR, p=FR.player, out={};
    const run=(n)=>{ for(let i=0;i<n;i++) FR.update(1/30); };
    // tir
    p.mag.revolver=6; FR.setFiring(true); run(20); FR.setFiring(false); out.magAfterShots=p.mag.revolver; run(80); out.magAfterReload=p.mag.revolver+' ammo='+p.ammo;
    // armes
    FR.giveWeapon(p,'sniper'); FR.giveWeapon(p,'pompe'); FR.selectSlot(2); out.cur=p.cur; FR.setAds(true); run(10); out.scoped=!document.getElementById('scope').classList.contains('hidden'); FR.setAds(false); run(5);
    // construction : mur devant, rampe, sol, toit
    FR.toggleBuild(true); const before=FR.pieces.size; const b0=p.banco; const yaw0=FR.camYaw;
    for (const t of ['wall','ramp','floor','cone']) { FR.setBuildType(t); FR.setFiring(true); run(4); FR.setFiring(false); run(3); FR.setCam(FR.camYaw+1.5708, -0.1); }
    out.built=(FR.pieces.size-before)+' pièces, banco '+b0+'→'+p.banco;
    FR.toggleBuild(false); run(60);
    // édition d'un mur : on revient face au premier mur (v1.4 : face à une rampe, le mur irait au bout de la rampe, hors de portée d'édition)
    FR.setCam(yaw0,-0.05); FR.toggleBuild(true); FR.setBuildType('wall'); FR.setFiring(true); run(3); FR.setFiring(false); run(60); FR.toggleBuild(false);
    FR.startEdit(); out.editing=!!FR.editing; if(FR.editing){ FR.editing.sel[4]=true; FR.editing.sel[7]=true; FR.confirmEdit(); }
    out.afterEdit=!!FR.editing;
    run(30);
    // soins
    p.hp=50; p.kilishi=2; window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH'})); run(70); out.hpAfterKilishi=p.hp;
    // paramètres
    FR.openSettings(); out.paused=FR.paused; FR.renderTab('gfx'); FR.renderTab('hud'); FR.closeSettings(); out.pausedAfter=FR.paused;
    return out; });
  console.log('flux', JSON.stringify(res));
  await page.evaluate(() => { for(let i=0;i<10;i++) window.FR.update(1/30); });
  await page.screenshot({ path: path.join(outDir, mode+'-built.png') });
  // mort du joueur → écran de fin → rejouer → menu
  const endRes = await page.evaluate(() => { const FR=window.FR, p=FR.player; p.shield=0; p.hp=1; FR.storm.cx=999; FR.storm.cz=999; FR.storm.r=1; for(let i=0;i<30*4;i++) FR.update(1/30);
    return { alive:p.alive, endVisible:!document.getElementById('end').classList.contains('hidden'), title:document.getElementById('eTitle').textContent, sub:document.getElementById('eSub').textContent }; });
  console.log('fin', JSON.stringify(endRes));
  await page.screenshot({ path: path.join(outDir, mode+'-end.png') });
  await page.click('#again'); await page.evaluate(() => { for(let i=0;i<5;i++) window.FR.update(1/30); });
  console.log('rejouer', await page.evaluate(() => JSON.stringify({ state: window.FR.state, alive: window.FR.aliveCount, pieces: window.FR.pieces.size })));
  await page.evaluate(() => { const FR=window.FR; for(let i=0;i<30*30;i++) FR.update(1/30); });
  await page.evaluate(() => document.getElementById('sQuit').click());
  console.log('menu', await page.evaluate(() => window.FR.state));
  console.log(logs.slice(0,20).join('\n'));
  await browser.close();
})();
