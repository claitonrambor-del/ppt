import { ref } from 'vue'

/**
 * Estado compartilhado entre a régua móvel de medição (MeasureRuler) e as
 * guias de margem (MarginGuides): quando uma ponta da régua é capturada pelo
 * imã de margens, a guia correspondente é destacada em verde.
 *
 * As coordenadas são em px lógicos do canvas.
 */

/** tolerância (px lógicos) para considerar a guia como a capturada */
export const SNAP_TOLERANCE_PX = 2

const snappedX = ref<number | null>(null)
const snappedY = ref<number | null>(null)

export default () => {
  const setSnappedGuides = (x: number | null, y: number | null) => {
    snappedX.value = x
    snappedY.value = y
  }

  const clearSnappedGuides = () => {
    snappedX.value = null
    snappedY.value = null
  }

  return {
    snappedX,
    snappedY,
    SNAP_TOLERANCE_PX,
    setSnappedGuides,
    clearSnappedGuides,
  }
}
