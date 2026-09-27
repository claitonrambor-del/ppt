/**
 * ============================================================================
 * MÓDULO: MARGENS DE TRABALHO (núcleo puro, reutilizável)
 * ============================================================================
 *
 * Módulo autocontido e genérico para qualquer editor de documento/página
 * baseado em folha física (mm) — foi desenhado para ser copiado entre
 * projetos. Não depende de Vue, Pinia nem de nenhum tipo do app: tudo que
 * o núcleo precisa chega como parâmetro (largura/altura da folha em px e
 * margens em px).
 *
 * Camadas do módulo:
 *   - core.ts  (este arquivo): matemática pura, sem dependências
 *   - paper.ts: tipos/valores de folhas (A4, A3) e conversões
 *   - index.ts: barrel de exports
 *
 * Conceitos:
 *   - A folha tem um tamanho físico em mm e é renderizada numa largura
 *     lógica fixa em px (ex.: 1000px). A conversão px ↔ mm é 1 função.
 *   - A "margem de trabalho" é o espaço (em mm) reservado nas 4 bordas da
 *     folha; a "área útil" é a folha menos as margens.
 *   - Unidade de armazenamento das margens: px lógicos da folha
 *     (MM_TO_PX mm). A UI converte para mm somente para exibir/editar.
 * ============================================================================
 */

/** Margens de uma folha, em px lógicos (unidade de armazenamento) */
export interface Margins {
  left: number
  top: number
  right: number
  bottom: number
}

/** Props de margem nomeados como no modelo de slide (marginL/T/R/B) */
export interface MarginProps {
  marginL: number
  marginT: number
  marginR: number
  marginB: number
}

/** Área útil da folha, em px lógicos (folha menos as margens) */
export interface WorkArea {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

/** Dimensões de uma folha em px lógicos */
export interface PaperDimensions {
  width: number
  height: number
}

/** px lógicos por mm da folha (calibragem física do canvas) */
export const PX_PER_MM = 1000 / 210

/** Converte mm para px lógicos (arredondado a 2 casas, evita decimais estranhos) */
export const MM_TO_PX = (mm: number): number => Math.round(mm * PX_PER_MM * 100) / 100

/** Converte px lógicos para mm (arredondado a 1 casa, evita decimais estranhos) */
export const PX_TO_MM = (px: number): number => Math.round((px / PX_PER_MM) * 10) / 10

/** Margem padrão: 7mm em cada lado */
export const DEFAULT_MARGIN_MM = 7

/** Limites aceitos para margens personalizadas (mm) */
export const MARGIN_MIN_MM = 0
export const MARGIN_MAX_MM = 50

/** Margens padrão em px lógicos */
export const DEFAULT_MARGINS: Margins = {
  left: MM_TO_PX(DEFAULT_MARGIN_MM),
  top: MM_TO_PX(DEFAULT_MARGIN_MM),
  right: MM_TO_PX(DEFAULT_MARGIN_MM),
  bottom: MM_TO_PX(DEFAULT_MARGIN_MM),
}

/** Converte margens (px) para props nomeados de slide (marginL/T/R/B) */
export const toMarginProps = (m: Margins): MarginProps => ({
  marginL: m.left,
  marginT: m.top,
  marginR: m.right,
  marginB: m.bottom,
})

/** Converte props nomeados de slide (marginL/T/R/B) para margens (px) */
export const fromMarginProps = (props: MarginProps): Margins => ({
  left: props.marginL,
  top: props.marginT,
  right: props.marginR,
  bottom: props.marginB,
})

/** Margens padrão no formato de props de slide */
export const getDefaultMarginProps = (): MarginProps => toMarginProps(DEFAULT_MARGINS)

/** Lê as margens de um registro arbitrário, aplicando o padrão quando ausentes */
export const resolveMargins = (
  source: Partial<Record<'marginL' | 'marginT' | 'marginR' | 'marginB', number>> | null | undefined,
): Margins => ({
  left: source?.marginL ?? DEFAULT_MARGINS.left,
  top: source?.marginT ?? DEFAULT_MARGINS.top,
  right: source?.marginR ?? DEFAULT_MARGINS.right,
  bottom: source?.marginB ?? DEFAULT_MARGINS.bottom,
})

/** Lê as margens de um registro e já devolve no formato de props de slide */
export const resolveMarginProps = (
  source: Partial<Record<'marginL' | 'marginT' | 'marginR' | 'marginB', number>> | null | undefined,
): MarginProps => toMarginProps(resolveMargins(source))

/**
 * Calcula a área útil da folha (folha menos as margens), em px lógicos.
 * @param paperWidth largura da folha em px lógicos
 * @param paperHeight altura da folha em px lógicos
 * @param margins margens em px lógicos
 */
export const getWorkArea = (paperWidth: number, paperHeight: number, margins: Margins): WorkArea => ({
  left: margins.left,
  top: margins.top,
  right: paperWidth - margins.right,
  bottom: paperHeight - margins.bottom,
  width: paperWidth - margins.left - margins.right,
  height: paperHeight - margins.top - margins.bottom,
})

/**
 * Encaixa uma caixa (posição + tamanho) dentro da área útil. Mutante:
 * altera e retorna o próprio objeto `box`. Caixas maiores que a área útil
 * são centralizadas nela.
 */
export const fitBoxIntoWorkArea = <T extends { left: number; top: number; width?: number; height?: number }>(
  box: T,
  area: WorkArea,
): T => {
  const width = box.width ?? 0
  const height = box.height ?? 0

  if (width >= area.width) box.left = (area.left + area.right - width) / 2
  else if (box.left < area.left) box.left = area.left
  else if (box.left + width > area.right) box.left = area.right - width

  if (height >= area.height) box.top = (area.top + area.bottom - height) / 2
  else if (box.top < area.top) box.top = area.top
  else if (box.top + height > area.bottom) box.top = area.bottom - height

  return box
}

/**
 * Encaixa as duas pontas de uma linha (start/end) dentro da área útil.
 * Mutante: altera e retorna o próprio objeto `points`.
 */
export const fitLinePointsIntoWorkArea = <T extends { start: [number, number]; end: [number, number] }>(
  points: T,
  area: WorkArea,
): T => {
  const clampX = (x: number) => Math.min(Math.max(x, area.left), area.right)
  const clampY = (y: number) => Math.min(Math.max(y, area.top), area.bottom)
  points.start = [clampX(points.start[0]), clampY(points.start[1])]
  points.end = [clampX(points.end[0]), clampY(points.end[1])]
  return points
}

/**
 * Calcula o deslocamento (offsetX, offsetY) para mover um bloco (ex.: seleção
 * multi-elemento, definida pelo range minX/maxX/minY/maxY) para dentro da área
 * útil. Blocos maiores que a área útil são centralizados nela.
 */
export const getBlockFitOffset = (
  block: { minX: number; maxX: number; minY: number; maxY: number },
  area: WorkArea,
): { offsetX: number; offsetY: number } => {
  const width = block.maxX - block.minX
  const height = block.maxY - block.minY

  let offsetX = 0
  let offsetY = 0

  if (width >= area.width) offsetX = (area.left + area.right) / 2 - (block.minX + block.maxX) / 2
  else if (block.minX < area.left) offsetX = area.left - block.minX
  else if (block.maxX > area.right) offsetX = area.right - block.maxX

  if (height >= area.height) offsetY = (area.top + area.bottom) / 2 - (block.minY + block.maxY) / 2
  else if (block.minY < area.top) offsetY = area.top - block.minY
  else if (block.maxY > area.bottom) offsetY = area.bottom - block.maxY

  return { offsetX, offsetY }
}

/**
 * Escala as margens proporcionalmente a uma mudança de tamanho da folha:
 * margens horizontais (left/right) escalam pela variação da largura e
 * verticais (top/bottom) pela altura, preservando a proporção de cada margem
 * em relação à folha (ex.: 7mm em A4 → ~9,9mm em A3). Resultado limitado a
 * MARGIN_MAX_MM. Retorna no formato de props de slide.
 */
export const getScaledMarginProps = (
  margins: Margins,
  scaleX: number,
  scaleY: number,
): MarginProps => {
  const maxPx = MM_TO_PX(MARGIN_MAX_MM)
  const scale = (px: number, factor: number) => Math.min(maxPx, MM_TO_PX(PX_TO_MM(px) * factor))
  return {
    marginL: scale(margins.left, scaleX),
    marginT: scale(margins.top, scaleY),
    marginR: scale(margins.right, scaleX),
    marginB: scale(margins.bottom, scaleY),
  }
}
