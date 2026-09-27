/**
 * ============================================================================
 * MÓDULO: MARGENS DE TRABALHO — camada de ligação com o app (binding)
 * ============================================================================
 * A lógica pura e reutilizável vive em `src/modules/margins/` (sem Vue, Pinia
 * ou tipos do app). Este arquivo apenas adapta o módulo ao modelo de slides:
 * mantém os nomes legados usados pelo app (`SlideMargins`, `getSlideMargins`,
 * `DEFAULT_MARGINS_PX` etc.) e os reexporta a partir do módulo.
 *
 * Para reutilizar este recurso em outro projeto, copie `src/modules/margins/`
 * (e este binding, adaptando os tipos ao modelo de dados local).
 * ============================================================================
 */

import type { Margins } from '@/modules/margins/core'

export {
  // constantes e conversões
  PX_PER_MM,
  MM_TO_PX,
  PX_TO_MM,
  DEFAULT_MARGIN_MM,
  MARGIN_MIN_MM,
  MARGIN_MAX_MM,
  DEFAULT_MARGINS,
  // cálculos puros
  getWorkArea,
  fitBoxIntoWorkArea,
  fitLinePointsIntoWorkArea,
  getBlockFitOffset,
  getScaledMarginProps,
  getDefaultMarginProps,
} from '@/modules/margins'

/** Margens de uma folha, em px lógicos do canvas (legado do app) */
export type SlideMargins = Margins

/** Margens padrão (7mm por lado), em px lógicos do canvas (legado do app) */
export { DEFAULT_MARGINS as DEFAULT_MARGINS_PX } from '@/modules/margins'

import { resolveMargins } from '@/modules/margins'

/** Obtém as margens de um slide, aplicando os padrões quando ausentes */
export const getSlideMargins = resolveMargins
