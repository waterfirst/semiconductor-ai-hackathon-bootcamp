import { ContactShadows, Html, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MathUtils, Vector3 } from 'three'
import type { Group, Mesh } from 'three'
import type { Scenario, SessionState } from './types'

// 좌표는 임의값이 아니라 fab_floor.glb 안 장비의 실제 중심이다.
// assets/blender/convert_fab.py 가 [tool] 줄로 출력한 값을 그대로 옮겼다.
// 뒷열을 왼쪽에서 오른쪽으로 진행한 뒤 앞열로 내려온다.
const STATION_LAYOUT: Record<string, [number, number, number]> = {
  alert: [-5.66, 0, -2.45],       // tool_00
  data: [-1.76, 0, -2.45],        // tool_01
  doe: [2.14, 0, -2.45],          // tool_02
  analysis: [6.04, 0, -2.45],     // tool_03
  validation: [6.06, 0, 4.05],    // tool_07
  coach: [-5.64, 0, 4.16],        // tool_08
}

const TOOL_HALF = { w: 1.45, h: 1.85, d: 1.45 }

function FabFloor() {
  // 방·장비·OHT 레일은 사용자가 GPU PC 에서 만든 semiconductor_fab.blend 를
  // 쓴다. 박스 프리미티브로는 챔버·로드포트·표지가 나오지 않았다.
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/fab_floor.glb`)
  const model = useMemo(() => scene.clone(true), [scene])
  return <primitive object={model} />
}

useGLTF.preload(`${import.meta.env.BASE_URL}models/fab_floor.glb`)

function Station({
  position,
  label,
  index,
  active,
  complete,
  onSelect,
}: {
  position: [number, number, number]
  label: string
  index: number
  active: boolean
  complete: boolean
  onSelect: () => void
}) {
  const marker = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (marker.current && active) {
      marker.current.position.y = 4.15 + Math.sin(clock.elapsedTime * 2.4) * 0.12
      marker.current.rotation.y = clock.elapsedTime * 0.7
    }
  })
  const color = active ? '#00a8b5' : complete ? '#178b70' : '#65747a'

  return (
    <group position={position}>
      {/* 장비 형상은 fab_floor.glb 가 그린다. 여기서는 그 위를 덮는 클릭
          영역과 상태 표시만 둔다. opacity 0 이 아니라 낮은 값을 쓰는 이유는
          three.js 가 visible=false 인 메시를 레이캐스트에서 건너뛰기 때문이다. */}
      <mesh
        position={[0, TOOL_HALF.h, 0]}
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
      >
        <boxGeometry args={[TOOL_HALF.w * 2, TOOL_HALF.h * 2, TOOL_HALF.d * 2]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.16 : complete ? 0.08 : 0.001} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.45, 1.72, 40]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.85 : complete ? 0.5 : 0.22} />
      </mesh>
      <Html position={[0, 3.85, 0]} center distanceFactor={13}>
        <div className={`station-tag ${active ? 'active' : complete ? 'complete' : ''}`}>
          <span>{String(index + 1).padStart(2, '0')}</span>{label}
        </div>
      </Html>
      {active && (
        <mesh ref={marker} position={[0, 2.25, 0]} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#ffb21d" emissive="#7a4300" emissiveIntensity={0.8} />
        </mesh>
      )}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.05, 32]} />
        <meshBasicMaterial color={active ? '#ffb21d' : complete ? '#5dd6b7' : '#9da9ab'} />
      </mesh>
    </group>
  )
}

// 공정 설명 영상. 시나리오의 process(PHOTO, DRY ETCH ...) 를 파일명으로 바꾼다.
// 영상에 제목·단계칩·자막이 이미 구워져 있어 별도 UI 가 필요 없다.
const filmName = (process: string) => process.trim().toLowerCase().replace(/\s+/g, '_')

function ProcessFilm({ process, onEnded }: { process: string; onEnded: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const done = useRef(onEnded)
  done.current = onEnded
  const base = `${import.meta.env.BASE_URL}videos/process_${filmName(process)}`

  useEffect(() => {
    const el = video.current
    if (!el) return
    let finished = false
    let raf = 0
    const finish = () => {
      if (finished) return
      finished = true
      el.pause()
      window.clearTimeout(guard)
      window.clearTimeout(watchdog)
      if (raf) cancelAnimationFrame(raf)
      done.current()
    }
    // 입실 영상에서 겪은 것과 같은 대비책이다. 재생이 막히는 환경에서는
    // currentTime 을 직접 밀어 프레임을 넘긴다.
    let last = 0
    const scrub = (now: number) => {
      if (!last) last = now
      const dt = Math.min(0.25, (now - last) / 1000)
      last = now
      try { el.currentTime = Math.min(el.duration - 0.05, el.currentTime + dt) } catch { /* noop */ }
      if (el.currentTime >= el.duration - 0.08) { finish(); return }
      raf = requestAnimationFrame(scrub)
    }
    el.addEventListener('ended', finish)
    void el.play().catch(() => { /* watchdog 이 넘긴다 */ })
    const watchdog = window.setTimeout(() => {
      if (el.paused || el.currentTime < 0.05) { el.pause(); raf = requestAnimationFrame(scrub) }
    }, 700)
    const guard = window.setTimeout(finish, 16000)
    return () => {
      el.removeEventListener('ended', finish)
      window.clearTimeout(guard)
      window.clearTimeout(watchdog)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [base])

  return (
    <div className="process-film" role="dialog" aria-label={`${process} 공정 설명 영상`}>
      <video ref={video} src={`${base}.mp4`} poster={`${base}_cover.jpg`} muted playsInline preload="auto" />
      <button type="button" className="process-film-close" onClick={() => done.current()}>건너뛰기 ✕</button>
    </div>
  )
}

const EXHIBIT_LABELS = ['PROCESS SIGNAL', 'DATA · AI INVESTIGATION', 'SCREENING DOE', 'ANALYSIS TOOL BAY', 'HOLDOUT GATE']
const OPERATOR_LINES = [
  '평균보다 분포를 먼저 볼까?',
  'CSV를 보고 AI에게 다시 물어보자.',
  '대조군과 반복을 고정하자.',
  '최소 비용의 증거는 무엇일까?',
  'Holdout이 정말 재현됐나?',
]

function FabOperator({ target, stageIndex }: { target: [number, number, number]; stageIndex: number }) {
  const root = useRef<Group>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)
  const leftLeg = useRef<Group>(null)
  const rightLeg = useRef<Group>(null)
  const targetVector = useMemo(() => new Vector3(target[0] + .95, 0, target[2] + .85), [target])

  useFrame(({ clock }, delta) => {
    if (!root.current) return
    const distance = root.current.position.distanceTo(targetVector)
    const walking = distance > .08
    root.current.position.lerp(targetVector, 1 - Math.exp(-delta * 2.8))
    if (walking) {
      const direction = targetVector.clone().sub(root.current.position)
      root.current.rotation.y = MathUtils.lerp(root.current.rotation.y, Math.atan2(direction.x, direction.z), .12)
    }
    const swing = walking ? Math.sin(clock.elapsedTime * 8) * .62 : Math.sin(clock.elapsedTime * 2) * .08
    if (leftArm.current) leftArm.current.rotation.x = swing
    if (rightArm.current) rightArm.current.rotation.x = walking ? -swing : -.35 + swing
    if (leftLeg.current) leftLeg.current.rotation.x = -swing
    if (rightLeg.current) rightLeg.current.rotation.x = swing
    root.current.position.y = walking ? Math.abs(Math.sin(clock.elapsedTime * 8)) * .045 : 0
  })

  return <group ref={root} position={[-7, 0, -3.8]} scale={.78}>
    <group ref={leftLeg} position={[-.2, .72, 0]}><mesh position={[0,-.35,0]}><boxGeometry args={[.28,.72,.3]}/><meshStandardMaterial color="#dce9e9"/></mesh><mesh position={[0,-.72,.08]}><boxGeometry args={[.34,.18,.48]}/><meshStandardMaterial color="#14343c"/></mesh></group>
    <group ref={rightLeg} position={ [.2, .72, 0]}><mesh position={[0,-.35,0]}><boxGeometry args={[.28,.72,.3]}/><meshStandardMaterial color="#dce9e9"/></mesh><mesh position={[0,-.72,.08]}><boxGeometry args={[.34,.18,.48]}/><meshStandardMaterial color="#14343c"/></mesh></group>
    <mesh position={[0,1.25,0]}><cylinderGeometry args={[.42,.52,.9,8]}/><meshStandardMaterial color="#edf6f5" roughness={.72}/></mesh>
    <mesh position={[0,1.35,-.38]}><boxGeometry args={[.68,.62,.24]}/><meshStandardMaterial color="#b8d6d7"/></mesh>
    <mesh position={[0,1.13,.43]}><boxGeometry args={[.5,.13,.07]}/><meshStandardMaterial color="#00a8b5" emissive="#004d55" emissiveIntensity={.35}/></mesh>
    <group ref={leftArm} position={[-.53,1.55,0]}><mesh position={[0,-.38,0]}><boxGeometry args={[.25,.78,.27]}/><meshStandardMaterial color="#e7f1f0"/></mesh><mesh position={[0,-.8,0]}><sphereGeometry args={[.16,12,12]}/><meshStandardMaterial color="#6fc7c8"/></mesh></group>
    <group ref={rightArm} position={[.53,1.55,0]}><mesh position={[0,-.38,0]}><boxGeometry args={[.25,.78,.27]}/><meshStandardMaterial color="#e7f1f0"/></mesh><mesh position={[0,-.8,0]}><sphereGeometry args={[.16,12,12]}/><meshStandardMaterial color="#6fc7c8"/></mesh></group>
    <mesh position={[0,2.03,0]}><sphereGeometry args={[.48,16,12]}/><meshStandardMaterial color="#f1f7f6" roughness={.65}/></mesh>
    <mesh position={[0,2.04,.42]} scale={[1,.72,.28]}><sphereGeometry args={[.34,16,10]}/><meshStandardMaterial color="#173d46" metalness={.25} roughness={.2}/></mesh>
    <mesh position={[0,2.04,.52]} scale={[.65,.34,.08]}><sphereGeometry args={[.32,12,8]}/><meshStandardMaterial color="#75e4e6" emissive="#006670" emissiveIntensity={.4} transparent opacity={.72}/></mesh>
    <Html position={[0,2.9,0]} center distanceFactor={9}><div className="operator-dialog"><b>FAB ROOKIE</b><span>{OPERATOR_LINES[stageIndex]}</span></div></Html>
  </group>
}

function WaferDisc({ position = [0, 1.35, 0] as [number, number, number], color = '#9fe4e7', defects = false }: { position?: [number, number, number]; color?: string; defects?: boolean }) {
  return <group position={position} rotation={[Math.PI / 2, 0, 0]}>
    <mesh><cylinderGeometry args={[1.08, 1.08, 0.09, 64]} /><meshStandardMaterial color={color} metalness={0.45} roughness={0.28} /></mesh>
    <mesh position={[0, .055, 0]}><ringGeometry args={[.98, 1.06, 64]} /><meshBasicMaterial color={defects ? '#ff9d00' : '#2a9e93'} /></mesh>
    {defects && [[.75,.55],[-.72,.58],[.88,-.35],[-.8,-.42],[.25,-.94]].map(([x, z], index) => <mesh key={index} position={[x,.09,z]}><sphereGeometry args={[.09,16,16]}/><meshStandardMaterial color="#ff9d00" emissive="#7b3900" emissiveIntensity={.7}/></mesh>)}
  </group>
}

function MentorConsole() {
  const nodes = [[-1.2,1.7,-.2],[-.65,2.35,.1],[.25,2.55,0],[1.05,2.05,.15],[1.25,1.25,-.1]] as [number,number,number][]
  return <group>
    <mesh position={[0,.45,0]}><boxGeometry args={[2.6,.75,1.4]}/><meshStandardMaterial color="#173d46" metalness={.2}/></mesh>
    <mesh position={[0,1.25,.28]} rotation={[-.18,0,0]}><boxGeometry args={[2.15,1.15,.1]}/><meshStandardMaterial color="#00a8b5" emissive="#004f57" emissiveIntensity={.55}/></mesh>
    {nodes.map((position,index)=><mesh key={index} position={position}><sphereGeometry args={[.13,16,16]}/><meshStandardMaterial color={index===2?'#ffb21d':'#dffcff'} emissive="#006e76" emissiveIntensity={.5}/></mesh>)}
    <Html position={[0,1.28,.38]} center distanceFactor={9}><div className="console-copy"><b>AI WORKBENCH</b><span>질문 복사 → 외부 분석 → 답변 저장</span></div></Html>
  </group>
}

function WaferMap() {
  const cells = Array.from({ length: 49 }, (_, index) => ({ x: index % 7 - 3, z: Math.floor(index / 7) - 3 }))
  return <group position={[0,.12,0]}>{cells.map(({x,z}) => {
    const radius = Math.hypot(x,z); if (radius > 3.45) return null
    const risk = radius > 2.45 && (x + z) % 2 === 0
    return <mesh key={`${x}-${z}`} position={[x*.32, risk ? .22 : .12, z*.32]}><boxGeometry args={[.27, risk ? .42 : .2,.27]}/><meshStandardMaterial color={risk?'#e58a00':'#59b9bf'} /></mesh>
  })}<mesh position={[0,.015,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.12,1.18,48]}/><meshBasicMaterial color="#071d24"/></mesh></group>
}

function DoeMatrix() {
  const values = [.35,.72,.48,.82,1.18,.65,.42,.9,.55]
  return <group position={[0,0,0]}>{values.map((height,index)=>{
    const x=index%3-1, z=Math.floor(index/3)-1
    return <group key={index} position={[x*.65,0,z*.65]}><mesh position={[0,height/2,0]}><boxGeometry args={[.46,height,.46]}/><meshStandardMaterial color={index===4?'#ffb21d':'#2ba7af'}/></mesh><Html position={[0,height+.18,0]} center distanceFactor={9}><span className="doe-value">{index+1}</span></Html></group>
  })}</group>
}

function AnalysisTools() {
  return <group>
    <group position={[-1.15,0,0]}><mesh position={[0,.65,0]}><boxGeometry args={[.85,1.3,.9]}/><meshStandardMaterial color="#31535b"/></mesh><mesh position={[0,1.55,0]}><cylinderGeometry args={[.28,.4,.65,24]}/><meshStandardMaterial color="#dbe6e7"/></mesh><Html position={[0,2,0]} center distanceFactor={9}><span className="tool-tag">SEM</span></Html></group>
    <group position={[0,0,.1]}><mesh position={[0,.32,0]}><cylinderGeometry args={[.72,.72,.18,48]}/><meshStandardMaterial color="#9fe4e7" metalness={.5}/></mesh><mesh position={[0,1.05,0]}><cylinderGeometry args={[.12,.22,1.1,24]}/><meshStandardMaterial color="#ffb21d"/></mesh><Html position={[0,1.8,0]} center distanceFactor={9}><span className="tool-tag">OPTICAL CD</span></Html></group>
    <group position={[1.2,0,0]}><mesh position={[0,.6,0]}><boxGeometry args={[.9,1.2,.9]}/><meshStandardMaterial color="#31535b"/></mesh><mesh position={[0,1.34,.32]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.27,.07,12,32]}/><meshStandardMaterial color="#ffb21d"/></mesh><Html position={[0,1.9,0]} center distanceFactor={9}><span className="tool-tag">I–V</span></Html></group>
  </group>
}

function ValidationGate() {
  return <group><WaferDisc position={[-1.15,1.05,0]} color="#b9c6c8" defects/><WaferDisc position={[1.15,1.05,0]} color="#82d8c3"/><mesh position={[0,1.1,0]} rotation={[0,0,-Math.PI/2]}><coneGeometry args={[.22,.65,20]}/><meshStandardMaterial color="#ffb21d"/></mesh><Html position={[-1.15,2.45,0]} center distanceFactor={10}><span className="tool-tag muted">BASELINE</span></Html><Html position={[1.15,2.45,0]} center distanceFactor={10}><span className="tool-tag">HOLDOUT</span></Html></group>
}

function StageExhibit({ stageIndex, onSelect }: { stageIndex: number; onSelect: () => void }) {
  const exhibit = useRef<Group>(null)
  useFrame(({ clock }) => { if (exhibit.current) exhibit.current.position.y = .15 + Math.sin(clock.elapsedTime * 1.4) * .045 })
  return <group
    ref={exhibit}
    position={[0,.15,-.15]}
    onClick={(event) => { event.stopPropagation(); onSelect() }}
    onPointerOver={() => { document.body.style.cursor = 'pointer' }}
    onPointerOut={() => { document.body.style.cursor = 'default' }}
  >
    {stageIndex === 0 && <WaferDisc defects/>}
    {stageIndex === 1 && <><MentorConsole/><group position={[0,0,-1.8]} scale={.72}><WaferMap/></group></>}
    {stageIndex === 2 && <DoeMatrix/>}
    {stageIndex === 3 && <AnalysisTools/>}
    {stageIndex === 4 && <ValidationGate/>}
  </group>
}

export function FabScene({ scenario, session, onStationSelect }: { scenario: Scenario; session: SessionState; onStationSelect: (index: number) => void }) {
  const stageIndex = session.stage_index
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const pathPoints = useMemo(() => scenario.stages.map((stage) => STATION_LAYOUT[stage.station]), [scenario])
  // 전시물을 누르면 공정 영상을 덮어 재생하고, 끝나면 다시 3D 로 돌아온다.
  const [filmOpen, setFilmOpen] = useState(false)
  // 공정이 바뀌면 남아 있던 영상을 닫는다.
  useEffect(() => { setFilmOpen(false) }, [scenario.id])
  return (
    <div className="scene-wrap" aria-label="가상 팹 공정 스테이션">
      <Canvas camera={{ position: [13.5, 11.5, 16.5], fov: 42 }} dpr={[1, 1.65]} frameloop={reducedMotion ? 'demand' : 'always'}>
        <color attach="background" args={['#e8eff0']} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[5, 10, 6]} intensity={2.2} castShadow />
        <FabFloor />
        <StageExhibit key={stageIndex} stageIndex={stageIndex} onSelect={() => setFilmOpen(true)} />
        <FabOperator target={pathPoints[stageIndex]} stageIndex={stageIndex}/>
        {pathPoints.map((point, index) => index < pathPoints.length - 1 && (
          <mesh key={`path-${index}`} position={[(point[0] + pathPoints[index + 1][0]) / 2, 0.015, (point[2] + pathPoints[index + 1][2]) / 2]} rotation={[-Math.PI / 2, 0, Math.atan2(pathPoints[index + 1][2] - point[2], pathPoints[index + 1][0] - point[0])] }>
            <planeGeometry args={[Math.hypot(pathPoints[index + 1][0] - point[0], pathPoints[index + 1][2] - point[2]), 0.08]} />
            <meshBasicMaterial color={index < stageIndex ? '#178b70' : '#9fb0b3'} />
          </mesh>
        ))}
        {scenario.stages.map((stage, index) => (
          <Station
            key={stage.id}
            position={STATION_LAYOUT[stage.station]}
            label={stage.label}
            index={index}
            active={index === stageIndex}
            complete={index < stageIndex}
            onSelect={() => onStationSelect(index)}
          />
        ))}
        <ContactShadows position={[0, 0.02, 0]} opacity={0.22} scale={22} blur={2.6} far={9} />
        <OrbitControls enablePan={false} minDistance={16} maxDistance={38} minPolarAngle={0.72} maxPolarAngle={1.2} target={[0, 1.2, 0]} />
      </Canvas>
      <button type="button" className="exhibit-label exhibit-play" onClick={() => setFilmOpen(true)} aria-label={`${scenario.process} 공정 설명 영상 보기`}>
        <span>ACTIVE MODEL · {scenario.process}</span><b>{EXHIBIT_LABELS[stageIndex]}</b><i>▶ 공정 영상</i>
      </button>
      {filmOpen && <ProcessFilm process={scenario.process} onEnded={() => setFilmOpen(false)} />}
      <div className="mission-hud"><span>MISSION {String(stageIndex + 1).padStart(2, '0')}</span><b>{scenario.stages[stageIndex].label}</b><small>{session.completed ? 'CLEAR' : 'IN PROGRESS'} · XP {session.score}/100</small><div><i style={{ transform: `scaleX(${session.score / 100})` }}/></div></div>
      <div className="scene-help">드래그해 회전 · 휠로 확대 · 가운데 모형을 누르면 공정 영상</div>
    </div>
  )
}
