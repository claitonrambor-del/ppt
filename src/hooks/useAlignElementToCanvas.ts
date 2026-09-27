import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElement } from '@/types/slides'
import { ElementAlignCommands } from '@/types/edit'
import { getElementListRange } from '@/utils/element'
import { resolveMargins, getWorkArea } from '@/modules/margins'
import useHistorySnapshot from './useHistorySnapshot'

export default () => {
  const slidesStore = useSlidesStore()
  const { activeElementIdList, activeElementList } = storeToRefs(useMainStore())
  const { currentSlide, viewportRatio, viewportSize } = storeToRefs(slidesStore)

  const { addHistorySnapshot } = useHistorySnapshot()

  /**
   * todos seleciMédiodo elementoAlinharaté canvas
   * @param command Alinhardireção
   */
  const alignElementToCanvas = (command: ElementAlignCommands) => {
    const viewportWidth = viewportSize.value
    const viewportHeight = viewportSize.value * viewportRatio.value
    // As bordas do alinhamento consideram as margens de trabalho padrão
    const area = getWorkArea(viewportWidth, viewportHeight, resolveMargins(currentSlide.value))
    const workLeft = area.left
    const workTop = area.top
    const workRight = area.right
    const workBottom = area.bottom
    const { minX, maxX, minY, maxY } = getElementListRange(activeElementList.value)
  
    const newElementList: PPTElement[] = JSON.parse(JSON.stringify(currentSlide.value.elements))
    for (const element of newElementList) {
      if (!activeElementIdList.value.includes(element.id)) continue
      
      // HorizontalCentralizar verticalmente (área útil)
      if (command === ElementAlignCommands.CENTER) {
        const offsetY = minY + (maxY - minY) / 2 - (workTop + workBottom) / 2
        const offsetX = minX + (maxX - minX) / 2 - (workLeft + workRight) / 2
        element.top = element.top - offsetY 
        element.left = element.left - offsetX           
      }

      // topoAlinhar (na margem superior)
      if (command === ElementAlignCommands.TOP) {
        const offsetY = minY - workTop
        element.top = element.top - offsetY            
      }

      // Centralizar verticalmente (área útil)
      else if (command === ElementAlignCommands.VERTICAL) {
        const offsetY = minY + (maxY - minY) / 2 - (workTop + workBottom) / 2
        element.top = element.top - offsetY            
      }

      // baseAlinhar (na margem inferior)
      else if (command === ElementAlignCommands.BOTTOM) {
        const offsetY = maxY - workBottom
        element.top = element.top - offsetY       
      }
      
      // esquerdaAlinhar (na margem esquerda)
      else if (command === ElementAlignCommands.LEFT) {
        const offsetX = minX - workLeft
        element.left = element.left - offsetX            
      }

      // Centralizar horizontalmente (área útil)
      else if (command === ElementAlignCommands.HORIZONTAL) {
        const offsetX = minX + (maxX - minX) / 2 - (workLeft + workRight) / 2
        element.left = element.left - offsetX            
      }

      // direitaAlinhar (na margem direita)
      else if (command === ElementAlignCommands.RIGHT) {
        const offsetX = maxX - workRight
        element.left = element.left - offsetX            
      }
    }

    slidesStore.updateSlide({ elements: newElementList })
    addHistorySnapshot()
  }

  return {
    alignElementToCanvas,
  }
}