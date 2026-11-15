const { chromium } = require('playwright'); const path=require('path'); const [,, base, outDir, skin='boss'] = process.argv;
(async () => { const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 900, height: 600 } }); await ctx.addInitScript(s => { localStorage.setItem('fr_q','medium'); localStorage.setItem('fr_skin',s); }, skin);
  const page = await ctx.newPage(); const errs=[]; page.on('pageerror', e => errs.push(e.message)); await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
  await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 90000 });
  await page.evaluate(() => { const FR=window.FR; FR.startMatch('train'); window.__freeze=true; const p=FR.player; p.slots=['revolver','fusil','pompe','sniper','mitrailleuse']; p.sel=0; p.cur='daba'; p.ammo=300; for(const w of ['revolver','fusil','pompe','sniper','mitrailleuse','mitraillette']) p.mag[w]=1; for(let i=0;i<30;i++) FR.update(1/30); FR.setCam(0,-0.05); for(let i=0;i<10;i++) FR.update(1/30);
    window.__shot=()=>{ const p=FR.player, s=Math.sin(p.yaw), c=Math.cos(p.yaw); // caméra devant-gauche du perso, à hauteur de poitrine
      const dx=-1.3, dz=-1.9; window.__camOv={p:[p.pos.x+dx*c+dz*s,p.pos.y+1.55,p.pos.z-dx*s+dz*c],t:[p.pos.x,p.pos.y+1.3,p.pos.z]}; FR.update(1/120); }; });
  const run = async (name, setup, dur, fracs) => { await page.evaluate(setup); let t=0; const files=[]; for (const f of fracs) { await page.evaluate(([dt]) => { const FR=window.FR; const n=Math.round(dt*60); for(let i=0;i<n;i++) FR.update(1/60); window.__shot(); }, [f*dur-t]); t=f*dur; const fn=path.join(outDir,`${skin}-${name}-${Math.round(f*100)}.png`); await page.screenshot({ path: fn, clip:{x:270,y:60,width:360,height:440} }); files.push(fn); } return files; };
  const sel=i=>`()=>{ const FR=window.FR; FR.setFiring(false); FR.selectSlot(${i}); for(let k=0;k<50;k++) FR.update(1/60); FR.player.mag[FR.player.cur]=1; }`;
  const rel=`()=>{ window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR'})); }`;
  const sheets={};
  for (const [i,w,d] of [[1,'revolver',2.0],[2,'fusil',1.9],[3,'pompe',2.2],[4,'sniper',2.8],[5,'mitrailleuse',4.0]]) {
    await page.evaluate(eval(sel(i))); sheets['recharge-'+w]=await run('recharge-'+w, eval(rel), d, [0.12,0.3,0.5,0.75]); }
  const info = await page.evaluate(() => { const FR=window.FR, p=FR.player; FR.selectSlot(3); for(let k=0;k<50;k++) FR.update(1/60); p.mag.pompe=0; window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR'})); const log=[];
    for(let k=0;k<70;k++){ FR.update(1/60); if(k%14===13) log.push(p.mag.pompe); } FR.setFiring(true); FR.update(1/60); FR.setFiring(false); const after=p.reloadT;
    return 'pompe : cartouches après 0,23/0,47/0,7/0,93/1,17 s → '+log.join(',')+' ; tir pendant le rechargement → rechargement '+(after>0?'continue':'interrompu')+', chargeur '+p.mag.pompe; });
  console.log(info);
  sheets['kilishi']=await run('kilishi', ()=>{ const p=window.FR.player; p.hp=50; p.kilishi=3; window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH'})); }, 2.0, [0.1,0.3,0.45,0.65]);
  sheets['the']=await run('the', ()=>{ const p=window.FR.player; while(p.useT>0) window.FR.update(1/60); p.shield=0; p.the=3; window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyT'})); }, 1.6, [0.1,0.3,0.5,0.7]);
  await page.evaluate(()=>{ for(let k=0;k<60;k++) window.FR.update(1/60); window.FR.selectSlot(2); for(let k=0;k<60;k++) window.FR.update(1/60); });
  sheets['changement-fusil-vers-revolver']=await run('switch', ()=>{ window.FR.selectSlot(1); }, 0.32, [0.2,0.45,0.7,0.95]);
  sheets['tir-sniper-culasse']=await run('bolt', ()=>{ const FR=window.FR; FR.selectSlot(4); for(let k=0;k<60;k++) FR.update(1/60); FR.player.mag.sniper=5; FR.setFiring(true); FR.update(1/60); FR.setFiring(false); }, 0.9, [0.15,0.35,0.5,0.7]);
  require('fs').writeFileSync(path.join(outDir,skin+'-sheets.json'), JSON.stringify(sheets));
  console.log(errs.join('\n')||'aucune erreur'); await browser.close(); })();
