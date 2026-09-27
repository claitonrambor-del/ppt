<template>
  <div class="viewport-size-setting">
    <div class="title">Tamanho personalizado do canvas</div>
    <div class="row">
      <div class="label">Largura (mm):</div>
      <NumberInput 
        v-model:value="customViewportWidth"
        :min="VIEWPORT_SIZE_MIN"
        :max="VIEWPORT_SIZE_MAX"
        style="flex: 1;"
        @enter="applyCustomViewportSize()"
      />
    </div>
    <div class="row">
      <div class="label">Altura (mm):</div>
      <NumberInput 
        v-model:value="customViewportHeight"
        :min="VIEWPORT_SIZE_MIN"
        :max="VIEWPORT_SIZE_MAX"
        style="flex: 1;"
        @enter="applyCustomViewportSize()"
      />
    </div>
    <div class="tip">Faixa de largura/altura: 105 ~ 420 mm</div>
    <div class="btns">
      <Button type="primary" @click="applyCustomViewportSize()">Confirmar</Button>
      <Button style="margin-left: 10px;" @click="emit('close')">Cancelar</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import message from '@/utils/message'
import { MM_TO_PX, PX_TO_MM } from '@/configs/units'
import { resolveMargins, getScaledMarginProps } from '@/modules/margins'

import NumberInput from '@/components/NumberInput.vue'
import Button from '@/components/Button.vue'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

const emit = defineEmits<{
  (event: 'close'): void
}>()

// limites em mm (equivalem a 500 ~ 2000 px lógicos do canvas)
const VIEWPORT_SIZE_MIN = 105
const VIEWPORT_SIZE_MAX = 420

const slidesStore = useSlidesStore()
const { viewportRatio, viewportSize, slides } = storeToRefs(slidesStore)

const { addHistorySnapshot } = useHistorySnapshot()

const customViewportWidth = ref(Math.round(PX_TO_MM(viewportSize.value)))
const customViewportHeight = ref(Math.round(PX_TO_MM(viewportSize.value * viewportRatio.value)))

const applyCustomViewportSize = () => {
  const widthMM = customViewportWidth.value
  const heightMM = customViewportHeight.value
  if (
    widthMM < VIEWPORT_SIZE_MIN ||
    widthMM > VIEWPORT_SIZE_MAX ||
    heightMM < VIEWPORT_SIZE_MIN ||
    heightMM > VIEWPORT_SIZE_MAX
  ) return message.warning(`Largura/altura do canvas devem estar entre ${VIEWPORT_SIZE_MIN} ~ ${VIEWPORT_SIZE_MAX} mm`)

  const oldWidth = viewportSize.value
  const oldHeight = oldWidth * viewportRatio.value
  const newWidth = MM_TO_PX(widthMM)
  const newHeight = MM_TO_PX(heightMM)

  slidesStore.setViewportSize(newWidth)
  slidesStore.setViewportRatio(newHeight / newWidth)

  // o tamanho do canvas mudou: escala as margens de trabalho de todos os slides proporcionalmente
  const scaleX = newWidth / oldWidth
  const scaleY = newHeight / oldHeight
  const newSlides = slides.value.map(slide => ({
    ...slide,
    ...getScaledMarginProps(resolveMargins(slide), scaleX, scaleY),
  }))
  slidesStore.setSlides(newSlides)
  addHistorySnapshot()

  emit('close')
}
</script>

<style lang="scss" scoped>
.title {
  margin-bottom: 15px;
  font-weight: 700;
  font-size: 17px;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.label {
  width: 90px;
  font-size: 13px;
}
.tip {
  margin-bottom: 18px;
  font-size: 12px;
  color: #888;
}
.btns {
  display: flex;
  justify-content: flex-end;
}
</style>
