/* =====================================================================
   ARMES — Fada Royale v1.2
   Modèles créés pour le jeu (assets/armes/*.glb) à partir des images générées pour Fada Royale.
   Ce sont des modèles « 2.5D » : chaque fichier est l'extrusion arrondie de l'image découpée de l'arme,
   donc sa boîte englobante correspond exactement au cadre de l'image (canon vers −Z, haut +Y, en mètres).

   On décrit chaque arme en % de son image (u : de gauche à droite, v : de haut en bas) :
   - muzzle : côté du canon dans l'image ('right' ou 'left')
   - bore   : deux points sur l'axe du canon (arrière, avant) : l'arme est tournée pour que cet axe soit horizontal
              (les images vues de trois quarts ont un canon incliné)
   - grip   : la poignée, placée au point de prise commun à toutes les armes du jeu (GRIP_AT)
   - anchors: les autres points d'appui des mains [u, v, x] (x = décalage latéral en mètres, côté droit > 0)
   Les rechargements (index.html : RELOAD, BOLT, PUMP) utilisent ces noms de points.
   ===================================================================== */

export const GRIP_AT = [0, -0.05, 0.07];

export const WEAPONS = {
  fusil: { file: 'fusil-arme', muzzle: 'right', bore: [[75, 26], [99, 25]], grip: [32.5, 52],
    anchors: { fore: [66, 31, -0.01], mag: [50, 60, 0], handle: [57, 22, 0.03], handleB: [50, 22, 0.03] },
    mag: { file: 'fusil-piece1', len: 0.24 } },
  mitraillette: { file: 'mitraillette-arme', muzzle: 'right', bore: [[27, 30], [99, 45]], grip: [37, 62],
    anchors: { fore: [72, 47, -0.01], mag: [59, 62, 0], slap: [78, 24, -0.03], slapU: [78, 15, -0.03] },
    mag: { file: 'mitraillette-piece1', len: 0.24 } },
  pompe: { file: 'pompe-arme', muzzle: 'left', bore: [[62, 9], [5, 22]], grip: [84, 60],
    anchors: { fore: [42, 66, -0.01], foreB: [52, 66, -0.01], port: [72, 55, 0] } },
  sniper: { file: 'sniper-arme', muzzle: 'right', bore: [[45, 40], [99, 39]], grip: [36, 62],
    anchors: { fore: [68, 50, -0.01], mag: [48, 56, 0], bolt: [45, 49, 0.04], boltB: [40, 49, 0.04] },
    mag: { file: 'sniper-piece1', len: 0.11 } },
  mitrailleuse: { file: 'mitrailleuse-arme', muzzle: 'right', bore: [[30, 47], [99, 16]], grip: [37, 70],
    anchors: { fore: [63, 37, -0.01], mag: [55, 58, -0.04], cover: [43, 29, 0], coverU: [43, 19, 0], handle: [48, 47, 0.04], handleB: [42, 47, 0.04] },
    mag: { file: 'mitrailleuse-piece1', len: 0.2, kind: 'box' } },
  // daba : la main tient le manche ; « canon » = sens de la lame (vers l'avant), le manche est remis à l'horizontale
  daba: { file: 'daba-arme', muzzle: 'left', bore: [[96, 14], [50, 40]], grip: [78, 10], at: [0, 0, 0], anchors: {} },
};

// point de l'image (u, v en %) -> repère du modèle d'origine
function uvToModel(THREE, box, side, u, v) {
  const L = box.max.z - box.min.z, H = box.max.y - box.min.y;
  const z = side === 'right' ? box.max.z - (u / 100) * L : box.min.z + (u / 100) * L;
  return new THREE.Vector3(0, box.max.y - (v / 100) * H, z);
}

/* Cale un modèle d'arme : renvoie { object, anchors, muzzle, muzzleY }.
   object : groupe prêt à être tenu (poignée au point de prise, canon horizontal vers −Z). */
export function fitWeapon(THREE, scene, name) {
  const cfg = WEAPONS[name];
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  const P = (uv) => uvToModel(THREE, box, cfg.muzzle, uv[0], uv[1]);
  const a = P(cfg.bore[0]), b = P(cfg.bore[1]);
  const theta = Math.atan((b.y - a.y) / (b.z - a.z));          // remet l'axe du canon à l'horizontale
  const rot = new THREE.Group(); rot.rotation.x = theta; rot.add(scene);
  const R = new THREE.Matrix4().makeRotationX(theta);
  const at = new THREE.Vector3(...(cfg.at || GRIP_AT));
  const off = at.clone().sub(P(cfg.grip).applyMatrix4(R));
  const object = new THREE.Group(); object.add(rot); rot.position.copy(off); object.name = 'arme-' + name;
  const T = (uv, x) => { const p = P(uv).applyMatrix4(R).add(off); p.x = x || 0; return [p.x, p.y, p.z]; };
  const anchors = { grip: [at.x, at.y, at.z] };
  for (const k in cfg.anchors) anchors[k] = T(cfg.anchors[k], cfg.anchors[k][2]);
  object.updateMatrixWorld(true);
  const ob = new THREE.Box3().setFromObject(object);
  const front = new THREE.Vector3(...T(cfg.bore[1]));
  return { object, anchors, muzzle: ob.min.z, muzzleY: front.y };
}

/* Pièce détachable (chargeur, caisse) : centrée, plus grande dimension ramenée à len (m), posée debout (axe long vertical). */
export function fitPiece(THREE, scene, len) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene), s = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const k = len / Math.max(s.x, s.y, s.z);
  const inner = new THREE.Group(); inner.add(scene); scene.position.sub(c);
  if (s.z > s.y && s.z >= s.x) inner.rotation.x = Math.PI / 2;   // couché dans l'image : on le redresse
  inner.scale.setScalar(k);
  const object = new THREE.Group(); object.add(inner); object.position.y = -0.04;
  const holder = new THREE.Group(); holder.add(object);
  return holder;
}
