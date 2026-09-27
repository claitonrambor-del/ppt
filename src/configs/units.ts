/**
 * Unidades de medida do sistema
 *
 * O canvas é calibrado fisicamente: a largura lógica do viewport (viewportSize,
 * padrão 1000px) corresponde sempre a uma folha A4 em retrato (210mm). Portanto:
 *
 *   1 mm = PX_PER_MM px lógicos do canvas
 *
 * Toda a interface exibe valores em milímetros (mm) e converte internamente
 * para os px lógicos do canvas. A régua fixa, a régua móvel de medição e os
 * painéis usam a mesma escala, garantindo consistência entre UI e medição.
 */

/** px lógicos do canvas por milímetro (A4 retrato = 210mm de largura) */
export const PX_PER_MM = 1000 / 210

/** Converte milímetros para px lógicos do canvas (arredondado a 2 casas para evitar decimais estranhos) */
export const MM_TO_PX = (mm: number) => Math.round(mm * PX_PER_MM * 100) / 100

/** Converte px lógicos do canvas para milímetros (arredondado a 1 casa para evitar decimais estranhos) */
export const PX_TO_MM = (px: number) => Math.round((px / PX_PER_MM) * 10) / 10

/**
 * Comprimento da régua móvel de medição, em milímetros.
 * Cobertura: 210mm (A4 retrato), 297mm (A4 paisagem), 420mm (A3) e sobra.
 */
export const MEASURE_RULER_LENGTH_MM = 300

/**
 * Formata um valor em milímetros para exibição na UI.
 * Valores >= 100mm sem casas decimais; abaixo, 1 casa decimal.
 */
export const formatMM = (mm: number): string => {
  const rounded = Math.round(mm * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
