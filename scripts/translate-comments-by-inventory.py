#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Traduz comentários usando o inventário original /tmp/chinese-lines.txt.
Chaves dos lotes: conteúdo COM prefixo (//, *, <!--)."""
import os, re
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CJK = re.compile(r'[\u4e00-\u9fff]')

TRANS = {}
for i in range(1, 6):
    ns = {}
    exec(open(os.path.join(ROOT, 'scripts', 'comment-translations', f'lote{i}.py'), encoding='utf-8').read(), ns)
    data = ns['TRANS']
    if isinstance(data, dict):
        TRANS.update(data)
    else:
        for zh, pt in data:
            TRANS[zh] = pt

# Chaves normalizadas sem prefixo, para busca alternativa
TRANS_NOPREFIX = {}
for k, v in TRANS.items():
    t = k.strip()
    for p in ('//', '*', '<!--', '/*'):
        if t.startswith(p):
            t = t[len(p):].strip()
            if p == '<!--':
                t = t.rstrip('->').strip()
            break
    TRANS_NOPREFIX.setdefault(t, v)

inv = defaultdict(dict)
with open('/tmp/chinese-lines.txt', encoding='utf-8') as f:
    for raw in f:
        raw = raw.rstrip('\n').rstrip('\r')
        m = re.match(r'^(src/[^:]+):(\d+):(.*)$', raw)
        if not m:
            continue
        path, lineno, content = m.group(1), int(m.group(2)), m.group(3)
        if not CJK.search(content):
            continue
        t = content.strip()
        if t.startswith(('//', '*', '/*', '<!--')):
            inv[path][lineno] = content

changed = 0
missing = []
for rel, linemap in inv.items():
    full = os.path.join(ROOT, rel)
    if not os.path.exists(full):
        continue
    with open(full, encoding='utf-8') as f:
        lines = f.readlines()
    modified = False
    for lineno, orig in linemap.items():
        if lineno - 1 >= len(lines):
            continue
        cur = lines[lineno - 1]
        if not CJK.search(cur):
            continue  # já traduzida
        o = orig.strip()
        # tentativa 1: linha inteira como chave
        trans = TRANS.get(o)
        if trans is None:
            # tentativa 2: conteúdo sem prefixo
            prefix = None
            content = None
            for p in ('<!--', '//', '* ', '/* '):
                if o.startswith(p):
                    prefix = p.strip()
                    content = o[len(p):].strip()
                    if prefix == '<!--':
                        content = content.rstrip('->').strip()
                    break
            if content:
                trans = TRANS_NOPREFIX.get(content)
        if trans is None:
            missing.append(o[:80])
            continue
        indent = orig[:len(orig) - len(orig.lstrip())]
        if o.startswith('<!--'):
            new = f'{indent}<!-- {trans} -->\n'
        elif o.startswith('*'):
            new = f'{indent}* {trans}\n'
        else:
            new = f'{indent}// {trans}\n'
        if cur.endswith('\r\n'):
            new = new.rstrip('\n') + '\r\n'
        lines[lineno - 1] = new
        modified = True
        changed += 1
    if modified:
        with open(full, 'w', encoding='utf-8') as f:
            f.writelines(lines)

print('Comentários traduzidos:', changed)
if missing:
    print('Sem tradução:', len(missing))
    for m in missing[:15]:
        print(' -', m)
