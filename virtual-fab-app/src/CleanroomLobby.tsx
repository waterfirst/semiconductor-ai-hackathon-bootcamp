import { ContactShadows, Environment, Html, Lightformer, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MathUtils, Vector3 } from 'three'
import type { Group, Mesh } from 'three'
import type { ScenarioSummary } from './types'

const ENTRY_STEPS = [
  { code: 'ACCESS', title: '환영합니다', copy: '가상 반도체 팹 FACILITY 01에 오셨습니다. 이곳은 취업 준비를 위한 교육용 가상 환경입니다. 평균값 뒤에 숨은 이상 신호를 데이터로 추적하고, 제한된 시간과 예산 안에서 원인을 좁혀 보세요.', action: '출입 등록 시작' },
  { code: 'WASH', title: '손 씻기', copy: '손과 손목의 오염원을 제거한다. 실제 클린룸 절차를 단순화한 교육 장면이며, 이 게임의 본체는 입실 뒤 시작되는 불량 원인 진단이다.', action: '세정 완료' },
  { code: 'MASK', title: '마스크 착용', copy: '비말과 호흡 입자의 유입을 줄인다. 마스크가 얼굴을 완전히 덮었는지 확인한 뒤 다음 준비실로 이동한다.', action: '마스크 착용' },
  { code: 'GOWN', title: '방진복 착용', copy: '머리카락과 의복에서 발생하는 입자를 격리한다. 장갑·후드·방진복이 준비되면 오염 구역과 청정 구역의 경계를 통과할 수 있다.', action: '방진복 착용' },
  { code: 'AIR SHOWER', title: '에어샤워 통과', copy: '고속 청정 공기가 방진복 표면의 잔류 입자를 제거한다. 문이 열리면 여섯 공정룸 중 하나를 골라 실제 사건 해결을 시작한다.', action: '에어샤워 가동' },
] as const

const ENTRY_POSITIONS: Array<[number, number, number]> = [
  [-5.6, 0, 1.5], [-3.4, 0, 1.52], [-1.2, 0, 1.38], [1.15, 0, 1.46], [3.55, 0, -.08], [3.55, 0, -2.25],
]

// 입실 5단계는 Blender 로 렌더한 영상으로 보여준다. 코드로 만든 3D 로비는
// 캡슐·박스 조합이라 손을 씻거나 방진복을 입는 동작을 표현할 수 없었다.
// 구간 시각은 원본 스토리보드의 프레임값(12fps 기준 1/96/180/258/348)이다.
const FILM_SRC = `${import.meta.env.BASE_URL}media/cleanroom_entry.mp4`
const FILM_POSTER = `${import.meta.env.BASE_URL}media/cleanroom_entry_cover.jpg`
const FILM_SEGMENTS: Array<[number, number]> = [
  [0.000, 7.917], [7.917, 14.917], [14.917, 21.417], [21.417, 28.917], [28.917, 38.000],
]

function LobbyFilm({ step, acting, filmRef, onSegmentEnd }: { step: number; acting: boolean; filmRef: React.RefObject<HTMLVideoElement | null>; onSegmentEnd: () => void }) {
  const done = useRef(onSegmentEnd)
  done.current = onSegmentEnd
  const index = Math.min(step, FILM_SEGMENTS.length - 1)

  // 단계가 바뀌면 그 구간 첫 프레임에 멈춰 선다.
  useEffect(() => {
    const el = filmRef.current
    if (!el) return
    el.pause()
    try { el.currentTime = FILM_SEGMENTS[index][0] } catch { /* metadata 미도착 */ }
  }, [filmRef, index])

  useEffect(() => {
    const el = filmRef.current
    if (!el || !acting) return
    const [start, end] = FILM_SEGMENTS[index]
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      el.pause()
      // 재생이 막혔다면 최소한 구간의 끝 화면은 보여준다. 포스터에 멈춰 있으면
      // 사용자에게는 아무 일도 일어나지 않은 것처럼 보인다.
      if (el.currentTime < end - 0.3) { try { el.currentTime = end - 0.1 } catch { /* noop */ } }
      el.removeEventListener('timeupdate', tick)
      window.clearTimeout(guard)
      window.clearTimeout(watchdog)
      if (raf) cancelAnimationFrame(raf)
      done.current()
    }
    const tick = () => { if (el.currentTime >= end - 0.06) finish() }
    el.addEventListener('timeupdate', tick)
    const guard = window.setTimeout(finish, (end - start) * 1000 + 3200)

    // 재생이 막히는 환경이 있다. 그때는 프레임을 직접 넘겨 움직임을 만든다.
    // 영상이 아니라 단계별 스틸로 보이던 증상의 최종 대비책이다.
    let raf = 0
    let scrubbing = false
    let last = 0
    const scrub = (now: number) => {
      if (!last) last = now
      const dt = Math.min(0.25, (now - last) / 1000)
      last = now
      try { el.currentTime = Math.min(end - 0.05, el.currentTime + dt) } catch { /* noop */ }
      if (el.currentTime >= end - 0.08) { finish(); return }
      raf = requestAnimationFrame(scrub)
    }
    const startScrub = () => {
      if (scrubbing || finished) return
      scrubbing = true
      el.pause()
      raf = requestAnimationFrame(scrub)
    }
    if (el.paused) void el.play().catch(() => { /* watchdog 이 스크럽으로 넘긴다 */ })
    // 0.6초 안에 재생이 실제로 진행되지 않으면 직접 넘기기로 전환한다.
    const watchdog = window.setTimeout(() => {
      if (el.paused || el.currentTime <= start + 0.05) startScrub()
    }, 600)

    return () => {
      el.removeEventListener('timeupdate', tick)
      window.clearTimeout(guard)
      window.clearTimeout(watchdog)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [acting, filmRef, index])

  return <video
    ref={filmRef}
    className="lobby-film"
    src={FILM_SRC}
    poster={FILM_POSTER}
    muted
    playsInline
    preload="auto"
    aria-label="클린룸 입실 절차 애니메이션"
  />
}

const ACTION_DURATIONS = [650, 1850, 1550, 1950, 2250] as const
const ACTION_LABELS = ['출입 확인 중…', '손과 손목을 세정 중…', '마스크를 착용 중…', '방진복과 장갑을 착용 중…', '에어샤워 가동 중…'] as const

// 준비실을 지날 때 카메라가 따라 걷도록 단계별 위치를 준다. 이전에는 위치가
// (6.8, 4.2, 8.5) 로 고정이고 시선만 돌아서, 손씻기에서 에어샤워까지 이동해도
// 화면이 제자리에서 고개만 돌리는 느낌이었다.
const CAMERA_STATIONS: Array<[number, number, number]> = [
  [-2.6, 3.55, 7.5], [-.75, 3.45, 7.3], [1.1, 3.35, 7.0], [3.0, 3.2, 6.7], [5.1, 2.95, 5.6],
]

// 진입 연출: 에어샤워 문이 열리면 눈높이로 낮추고 앞으로 밀어 넣는다.
const CINEMATIC_POSITION = new Vector3(4.55, 1.95, 1.35)
const CINEMATIC_LOOK = new Vector3(3.55, 1.12, -2.6)
const HALL_POSITION = new Vector3(0, 5.3, 10.8)
const HALL_LOOK = new Vector3(0, 1.1, -2.2)

// 지수감쇠(lerp)는 항상 감속만 해서 흐물거린다. 가속 뒤 감속하는 곡선으로 바꾼다.
const easeInOutCubic = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

function CameraRig({ step, hall, cinematic, reducedMotion }: { step: number; hall: boolean; cinematic: boolean; reducedMotion: boolean }) {
  const { camera } = useThree()
  const stationIndex = Math.min(step, CAMERA_STATIONS.length - 1)
  const targetPosition = useMemo(() => hall ? HALL_POSITION.clone() : cinematic ? CINEMATIC_POSITION.clone() : new Vector3(...CAMERA_STATIONS[stationIndex]), [cinematic, hall, stationIndex])
  const targetLook = useMemo(() => hall ? HALL_LOOK.clone() : cinematic ? CINEMATIC_LOOK.clone() : new Vector3(ENTRY_POSITIONS[step][0], 1, ENTRY_POSITIONS[step][2]), [cinematic, hall, step])

  // 구간 시작점을 기억해 두고 0→1 진행도로 보간한다. 목표가 바뀔 때마다 재시작한다.
  const fromPosition = useRef(new Vector3())
  const fromLook = useRef(new Vector3())
  const currentLook = useRef(new Vector3())
  const progress = useRef(1)
  const duration = hall ? 1.6 : cinematic ? 2.4 : 1.05

  useEffect(() => {
    if (reducedMotion) {
      camera.position.copy(targetPosition)
      currentLook.current.copy(targetLook)
      camera.lookAt(targetLook)
      camera.updateProjectionMatrix()
      return
    }
    fromPosition.current.copy(camera.position)
    fromLook.current.copy(currentLook.current.lengthSq() ? currentLook.current : targetLook)
    progress.current = 0
  }, [camera, reducedMotion, targetLook, targetPosition])

  useFrame((_, delta) => {
    if (reducedMotion) return
    progress.current = Math.min(1, progress.current + delta / duration)
    const eased = easeInOutCubic(progress.current)
    camera.position.lerpVectors(fromPosition.current, targetPosition, eased)
    // 시선도 같이 보간한다. 이전에는 목표가 바뀌는 순간 lookAt 이 튀었다.
    currentLook.current.lerpVectors(fromLook.current, targetLook, eased)
    camera.lookAt(currentLook.current)
  })
  return null
}

function FacilityShell({ hall }: { hall: boolean }) {
  // 벽·바닥·천장·집기는 Blender 에서 만든 cleanroom.glb 를 쓴다.
  // 박스 프리미티브로는 패널 이음매·코빙·FFU 격자·그레이팅을 표현할 수 없었다.
  // 원본 스크립트: assets/blender/cleanroom_shell.py
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/cleanroom.glb`)
  const shell = useMemo(() => scene.clone(true), [scene])
  return <group>
    <primitive object={shell}/>
    {/* 조명과 안개는 hall 전환에 따라 바뀌므로 코드에 남긴다. */}
    {[-6,-3,0,3,6].map((x) => <pointLight key={x} position={[x,4.6,0]} color={hall ? '#51f4ff' : '#c8ffff'} intensity={hall ? 6 : 2.5} distance={6}/>)}
    <fog attach="fog" args={[hall ? '#071c23' : '#dbe8e8', 11, 25]}/>
  </group>
}

useGLTF.preload(`${import.meta.env.BASE_URL}models/cleanroom.glb`)

function SinkStation({ active, running }: { active: boolean; running: boolean }) {
  const water = useRef<Mesh>(null)
  useFrame(({ clock }) => { if (water.current && running) water.current.scale.y = .8 + Math.sin(clock.elapsedTime * 10) * .14 })
  // 형상은 cleanroom.glb 에 있다. 여기 남는 것은 움직이거나 상태에 따라 바뀌는 것뿐이다.
  return <group position={[-3.4,0,.6]}>
    {running && <mesh ref={water} position={[0,1.02,-.02]}><cylinderGeometry args={[.035,.05,.34,10]}/><meshStandardMaterial color="#bfefff" transparent opacity={.72}/></mesh>}
    <mesh position={[0,.86,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.44,28]}/><meshBasicMaterial color={active ? '#5fd6e0' : '#9fc4c8'} transparent opacity={active ? .5 : .18}/></mesh>
    <Html position={[0,1.95,0]} center><span className={`lobby-station-tag ${active ? 'active' : ''}`}>01 · HAND WASH</span></Html>
  </group>
}

function MaskStation({ active }: { active: boolean }) {
  return <group position={[-1.2,0,.2]}>
    <mesh position={[0,1.62,.578]}><planeGeometry args={[.64,.38]}/><meshBasicMaterial color={active ? '#8dfbfb' : '#3f7d84'}/></mesh>
    <Html position={[0,2.45,0]} center><span className={`lobby-station-tag ${active ? 'active' : ''}`}>02 · MASK</span></Html>
  </group>
}

function GownStation({ active }: { active: boolean }) {
  return <group position={[1.15,0,.2]}>
    <mesh position={[0,1.64,-.2]}><boxGeometry args={[1.88,.05,.74]}/><meshBasicMaterial color={active ? '#7ce8ef' : '#5d777d'}/></mesh>
    <Html position={[0,2.45,0]} center><span className={`lobby-station-tag ${active ? 'active' : ''}`}>03 · GOWNING</span></Html>
  </group>
}

function AirShower({ active, running, entryOpen, exitOpen }: { active: boolean; running: boolean; entryOpen: boolean; exitOpen: boolean }) {
  const particles = useRef<Group>(null)
  const entryLeft = useRef<Mesh>(null)
  const entryRight = useRef<Mesh>(null)
  const exitLeft = useRef<Mesh>(null)
  const exitRight = useRef<Mesh>(null)
  useFrame(({ clock }, delta) => {
    if (particles.current && running) particles.current.rotation.y = clock.elapsedTime * 2.4
    const moveDoor = (door: Mesh | null, angle: number) => { if (door) door.rotation.y = MathUtils.lerp(door.rotation.y, angle, 1-Math.exp(-delta*1.15)) }
    moveDoor(entryLeft.current, entryOpen ? -1.28 : 0)
    moveDoor(entryRight.current, entryOpen ? 1.28 : 0)
    moveDoor(exitLeft.current, exitOpen ? 1.28 : 0)
    moveDoor(exitRight.current, exitOpen ? -1.28 : 0)
  })
  return <group position={[3.55,0,.1]}>
    <mesh position={[0,1.65,-.15]}><boxGeometry args={[2.25,3.3,1.8]}/><meshStandardMaterial color="#68858b" metalness={.72} roughness={.23} transparent opacity={.42}/></mesh>
    <mesh ref={entryLeft} position={[-.53,1.65,.78]}><boxGeometry args={[1.02,3.1,.08]}/><meshStandardMaterial color="#a8f3f1" transparent opacity={.48}/></mesh>
    <mesh ref={entryRight} position={[.53,1.65,.78]}><boxGeometry args={[1.02,3.1,.08]}/><meshStandardMaterial color="#a8f3f1" transparent opacity={.48}/></mesh>
    <mesh ref={exitLeft} position={[-.53,1.65,-1.08]}><boxGeometry args={[1.02,3.1,.08]}/><meshStandardMaterial color="#79dadd" metalness={.28} transparent opacity={.58}/></mesh>
    <mesh ref={exitRight} position={[.53,1.65,-1.08]}><boxGeometry args={[1.02,3.1,.08]}/><meshStandardMaterial color="#79dadd" metalness={.28} transparent opacity={.58}/></mesh>
    <group ref={particles}>{Array.from({length:24},(_,i) => { const a=(i/24)*Math.PI*2; return <mesh key={i} visible={running} position={[Math.cos(a)*.65,.4+(i%6)*.45,Math.sin(a)*.5]}><sphereGeometry args={[.025,6,6]}/><meshBasicMaterial color="#aaffff"/></mesh> })}</group>
    <Html position={[0,3.75,0]} center><span className={`lobby-station-tag ${active ? 'active' : ''}`}>04 · AIR SHOWER</span></Html>
  </group>
}

function CleanroomThreshold() {
  const particles = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!particles.current) return
    particles.current.children.forEach((particle,index) => {
      particle.position.z = .45 - ((clock.elapsedTime * .58 + index * .27) % 2.7)
      particle.position.y = .48 + (index % 5) * .5 + Math.sin(clock.elapsedTime * 2.1 + index) * .04
    })
  })
  return <group position={[3.55,0,-2.15]}>
    <mesh position={[0,.035,-.8]}><boxGeometry args={[2.5,.07,2.7]}/><meshStandardMaterial color="#d8eeee" metalness={.42} roughness={.28} emissive="#1a7d85" emissiveIntensity={.32}/></mesh>
    {[-.78,0,.78].map((x)=><mesh key={x} position={[x,.08,-.8]}><boxGeometry args={[.035,.012,2.5]}/><meshBasicMaterial color="#7dffff"/></mesh>)}
    <mesh position={[-1.22,1.7,.42]}><boxGeometry args={[.16,3.4,.18]}/><meshStandardMaterial color="#c3f2f0" emissive="#39d9dd" emissiveIntensity={.75}/></mesh>
    <mesh position={[1.22,1.7,.42]}><boxGeometry args={[.16,3.4,.18]}/><meshStandardMaterial color="#c3f2f0" emissive="#39d9dd" emissiveIntensity={.75}/></mesh>
    <mesh position={[0,3.34,.42]}><boxGeometry args={[2.6,.16,.18]}/><meshStandardMaterial color="#d9ffff" emissive="#61f5f1" emissiveIntensity={1.1}/></mesh>
    {[-.76,.76].map((x)=><group key={x} position={[x,1.12,-1.55]}><mesh><boxGeometry args={[.72,1.65,.62]}/><meshStandardMaterial color="#275e66" metalness={.5}/></mesh><mesh position={[0,.28,.33]}><boxGeometry args={[.42,.34,.035]}/><meshBasicMaterial color="#6df8f4"/></mesh></group>)}
    {[-.72,0,.72].map((x)=><mesh key={x} position={[x,3.02,-.86]}><boxGeometry args={[.48,.05,1.7]}/><meshBasicMaterial color="#d8ffff"/></mesh>)}
    <group ref={particles}>{Array.from({length:18},(_,index)=><mesh key={index} position={[(index%6-2.5)*.34,.5+(index%5)*.5,.4-index*.12]}><sphereGeometry args={[.018,6,6]}/><meshBasicMaterial color={index%3===0?'#ffffff':'#76ffff'} transparent opacity={.8}/></mesh>)}</group>
    <pointLight position={[0,2.1,.2]} color="#9cffff" intensity={18} distance={7}/>
    <Html position={[0,3.72,.42]} center><span className="threshold-sign">SEMICONDUCTOR CLEANROOM · LINE ACCESS</span></Html>
  </group>
}

function Rookie({ step, acting, cinematic, reducedMotion }: { step: number; acting: boolean; cinematic: boolean; reducedMotion: boolean }) {
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const head = useRef<Group>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)
  const leftForearm = useRef<Group>(null)
  const rightForearm = useRef<Group>(null)
  const leftHand = useRef<Mesh>(null)
  const rightHand = useRef<Mesh>(null)
  const leftLeg = useRef<Group>(null)
  const rightLeg = useRef<Group>(null)
  const actionStarted = useRef(0)
  const target = useMemo(() => new Vector3(...ENTRY_POSITIONS[step]), [step])

  useEffect(() => { if (acting) actionStarted.current = performance.now() }, [acting, step])

  useFrame(({ clock }, delta) => {
    if (!root.current || !body.current) return
    const distance = root.current.position.distanceTo(target)
    const walking = distance > .055 && !acting
    const phase = clock.elapsedTime * (cinematic ? 3.35 : 7.2)
    const damp = (current: number, next: number, speed = 9) => MathUtils.lerp(current, next, 1 - Math.exp(-delta * speed))
    const pose = (part: Group | null, x: number, z: number, speed = 9) => {
      if (!part) return
      part.rotation.x = damp(part.rotation.x, x, speed)
      part.rotation.z = damp(part.rotation.z, z, speed)
    }

    if (reducedMotion) root.current.position.copy(target)
    else root.current.position.lerp(target, 1 - Math.exp(-delta * (cinematic ? .62 : 2.5)))

    if (walking) {
      const direction = target.clone().sub(root.current.position)
      root.current.rotation.y = damp(root.current.rotation.y, Math.atan2(direction.x, direction.z), 6)
    } else if (!(step === 4 && acting)) {
      root.current.rotation.y = damp(root.current.rotation.y, Math.PI, 5)
    }

    const gait = reducedMotion ? 0 : Math.sin(phase)
    const idle = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 2.1)
    body.current.position.y = damp(body.current.position.y, walking ? Math.abs(Math.sin(phase * 2)) * (cinematic ? .035 : .055) : idle * .012, 12)
    body.current.rotation.x = damp(body.current.rotation.x, walking ? (cinematic ? .045 : .08) : 0, 8)
    if (head.current) head.current.rotation.y = damp(head.current.rotation.y, walking ? gait * .055 : idle * .025, 7)

    pose(leftLeg.current, walking ? gait * (cinematic ? .34 : .48) : 0, walking ? -.025 : 0)
    pose(rightLeg.current, walking ? -gait * (cinematic ? .34 : .48) : 0, walking ? .025 : 0)

    let leftArmX = walking ? -gait * (cinematic ? .24 : .38) : 0
    let rightArmX = walking ? gait * (cinematic ? .24 : .38) : 0
    let leftArmZ = -.08
    let rightArmZ = .08
    let forearmX = walking ? -.18 : 0
    const actionTime = Math.max(0, (performance.now() - actionStarted.current) / 1000)

    if (acting && step === 1) {
      leftArmX = -1.12
      rightArmX = -1.12
      leftArmZ = -.18
      rightArmZ = .18
      forearmX = -1.02
      body.current.rotation.x = damp(body.current.rotation.x, -.17, 7)
      if (leftHand.current && rightHand.current && !reducedMotion) {
        const rub = Math.sin(actionTime * 13) * .055
        leftHand.current.position.x = -.04 + rub
        rightHand.current.position.x = .04 - rub
        leftHand.current.rotation.y = actionTime * 5
        rightHand.current.rotation.y = -actionTime * 5
      }
    } else if (acting && step === 2) {
      leftArmX = -1.16
      rightArmX = -1.16
      leftArmZ = -.22
      rightArmZ = .22
      forearmX = -1.34
    } else if (acting && step === 3) {
      leftArmZ = -1.32
      rightArmZ = 1.32
      leftArmX = -.08
      rightArmX = -.08
      forearmX = 0
    } else if (acting && step === 4) {
      leftArmZ = -.72
      rightArmZ = .72
      leftArmX = -.08
      rightArmX = -.08
      forearmX = -.08
      if (!reducedMotion) root.current.rotation.y += delta * .72
    }

    pose(leftArm.current, leftArmX, leftArmZ)
    pose(rightArm.current, rightArmX, rightArmZ)
    pose(leftForearm.current, forearmX, -.02)
    pose(rightForearm.current, forearmX, .02)
  })

  const masked = step > 2 || (step === 2 && acting)
  const gowned = step > 3 || (step === 3 && acting)
  const cloth = gowned ? '#f4fbfb' : '#26a8b2'
  const glove = gowned ? '#d9ffff' : '#e6b991'

  // 사람 비율로 재구성(2026-09-07). 이전에는 머리 지름이 전체 키의 1/3.2 라
  // 인형처럼 보였다. 실제 성인은 약 1/7.5 이고, 게임 캐릭터는 1/5.5 정도가
  // 친근하면서도 사람으로 읽힌다. 키(약 2.46)는 그대로 두고 머리를 줄여
  // 남는 높이를 다리·몸통에 돌려주었다. 리그(ref)와 애니메이션은 그대로다.
  return <group ref={root} position={ENTRY_POSITIONS[0]} rotation={[0,Math.PI,0]} scale={.76}>
    <group ref={body}>
      <group ref={leftLeg} position={[-.13,1.10,0]}>
        <mesh position={[0,-.50,0]}><capsuleGeometry args={[.115,.70,6,10]}/><meshStandardMaterial color="#213f48"/></mesh>
        <mesh position={[0,-1.04,.10]} scale={[1,.5,1.7]}><sphereGeometry args={[.13,12,8]}/><meshStandardMaterial color="#18333b"/></mesh>
      </group>
      <group ref={rightLeg} position={[.13,1.10,0]}>
        <mesh position={[0,-.50,0]}><capsuleGeometry args={[.115,.70,6,10]}/><meshStandardMaterial color="#213f48"/></mesh>
        <mesh position={[0,-1.04,.10]} scale={[1,.5,1.7]}><sphereGeometry args={[.13,12,8]}/><meshStandardMaterial color="#18333b"/></mesh>
      </group>
      {/* 골반 → 허리 → 가슴 순으로 굵기를 달리해 허리 잘록함을 만든다. 이전에는
          반지름 .43 짜리 캡슐 하나라 통짜 원통으로 보였다. */}
      <mesh position={[0,1.18,0]} scale={[1,1,.78]}><capsuleGeometry args={[.20,.20,6,12]}/><meshStandardMaterial color={gowned ? '#e6f5f4' : '#213f48'}/></mesh>
      <mesh position={[0,1.44,0]} scale={[1,1,.74]}><capsuleGeometry args={[.185,.20,6,12]}/><meshStandardMaterial color={cloth}/></mesh>
      <mesh position={[0,1.70,0]} scale={[1.18,.92,.72]}><capsuleGeometry args={[.27,.30,7,14]}/><meshStandardMaterial color={cloth}/></mesh>
      {gowned && <mesh position={[0,1.60,-.02]} scale={[1.24,1.30,.80]}><capsuleGeometry args={[.28,.34,7,14]}/><meshStandardMaterial color="#f4fbfb" transparent opacity={.94}/></mesh>}

      <group ref={leftArm} position={[-.30,1.80,0]}>
        <mesh scale={[.9,1,.85]}><sphereGeometry args={[.105,12,10]}/><meshStandardMaterial color={cloth}/></mesh>
        <mesh position={[0,-.28,0]}><capsuleGeometry args={[.08,.36,6,10]}/><meshStandardMaterial color={cloth}/></mesh>
        <group ref={leftForearm} position={[0,-.54,0]}><mesh scale={[1,.95,.95]}><sphereGeometry args={[.076,12,10]}/><meshStandardMaterial color={cloth}/></mesh><mesh position={[0,-.24,0]}><capsuleGeometry args={[.068,.30,6,10]}/><meshStandardMaterial color={cloth}/></mesh><mesh ref={leftHand} position={[0,-.48,0]} scale={[.78,1.15,.6]}><sphereGeometry args={[.095,12,8]}/><meshStandardMaterial color={glove}/></mesh></group>
      </group>
      <group ref={rightArm} position={[.30,1.80,0]}>
        <mesh scale={[.9,1,.85]}><sphereGeometry args={[.105,12,10]}/><meshStandardMaterial color={cloth}/></mesh>
        <mesh position={[0,-.28,0]}><capsuleGeometry args={[.08,.36,6,10]}/><meshStandardMaterial color={cloth}/></mesh>
        <group ref={rightForearm} position={[0,-.54,0]}><mesh scale={[1,.95,.95]}><sphereGeometry args={[.076,12,10]}/><meshStandardMaterial color={cloth}/></mesh><mesh position={[0,-.24,0]}><capsuleGeometry args={[.068,.30,6,10]}/><meshStandardMaterial color={cloth}/></mesh><mesh ref={rightHand} position={[0,-.48,0]} scale={[.78,1.15,.6]}><sphereGeometry args={[.095,12,8]}/><meshStandardMaterial color={glove}/></mesh></group>
      </group>

      <mesh position={[0,1.99,0]}><cylinderGeometry args={[.072,.095,.22,12]}/><meshStandardMaterial color="#d59d73"/></mesh>
      <group ref={head} position={[0,2.26,0]}>
        {gowned && <mesh position={[0,0,-.04]} scale={[1.18,1.16,1.08]}><sphereGeometry args={[.245,18,14]}/><meshStandardMaterial color="#f7ffff"/></mesh>}
        {/* 두개골은 좌우보다 위아래가 길고 뒤통수가 나온다. 정구체는 아기 얼굴로 읽힌다. */}
        <mesh scale={[1,1.14,1.02]}><sphereGeometry args={[.225,20,16]}/><meshStandardMaterial color="#e6b991"/></mesh>
        <mesh position={[0,-.10,.055]} scale={[.86,.80,.92]}><sphereGeometry args={[.20,16,12]}/><meshStandardMaterial color="#e6b991"/></mesh>
        {!gowned && <mesh position={[0,.10,-.025]} scale={[1.05,.72,1.06]}><sphereGeometry args={[.232,18,12]}/><meshStandardMaterial color="#263b43"/></mesh>}
        <mesh position={[-.085,.015,.195]} scale={[1.35,1,.6]}><sphereGeometry args={[.024,10,8]}/><meshBasicMaterial color="#152b32"/></mesh>
        <mesh position={[.085,.015,.195]} scale={[1.35,1,.6]}><sphereGeometry args={[.024,10,8]}/><meshBasicMaterial color="#152b32"/></mesh>
        <mesh position={[0,-.045,.215]} scale={[.7,1.1,.9]}><sphereGeometry args={[.032,10,8]}/><meshStandardMaterial color="#dcae86"/></mesh>
        {gowned && <mesh position={[0,-.01,.20]}><torusGeometry args={[.205,.03,8,20]}/><meshStandardMaterial color="#cfe7e7"/></mesh>}
        {masked && <mesh position={[0,-.075,.20]} scale={[1.12,.62,.24]}><sphereGeometry args={[.19,14,10]}/><meshStandardMaterial color="#a8eff1"/></mesh>}
      </group>
    </group>
  </group>
}

function RoomDoor({ item, index, onSelect }: { item: ScenarioSummary; index: number; onSelect: () => void }) {
  const x = -6.25 + index * 2.5
  return <group position={[x,0,-4.02]}>
    <mesh position={[0,1.48,.16]} onClick={onSelect} onPointerOver={() => { document.body.style.cursor='pointer' }} onPointerOut={() => { document.body.style.cursor='default' }}>
      <boxGeometry args={[1.82,2.95,.18]}/><meshStandardMaterial color={index === 0 ? '#0ea4b0' : '#174751'} emissive={index === 0 ? '#006674' : '#07191d'} emissiveIntensity={.55} metalness={.55}/>
    </mesh>
    <mesh position={[0,2.55,.3]}><boxGeometry args={[1.34,.3,.06]}/><meshBasicMaterial color={index === 0 ? '#ffe085' : '#69e9ef'}/></mesh>
    <Html position={[0,1.5,.4]} center distanceFactor={10}><button className="room-door-label" onClick={onSelect}><span>{item.module_no}</span><b>{item.process}</b><small>{item.title}</small></button></Html>
  </group>
}

function LobbyScene({ step, acting, hall, cinematic, scenarios, onSelect, reducedMotion }: { step: number; acting: boolean; hall: boolean; cinematic: boolean; scenarios: ScenarioSummary[]; onSelect: (id: string) => void; reducedMotion: boolean }) {
  return <Canvas camera={{position:[6.8,4.2,8.5],fov:42}} dpr={[1,1.5]} gl={{antialias:true,toneMappingExposure:1.12}} frameloop={reducedMotion ? 'demand' : 'always'}>
    <color attach="background" args={[hall ? '#071c23' : '#dbe8e8']}/>
    <ambientLight intensity={hall ? .55 : .95}/><directionalLight position={[5,9,6]} intensity={hall ? 2.8 : 3.9}/>
    <Environment key={hall?'hall':'prep'} frames={1} resolution={128}><Lightformer intensity={hall?2.4:3.2} form="rect" scale={[14,5,1]} position={[0,6,-6]} color={hall?'#7fe9ff':'#ffffff'}/><Lightformer intensity={1.5} form="rect" scale={[10,4,1]} position={[-9,4,3]} rotation-y={Math.PI/2} color="#cfe9ff"/><Lightformer intensity={1.5} form="rect" scale={[10,4,1]} position={[9,4,3]} rotation-y={-Math.PI/2} color="#cfe9ff"/></Environment>
    <FacilityShell hall={hall}/><CameraRig step={step} hall={hall} cinematic={cinematic} reducedMotion={reducedMotion}/>
    {!hall && <><SinkStation active={step===1} running={step===1 && acting}/><MaskStation active={step===2}/><GownStation active={step===3}/>{cinematic&&<CleanroomThreshold/>}<AirShower active={step===4||cinematic} running={step===4 && acting} entryOpen={step===4&&!acting} exitOpen={cinematic}/><Rookie step={step} acting={acting} cinematic={cinematic} reducedMotion={reducedMotion}/></>}
    {hall && scenarios.map((item,index)=><RoomDoor key={item.id} item={item} index={index} onSelect={() => onSelect(item.id)}/>)}
    <ContactShadows position={[0,.01,0]} opacity={hall ? .32 : .18} scale={18} blur={2.8} far={8}/>
  </Canvas>
}

export function CleanroomLobby({ scenarios, loading, error, onSelect, onOpenIndustryMap }: { scenarios: ScenarioSummary[]; loading: boolean; error: string; onSelect: (id: string) => void; onOpenIndustryMap: () => void }) {
  const [step,setStep] = useState(0)
  const [acting,setActing] = useState(false)
  const [moving,setMoving] = useState(false)
  const [cinematic,setCinematic] = useState(false)
  const [hallEntered,setHallEntered] = useState(false)
  const [focusedId,setFocusedId] = useState('photo-cd-drift')
  const actionTimer = useRef<number | null>(null)
  const filmRef = useRef<HTMLVideoElement>(null)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const focused = scenarios.find((item)=>item.id===focusedId) ?? scenarios[0]
  const hall = hallEntered
  useEffect(() => () => {
    if (actionTimer.current !== null) window.clearTimeout(actionTimer.current)
  }, [])

  // 단계 진행은 영상 구간이 끝나면 일어난다. 예전에는 ACTION_DURATIONS 로
  // 시간을 세었는데, 이제 화면에 실제로 재생되는 길이가 기준이다.
  const finishSegment = () => {
    const nextStep = Math.min(5, step + 1)
    setStep(nextStep)
    setActing(false)
    if (nextStep === 5) {
      setHallEntered(true)
      actionTimer.current = null
      return
    }
    setMoving(true)
    actionTimer.current = window.setTimeout(() => {
      setMoving(false)
      actionTimer.current = null
    }, 420)
  }

  // 영상 한 구간이 6.5~9초라 다섯 번을 다 기다리면 40초 가까이 걸린다.
  // 이미 본 사람을 위해 대기 없이 다음 단계로 넘긴다.
  const skipStep = () => {
    if (step >= 5) return
    if (actionTimer.current !== null) { window.clearTimeout(actionTimer.current); actionTimer.current = null }
    filmRef.current?.pause()
    setActing(false)
    setMoving(false)
    const nextStep = Math.min(5, step + 1)
    setStep(nextStep)
    if (nextStep === 5) setHallEntered(true)
  }

  const advance = () => {
    if (acting || moving || step >= 5) return
    // 재생은 클릭 핸들러 안에서 동기로 건다. useEffect 로 미루면 브라우저가
    // 사용자 제스처와 연결짓지 못해 자동재생 정책에 막힐 수 있다.
    const el = filmRef.current
    if (el) {
      try { el.currentTime = FILM_SEGMENTS[Math.min(step, FILM_SEGMENTS.length - 1)][0] } catch { /* noop */ }
      void el.play().catch(() => { /* LobbyFilm 의 guard 가 진행을 이어받는다 */ })
    }
    setActing(true)
  }



  return <main className={`cleanroom-lobby ${hall?'hall-open':''} ${cinematic?'cinematic-entry':''}`}>
    <header className="game-topbar"><div><b>VIRTUAL FAB</b><span>FACILITY 01 · SCHOLARBRIDGE</span></div><div><button type="button" className="industry-map-entry" onClick={onOpenIndustryMap}>3D 산업 지식맵</button><span>ACCESS</span><strong>{hall?'GRANTED':cinematic?'ENTERING':`${step}/4`}</strong></div></header>
    <section className="lobby-viewport" aria-label="가상 클린룸 입실 화면">
      {!hall && step < 5 && (
        <button type="button" className="lobby-skip" onClick={skipStep}>
          {step === 4 ? '입실 완료 ⏭' : '다음 단계 ⏭'}
        </button>
      )}
      {hall
        ? <LobbyScene step={step} acting={acting} hall={hall} cinematic={cinematic} scenarios={scenarios} onSelect={onSelect} reducedMotion={reducedMotion}/>
        : <LobbyFilm step={step} acting={acting} filmRef={filmRef} onSegmentEnd={finishSegment}/>}
      <div className="scanlines" aria-hidden="true"/>
      {cinematic && <div className="cleanroom-splash" aria-hidden="true"/>}
      <div className="entry-progress" aria-label="클린룸 입실 진행 단계">{ENTRY_STEPS.map((item,index)=><div key={item.code} className={index<step?'done':index===step?'active':''}><span>{String(index+1).padStart(2,'0')}</span><b>{item.code}</b></div>)}</div>
      {step<5 && <section className={`guide-dialog ${acting||moving?'acting':''}`} aria-live="polite"><div className="guide-portrait"><span>{acting||moving?'···':'AI'}</span><b>SAFETY<br/>GUIDE</b></div><div><span>ENTRY PROTOCOL {String(step+1).padStart(2,'0')}</span><h1>{ENTRY_STEPS[step].title}</h1><p>{ENTRY_STEPS[step].copy}</p><button type="button" onClick={advance} disabled={acting||moving} aria-busy={acting||moving}>{moving?'다음 스테이션으로 이동 중…':acting?ACTION_LABELS[step]:ENTRY_STEPS[step].action}<b>{acting||moving?'●':'→'}</b></button></div></section>}
      {cinematic && <section className="final-entry-cue" aria-live="polite"><h1>이제, 네가 증명할 차례야.</h1><p>SEMICONDUCTOR CLEANROOM · LINE ACCESS</p><small>공정 데이터가 기다리고 있다.</small></section>}
      {hall && <section className="mission-console"><header><div><span>CLEANROOM ACCESS GRANTED</span><h1>사건이 기다리는 공정룸을 선택해.</h1></div><p>문을 열면 60–90분의 제한시간이 시작돼.<br/>정답이 아니라 증거의 순서를 보여줘.</p></header>
        {loading && <p className="catalog-loading">공정룸을 준비하고 있어…</p>}{error && <p className="catalog-error">{error}</p>}
        <div className="room-grid">{scenarios.map((item)=><button key={item.id} type="button" className={`module-card ${focused?.id===item.id?'focused':''}`} onMouseEnter={()=>setFocusedId(item.id)} onFocus={()=>setFocusedId(item.id)} onClick={()=>onSelect(item.id)} aria-label={`${item.process} ${item.title} 시나리오 시작`}><span>{item.module_no} · {item.process}</span><b>{item.title}</b><small>{item.tagline}</small><i>ENTER ROOM ↗</i></button>)}</div>
      </section>}
      {hall && focused && <aside className="problem-bubble"><span>MISSION BRIEF · {focused.process}</span><b>{focused.tagline}</b><p>원인은 숨겨져 있어. 분포를 나누고 경쟁 가설을 세운 뒤, 최소 비용의 측정과 Holdout으로 반증해.</p></aside>}
    </section>
    <footer><p>교육용 합성 팹 · 실제 기업의 팹 배치·Recipe·Spec을 복제하지 않음</p><p>DATA → HYPOTHESIS → EVIDENCE → DECISION</p></footer>
  </main>
}
