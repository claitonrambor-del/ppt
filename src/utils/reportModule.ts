/**
 * ============================================================================
 * MÓDULO DE VISTORIA — bloco composto (tabela de pendências + espaço p/ foto)
 * ============================================================================
 *
 * O módulo é um par de elementos COMUNS do canvas (tabela de 3 colunas +
 * retângulo tracejado que reserva o espaço da foto), identificados pelo
 * prefixo `module:` no campo `name`. Por serem elementos comuns, funcionam em
 * todas as superfícies e exportações sem código extra.
 *
 * Existem dois MODELOS de módulo:
 *   - `half` (padrão): meia folha — a área abaixo do cabeçalho é dividida em
 *     `MODULES_PER_SHEET` partes iguais e os módulos são empilhados nas vagas;
 *   - `full`: folha inteira — um único módulo ocupa TODO o espaço restante
 *     abaixo do cabeçalho (a foto se estende até a margem inferior).
 *
 * O slot (posição) é calculado a partir da área útil da folha — assim o bloco
 * nasce sempre dentro das margens, em qualquer tamanho de folha (A4/A3) e
 * orientação. Nos dois modelos a tabela tem a MESMA altura: a diferença fica
 * apenas no espaço reservado para a foto.
 *
 * Este módulo é puro (sem Pinia/Vue): recebe tudo por parâmetro. A inserção
 * reativa fica em `src/hooks/useAddReportModule.ts`.
 * ============================================================================
 */
import { nanoid } from 'nanoid'
import type {
  PPTElement,
  PPTShapeElement,
  PPTTableElement,
  Slide,
  SlideTheme,
  TableCell,
  TableCellStyle,
} from '@/types/slides'
import { isHeaderElement } from '@/utils/header'
import { resolveMargins, getWorkArea, MM_TO_PX, type WorkArea } from '@/modules/margins'

/** Prefixo dos nomes dos elementos que compõem um módulo */
export const MODULE_NAME_PREFIX = 'module:'

/** Nomes canônicos dos elementos do módulo (marcadores estáveis) */
export const MODULE_ELEMENT_NAMES = {
  table: 'module:table',
  photo: 'module:photo',
  fullTable: 'module:full:table',
  fullPhoto: 'module:full:photo',
} as const

/** Modelos de módulo: meia folha (2 por página) ou folha inteira (1 por página) */
export type ReportModuleSize = 'half' | 'full'

/** Nomes dos elementos de cada modelo de módulo */
const MODULE_NAMES_BY_SIZE: Record<ReportModuleSize, { table: string; photo: string }> = {
  half: { table: MODULE_ELEMENT_NAMES.table, photo: MODULE_ELEMENT_NAMES.photo },
  full: { table: MODULE_ELEMENT_NAMES.fullTable, photo: MODULE_ELEMENT_NAMES.fullPhoto },
}

/** Nomes dos elementos de um modelo de módulo */
export const getModuleElementNames = (size: ReportModuleSize) => MODULE_NAMES_BY_SIZE[size]

/** Modelo do módulo a partir do nome de um de seus elementos (null se não for módulo) */
export const getModuleSizeFromName = (name?: string): ReportModuleSize | null => {
  if (!name) return null
  if (name === MODULE_ELEMENT_NAMES.table || name === MODULE_ELEMENT_NAMES.photo) return 'half'
  if (name === MODULE_ELEMENT_NAMES.fullTable || name === MODULE_ELEMENT_NAMES.fullPhoto) return 'full'
  return null
}

/** O elemento é a tabela de um módulo (de qualquer modelo)? */
export const isModuleTableElement = (element: PPTElement): boolean => {
  const size = getModuleSizeFromName(element.name)
  return !!size && element.name === MODULE_NAMES_BY_SIZE[size].table
}

/** O elemento é o espaço de foto de um módulo (de qualquer modelo)? */
export const isModulePhotoElement = (element: PPTElement): boolean => {
  const size = getModuleSizeFromName(element.name)
  return !!size && element.name === MODULE_NAMES_BY_SIZE[size].photo
}

/**
 * IDs de todos os elementos do módulo a que `element` pertence (tabela +
 * espaço da foto), para excluir o bloco inteiro de uma vez. Retorna a lista
 * vazia quando o elemento não faz parte de um módulo.
 */
export const getModuleElementIds = (slide: Slide, element: PPTElement): string[] => {
  if (!isModuleElement(element)) return []
  if (!('groupId' in element) || !element.groupId) return [element.id]

  const groupId = element.groupId
  const ids = slide.elements
    .filter(el => isModuleElement(el) && 'groupId' in el && el.groupId === groupId)
    .map(el => el.id)

  return ids.length ? ids : [element.id]
}

/** Colunas do modelo de relatório (mesma ordem da imagem) */
export const MODULE_COLUMNS = [
  'Esquadria - Localização',
  'Situação',
  'Solução recomendada',
]

/** Proporção de cada coluna da tabela (ajustada ao conteúdo de cada uma:
 *  Localização é o cabeçalho mais longo, Situação o mais curto) */
export const MODULE_COL_WIDTHS = [0.4, 0.22, 0.38]

/** Largura da tabela em relação à área do módulo (ocupa toda a largura útil
 *  entre as margens, distribuindo as 3 colunas pela página inteira) */
export const MODULE_TABLE_WIDTH_RATE = 1

/** Altura da tabela em relação à área total do módulo (espaço que sobra para a foto) */
export const MODULE_TABLE_HEIGHT_RATE = 0.22

/** Fração da altura da tabela ocupada pela linha de título (o resto vai para os dados) */
export const MODULE_TITLE_ROW_RATE = 0.35

/** Altura mínima da linha de título (cabe 1 linha de texto em 16px) */
export const MODULE_TITLE_ROW_MIN_HEIGHT = MM_TO_PX(8)

/** Tamanho da fonte dos textos da tabela (um pouco maior que o padrão de 14px) */
export const MODULE_FONT_SIZE = '16px'

/** Quantos módulos de meia folha cabem em uma folha */
export const MODULES_PER_SHEET = 2

/** Este elemento pertence a um módulo? */
export const isModuleElement = (element: PPTElement): boolean =>
  !!element.name && element.name.startsWith(MODULE_NAME_PREFIX)

/** Quantos módulos a página já tem (conta pelas tabelas, de qualquer modelo) */
export const countSlideModules = (slide: Slide): number =>
  slide.elements.filter(isModuleTableElement).length

/**
 * Área útil que sobra ABAIXO do cabeçalho — onde os módulos são empilhados.
 * Sem cabeçalho, é a área útil inteira da folha.
 */
export const getModuleArea = (
  viewportSize: number,
  viewportRatio: number,
  slide: Slide,
): WorkArea => {
  const area = getWorkArea(viewportSize, viewportSize * viewportRatio, resolveMargins(slide))

  const headerEls = slide.elements.filter(isHeaderElement)
  let headerBottom = area.top
  for (const el of headerEls) {
    if ('height' in el) headerBottom = Math.max(headerBottom, el.top + el.height)
  }

  const top = Math.max(area.top, headerBottom)

  return {
    ...area,
    top,
    height: Math.max(0, area.bottom - top),
  }
}

/**
 * Retângulo do slot `index` (0 = primeiro/topo, 1 = segundo/base), dividindo
 * a área dos módulos em partes iguais com uma folga entre elas.
 * No modelo de folha inteira só existe o slot 0 e ele é a área toda.
 */
export const getModuleSlot = (
  index: number,
  viewportSize: number,
  viewportRatio: number,
  slide: Slide,
  size: ReportModuleSize = 'half',
): { left: number; top: number; width: number; height: number } => {
  const area = getModuleArea(viewportSize, viewportRatio, slide)

  // Folha inteira: ocupa todo o espaço que sobra abaixo do cabeçalho
  if (size === 'full') {
    return { left: area.left, top: area.top, width: area.width, height: area.height }
  }

  const gap = MM_TO_PX(4)
  const slotHeight = (area.height - gap * (MODULES_PER_SHEET - 1)) / MODULES_PER_SHEET

  return {
    left: area.left,
    top: area.top + index * (slotHeight + gap),
    width: area.width,
    height: slotHeight,
  }
}

/**
 * Primeiro slot livre da folha. Um slot está ocupado quando já existe uma
 * tabela de módulo com o centro dentro dele — assim, excluir um módulo libera
 * a vaga dele (e não empurra os demais para baixo).
 *
 * Os dois modelos não se misturam na mesma folha: o módulo de folha inteira só
 * é inserido em uma página ainda vazia de módulos, e uma página que já tem o
 * módulo de folha inteira não recebe módulos de meia folha.
 * Retorna -1 quando não há vaga para o modelo pedido.
 */
export const getFirstFreeModuleSlot = (
  viewportSize: number,
  viewportRatio: number,
  slide: Slide,
  size: ReportModuleSize = 'half',
): number => {
  const moduleTables = slide.elements.filter(isModuleTableElement)

  // Folha inteira: cabe sozinha na página (ocupa todo o espaço livre)
  if (size === 'full') return moduleTables.length ? -1 : 0

  // Uma página com módulo de folha inteira não tem mais espaço para meia folha
  const hasFullModule = moduleTables.some(
    el => getModuleSizeFromName(el.name) === 'full',
  )
  if (hasFullModule) return -1

  const occupied = new Set<number>()

  // Caixas (top/height) das tabelas de módulo de meia folha já existentes
  const tableBoxes: { top: number; height: number }[] = []
  for (const el of moduleTables) {
    if (!('height' in el)) continue
    tableBoxes.push({ top: el.top, height: el.height })
  }

  for (let i = 0; i < MODULES_PER_SHEET; i++) {
    const slot = getModuleSlot(i, viewportSize, viewportRatio, slide)

    for (const box of tableBoxes) {
      const center = box.top + box.height / 2
      if (center >= slot.top && center <= slot.top + slot.height) {
        occupied.add(i)
        break
      }
    }
  }

  for (let i = 0; i < MODULES_PER_SHEET; i++) {
    if (!occupied.has(i)) return i
  }
  return -1
}

/**
 * Divide a altura total da tabela do módulo entre a linha de título (mais
 * compacta) e a linha de dados. A soma é a altura total recebida — assim a
 * posição da foto (calculada a partir da altura da tabela) não muda.
 */
export const getModuleRowHeights = (tableHeight: number): number[] => {
  const titleRow = Math.round(Math.min(
    Math.max(tableHeight * MODULE_TITLE_ROW_RATE, MODULE_TITLE_ROW_MIN_HEIGHT),
    Math.max(MODULE_TITLE_ROW_MIN_HEIGHT, tableHeight - 36),
  ))
  return [titleRow, tableHeight - titleRow]
}

/**
 * Altura da tabela de um módulo. O modelo de folha inteira usa a mesma altura
 * do modelo de meia folha — a tabela fica visualmente igual nos dois; o que
 * muda é o espaço reservado para a foto abaixo dela.
 */
export const getModuleTableHeight = (
  slotHeight: number,
  size: ReportModuleSize,
): number => {
  const gap = MM_TO_PX(4)
  const base = size === 'full'
    ? Math.max(0, (slotHeight - gap * (MODULES_PER_SHEET - 1)) / MODULES_PER_SHEET)
    : slotHeight
  return Math.max(MM_TO_PX(18), base * MODULE_TABLE_HEIGHT_RATE)
}

/**
 * Monta os elementos de um módulo (tabela + placeholder de foto) para o
 * retângulo informado. Os dois nascem FIXOS (`lock: true`) e compartilham o
 * mesmo `groupId`, então ao "Desfixar" um deles os dois são liberados juntos.
 */
export const buildModuleElements = (
  slot: { left: number; top: number; width: number; height: number },
  theme: SlideTheme,
  size: ReportModuleSize = 'half',
): PPTElement[] => {
  const gap = MM_TO_PX(3)
  const groupId = nanoid(10)
  const names = getModuleElementNames(size)

  // --- Tabela de pendências (cabeçalho + 1 linha de dados) ---
  // Ocupa toda a largura útil da área do módulo (mesmo alinhamento da foto abaixo)
  const tableHeight = getModuleTableHeight(slot.height, size)
  const tableWidth = slot.width * MODULE_TABLE_WIDTH_RATE
  const tableLeft = slot.left + (slot.width - tableWidth) / 2

  const headerStyle: TableCellStyle = {
    bold: true,
    align: 'center',
    fontsize: MODULE_FONT_SIZE,
    fontname: theme.fontName,
    color: theme.fontColor,
  }
  const bodyStyle: TableCellStyle = {
    bold: true,
    fontsize: MODULE_FONT_SIZE,
    fontname: theme.fontName,
    color: theme.fontColor,
  }

  const data: TableCell[][] = [
    MODULE_COLUMNS.map(text => ({ id: nanoid(10), colspan: 1, rowspan: 1, text, style: headerStyle })),
    MODULE_COLUMNS.map(() => ({ id: nanoid(10), colspan: 1, rowspan: 1, text: '', style: bodyStyle })),
  ]

  const table: PPTTableElement = {
    type: 'table',
    id: nanoid(10),
    name: names.table,
    groupId,
    lock: true,
    left: tableLeft,
    top: slot.top,
    width: tableWidth,
    height: tableHeight,
    rotate: 0,
    colWidths: MODULE_COL_WIDTHS,
    data,
    cellMinHeight: tableHeight / 2,
    // linha de título mais compacta; a linha de dados fica com o resto
    rowHeights: getModuleRowHeights(tableHeight),
    outline: {
      width: 1,
      style: 'solid',
      color: '#8c8c8c',
    },
    // sem `theme`: as linhas ficam sem cor de fundo (só as bordas do outline)
  }

  // --- Espaço reservado para a foto (retângulo tracejado) ---
  const photoTop = slot.top + tableHeight + gap
  const photoHeight = Math.max(MM_TO_PX(30), slot.top + slot.height - photoTop)

  const photo: PPTShapeElement = {
    type: 'shape',
    id: nanoid(10),
    name: names.photo,
    groupId,
    lock: true,
    left: slot.left,
    top: photoTop,
    width: slot.width,
    height: photoHeight,
    viewBox: [200, 200],
    path: 'M 0 0 L 200 0 L 200 200 L 0 200 Z',
    fill: '#ffffff',
    fixedRatio: false,
    rotate: 0,
    outline: {
      width: 1,
      style: 'dashed',
      color: '#bfbfbf',
    },
  }

  return [table, photo]
}

/**
 * Normaliza os módulos JÁ existentes nas páginas (migração de versão).
 * Idempotente: rodar novamente não altera nada.
 *
 * - reaplica a largura/centralização da tabela conforme a taxa atual;
 * - redistribui as colunas conforme o modelo (40% / 22% / 38%);
 * - aplica a altura compacta da linha de título apenas em módulos antigos
 *   (sem `rowHeights`): alturas de linha já ajustadas pelo usuário são
 *   PRESERVADAS — a altura da tabela passa a ser a soma delas (a foto abaixo
 *   é reposicionada em consequência);
 * - aplica texto maior e em negrito nas células que ainda usam o padrão antigo
 *   (identificadas pela ausência de `fontsize`). O tema NÃO é alterado, para
 *   não desfazer uma escolha do usuário no painel de estilo.
 *
 * Deve ser chamada DEPOIS de `ensureHeaderInSlide` — o slot do módulo é
 * calculado a partir da posição do cabeçalho.
 */
export const ensureModuleInSlide = (
  slide: Slide,
  viewportSize: number,
  viewportRatio: number,
): Slide => {
  const hasModuleTable = slide.elements.some(
    el => el.type === 'table' && isModuleTableElement(el),
  )
  if (!hasModuleTable) return slide

  // Comparação com folga: o ResizeObserver arredonda a altura do elemento,
  // então diferenças de sub-pixel não devem disparar uma "migração".
  const isClose = (a: number, b: number, tolerance = 0.5) => Math.abs(a - b) <= tolerance

  let slideChanged = false
  const elements = [...slide.elements]

  // Normaliza cada tabela de módulo e sua respectiva foto
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    if (el.type !== 'table') continue
    const size = getModuleSizeFromName(el.name)
    if (!size || el.name !== getModuleElementNames(size).table) continue

    let tableChanged = false

    // --- Identifica o slot atual (no modelo do próprio módulo) ---
    let currentSlot: ReturnType<typeof getModuleSlot> | null = null
    const center = el.top + el.height / 2
    const slotCount = size === 'full' ? 1 : MODULES_PER_SHEET
    for (let j = 0; j < slotCount; j++) {
      const slot = getModuleSlot(j, viewportSize, viewportRatio, slide, size)
      if (center >= slot.top && center <= slot.top + slot.height) {
        currentSlot = slot
        break
      }
    }
    if (!currentSlot) continue

    const tableWidth = currentSlot.width * MODULE_TABLE_WIDTH_RATE
    const tableLeft = currentSlot.left + (currentSlot.width - tableWidth) / 2

    // --- alturas das linhas ---
    // Se o usuário já ajustou as linhas manualmente (arraste no modo edição),
    // preserva o ajuste e deriva a altura da tabela dele. Sem ajuste manual
    // (módulo antigo sem rowHeights), aplica o padrão pelo slot atual.
    const customRowHeights =
      el.rowHeights && el.rowHeights.length === el.data.length ? el.rowHeights : null
    const defaultTableHeight = getModuleTableHeight(currentSlot.height, size)
    const tableHeight = customRowHeights
      ? customRowHeights.reduce((a, b) => a + b, 0)
      : defaultTableHeight
    const rowHeights = customRowHeights || getModuleRowHeights(defaultTableHeight)

    // --- distribuição das colunas (só se a tabela ainda tiver as 3 colunas) ---
    const colWidths = el.colWidths.length === MODULE_COL_WIDTHS.length
      ? [...MODULE_COL_WIDTHS]
      : el.colWidths
    const colWidthsChanged = colWidths !== el.colWidths &&
      el.colWidths.some((w, idx) => !isClose(w, colWidths[idx], 0.01))

    if (
      !isClose(el.left, tableLeft) ||
      !isClose(el.width, tableWidth) ||
      !isClose(el.height, tableHeight) ||
      !el.rowHeights ||
      el.rowHeights.length !== rowHeights.length ||
      el.rowHeights.some((h, idx) => !isClose(h, rowHeights[idx])) ||
      colWidthsChanged
    ) tableChanged = true

    // --- Texto um pouco maior e em negrito (apenas módulos antigos) ---
    const data = el.data.map(row => row.map(cell => {
      if (cell.style?.fontsize) return cell
      tableChanged = true
      return { ...cell, style: { ...cell.style, bold: true, fontsize: MODULE_FONT_SIZE } }
    }))

    if (tableChanged) {
      elements[i] = { ...el, left: tableLeft, width: tableWidth, height: tableHeight, rowHeights, colWidths, data } as PPTTableElement
      slideChanged = true

      // --- Atualiza a foto correspondente (mesmo groupId) para não abrir vão ---
      const gap = MM_TO_PX(3)
      const photoTop = currentSlot.top + tableHeight + gap
      const photoHeight = Math.max(MM_TO_PX(30), currentSlot.top + currentSlot.height - photoTop)

      for (let k = 0; k < elements.length; k++) {
        const p = elements[k]
        if (isModulePhotoElement(p) && 'groupId' in p && p.groupId === el.groupId && 'top' in p && 'height' in p) {
          if (!isClose(p.top, photoTop) || !isClose(p.height, photoHeight)) {
            elements[k] = { ...p, top: photoTop, height: photoHeight }
            slideChanged = true
          }
          break
        }
      }
    }
  }

  return slideChanged ? { ...slide, elements } : slide
}
