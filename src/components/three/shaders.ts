// Shaders du héro : dunes du Ténéré au coucher du soleil, ciel, poussière.

export const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5;
  vec3 ox=floor(x+0.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}
float fbm(vec2 p){
  float f=0.0; float a=0.5;
  for(int i=0;i<4;i++){ f+=a*snoise(p); p=p*2.03+vec2(17.1,9.2); a*=0.5; }
  return f;
}
float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
`

// Hauteur des dunes : grandes dunes derrière, sable presque plat devant et autour des lettres.
export const heightFn = /* glsl */ `
float duneHeight(vec2 p){
  vec2 q = p + vec2(snoise(p*0.018)*7.0, snoise(p*0.018+11.0)*7.0);
  float r = sin(q.x*0.11 + q.y*0.045);
  float ridge = 1.0-abs(r);
  ridge = smoothstep(0.0, 1.0, ridge);
  ridge = ridge*ridge*(1.2 - 0.2*ridge);
  float swell = fbm(p*0.02)*1.1 + 1.0;
  float h = swell*1.1 + ridge*1.7;
  float back = smoothstep(4.0, -26.0, p.y);
  float side = smoothstep(6.0, 22.0, abs(p.x));
  float amp = clamp(max(back, side*0.7), 0.0, 1.0);
  float hole = smoothstep(2.0, 8.5, length(vec2(p.x*0.3, p.y*1.1)));
  float small = fbm(p*0.18)*0.16;
  return (h*amp*amp*1.25 + small)*hole;
}
`

export const sandVertex = /* glsl */ `
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormal2;
varying float vH;
${noise}
${heightFn}
void main(){
  vec3 p = position;
  float h = duneHeight(p.xz);
  p.y += h;
  float e = 0.12;
  float hx = duneHeight(p.xz+vec2(e,0.0)) - duneHeight(p.xz-vec2(e,0.0));
  float hz = duneHeight(p.xz+vec2(0.0,e)) - duneHeight(p.xz-vec2(0.0,e));
  vNormal2 = normalize(vec3(-hx, 2.0*e, -hz));
  vH = h;
  vec4 wp = modelMatrix*vec4(p,1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix*viewMatrix*wp;
}
`

export const sandFragment = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uSandLit;
uniform vec3 uSandMid;
uniform vec3 uSandShadow;
uniform vec3 uFogNear;
uniform vec3 uFogSun;
uniform vec3 uSky;
uniform float uTime;
uniform float uFog;
varying vec3 vWorld;
varying vec3 vNormal2;
varying float vH;
${noise}
void main(){
  vec3 n = normalize(vNormal2);
  // vaguelettes de vent dans le sable
  float rip = sin(dot(vWorld.xz, vec2(5.2, 2.1)) + snoise(vWorld.xz*0.7)*2.4);
  float ripMask = smoothstep(40.0, 4.0, length(vWorld - cameraPosition));
  n = normalize(n + vec3(rip*0.07*ripMask, 0.0, rip*0.03*ripMask));

  float diff = dot(n, uSunDir);
  float lit = smoothstep(0.08, 0.62, diff);
  vec3 col = mix(uSandShadow, uSandMid, smoothstep(-0.25, 0.22, diff));
  col = mix(col, uSandLit, lit);
  // lumière du ciel dans les ombres
  col += uSky * (0.10 + 0.12*n.y) * (1.0-lit);
  // reflets de grains de sable
  vec2 g = floor(vWorld.xz*38.0);
  float sp = step(0.9965, hash12(g + floor(uTime*0.5)));
  col += vec3(1.0,0.82,0.55) * sp * smoothstep(0.1, 0.5, diff) * ripMask * 0.8;

  vec3 V = normalize(cameraPosition - vWorld);
  float rim = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  col += uFogSun * rim * 0.25 * max(dot(-V, uSunDir), 0.0);

  float dist = length(vWorld - cameraPosition);
  float fog = 1.0 - exp(-pow(dist*uFog, 1.35));
  vec3 dir = normalize(vWorld - cameraPosition);
  float sunAmt = pow(max(dot(dir, uSunDir), 0.0), 6.0);
  vec3 fogCol = mix(uFogNear, uFogSun, sunAmt);
  col = mix(col, fogCol, clamp(fog, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`

export const skyVertex = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.0);
  gl_Position = p.xyww;
}
`

export const skyFragment = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uSun;
uniform float uTime;
varying vec3 vDir;
${noise}
void main(){
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = mix(uHorizon, uMid, smoothstep(-0.03, 0.13, y));
  col = mix(col, uTop, smoothstep(0.1, 0.55, y));
  float s = max(dot(d, uSunDir), 0.0);
  col += uSun * pow(s, 10.0) * 0.38;
  col += uSun * pow(s, 90.0) * 0.75;
  col += vec3(1.0,0.92,0.8) * smoothstep(0.99965, 0.99985, s) * 1.6;
  // voile de chaleur à l'horizon
  col += uHorizon * 0.25 * smoothstep(0.12, 0.0, abs(y)) ;
  // étoiles
  vec2 sp = d.xz/(d.y+0.35)*90.0;
  vec2 gi = floor(sp);
  float h = hash12(gi);
  float star = step(0.993, h) * smoothstep(0.25, 0.6, y);
  float tw = 0.6 + 0.4*sin(uTime*2.0 + h*60.0);
  vec2 f = fract(sp)-0.5;
  col += vec3(1.0,0.95,0.9) * star * tw * smoothstep(0.18, 0.0, length(f)) * 0.9;
  // nuages fins
  float cl = fbm(vec2(d.x*3.0 + uTime*0.004, d.y*14.0));
  col = mix(col, col*1.25 + uSun*0.06, smoothstep(0.2, 0.7, cl) * smoothstep(0.02, 0.12, y) * smoothstep(0.35, 0.15, y) * 0.5);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`

export const dustVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSeed;
varying float vAlpha;
void main(){
  vec3 p = position;
  float t = uTime*(0.25 + aSeed*0.35);
  p.x = mod(p.x + t + 30.0, 60.0) - 30.0;
  p.y += sin(uTime*0.6 + aSeed*30.0)*0.25;
  p.z += cos(uTime*0.4 + aSeed*20.0)*0.2;
  vec4 mv = modelViewMatrix*vec4(p,1.0);
  gl_Position = projectionMatrix*mv;
  gl_PointSize = (1.6 + aSeed*4.2) * uPixelRatio * (11.0 / -mv.z);
  vAlpha = (0.3 + aSeed*0.7) * smoothstep(36.0, 8.0, -mv.z) * smoothstep(2.0, 5.0, -mv.z);
}
`

export const dustFragment = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha;
  gl_FragColor = vec4(uColor, a*0.85);
}
`
