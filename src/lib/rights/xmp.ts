import type { AssetClaim } from './claim.ts'

const PACKET_ID = 'W5M0MpCehiHzreSzNTczkc9d'

const NAMESPACES: readonly [string, string][] = [
  ['dc', 'http://purl.org/dc/elements/1.1/'],
  ['xmp', 'http://ns.adobe.com/xap/1.0/'],
  ['xmpRights', 'http://ns.adobe.com/xap/rights/'],
  ['photoshop', 'http://ns.adobe.com/photoshop/1.0/'],
  ['plus', 'http://ns.useplus.org/ldf/xmp/1.0/'],
  ['cc', 'http://creativecommons.org/ns#'],
]

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function alt(tag: string, value: string): string {
  return `   <${tag}><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(value)}</rdf:li></rdf:Alt></${tag}>`
}

function seq(tag: string, values: readonly string[]): string {
  const items = values.map((value) => `<rdf:li>${escapeXml(value)}</rdf:li>`).join('')
  return `   <${tag}><rdf:Seq>${items}</rdf:Seq></${tag}>`
}

function bag(tag: string, values: readonly string[]): string {
  const items = values.map((value) => `<rdf:li>${escapeXml(value)}</rdf:li>`).join('')
  return `   <${tag}><rdf:Bag>${items}</rdf:Bag></${tag}>`
}

function plain(tag: string, value: string): string {
  return `   <${tag}>${escapeXml(value)}</${tag}>`
}

export function xmpElement(claim: AssetClaim): string {
  const properties: string[] = [seq('dc:creator', [claim.creator])]
  if (claim.title !== undefined) properties.push(alt('dc:title', claim.title))
  if (claim.description !== undefined) properties.push(alt('dc:description', claim.description))
  properties.push(
    alt('dc:rights', claim.rights),
    bag('dc:subject', claim.keywords),
    plain('xmp:CreatorTool', claim.creatorTool),
    plain('xmpRights:Marked', 'True'),
    plain('xmpRights:WebStatement', claim.webStatement),
    alt('xmpRights:UsageTerms', claim.usageTerms),
    plain('photoshop:Credit', claim.creator),
    plain('photoshop:Source', claim.source),
    plain('plus:LicensorName', claim.creator),
    plain('plus:LicensorURL', claim.source),
    plain('cc:license', claim.licenceUrl),
    plain('cc:attributionName', claim.creator),
    plain('cc:attributionURL', claim.source),
  )

  const declarations = NAMESPACES.map(([prefix, uri]) => `    xmlns:${prefix}="${uri}"`).join('\n')

  return [
    `<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="${escapeXml(claim.creatorTool)}">`,
    ' <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '  <rdf:Description rdf:about=""',
    declarations,
    '    >',
    ...properties,
    '  </rdf:Description>',
    ' </rdf:RDF>',
    '</x:xmpmeta>',
  ].join('\n')
}

export function xmpPacket(claim: AssetClaim): string {
  return [`<?xpacket begin="﻿" id="${PACKET_ID}"?>`, xmpElement(claim), '<?xpacket end="r"?>'].join(
    '\n',
  )
}
