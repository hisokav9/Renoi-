const { chromium } = require('playwright'); const [,, base, mode='train'] = process.argv;
(async () => { const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 900, height: 500 } }); await ctx.addInitScript(() => localStorage.setItem('fr_q','low'));
  const page = await ctx.newPage(); await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
  await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 90000 });
  console.log(await page.evaluate((mode) => { const FR=window.FR; FR.startMatch(mode); if(mode==='br'){ FR.jumpFromBus(); const p=FR.player; p.pos.set(5,30,20); for(let i=0;i<900&&p.phase!=='ground';i++) FR.update(1/30); for(const b of FR.bots){ if(b.phase==='bus'){ b.phase='ground'; } b.pos.set(5+Math.random()*80-40,2,20+Math.random()*80-40); } }
    for(let i=0;i<20;i++) FR.update(1/30);
    const cat={}; const add=(k,n)=>cat[k]=(cat[k]||0)+n;
    const tri=g=>g.index?g.index.count/3:g.attributes.position.count/3;
    FR.scene.traverse(o=>{ if(!o.isMesh||!o.visible) return; let v=true; let q=o; while(q){ if(!q.visible){ v=false; break; } q=q.parent; } if(!v) return;
      let k='autre'; if(o.isSkinnedMesh) k='persos (maillages skinnés)'; else if(o.isInstancedMesh) k='instancié: '+(o.geometry.type||'')+' x'+o.count; else if(o.name==='terrain') k='terrain'; else if(o.geometry.attributes.color&&o.parent===FR.scene) k='décor fusionné';
      add(k,o.isInstancedMesh?tri(o.geometry)*o.count:tri(o.geometry)); });
    return Object.entries(cat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k.padEnd(48)+Math.round(v/1000)+'k').join('\n'); }, mode));
  await browser.close(); })();
