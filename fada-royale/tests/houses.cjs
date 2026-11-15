const { chromium } = require('playwright'); const path=require('path'); const [,, base, out] = process.argv;
(async () => { const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 900, height: 560 } }); await ctx.addInitScript(() => { localStorage.setItem('fr_q','medium'); localStorage.setItem('fr_skin','boss'); });
  const page = await ctx.newPage(); const errs=[]; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
  await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 90000 });
  await page.evaluate(() => { const FR=window.FR; FR.startMatch('train'); window.__freeze=true; for(let i=0;i<20;i++) FR.update(1/30);
    window.__go=(x,z,yaw)=>{ const p=FR.player; p.pos.set(x,FR.terrainH(x,z)+3,z); p.vel.set(0,0,0); p.climb=null; p.mantle=null; for(let i=0;i<40;i++) FR.update(1/60); p.yaw=yaw; FR.setCam(yaw,-0.12); for(let i=0;i<5;i++) FR.update(1/60); };
    window.__walk=(dx,dz,t,jumpAt)=>{ const FR=window.FR, p=FR.player; FR.setCam(Math.atan2(-dx,-dz),-0.12); FR.keys.KeyW=true; const n=Math.round(t*60); let maxY=-1e9;
      for(let i=0;i<n;i++){ if(jumpAt!==undefined&&i===Math.round(jumpAt*60)) FR.keys.Space=true; FR.update(1/60); FR.keys.Space=false; maxY=Math.max(maxY,p.pos.y); } FR.keys.KeyW=false; for(let i=0;i<10;i++) FR.update(1/60); return maxY; };
    window.__inside=(h,x,z)=>x>h.minX&&x<h.maxX&&z>h.minZ&&z<h.maxZ; });
  const shot=async n=>{ await page.evaluate(()=>window.FR.update(1/120)); await page.screenshot({path:path.join(out,n+'.png')}); };
  const res=[];
  // 1) entrer par la porte d'une maison basse
  const r1=await page.evaluate(() => { const FR=window.FR, p=FR.player; const hs=FR.housesInfo.filter(h=>h.door&&!h.f2); const h=hs[3]; const D=h.door;
    const dx=D.ix-D.ox, dz=D.iz-D.oz, l=Math.hypot(dx,dz); __go(D.ox-dx/l*2,D.oz-dz/l*2,Math.atan2(-dx,-dz)); const y0=p.pos.y;
    const dObj=h.doorObj, fermeeAuDebut=!dObj.open; __walk(dx/l,dz/l,1.3); const bloque=!__inside(h,p.pos.x,p.pos.z);
    FR.interact(); for(let i=0;i<30;i++) FR.update(1/60); const ouverte=dObj.open;
    __walk(dx/l,dz/l,1.3); const dedans=__inside(h,p.pos.x,p.pos.z);
    return {porteFermeeAuDebut:fermeeAuDebut, porteFermeeBloque:bloque, ouverteAvecE:ouverte, inside:dedans, y:+p.pos.y.toFixed(2), fl:+h.fl.toFixed(2), style:h.style}; });
  res.push('1. entrer par la porte : '+JSON.stringify(r1)); await shot('1-dedans');
  // 2) monter à l'étage d'une maison haute
  const r2=await page.evaluate(() => { const FR=window.FR, p=FR.player; const h=FR.housesInfo.find(h=>h.stair); if(!h) return 'aucune maison à étage'; const D=h.door, S=h.stair;
    FR.setDoor(h.doorObj,true); for(let i=0;i<30;i++) FR.update(1/60);
    const dx=D.ix-D.ox, dz=D.iz-D.oz, l=Math.hypot(dx,dz); __go(D.ox,D.oz,Math.atan2(-dx,-dz)); __walk(dx/l,dz/l,0.7);
    const go=(tx,tz,t)=>{ const ex=tx-p.pos.x, ez=tz-p.pos.z, el=Math.hypot(ex,ez)||1; return __walk(ex/el,ez/el,Math.min(t,el/6.3+0.05)); };
    go(S.x0,S.z0,2); const yb=p.pos.y; go(S.x1,S.z1,2); const yt=p.pos.y; go(S.x2,S.z2,1);
    return {fl:+h.fl.toFixed(2),f2:+h.f2.toFixed(2),pied:+yb.toFixed(2),hautEscalier:+yt.toFixed(2),etage:+p.pos.y.toFixed(2),dedans:__inside(h,p.pos.x,p.pos.z)}; });
  res.push('2. escalier intérieur : '+JSON.stringify(r2)); await shot('2-etage');
  // 3) escalader le mur du fond d'une maison basse
  const r3=await page.evaluate(() => { const FR=window.FR, p=FR.player; const h=FR.housesInfo.filter(h=>h.door&&!h.f2)[5]; const D=h.door;
    const cx=(h.minX+h.maxX)/2, cz=(h.minZ+h.maxZ)/2; let dx=cx-D.ix, dz=cz-D.iz; const l=Math.hypot(dx,dz); dx/=l; dz/=l; // vers le fond
    const ax=Math.abs(dx)>Math.abs(dz)?Math.sign(dx):0, az=ax?0:Math.sign(dz); const fx=ax>0?h.maxX:ax<0?h.minX:cx, fz=az>0?h.maxZ:az<0?h.minZ:cz;
    __go(fx+ax*0.62,fz+az*0.62,Math.atan2(ax,az)); const y0=p.pos.y; FR.setCam(Math.atan2(ax,az),-0.1);
    FR.keys.KeyW=true; FR.keys.Space=true; FR.update(1/60); FR.keys.Space=false; const started=!!p.climb; const log=[];
    let t=0; for(;t<8&&(p.climb||p.mantle||t<0.2);t+=1/60){ FR.update(1/60); if(Math.abs(t-0.8)<0.009) window.__mid=1; }
    FR.keys.KeyW=false; for(let i=0;i<90;i++) FR.update(1/60);
    return {grimpe:started, sol:+y0.toFixed(2), toit:+h.top.toFixed(2), final:+p.pos.y.toFixed(2), resteAuSol:Math.abs(p.pos.y-y0)<0.3}; });
  res.push('3. mur de maison trop haut (v1.3 : pas de grimpe) : '+JSON.stringify(r3));
  // 3c) saisir le bord en sautant : rebord entre 2,5 et 3,4 m au-dessus du sol, avec de la place dessus
  const r3c=await page.evaluate(() => { const FR=window.FR, p=FR.player; let res='aucun rebord de cette hauteur trouvé';
    for(const s of FR.solids){ const w=s.maxX-s.minX, d=s.maxZ-s.minZ; if(w<1.6||d<0.6||s.piece) continue; const cx=(s.minX+s.maxX)/2, z=s.minZ-0.6, g=FR.terrainH(cx,z), rise=s.maxY-g;
      if(rise<2.5||rise>3.4) continue; __go(cx,z,Math.PI); const y0=p.pos.y; if(Math.abs(y0-g)>0.3) continue;
      FR.setCam(Math.PI,-0.1); FR.keys.KeyW=true; FR.keys.Space=true; FR.update(1/60); FR.keys.Space=false; let m=false; for(let i=0;i<60;i++){ FR.update(1/60); if(p.mantle) m=true; } FR.keys.KeyW=false; for(let i=0;i<10;i++) FR.update(1/60);
      res={hauteurRebord:+rise.toFixed(2), saisiEnSautant:m, final:+(p.pos.y-y0).toFixed(2)+' m au-dessus du sol'}; if(m) break; }
    return res; });
  res.push('3c. saisir le bord en sautant : '+JSON.stringify(r3c));
  // 3d) la caméra tourne, le perso immobile tourne avec
  const r3d=await page.evaluate(() => { const FR=window.FR, p=FR.player; __go(40,-20,0); FR.setCam(1.6,-0.1); for(let i=0;i<60;i++) FR.update(1/60);
    let d=p.yaw-1.6; d=Math.atan2(Math.sin(d),Math.cos(d)); return {ecartApres1s:+(d*180/Math.PI).toFixed(1)+'°'}; });
  res.push('3d. caméra tournée de 92° à l\'arrêt : '+JSON.stringify(r3d));
  // 3b) captures pendant l'escalade et le rétablissement
  await page.evaluate(() => { const FR=window.FR, p=FR.player; const h=FR.housesInfo.filter(h=>h.door&&!h.f2)[5]; const D=h.door;
    const cx=(h.minX+h.maxX)/2, cz=(h.minZ+h.maxZ)/2; let dx=cx-D.ix, dz=cz-D.iz; const ax=Math.abs(dx)>Math.abs(dz)?Math.sign(dx):0, az=ax?0:Math.sign(dz); const fx=ax>0?h.maxX:ax<0?h.minX:cx, fz=az>0?h.maxZ:az<0?h.minZ:cz;
    __go(fx+ax*1.2,fz+az*1.2,Math.atan2(ax,az)); FR.setCam(Math.atan2(ax,az)+0.6,-0.05); FR.keys.KeyW=true; FR.keys.Space=true; FR.update(1/60); FR.keys.Space=false; for(let i=0;i<50;i++) FR.update(1/60); });
  await shot('3-mur-haut');
  await page.evaluate(() => { const FR=window.FR, p=FR.player; let k=0; while(p.climb&&k<600){ FR.update(1/60); k++; } for(let i=0;i<8;i++) FR.update(1/60); });
  await shot('4-retablissement'); await page.evaluate(() => { const FR=window.FR; for(let i=0;i<60;i++) FR.update(1/60); FR.keys.KeyW=false; });
  // 4) muret : se hisser dessus
  const r4=await page.evaluate(() => { const FR=window.FR, p=FR.player; const w=FR.solids.find(s=>s.harvest&&!s.piece&&Math.abs(s.maxY-s.minY-1.25)<0.01&&(s.maxX-s.minX)>3);
    const cx=(w.minX+w.maxX)/2, cz=w.minZ-0.6; __go(cx,cz,Math.atan2(0,1)); const y0=p.pos.y; FR.setCam(Math.PI,-0.1);
    FR.keys.KeyW=true; FR.keys.Space=true; FR.update(1/60); FR.keys.Space=false; const st=!!p.mantle; for(let i=0;i<50;i++) FR.update(1/60); FR.keys.KeyW=false; for(let i=0;i<10;i++) FR.update(1/60);
    return {franchissement:st, sol:+y0.toFixed(2), hautMuret:+w.maxY.toFixed(2), final:+p.pos.y.toFixed(2)}; });
  res.push('4. muret : '+JSON.stringify(r4));
  const r5=await page.evaluate(() => { const FR=window.FR; const b=FR.bots.find(b=>b.alive); if(!b) return 'pas de bot'; const hs=FR.housesInfo.filter(h=>h.door&&!h.f2); const out=[];
    for(const h of hs.slice(8,20)){ const D=h.door; // bot placé de l'autre côté de la maison, cible au centre de la pièce
      const cx=(h.minX+h.maxX)/2, cz=(h.minZ+h.maxZ)/2, bx=cx+(cx-D.ox)*1.0, bz=cz+(cz-D.oz)*1.0; b.dummy=false; b.pos.set(bx,FR.terrainH(bx,bz)+2,bz); b.vel.set(0,0,0); b.target=null; b.phase='ground';
      const [ix,iz]=h.rnd(0); b.moveTarget=new FR.THREE.Vector3(ix,0,iz); b.thinkT=99; b.detourT=0; b.navS=0; let t=0, inside=false;
      for(;t<14;t+=1/30){ b.thinkT=99; FR.update(1/30); if(Math.hypot(b.pos.x-ix,b.pos.z-iz)<1.6&&b.pos.x>h.minX&&b.pos.x<h.maxX&&b.pos.z>h.minZ&&b.pos.z<h.maxZ){ inside=true; break; } }
      out.push(inside?('entré en '+t.toFixed(1)+' s'):'échec'); }
    return out.join(', '); });
  res.push('5. bot qui va chercher du butin dans une maison (départ derrière la maison) : '+r5);
  // vue d'une rue
  await page.evaluate(() => { const FR=window.FR, p=FR.player; const h=FR.housesInfo.filter(h=>h.door&&h.style==='banco')[2]; const D=h.door; const dx=D.ix-D.ox, dz=D.iz-D.oz, l=Math.hypot(dx,dz);
    __go(D.ox-dx/l*5+dz/l*2.5,D.oz-dz/l*5-dx/l*2.5,Math.atan2(-dx,-dz)); FR.setCam(Math.atan2(-dx,-dz)+0.35,-0.02); for(let i=0;i<10;i++) FR.update(1/60); });
  await shot('5-rue');
  console.log(res.join('\n')); console.log(errs.join('\n')||'aucune erreur'); await browser.close(); })();
