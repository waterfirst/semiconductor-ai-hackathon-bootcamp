export const ARRIVAL_DISTANCE = 0.065

export type OperatorPose = 'idle' | 'walk' | 'inspect' | 'point' | 'confirm'

export function damp(current: number, target: number, speed: number, delta: number) {
  return current + (target - current) * (1 - Math.exp(-Math.max(0, delta) * speed))
}

export function dampAngle(current: number, target: number, speed: number, delta: number) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + difference * (1 - Math.exp(-Math.max(0, delta) * speed))
}

export function stagePose(stageIndex: number): Exclude<OperatorPose, 'walk'> {
  if (stageIndex === 1 || stageIndex === 2) return 'inspect' as const
  if (stageIndex === 4) return 'confirm' as const
  return 'point' as const
}

export function operatorSideOffset(stationX: number) {
  if (stationX > 2) return -1.25
  if (stationX < -2) return 1.45
  return 1.15
}
