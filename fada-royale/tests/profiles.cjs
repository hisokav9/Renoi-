const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => { const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await ctx.addInitScript(() => localStorage.setItem('fr_q','high'));
  const page = await ctx.newPage(); await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
  await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 90000 });
  await page.evaluate(() => { const FR=window.FR; FR.startMatch('br'); FR.jumpFromBus(); const p=FR.player; p.pos.set(-20,40,-90); for(let i=0;i<300&&p.phase!=='ground';i++) FR.update(1/30);
    // 10 bots autour du joueur (cas d'un combat en ville)
    FR.bots.slice(0,10).forEach((b,i)=>{ b.phase='ground'; b.model.g.visible=true; const a=i/10*6.28, d=[8,15,25,35,45,55,65,80,95,110][i]; b.pos.set(p.pos.x+Math.cos(a)*d,p.pos.y+2,p.pos.z+Math.sin(a)*d); }); for(let i=0;i<30;i++) FR.update(1/30); });
  for (const q of ['low','medium','high']) {
    const r = await page.evaluate(q => { const FR=window.FR; FR.openSettings(); FR.renderTab('gfx'); document.querySelector(`.seg button[data-q="${q}"]`).click(); FR.closeSettings();
      for(let i=0;i<6;i++) FR.update(1/30); const R=FR.renderer; R.info.autoReset=false; R.info.reset(); R.render(FR.scene,FR.camera); const i=R.info.render; R.info.autoReset=true;
      let vis=0; FR.scene.traverse(o=>{ if(!o.isMesh) return; let v=true, q2=o; while(q2){ if(!q2.visible){ v=false; break; } q2=q2.parent; } if(v) vis++; });
      return `${q}: ${i.calls} appels de dessin (ombres comprises), ${Math.round(i.triangles/1000)}k triangles, ${vis} objets visibles, ombres ${R.shadowMap.enabled}, distance de vue ${FR.SET.viewDist} m`; }, q);
    console.log(r); }
  await browser.close(); })();
