#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Traduz comentários linha a linha: recupera original do git e aplica tradução completa."""
import os, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CJK = re.compile(r'[\u4e00-\u9fff]')

# Carrega dicionários de tradução (lote1..lote4)
TRANS = {}
for i in range(1, 5):
    p = os.path.join(ROOT, 'scripts', 'comment-translations', f'lote{i}.py')
    if os.path.exists(p):
        ns = {}
        exec(open(p, encoding='utf-8').read(), ns)
        TRANS.update(ns['TRANS'])

def original_file(relpath):
    r = subprocess.run(['git', 'show', f'HEAD:{relpath}'], capture_output=True)
    if r.returncode != 0:
        return None
    return r.stdout.decode('utf-8', errors='replace')

changed = 0
targets = []
for base, dirs, fnames in os.walk(os.path.join(ROOT, 'src')):
    for fn in fnames:
        if fn.endswith(('.vue', '.ts')):
            targets.append(os.path.join(base, fn))
targets.append(os.path.join(ROOT, 'index.html'))

for path in targets:
    rel = os.path.relpath(path, ROOT)
    orig = original_file(rel)
    if orig is None:
        continue
    with open(path, encoding='utf-8') as f:
        cur_lines = f.readlines()
    orig_lines = orig.splitlines(keepends=True)
    if len(orig_lines) != len(cur_lines):
        continue
    modified = False
    for i, (cur, o) in enumerate(zip(cur_lines, orig_lines)):
        if CJK.search(o) and o.strip().startswith(('//', '*', '<!--')):
            # busca tradução exata do conteúdo da linha original
            o_stripped = o.strip()
            for prefix in ('<!--', '//', '*', '/*'):
                if o_stripped.startswith(prefix):
                    content = o_stripped[len(prefix):].strip().rstrip('->').strip() if prefix == '<!--' else o_stripped[len(prefix):].strip()
                    key = (prefix, content)
                    trans = TRANS.get(key)
                    if trans is not None:
                        # reconstrói a linha com a mesma indentação e prefixo
                        indent = o[:len(o) - len(o.lstrip())]
                        if prefix == '<!--':
                            new = f"{indent}<!-- {trans} -->\n"
                        else:
                            new = f"{indent}{prefix} {trans}\n"
                        if cur != new:
                            cur_lines[i] = new
                            modified = True
                            changed += 1
                    break
    if modified:
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(cur_lines)

print('Comentários traduzidos:', changed)
