/* =====================================================================
   LOBBY — Fada Royale v1.0
   Scène 3D dédiée (la « fada » : estrade en terre cuite, murs de banco, minaret d'Agadez, néons cyan),
   perso choisi au centre, menus (modes, personnages, boutique, missions, événements, profil).
   Le lobby utilise le même renderer que le jeu (un seul contexte WebGL sur mobile) et les modèles
   déjà chargés (ASSETS) : aucune ressource n'est chargée deux fois.
   Il communique avec le jeu uniquement par l'objet ctx (voir index.html, initLobby).
   ===================================================================== */
import * as Profile from '../core/profile.js';

const ICON = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5h4v5"/>',
  chars: '<circle cx="12" cy="7.5" r="3.6"/><path d="M4.5 20.5c.8-4.2 3.8-6.6 7.5-6.6s6.7 2.4 7.5 6.6"/>',
  shop: '<path d="M5 8h14l-1.2 12.2H6.2z"/><path d="M8.8 8V6.6a3.2 3.2 0 0 1 6.4 0V8"/>',
  missions: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.2"/>',
  events: '<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8L8 13.5l-4.3-4 5.8-.7z"/>',
  profile: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="11" r="2.4"/><path d="M5.8 16.6c.6-1.8 1.8-2.7 3.2-2.7s2.6.9 3.2 2.7M14.5 10h3.5M14.5 13.4h3.5"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="10" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
};
const ico = (k, cls = '') => `<svg class="lb-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
const SHELL = '<svg class="lb-shell" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="6.8" ry="9.2"/><path d="M12 3.6c-1.2 3-1.2 13.8 0 16.8"/><path d="M10.2 7.3h1.4M10 10h1.6M10 12.8h1.6M10.2 15.6h1.4M12.4 8.6h1.4M12.4 11.4h1.6M12.4 14.2h1.4"/></svg>';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtInt = n => Math.round(n).toLocaleString('fr-FR');

export const FRAMES = [
  { id: 'bronze', name: 'Bronze', col: '#b0763a', price: 0 },
  { id: 'terre', name: 'Terre cuite', col: '#c4572b', price: 40 },
  { id: 'nuit', name: 'Indigo', col: '#3b4fa8', price: 60 },
  { id: 'cyan', name: 'Néon cyan', col: '#3fd6e8', price: 100 },
  { id: 'or', name: 'Or du Sahel', col: '#f2b84b', price: 150 },
];
export const MODES = [
  { id: 'br', name: 'Battle Royale', sub: 'Solo', desc: 'Toi contre 19 bots. Taxi-brousse, harmattan qui se resserre, construction en banco. Le dernier debout gagne.', ok: true },
  { id: 'train', name: 'Entraînement', sub: 'Libre', desc: 'Toutes les armes, banco illimité, mannequins de tir, pas de tempête ni d’adversaire. Pour s’exercer à construire et à viser.', ok: true },
  { id: 'duo', name: 'Duo', sub: '2 joueurs', desc: 'Jouer à deux contre les autres équipes.', ok: false },
  { id: 'squad', name: 'Escouade', sub: '4 joueurs', desc: 'Équipes de quatre.', ok: false },
  { id: 'online', name: 'En ligne', sub: 'Multijoueur', desc: 'Parties contre de vrais joueurs : demande des serveurs de jeu.', ok: false },
];

export function createLobby(ctx) {
  const { THREE, renderer } = ctx;
  const P = ctx.profile;
  const $ = id => document.getElementById(id);

  /* =================================================================
     SCÈNE 3D
     ================================================================= */
  const stage = new THREE.Scene();
  stage.environment = ctx.envMap || null;
  stage.fog = new THREE.Fog(0xb9774a, 22, 85);
  const cam = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.1, 260);
  const pcam = new THREE.PerspectiveCamera(22, 1, 0.05, 50); // portraits
  const T = ctx.TEX;

  const lam = (c, extra) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, extra || {}));
  // boîte dont les UV suivent la taille réelle (texture répétée tous les 4 m, comme les maisons du jeu)
  const boxUV = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / 4, uv.getY(k) * dims[f][1] / 4); } return g; };
  // ciel du soir : sable doré à l'horizon, bleu nuit en haut
  {
    const g = new THREE.SphereGeometry(200, 32, 16); const p = g.attributes.position; const cols = [];
    const hor = new THREE.Color(0xf3a55c), mid = new THREE.Color(0xb35a3c), top = new THREE.Color(0x221a35), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 200; if (y < 0.12) c.copy(hor).lerp(mid, Math.max(0, y) / 0.12); else c.copy(mid).lerp(top, Math.min(1, (y - 0.12) / 0.6)); cols.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const sky = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -2; stage.add(sky);
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctx.glowTex, color: 0xffd9a0, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    sun.scale.set(70, 70, 1); sun.position.set(-38, 22, -150); stage.add(sun);
  }
  // lumières : clé chaude, contre-jour cyan, remplissage terre
  const hemi = new THREE.HemisphereLight(0xffe2b8, 0x5a3420, 0.95); stage.add(hemi);
  const key = new THREE.DirectionalLight(0xffc98a, 2.5); key.position.set(-3.5, 6.5, 5.5); stage.add(key); stage.add(key.target);
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 20 }); key.shadow.bias = -0.0008; key.shadow.normalBias = 0.03;
  const rim = new THREE.DirectionalLight(0x4fd8ff, 2.4); rim.position.set(3.2, 3.4, -5); stage.add(rim);
  const fill = new THREE.PointLight(0xff8a3d, 7, 9, 1.6); fill.position.set(2.6, 1.1, 2.4); stage.add(fill);

  // sol de sable
  {
    const g = new THREE.CircleGeometry(90, 72); g.rotateX(-Math.PI / 2); const p = g.attributes.position; const cols = []; const c = new THREE.Color(); const a = new THREE.Color(0xd9a86c), b = new THREE.Color(0x8a5733);
    for (let i = 0; i < p.count; i++) { const d = Math.hypot(p.getX(i), p.getZ(i)); c.copy(a).lerp(b, Math.min(1, d / 40)); cols.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; stage.add(m);
  }
  // estrade : terre cuite, anneau d'or, néon cyan
  const plat = new THREE.Group(); stage.add(plat);
  {
    const tc = document.createElement('canvas'); tc.width = tc.height = 512; const g = tc.getContext('2d');
    g.fillStyle = '#a9532d'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '70,30,12' : '230,160,110'},${Math.random() * .12})`; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
    g.translate(256, 256); g.strokeStyle = 'rgba(255,220,170,.55)'; g.lineWidth = 6;
    for (const r of [70, 150, 228]) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    g.lineWidth = 3; g.strokeStyle = 'rgba(60,24,8,.55)';
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * 150, Math.sin(a) * 150); g.lineTo(Math.cos(a) * 228, Math.sin(a) * 228); g.stroke(); }
    g.fillStyle = 'rgba(255,230,190,.6)';
    for (let k = 0; k < 8; k++) { g.save(); g.rotate(k / 8 * Math.PI * 2); g.beginPath(); g.moveTo(0, -132); g.lineTo(13, -108); g.lineTo(0, -84); g.lineTo(-13, -108); g.closePath(); g.fill(); g.restore(); }
    const tex = new THREE.CanvasTexture(tc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const top = new THREE.MeshLambertMaterial({ map: tex }), side = lam(0x6e3519);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.45, 0.28, 64), [side, top, side]); m.position.y = 0.14; m.receiveShadow = true; m.castShadow = true; plat.add(m);
    const gold = new THREE.Mesh(new THREE.TorusGeometry(2.33, 0.04, 8, 128), new THREE.MeshStandardMaterial({ color: 0xf2b84b, metalness: 0.85, roughness: 0.3 })); gold.rotation.x = Math.PI / 2; gold.position.y = 0.285; plat.add(gold);
    const neon = new THREE.Mesh(new THREE.TorusGeometry(2.46, 0.02, 6, 128), new THREE.MeshBasicMaterial({ color: 0x3fd6e8 })); neon.rotation.x = Math.PI / 2; neon.position.y = 0.06; plat.add(neon);
    // halo au sol (anneau holographique)
    const rc = document.createElement('canvas'); rc.width = rc.height = 256; const rg = rc.getContext('2d'); const gr = rg.createRadialGradient(128, 128, 60, 128, 128, 128);
    gr.addColorStop(0, 'rgba(63,214,232,0)'); gr.addColorStop(0.72, 'rgba(63,214,232,0)'); gr.addColorStop(0.86, 'rgba(63,214,232,.55)'); gr.addColorStop(1, 'rgba(63,214,232,0)'); rg.fillStyle = gr; rg.fillRect(0, 0, 256, 256);
    const rt = new THREE.CanvasTexture(rc);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), new THREE.MeshBasicMaterial({ map: rt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.02; plat.add(halo); plat.userData.halo = halo;
  }
  // ombre douce sous le perso (visible même sans ombres temps réel)
  const blob = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(20,8,2,.6)'); gr.addColorStop(1, 'rgba(20,8,2,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.29; stage.add(m); return m; })();

  // architecture sahélienne : mur de banco en arc, portes à néon, minaret, auvent en wax, palmiers doum
  const torons = []; const toronGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 5); toronGeo.rotateX(Math.PI / 2);
  const wood = lam(0x4a2c14);
  {
    const banco = new THREE.MeshLambertMaterial({ map: T.decor }), plain = new THREE.MeshLambertMaterial({ map: T.banco });
    const neonM = new THREE.MeshBasicMaterial({ color: 0x3fd6e8 });
    const R = 15, n = 15;
    for (let i = 0; i < n; i++) {
      const a = -1.2 + i / (n - 1) * 2.4; const x = Math.sin(a) * R, z = -Math.cos(a) * R - 1; const h = 3.4 + ((i * 7) % 3) * 0.45;
      const door = i === 5 || i === 9;
      const seg = new THREE.Group(); seg.position.set(x, 0, z); seg.rotation.y = -a; stage.add(seg);
      if (door) {
        for (const s of [-1, 1]) { const p = new THREE.Mesh(boxUV(0.75, h, 0.8), plain); p.position.set(s * 1.05, h / 2, 0); seg.add(p); }
        const lint = new THREE.Mesh(boxUV(2.9, h - 2.5, 0.8), banco); lint.position.y = 2.5 + (h - 2.5) / 2; seg.add(lint);
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 2.5), new THREE.MeshBasicMaterial({ color: 0x1b6f7c })); glow.position.set(0, 1.25, -0.25); seg.add(glow);
        const strip = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.05), neonM); strip.position.set(0, 2.47, 0.42); seg.add(strip);
        for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.45, 0.05), neonM); st.position.set(s * 0.68, 1.23, 0.42); seg.add(st); }
      } else {
        const w = new THREE.Mesh(boxUV(3.3, h, 0.8), banco); w.position.y = h / 2; w.receiveShadow = true; seg.add(w);
        const line = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.045, 0.04), neonM); line.position.set(0, h * 0.42, 0.42); seg.add(line);
      }
      for (let k = -1; k <= 1; k++) { const c = new THREE.Mesh(boxUV(0.42, 0.5, 0.5), plain); c.position.set(k * 1.05, h + 0.25, 0); seg.add(c); }
      for (const yy of [h * 0.62, h * 0.86]) for (const k of [-0.9, 0, 0.9]) { const t = new THREE.Mesh(toronGeo, wood); t.position.set(k, yy, 0.45); seg.add(t); }
    }
    // minaret de la Grande Mosquée d'Agadez (pyramide élancée hérissée de torons)
    const mg = new THREE.Group(); mg.position.set(9, 0, -25); stage.add(mg);
    const H = 21; const body = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 2.7, H, 4, 1), plain); body.rotation.y = Math.PI / 4; body.position.y = H / 2; mg.add(body);
    for (let yy = 1.6; yy < H - 1; yy += 1.25) { const r = 2.7 - (2.7 - 0.95) * (yy / H); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const o of [-0.45, 0.45]) {
        const t = new THREE.Mesh(toronGeo, wood); const off = r * 0.7 + 0.25; t.position.set(dx * off + (dz ? o * r * 0.6 : 0), yy, dz * off + (dx ? o * r * 0.6 : 0)); t.rotation.y = dx ? Math.PI / 2 : 0; mg.add(t); } }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.5), plain); cap.position.y = H + 0.3; mg.add(cap);
    const egg = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), lam(0xf4efe6)); egg.scale.y = 1.3; egg.position.y = H + 1.0; mg.add(egg);
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.06, 1.52), neonM); beacon.position.y = H + 0.02; mg.add(beacon);
    // auvent en wax (marché)
    const aw = new THREE.Group(); aw.position.set(8.2, 0, -9.5); aw.rotation.y = -0.55; stage.add(aw);
    for (const [px, pz] of [[-1.6, -1.1], [1.6, -1.1], [-1.6, 1.1], [1.6, 1.1]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 0.1), wood); p.position.set(px, 1.3, pz); aw.add(p); }
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.05, 2.7), new THREE.MeshLambertMaterial({ map: T.wax[0], side: THREE.DoubleSide })); cloth.position.y = 2.65; cloth.rotation.x = 0.12; aw.add(cloth);
    const table = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1), lam(0x7a4a24)); table.position.set(0, 0.4, -0.5); aw.add(table);
    const goods = [0xf2a12c, 0xd9442b, 0x7cb342, 0xffd23f]; for (let k = 0; k < 9; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), lam(goods[k % 4])); s.position.set(-1.2 + k * 0.3, 0.9, -0.5 + (k % 2) * 0.2); aw.add(s); }
    // v1.2 : service à thé sur un tabouret au bord de l'estrade (théière et verres créés pour le jeu)
    if (ctx.objects && ctx.objects.theiere) {
      const tea = new THREE.Group(); tea.position.set(1.75, 0, 0.75); tea.rotation.y = -0.5; stage.add(tea);
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.42, 14), lam(0x5a3416)); stool.position.y = 0.21; stool.castShadow = true; tea.add(stool);
      const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.015, 24), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.8, roughness: 0.35 })); tray.position.y = 0.43; tea.add(tray);
      const pot = ctx.objects.theiere.clone(); pot.position.set(-0.05, 0.44, 0); pot.rotation.y = 0.6; tea.add(pot);
      if (ctx.objects['verre-the']) for (const [x, z] of [[0.12, 0.1], [0.14, -0.08]]) { const gl = ctx.objects['verre-the'].clone(); gl.scale.setScalar(0.85); gl.position.set(x, 0.44, z); tea.add(gl); }
    }
    // palmiers doum
    const palm = (x, z, s, lean) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); stage.add(g);
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 5.5, 7), lam(0x6b4a2b)); tr.position.y = 2.75; tr.rotation.z = lean; g.add(tr);
      const top = new THREE.Group(); top.position.set(-Math.sin(lean) * 5.4, 5.4, 0); g.add(top);
      for (let k = 0; k < 9; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.4, 4), lam(0x5c7a32, { flatShading: true })); f.scale.z = 0.12; f.position.y = 0.2; f.rotation.set(1.15, k / 9 * Math.PI * 2, 0); const h2 = new THREE.Group(); h2.rotation.y = k / 9 * Math.PI * 2; f.rotation.set(1.2, 0, 0); f.position.set(0, 0.2, 1.0); h2.add(f); top.add(h2); }
      return g; };
    palm(-7.5, -10, 1.05, 0.08); palm(-15, -13, 1.35, 0.05); palm(14, -7, 1.1, -0.1);
    // dunes lointaines
    for (const [x, z, sx, sy] of [[-30, -45, 22, 5], [10, -60, 30, 7], [40, -40, 18, 4], [-55, -20, 20, 5]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xc98f58)); d.scale.set(sx, sy, sx * 0.6); d.position.set(x, -0.2, z); stage.add(d); }
  }
  // poussière qui flotte dans la lumière
  const DUST = 170; const dustGeo = new THREE.BufferGeometry(); const dp = new Float32Array(DUST * 3), dv = [];
  for (let i = 0; i < DUST; i++) { dp[i * 3] = (Math.random() - 0.5) * 9; dp[i * 3 + 1] = Math.random() * 4; dp[i * 3 + 2] = (Math.random() - 0.5) * 6 - 0.5; dv.push(0.05 + Math.random() * 0.12, Math.random() * 6.28); }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: ctx.glowTex, size: 0.07, color: 0xffd9a0, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending })); stage.add(dust);
  // rayons de lumière (faux volumétrique : plans additifs, très peu coûteux)
  const shafts = [];
  {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,214,150,.0)'); gr.addColorStop(0.35, 'rgba(255,214,150,.55)'); gr.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
    const tex = new THREE.CanvasTexture(c);
    for (const [x, z, r, w] of [[-2.4, -3.2, 0.35, 1.3], [-0.6, -4.2, 0.3, 0.9], [1.6, -3.6, 0.38, 1.1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 11), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.position.set(x, 4.2, z); m.rotation.z = r; stage.add(m); shafts.push(m); }
  }
  // présentoir d'arme (boutique) : socle + anneau cyan
  const pedestal = new THREE.Group(); pedestal.position.set(1.85, 0, 0.9); pedestal.visible = false; stage.add(pedestal);
  { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.9, 24), lam(0x6e3519)); b.position.y = 0.45; pedestal.add(b);
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.015, 6, 48), new THREE.MeshBasicMaterial({ color: 0x3fd6e8 })); r.rotation.x = Math.PI / 2; r.position.y = 0.92; pedestal.add(r); }
  const weaponHold = new THREE.Group(); weaponHold.position.y = 1.35; pedestal.add(weaponHold);

  /* ---------- perso présenté ---------- */
  const charRoot = new THREE.Group(); charRoot.position.y = 0.28; stage.add(charRoot);
  let disp = null, dispKey = '', spawnT = 1;
  const cache = new Map();
  function setCharacter(skin, outfit, glider) {
    const k = skin + '|' + outfit;
    if (k !== dispKey) {
      if (disp) charRoot.remove(disp.g);
      disp = cache.get(k);
      if (!disp) { disp = ctx.buildDisplay(skin, outfit); cache.set(k, disp); if (cache.size > 6) { const first = cache.keys().next().value; if (first !== k) cache.delete(first); } }
      charRoot.add(disp.g); dispKey = k; spawnT = 0; portraitKey = '';
    }
    disp.setGlider(glider);
  }

  /* ---------- caméra : rotation du perso au doigt / à la souris, zoom léger ---------- */
  let yaw = 0.35, yawV = 0, dist = 6.4, distT = 6.4, idleT = 0, viewX = 0, viewXT = 0, viewY = 0, viewYT = 0;
  const pointers = new Map(); let pinch0 = 0, dragging = false;
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', e => { if (!open) return; pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragging = true; idleT = 0; if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); } try { canvas.setPointerCapture(e.pointerId); } catch (err) {} });
  canvas.addEventListener('pointermove', e => { if (!open || !pointers.has(e.pointerId)) return; const p = pointers.get(e.pointerId);
    if (pointers.size === 1) { const dx = e.clientX - p.x; yaw += dx * 0.011; yawV = dx * 0.011 / 0.016; }
    else if (pointers.size === 2) { p.x = e.clientX; p.y = e.clientY; const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) distT = Math.min(7.6, Math.max(4.4, distT * pinch0 / d)); pinch0 = d; return; }
    p.x = e.clientX; p.y = e.clientY; idleT = 0; });
  const up = e => { pointers.delete(e.pointerId); if (!pointers.size) dragging = false; pinch0 = 0; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { if (!open) return; distT = Math.min(7.6, Math.max(4.4, distT + Math.sign(e.deltaY) * 0.45)); idleT = 0; }, { passive: true });

  /* ---------- portrait (avatar du profil) ---------- */
  let portraitKey = '', portraitURL = '', wantPortrait = false;
  const pc = document.createElement('canvas'); pc.width = pc.height = 160; const pg = pc.getContext('2d');
  // rendu dans une petite cible 160×160 en sRGB : lecture de 100 Ko seulement, encodage JPEG asynchrone (toBlob)
  // (v1.0 première version : toDataURL sur le canevas principal = relecture complète de l'image, saccade visible)
  const prt = new THREE.WebGLRenderTarget(160, 160, { colorSpace: THREE.SRGBColorSpace }); prt.texture.colorSpace = THREE.SRGBColorSpace;
  const pbuf = new Uint8Array(160 * 160 * 4), pimg = pg.createImageData(160, 160);
  function renderPortrait() {
    if (!disp) return; const hy = disp.headY + 0.28;
    pcam.aspect = 1; pcam.fov = 16; pcam.updateProjectionMatrix(); charRoot.updateMatrixWorld(true);
    const s = Math.sin(charRoot.rotation.y), c = Math.cos(charRoot.rotation.y);
    pcam.position.set(s * 1.55, hy + 0.04, c * 1.55); pcam.lookAt(0, hy - 0.02, 0);
    const wasDust = dust.visible; dust.visible = false;
    const prev = renderer.getRenderTarget(); renderer.setRenderTarget(prt); renderer.render(stage, pcam); renderer.readRenderTargetPixels(prt, 0, 0, 160, 160, pbuf); renderer.setRenderTarget(prev);
    dust.visible = wasDust;
    for (let y = 0; y < 160; y++) pimg.data.set(pbuf.subarray((159 - y) * 640, (160 - y) * 640), y * 640);
    pg.putImageData(pimg, 0, 0); portraitKey = dispKey;
    pc.toBlob(b => { if (!b) return; if (portraitURL.startsWith('blob:')) URL.revokeObjectURL(portraitURL); portraitURL = URL.createObjectURL(b); refreshAvatar(); }, 'image/jpeg', 0.88);
  }

  /* =================================================================
     INTERFACE
     ================================================================= */
  const root = $('lobby');
  root.innerHTML = `
  <div class="lb-top">
    <button class="lb-prof" id="lbProf" aria-label="Profil"><span class="lb-av" id="lbAvWrap"><img id="lbAv" alt=""></span>
      <span class="lb-pn"><b id="lbName">Joueur</b><span class="lb-lvl"><em>Niv. <i id="lbLvl">1</i></em><span class="lb-xp"><i id="lbXp"></i></span></span></span></button>
    <div class="lb-right"><div class="lb-cauris" title="Cauris : monnaie du jeu gagnée en jouant (aucun achat réel)">${SHELL}<b id="lbCauris">0</b></div>
      <button class="lb-iconbtn" id="lbGear" aria-label="Paramètres">${ico('gear')}</button></div>
  </div>
  <nav class="lb-nav" id="lbNav">
    <button data-p="home" class="on">${ico('home')}<span>Accueil</span></button>
    <button data-p="chars">${ico('chars')}<span>Persos</span></button>
    <button data-p="shop">${ico('shop')}<span>Boutique</span></button>
    <button data-p="missions">${ico('missions')}<span>Missions</span><em class="lb-badge hidden" id="lbBadge">0</em></button>
    <button data-p="events">${ico('events')}<span>Événements</span></button>
    <button data-p="profile">${ico('profile')}<span>Profil</span></button>
  </nav>
  <div class="lb-home" id="lbHome">
    <div class="lb-logo"><div class="lb-flag"><i></i><i></i><i></i></div><h1>FADA<br>ROYALE</h1><p><b>v1.4</b>Le battle royale du Sahel</p></div>
    <div class="lb-who"><small>Ton personnage</small><b id="lbCharName">—</b><span class="lb-hint">${ctx.IS_TOUCH ? 'Glisse pour le tourner · pince pour zoomer' : 'Glisse pour le tourner · molette pour zoomer'}</span></div>
    <div class="lb-playbox"><button class="lb-mode" id="lbModeBtn"><small>Mode</small><b id="lbModeName">Battle Royale · Solo</b>${ico('chev')}</button>
      <button class="lb-play" id="play">JOUER</button></div>
  </div>
  <section class="lb-panel hidden" id="lbPanel" aria-live="polite"><header><h2 id="lbPTitle"></h2><button class="lb-iconbtn" id="lbPClose" aria-label="Fermer">${ico('close')}</button></header><div class="lb-pbody" id="lbPBody"></div></section>
  <div class="lb-modal hidden" id="lbModes"><div class="lb-mbox"><header><h2>Choisis ton mode</h2><button class="lb-iconbtn" id="lbMClose" aria-label="Fermer">${ico('close')}</button></header>
    <div class="lb-mgrid" id="lbMGrid"></div><footer><button class="lb-ghost" id="lbMCancel">Annuler</button><button class="lb-play lb-confirm" id="lbMGo">CONFIRMER</button></footer></div></div>
  <div class="lb-toast hidden" id="lbToast"></div>`;
  const fade = document.createElement('div'); fade.id = 'lbFade'; fade.className = 'hidden'; fade.innerHTML = '<div class="lb-flogo">FADA ROYALE</div><small id="lbFadeTxt">Préparation de la partie…</small><div class="lb-fbar"><i></i></div>'; document.body.appendChild(fade);

  let open = false, panel = 'home', mode = 'br', shopCat = 'chars', preview = null; // preview : {skin, outfit, glider, weapon}
  const modeObj = () => MODES.find(m => m.id === mode) || MODES[0];

  function toast(t) { const el = $('lbToast'); el.innerHTML = t; el.classList.remove('hidden'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.add('hidden'), 2200); }
  function refreshAvatar() {
    const img = $('lbAv'); if (portraitURL) { img.src = portraitURL; img.style.display = ''; } else img.style.display = 'none';
    const fr = FRAMES.find(f => f.id === P.frame) || FRAMES[0]; $('lbAvWrap').style.borderColor = fr.col;
    document.querySelectorAll('.lb-bigav').forEach(el => { el.style.borderColor = fr.col; const i = el.querySelector('img'); if (i && portraitURL) i.src = portraitURL; });
  }
  function refreshTop() {
    const L = Profile.levelInfo(P.xp);
    $('lbName').textContent = P.name || 'Joueur'; $('lbLvl').textContent = L.level; $('lbXp').style.width = (L.pct * 100).toFixed(1) + '%';
    $('lbCauris').textContent = fmtInt(P.cauris);
    const n = Profile.claimable(P); $('lbBadge').textContent = n; $('lbBadge').classList.toggle('hidden', !n);
    $('lbCharName').textContent = ctx.SKINS[P.skin] ? ctx.SKINS[P.skin].label : '—';
    $('lbModeName').textContent = modeObj().name + ' · ' + modeObj().sub;
    refreshAvatar();
  }
  function showStageFor() {
    const pv = preview || {};
    const skin = pv.skin || P.skin, outfit = pv.outfit !== undefined ? pv.outfit : (P.outfits[skin] ?? -1), glider = pv.glider !== undefined ? pv.glider : null;
    setCharacter(skin, outfit, glider);
    weaponHold.clear(); pedestal.visible = !!pv.weapon;
    if (pv.weapon) { const w = ctx.weaponModel(pv.weapon); w.rotation.y = Math.PI / 2; w.scale.setScalar(1.6); weaponHold.add(w); }
  }

  /* ---------- navigation ---------- */
  function go(p, silent) {
    panel = p; preview = null;
    document.querySelectorAll('#lbNav button').forEach(b => b.classList.toggle('on', b.dataset.p === p));
    $('lbPanel').classList.toggle('hidden', p === 'home'); root.classList.toggle('lb-paneled', p !== 'home');
    if (p !== 'home') renderPanel(); showStageFor(); if (!silent && ctx.sfx) ctx.sfx('click');
  }
  function renderPanel() {
    const titles = { chars: 'Personnages', shop: 'Boutique', missions: 'Missions', events: 'Événements', profile: 'Profil' };
    $('lbPTitle').textContent = titles[panel] || ''; const body = $('lbPBody');
    body.innerHTML = panel === 'chars' ? htmlChars() : panel === 'shop' ? htmlShop() : panel === 'missions' ? htmlMissions() : panel === 'events' ? htmlEvents() : htmlProfile();
    wirePanel(body);
  }
  const figHTML = s => { const c = s.css; return `<span class="fig" style="--s:${c.s};--b:${c.b};--l:${c.l};--ht:${c.ht || 'transparent'};--hb:${c.hb || 'transparent'}"><i class="h"></i><i class="b"></i><i class="l"></i></span>`; };

  // --- personnages
  function htmlChars() {
    const sel = (preview && preview.skin) || P.skin; let h = '<p class="lb-note">Touche un personnage pour le voir en 3D, puis équipe-le.</p><div class="lb-grid">';
    for (const k in ctx.SKINS) { const s = ctx.SKINS[k]; const ok = ctx.skinAvailable(k);
      h += `<button class="lb-card${k === sel ? ' sel' : ''}${ok ? '' : ' locked'}" data-skin="${k}" ${ok ? '' : 'aria-disabled="true"'}>${figHTML(s)}<b>${esc(s.label)}</b>
        <small>${!ok ? ico('lock') + ' Modèle non chargé' : k === P.skin ? ico('check') + ' Équipé' : s.real ? 'Modèle 3D réaliste' : 'Style blocs'}</small></button>`; }
    h += '</div>';
    const s = ctx.SKINS[sel];
    h += `<div class="lb-actions"><div><small>Sélection</small><b>${esc(s.label)}</b></div>${sel === P.skin ? `<span class="lb-tag ok">${ico('check')} Équipé</span>` : `<button class="lb-btn" data-act="equip-skin" data-skin="${sel}">ÉQUIPER</button>`}</div>`;
    if (s.real) h += `<p class="lb-note">Tenues de ce personnage : <button class="lb-link" data-act="goshop" data-cat="outfits">Boutique › Tenues</button></p>`;
    return h;
  }
  // --- boutique
  function shopItems(cat) {
    const skin = (preview && preview.skin) || P.skin;
    if (cat === 'chars') return Object.keys(ctx.SKINS).map(k => ({ id: 'char_' + k, name: ctx.SKINS[k].label, price: 0, free: true, owned: true, sw: figHTML(ctx.SKINS[k]), pv: { skin: k }, equip: () => { P.skin = k; }, isEq: P.skin === k }));
    if (cat === 'outfits') { if (!ctx.SKINS[skin].real || ctx.SKINS[skin].costume) return null;
      return [{ id: 'outfit_' + skin + '_-1', name: 'D’origine', price: 0, free: true, owned: true, sw: '<span class="lb-sw" style="background:linear-gradient(135deg,#444,#999)"></span>', pv: { skin, outfit: -1 }, equip: () => { P.outfits[skin] = -1; }, isEq: (P.outfits[skin] ?? -1) === -1 }]
        .concat(ctx.OUTFITS.map((o, i) => ({ id: 'outfit_' + skin + '_' + i, name: o.name, price: 80, sw: `<span class="lb-sw" style="background:${o.css}"></span>`, pv: { skin, outfit: i }, equip: () => { P.outfits[skin] = i; }, isEq: P.outfits[skin] === i }))); }
    if (cat === 'gliders') return ctx.WAX.map((w, i) => ({ id: 'glider_' + i, name: w.name, price: i === 0 ? 0 : 50, free: i === 0, sw: `<span class="lb-sw" style="background-image:url(${w.url});background-size:cover"></span>`, pv: { glider: i }, equip: () => { P.glider = i; }, isEq: P.glider === i }));
    if (cat === 'frames') return FRAMES.map(f => ({ id: 'frame_' + f.id, name: f.name, price: f.price, free: !f.price, sw: `<span class="lb-sw lb-frame" style="border-color:${f.col}"></span>`, pv: {}, equip: () => { P.frame = f.id; refreshAvatar(); }, isEq: P.frame === f.id }));
    if (cat === 'weapons') return ctx.WEAPONS.map(w => ({ id: 'weapon_' + w.id, name: w.name, price: 0, info: true, sw: `<span class="lb-sw" style="background:${w.rarCss};opacity:.85"></span>`, pv: { weapon: w.id }, rar: w.rarName }));
    return [];
  }
  function htmlShop() {
    const cats = [['chars', 'Personnages'], ['outfits', 'Tenues'], ['gliders', 'Planeurs'], ['frames', 'Cadres'], ['weapons', 'Armes']];
    let h = `<p class="lb-note">${SHELL} Les cauris se gagnent en jouant (parties, missions) et restent sur cet appareil. <b>Aucun achat avec de l’argent réel.</b></p>
      <div class="lb-tabs">${cats.map(([k, n]) => `<button data-cat="${k}" class="${k === shopCat ? 'on' : ''}">${n}</button>`).join('')}</div>`;
    const items = shopItems(shopCat);
    if (!items) return h + `<p class="lb-empty">Les tenues existent pour <b>Le Boss</b> et <b>La Guerrière</b> (modèles 3D réalistes). Choisis l’un d’eux dans Personnages.</p>`;
    if (shopCat === 'weapons') h += '<p class="lb-note">Aperçu des 6 armes du jeu. <b>Apparences d’armes : en développement</b> (pas encore à vendre).</p>';
    h += '<div class="lb-grid">';
    for (const it of items) { const own = it.owned || it.free || Profile.owns(P, it.id); const sel = preview && JSON.stringify(preview) === JSON.stringify(it.pv);
      let tag = it.info ? `<small style="color:${'#fff'}">${esc(it.rar)}</small>` : it.isEq ? `<small class="ok">${ico('check')} Équipé</small>` : own ? '<small>Possédé</small>' : `<small class="price">${SHELL}${it.price}</small>`;
      h += `<button class="lb-card${sel ? ' sel' : ''}" data-item="${it.id}">${it.sw}<b>${esc(it.name)}</b>${tag}</button>`; }
    h += '</div>';
    const cur = items.find(it => preview && JSON.stringify(preview) === JSON.stringify(it.pv));
    if (cur && !cur.info) { const own = cur.owned || cur.free || Profile.owns(P, cur.id);
      h += `<div class="lb-actions"><div><small>${own ? 'Possédé' : 'Prix'}</small><b>${own ? esc(cur.name) : SHELL + cur.price + ' cauris'}</b></div>${cur.isEq ? `<span class="lb-tag ok">${ico('check')} Équipé</span>` : own ? `<button class="lb-btn" data-act="equip" data-item="${cur.id}">ÉQUIPER</button>` : `<button class="lb-btn${P.cauris < cur.price ? ' off' : ''}" data-act="buy" data-item="${cur.id}">ACHETER</button>`}</div>`; }
    return h;
  }
  // --- missions
  function untilTxt(kind) { const now = new Date(); const end = new Date(now); end.setHours(24, 0, 0, 0); if (kind === 'weekly') { const d = (8 - (now.getDay() || 7)) % 7 || 7; end.setDate(now.getDate() + d); end.setHours(0, 0, 0, 0); }
    const s = Math.max(0, (end - now) / 1000); const dd = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), mm = Math.floor(s % 3600 / 60); return dd ? `${dd} j ${hh} h` : `${hh} h ${mm} min`; }
  function htmlMissions() {
    const M = Profile.missions(P); let h = '<p class="lb-note">Les missions avancent avec tes vraies parties de Battle Royale (pas en entraînement). Récompenses : XP et cauris.</p>';
    for (const [kind, title] of [['daily', 'Missions du jour'], ['weekly', 'Missions de la semaine']]) {
      h += `<h3>${title}<small>nouvelles dans ${untilTxt(kind)}</small></h3>`;
      for (const m of M[kind]) { const pct = Math.min(100, m.value / m.n * 100);
        h += `<div class="lb-mis${m.done ? ' done' : ''}"><div class="lb-mt"><b>${esc(m.text)}</b><span class="lb-bar"><i style="width:${pct}%"></i></span><small>${fmtInt(m.value)} / ${fmtInt(m.n)}</small></div>
          <div class="lb-mr"><small>+${m.xp} XP · ${SHELL}${m.c}</small>${m.claimed ? `<span class="lb-tag ok">${ico('check')} Reçu</span>` : m.done ? `<button class="lb-btn" data-act="claim" data-kind="${kind}" data-id="${m.id}">RÉCUPÉRER</button>` : ''}</div></div>`; } }
    return h;
  }
  // --- événements
  function htmlEvents() {
    return `<div class="lb-ev"><b>Aucun événement en cours</b><p>Les événements (défis à durée limitée, récompenses spéciales) arriveront dans une prochaine version. Rien n’est simulé ici.</p></div>
      <h3>Nouveautés de la v1.4 : construction rapide</h3><ul class="lb-list">
      <li><b>Les 4 pièces toujours à l’écran</b> (MUR, RAMPE, SOL, TOIT) : touche une pièce pour la poser tout de suite, garde le doigt pour en poser à la chaîne en avançant.</li>
      <li><b>Monter vite :</b> mur puis rampe, mur puis rampe… le mur se place tout seul au bout de la rampe de devant, il ne te bloque plus.</li>
      <li><b>Édition :</b> glisse sur les cases et relâche pour valider, puis tu reviens en construction.</li>
      <li><b>Entraînement :</b> banco illimité, et le menu pause efface tes constructions.</li>
      <li><b>Paramètres › Construction :</b> pose au toucher, validation au relâchement, sensibilités ; limite d’images (30 / 60).</li>
      <li><b>Plus fluide</b> avec beaucoup de pièces construites.</li></ul>
      <h3>Nouveautés de la v1.3</h3><ul class="lb-list">
      <li><b>Caméra :</b> ton perso se tourne avec la caméra, même à l’arrêt.</li>
      <li><b>Se hisser :</b> plus de grimpe le long des murs. Saute face à un muret, un mur ou un toit : si le bord est à portée de main, tu t’y hisses.</li>
      <li><b>Portes :</b> les portes des maisons s’ouvrent et se ferment (bouton OUVRIR LA PORTE, ou E). Les bots les ouvrent aussi.</li>
      <li><b>Bots plus malins :</b> ils se mettent à couvert pour recharger ou se soigner, et s’accroupissent derrière les murets.</li>
      <li><b>Plus fluide :</b> plus d’à-coup à la première sortie d’une arme, moins d’objets à dessiner en qualité Basse.</li></ul>
      <h3>Nouveautés de la v1.2</h3><ul class="lb-list">
      <li><b>Nouvelles armes</b> créées pour le jeu : fusil d’assaut, mitraillette, pompe, sniper, mitrailleuse et daba, avec leurs vrais chargeurs au rechargement.</li>
      <li><b>Nouveaux persos :</b> le Touareg (chèche indigo), le Garde du W (chapeau de brousse), la Commerçante (foulard et tenue en wax).</li>
      <li><b>Décors :</b> sol en sable et cailloux, murs en banco et en enduit, motif wax, service à thé dans le lobby, nouvel écran de chargement.</li></ul>
      <h3>Nouveautés de la v1.1</h3><ul class="lb-list">
      <li><b>Maisons ouvertes :</b> entre par la porte, fouille l’intérieur et l’étage des grandes maisons.</li>
      <li><b>Escalade :</b> saute face à un mur pour te hisser (remplacée en v1.3 : on se hisse seulement sur un rebord à portée).</li>
      <li><b>Armes :</b> rechargement propre à chaque arme, culasse du sniper, pompe, revolver à une main.</li>
      <li><b>Kilishi et thé</b> animés, parapente qui s’ouvre au-dessus de la tête, déplacements plus naturels.</li>
      <li><b>Nouveau HUD :</b> icônes, silhouettes des armes, boussole.</li></ul>
      <h3>Nouveautés de la v1.0</h3><ul class="lb-list">
      <li><b>Animations corrigées :</b> le buste ne tourne plus sur lui-même en courant, bras stables, buste stabilisé arme en main.</li>
      <li><b>Nouveau lobby</b> en 3D : personnage en vedette, modes de jeu, profil, missions, boutique locale.</li>
      <li><b>Mode Entraînement :</b> toutes les armes, banco illimité, mannequins.</li>
      <li><b>Profil et missions :</b> statistiques réelles, niveaux, cauris gagnés en jouant.</li>
      <li><b>Carte agrandie</b> et nouveaux lieux, maisons et végétation retravaillées.</li>
      <li><b>Qualité Basse / Moyenne / Haute</b> pour les téléphones Android.</li></ul>`;
  }
  // --- profil
  function htmlProfile() {
    const L = Profile.levelInfo(P.xp), s = P.stats, has = s.games > 0, dash = '—';
    const since = new Date(P.since || Date.now()).toLocaleDateString('fr-FR');
    const tm = s.time >= 3600 ? Math.floor(s.time / 3600) + ' h ' + Math.floor(s.time % 3600 / 60) + ' min' : Math.floor(s.time / 60) + ' min';
    const cell = (v, l) => `<div><b>${v}</b><small>${l}</small></div>`;
    return `<div class="lb-pf"><span class="lb-bigav">${portraitURL ? `<img src="${portraitURL}" alt="">` : figHTML(ctx.SKINS[P.skin])}</span>
        <div class="lb-pfi"><label>Pseudo<input id="lbPseudo" maxlength="14" value="${esc(P.name)}" placeholder="Ton pseudo" autocomplete="off"></label>
        <div class="lb-pfl"><b>Niveau ${L.level}</b><span class="lb-bar"><i style="width:${(L.pct * 100).toFixed(1)}%"></i></span><small>${fmtInt(L.cur)} / ${fmtInt(L.need)} XP</small></div>
        <small>Personnage : <b>${esc(ctx.SKINS[P.skin].label)}</b> · ${SHELL}${fmtInt(P.cauris)} cauris</small></div></div>
      <h3>Statistiques<small>enregistrées sur cet appareil depuis le ${since}</small></h3>
      <div class="lb-stats">${cell(s.games, 'Parties')}${cell(s.wins, 'Victoires (TOP 1)')}${cell(s.kills, 'Éliminations')}${cell(has ? (s.kills / s.games).toFixed(1) : dash, 'Élims / partie')}
        ${cell(has ? '#' + s.bestRank : dash, 'Meilleur classement')}${cell(s.top10, 'Top 10')}${cell(fmtInt(s.dmg), 'Dégâts infligés')}${cell(fmtInt(s.built), 'Pièces de banco')}
        ${cell(s.chests, 'Coffres ouverts')}${cell(fmtInt(s.harvest), 'Banco récolté')}${cell(has ? tm : dash, 'Temps de jeu')}${cell(has ? Math.round(s.wins / s.games * 100) + ' %' : dash, 'Taux de victoire')}</div>
      ${has ? '' : '<p class="lb-note">Joue une partie de Battle Royale pour remplir tes statistiques.</p>'}
      <h3>Cadre de l’avatar</h3><div class="lb-frames">${FRAMES.map(f => { const own = !f.price || Profile.owns(P, 'frame_' + f.id); return `<button data-frame="${f.id}" class="${P.frame === f.id ? 'on' : ''}${own ? '' : ' locked'}" style="--c:${f.col}" title="${esc(f.name)}${own ? '' : ' (boutique)'}">${own ? '' : ico('lock')}</button>`; }).join('')}</div>
      <details class="lb-about"><summary>À propos et crédits</summary><div>${ctx.creditsHTML}</div></details>
      <button class="lb-ghost lb-warn" data-act="reset">Réinitialiser le profil</button>`;
  }

  function wirePanel(body) {
    body.querySelectorAll('[data-skin]').forEach(b => b.addEventListener('click', () => { if (b.dataset.act) return; if (!ctx.skinAvailable(b.dataset.skin)) return; preview = { skin: b.dataset.skin }; showStageFor(); renderPanel(); ctx.sfx && ctx.sfx('select'); }));
    body.querySelectorAll('.lb-tabs button').forEach(b => b.addEventListener('click', () => { shopCat = b.dataset.cat; preview = null; showStageFor(); renderPanel(); ctx.sfx && ctx.sfx('click'); }));
    body.querySelectorAll('[data-item]').forEach(b => { if (b.dataset.act) return; b.addEventListener('click', () => { const it = (shopItems(shopCat) || []).find(x => x.id === b.dataset.item); if (!it) return; const keepSkin = preview && preview.skin; preview = Object.assign({}, it.pv); if (keepSkin && !preview.skin && shopCat !== 'chars') preview.skin = keepSkin; showStageFor(); renderPanel(); ctx.sfx && ctx.sfx('select'); }); });
    body.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => act(b.dataset.act, b.dataset)));
    body.querySelectorAll('[data-frame]').forEach(b => b.addEventListener('click', () => { const f = FRAMES.find(x => x.id === b.dataset.frame); if (f.price && !Profile.owns(P, 'frame_' + f.id)) { shopCat = 'frames'; go('shop'); return; } P.frame = f.id; Profile.saveProfile(P); refreshAvatar(); renderPanel(); }));
    const ps = body.querySelector('#lbPseudo'); if (ps) { const save = () => { P.name = ps.value.trim().slice(0, 14); Profile.saveProfile(P); refreshTop(); }; ps.addEventListener('change', save); ps.addEventListener('blur', save); ps.addEventListener('keydown', e => { if (e.key === 'Enter') ps.blur(); }); }
  }
  function act(a, d) {
    if (a === 'equip-skin') { P.skin = d.skin; Profile.saveProfile(P); preview = null; toast('Personnage équipé : <b>' + esc(ctx.SKINS[P.skin].label) + '</b>'); ctx.sfx && ctx.sfx('buy'); }
    else if (a === 'goshop') { shopCat = d.cat; const sk = preview && preview.skin; go('shop'); if (sk) { preview = { skin: sk }; showStageFor(); renderPanel(); } return; }
    else if (a === 'buy' || a === 'equip') { const it = (shopItems(shopCat) || []).find(x => x.id === d.item); if (!it) return;
      if (a === 'buy') { const r = Profile.buy(P, it.id, it.price); if (r === 'cauris') { toast('Pas assez de cauris : joue des parties et termine des missions.'); return; } if (r === 'ok') { toast('Acheté : <b>' + esc(it.name) + '</b>'); ctx.sfx && ctx.sfx('buy'); } }
      if (it.pv.skin && shopCat === 'outfits' && P.skin !== it.pv.skin) P.skin = it.pv.skin;
      it.equip(); Profile.saveProfile(P); if (a === 'equip') { toast('Équipé : <b>' + esc(it.name) + '</b>'); ctx.sfx && ctx.sfx('buy'); } }
    else if (a === 'claim') { const r = Profile.claimMission(P, d.kind, d.id); if (r) { toast(`Mission terminée : <b>+${r.xp} XP</b> · ${SHELL}<b>${r.cauris}</b>`); ctx.sfx && ctx.sfx('buy'); } }
    else if (a === 'reset') { if (!confirm('Effacer ton profil (statistiques, niveau, cauris, objets) sur cet appareil ?')) return; ctx.resetProfile(); return; }
    refreshTop(); renderPanel(); showStageFor();
  }

  /* ---------- sélection du mode ---------- */
  let pendingMode = mode;
  function openModes() {
    pendingMode = mode;
    $('lbMGrid').innerHTML = MODES.map(m => `<button class="lb-mcard${m.ok ? '' : ' off'}${m.id === pendingMode ? ' sel' : ''}" data-mode="${m.id}" ${m.ok ? '' : 'aria-disabled="true"'}>
      <span class="lb-mtag ${m.ok ? 'ok' : ''}">${m.ok ? 'Disponible' : 'En développement'}</span><b>${m.name}</b><small>${m.sub}</small><p>${m.desc}</p></button>`).join('');
    $('lbMGrid').querySelectorAll('.lb-mcard').forEach(b => b.addEventListener('click', () => { const m = MODES.find(x => x.id === b.dataset.mode); if (!m.ok) { toast('<b>' + m.name + '</b> : en développement, pas encore jouable.'); return; } pendingMode = m.id; $('lbMGrid').querySelectorAll('.lb-mcard').forEach(x => x.classList.toggle('sel', x === b)); ctx.sfx && ctx.sfx('select'); }));
    $('lbModes').classList.remove('hidden'); ctx.sfx && ctx.sfx('click');
  }
  const closeModes = () => $('lbModes').classList.add('hidden');
  $('lbModeBtn').addEventListener('click', openModes);
  $('play').addEventListener('click', openModes);
  $('lbMClose').addEventListener('click', closeModes); $('lbMCancel').addEventListener('click', closeModes);
  $('lbModes').addEventListener('click', e => { if (e.target === $('lbModes')) closeModes(); });
  $('lbMGo').addEventListener('click', () => {
    mode = pendingMode; closeModes(); refreshTop();
    ctx.beforeLaunch && ctx.beforeLaunch();           // plein écran / verrouillage souris : doit se faire pendant le clic
    $('lbFadeTxt').textContent = mode === 'train' ? 'Préparation de l’entraînement…' : 'Le taxi-brousse se prépare…';
    fade.classList.remove('hidden'); fade.classList.add('on'); ctx.sfx && ctx.sfx('play');
    // la partie est créée et ses shaders compilés pendant que l'écran de transition est affiché
    requestAnimationFrame(() => requestAnimationFrame(() => { ctx.startMatch(mode); ctx.precompile && ctx.precompile(); requestAnimationFrame(() => { fade.classList.remove('on'); setTimeout(() => fade.classList.add('hidden'), 450); }); }));
  });

  $('lbNav').querySelectorAll('button').forEach(b => b.addEventListener('click', () => go(b.dataset.p === panel && panel !== 'home' ? 'home' : b.dataset.p)));
  $('lbPClose').addEventListener('click', () => go('home'));
  $('lbProf').addEventListener('click', () => go('profile'));
  $('lbGear').addEventListener('click', () => ctx.openSettings());
  addEventListener('keydown', e => { if (!open) return; if (e.key === 'Escape') { if (!$('lbModes').classList.contains('hidden')) closeModes(); else if (panel !== 'home') go('home'); } });

  /* =================================================================
     BOUCLE
     ================================================================= */
  let t = 0, lastShadow = null, lift = 0;
  function update(dt) {
    t += dt; idleT += dt;
    if (!dragging) { yaw += yawV * dt; yawV *= Math.exp(-4 * dt); if (idleT > 4) yaw += (0.35 + Math.sin(t * 0.25) * 0.25 - yaw) * (1 - Math.exp(-0.6 * dt)); }
    dist += (distT - dist) * (1 - Math.exp(-8 * dt));
    charRoot.rotation.y = yaw;
    if (disp) { disp.tick(dt); if (spawnT < 1) { spawnT = Math.min(1, spawnT + dt / 0.45); const e = 1 - Math.pow(1 - spawnT, 3); disp.g.scale.setScalar(0.85 + 0.15 * e); disp.g.position.y = (1 - e) * 0.5; } }
    plat.userData.halo.material.opacity = 0.65 + Math.sin(t * 2) * 0.2 + (1 - spawnT) * 0.6;
    for (let i = 0; i < DUST; i++) { const k = i * 3; dp[k + 1] += dv[i * 2] * dt; dp[k] += Math.sin(t * 0.5 + dv[i * 2 + 1]) * 0.06 * dt; if (dp[k + 1] > 4.2) dp[k + 1] = 0; }
    dustGeo.attributes.position.needsUpdate = true;
    shafts.forEach((s, i) => { s.material.opacity = 0.12 + Math.sin(t * 0.7 + i * 2) * 0.04; });
    weaponHold.rotation.y += dt * 0.8;
    // cadrage : perso décalé quand un panneau est ouvert
    const portrait = innerHeight > innerWidth;
    const panelW = panel !== 'home' && !portrait ? Math.min(460, innerWidth * 0.52) : 0;
    viewXT = panelW ? panelW * 0.5 : (portrait ? 0 : -innerWidth * 0.03); viewYT = portrait && panel !== 'home' ? innerHeight * 0.24 : 0;
    viewX += (viewXT - viewX) * (1 - Math.exp(-8 * dt)); viewY += (viewYT - viewY) * (1 - Math.exp(-8 * dt));
    // aperçu d'un planeur : la caméra recule et lève les yeux vers la voile
    const gl = preview && preview.glider !== undefined; lift += ((gl ? 1 : 0) - lift) * (1 - Math.exp(-5 * dt));
    cam.position.set(Math.sin(t * 0.15) * 0.25, 1.42 + Math.sin(t * 0.3) * 0.05 + (portrait ? 0.15 : 0) + lift * 0.9, dist + (portrait ? 2.2 : 0) + lift * 3.2); cam.lookAt(0, 1.24 + lift * 1.5, 0);
    cam.setViewOffset(innerWidth, innerHeight, viewX, viewY, innerWidth, innerHeight);
    const sh = ctx.quality() !== 'low';
    if (sh !== lastShadow) { lastShadow = sh; key.castShadow = sh; stage.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); }); }
    if (disp && portraitKey !== dispKey && spawnT >= 1 && !preview) wantPortrait = true;
  }
  function render() {
    if (wantPortrait) { wantPortrait = false; renderPortrait(); }
    renderer.render(stage, cam);
  }
  function resize() { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
  // shaders du lobby + variante « cible de rendu » du portrait (sortie linéaire) : compilés derrière l'écran de chargement
  function precompile() { renderer.compile(stage, cam); const prev = renderer.getRenderTarget(); renderer.setRenderTarget(prt); renderer.compile(stage, pcam); renderer.setRenderTarget(prev); }

  // premier portrait pris derrière l'écran de chargement (la relecture de pixels bloque le temps que le GPU termine)
  function warm() { spawnT = 1; if (disp) { disp.g.scale.setScalar(1); disp.g.position.y = 0; } update(0.016); renderPortrait(); }
  function show() { open = true; root.classList.remove('hidden'); preview = null; go('home', true); refreshTop(); showStageFor(); resize(); }
  function hide() { open = false; root.classList.add('hidden'); closeModes(); }
  resize(); refreshTop();
  return { show, hide, update, render, resize, precompile, warm, refresh: refreshTop, get open() { return open; }, get mode() { return mode; }, toast, scene: stage };
}
