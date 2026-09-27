<template>
  <div class="margins-setting">
    <div class="title">Margens de trabalho padrão</div>
    <div class="tip">
      Área útil definida pelo trabalho padrão (lean). A margem padrão é de 7mm
      em cada lado e escala proporcionalmente quando o tamanho da folha muda.
    </div>

    <div class="row">
      <div class="label" style="width: 40%;">Esquerda (mm):</div>
      <NumberInput
        style="width: 60%;"
        :value="PX_TO_MM(margins.left)"
        :min="MARGIN_MIN_MM"
        :max="MARGIN_MAX_MM"
        :step="1"
        @update:value="value => updateMargin('left', value)"
      />
    </div>
    <div class="row">
      <div class="label" style="width: 40%;">Superior (mm):</div>
      <NumberInput
        style="width: 60%;"
        :value="PX_TO_MM(margins.top)"
        :min="MARGIN_MIN_MM"
        :max="MARGIN_MAX_MM"
        :step="1"
        @update:value="value => updateMargin('top', value)"
      />
    </div>
    <div class="row">
      <div class="label" style="width: 40%;">Direita (mm):</div>
      <NumberInput
        style="width: 60%;"
        :value="PX_TO_MM(margins.right)"
        :min="MARGIN_MIN_MM"
        :max="MARGIN_MAX_MM"
        :step="1"
        @update:value="value => updateMargin('right', value)"
      />
    </div>
    <div class="row">
      <div class="label" style="width: 40%;">Inferior (mm):</div>
      <NumberInput
        style="width: 60%;"
        :value="PX_TO_MM(margins.bottom)"
        :min="MARGIN_MIN_MM"
        :max="MARGIN_MAX_MM"
        :step="1"
        @update:value="value => updateMargin('bottom', value)"
      />
    </div>

    <div class="row" style="margin-top: 12px;">
      <Button style="flex: 1;" @click="applyToAllSlides()"><i-icon-park-outline:check /> Aplicar margens a todos os slides</Button>
    </div>
    <div class="row">
      <Button style="flex: 1;" @click="resetToDefault()"><i-icon-park-outline:undo /> Restaurar padrão de 7mm</Button>
    </div>

    <div class="tip" style="margin-top: 12px;">
      As margens ficam fixas no slide: ao inserir texto, formas ou linhas,
      eles são encaixados automaticamente dentro da área útil.
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import { MM_TO_PX, PX_TO_MM, MARGIN_MIN_MM, MARGIN_MAX_MM, getDefaultMarginProps, resolveMargins, type Margins } from '@/modules/margins'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import NumberInput from '@/components/NumberInput.vue'
import Button from '@/components/Button.vue'

const emit = defineEmits<{
  (event: 'close'): void
}>()

const slidesStore = useSlidesStore()
const { slides, currentSlide } = storeToRefs(slidesStore)

const { addHistorySnapshot } = useHistorySnapshot()

const margins = computed<Margins>(() => resolveMargins(currentSlide.value))

const updateMargin = (side: keyof Margins, value: number) => {
  const mm = Math.min(MARGIN_MAX_MM, Math.max(MARGIN_MIN_MM, value || 0))
  const sideMap = { left: 'marginL', top: 'marginT', right: 'marginR', bottom: 'marginB' } as const
  const props = { [sideMap[side]]: MM_TO_PX(mm) }
  slidesStore.updateSlide(props)
  addHistorySnapshot()
}

// Fixa as margens atuais em todos os slides (trabalho padrão uniforme)
const applyToAllSlides = () => {
  const { left, top, right, bottom } = margins.value
  const newSlides = slides.value.map(slide => ({
    ...slide,
    marginL: left,
    marginT: top,
    marginR: right,
    marginB: bottom,
  }))
  slidesStore.setSlides(newSlides)
  addHistorySnapshot()
  emit('close')
}

const resetToDefault = () => {
  slidesStore.updateSlide(getDefaultMarginProps())
  addHistorySnapshot()
}
</script>

<style lang="scss" scoped>
.margins-setting {
  width: 100%;
}
.title {
  font-weight: 700;
  margin-bottom: 10px;
}
.tip {
  font-size: 12px;
  color: #888;
  line-height: 1.5;
  margin-bottom: 10px;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.label {
  font-size: 13px;
}
</style>
