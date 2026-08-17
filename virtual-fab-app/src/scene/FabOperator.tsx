import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { MathUtils, Vector3 } from 'three'
import type { Group } from 'three'
import { ARRIVAL_DISTANCE, damp, dampAngle, operatorSideOffset, stagePose } from './characterMotion'
import { CLEANROOM } from './cleanroomTokens'

const OPERATOR_LINES = [
  '평균보다 분포를 먼저 볼까?',
  'CSV를 보고 AI에게 다시 물어보자.',
  '대조군과 반복을 고정하자.',
  '최소 비용의 증거는 무엇일까?',
  'Holdout이 정말 재현됐나?',
]
const BASE_HEIGHT = .13

type OperatorProps = { target: [number, number, number]; stageIndex: number; reducedMotion: boolean }

function moveJoint(joint: Group | null, x: number, y: number, z: number, delta: number, speed = 10) {
  if (!joint) return
  joint.rotation.x = damp(joint.rotation.x, x, speed, delta)
  joint.rotation.y = damp(joint.rotation.y, y, speed, delta)
  joint.rotation.z = damp(joint.rotation.z, z, speed, delta)
}

function Arm({ side, shoulderRef, elbowRef }: { side: -1 | 1; shoulderRef: RefObject<Group | null>; elbowRef: RefObject<Group | null> }) {
  return <group ref={shoulderRef} position={[side * .51, .52, 0]}>
    <mesh position={[0, -.27, 0]}><capsuleGeometry args={[.115, .34, 5, 10]} /><meshStandardMaterial color={CLEANROOM.suit} roughness={.72} /></mesh>
    <mesh position={[0, -.49, 0]}><sphereGeometry args={[.13, 12, 10]} /><meshStandardMaterial color={CLEANROOM.suitShade} roughness={.72} /></mesh>
    <group ref={elbowRef} position={[0, -.5, 0]}>
      <mesh position={[0, -.25, 0]}><capsuleGeometry args={[.105, .31, 5, 10]} /><meshStandardMaterial color={CLEANROOM.suit} roughness={.72} /></mesh>
      <mesh position={[0, -.48, 0]}><cylinderGeometry args={[.14, .14, .1, 12]} /><meshStandardMaterial color={CLEANROOM.visorFrame} roughness={.6} /></mesh>
      <mesh position={[0, -.59, .015]} scale={[1, 1.12, .9]}><sphereGeometry args={[.155, 12, 10]} /><meshStandardMaterial color={CLEANROOM.glove} roughness={.58} /></mesh>
    </group>
  </group>
}

function Leg({ side, hipRef, kneeRef }: { side: -1 | 1; hipRef: RefObject<Group | null>; kneeRef: RefObject<Group | null> }) {
  return <group ref={hipRef} position={[side * .235, -.06, 0]}>
    <mesh position={[0, -.35, 0]}><capsuleGeometry args={[.15, .43, 5, 10]} /><meshStandardMaterial color={CLEANROOM.suit} roughness={.76} /></mesh>
    <mesh position={[0, -.65, 0]}><sphereGeometry args={[.16, 12, 10]} /><meshStandardMaterial color={CLEANROOM.suitShade} roughness={.76} /></mesh>
    <group ref={kneeRef} position={[0, -.66, 0]}>
      <mesh position={[0, -.34, 0]}><capsuleGeometry args={[.135, .41, 5, 10]} /><meshStandardMaterial color={CLEANROOM.suit} roughness={.76} /></mesh>
      <group position={[0, -.67, .075]}>
        <mesh position={[0, .05, 0]} scale={[1.08, .82, 1.25]}><capsuleGeometry args={[.16, .18, 5, 10]} /><meshStandardMaterial color={CLEANROOM.hood} roughness={.7} /></mesh>
        <mesh position={[0, -.09, .07]}><boxGeometry args={[.36, .12, .52]} /><meshStandardMaterial color={CLEANROOM.sole} roughness={.82} /></mesh>
      </group>
    </group>
  </group>
}

export function FabOperator({ target, stageIndex, reducedMotion }: OperatorProps) {
  const operatorRoot = useRef<Group>(null)
  const headingRoot = useRef<Group>(null)
  const pelvis = useRef<Group>(null)
  const torso = useRef<Group>(null)
  const hood = useRef<Group>(null)
  const leftShoulder = useRef<Group>(null)
  const rightShoulder = useRef<Group>(null)
  const leftElbow = useRef<Group>(null)
  const rightElbow = useRef<Group>(null)
  const leftHip = useRef<Group>(null)
  const rightHip = useRef<Group>(null)
  const leftKnee = useRef<Group>(null)
  const rightKnee = useRef<Group>(null)
  const direction = useMemo(() => new Vector3(), [])
  const stationVector = useMemo(() => new Vector3(target[0], 0, target[2]), [target])
  const targetVector = useMemo(() => new Vector3(target[0] + operatorSideOffset(target[0]), 0, target[2] + .85), [target])

  useFrame(({ clock }, delta) => {
    const root = operatorRoot.current
    const heading = headingRoot.current
    if (!root || !heading) return
    const distance = root.position.distanceTo(targetVector)
    const walking = !reducedMotion && distance > ARRIVAL_DISTANCE
    if (reducedMotion) { root.position.copy(targetVector); root.position.y = BASE_HEIGHT }
    else { root.position.x = damp(root.position.x, targetVector.x, 3.35, delta); root.position.z = damp(root.position.z, targetVector.z, 3.35, delta) }
    direction.copy(walking ? targetVector : stationVector).sub(root.position)
    if (direction.lengthSq() > .0001) heading.rotation.y = dampAngle(heading.rotation.y, Math.atan2(direction.x, direction.z), 9, reducedMotion ? Number.POSITIVE_INFINITY : delta)

    const pose = walking ? 'walk' : stagePose(stageIndex)
    const animationDelta = reducedMotion ? Number.POSITIVE_INFINITY : delta
    const gait = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 7.1)
    const stride = walking ? MathUtils.clamp(distance / 1.15, .28, 1) : 0
    const idle = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.8)
    const breath = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 2.15)
    let torsoX = 0, torsoY = 0, pelvisY = 0, leftShoulderX = 0, rightShoulderX = 0
    let leftElbowX = -.08, rightElbowX = -.08, leftHipX = 0, rightHipX = 0
    let leftKneeX = 0, rightKneeX = 0, hoodX = 0, hoodY = 0

    if (pose === 'walk') {
      pelvisY = gait * .075 * stride; torsoY = -gait * .09 * stride; torsoX = -.035 * stride
      leftShoulderX = gait * .54 * stride; rightShoulderX = -gait * .54 * stride
      leftElbowX = -.24 - Math.max(0, -gait) * .28 * stride; rightElbowX = -.24 - Math.max(0, gait) * .28 * stride
      leftHipX = -gait * .56 * stride; rightHipX = gait * .56 * stride
      leftKneeX = Math.max(0, gait) * .66 * stride; rightKneeX = Math.max(0, -gait) * .66 * stride
      root.position.y = BASE_HEIGHT + Math.abs(gait) * .025 * stride
    } else if (pose === 'inspect') {
      torsoX = -.12; leftShoulderX = -.58; rightShoulderX = -.58; leftElbowX = -.78; rightElbowX = -.78; hoodX = .1
    } else if (pose === 'point') {
      torsoY = -.08; rightShoulderX = -1.14; rightElbowX = -.18; leftShoulderX = -.08; leftElbowX = -.18; hoodY = -.12
    } else if (pose === 'confirm') {
      leftShoulderX = -.45; rightShoulderX = -.72; leftElbowX = -.64; rightElbowX = -.82
      hoodX = reducedMotion ? .08 : .08 + Math.max(0, Math.sin(clock.elapsedTime * 4.2)) * .08
    } else { torsoX = breath * .014; torsoY = idle * .025; pelvisY = -idle * .02; hoodY = idle * .035; rightShoulderX = -.12 }

    if (!walking && !reducedMotion) root.position.y = damp(root.position.y, BASE_HEIGHT, 12, delta)
    if (pelvis.current) { pelvis.current.position.y = damp(pelvis.current.position.y, 1.36 + (walking ? Math.abs(gait) * .028 * stride : breath * .012), 10, animationDelta); pelvis.current.rotation.y = damp(pelvis.current.rotation.y, pelvisY, 10, animationDelta) }
    moveJoint(torso.current, torsoX, torsoY, 0, animationDelta); moveJoint(hood.current, hoodX, hoodY, 0, animationDelta)
    moveJoint(leftShoulder.current, leftShoulderX, 0, -.035, animationDelta); moveJoint(rightShoulder.current, rightShoulderX, 0, .035, animationDelta)
    moveJoint(leftElbow.current, leftElbowX, 0, 0, animationDelta); moveJoint(rightElbow.current, rightElbowX, 0, 0, animationDelta)
    moveJoint(leftHip.current, leftHipX, 0, 0, animationDelta); moveJoint(rightHip.current, rightHipX, 0, 0, animationDelta)
    moveJoint(leftKnee.current, leftKneeX, 0, 0, animationDelta); moveJoint(rightKnee.current, rightKneeX, 0, 0, animationDelta)
  })

  return <group ref={operatorRoot} position={[-7, BASE_HEIGHT, -3.8]} scale={.86}>
    <group ref={headingRoot}><group ref={pelvis} position={[0, 1.36, 0]}>
      <mesh scale={[1.08, .72, .82]}><sphereGeometry args={[.38, 16, 12]} /><meshStandardMaterial color={CLEANROOM.suitShade} roughness={.75} /></mesh>
      <Leg side={-1} hipRef={leftHip} kneeRef={leftKnee} /><Leg side={1} hipRef={rightHip} kneeRef={rightKnee} />
      <group ref={torso} position={[0, .42, 0]}>
        <mesh position={[0, .24, 0]}><cylinderGeometry args={[.43, .34, .78, 14]} /><meshStandardMaterial color={CLEANROOM.suit} roughness={.72} /></mesh>
        <mesh position={[0, .24, -.33]} scale={[1, .9, .48]}><capsuleGeometry args={[.28, .36, 5, 10]} /><meshStandardMaterial color={CLEANROOM.suitShade} roughness={.76} /></mesh>
        <mesh position={[0, .21, .405]}><boxGeometry args={[.27, .23, .055]} /><meshStandardMaterial color={CLEANROOM.deepNavy} roughness={.55} /></mesh>
        <mesh position={[0, .22, .442]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[.105, .105, .035]} /><meshStandardMaterial color={CLEANROOM.amber} emissive={'#6d3c00'} emissiveIntensity={.36} /></mesh>
        <Arm side={-1} shoulderRef={leftShoulder} elbowRef={leftElbow} /><Arm side={1} shoulderRef={rightShoulder} elbowRef={rightElbow} />
        <group ref={hood} position={[0, .92, 0]}>
          <mesh><sphereGeometry args={[.42, 18, 14]} /><meshStandardMaterial color={CLEANROOM.hood} roughness={.68} /></mesh>
          <mesh position={[0, .01, .315]} scale={[1, .78, .36]}><sphereGeometry args={[.34, 16, 12]} /><meshStandardMaterial color={CLEANROOM.visorFrame} roughness={.28} metalness={.18} /></mesh>
          <mesh position={[0, .045, .425]} scale={[.77, .48, .1]}><sphereGeometry args={[.32, 16, 10]} /><meshStandardMaterial color={CLEANROOM.visor} emissive={'#006670'} emissiveIntensity={.26} transparent opacity={.7} depthWrite={false} /></mesh>
          <mesh position={[0, -.14, .43]}><boxGeometry args={[.42, .16, .065]} /><meshStandardMaterial color={CLEANROOM.mask} roughness={.72} /></mesh>
        </group>
      </group>
    </group></group>
    <Html position={[0, 3.68, 0]} center distanceFactor={10}><div className={'operator-dialog'} aria-label={'가상 팹 작업자'}><b>FAB ROOKIE</b><span>{OPERATOR_LINES[stageIndex]}</span></div></Html>
  </group>
}
