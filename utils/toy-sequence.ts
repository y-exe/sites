export const toySequence = (events: { note: number; time: number }[], rate = 1) => {
  const speed = Math.max(.25, Math.min(4, rate)), first = events[0]?.time || 0
  const notes = events.slice(0, 64).map(event => ({ note: event.note, time: Math.max(0, Math.min(8000, event.time - first)) / speed }))
  return { notes, duration: Math.max(500 / speed, (notes.at(-1)?.time || 0) + 350 / speed) }
}
