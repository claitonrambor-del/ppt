<template>
  <div class="shape-size-dialog">
    <div class="shape-picker">
      <div class="label">Forma:</div>
      <div class="selected-shape" @click="pickerVisible = !pickerVisible">
        <ShapeItemThumbnail class="shape-thumb" :shape="selectedShape" />
        <span class="shape-name">{{ selectedShape.title || 'Forma' }}</span>
        <i-icon-park-outline:down class="arrow" :style="{ transform: pickerVisible ? 'rotate(180deg)' : '' }" />
      </div>
      <div class="shape-grid" v-if="pickerVisible">
        <div class="category" v-for="item in SHAPE_LIST" :key="item.type">
          <div class="category-name">{{ item.type }}</div>
          <div class="shape-list">
            <ShapeItemThumbnail
              class="shape-item"
              v-for="(shape, index) in item.children"
              :key="index"
              :shape="shape"
              @click="selectShape(shape)"
            />
          </div>
        </div>
      </div>
    </div>

    <Divider />

    <div class="row">
      <NumberInput
        :value="widthMM"
        :min="MIN_MM"
        :max="MAX_MM"
        :step="1"
        @update:value="value => widthMM = value"
        style="width: 45%;"
      >
        <template #prefix>Largura (mm):</template>
      </NumberInput>
      <div style="width: 10%;"></div>
      <NumberInput
        :value="heightMM"
        :min="MIN_MM"
        :max="MAX_MM"
        :step="1"
        @update:value="value => heightMM = value"
        style="width: 45%;"
      >
        <template #prefix>Altura (mm):</template>
      </NumberInput>
    </div>
    <div class="row hint">
      A forma será inserida no tamanho exato, centralizada na área útil da página
      ({{ formatMM(PX_TO_MM(viewportSize)) }} × {{ formatMM(PX_TO_MM(viewportSize * viewportRatio)) }} mm).
    </div>

    <div class="btns">
      <Button @click="emit('close')" style="margin-right: 10px;">Cancelar</Button>
      <Button type="primary" @click="insert()">Inserir forma</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import { SHAPE_LIST, SHAPE_PATH_FORMULAS, type ShapePoolItem } from '@/configs/shapes'
import { MM_TO_PX, PX_TO_MM, formatMM } from '@/configs/units'
import { MIN_SIZE } from '@/configs/element'
import useCreateElement from '@/hooks/useCreateElement'

import ShapeItemThumbnail from '@/views/Editor/CanvasTool/ShapeItemThumbnail.vue'
import NumberInput from '@/components/NumberInput.vue'
import Button from '@/components/Button.vue'
import Divider from '@/components/Divider.vue'

const emit = defineEmits<{
  (event: 'close'): void
}>()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { viewportSize, viewportRatio } = storeToRefs(slidesStore)

const MIN_MM = 5
const MAX_MM = 450

const firstShape = SHAPE_LIST[0].children[0]
const selectedShape = ref<ShapePoolItem>(firstShape)
const pickerVisible = ref(false)

/** padrão: 50 × 50 mm (quadrado-ish) */
const widthMM = ref(50)
const heightMM = ref(50)

const selectShape = (shape: ShapePoolItem) => {
  selectedShape.value = shape
  pickerVisible.value = false
}

const insert = () => {
  const wPx = MM_TO_PX(widthMM.value)
  const hPx = MM_TO_PX(heightMM.value)

  // sanidade: respeita tamanho mínimo do elemento
  const minPx = MIN_SIZE.shape || 20
  const width = Math.max(wPx, minPx)
  const height = Math.max(hPx, minPx)

  // centraliza na área útil da página
  const position = {
    width,
    height,
    left: (viewportSize.value - width) / 2,
    top: (viewportSize.value * viewportRatio.value - height) / 2,
  }

  // formas com pathFormula recalculam o path para o tamanho exato
  const data: ShapePoolItem = { ...selectedShape.value }
  if (data.pathFormula) {
    const pathFormula = SHAPE_PATH_FORMULAS[data.pathFormula]
    if ('editable' in pathFormula && pathFormula.editable) {
      data.path = pathFormula.formula(width, height, pathFormula.defaultValue!)
    }
    else {
      data.path = pathFormula.formula(width, height)
    }
  }

  useCreateElement().createShapeElement(position, data)
  emit('close')
}
</script>

<style lang="scss" scoped>
.shape-size-dialog {
  font-size: 13px;
  line-height: 1.675;
}
.shape-picker {
  .label {
    margin-bottom: 6px;
    color: #999;
  }
  .selected-shape {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 1px solid $borderColor;
    border-radius: $borderRadius;
    cursor: pointer;

    &:hover {
      border-color: $themeColor;
    }

    .shape-thumb {
      width: 40px;
      height: 30px;
    }
    .shape-name {
      flex: 1;
    }
    .arrow {
      color: #999;
      transition: transform .2s;
    }
  }
  .shape-grid {
    margin-top: 8px;
    max-height: 240px;
    overflow: auto;
    border: 1px solid $borderColor;
    border-radius: $borderRadius;
    padding: 10px;
  }
  .category-name {
    width: 100%;
    font-size: 12px;
    margin-bottom: 8px;
    border-left: 4px solid #bbb;
    background-color: #f1f1f1;
    padding: 3px 0 3px 8px;
    color: #555;
  }
  .shape-list {
    @include flex-grid-layout();
    margin-bottom: 10px;
  }
  .shape-item {
    @include flex-grid-layout-children(10, 8%);
    height: 0;
    padding-bottom: 8%;
    flex-shrink: 0;
  }
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;

  &.hint {
    color: #999;
    font-size: 12px;
    line-height: 1.6;
  }
}
.btns {
  margin-top: 16px;
  text-align: right;
}
</style>
