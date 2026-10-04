export const avatarGestureMode = (x: number, y: number, dx: number, dy: number, radius: number): 'scratch' | 'ball' => {
  const distance = Math.hypot(x, y)
  const radial = Math.abs(x * dx + y * dy)
  const tangent = Math.abs(x * dy - y * dx)
  return distance >= radius * .45 && tangent > radial * 1.2 ? 'scratch' : 'ball'
}
