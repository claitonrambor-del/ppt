<template>
  <div 
    class="editable-element"
    ref="elementRef"
    :id="`editable-element-${elementInfo.id}`"
    :style="{
      zIndex: elementIndex,
    }"
  >
    <component
      :is="currentElementComponent"
      :elementInfo="elementInfo"
      :selectElement="selectElement"
      :contextmenus="contextmenus"
    ></component>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { ElementTypes, type PPTElement } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'

import useLockElement from '@/hooks/useLockElement'
import useDeleteElement from '@/hooks/useDeleteElement'
import useCombineElement from '@/hooks/useCombineElement'
import useOrderElement from '@/hooks/useOrderElement'
import useAlignElementToCanvas from '@/hooks/useAlignElementToCanvas'
import useCopyAndPasteElement from '@/hooks/useCopyAndPasteElement'
import useSelectElement from '@/hooks/useSelectElement'

import { ElementOrderCommands, ElementAlignCommands } from '@/types/edit'

import ImageElement from '@/views/components/element/ImageElement/index.vue'
import TextElement from '@/views/components/element/TextElement/index.vue'
import ShapeElement from '@/views/components/element/ShapeElement/index.vue'
import LineElement from '@/views/components/element/LineElement/index.vue'
import ChartElement from '@/views/components/element/ChartElement/index.vue'
import TableElement from '@/views/components/element/TableElement/index.vue'
import LatexElement from '@/views/components/element/LatexElement/index.vue'

const props = defineProps<{
  elementInfo: PPTElement
  elementIndex: number
  isMultiSelect: boolean
  selectElement: (e: MouseEvent | TouchEvent, element: PPTElement, canMove?: boolean) => void
  openLinkDialog: () => void
}>()

const currentElementComponent = computed<unknown>(() => {
  const elementTypeMap = {
    [ElementTypes.IMAGE]: ImageElement,
    [ElementTypes.TEXT]: TextElement,
    [ElementTypes.SHAPE]: ShapeElement,
    [ElementTypes.LINE]: LineElement,
    [ElementTypes.CHART]: ChartElement,
    [ElementTypes.TABLE]: TableElement,
    [ElementTypes.LATEX]: LatexElement,
  }
  return elementTypeMap[props.elementInfo.type] || null
})

const { orderElement } = useOrderElement()
const { alignElementToCanvas } = useAlignElementToCanvas()
const { combineElements, uncombineElements } = useCombineElement()
const { deleteElement } = useDeleteElement()
const { lockElement, unlockElement } = useLockElement()
const { copyElement, pasteElement, cutElement } = useCopyAndPasteElement()
const { selectAllElements } = useSelectElement()

const contextmenus = (): ContextmenuItem[] => {
  if (props.elementInfo.lock) {
    return [{
      text: 'Desfixar', 
      handler: () => unlockElement(props.elementInfo),
    }]
  }

  return [
    {
      text: 'Recortar',
      subText: 'Ctrl + X',
      handler: cutElement,
    },
    {
      text: 'Copiar',
      subText: 'Ctrl + C',
      handler: copyElement,
    },
    {
      text: 'Colar',
      subText: 'Ctrl + V',
      handler: pasteElement,
    },
    { divider: true },
    {
      text: 'Centralizar horizontalmente',
      handler: () => alignElementToCanvas(ElementAlignCommands.HORIZONTAL),
      children: [
        { text: 'HorizontalCentralizar verticalmente', handler: () => alignElementToCanvas(ElementAlignCommands.CENTER), },
        { text: 'Centralizar horizontalmente', handler: () => alignElementToCanvas(ElementAlignCommands.HORIZONTAL) },
        { text: 'Alinhar à esquerda', handler: () => alignElementToCanvas(ElementAlignCommands.LEFT) },
        { text: 'Alinhar à direita', handler: () => alignElementToCanvas(ElementAlignCommands.RIGHT) },
      ],
    },
    {
      text: 'Centralizar verticalmente',
      handler: () => alignElementToCanvas(ElementAlignCommands.VERTICAL),
      children: [
        { text: 'HorizontalCentralizar verticalmente', handler: () => alignElementToCanvas(ElementAlignCommands.CENTER) },
        { text: 'Centralizar verticalmente', handler: () => alignElementToCanvas(ElementAlignCommands.VERTICAL) },
        { text: 'Alinhar ao topo', handler: () => alignElementToCanvas(ElementAlignCommands.TOP) },
        { text: 'Alinhar à base', handler: () => alignElementToCanvas(ElementAlignCommands.BOTTOM) },
      ],
    },
    { divider: true },
    {
      text: 'Trazer para frente',
      disable: props.isMultiSelect && !props.elementInfo.groupId,
      handler: () => orderElement(props.elementInfo, ElementOrderCommands.TOP),
      children: [
        { text: 'Trazer para frente', handler: () => orderElement(props.elementInfo, ElementOrderCommands.TOP) },
        { text: 'Avançar uma camada', handler: () => orderElement(props.elementInfo, ElementOrderCommands.UP) },
      ],
    },
    {
      text: 'Enviar para trás',
      disable: props.isMultiSelect && !props.elementInfo.groupId,
      handler: () => orderElement(props.elementInfo, ElementOrderCommands.BOTTOM),
      children: [
        { text: 'Enviar para trás', handler: () => orderElement(props.elementInfo, ElementOrderCommands.BOTTOM) },
        { text: 'Recuar uma camada', handler: () => orderElement(props.elementInfo, ElementOrderCommands.DOWN) },
      ],
    },
    { divider: true },
    {
      text: 'Definir link',
      handler: props.openLinkDialog,
    },
    {
      text: props.elementInfo.groupId ? 'Desagrupar' : 'Agrupar',
      subText: 'Ctrl + G',
      handler: props.elementInfo.groupId ? uncombineElements : combineElements,
      hide: !props.isMultiSelect,
    },
    {
      text: 'Selecionar tudo',
      subText: 'Ctrl + A',
      handler: selectAllElements,
    },
    {
      text: 'Fixar',
      subText: 'Ctrl + L',
      handler: lockElement,
    },
    {
      text: 'Excluir',
      subText: 'Delete',
      handler: deleteElement,
    },
  ]
}
</script>