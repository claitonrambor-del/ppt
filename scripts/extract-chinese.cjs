const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const files = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(vue|ts|html)$/.test(entry.name)) files.push(full)
  }
}
walk(path.join(ROOT, 'src'))
files.push(path.join(ROOT, 'index.html'))

// Segment starts at a CJK ideograph, extends over CJK chars, CJK/full-width punctuation and some ASCII
const SEG_RE = /[\u3400-\u9FFF\uF900-\uFAFF][\u3400-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF\u201C\u201D\u2018\u2019\u00B7a-zA-Z0-9%/+\-·]*/g
// Any char that signals "still Chinese content here" after replacements
const NEEDS_TRANSLATION_RE = /[\u3000-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/

function isCommentContext(line) {
  const t = line.trim()
  if (/^\/\//.test(t)) return true
  if (/^\*|^\/\*/.test(t)) return true
  if (/^<!--/.test(t)) return true
  return false
}

const strings = new Map()
const comments = new Map()

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  const lines = content.split('\n')
  lines.forEach((line, i) => {
    if (!NEEDS_TRANSLATION_RE.test(line)) return
    const matches = line.match(SEG_RE) || []
    const commentCtx = isCommentContext(line)
    for (const m of matches) {
      const map = commentCtx ? comments : strings
      if (!map.has(m)) map.set(m, { count: 0, file: path.relative(ROOT, file), line: i + 1, sample: line.trim().slice(0, 200) })
      map.get(m).count++
    }
  })
}

const dump = (map, out) => {
  const list = [...map.entries()].sort((a, b) => b[0].length - a[0].length)
  fs.writeFileSync(out, list.map(([tok, info]) => `${tok}\t${info.count}\t${info.file}:${info.line}\t${info.sample}`).join('\n'))
}
dump(strings, '/tmp/segments-S.txt')
dump(comments, '/tmp/segments-C.txt')
console.log('String segments:', strings.size, 'Comment segments:', comments.size)
