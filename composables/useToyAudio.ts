export const useToyAudio = () => {
  const { enabled } = useInteractionSound()
  let context: AudioContext | undefined, generation = 0
  const active = new Set<AudioScheduledSourceNode>()
  let scratchNode: AudioWorkletNode | undefined
  let loadingScratch: Promise<AudioWorkletNode | null> | undefined
  let scratchGeneration = 0
  const recordRequest = new AbortController()
  const endScratch = () => { scratchGeneration++; scratchNode?.port.postMessage({ type: 'stop' }) }
  const stop = () => { generation++; endScratch(); active.forEach(node => { try { node.stop() } catch {} }); active.clear() }
  const ready = async () => {
    if (!enabled.value) return null
    const ticket = generation
    try {
      context ||= new AudioContext()
      if (context.state === 'suspended') await context.resume()
      return ticket === generation && enabled.value && context.state === 'running' ? context : null
    } catch { return null }
  }
  const note = async (midi: number, duration = .3, type: OscillatorType = 'triangle', volume = .08) => {
    const ctx = await ready()
    if (!ctx || active.size >= 12) return
    const node = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime
    node.type = type; node.frequency.value = 440 * 2 ** ((midi - 69) / 12)
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(Math.max(.0002, Math.min(.15, volume)), now + .008); gain.gain.exponentialRampToValueAtTime(.0001, now + Math.max(.04, duration))
    node.connect(gain); gain.connect(ctx.destination); active.add(node)
    node.onended = () => { active.delete(node); node.disconnect(); gain.disconnect() }
    node.start(); node.stop(now + Math.max(.04, duration) + .02)
  }
  const ensureScratch = (ctx: AudioContext) => {
    if (scratchNode) return Promise.resolve(scratchNode)
    loadingScratch ||= (async () => {
      try {
        const ticket = generation
        const response = await fetch('/audio/vinyl-scratch.wav', { signal: recordRequest.signal })
        if (!response.ok) throw new Error('Scratch sample unavailable')
        const record = await ctx.decodeAudioData(await response.arrayBuffer())
        await ctx.audioWorklet.addModule('/audio/scratch-processor.js')
        if (recordRequest.signal.aborted || ctx.state === 'closed') return null
        const node = new AudioWorkletNode(ctx, 'vinyl-scratch', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1] })
        node.port.postMessage({ type: 'load', samples: record.getChannelData(0), rate: record.sampleRate })
        node.connect(ctx.destination)
        scratchNode = node
        if (ticket !== generation) node.port.postMessage({ type: 'stop' })
        return node
      } catch { loadingScratch = undefined; return null }
    })()
    return loadingScratch
  }
  const prepareScratch = async () => { const ctx = await ready(); if (ctx) await ensureScratch(ctx) }
  const scratch = async (distance: number, interval = .016) => {
    if (!Number.isFinite(distance) || !Number.isFinite(interval) || Math.abs(distance) < .00001) return
    const ticket = generation, stroke = scratchGeneration
    const ctx = await ready()
    if (!ctx) return
    const node = await ensureScratch(ctx)
    if (!node || ticket !== generation || stroke !== scratchGeneration || !enabled.value || ctx.state !== 'running') return
    node.port.postMessage({ type: 'move', distance, interval })
  }
  watch(enabled, value => { if (!value) stop() })
  useEventListener('visibilitychange', () => { if (document.hidden) stop() })
  onUnmounted(() => { recordRequest.abort(); stop(); scratchNode?.disconnect(); void context?.close().catch(() => {}) })
  return { note, scratch, prepareScratch, endScratch, stop }
}
