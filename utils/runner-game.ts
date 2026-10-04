export const RUNNER = { width: 800, height: 300, ground: 248, x: 100, widthRun: 48, heightRun: 85 }
export type RunnerState = 'ready' | 'running' | 'paused' | 'dead'
export type RunnerEvent = 'jump' | 'land' | 'pass' | 'milestone' | 'dead'
export const createRunnerGame = (random = Math.random, emit: (event: RunnerEvent) => void = () => {}) => {
  const game = {
    state: 'ready' as RunnerState, y: RUNNER.ground - RUNNER.heightRun, velocity: 0,
    jumping: false, score: 0, speed: 5, frame: 0, groundOffset: 0, passed: 0,
    obstacles: [] as { x: number; size: number; counted: boolean }[],
  }
  let accumulated = 0, nextObstacle = 90, jumpBuffer = 0, milestone = 0
  const jump = () => {
    game.velocity = -16.5; game.jumping = true; jumpBuffer = 0; emit('jump')
  }
  const start = () => {
    Object.assign(game, { state: 'running', y: RUNNER.ground - RUNNER.heightRun, velocity: 0, jumping: false, score: 0, speed: 5, frame: 0, groundOffset: 0, passed: 0, obstacles: [] })
    accumulated = 0; nextObstacle = 90; jumpBuffer = 0; milestone = 0
  }
  const input = () => {
    if (game.state === 'ready' || game.state === 'dead') { start(); return }
    if (game.state === 'paused') return
    if (!game.jumping) jump()
    else jumpBuffer = 7
  }
  const pause = () => {
    if (game.state === 'running') game.state = 'paused'
    else if (game.state === 'paused') game.state = 'running'
    accumulated = 0; jumpBuffer = 0
  }
  const tick = () => {
    game.frame++
    game.speed = Math.min(13, 5 + game.frame * .0015)
    game.score += game.speed / 10
    game.groundOffset = (game.groundOffset + game.speed) % 880
    if (game.jumping) {
      game.velocity += .85; game.y += game.velocity
      if (game.y >= RUNNER.ground - RUNNER.heightRun) {
        game.y = RUNNER.ground - RUNNER.heightRun; game.velocity = 0; game.jumping = false
        emit('land')
        if (jumpBuffer > 0) jump()
      }
    }
    jumpBuffer = Math.max(0, jumpBuffer - 1)
    if (--nextObstacle <= 0) {
      game.obstacles.push({ x: RUNNER.width + 30, size: [60, 80, 100][Math.floor(random() * 3)]!, counted: false })
      nextObstacle = 64 + Math.floor(random() * 55)
    }
    for (const obstacle of game.obstacles) {
      obstacle.x -= game.speed
      if (!obstacle.counted && obstacle.x + obstacle.size < RUNNER.x) {
        obstacle.counted = true; game.passed++; emit('pass')
      }
      if (RUNNER.x + 10 < obstacle.x + obstacle.size - 10 && RUNNER.x + RUNNER.widthRun - 10 > obstacle.x + 10 && game.y + RUNNER.heightRun - 4 > RUNNER.ground - obstacle.size + 8) {
        game.state = 'dead'; emit('dead'); break
      }
    }
    game.obstacles = game.obstacles.filter(obstacle => obstacle.x + obstacle.size > 0)
    const nextMilestone = Math.floor(game.score / 100)
    if (game.state === 'running' && nextMilestone > milestone) { milestone = nextMilestone; emit('milestone') }
  }
  const advance = (seconds: number) => {
    if (game.state !== 'running') return
    accumulated += Math.max(0, Math.min(seconds, .1))
    while (accumulated + 1e-9 >= 1 / 60 && game.state === 'running') {
      accumulated -= 1 / 60; tick()
    }
  }
  return { game, start, input, pause, advance }
}
