export class ScratchTransport {
  constructor(outputRate) {
    this.outputRate = outputRate
    this.samples = null
    this.position = 0
    this.target = 0
    this.remaining = 0
    this.gain = 0
    this.previousSample = 0
    this.high = 0
    this.highpass = Math.exp(-2 * Math.PI * 180 / outputRate)
  }
  load(samples, rate) {
    this.samples = samples
    this.recordRate = rate
    this.position = this.target = samples.length * .2
  }
  move(seconds, interval) {
    if (!this.samples || !Number.isFinite(seconds) || !Number.isFinite(interval)) return
    this.target += seconds * this.recordRate
    this.remaining = Math.round(this.outputRate * Math.max(.008, Math.min(.05, interval)))
  }
  stop() { this.remaining = 0; this.target = this.position }
  render(output) {
    if (!this.samples) { output.fill(0); return }
    for (let i = 0; i < output.length; i++) {
      const step = this.remaining > 0 ? (this.target - this.position) / this.remaining : 0
      const moving = Math.abs(step) * this.outputRate / this.recordRate > .025
      if (this.remaining > 0) { this.position += step; this.remaining-- }
      this.gain += ((moving ? .22 : 0) - this.gain) * (moving ? .015 : .025)
      const wrapped = (this.position % this.samples.length + this.samples.length) % this.samples.length
      const index = Math.floor(wrapped), fraction = wrapped - index
      const sample = this.samples[index] * (1 - fraction) + this.samples[(index + 1) % this.samples.length] * fraction
      this.high = this.highpass * (this.high + sample - this.previousSample)
      this.previousSample = sample
      output[i] = this.high * this.gain
    }
    if (!this.remaining && Math.abs(this.position) > this.samples.length * 100) {
      this.position = (this.position % this.samples.length + this.samples.length) % this.samples.length
      this.target = this.position
    }
  }
}
