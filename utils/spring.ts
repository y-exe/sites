export interface SpringState { value: number; velocity: number; target: number }
export interface SpringOptions { stiffness: number; damping: number; mass?: number }

export function advanceSpring(state: SpringState, dt: number, options: SpringOptions) {
  const mass = options.mass || 1
  const decay = options.damping / (2 * mass)
  const frequency = Math.sqrt(options.stiffness / mass)
  const offset = state.value - state.target
  const envelope = Math.exp(-decay * dt)
  let position: number, velocity: number
  if (decay < frequency) {
    const omega = Math.sqrt(frequency * frequency - decay * decay)
    const sine = Math.sin(omega * dt), cosine = Math.cos(omega * dt)
    const b = (state.velocity + decay * offset) / omega
    position = envelope * (offset * cosine + b * sine)
    velocity = envelope * ((b * omega - decay * offset) * cosine - (offset * omega + decay * b) * sine)
  } else if (Math.abs(decay - frequency) < .0001) {
    const b = state.velocity + decay * offset
    position = envelope * (offset + b * dt)
    velocity = envelope * (b - decay * (offset + b * dt))
  } else {
    const root = Math.sqrt(decay * decay - frequency * frequency)
    const r1 = -decay + root, r2 = -decay - root
    const a = (state.velocity - r2 * offset) / (r1 - r2), b = offset - a
    position = a * Math.exp(r1 * dt) + b * Math.exp(r2 * dt)
    velocity = a * r1 * Math.exp(r1 * dt) + b * r2 * Math.exp(r2 * dt)
  }
  state.value = state.target + position
  state.velocity = velocity
}

export function springEasing(options: SpringOptions, duration = .7) {
  const state = { value: 0, velocity: 0, target: 1 }
  const samples = ['0']
  for (let i = 1; i < 60; i++) {
    advanceSpring(state, duration / 60, options)
    samples.push(state.value.toFixed(4))
  }
  samples.push('1')
  return `linear(${samples.join(',')})`
}

export function createSpring<T extends string>(initial: Record<T, number>, render: (values: Record<T, number>) => void, options: SpringOptions = { stiffness: 280, damping: 20 }) {
  const keys = Object.keys(initial) as T[]
  const states = Object.fromEntries(keys.map(key => [key, { value: initial[key], target: initial[key], velocity: 0 }])) as Record<T, SpringState>
  let frame = 0, previous = 0, disposed = false
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  const reduced = () => media.matches
  const paint = () => render(Object.fromEntries(keys.map(key => [key, states[key].value])) as Record<T, number>)
  const tick = (time: number) => {
    frame = 0
    const dt = Math.min((time - previous) / 1000, .064)
    previous = time
    let moving = false
    for (const key of keys) {
      const state = states[key]
      if (reduced()) { state.value = state.target; state.velocity = 0 }
      else advanceSpring(state, dt, options)
      if (Math.abs(state.value - state.target) > .001 || Math.abs(state.velocity) > .01) moving = true
      else { state.value = state.target; state.velocity = 0 }
    }
    paint()
    if (moving && !disposed) frame = requestAnimationFrame(tick)
  }
  const start = () => {
    if (disposed || frame) return
    previous = performance.now()
    frame = requestAnimationFrame(tick)
  }
  return {
    to(values: Partial<Record<T, number>>) {
      if (disposed) return
      for (const key of keys) if (values[key] !== undefined) states[key].target = values[key]!
      if (reduced()) { for (const key of keys) { states[key].value = states[key].target; states[key].velocity = 0 }; paint() }
      else start()
    },
    kick(velocity: Partial<Record<T, number>>) {
      if (disposed || reduced()) return
      for (const key of keys) states[key].velocity += velocity[key] || 0
      start()
    },
    jump(values: Partial<Record<T, number>>) {
      if (disposed) return
      cancelAnimationFrame(frame)
      frame = 0
      for (const key of keys) {
        states[key].value = states[key].target = values[key] ?? states[key].target
        states[key].velocity = 0
      }
      paint()
    },
    stop() { disposed = true; cancelAnimationFrame(frame) },
  }
}
