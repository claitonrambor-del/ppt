import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElement } from '@/types/slides'
import { resolveMargins, getWorkArea, getBlockFitOffset, fitBoxIntoWorkArea, type Margins } from '@/modules/margins'
import { getElementListRange } from '@/utils/element'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

export default () => {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const { activeElementIdList } = storeToRefs(mainStore)
  const { currentSlide, viewportSize, viewportRatio } = storeToRefs(slidesStore)

  const { addHistorySnapshot } = useHistorySnapshot()

  /**
   * Área útil do slide (folha menos as margens de trabalho)
   */
  const getWorkAreaOfSlide = (margins?: Margins) => {
    const m = margins || resolveMargins(currentSlide.value)
    return getWorkArea(viewportSize.value, viewportSize.value * viewportRatio.value, m)
  }

  /**
   * Desloca o(s) elemento(s) informado(s) para dentro da área útil,
   * respeitando as margens de trabalho. Retorna a lista corrigida.
   */
  const fitElementsIntoWorkArea = (elements: PPTElement[]): PPTElement[] => {
    if (!currentSlide.value) return elements
    const area = getWorkAreaOfSlide()

    for (const element of elements) {
      // linhas não possuem width/height convencionais; ignore-as no encaixe
      if ((element as { type: string }).type === 'line') continue

      fitBoxIntoWorkArea(element as { left: number; top: number; width?: number; height?: number }, area)
    }
    return elements
  }

  /**
   * Ajusta os elementos selecionados para dentro da margem (trabalho padrão)
   */
  const fitSelectionIntoMargins = () => {
    if (!currentSlide.value) return
    if (!activeElementIdList.value.length) return

    const newElementList: PPTElement[] = JSON.parse(JSON.stringify(currentSlide.value.elements))
    const selected = newElementList.filter(el => activeElementIdList.value.includes(el.id))

    // Ajusta a seleção como um bloco coeso
    const { minX, maxX, minY, maxY } = getElementListRange(selected)
    const area = getWorkAreaOfSlide()
    const { offsetX, offsetY } = getBlockFitOffset({ minX, maxX, minY, maxY }, area)

    if (!offsetX && !offsetY) return

    for (const element of newElementList) {
      if (!activeElementIdList.value.includes(element.id)) continue
      element.left += offsetX
      element.top += offsetY
    }

    slidesStore.updateSlide({ elements: newElementList })
    addHistorySnapshot()
  }

  return {
    getWorkArea: getWorkAreaOfSlide,
    fitElementsIntoWorkArea,
    fitSelectionIntoMargins,
  }
}
