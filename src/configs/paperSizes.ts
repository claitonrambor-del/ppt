/**
 * ============================================================================
 * MÓDULO: MARGENS DE TRABALHO — binding de folhas físicas com o app
 * ============================================================================
 * Os valores vivem no módulo reutilizável `src/modules/margins/paper.ts`.
 * Este arquivo mantém o caminho de importação legado usado pelo app.
 * ============================================================================
 */

export {
  PAPER_SIZES_MM,
  PAPER_SIZE_LABELS,
  PAPER_ORIENTATION_LABELS,
  getPaperDimensionsPx,
  getPaperRatio,
  type PaperSize,
  type PaperOrientation,
} from '@/modules/margins'
