import { advanceSpring, type SpringState } from './spring'

export const createRunnerPose = () => {
  const states: Record<'x' | 'y' | 'angle' | 'blend', SpringState> = {
    x: { value: 1, target: 1, velocity: 0 }, y: { value: 1, target: 1, velocity: 0 },
    angle: { value: 0, target: 0, velocity: 0 }, blend: { value: 0, target: 0, velocity: 0 },
  }
  const launch = () => { states.x.velocity -= 1.8; states.y.velocity += 2.1; states.angle.velocity -= 24 }
  const land = () => { states.x.velocity += 2.6; states.y.velocity -= 3; states.angle.velocity += 14 }
  const reset = () => {
    for (const [name, state] of Object.entries(states)) { state.value = state.target = name === 'x' || name === 'y' ? 1 : 0; state.velocity = 0 }
  }
  const advance = (dt: number, jumping: boolean, velocity: number, reduced = false) => {
    const stretch = jumping ? Math.min(.06, Math.abs(velocity) * .003) : 0
    states.x.target = 1 - stretch; states.y.target = 1 + stretch
    states.angle.target = jumping ? Math.max(-5, Math.min(5, velocity * .3)) : 0
    states.blend.target = jumping ? 1 : 0
    for (const [name, state] of Object.entries(states)) {
      if (reduced) { state.value = name === 'blend' ? state.target : name === 'angle' ? 0 : 1; state.velocity = 0 }
      else advanceSpring(state, Math.min(.1, Math.max(0, dt)), name === 'blend' ? { stiffness: 550, damping: 32 } : { stiffness: 340, damping: 19 })
    }
    return { x: states.x.value, y: states.y.value, angle: states.angle.value, blend: Math.max(0, Math.min(1, states.blend.value)) }
  }
  return { launch, land, reset, advance }
}
