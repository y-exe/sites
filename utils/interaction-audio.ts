export type InteractionSound = 'tap' | 'open' | 'close' | 'toggle' | 'success' | 'error'

const voices: Record<InteractionSound, number[][]> = {
  tap: [[520, 0, .065, .022]],
  open: [[480, 0, .08, .023], [720, .035, .11, .016]],
  close: [[610, 0, .07, .02], [410, .025, .09, .014]],
  toggle: [[660, 0, .09, .021], [990, .04, .12, .017]],
  success: [[760, 0, .1, .024], [1140, .065, .15, .02]],
  error: [[240, 0, .09, .02], [190, .06, .12, .017]],
}

export function createInteractionAudio(makeContext: () => AudioContext, onPlay = () => {}) {
  let context: AudioContext | undefined
  let generation = 0
  let disposed = false
  let lastTap = -Infinity
  const active = new Set<OscillatorNode>()
  const unlock = () => {
    if (disposed) return
    try {
      context ||= makeContext()
      if (context.state === 'suspended') return context.resume().catch(() => {})
    } catch {}
  }
  const play = async (kind: InteractionSound = 'tap') => {
    const ticket = generation
    await unlock()
    if (disposed || ticket !== generation || !context || context.state !== 'running') return
    const now = context.currentTime
    if (kind === 'tap' && now - lastTap < .045) return
    if (kind === 'tap') lastTap = now
    for (const [frequency, delay, duration, volume] of voices[kind]) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = now + delay!
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency!, start)
      oscillator.frequency.exponentialRampToValueAtTime(frequency! * .82, start + duration!)
      gain.gain.setValueAtTime(.0001, start)
      gain.gain.exponentialRampToValueAtTime(volume! * 3, start + .006)
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration!)
      oscillator.connect(gain)
      gain.connect(context.destination)
      active.add(oscillator)
      oscillator.onended = () => { active.delete(oscillator); oscillator.disconnect(); gain.disconnect() }
      oscillator.start(start)
      oscillator.stop(start + duration! + .01)
    }
    onPlay()
  }
  const cancel = () => {
    generation++
    active.forEach(oscillator => { try { oscillator.stop() } catch {} })
    active.clear()
  }
  const dispose = () => {
    disposed = true
    cancel()
    void context?.close().catch(() => {})
  }
  return { unlock, play, cancel, dispose }
}
