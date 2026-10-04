export const createImageZoom = () => {
  const state = { scale: 1, x: 0, y: 0 }
  let viewport = { width: 0, height: 0 }, image = { width: 0, height: 0 }
  const constrain = () => {
    const maxX = Math.max(0, (image.width * state.scale - viewport.width) / 2)
    const maxY = Math.max(0, (image.height * state.scale - viewport.height) / 2)
    state.x = Math.max(-maxX, Math.min(maxX, state.x)) || 0; state.y = Math.max(-maxY, Math.min(maxY, state.y)) || 0
  }
  const measure = (viewWidth: number, viewHeight: number, imageWidth: number, imageHeight: number) => {
    viewport = { width: viewWidth, height: viewHeight }; image = { width: imageWidth, height: imageHeight }; constrain()
  }
  const zoom = (scale: number, x = 0, y = 0) => {
    const next = Math.max(1, Math.min(4, scale)), ratio = next / state.scale
    state.x = x - (x - state.x) * ratio; state.y = y - (y - state.y) * ratio; state.scale = next; constrain()
  }
  const pan = (x: number, y: number) => { state.x = x; state.y = y; constrain() }
  const reset = () => { state.scale = 1; state.x = 0; state.y = 0 }
  return { state, measure, zoom, pan, reset }
}
