// Mesure de la stabilité du haut du corps : orientation de la poitrine (Spine2) et des bras par rapport au perso, image par image
const { chromium } = require('playwright'); const path=require('path');
const [,, base, skin, outDir, shots] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.addInitScript(s => { try{ localStorage.setItem('fr_skin', s); localStorage.setItem('fr_q','high'); }catch(e){} }, skin);
  const page = await ctx.newPage(); const errs=[]; page.on('pageerror', e => errs.push(e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
  await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 60000 });
  await page.evaluate(() => { const FR=window.FR; FR.startMatch(); FR.jumpFromBus(); const p=FR.player; p.pos.set(-20,40,-40);
    for(let i=0;i<1200&&p.phase!=='ground';i++) FR.update(1/60); for(let i=0;i<30;i++) FR.update(1/60);
    for(const b of FR.bots){ b.alive=false; b.model.g.visible=false; } FR.storm.timer=9999;
    FR.giveWeapon(p,'fusil'); FR.giveWeapon(p,'sniper'); p.ammo=300;
    const T=FR.THREE, B=p.model.bones;
    window.__meas = { T, B, p, FR };
    // référence : debout, immobile, arme en main
    FR.selectSlot(1); for(let i=0;i<60;i++) FR.update(1/60);
    const fwd=new T.Vector3(-Math.sin(p.yaw),0,-Math.cos(p.yaw)); const q=new T.Quaternion();
    B.Spine2.getWorldQuaternion(q); window.__meas.vChest=fwd.clone().applyQuaternion(q.clone().invert());
    B.Hips.getWorldQuaternion(q); window.__meas.vHips=fwd.clone().applyQuaternion(q.clone().invert());
  });
  const scenarios = {
    'course en ligne droite':        [{ f:120, keys:['KeyW'] }],
    'changements de direction rapides': [{ f:20, keys:['KeyW'] },{ f:20, keys:['KeyD'] },{ f:20, keys:['KeyS'] },{ f:20, keys:['KeyA'] },{ f:20, keys:['KeyW','KeyD'] },{ f:20, keys:['KeyS','KeyA'] },{ f:20, keys:['KeyA'] },{ f:20, keys:['KeyD'] }],
    'sprint':                        [{ f:150, keys:['KeyW','ShiftLeft'] }],
    'course en cercle':              [{ f:240, keys:['KeyW'], yawRate:2.2 }],
    'caméra qui tourne vite':        [{ f:180, keys:['KeyW'], yawRate:9 }],
    'pas chassés (gauche/droite)':   [{ f:90, keys:['KeyA'] },{ f:90, keys:['KeyD'] }],
    'marche arrière':                [{ f:90, keys:['KeyS'] }],
    'course en visant':              [{ f:150, keys:['KeyW','KeyD'], ads:true, yawRate:1.5 }],
    'course en tirant':              [{ f:150, keys:['KeyW','KeyA'], fire:true }],
    'course puis saut':              [{ f:40, keys:['KeyW'] },{ f:60, keys:['KeyW','Space'] },{ f:40, keys:['KeyW'] }],
    'course puis glissade':          [{ f:50, keys:['KeyW','ShiftLeft'] },{ f:1, keys:['KeyW','ShiftLeft'], crouch:true },{ f:90, keys:['KeyW'] }],
    'marche puis arrêt':             [{ f:60, keys:['KeyW'] },{ f:90, keys:[] }],
    'changement d\'arme en courant': [{ f:30, keys:['KeyW'] },{ f:30, keys:['KeyW'], slot:2 },{ f:30, keys:['KeyW'], slot:0 },{ f:30, keys:['KeyW'], slot:3 },{ f:30, keys:['KeyW'], slot:1 }],
    'daba en courant (coups)':       [{ f:30, keys:['KeyW'], slot:0 },{ f:120, keys:['KeyW','KeyD'], fire:true }],
  };
  const results = {};
  for (const [name, phases] of Object.entries(scenarios)) {
    results[name] = await page.evaluate(([phases]) => {
      const { T, B, p, FR } = window.__meas; const q=new T.Quaternion(), v=new T.Vector3(), a=new T.Vector3(), c=new T.Vector3();
      const yawOf=(vec)=>Math.atan2(-vec.x,-vec.z); const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
      FR.setFiring(false); FR.setAds(false); for(const k in FR.keys) FR.keys[k]=false; FR.selectSlot(1); for(let i=0;i<40;i++) FR.update(1/60);
      p.pos.set(-20,p.pos.y,-40); let camYaw=FR.camYaw;
      const r={ chestMin:1e9, chestMax:-1e9, chestStepMax:0, accum:0, hipsAccum:0, armStepMax:0, qNormErr:0, nan:false, frames:0 };
      let prev=null, prevH=null, prevArmL=null, prevArmR=null;
      for (const ph of phases) {
        for(const k in FR.keys) FR.keys[k]=false; for(const k of ph.keys) FR.keys[k]=true;
        if(ph.slot!==undefined) FR.selectSlot(ph.slot); if(ph.crouch) FR.crouchPress();
        FR.setFiring(!!ph.fire); FR.setAds(!!ph.ads);
        for (let i=0;i<ph.f;i++) {
          if(ph.yawRate){ camYaw+=ph.yawRate/60; FR.setCam(camYaw,-0.1); }
          if(p.mag[p.cur]!==undefined&&p.mag[p.cur]<2){ p.mag[p.cur]=30; }
          FR.update(1/60); r.frames++;
          B.Spine2.getWorldQuaternion(q); v.copy(window.__meas.vChest).applyQuaternion(q); v.y=0; const cy=wrap(yawOf(v)-p.yaw);
          B.Hips.getWorldQuaternion(q); a.copy(window.__meas.vHips).applyQuaternion(q); a.y=0; const hy=wrap(yawOf(a)-p.yaw);
          if(prev!==null){ const d=wrap(cy-prev); r.accum+=d; r.chestStepMax=Math.max(r.chestStepMax,Math.abs(d)); r.hipsAccum+=wrap(hy-prevH); }
          prev=cy; prevH=hy; r.chestMin=Math.min(r.chestMin,cy); r.chestMax=Math.max(r.chestMax,cy);
          // bras : direction épaule→coude dans le repère de la poitrine
          B.Spine2.getWorldQuaternion(q); const qi=q.clone().invert();
          for (const [side,key] of [['Left','L'],['Right','R']]) { B[side+'Arm'].getWorldPosition(a); B[side+'ForeArm'].getWorldPosition(c); c.sub(a).normalize().applyQuaternion(qi);
            const pr = key==='L'?prevArmL:prevArmR; if(pr) r.armStepMax=Math.max(r.armStepMax, Math.acos(Math.max(-1,Math.min(1,pr.dot(c))))); if(key==='L') prevArmL=c.clone(); else prevArmR=c.clone(); }
          for(const n in B){ const b=B[n].quaternion; const L=Math.hypot(b.x,b.y,b.z,b.w); if(!isFinite(L)) r.nan=true; r.qNormErr=Math.max(r.qNormErr,Math.abs(L-1)); }
        }
      }
      const deg=x=>Math.round(x*180/Math.PI);
      return { images:r.frames, poitrineMinMax:[deg(r.chestMin),deg(r.chestMax)], sautMaxParImage:deg(r.chestStepMax), rotationCumulee:deg(r.accum), bassinCumule:deg(r.hipsAccum), brasSautMax:deg(r.armStepMax), normeQ:r.qNormErr.toFixed(4), nan:r.nan, vitesseFin:Math.hypot(p.vel.x,p.vel.z).toFixed(1) };
    }, [phases]);
    if (shots==='1' && ['pas chassés (gauche/droite)','course en cercle','course en tirant'].includes(name)) await page.screenshot({ path: path.join(outDir, `${skin}-${name.replace(/[^a-z]+/gi,'_')}.png`) });
  }
  console.log(skin); for (const [k,v] of Object.entries(results)) console.log(k.padEnd(34), JSON.stringify(v));
  if (errs.length) console.log('ERREURS', errs); await browser.close(); })();
