import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElement } from '@/types/slides'
import { getModuleElementIds } from '@/utils/reportModule'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

/**
 * Exclusão do MÓDULO DE VISTORIA.
 *
 * O módulo é formado por dois elementos (tabela + espaço da foto) que
 * compartilham o mesmo `groupId` e nascem fixos (`lock: true`). Como elementos
 * fixos não entram na seleção, o Delete comum não os alcança: esta exclusão
 * remove o bloco inteiro de uma vez, a partir de qualquer um dos dois elementos.
 */
export default () => {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const { currentSlide } = storeToRefs(slidesStore)

  const { addHistorySnapshot } = useHistorySnapshot()

  /** Exclui o módulo a que o elemento pertence (tabela + espaço da foto) */
  const deleteReportModule = (element: PPTElement) => {
    const slide = currentSlide.value
    if (!slide) return

    const elementIds = getModuleElementIds(slide, element)
    if (!elementIds.length) return

    mainStore.setActiveElementIdList([])
    slidesStore.updateSlide({
      elements: slide.elements.filter(el => !elementIds.includes(el.id)),
    })
    addHistorySnapshot()
  }

  return {
    deleteReportModule,
  }
}
