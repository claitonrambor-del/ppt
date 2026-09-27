<template>
  <div class="element-positopn-panel">
    <div class="title">Camadas:</div>
    <ButtonGroup class="row">
      <Button style="flex: 1;" @click="orderElement(handleElement!, ElementOrderCommands.TOP)"><i-icon-park-outline:send-to-back /> Trazer para frente</Button>
      <Button style="flex: 1;" @click="orderElement(handleElement!, ElementOrderCommands.BOTTOM)"><i-icon-park-outline:bring-to-front-one /> Enviar para trás</Button>
    </ButtonGroup>
    <ButtonGroup class="row">
      <Button style="flex: 1;" @click="orderElement(handleElement!, ElementOrderCommands.UP)"><i-icon-park-outline:BringToFront /> Mover para cima</Button>
      <Button style="flex: 1;" @click="orderElement(handleElement!, ElementOrderCommands.DOWN)"><i-icon-park-outline:SentToBack /> Mover para baixo</Button>
    </ButtonGroup>

    <Divider />
    
    <div class="title">Alinhar:</div>
    <ButtonGroup class="row">
      <Button style="flex: 1;" v-tooltip="'Alinhar à esquerda'" @click="alignElementToCanvas(ElementAlignCommands.LEFT)"><i-icon-park-outline:align-left /></Button>
      <Button style="flex: 1;" v-tooltip="'Centralizar horizontalmente'" @click="alignElementToCanvas(ElementAlignCommands.HORIZONTAL)"><i-icon-park-outline:align-vertically /></Button>
      <Button style="flex: 1;" v-tooltip="'Alinhar à direita'" @click="alignElementToCanvas(ElementAlignCommands.RIGHT)"><i-icon-park-outline:align-right /></Button>
    </ButtonGroup>
    <ButtonGroup class="row">
      <Button style="flex: 1;" v-tooltip="'Alinhar ao topo'" @click="alignElementToCanvas(ElementAlignCommands.TOP)"><i-icon-park-outline:align-top /></Button>
      <Button style="flex: 1;" v-tooltip="'Centralizar verticalmente'" @click="alignElementToCanvas(ElementAlignCommands.VERTICAL)"><i-icon-park-outline:align-horizontally /></Button>
      <Button style="flex: 1;" v-tooltip="'Alinhar à base'" @click="alignElementToCanvas(ElementAlignCommands.BOTTOM)"><i-icon-park-outline:align-bottom /></Button>
    </ButtonGroup>

    <Divider />

    <div class="row">
      <NumberInput
        :min="-300"
        :max="500"
        :step="1"
        :value="left"
        @update:value="value => updateLeft(value)"
        style="width: 45%;"
      >
        <template #prefix>
          Horizontal (mm):
        </template>
      </NumberInput>
      <div style="width: 10%;"></div>
      <NumberInput
        :min="-300"
        :max="500"
        :step="1"
        :value="top"
        @update:value="value => updateTop(value)"
        style="width: 45%;"
      >
        <template #prefix>
          Vertical (mm):
        </template>
      </NumberInput>
    </div>

    <template v-if="handleElement!.type !== 'line'">
      <div class="row">
        <NumberInput
          :min="minSizeMM"
          :max="450"
          :step="1"
          :disabled="isAutoWidthText"
          :value="width"
          @update:value="value => updateWidth(value)"
          style="width: 45%;"
        >
          <template #prefix>
            Largura (mm):
          </template>
        </NumberInput>
        <template v-if="['image', 'shape'].includes(handleElement!.type)">
          <span style="width: 10%;" class="icon-btn" :class="{ 'active': fixedRatio }" v-tooltip="fixedRatio ? 'Destravar proporção' : 'Proporção travada'" @click="updateFixedRatio(!fixedRatio)">
            <i-icon-park-outline:lock v-if="fixedRatio" />
            <i-icon-park-outline:unlock v-else />
          </span>
        </template>
        <div style="width: 10%;" v-else></div>
        <NumberInput 
          :min="minSizeMM"
          :max="450"
          :step="1"
          :disabled="isAutoHeightText || handleElement!.type === 'table'"
          :value="height" 
          @update:value="value => updateHeight(value)"
          style="width: 45%;"
        >
          <template #prefix>
            Altura (mm):
          </template>
        </NumberInput>
      </div>
    </template>

    <template v-if="handleElement!.type !== 'line'">
      <Divider />

      <div class="row">
        <NumberInput 
          :min="-180"
          :max="180"
          :step="5"
          :value="rotate" 
          @update:value="value => updateRotate(value)" 
          style="width: 45%;" 
        >
          <template #prefix>
            Rotação:
          </template>
        </NumberInput>
        <div style="width: 7%;"></div>
        <div class="text-btn" @click="updateRotate45('-')" style="width: 24%;"><i-icon-park-outline:rotate /> -45°</div>
        <div class="text-btn" @click="updateRotate45('+')"  style="width: 24%;"><i-icon-park-outline:rotate :style="{ transform: 'rotateY(180deg)' }" /> +45°</div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { round } from 'lodash'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElement } from '@/types/slides'
import { ElementAlignCommands, ElementOrderCommands } from '@/types/edit'
import { MIN_SIZE } from '@/configs/element'
import { MM_TO_PX, PX_TO_MM } from '@/configs/units'
import { SHAPE_PATH_FORMULAS } from '@/configs/shapes'
import useOrderElement from '@/hooks/useOrderElement'
import useAlignElementToCanvas from '@/hooks/useAlignElementToCanvas'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import Divider from '@/components/Divider.vue'
import Button from '@/components/Button.vue'
import ButtonGroup from '@/components/ButtonGroup.vue'
import NumberInput from '@/components/NumberInput.vue'

const slidesStore = useSlidesStore()
const { handleElement, handleElementId } = storeToRefs(useMainStore())

const left = ref(0)
const top = ref(0)
const width = ref(0)
const height = ref(0)
const rotate = ref(0)
const fixedRatio = ref(false)

// tamanho mínimo do elemento convertido para mm (exibição na UI)
const minSizeMM = computed(() => {
  if (!handleElement.value) return 5
  return PX_TO_MM(MIN_SIZE[handleElement.value.type] || 20)
})

const isAutoHeightText = computed(() => {
  return handleElement.value?.type === 'text' && !handleElement.value.vertical && !handleElement.value.fixedHeight
})
const isAutoWidthText = computed(() => {
  return handleElement.value?.type === 'text' && handleElement.value.vertical && !handleElement.value.fixedHeight
})

watch(handleElement, () => {
  if (!handleElement.value) return

  // valores em px do canvas convertidos para mm (exibição na UI)
  left.value = round(PX_TO_MM(handleElement.value.left), 1)
  top.value = round(PX_TO_MM(handleElement.value.top), 1)

  fixedRatio.value = 'fixedRatio' in handleElement.value && !!handleElement.value.fixedRatio

  if (handleElement.value.type !== 'line') {
    width.value = round(PX_TO_MM(handleElement.value.width), 1)
    height.value = round(PX_TO_MM(handleElement.value.height), 1)
    rotate.value = 'rotate' in handleElement.value && handleElement.value.rotate !== undefined ? round(handleElement.value.rotate, 1) : 0
  }
}, { deep: true, immediate: true })

const { orderElement } = useOrderElement()
const { alignElementToCanvas } = useAlignElementToCanvas()

const { addHistorySnapshot } = useHistorySnapshot()

// AplicarelementoPosição (recebe mm, converte para px do canvas)
const updateLeft = (value: number) => {
  const props = { left: MM_TO_PX(value) }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}
const updateTop = (value: number) => {
  const props = { top: MM_TO_PX(value) }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

// Aplicarelementolargura、altura、Rotaçãoângulo
// ao definir largura/altura da forma, verifica se o caminho precisa ser atualizado
const updateShapePathData = (width: number, height: number) => {
  if (handleElement.value && handleElement.value.type === 'shape' && 'pathFormula' in handleElement.value && handleElement.value.pathFormula) {
    const pathFormula = SHAPE_PATH_FORMULAS[handleElement.value.pathFormula]

    let path = ''
    if ('editable' in pathFormula && pathFormula.editable) path = pathFormula.formula(width, height, handleElement.value.keypoints!)
    else path = pathFormula.formula(width, height)

    return {
      viewBox: [width, height],
      path,
    }
  }
  return null
}

const updateWidth = (value: number) => {
  if (!handleElement.value) return
  if (handleElement.value.type === 'line' || isAutoWidthText.value) return

  // converte mm para px e aplica (incl. proporção fixa e viewBox de formas)
  const wPx = MM_TO_PX(value)
  const hPx = MM_TO_PX(height.value)
  const minPx = MM_TO_PX(minSizeMM.value)

  let h = hPx

  if (fixedRatio.value) {
    const ratio = width.value / height.value
    h = (value / ratio) < minSizeMM.value ? minPx : (MM_TO_PX(value / ratio))
  }
  let props: Partial<PPTElement> = { width: wPx, height: h }

  const shapePathData = updateShapePathData(wPx, h)
  if (shapePathData) {
    props = {
      width: wPx,
      height: h,
      ...shapePathData,
    }
  }

  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

const updateHeight = (value: number) => {
  if (!handleElement.value) return
  if (handleElement.value.type === 'line' || handleElement.value.type === 'table' || isAutoHeightText.value) return

  // converte mm para px e aplica (incl. proporção fixa e viewBox de formas)
  const hPx = MM_TO_PX(value)
  const wPx = MM_TO_PX(width.value)
  const minPx = MM_TO_PX(minSizeMM.value)

  let w = wPx

  if (fixedRatio.value) {
    const ratio = width.value / height.value
    w = (value * ratio) < minSizeMM.value ? minPx : (MM_TO_PX(value * ratio))
  }
  let props: Partial<PPTElement> = { width: w, height: hPx }

  const shapePathData = updateShapePathData(w, hPx)
  if (shapePathData) {
    props = {
      width: w,
      height: hPx,
      ...shapePathData,
    }
  }

  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

const updateRotate = (value: number) => {
  const props = { rotate: value }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

// trava a proporção do elemento
const updateFixedRatio = (value: boolean) => {
  const props = { fixedRatio: value }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

// rotaciona o elemento em 45 graus (horário ou anti-horário)
const updateRotate45 = (command: '+' | '-') => {
  let _rotate = Math.floor(rotate.value / 45) * 45
  if (command === '+') _rotate = _rotate + 45
  else if (command === '-') _rotate = _rotate - 45

  if (_rotate < -180) _rotate = -180
  if (_rotate > 180) _rotate = 180

  const props = { rotate: _rotate }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.title {
  margin-bottom: 10px;
}
.label {
  text-align: center;
}
.icon-btn {
  display: inline-block;
  text-align: center;
  cursor: pointer;

  &.active {
    color: $themeColor;
  }
}
.text-btn {
  height: 30px;
  line-height: 30px;
  text-align: center;
  cursor: pointer;

  &:hover {
    background-color: #efefef;
    border-radius: $borderRadius;
  }
}
</style>
