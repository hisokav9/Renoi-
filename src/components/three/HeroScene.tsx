import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { Font, type FontData } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fontJson from '../../assets/bricolage-800.typeface.json'
import { heroScroll, pointer, store } from '../../lib/store'
import { dustFragment, dustVertex, sandFragment, sandVertex, skyFragment, skyVertex } from './shaders'

const SUN = new THREE.Vector3(-0.45, 0.085, -0.89).normalize()
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

type Quality = { segments: number; dust: number; dpr: [number, number] }

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uSunDir: { value: SUN },
          uTop: { value: new THREE.Color('#05050d') },
          uMid: { value: new THREE.Color('#2a1238') },
          uHorizon: { value: new THREE.Color('#e0643a') },
          uSun: { value: new THREE.Color('#ffb066') },
          uTime: { value: 0 },
        },
      }),
    [],
  )
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
  })
  return (
    <mesh material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[150, 48, 24]} />
    </mesh>
  )
}

function Sand({ segments }: { segments: number }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(150, 130, segments, segments)
    g.rotateX(-Math.PI / 2)
    g.translate(0, 0, -40)
    return g
  }, [segments])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sandVertex,
        fragmentShader: sandFragment,
        uniforms: {
          uTime: { value: 0 },
          uSunDir: { value: SUN },
          uSandLit: { value: new THREE.Color('#ff9f5a') },
          uSandMid: { value: new THREE.Color('#4a2530') },
          uSandShadow: { value: new THREE.Color('#120b17') },
          uSky: { value: new THREE.Color('#3a2140') },
          uFogNear: { value: new THREE.Color('#3c2036') },
          uFogSun: { value: new THREE.Color('#e9774a') },
          uFog: { value: 0.019 },
        },
      }),
    [],
  )
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
  })
  return <mesh geometry={geo} material={mat} frustumCulled={false} />
}

function Dust({ count }: { count: number }) {
  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60
      pos[i * 3 + 1] = Math.random() * 6 + 0.1
      pos[i * 3 + 2] = -Math.random() * 30 + 8
      seed[i] = Math.random()
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const m = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColor: { value: new THREE.Color('#ffc58a') },
      },
    })
    return { geo: g, mat: m }
  }, [count])
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
  })
  return <points geometry={geo} material={mat} frustumCulled={false} />
}

// Ombre douce posée sur le sable, sous les lettres.
function GroundShadow() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(10,5,12,0.75)')
    g.addColorStop(0.5, 'rgba(10,5,12,0.35)')
    g.addColorStop(1, 'rgba(10,5,12,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0.4, 0.015, 0.6]} scale={[10, 2.6, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  )
}

// "samir." en lettres 3D qui sortent du sable une par une.
function Monument() {
  const font = useMemo(() => new Font(fontJson as unknown as FontData), [])
  const letters = useMemo(() => {
    const size = 2.25
    const spacing = -0.06
    const glyphs = (fontJson as unknown as { glyphs: Record<string, { ha: number }> }).glyphs
    let x = 0
    const out: { ch: string; geo: THREE.BufferGeometry; x: number }[] = []
    for (const ch of 'samir.') {
      if (ch === '.') {
        const r = size * 0.115
        const geo = new THREE.SphereGeometry(r, 48, 32)
        geo.translate(0, r, 0)
        out.push({ ch, geo, x: x + r + size * 0.04 })
        x += r * 2 + size * 0.08
        continue
      }
      const geo = new TextGeometry(ch, {
        font,
        size,
        depth: 0.6,
        curveSegments: 10,
        bevelEnabled: true,
        bevelThickness: 0.07,
        bevelSize: 0.04,
        bevelSegments: 5,
      })
      geo.computeBoundingBox()
      const bb = geo.boundingBox!
      const cx = (bb.min.x + bb.max.x) / 2
      geo.translate(-cx, 0, -0.3)
      out.push({ ch, geo, x: x + cx })
      x += (glyphs[ch].ha / 1000) * size + spacing
    }
    const total = x - spacing
    out.forEach((l) => (l.x -= total / 2))
    return out
  }, [font])

  const gold = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#f3d3a6',
        metalness: 1,
        roughness: 0.2,
        clearcoat: 0.8,
        clearcoatRoughness: 0.15,
        envMapIntensity: 1.7,
      }),
    [],
  )
  const ember = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ff7a2f',
        emissive: '#ff5a14',
        emissiveIntensity: 1.6,
        metalness: 0.1,
        roughness: 0.35,
        clearcoat: 1,
      }),
    [],
  )

  const refs = useRef<(THREE.Mesh | null)[]>([])
  const group = useRef<THREE.Group>(null)
  const t0 = useRef<number | null>(null)
  const { size } = useThree()

  useFrame((state) => {
    const ready = store.get().introDone
    if (ready && t0.current === null) t0.current = state.clock.elapsedTime
    const t = t0.current === null ? -1 : state.clock.elapsedTime - t0.current
    letters.forEach((_, i) => {
      const m = refs.current[i]
      if (!m) return
      const k = t < 0 ? 0 : easeOutExpo(clamp01((t - 0.35 - i * 0.11) / 1.7))
      m.position.y = -2.7 * (1 - k) + Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.015 * k
      m.rotation.x = -0.55 * (1 - k)
      m.rotation.z = (i % 2 ? 0.18 : -0.18) * (1 - k)
    })
    if (group.current) {
      const aspect = size.width / size.height
      const s = aspect < 1 ? Math.min(0.9, Math.max(0.5, aspect * 1.3)) : Math.min(0.84, 0.55 + aspect * 0.16)
      group.current.scale.setScalar(s)
      const p = heroScroll.p
      group.current.position.y = -p * 0.6
    }
  })

  return (
    <group ref={group}>
      {letters.map((l, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m
          }}
          geometry={l.geo}
          material={l.ch === '.' ? ember : gold}
          position={[l.x, -2.7, 0]}
        />
      ))}
      {/* lueur du point orange */}
      <pointLight position={[letters[letters.length - 1].x, 0.4, 1.2]} color="#ff6a22" intensity={3} distance={4} decay={2} />
    </group>
  )
}

function Rig() {
  const { camera, size } = useThree()
  const cur = useRef(new THREE.Vector3(0, 0.7, 17))
  const look = useRef(new THREE.Vector3(0, 1.2, 0))
  const start = useRef<number | null>(null)
  const sm = useRef({ x: 0, y: 0 })

  useFrame((state, dt) => {
    const ready = store.get().introDone
    if (ready && start.current === null) start.current = state.clock.elapsedTime
    const t = start.current === null ? 0 : clamp01((state.clock.elapsedTime - start.current) / 3.4)
    const k = easeInOutCubic(t)
    const aspect = size.width / size.height
    const portrait = aspect < 1
    const baseZ = portrait ? 13 + (1 - aspect) * 6 : 10.6
    const baseY = portrait ? 1.0 : 1.55
    const p = heroScroll.p

    sm.current.x += (pointer.x - sm.current.x) * Math.min(1, dt * 2.5)
    sm.current.y += (pointer.y - sm.current.y) * Math.min(1, dt * 2.5)

    const tx = sm.current.x * 0.9 + Math.sin(state.clock.elapsedTime * 0.12) * 0.35
    const ty = baseY + 0.25 - sm.current.y * 0.35 + p * 2.6
    const tz = THREE.MathUtils.lerp(19, baseZ, k) - p * 5.5
    cur.current.set(THREE.MathUtils.lerp(-3, tx, k), THREE.MathUtils.lerp(0.55, ty, k), tz)
    camera.position.copy(cur.current)
    const ly = (portrait ? -0.9 : -0.42) - p * 0.4
    look.current.set(sm.current.x * 0.3, THREE.MathUtils.lerp(1.8, ly, k), 0)
    camera.lookAt(look.current)
  })
  return null
}

function Reflections() {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.5
  })
  return (
    <Environment resolution={256} frames={Infinity}>
      <group ref={ref}>
        <Lightformer form="rect" intensity={6} color="#ff8a45" position={[-8, 2, -10]} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#7a4a8a" position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#ffd2a6" position={[0, 1.4, 16]} scale={[28, 4, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#ffc08a" position={[0, -2.2, 16]} scale={[28, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffe9d0" position={[0, 5.5, 14]} scale={[28, 2, 1]} />
        <Lightformer form="rect" intensity={3} color="#fff1df" position={[7, 2.5, 6]} rotation-y={-0.6} scale={[1.2, 8, 1]} />
        <Lightformer form="ring" intensity={4} color="#ffb36b" position={[-12, 1.5, -4]} scale={4} />
        <Lightformer form="rect" intensity={0.8} color="#3a1f45" position={[0, -3, 6]} rotation-x={-Math.PI / 2} scale={[20, 10, 1]} />
      </group>
    </Environment>
  )
}

function ReadySignal() {
  const { gl } = useThree()
  useEffect(() => {
    const id = requestAnimationFrame(() => store.set({ sceneReady: true }))
    return () => cancelAnimationFrame(id)
  }, [gl])
  return null
}

export default function HeroScene({ active, quality }: { active: boolean; quality: Quality }) {
  return (
    <Canvas
      dpr={quality.dpr}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 42, near: 0.1, far: 400, position: [0, 0.7, 17] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <color attach="background" args={['#07060a']} />
      <Sky />
      <Sand segments={quality.segments} />
      <GroundShadow />
      <Monument />
      <Dust count={quality.dust} />
      <ambientLight intensity={0.25} color="#8a6080" />
      <directionalLight position={[-9, 2.2, -7]} intensity={3.2} color="#ffa25c" />
      <directionalLight position={[4, 5, 10]} intensity={1.1} color="#ffe6cc" />
      <Reflections />
      <Rig />
      <ReadySignal />
    </Canvas>
  )
}
