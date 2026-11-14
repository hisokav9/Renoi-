const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => { const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 900, height: 500 } }); await ctx.addInitScript(() => localStorage.setItem('fr_q','medium'));
  const page = await ctx.newPage(); await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
  await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 90000 });
  console.log(await page.evaluate(() => { const FR=window.FR, p=FR.player||null; FR.startMatch('train'); const P=FR.player; for(let i=0;i<20;i++) FR.update(1/30);
    // se placer face à un mur de la salle de prière de la mosquée, à 6 m
    P.pos.set(-11,3,-100); for(let i=0;i<30;i++) FR.update(1/30); FR.setCam(Math.PI,0); FR.selectSlot(1); for(let i=0;i<15;i++) FR.update(1/30);
    const vis=()=>{ let n=0; FR.scene.traverse(o=>{ if(o.isMesh&&o.geometry.type==='CircleGeometry'&&o.visible&&o.geometry.parameters.radius<0.1) n++; }); return n; };
    const before=vis(); let shells=0; P.mag[P.cur]=30; FR.setFiring(true); for(let i=0;i<40;i++) FR.update(1/30); FR.setFiring(false);
    let light=null; FR.scene.traverse(o=>{ if(o.isPointLight&&o.color.getHex()===0xffc070) light=o; });
    return `impacts visibles avant: ${before} · après 40 images de tir: ${vis()} · balles tirées: ${30-P.mag[P.cur]} · lumière du coup de feu présente: ${!!light}, active en Moyenne: ${light&&light.visible}`; }));
  await browser.close(); })();
