const { chromium } = require('playwright'); const [,, base] = process.argv;
(async () => { const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const page = await browser.newPage(); const errs=[]; page.on('pageerror', e => errs.push(e.message)); await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
  await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 90000 });
  console.log(await page.evaluate(() => { const FR=window.FR; FR.startMatch('train'); window.__freeze=true; for(let i=0;i<10;i++) FR.update(1/30);
    const hs=FR.housesInfo.filter(h=>h.door); let minIn=99, maxRise=0, maxStep=0, n2=0, bad=[];
    for(const h of hs){ const inH=h.top-0.3-h.fl; minIn=Math.min(minIn,inH); if(h.f2) n2++;
      const D=h.door, rise=h.fl-FR.terrainH(D.ox,D.oz); maxRise=Math.max(maxRise,rise);
      // marches : on cherche les solides devant la porte et on mesure le plus grand écart de hauteur entre deux marches
      const st=FR.solids.filter(s=>D.ox>s.minX-0.2&&D.ox<s.maxX+0.2&&D.oz>s.minZ-3&&D.oz<s.maxZ+3&&!s.climb&&s.maxY<=h.fl+0.01&&s.maxY>h.fl-4).map(s=>s.maxY).sort((a,b)=>a-b);
      let prev=FR.terrainH(D.ox,D.oz); for(const y of st){ if(y>prev){ maxStep=Math.max(maxStep,y-prev); prev=y; } }
      if(inH<2.4) bad.push(h); }
    return `maisons ouvertes : ${hs.length} (dont ${n2} à étage) ; hauteur sous plafond min ${minIn.toFixed(2)} m ; dénivelé max devant une porte ${maxRise.toFixed(2)} m ; plus grande marche ${maxStep.toFixed(2)} m (limite 0,6) ; trop basses : ${bad.length} ; solides : ${FR.solids.length}`; }));
  console.log(errs.join('\n')); await browser.close(); })();
