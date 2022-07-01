import { loadFile } from '../utils.js'

// Note that imports are relative to current file, but non-import FPs are relative to source root
const emptyPacket = await loadFile('./src/renderer/packet-base.html')
const packetStylets = await loadFile('./src/renderer/packet-stylesheet.css')
const trashCanSvg = await loadFile('./static/trash-can.svg')

export function packet (legs, title) {
  const bodyHtml = legs.map(leg => leg.toString()).join('\n')

  return `${emptyPacket}
<title>${title}</title>
<style>
${packetStylets}</style>

<h1>${title}</h1>
${bodyHtml}`
}

export function step (instructionsHtml, distanceText) {
  const instructions = instructionsHtml || '(Missing instruction)'
  const distance = distanceText || '(Missing distance)'

  return `<li>${instructions} &mdash; ${distance}`
}

export function leg (duration, distance, startName, endName, steps, instructions) {
  if (!steps) throw new Error('Leg is missing steps')

  return `<section>
<h2>From ${startName}</h2>
<ol>
${steps.join('\n')}
<li>
  <h2>Arrived at ${endName}</h2>
  <p>${instructions}
</ol>
</section>
`
}

export function stopsOptionList (stops) {
  return stops.map(stop => `<option>${stop}`).join('\n')
}

export function packetLinkList (names) {
  return names.map(name => `<li>
  <a href="/packet/${encodeURI(name)}">${name}</a>
  <button class=trash onclick="deletePacket('${name}')">${trashCanSvg}</button>`)
    .join('\n')
}
