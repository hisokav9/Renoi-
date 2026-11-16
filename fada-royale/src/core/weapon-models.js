/* =====================================================================
   ARMES MODÉLISÉES DANS LE CODE — Fada Royale v2.0
   Deux armes sans image ni fichier 3D : elles sont construites ici en VOLUME (boîtes, cylindres), avec des matières PBR
   (couleur, rugosité, métal) partagées. Ce ne sont pas des images planes : chaque pièce a une épaisseur réelle.
   Dessin original (pas de copie d'une arme existante d'un autre jeu), dans les tons de Fada Royale : polymère beige sable,
   acier noirci, laiton.
   Même convention que les armes calées par weapons.js : canon vers −Z, haut +Y, mètres ; la poignée (main droite) au point
   GRIP_AT ; renvoie { object, anchors, muzzle, muzzleY } (anchors : points d'appui des mains pour la prise et les rechargements).
   Les pièces de même matière sont fusionnées : 3 à 4 appels de dessin par arme, 300 à 700 triangles.
   ===================================================================== */
import { GRIP_AT } from './weapons.js';

const MATS = {};
function mat(THREE, key) {
  if (MATS[key]) return MATS[key];
  const P = { beige: [0x9a7f55, 0.72, 0.05] /* v2.0.1 : beige plus soutenu (l'arme se confondait avec le sable au téléphone) */, acier: [0x2b2d30, 0.45, 0.7], noir: [0x17181a, 0.8, 0.1], olive: [0x343a2c, 0.8, 0.1], laiton: [0xc9a23a, 0.35, 0.85] }[key];
  return (MATS[key] = new THREE.MeshStandardMaterial({ color: P[0], roughness: P[1], metalness: P[2], envMapIntensity: 0.4 }));
}

// pièces : [matière, forme, dimensions, position, rotation x]
function assemble(THREE, mergeGeometries, parts) {
  const by = {};
  for (const [m, kind, d, pos, rx = 0, rz = 0] of parts) {
    let g;
    if (kind === 'box') g = new THREE.BoxGeometry(d[0], d[1], d[2]);
    else { g = new THREE.CylinderGeometry(d[0], d[1] ?? d[0], d[2], d[3] || 10); g.rotateX(Math.PI / 2); } // cylindre couché le long de z
    if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz);
    g.translate(pos[0], pos[1], pos[2]); (by[m] = by[m] || []).push(g.index ? g.toNonIndexed() : g);
  }
  const group = new THREE.Group();
  for (const m in by) { const merged = mergeGeometries(by[m], false); merged.computeVertexNormals(); const mesh = new THREE.Mesh(merged, mat(THREE, m)); mesh.castShadow = true; group.add(mesh); }
  return group;
}

// Origine du dessin = haut de la poignée (là où se ferme la main droite) ; décalé ensuite vers GRIP_AT
const DESIGNS = {
  // Fusil tactique : boîtier haut beige, garde-main ventilé avec rail, chargeur droit de 20, crosse réglable avec appui-joue, point rouge
  tactique: {
    parts: [
      ['beige', 'box', [0.056, 0.078, 0.42], [0, 0.068, -0.12]],            // boîtier haut
      ['beige', 'box', [0.05, 0.05, 0.2], [0, 0.018, -0.05]],               // boîtier bas
      ['beige', 'box', [0.062, 0.066, 0.22], [0, 0.064, -0.44]],            // garde-main
      ['acier', 'box', [0.064, 0.012, 0.012], [0, 0.064, -0.38]], ['acier', 'box', [0.064, 0.012, 0.012], [0, 0.064, -0.44]], ['acier', 'box', [0.064, 0.012, 0.012], [0, 0.064, -0.5]], // fentes
      ['acier', 'box', [0.03, 0.012, 0.6], [0, 0.113, -0.26]],              // rail du dessus
      ['acier', 'cyl', [0.012, 0.012, 0.18], [0, 0.07, -0.63]],             // canon
      ['acier', 'cyl', [0.019, 0.017, 0.06], [0, 0.07, -0.74], 0],          // frein de bouche
      ['noir', 'box', [0.03, 0.17, 0.07], [0, -0.07, -0.13], 0.12],         // chargeur
      ['noir', 'box', [0.034, 0.11, 0.045], [0, -0.045, 0.012], -0.32],     // poignée
      ['noir', 'box', [0.012, 0.012, 0.075], [0, -0.012, -0.045]],          // pontet
      ['beige', 'box', [0.042, 0.07, 0.25], [0, 0.05, 0.2]],               // crosse (collée au boîtier)
      ['beige', 'box', [0.036, 0.026, 0.12], [0, 0.097, 0.2]],             // appui-joue
      ['noir', 'box', [0.046, 0.125, 0.026], [0, 0.04, 0.33]],             // plaque de couche
      ['noir', 'box', [0.034, 0.04, 0.05], [0, 0.14, -0.12]],               // point rouge
      ['acier', 'box', [0.006, 0.02, 0.03], [-0.032, 0.08, -0.2]],          // levier d'armement (côté gauche)
      ['noir', 'box', [0.01, 0.03, 0.02], [0, 0.13, -0.54]],                // guidon
    ],
    anchors: { fore: [-0.01, 0.02, -0.44], mag: [0, -0.08, -0.13], handle: [-0.045, 0.08, -0.2], handleB: [-0.045, 0.08, -0.1] },
  },
  // Pompe tactique : boîtier noir, long canon et tube magasin, garde-main olive rainuré, crosse squelette, porte-cartouches en laiton
  pompet: {
    parts: [
      ['noir', 'box', [0.056, 0.085, 0.3], [0, 0.052, -0.08]],              // boîtier
      ['acier', 'cyl', [0.017, 0.017, 0.62], [0, 0.082, -0.53]],            // canon
      ['acier', 'cyl', [0.021, 0.019, 0.05], [0, 0.082, -0.85]],            // bouche
      ['acier', 'cyl', [0.015, 0.015, 0.5], [0, 0.036, -0.47]],             // tube magasin
      ['olive', 'box', [0.058, 0.058, 0.22], [0, 0.04, -0.42]],             // garde-main
      ['noir', 'box', [0.06, 0.008, 0.2], [0, 0.04, -0.42]],                // rainure
      ['noir', 'box', [0.034, 0.11, 0.045], [0, -0.045, 0.012], -0.32],     // poignée
      ['noir', 'box', [0.012, 0.012, 0.075], [0, -0.012, -0.045]],          // pontet
      ['acier', 'box', [0.012, 0.012, 0.26], [0.02, 0.03, 0.18]], ['acier', 'box', [0.012, 0.012, 0.26], [-0.02, 0.03, 0.18]], ['acier', 'box', [0.012, 0.012, 0.27], [0, 0.085, 0.19]], // crosse squelette
      ['noir', 'box', [0.045, 0.12, 0.022], [0, 0.045, 0.32]],              // plaque de couche
      ['noir', 'box', [0.006, 0.034, 0.13], [0.031, 0.05, -0.1]],           // porte-cartouches
      ['laiton', 'box', [0.008, 0.026, 0.018], [0.036, 0.05, -0.15]], ['laiton', 'box', [0.008, 0.026, 0.018], [0.036, 0.05, -0.12]], ['laiton', 'box', [0.008, 0.026, 0.018], [0.036, 0.05, -0.09]], ['laiton', 'box', [0.008, 0.026, 0.018], [0.036, 0.05, -0.06]],
      ['noir', 'box', [0.03, 0.02, 0.03], [0, 0.105, -0.02]],               // œilleton
      ['noir', 'box', [0.008, 0.024, 0.012], [0, 0.105, -0.8]],             // guidon
    ],
    anchors: { fore: [-0.01, 0.01, -0.42], foreB: [-0.01, 0.01, -0.34], port: [0, -0.005, -0.12] },
  },
};
export const PROC_WEAPONS = Object.keys(DESIGNS);

export function buildProcWeapon(THREE, mergeGeometries, name) {
  const D = DESIGNS[name]; const body = assemble(THREE, mergeGeometries, D.parts);
  const off = new THREE.Vector3(...GRIP_AT); body.position.copy(off);
  const object = new THREE.Group(); object.add(body); object.name = 'arme-' + name; object.updateMatrixWorld(true);
  const anchors = { grip: [...GRIP_AT] }; for (const k in D.anchors) { const a = D.anchors[k]; anchors[k] = [a[0] + off.x, a[1] + off.y, a[2] + off.z]; }
  const box = new THREE.Box3().setFromObject(object);
  const muzzleY = (name === 'pompet' ? 0.082 : 0.07) + off.y;
  return { object, anchors, muzzle: box.min.z, muzzleY };
}
