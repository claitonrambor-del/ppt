# Módulo: Margens de Trabalho

Módulo **autocontido e reutilizável** de margens de trabalho para editores de
documento/página baseados em folhas físicas (mm). Sem dependências de Vue,
Pinia ou tipos do app — a matemática é pura e tudo chega por parâmetro.

## Como reutilizar em outro projeto

1. Copie a pasta inteira:

```
src/modules/margins/
├── core.ts     # núcleo puro: tipos, conversões px↔mm, área útil, encaixes, escala
├── paper.ts    # folhas físicas (A4, A3) e orientações (retrato/paisagem)
├── index.ts    # barrel de exports
└── README.md
```

2. No projeto de destino, adapte somente a **camada de ligação (binding)** ao
   modelo de dados local. Neste app, os bindings são:

```
src/configs/margins.ts      # reexporta o módulo com nomes legados (getSlideMargins etc.)
src/configs/paperSizes.ts   # reexporta as folhas físicas
```

3. Integre com o estado do app (exemplo deste projeto):

```ts
// área útil do slide atual (folha menos margens)
const area = getWorkArea(viewportSize, viewportSize * viewportRatio, resolveMargins(currentSlide))

// novo elemento nunca nasce fora da área útil
fitBoxIntoWorkArea(position, area)

// seleção multi-elemento encaixada como bloco coeso
const { offsetX, offsetY } = getBlockFitOffset(getElementListRange(selected), area)

// ao trocar a folha, escala as margens proporcionalmente (7mm em A4 → ~9,9mm em A3)
getScaledMarginProps(resolveMargins(slide), newWidth / oldWidth, newHeight / oldHeight)
```

## Conceitos

- **Folha**: tamanho físico em mm, renderizada numa largura lógica fixa em px
  (calibragem: `PX_PER_MM = 1000 / 210`, ou seja, 1000px = 210mm de A4 retrato).
- **Margem de trabalho**: espaço reservado nas 4 bordas da folha.
- **Área útil**: folha menos as margens. Novos elementos e alinhamentos
  respeitam essa área.
- **Unidade de armazenamento**: px lógicos da folha (`marginL/T/R/B` nos
  slides). A UI converte para mm somente para exibir/editar (`MM_TO_PX`/`PX_TO_MM`).

## API principal (core.ts)

| Export | Descrição |
| --- | --- |
| `MM_TO_PX` / `PX_TO_MM` | Conversões px ↔ mm (com arredondamento anti-ruído) |
| `DEFAULT_MARGIN_MM` / `MARGIN_MIN_MM` / `MARGIN_MAX_MM` | Constantes de configuração (7mm padrão, 0–50mm) |
| `DEFAULT_MARGINS` / `getDefaultMarginProps()` | Margens padrão em px e no formato de props de slide |
| `resolveMargins(source)` | Lê `marginL/T/R/B` de um registro, aplicando o padrão quando ausentes |
| `getWorkArea(w, h, margins)` | Área útil (left/top/right/width/height) em px |
| `fitBoxIntoWorkArea(box, area)` | Encaixa uma caixa (mutante) na área útil |
| `fitLinePointsIntoWorkArea(points, area)` | Encaixa pontas de linha (mutante) na área útil |
| `getBlockFitOffset(block, area)` | Offset para encaixar um bloco (seleção) como um todo |
| `getScaledMarginProps(margins, scaleX, scaleY)` | Margens escaladas proporcionalmente à troca de folha |
| `toMarginProps` / `fromMarginProps` | Conversão entre `Margins` e props `marginL/T/R/B` |

## API de folhas (paper.ts)

| Export | Descrição |
| --- | --- |
| `PAPER_SIZES_MM` | Dimensões reais em mm por folha/orientação |
| `getPaperDimensionsPx(size, orientation)` | Dimensões da folha em px lógicos do canvas |
| `getPaperRatio(size, orientation)` | Proporção altura/largura |
| `PAPER_SIZE_LABELS` / `PAPER_ORIENTATION_LABELS` | Rótulos pt-BR para UI |

## Regras de comportamento implementadas

1. Margens têm **decimais limpos**: conversões arredondam (2 casas em px,
   1 casa em mm) para nunca exibir valores como `6.9993`.
2. Ao trocar **folha/orientação/tamanho**, as margens **escalam
   proporcionalmente** (horizontais pela largura, verticais pela altura),
   limitadas a `MARGIN_MAX_MM`.
3. Elementos novos, linhas e seleções **não nascem fora da área útil**;
   alinhamentos usam a área útil como referência.
