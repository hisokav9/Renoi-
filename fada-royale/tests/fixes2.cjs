const { chromium } = require('playwright');
const [,, base] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); const logs=[]; page.on('pageerror', e => logs.push('[pageerror] '+e.message));
  await page.route(u => !u.toString().startsWith('http://127.0.0.1'), r => r.abort());
  await page.goto(base); await page.waitForFunction(() => window.FR && window.FR.state === 'menu', null, { timeout: 60000 });
  const out = await page.evaluate(() => { const FR=window.FR, o={}; const run=n=>{ for(let i=0;i<n;i++) FR.update(1/30); };
    const land=()=>{ FR.startMatch(); FR.jumpFromBus(); const p=FR.player; p.pos.set(60,40,-40); for(let i=0;i<900&&p.phase!=='ground';i++) FR.update(1/30); run(5); FR.storm.timer=999; return p; };
    // 1. pile partielle : 3 kilishi par terre, on en a 4 (max 5)
    let p=land(); const it=FR.items.find(i=>i.alive); it.kind='kilishi'; it.amount=3; it.x=p.pos.x; it.y=p.pos.y; it.z=p.pos.z; it.vx=it.vy=it.vz=0; it.noPick=0; p.kilishi=4; run(3);
    o.pile={ joueur:p.kilishi, resteParTerre: it.alive?it.amount:0 };
    // munitions : 290/300 et une boîte de 30
    const it2=FR.items.find(i=>i.alive&&i!==it); it2.kind='ammo'; it2.amount=30; it2.x=p.pos.x; it2.y=p.pos.y; it2.z=p.pos.z; it2.vx=it2.vy=it2.vz=0; it2.noPick=0; p.ammo=290; run(3);
    o.munitions={ joueur:p.ammo, resteParTerre: it2.alive?it2.amount:0 };
    // 2. mort pendant un kilishi : la tempête finale (10/s) tue pendant qu'on mange
    p=land(); p.hp=12; p.shield=0; p.kilishi=2; window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH'})); run(2); o.mangeAvantMort=p.useT>0;
    FR.storm.phase=4; FR.storm.state='done'; FR.storm.r=0.01; FR.storm.cx=p.pos.x+500; FR.storm.cz=p.pos.z;
    for(let i=0;i<30*5&&p.alive;i++) FR.update(1/30); run(90);
    o.mort={ vivant:p.alive, pv:p.hp, kilishi:p.kilishi };
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH'})); window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR'})); run(90); o.apresToucheH={ pv:p.hp, kilishi:p.kilishi, recharge:p.reloadT };
    // 3. TOP 1 puis tempête : le gagnant n'est plus tué derrière l'écran de victoire
    p=land(); FR.storm.phase=4; FR.storm.state='done'; FR.storm.cx=p.pos.x; FR.storm.cz=p.pos.z; FR.storm.r=6;
    for(const b of FR.bots){ if(b.phase==='bus') b.phase='ground'; b.pos.set(p.pos.x+60,p.pos.y,p.pos.z); b.hp=1; b.shield=0; }
    for(let i=0;i<30*3&&FR.aliveCount>1;i++) FR.update(1/30);
    o.vivantsApresTempete=FR.aliveCount; run(40);
    o.ecranFin=document.getElementById('eTitle').textContent;
    FR.storm.cx=p.pos.x+500; const hp0=p.hp; run(30*15); o.gagnantApres15sDansTempete={ vivant:p.alive, pv:p.hp, pvAvant:hp0 };
    return o; });
  await page.waitForTimeout(1500); out.ecranFinApresDelai=await page.textContent('#eTitle'); console.log(JSON.stringify({ecranFin:out.ecranFinApresDelai, vivants:out.vivantsApresTempete, gagnant:out.gagnantApres15sDansTempete})); console.log(logs.join('\n')); await browser.close(); })();
