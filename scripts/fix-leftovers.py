#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Corrige os últimos comentários mal traduzidos usando a linha original do inventário."""
import re

FIX = [
('src/types/slides.ts', 40, 'type: tipo de gradiente (radial ou linear)'),
('src/types/slides.ts', 66, 'blur: intensidade do desfoque'),
('src/types/slides.ts', 368, 'special?: forma especial (marca formas difíceis de interpretar, ex.: caminhos com tipos além de L Q C A; na exportação viram imagem)'),
('src/types/slides.ts', 414, 'points: estilos das pontas ([início, fim]; opções: nenhuma, seta, ponto)'),
('src/types/slides.ts', 418, 'broken?: posição do ponto de controle da polilinha ([x, y])'),
('src/types/slides.ts', 420, 'broken2?: posição do ponto de controle da polilinha dupla ([x, y])'),
('src/types/slides.ts', 424, 'curve?: posição do ponto de controle da curva quadrática ([x, y])'),
('src/types/slides.ts', 426, 'cubic?: pontos de controle da curva cúbica ([[x1, y1], [x2, y2]])'),
('src/types/slides.ts', 464, 'chartType: tipo base do gráfico (bar/line/pie); todos os demais tipos derivam destes'),
('src/types/slides.ts', 468, 'options: opções avançadas'),
('src/types/slides.ts', 577, 'colWidths: array das larguras das colunas; ex.: [0.3, 0.5, 0.2] = 30%, 50%, 20% da largura total'),
('src/types/slides.ts', 631, 'ext: extensão do vídeo; quando o link não a contém, este campo define o tipo do recurso'),
('src/types/slides.ts', 656, 'ext: extensão do áudio; quando o link não a contém, este campo define o tipo do recurso'),
('src/components/ColorPicker/index.vue', 171, 'ao escolher uma cor fora das predefinidas, adiciona-a à lista de usadas recentemente'),
('src/components/ColorPicker/index.vue', 208, 'verifica se o ambiente suporta o conta-gotas nativo; usa-o se disponível, senão o personalizado'),
('src/components/ColorPicker/index.vue', 216, 'conta-gotas nativo'),
('src/components/ColorPicker/index.vue', 234, 'conta-gotas personalizado baseado em Canvas'),
('src/utils/element.ts', 461, 'ex.: dois elementos agrupados têm o mesmo groupId; após copiar, as cópias terão outro groupId igual entre si'),
('src/utils/element.ts', 522, 'conforme o tipo de ponta e a espessura da linha, calcula o quanto o corpo da linha deve encolher na renderização'),
('src/utils/htmlParser/index.ts', 1, 'baseado em https://github.com/andrejewski/himalaya, reescrito em TypeScript com funções simplificadas'),
('src/utils/svg2Base64.ts', 1, 'SVG para imagem base64, ver: https://github.com/scriptex/svg64'),
('src/views/components/element/TextElement/index.vue', 56, 'nó adicionado: com fontes grandes e entrelinha pequena o texto transborda e a área de arraste deixa de ser selecionável'),
('src/views/Editor/Canvas/hooks/useScaleElement.ts', 185, 'ex.: ao arrastar o canto inferior direito, o canto superior esquerdo é a base e permanece fixo; os demais pontos são recalculados'),
('src/views/Editor/Canvas/hooks/useScaleElement.ts', 301, 'com base na distância de escala horizontal, calcula a vertical mantendo a mesma proporção'),
('src/views/Editor/Canvas/hooks/useScaleElement.ts', 316, 'o tamanho calculado aqui não precisa de correção: a distância de escala já foi recalculada antes, corrigindo-o'),
('src/views/Editor/Canvas/hooks/useDragElement.ts', 119, 'Ctrl+arrastar duplica: copia o elemento selecionado e insere a cópia no canvas,'),
]

import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
changed = 0
for rel, lineno, text in FIX:
    p = os.path.join(ROOT, rel)
    with open(p, encoding='utf-8') as f:
        lines = f.readlines()
    cur = lines[lineno - 1]
    indent = cur[:len(cur) - len(cur.lstrip())]
    stripped = cur.strip()
    if stripped.startswith('<!--'):
        new = f'{indent}<!-- {text} -->\n'
    elif stripped.startswith('*'):
        new = f'{indent}* {text}\n'
    else:
        new = f'{indent}// {text}\n'
    if cur.endswith('\r\n'):
        new = new.rstrip('\n') + '\r\n'
    if cur != new:
        lines[lineno - 1] = new
        with open(p, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        changed += 1
print('Corrigidos:', changed)
