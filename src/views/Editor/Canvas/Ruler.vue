<template>
  <div class="ruler">
    <div 
      class="h"
      :style="{
        width: viewportStyles.width * canvasScale + 'px',
        left: viewportStyles.left + 'px',
      }"
    >
      <div 
        class="ruler-marker" 
        :class="{ 'hide': markerSize < 30, 'omit': markerSize < 60 }"
        v-for="marker in hMarkerCount" 
        :key="`h-marker-${marker}`"
        :style="{ width: markerSize + 'px' }"
      >
        <span v-if="marker * markerStepMM <= hLengthMM">{{ marker * markerStepMM }}</span>
      </div>

      <div class="range" 
        v-if="elementListRange"
        :style="{
          left: elementListRange.minX * canvasScale + 'px',
          width: (elementListRange.maxX - elementListRange.minX) * canvasScale + 'px',
        }"
      ></div>
    </div>
    <div 
      class="v"
      :style="{
        height: viewportStyles.height * canvasScale + 'px',
        top: viewportStyles.top + 'px',
      }"
    >
      <div 
        class="ruler-marker" 
        :class="{ 'hide': markerSize < 30, 'omit': markerSize < 60 }"
        v-for="marker in vMarkerCount" 
        :key="`v-marker-${marker}`"
        :style="{ height: markerSize + 'px' }"
      >
        <span v-if="marker * markerStepMM <= vLengthMM">{{ marker * markerStepMM }}</span>
      </div>

      <div class="range" 
        v-if="elementListRange"
        :style="{
          top: elementListRange.minY * canvasScale + 'px',
          height: (elementListRange.maxY - elementListRange.minY) * canvasScale + 'px',
        }"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watchEffect, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import { getElementListRange } from '@/utils/element'
import { PX_PER_MM } from '@/configs/units'
import type { PPTElement } from '@/types/slides'

interface ViewportStyles {
  top: number
  left: number
  width: number
  height: number
}

const props = defineProps<{
  viewportStyles: ViewportStyles
  elementList: PPTElement[]
}>()

const { canvasScale, activeElementIdList } = storeToRefs(useMainStore())
const { viewportRatio, viewportSize } = storeToRefs(useSlidesStore())

const elementListRange = ref<null | ReturnType<typeof getElementListRange>>(null)

watchEffect(() => {
  const els = props.elementList.filter(el => activeElementIdList.value.includes(el.id))
  if (!els.length) return elementListRange.value = null
  elementListRange.value = getElementListRange(els)
})

// dimensões do canvas em milímetros (escala física: 1000px = 210mm)
const hLengthMM = computed(() => viewportSize.value / PX_PER_MM)
const vLengthMM = computed(() => viewportSize.value * viewportRatio.value / PX_PER_MM)

/**
 * passo dos marcadores (em mm), adaptativo ao zoom:
 * 10mm por padrão; 5mm e 1mm quando há espaço suficiente na tela
 */
const markerStepMM = computed(() => {
  const pxPerMMOnScreen = props.viewportStyles.width * canvasScale.value / hLengthMM.value
  if (pxPerMMOnScreen / 1 >= 18) return 1
  if (pxPerMMOnScreen / 5 >= 18) return 5
  return 10
})

// tamanho na tela de um marcador (px)
const markerSize = computed(() => {
  const pxPerMMOnScreen = props.viewportStyles.width * canvasScale.value / hLengthMM.value
  return pxPerMMOnScreen * markerStepMM.value
})

// quantidade de marcadores necessária para cobrir cada régua
const hMarkerCount = computed(() => Math.ceil(hLengthMM.value / markerStepMM.value) + 1)
const vMarkerCount = computed(() => Math.ceil(vLengthMM.value / markerStepMM.value) + 1)
</script>


<style lang="scss" scoped>
.ruler {
  font-size: 10px;
}
.h {
  position: absolute;
  background-color: #fff;
  border: 1px solid $borderColor;
  height: 20px;
  top: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;

  .range {
    position: absolute;
    top: 0;
    bottom: 0;
    background-color: rgba($color: $themeColor, $alpha: .1);
  }

  .ruler-marker {
    height: 100%;
    line-height: 20px;
    text-align: right;
    flex-shrink: 0;
    padding-right: 4px;
    position: relative;

    &.hide span {
      display: none;
    }
    &.omit::before {
      display: none;
    }

    &:not(:last-child)::after {
      content: '';
      width: .1px;
      height: 12px;
      position: absolute;
      right: 0;
      bottom: 0;
      background-color: #999;
    }
    &::before {
      content: '';
      width: .1px;
      height: 8px;
      position: absolute;
      right: 50%;
      bottom: 0;
      background-color: #999;
    }
  }
}
.v {
  position: absolute;
  background-color: #fff;
  border: 1px solid $borderColor;
  width: 20px;
  left: 5px;
  overflow: hidden;

  .range {
    position: absolute;
    left: 0;
    right: 0;
    background-color: rgba($color: $themeColor, $alpha: .1);
  }

  .ruler-marker {
    width: 100%;
    line-height: 20px;
    text-align: right;
    padding-bottom: 4px;
    position: relative;
    writing-mode: vertical-rl;

    &.hide span {
      display: none;
    }
    &.omit::before {
      display: none;
    }

    &:not(:last-child)::after {
      content: '';
      height: .1px;
      width: 12px;
      position: absolute;
      bottom: 0;
      right: 0;
      background-color: #999;
    }
    &::before {
      content: '';
      height: .1px;
      width: 8px;
      position: absolute;
      bottom: 50%;
      right: 0;
      background-color: #999;
    }
  }
}
</style>
