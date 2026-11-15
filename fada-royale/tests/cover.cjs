// v1.3 : un bot qui recharge face au joueur va se mettre à couvert (la ligne de tir du joueur doit être coupée)
const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => { const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const page = await browser.newPage(); const errs=[];
  // hasard fixé (même carte, même butin) ; les résultats varient un peu d'un lancement à l'autre, car la boucle du jeu tourne
  // en temps réel pendant le chargement et consomme un nombre variable de tirages avant que le test ne fige la boucle
  await page.addInitScript(() => { let x=12345; Math.random=()=>{ x=(Math.imul(x,1664525)+1013904223)>>>0; return x/4294967296; }; }); page.on('pageerror', e=>errs.push(e.message)); await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
  await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 90000 });
  console.log(await page.evaluate(() => { const FR=window.FR; FR.startMatch('br'); window.__freeze=true; for(let i=0;i<5;i++) FR.update(1/30);
    for(const c of FR.chars) if(c.phase==='bus') FR.jumpFromBus(); FR.jumpFromBus(); const p=FR.player; const out=[]; let ok=0, n=0;
    for(const c of FR.chars){ c.phase='ground'; c.pos.set(0,-50,0); c.vel.set(0,0,0); c.model.glider.visible=false; }
    // murets (1,25 m) : joueur à 14 m devant, bot à 3 m devant le muret côté joueur, tous deux à découvert
    const walls=FR.solids.filter(s=>!s.piece&&!s.door&&Math.abs(s.maxY-s.minY-1.25)<0.01&&Math.max(s.maxX-s.minX,s.maxZ-s.minZ)>=4); let tried=0;
    const used=new Set();
    for(const w of walls){ if(tried>=12) break; const b=FR.bots.find(x=>x.alive&&!used.has(x)); if(!b) break; const cx=(w.minX+w.maxX)/2, cz=(w.minZ+w.maxZ)/2, alongX=(w.maxX-w.minX)>(w.maxZ-w.minZ); let placed=false;
      for(const sg of [-1,1]){ const nx=alongX?0:sg, nz=alongX?sg:0; const px=cx+nx*14, pz=cz+nz*14, bx=cx+nx*3, bz=cz+nz*3;
        p.pos.set(px,FR.terrainH(px,pz)+1,pz); b.pos.set(bx,FR.terrainH(bx,bz)+1,bz); p.vel.set(0,0,0); b.vel.set(0,0,0); b.target=null; b.cover=null;
        for(let i=0;i<10;i++) FR.update(1/30); if(FR.hasLOS(p,b)&&Math.abs(p.pos.y-b.pos.y)<1.5){ placed=true; break; } }
      if(!placed){ b.pos.set(0,-50,0); continue; } tried++; n++; used.add(b);
      b.target=p; b.canSee=true; b.reactT=9; b.reloadT=4; b.reloadDur=4; b.cover=null; b.thinkT=0; b.hp=100;
      // caché = le joueur ne voit plus le torse du bot (hasLOS) ; on mesure aussi la part de la recharge passée caché une fois à l'abri
      let hidT=-1, abri=null, hid=0, after=0; for(let i=0;i<120;i++){ b.reactT=9; FR.update(1/30); if(b.cover) abri=b.cover; const h=!FR.hasLOS(p,b); if(hidT<0&&h) hidT=i/30; if(hidT>=0){ after++; if(h) hid++; } }
      const cache=hidT>=0&&hid/after>=0.6; if(cache) ok++; out.push((hidT>=0?'caché après '+hidT.toFixed(1)+' s, puis caché '+Math.round(100*hid/after)+' % du temps restant':'resté à découvert')+(abri?' (abri '+(abri.low?'bas, accroupi':'haut')+')':' (pas d\'abri trouvé)'));
      b.pos.set(0,-50,0); b.cover=null; b.target=null; }
    return `bots qui rechargent face au joueur : ${ok} / ${tried} se sont mis à couvert et y sont restés (≥ 60 % du temps restant)\n`+out.join('\n'); }));
  console.log(errs.join('\n')||'aucune erreur'); await browser.close(); })();
