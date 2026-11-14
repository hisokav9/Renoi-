const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => { const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const page = await browser.newPage(); const errs=[]; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
  await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 90000 });
  console.log(await page.evaluate(() => { const FR=window.FR, T=FR.THREE;
    function rayBox(o,d,s){ let tmin=0,tmax=1e9,t1,t2,t;
      if(Math.abs(d.x)<1e-9){ if(o.x<s.minX||o.x>s.maxX) return -1; } else { t1=(s.minX-o.x)/d.x; t2=(s.maxX-o.x)/d.x; if(t1>t2){t=t1;t1=t2;t2=t;} if(t1>tmin)tmin=t1; if(t2<tmax)tmax=t2; if(tmin>tmax) return -1; }
      if(Math.abs(d.y)<1e-9){ if(o.y<s.minY||o.y>s.maxY) return -1; } else { t1=(s.minY-o.y)/d.y; t2=(s.maxY-o.y)/d.y; if(t1>t2){t=t1;t1=t2;t2=t;} if(t1>tmin)tmin=t1; if(t2<tmax)tmax=t2; if(tmin>tmax) return -1; }
      if(Math.abs(d.z)<1e-9){ if(o.z<s.minZ||o.z>s.maxZ) return -1; } else { t1=(s.minZ-o.z)/d.z; t2=(s.maxZ-o.z)/d.z; if(t1>t2){t=t1;t1=t2;t2=t;} if(t1>tmin)tmin=t1; if(t2<tmax)tmax=t2; if(tmin>tmax) return -1; }
      return tmin; }
    let diff=0, hits=0; const o=new T.Vector3(), d=new T.Vector3(); let tNew=0, tOld=0;
    for(let k=0;k<3000;k++){ // rayons depuis des points proches des villes (beaucoup de murs), toutes directions
      const ci=FR.solids[Math.floor(Math.random()*FR.solids.length)]; o.set(ci.minX+Math.random()*30-15, 0.5+Math.random()*12, ci.minZ+Math.random()*30-15);
      d.set(Math.random()*2-1, (Math.random()*2-1)*0.4, Math.random()*2-1); if(k%50===0) d.set(0,-1,0); if(k%77===0) d.set(1,0,0); d.normalize(); const maxT=k%3?60:300;
      let a=performance.now(); let bt=maxT, bs=null; for(const s of FR.solids){ const t=rayBox(o,d,s); if(t>=0&&t<bt){ bt=t; bs=s; } } tOld+=performance.now()-a;
      a=performance.now(); const h=FR.rayCast(o,d,maxT,null,true); tNew+=performance.now()-a;
      // comparaison avec rayCast sans le terrain : on compare la boîte touchée quand aucun terrain n'est devant
      const newT=(h.type==='solid'||h.type==='piece')?h.t:null; if(bs){ hits++; if(newT===null){ if(h.type!=='terrain'||h.t>bt+1e-6) diff++; } else if(Math.abs(newT-bt)>1e-6) diff++; } else if(newT!==null) diff++; }
    return `collisions: ${FR.solids.length} · rayons: 3000 · rayons qui touchent une boîte: ${hits} · différences: ${diff} · temps ancien: ${tOld.toFixed(1)} ms · temps grille (rayCast complet, terrain inclus): ${tNew.toFixed(1)} ms`; }));
  console.log(errs.join('\n')); await browser.close(); })();
