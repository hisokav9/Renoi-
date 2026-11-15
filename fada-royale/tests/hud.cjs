const { chromium, devices } = require('playwright'); const path=require('path'); const [,, base, out] = process.argv;
(async () => { const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const shots=[]; const errs=[];
  for (const [name,opt,url] of [['pc',{ viewport:{width:1280,height:720} },'?touch=0'],['mobile',{ ...devices['Pixel 7 landscape'] },'?touch=1']]) {
    const ctx=await browser.newContext({...opt}); await ctx.addInitScript(() => { localStorage.setItem('fr_q','medium'); localStorage.setItem('fr_skin','boss'); });
    const page=await ctx.newPage(); page.on('pageerror', e => errs.push(name+': '+e.message)); await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
    await page.goto(base+url); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 120000 });
    const info=await page.evaluate(() => { const FR=window.FR; FR.startMatch('br'); window.__freeze=true; for(let i=0;i<10;i++) FR.update(1/30); FR.jumpFromBus(); let k=0; while(FR.player.phase!=='ground'&&k<4000){ FR.update(1/30); k++; }
      const p=FR.player; for(let i=0;i<60;i++) FR.update(1/30); return p.phase; });
    await page.evaluate(() => { const FR=window.FR, p=FR.player; p.slots=['fusil','pompe','sniper','mitraillette','mitrailleuse']; p.mag.fusil=6; p.mag.pompe=5; p.mag.sniper=5; p.mag.mitraillette=30; p.mag.mitrailleuse=80; p.ammo=120; p.kilishi=2; p.the=1; p.banco=140; p.shield=45; p.hp=72; p.sel=0; p.cur='daba'; FR.selectSlot(1); for(let i=0;i<40;i++) FR.update(1/30); FR.update(1/120); });
    await page.screenshot({ path: path.join(out,'hud-'+name+'.png'), timeout:120000 }); shots.push(name);
    await ctx.close(); }
  console.log(shots.join(','), errs.join('\n')||'aucune erreur'); await browser.close(); })();
