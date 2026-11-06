// Convertit Bricolage Grotesque (800) en police "typeface" JSON pour le texte 3D (Three.js).
// Usage : node scripts/make-typeface.mjs
import fs from 'node:fs'
import opentype from 'opentype.js'

const src = 'node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff'
const out = 'src/assets/bricolage-800.typeface.json'
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?\'’-&+ éèêàçôù'

const buf = fs.readFileSync(src)
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
const scale = 1000 / font.unitsPerEm
const r = (n) => Math.round(n * scale)

const glyphs = {}
for (const ch of chars) {
  const g = font.charToGlyph(ch)
  if (!g) continue
  const o = []
  for (const c of g.path.commands) {
    if (c.type === 'M') o.push('m', r(c.x), r(c.y))
    else if (c.type === 'L') o.push('l', r(c.x), r(c.y))
    else if (c.type === 'Q') o.push('q', r(c.x), r(c.y), r(c.x1), r(c.y1))
    else if (c.type === 'C') o.push('b', r(c.x), r(c.y), r(c.x1), r(c.y1), r(c.x2), r(c.y2))
  }
  const bb = g.getBoundingBox()
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o: o.join(' ') }
}

const data = {
  glyphs,
  familyName: 'Bricolage Grotesque',
  ascender: r(font.ascender),
  descender: r(font.descender),
  underlinePosition: r(font.tables.post.underlinePosition),
  underlineThickness: r(font.tables.post.underlineThickness),
  boundingBox: { xMin: r(font.tables.head.xMin), yMin: r(font.tables.head.yMin), xMax: r(font.tables.head.xMax), yMax: r(font.tables.head.yMax) },
  resolution: 1000,
  original_font_information: { format: 0, fontFamily: 'Bricolage Grotesque', license: 'SIL Open Font License 1.1' },
  cssFontWeight: 'bold',
  cssFontStyle: 'normal',
}
fs.mkdirSync('src/assets', { recursive: true })
fs.writeFileSync(out, JSON.stringify(data))
console.log('ok', Object.keys(glyphs).length, 'glyphes →', out, (fs.statSync(out).size / 1024).toFixed(1) + ' Ko')
