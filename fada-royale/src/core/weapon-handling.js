/* =====================================================================
   PRISE ET CHANGEMENT D'ARME — Fada Royale v1.7
   Réglages de la prise des armes (par catégorie), des étuis, des durées de changement d'arme et du coup de daba.
   Utilisé par index.html : animRealAnim() (pose de l'arme, mains par IK), beginSwitch() / updateSwitch() (étapes du changement).
   Repère du perso : droite +x, haut +y, avant −z. Angles en radians, distances en mètres.
   ===================================================================== */
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, smooth=(e0,e1,x)=>{ const t=clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); };

/* ---------- prises et animations des armes (v1.1) ----------
   hands : 1 = revolver tenu à une main hors combat (deux mains pour viser / tirer), 2 = toujours à deux mains
   sw : catégorie de changement d'arme (durées SWITCH_T) ; cls : catégorie de prise (HOLD) et d'étui (STOW) */
export const GRIP={
  revolver:    {sw:'pistol',cls:'pistol',hands:1},
  mitraillette:{sw:'long',cls:'long',hands:2},
  fusil:       {sw:'long',cls:'long',hands:2},
  pompe:       {sw:'long',cls:'long',hands:2},
  mitrailleuse:{sw:'lmg',cls:'long',hands:2},
  sniper:      {sw:'sniper',cls:'long',hands:2},
  tactique:    {sw:'long',cls:'long',hands:2},   // v2.0 : fusil tactique
  pompet:      {sw:'long',cls:'long',hands:2},   // v2.0 : pompe tactique
};
/* v1.7 : poses de prise par catégorie, à partir de l'articulation de l'épaule droite (repère du perso : droite +x, haut +y, avant −z).
   o : décalage du pivot par rapport à l'épaule ; r : [lever, tourner vers la gauche] ajoutés à la visée ; k : part de l'inclinaison de la
   visée suivie ; tw : torsion du buste (épaule droite en arrière : le tireur se met de profil, la main gauche atteint le garde-main) ;
   h : position de l'arme sous le pivot (armes longues : la crosse est mise au pivot, h ne fait qu'ajuster).
   low = arme basse (exploration), combat = tir à la hanche / épaule, ads = visée, sprint = arme en travers */
export const HOLD={
  long:{ low:{o:[0.07,-0.08,-0.06],r:[-0.24,0.06],k:0.55,tw:0.4,h:[0,0,0]}, combat:{o:[0.08,-0.05,-0.08],r:[0,0],k:0.9,tw:0.5,h:[0,0,0]},
         ads:{o:[0.05,0.02,-0.07],r:[0,0],k:1,tw:0.55,h:[0,0,0]}, sprint:{o:[0.02,-0.12,-0.2],r:[0.3,0.85],k:0.1,tw:0.1,h:[0,0,0]} },
  pistol:{ low:{o:[0,-0.045,-0.07],r:[-1.0,0.1],k:0.2,tw:0,h:[0.08,-0.24,-0.1]}, combat:{o:[0.04,-0.07,-0.06],r:[0,0],k:0.9,tw:0.3,h:[0,0,-0.4]},
         ads:{o:[0.02,0.0,-0.06],r:[0,0],k:1,tw:0.35,h:[0,0,-0.42]}, sprint:{o:[0,-0.045,-0.07],r:[-1.0,0.1],k:0.2,tw:0,h:[0.08,-0.24,-0.1]} },
};
// v1.7 : étuis (même repère que HOLD) : armes longues dans le dos derrière l'épaule droite (canon en haut), revolver et daba à la hanche
export const STOW={ long:{o:[0.02,0.08,0.16],r:[1.3,-0.25],h:[0,0,0]}, pistol:{o:[0.1,-0.45,0.08],r:[-1.5,0],h:[0,0,-0.05]}, melee:{o:[0.1,-0.42,0.05],r:[-1.4,-0.2],h:[0,0,-0.12],hr:1.2} };

export const SWITCH_T={pistol:[0.12,0.2],long:[0.16,0.26],sniper:[0.18,0.32],lmg:[0.24,0.4],melee:[0.12,0.18]};
export const swTimes=w=>SWITCH_T[w==='daba'?'melee':(GRIP[w]&&GRIP[w].sw)||'long'];
export const stowOf=w=>w==='daba'?'melee':(GRIP[w]&&GRIP[w].cls)||'long';
// étape intermédiaire (3) : transition du bras, la main vide va d'un étui à l'autre (dos ↔ hanche)
export const SW_ARM=0.14;

/* v1.7 : daba (arme de mêlée) tenue par la main droite (IK sur le manche), lame en avant. Coup : le bras se lève au-dessus de l'épaule
   droite (daba en arrière), puis frappe vers l'avant et le bas : à l'impact le manche est à l'horizontale et la lame tombe sur la cible.
   Clés [u (0→1 sur la durée du coup), levée du bras (rad), angle de la daba par rapport au bras, rotation vers l'intérieur] */
export const DABA_K=[[0,-1.15,1.25,-0.22],[0.36,1.95,1.0,0.05],[0.6,-0.45,0.45,0.18],[0.76,-0.9,0.3,0.15],[1,-1.15,1.25,-0.22]];
export const DABA_HIT=0.6; // moment du coup (part de la durée) : les dégâts sont appliqués là

export function dabaKey(u,out){ let i=0; while(i<DABA_K.length-2&&u>=DABA_K[i+1][0]) i++; const a=DABA_K[i], b=DABA_K[i+1], e=smooth(0,1,(u-a[0])/(b[0]-a[0]));
  out[0]=lerp(a[1],b[1],e); out[1]=lerp(a[2],b[2],e); out[2]=lerp(a[3],b[3],e); return out; }
