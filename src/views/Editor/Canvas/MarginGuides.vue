<template>
  <div class="margin-guides" v-if="visible">
    <!-- Contorno da área útil: 4 linhas pretas, uma em cada lado -->
    <div
      class="margin-line line-top"
      :class="{ 'snapped': isSnappedY(guides.top) }"
      :style="{ left: `${guides.left * scale}px`, top: `${guides.top * scale}px`, width: contentWidth }"
    ></div>
    <div
      class="margin-line line-bottom"
      :class="{ 'snapped': isSnappedY(guides.bottom) }"
      :style="{ left: `${guides.left * scale}px`, top: `${guides.bottom * scale}px`, width: contentWidth }"
    ></div>
    <div
      class="margin-line line-left"
      :class="{ 'snapped': isSnappedX(guides.left) }"
      :style="{ left: `${guides.left * scale}px`, top: `${guides.top * scale}px`, height: contentHeight }"
    ></div>
    <div
      class="margin-line line-right"
      :class="{ 'snapped': isSnappedX(guides.right) }"
      :style="{ left: `${guides.right * scale}px`, top: `${guides.top * scale}px`, height: contentHeight }"
    ></div>

    <!-- linhas de borda da folha: só aparecem quando a régua captura uma delas -->
    <div
      class="margin-line edge-line"
      :class="{ 'snapped-edge': isSnappedX(0) }"
      :style="{ left: 0, top: 0, height: `${guides.paperHeight * scale}px` }"
      v-if="isSnappedX(0)"
    ></div>
    <div
      class="margin-line edge-line"
      :class="{ 'snapped-edge': isSnappedX(guides.paperWidth) }"
      :style="{ left: `${guides.paperWidth * scale}px`, top: 0, height: `${guides.paperHeight * scale}px` }"
      v-if="isSnappedX(guides.paperWidth)"
    ></div>
    <div
      class="margin-line edge-line"
      :class="{ 'snapped-edge': isSnappedY(0) }"
      :style="{ left: 0, top: 0, width: `${guides.paperWidth * scale}px` }"
      v-if="isSnappedY(0)"
    ></div>
    <div
      class="margin-line edge-line"
      :class="{ 'snapped-edge': isSnappedY(guides.paperHeight) }"
      :style="{ left: 0, top: `${guides.paperHeight * scale}px`, width: `${guides.paperWidth * scale}px` }"
      v-if="isSnappedY(guides.paperHeight)"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import { resolveMargins, getWorkArea } from '@/modules/margins'
import useMeasureRulerGuides from './hooks/useMeasureRulerGuides'

withDefaults(defineProps<{
  visible?: boolean
}>(), {
  visible: true,
})

const slidesStore = useSlidesStore()
const { currentSlide, viewportSize, viewportRatio } = storeToRefs(slidesStore)
const { canvasScale } = storeToRefs(useMainStore())

// coordenadas reais das guias (px lógicos do canvas, a partir do canto 0,0)
const guides = computed(() => {
  const w = viewportSize.value
  const h = w * viewportRatio.value
  const area = getWorkArea(w, h, resolveMargins(currentSlide.value))
  return {
    left: area.left,
    top: area.top,
    right: area.right,
    bottom: area.bottom,
    // bordas da folha
    paperWidth: w,
    paperHeight: h,
  }
})

// o contêiner (.operates) usa px de tela: as coordenadas lógicas precisam ser escaladas
const scale = computed(() => canvasScale.value)

const contentWidth = computed(() => `${(guides.value.right - guides.value.left) * scale.value}px`)
const contentHeight = computed(() => `${(guides.value.bottom - guides.value.top) * scale.value}px`)

// destaque quando a régua móvel captura uma guia ou borda
const { snappedX, snappedY, SNAP_TOLERANCE_PX } = useMeasureRulerGuides()
const isSnappedX = (x: number) => snappedX.value !== null && Math.abs(snappedX.value - x) <= SNAP_TOLERANCE_PX
const isSnappedY = (y: number) => snappedY.value !== null && Math.abs(snappedY.value - y) <= SNAP_TOLERANCE_PX
</script>

<style lang="scss" scoped>
.margin-guides {
  @include absolute-0();

  pointer-events: none;
  z-index: 50;
}
.margin-line {
  position: absolute;
  background: #000;

  &.snapped {
    background: #2e7d32;
    box-shadow: 0 0 0 1px rgba(46, 125, 50, 0.4);
  }

  // borda da folha capturada pela régua: laranja, cobrindo a folha inteira
  &.edge-line {
    background: transparent;

    &.snapped-edge {
      background: #e07b00;
      box-shadow: 0 0 0 1px rgba(224, 123, 0, 0.4);
    }
  }

  &.line-top,
  &.line-bottom {
    height: 1px;
  }
  &.line-left,
  &.line-right {
    width: 1px;
  }
}
</style>
