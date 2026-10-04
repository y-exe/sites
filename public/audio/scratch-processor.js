import { ScratchTransport } from './scratch-transport.js'

class ScratchProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.transport = new ScratchTransport(sampleRate)
    this.port.onmessage = ({ data }) => {
      if (data.type === 'load') this.transport.load(data.samples, data.rate)
      else if (data.type === 'move') this.transport.move(data.distance, data.interval)
      else if (data.type === 'stop') this.transport.stop()
    }
  }
  process(_inputs, outputs) {
    if (outputs[0]?.[0]) this.transport.render(outputs[0][0])
    return true
  }
}

registerProcessor('vinyl-scratch', ScratchProcessor)
