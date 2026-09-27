const fs = require('fs')
const path = require('path')
const dict = require('./translations.cjs')

const ROOT = path.resolve(__dirname, '..')
const files = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(vue|ts|html|json)$/.test(entry.name)) files.push(full)
    }
}
walk(path.join(ROOT, 'src'))
files.push(path.join(ROOT, 'index.html'))
for (const f of fs.readdirSync(path.join(ROOT, 'public/mocks'))) {
  if (f.endsWith('.json')) files.push(path.join(ROOT, 'public/mocks', f))
}

const LONG_FIRST = [...dict].sort((a, b) => b[0].length - a[0].length)

let changed = 0
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const before = content
  for (const [zh, pt] of LONG_FIRST) {
    if (content.includes(zh)) content = content.split(zh).join(pt)
  }
  if (content !== before) {
    fs.writeFileSync(file, content)
    changed++
  }
}
console.log('Arquivos modificados:', changed)
