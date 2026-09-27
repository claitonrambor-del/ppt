<template>
  <div class="common-element-operate">
    <BorderLine 
      class="operate-border-line"
      v-for="line in borderLines" 
      :key="line.type" 
      :type="line.type" 
      :style="line.style"
    />
    <template v-if="handlerVisible">
      <ResizeHandler
        class="operate-resize-handler" 
        v-for="point in resizeHandlers"
        :key="point.direction"
        :type="point.direction"
        :rotate="elementInfo.rotate"
        :style="point.style"
        @mousedown.stop="($event: MouseEvent) => scaleElement($event, elementInfo, point.direction)"
      />
    </template>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import type { PPTLatexElement, PPTChartElement } from '@/types/slides'
import type { OperateResizeHandlers } from '@/types/edit'
import useCommonOperate from '../hooks/useCommonOperate'

import ResizeHandler from './ResizeHandler.vue'
import BorderLine from './BorderLine.vue'

type PPTElement = PPTLatexElement | PPTChartElement

const props = defineProps<{
  elementInfo: PPTElement
  handlerVisible: boolean
  scaleElement: (e: MouseEvent, element: PPTElement, command: OperateResizeHandlers) => void
}>()

const { canvasScale } = storeToRefs(useMainStore())

const scaleWidth = computed(() => props.elementInfo.width * canvasScale.value)
const scaleHeight = computed(() => props.elementInfo.height * canvasScale.value)
const { resizeHandlers, borderLines } = useCommonOperate(scaleWidth, scaleHeight)
</script>
