<template>
  <div class="size-control">
    <div class="divider"></div>
    <NumberInput
      class="size-input"
      :min="minSizeMM"
      :max="MAX_MM"
      :step="1"
      :value="PX_TO_MM(elementInfo.width)"
      @update:value="value => updateWidth(value)"
    >
      <template #prefix>Largura:</template>
      <template #suffix>mm</template>
    </NumberInput>
    <NumberInput
      class="size-input"
      :min="minSizeMM"
      :max="MAX_MM"
      :step="1"
      :value="PX_TO_MM(elementInfo.height)"
      @update:value="value => updateHeight(value)"
    >
      <template #prefix>Altura:</template>
      <template #suffix>mm</template>
    </NumberInput>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useSlidesStore } from '@/store'
import type { PPTElement, PPTImageElement, PPTShapeElement } from '@/types/slides'
import { MIN_SIZE } from '@/configs/element'
import { MM_TO_PX, PX_TO_MM } from '@/configs/units'
import { SHAPE_PATH_FORMULAS } from '@/configs/shapes'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import NumberInput from '@/components/NumberInput.vue'

const props = defineProps<{
  elementInfo: PPTShapeElement | PPTImageElement
}>()

const MAX_MM = 450

const slidesStore = useSlidesStore()
const { addHistorySnapshot } = useHistorySnapshot()

const minSizeMM = computed(() => PX_TO_MM(MIN_SIZE[props.elementInfo.type] || 20))

const commit = (width: number, height: number) => {
  const el = props.elementInfo
  let elementProps: Partial<PPTElement> = { width, height }

  if (el.type === 'shape' && el.pathFormula) {
    const pathFormula = SHAPE_PATH_FORMULAS[el.pathFormula]

    let path = ''
    if ('editable' in pathFormula && pathFormula.editable) path = pathFormula.formula(width, height, el.keypoints!)
    else path = pathFormula.formula(width, height)

    const shapeProps: Pick<PPTShapeElement, 'viewBox' | 'path'> = { viewBox: [width, height], path }
    elementProps = { ...elementProps, ...shapeProps }
  }

  slidesStore.updateElement({ id: el.id, props: elementProps })
  addHistorySnapshot()
}

const updateWidth = (value: number) => {
  const el = props.elementInfo
  if (Math.abs(PX_TO_MM(el.width) - value) < 0.05) return

  const width = MM_TO_PX(value)
  let height = el.height

  if (el.fixedRatio && el.height > 0) {
    const ratio = el.width / el.height
    height = Math.max(MM_TO_PX(minSizeMM.value), width / ratio)
  }

  commit(width, height)
}

const updateHeight = (value: number) => {
  const el = props.elementInfo
  if (Math.abs(PX_TO_MM(el.height) - value) < 0.05) return

  const height = MM_TO_PX(value)
  let width = el.width

  if (el.fixedRatio && el.width > 0) {
    const ratio = el.width / el.height
    width = Math.max(MM_TO_PX(minSizeMM.value), height * ratio)
  }

  commit(width, height)
}
</script>

<style lang="scss" scoped>
.size-control {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.divider {
  width: 1px;
  height: 18px;
  background-color: $borderColor;
  margin: 0 4px;
  flex-shrink: 0;
}
.size-input {
  width: 125px;
}
</style>
