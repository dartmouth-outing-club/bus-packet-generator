import { loadFile } from './utils.js'
const EMPTY_PACKET_FP = './static/empty-packet.html'
const emptyPacket = await loadFile(EMPTY_PACKET_FP)

export function createFile (bodyHtml, title) {
  return `${emptyPacket}
<title>${title}</title>
<h1>${title}</h1>

${bodyHtml}`
}

export function createStep (step) {
  const instructions = step.instructionsHtml || '(Missing instruction)'
  const distance = step.distanceText || '(Missing distance)'
  return `<li>${instructions} &mdash; ${distance}</li>\n`
}

export function createLeg (leg) {
  if (!leg.steps) throw new Error('Leg is missing steps')

  const stepsText = leg.steps.map(createStep).join('')
  // Remove the unnecessary "USA" from the address string
  const startAddress = leg.startAddress.slice(0, leg.startAddress.lastIndexOf(','))

  return `<section>
<h2>From ${startAddress}</h2>
<ol>
${stepsText}</ol>
</section>
`
}
