export type ToyBall = { x: number; y: number; vx: number; vy: number }
export const stepToyBall = (ball: ToyBall, dt: number, width: number, height: number, gravity: number, bounce: number, radius = 34) => {
  const hits: number[] = [], right = Math.max(radius, width - radius), bottom = Math.max(radius, height - radius)
  ball.vy += gravity * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt
  if (ball.x < radius) { ball.x = radius; if (ball.vx < -12) hits.push(60); ball.vx = Math.abs(ball.vx) * bounce }
  if (ball.x > right) { ball.x = right; if (ball.vx > 12) hits.push(64); ball.vx = -Math.abs(ball.vx) * bounce }
  if (ball.y < radius) { ball.y = radius; if (ball.vy < -12) hits.push(67); ball.vy = Math.abs(ball.vy) * bounce }
  if (ball.y > bottom) { ball.y = bottom; if (ball.vy > 35) hits.push(72); ball.vy = Math.abs(ball.vy) < 35 ? 0 : -Math.abs(ball.vy) * bounce; ball.vx *= .995 }
  return hits
}
