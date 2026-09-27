import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElement } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

export default () => {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const { activeElementIdList, activeElementList, handleElementId } = storeToRefs(mainStore)
  const { currentSlide } = storeToRefs(slidesStore)

  const { addHistorySnapshot } = useHistorySnapshot()

  /**
   * verificarseleção atualMédiodo elementose é possívelAgrupar
   */
  const canCombine = computed(() => {
    if (activeElementList.value.length < 2) return false

    const firstGroupId = activeElementList.value[0].groupId
    if (!firstGroupId) return true

    const inSameGroup = activeElementList.value.every(el => (el.groupId && el.groupId) === firstGroupId)
    return !inSameGroup
  })

  /**
   * agrupa os elementos selecionados: atribui o mesmo ID de grupo a eles
   */
  const combineElements = () => {
    if (!activeElementList.value.length) return

    // gera uma nova lista de elementos para as operações seguintes
    let newElementList: PPTElement[] = JSON.parse(JSON.stringify(currentSlide.value.elements))

    // GerargrupoID
    const groupId = nanoid(10)

    // coleta os elementos a agrupar e atribui um ID de grupo único
    const combineElementList: PPTElement[] = []
    for (const element of newElementList) {
      if (activeElementIdList.value.includes(element.id)) {
        element.groupId = groupId
        combineElementList.push(element)
      }
    }

    // garante camadas contínuas entre os membros do grupo; procedimento:
    // obtém a camada do elemento mais alto do grupo e remove da nova lista os elementos a agrupar,
    // conforme a camada do elemento mais alto, insere os elementos coletados na posição adequada da nova lista
    const combineElementMaxLevel = newElementList.findIndex(_element => _element.id === combineElementList[combineElementList.length - 1].id)
    const combineElementIdList = combineElementList.map(_element => _element.id)
    newElementList = newElementList.filter(_element => !combineElementIdList.includes(_element.id))

    const insertLevel = combineElementMaxLevel - combineElementList.length + 1
    newElementList.splice(insertLevel, 0, ...combineElementList)

    slidesStore.updateSlide({ elements: newElementList })
    addHistorySnapshot()
  }

  /**
   * Desagruparelemento: Removerelemento selecionadodo grupoID
   */
  const uncombineElements = () => {
    if (!activeElementList.value.length) return
    const hasElementInGroup = activeElementList.value.some(item => item.groupId)
    if (!hasElementInGroup) return
    
    const newElementList: PPTElement[] = JSON.parse(JSON.stringify(currentSlide.value.elements))
    for (const element of newElementList) {
      if (activeElementIdList.value.includes(element.id) && element.groupId) delete element.groupId
    }
    slidesStore.updateSlide({ elements: newElementList })

    // Desagruparapós , é necessário Redefinirativoelementoestado
    // por padrão, redefine para o elemento em operação; se não houver, esvazia
    const handleElementIdList = handleElementId.value ? [handleElementId.value] : []
    mainStore.setActiveElementIdList(handleElementIdList)

    addHistorySnapshot()
  }

  return {
    canCombine,
    combineElements,
    uncombineElements,
  }
}