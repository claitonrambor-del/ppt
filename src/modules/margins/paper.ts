/**
 * ============================================================================
 * MÓDULO: MARGENS DE TRABALHO — folhas físicas (paper.ts)
 * ============================================================================
 * Tipos e valores de folhas físicas (A4, A3) com orientações, mapeados para
 * px lógicos do canvas usando a mesma calibragem do core (PX_PER_MM), de modo
 * que 1mm de margem continue valendo o mesmo px em qualquer folha.
 * ============================================================================
 */

import { PX_PER_MM, type PaperDimensions } from './core'

export type PaperSize = 'A4' | 'A3'
export type PaperOrientation = 'portrait' | 'landscape'

/** Dimensões reais em mm: [largura, altura] por orientação */
export const PAPER_SIZES_MM: Record<PaperSize, { portrait: PaperDimensionsMM; landscape: PaperDimensionsMM }> = {
  A4: {
    portrait: { width: 210, height: 297 },
    landscape: { width: 297, height: 210 },
  },
  A3: {
    portrait: { width: 297, height: 420 },
    landscape: { width: 420, height: 297 },
  },
}

export interface PaperDimensionsMM {
  width: number
  height: number
}

/**
 * Dimensões do canvas (px lógicos) para uma combinação folha + orientação.
 * A4 retrato: 1000 × 1414.29px · A3 retrato: 1414.29 × 2000px.
 */
export const getPaperDimensionsPx = (size: PaperSize, orientation: PaperOrientation): PaperDimensions => {
  const mm = PAPER_SIZES_MM[size][orientation]
  return {
    width: +(mm.width * PX_PER_MM).toFixed(2),
    height: +(mm.height * PX_PER_MM).toFixed(2),
  }
}

/** Proporção (altura / largura) de uma combinação folha + orientação */
export const getPaperRatio = (size: PaperSize, orientation: PaperOrientation): number => {
  const mm = PAPER_SIZES_MM[size][orientation]
  return +(mm.height / mm.width).toFixed(8)
}

/** Rótulos em pt-BR */
export const PAPER_SIZE_LABELS: Record<PaperSize, string> = {
  A4: 'Folha A4',
  A3: 'Folha A3',
}

export const PAPER_ORIENTATION_LABELS: Record<PaperOrientation, string> = {
  portrait: 'Retrato',
  landscape: 'Paisagem',
}
