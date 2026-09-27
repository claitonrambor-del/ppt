import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import type { PPTElement, Slide } from '@/types/slides'
import { createSlideIdMap, createElementIdMap, getElementRange } from '@/utils/element'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

export default () => {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const { currentSlide } = storeToRefs(slidesStore)

  const { addHistorySnapshot } = useHistorySnapshot()

  /**
   * adicionarespecificadoelementodados (um grupo) 
   * @param elements elementolistadados
   */
  const addElementsFromData = (elements: PPTElement[]) => {
    const { groupIdMap, elIdMap } = createElementIdMap(elements)

    const firstElement = elements[0]
    let offset = 0
    let lastSameElement: PPTElement | undefined
    
    do {
      lastSameElement = currentSlide.value.elements.find(el => {
        if (el.type !== firstElement.type) return false
  
        const { minX: oMinX, maxX: oMaxX, minY: oMinY, maxY: oMaxY } = getElementRange(el)
        const { minX: nMinX, maxX: nMaxX, minY: nMinY, maxY: nMaxY } = getElementRange({
          ...firstElement,
          left: firstElement.left + offset,
          top: firstElement.top + offset
        })
        if (
          oMinX === nMinX &&
          oMaxX === nMaxX &&
          oMinY === nMinY &&
          oMaxY === nMaxY
        ) return true
  
        return false
      })
      if (lastSameElement) offset += 10

    } while (lastSameElement)
    
    for (const element of elements) {
      element.id = elIdMap[element.id]

      element.left = element.left + offset
      element.top = element.top + offset

      if (element.groupId) element.groupId = groupIdMap[element.groupId]
    }
    slidesStore.addElement(elements)
    mainStore.setActiveElementIdList(Object.values(elIdMap))
    addHistorySnapshot()
  }

  /**
   * adicionarespecificadopáginadados
   * @param slide páginadados
   */
  const addSlidesFromData = (slides: Slide[]) => {
    const slideIdMap = createSlideIdMap(slides)
    const newSlides = slides.map(slide => {
      const { groupIdMap, elIdMap } = createElementIdMap(slide.elements)

      for (const element of slide.elements) {
        element.id = elIdMap[element.id]
        if (element.groupId) element.groupId = groupIdMap[element.groupId]
		
        // se o elemento tem link de navegação de página
        if (element.link && element.link.type === 'slide') {

          // se a página estiver entre as que serão adicionadas, substitui as ligações relacionadas
          if (slideIdMap[element.link.target]) {
            element.link.target = slideIdMap[element.link.target]
          }
          // se a página não estiver entre as que serão adicionadas, remove o link de navegação do elemento
          else delete element.link
        }
      }
      return {
        ...slide,
        id: slideIdMap[slide.id],
      }
    })
    slidesStore.addSlide(newSlides)
    addHistorySnapshot()
  }

  return {
    addElementsFromData,
    addSlidesFromData,
  }
}