<template>
  <div class="home-panel">
    <!--
      Grupo MARCAÇÃO: seta, quadrado e círculo vazados para marcar imagens.
      Fica no INÍCIO da faixa para estar sempre visível sem rolar a barra.
    -->
    <div class="hp-group">
      <div class="hp-group-body">
        <div class="hp-row">
          <span class="hp-markup-label">Marcação</span>

          <div class="hp-btn-group">
            <Button first v-tooltip="'Inserir seta de marcação'" @click="insertMarkup('arrow')">
              <i-icon-park-outline:arrow-right />
            </Button>
            <Button v-tooltip="'Inserir seta de linha'" @click="insertMarkupLine()">
              <i-icon-park-outline:connection-arrow />
            </Button>
            <Button v-tooltip="'Inserir quadrado sem preenchimento'" @click="insertMarkup('square')">
              <i-icon-park-outline:square />
            </Button>
            <Button last v-tooltip="'Inserir círculo sem preenchimento'" @click="insertMarkup('circle')">
              <i-icon-park-outline:round />
            </Button>
          </div>

          <Popover trigger="click" class="hp-color-pop">
            <template #content>
              <ColorPicker :modelValue="markupColor" @update:modelValue="value => updateMarkupColor(value)" />
            </template>
            <Button v-tooltip="'Cor da marcação'">
              <span class="hp-markup-color" :style="{ backgroundColor: markupColor }"></span>
              <span class="hp-btn-text">Cor</span>
            </Button>
          </Popover>
        </div>
      </div>
      <div class="hp-group-label">Marcação</div>
    </div>

    <div class="hp-sep"></div>

    <!-- Grupo TEXTO: fonte, tamanho, estilo, cor e alinhamento -->
    <div class="hp-group" :class="{ 'hp-disabled': !canEditText }">
      <div class="hp-group-body">
        <div class="hp-row">
          <Select
            class="hp-font-name"
            :disabled="!canEditText"
            :value="richTextAttrs.fontname"
            search
            searchLabel="Buscar fonte"
            :options="homeFonts"
            :default-label="richTextAttrs.fontname || '—'"
            @update:value="value => emitRichTextCommand('fontname', value as string)"
          >
            <template #icon>
              <i-icon-park-outline:font-size />
            </template>
          </Select>
          <Select
            class="hp-font-size"
            :disabled="!canEditText"
            :value="richTextAttrs.fontsize"
            search
            searchLabel="Buscar tamanho"
            :options="fontSizeOptions.map(item => ({ label: item, value: item }))"
            @update:value="value => emitRichTextCommand('fontsize', value as string)"
          >
            <template #icon>
              <i-icon-park-outline:add-text />
            </template>
          </Select>

          <div class="hp-btn-group">
            <Button first v-tooltip="'Aumentar fonte'" @click="emitRichTextCommand('fontsize-add')">
              <i-icon-park-outline:font-size />+
            </Button>
            <Button last v-tooltip="'Diminuir fonte'" @click="emitRichTextCommand('fontsize-reduce')">
              <i-icon-park-outline:font-size />−
            </Button>
          </div>

          <div class="hp-btn-group">
            <CheckboxButton first :checked="richTextAttrs.bold" v-tooltip="'Negrito'" @click="emitRichTextCommand('bold')">
              <i-icon-park-outline:text-bold />
            </CheckboxButton>
            <CheckboxButton :checked="richTextAttrs.em" v-tooltip="'Itálico'" @click="emitRichTextCommand('em')">
              <i-icon-park-outline:text-italic />
            </CheckboxButton>
            <CheckboxButton :checked="richTextAttrs.underline" v-tooltip="'Sublinhado'" @click="emitRichTextCommand('underline')">
              <i-icon-park-outline:text-underline />
            </CheckboxButton>
            <CheckboxButton last :checked="richTextAttrs.strikethrough" v-tooltip="'Tachado'" @click="emitRichTextCommand('strikethrough')">
              <i-icon-park-outline:strikethrough />
            </CheckboxButton>
          </div>

          <div class="hp-btn-group">
            <Popover trigger="click" class="hp-color-pop">
              <template #content>
                <ColorPicker
                  :modelValue="richTextAttrs.color"
                  @update:modelValue="value => emitRichTextCommand('color', value)"
                />
              </template>
              <TextColorButton first v-tooltip="'Cor do texto'" :color="richTextAttrs.color">
                <i-icon-park-outline:text />
              </TextColorButton>
            </Popover>
            <Popover trigger="click" class="hp-color-pop">
              <template #content>
                <ColorPicker
                  :modelValue="richTextAttrs.backcolor"
                  @update:modelValue="value => emitRichTextCommand('backcolor', value)"
                />
              </template>
              <TextColorButton last v-tooltip="'Realce do texto'" :color="richTextAttrs.backcolor">
                <i-icon-park-outline:high-light />
              </TextColorButton>
            </Popover>
            <Button last v-tooltip="'Limpar formatação'" @click="emitRichTextCommand('clear')">
              <i-icon-park-outline:format />
            </Button>
          </div>
        </div>

        <div class="hp-row">
          <RadioGroup
            class="hp-btn-group"
            button-style="solid"
            :value="richTextAttrs.align"
            @update:value="value => emitRichTextCommand('align', value as string)"
          >
            <RadioButton first value="left" v-tooltip="'Alinhar à esquerda'"><i-icon-park-outline:align-text-left /></RadioButton>
            <RadioButton value="center" v-tooltip="'Centralizar'"><i-icon-park-outline:align-text-center /></RadioButton>
            <RadioButton value="right" v-tooltip="'Alinhar à direita'"><i-icon-park-outline:align-text-right /></RadioButton>
            <RadioButton last value="justify" v-tooltip="'Justificar'"><i-icon-park-outline:align-text-both /></RadioButton>
          </RadioGroup>

          <div class="hp-btn-group">
            <Button
              first
              :type="richTextAttrs.bulletList ? 'primary' : 'default'"
              v-tooltip="'Marcadores'"
              @click="emitRichTextCommand('bulletList')"
            >
              <i-icon-park-outline:list />
            </Button>
            <Button
              last
              :type="richTextAttrs.orderedList ? 'primary' : 'default'"
              v-tooltip="'Lista numerada'"
              @click="emitRichTextCommand('orderedList')"
            >
              <i-icon-park-outline:ordered-list />
            </Button>
          </div>

          <div class="hp-btn-group">
            <Button first v-tooltip="'Diminuir recuo'" @click="emitRichTextCommand('indent', '-1')">
              <i-icon-park-outline:indent-left />
            </Button>
            <Button last v-tooltip="'Aumentar recuo'" @click="emitRichTextCommand('indent', '+1')">
              <i-icon-park-outline:indent-right />
            </Button>
          </div>
        </div>
      </div>
      <div class="hp-group-label">Texto</div>
    </div>

    <div class="hp-sep"></div>

    <!-- Grupo FORMAS: insere formas novas e edita as já selecionadas -->
    <div class="hp-group">
      <div class="hp-group-body">
        <div class="hp-row">
          <Popover trigger="click" v-model:value="shapePoolVisible">
            <template #content>
              <ShapePool @select="shape => handleSelectShape(shape)" />
            </template>
            <Button first v-tooltip="'Inserir ou trocar a forma'">
              <i-icon-park-outline:graphic-design />
              <span class="hp-btn-text">Formas</span>
              <i-icon-park-outline:down class="hp-arrow" />
            </Button>
          </Popover>

          <div class="hp-shape-props" :class="{ 'hp-disabled': !canEditShape }">
            <div class="hp-btn-group">
              <Popover trigger="click">
                <template #content>
                  <ColorPicker :modelValue="fill" @update:modelValue="value => updateFill(value)" />
                </template>
                <Button first v-tooltip="'Preenchimento da forma'">
                  <i-icon-park-outline:paint />
                  <span class="hp-btn-text">Preencher</span>
                </Button>
              </Popover>
              <Popover trigger="click">
                <template #content>
                  <ColorPicker :modelValue="outlineColor" @update:modelValue="value => updateOutlineColor(value)" />
                </template>
                <Button last v-tooltip="'Cor do contorno da forma'">
                  <i-icon-park-outline:connection />
                  <span class="hp-btn-text">Contorno</span>
                </Button>
              </Popover>
            </div>

            <div class="hp-outline-width">
              <NumberInput
                :min="0"
                :max="PX_TO_MM(20)"
                :step="PX_TO_MM(1)"
                :value="PX_TO_MM(outlineWidth)"
                :disabled="!canEditShape"
                @update:value="value => updateOutlineWidth(MM_TO_PX(value))"
              >
                <template #prefix>Espessura:</template>
                <template #suffix>mm</template>
              </NumberInput>
            </div>
          </div>
        </div>
      </div>
      <div class="hp-group-label">Formas</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElement, PPTElementOutline, PPTLineElement, PPTShapeElement } from '@/types/slides'
import { type ShapePoolItem, SHAPE_PATH_FORMULAS } from '@/configs/shapes'
import { MM_TO_PX, PX_TO_MM } from '@/configs/units'
import emitter, { EmitterEvents } from '@/utils/emitter'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useCreateElement from '@/hooks/useCreateElement'

import ShapePool from '@/views/Editor/CanvasTool/ShapePool.vue'
import Button from '@/components/Button.vue'
import CheckboxButton from '@/components/CheckboxButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import NumberInput from '@/components/NumberInput.vue'
import Popover from '@/components/Popover.vue'
import RadioButton from '@/components/RadioButton.vue'
import RadioGroup from '@/components/RadioGroup.vue'
import Select from '@/components/Select.vue'
import TextColorButton from '@/components/TextColorButton.vue'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { handleElement, handleElementId, richTextAttrs } = storeToRefs(mainStore)
const { viewportSize, viewportRatio, theme } = storeToRefs(slidesStore)

const { addHistorySnapshot } = useHistorySnapshot()
const { createShapeElement, createLineElement } = useCreateElement()

const fontSizeOptions = [
  '12px', '14px', '16px', '18px', '20px', '22px', '24px', '28px', '32px',
  '36px', '40px', '44px', '48px', '54px', '60px', '66px', '72px', '76px',
  '80px', '88px', '96px', '104px', '112px', '120px',
]

// fontes disponíveis na aba Página Inicial (Arial e Calibri são fontes de sistema,
// Roboto vem do bundle em assets/fonts)
const homeFonts = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Calibri', value: 'Calibri' },
  { label: 'Roboto', value: 'Roboto' },
]

// --- edição de texto -------------------------------------------------------
// só há o que editar quando o elemento selecionado é texto (ou forma com texto)
const canEditText = computed(() => {
  const el = handleElement.value
  if (!el) return false
  if (el.type === 'text') return true
  if (el.type === 'shape') return !!(el as PPTShapeElement).text?.content
  return false
})

const emitRichTextCommand = (command: string, value?: string) => {
  if (!canEditText.value) return
  emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, { action: { command, value } })
}

// --- edição de formas ------------------------------------------------------
const canEditShape = computed(() => handleElement.value?.type === 'shape')

const fill = ref('#fff')
const outlineColor = ref('#000')
const outlineWidth = ref(0)

watch(handleElement, () => {
  const el = handleElement.value
  if (!el || el.type !== 'shape') return

  const shape = el as PPTShapeElement
  fill.value = shape.fill || '#fff'
  outlineColor.value = shape.outline?.color || '#000'
  outlineWidth.value = shape.outline?.width || 0
}, { deep: true, immediate: true })

const updateShape = (props: Partial<PPTShapeElement>) => {
  if (!canEditShape.value) return
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

// preenchimento sólido: remove gradiente/imagem para a cor aparecer
const updateFill = (color: string) => {
  if (!canEditShape.value) return
  fill.value = color
  slidesStore.removeElementProps({ id: handleElementId.value, propName: ['gradient', 'pattern'] })
  slidesStore.updateElement({ id: handleElementId.value, props: { fill: color } })
  addHistorySnapshot()
}

// cria o contorno automaticamente se a forma ainda não tiver um
const ensureOutline = (): PPTElementOutline => {
  const el = handleElement.value as PPTShapeElement
  return el.outline || { width: 2, style: 'solid', color: outlineColor.value }
}

const updateOutlineColor = (color: string) => {
  outlineColor.value = color
  updateShape({ outline: { ...ensureOutline(), color } })
}

const updateOutlineWidth = (width: number) => {
  outlineWidth.value = width
  updateShape({ outline: { ...ensureOutline(), width } })
}

// --- galeria de formas -----------------------------------------------------
const shapePoolVisible = ref(false)

const handleSelectShape = (shape: ShapePoolItem) => {
  shapePoolVisible.value = false

  const el = handleElement.value
  if (el && el.type === 'shape') changeShape(shape, el)
  else insertShape(shape)
}

// troca a forma mantendo o tamanho atual (mesma lógica do painel de estilo)
const changeShape = (shape: ShapePoolItem, el: PPTShapeElement) => {
  const { width, height } = el
  const props: Partial<PPTShapeElement> = {
    viewBox: shape.viewBox,
    path: shape.path,
    special: shape.special,
  }

  if (shape.pathFormula) {
    props.pathFormula = shape.pathFormula
    props.viewBox = [width, height]

    const pathFormula = SHAPE_PATH_FORMULAS[shape.pathFormula]
    if ('editable' in pathFormula) {
      props.path = pathFormula.formula(width, height, pathFormula.defaultValue)
      props.keypoints = pathFormula.defaultValue
    }
    else props.path = pathFormula.formula(width, height)
  }
  else {
    props.pathFormula = undefined
    props.keypoints = undefined
  }

  updateShape(props)
}

// insere a forma no centro da página com tamanho padrão de 50 × 50 mm
const insertShape = (shape: ShapePoolItem) => {
  const size = MM_TO_PX(50)

  createShapeElement(
    {
      width: size,
      height: size,
      left: (viewportSize.value - size) / 2,
      top: (viewportSize.value * viewportRatio.value - size) / 2,
    },
    shape,
    { fill: theme.value.themeColors[0] }
  )
}

// --- marcação: seta, quadrado e círculo vazados -----------------------------
// Formas básicas em viewBox 200×200, comuns aos três modelos de marcação.
// Elas nascem SEM preenchimento e com contorno na cor escolhida (vermelho por
// padrão), servindo para marcar pendências sobre as fotos do relatório.
type MarkupShapeType = 'arrow' | 'square' | 'circle'

/** Espessura do traço de todas as marcações: 1,2 mm (1,2 × px por milímetro) */
const MARKUP_LINE_WIDTH = MM_TO_PX(1.2)

/** Comprimento inicial da seta de linha, em milímetros */
const MARKUP_LINE_LENGTH_MM = 60

const MARKUP_SHAPES: Record<MarkupShapeType, ShapePoolItem> = {
  arrow: { viewBox: [200, 200], path: 'M 0 100 L 100 0 L 100 50 L 200 50 L 200 150 L 100 150 L 100 200 L 0 100 Z' },
  square: { viewBox: [200, 200], path: 'M 0 0 L 200 0 L 200 200 L 0 200 Z' },
  circle: { viewBox: [200, 200], path: 'M 100 0 A 50 50 0 1 1 100 200 A 50 50 0 1 1 100 0 Z' },
}

/** Tamanho inicial de cada marcação, em milímetros */
const MARKUP_SIZE_MM: Record<MarkupShapeType, { width: number; height: number }> = {
  arrow: { width: 60, height: 24 },
  square: { width: 40, height: 40 },
  circle: { width: 40, height: 40 },
}

/** Prefixo do nome dos elementos de marcação (identificador estável) */
const MARKUP_NAME_PREFIX = 'markup:'

/** Cor inicial da marcação: vermelho vivo */
const markupColor = ref('#ff1a3c')

// insere a marcação no centro da página, sem preenchimento e com contorno na cor escolhida
const insertMarkup = (type: MarkupShapeType) => {
  const { width: widthMM, height: heightMM } = MARKUP_SIZE_MM[type]
  const width = MM_TO_PX(widthMM)
  const height = MM_TO_PX(heightMM)

  createShapeElement(
    {
      width,
      height,
      left: (viewportSize.value - width) / 2,
      top: (viewportSize.value * viewportRatio.value - height) / 2,
    },
    MARKUP_SHAPES[type],
    {
      name: MARKUP_NAME_PREFIX + type,
      fill: 'rgba(0, 0, 0, 0)',
      outline: {
        width: MARKUP_LINE_WIDTH,
        style: 'solid',
        color: markupColor.value,
      },
    },
  )
}

// insere uma seta de linha (traço reto com ponta de seta) no centro da página
const insertMarkupLine = () => {
  const width = MM_TO_PX(MARKUP_LINE_LENGTH_MM)

  createLineElement(
    {
      left: (viewportSize.value - width) / 2,
      top: (viewportSize.value * viewportRatio.value) / 2,
      start: [0, 0],
      end: [width, 0],
    },
    { path: 'M 0 0 L 20 0', style: 'solid', points: ['', 'arrow'] },
    {
      name: MARKUP_NAME_PREFIX + 'line',
      color: markupColor.value,
      width: MARKUP_LINE_WIDTH,
    },
    { fitToMargins: false },
  )
}

const isMarkupElement = (el: PPTElement | null | undefined): el is PPTShapeElement =>
  !!el && el.type === 'shape' && !!el.name && el.name.startsWith(MARKUP_NAME_PREFIX)

const isMarkupLineElement = (el: PPTElement | null | undefined): el is PPTLineElement =>
  !!el && el.type === 'line' && !!el.name && el.name.startsWith(MARKUP_NAME_PREFIX)

// troca a cor das próximas marcações e, se uma marcação estiver selecionada,
// também a cor do contorno (formas) ou do traço (seta de linha) dela
const updateMarkupColor = (color: string) => {
  markupColor.value = color

  const el = handleElement.value

  if (isMarkupLineElement(el)) {
    slidesStore.updateElement({ id: el.id, props: { color } })
    addHistorySnapshot()
    return
  }

  if (!isMarkupElement(el)) return

  const outline: PPTElementOutline = el.outline
    ? { ...el.outline, color }
    : { width: MARKUP_LINE_WIDTH, style: 'solid', color }

  slidesStore.updateElement({ id: el.id, props: { outline } })
  addHistorySnapshot()
}

watch(handleElementId, () => {
  shapePoolVisible.value = false
})
</script>

<style lang="scss" scoped>
.home-panel {
  display: flex;
  align-items: center;
  /* distribui os grupos pela largura toda da faixa */
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 100%;
}

/* grupo estilo PowerPoint, agora em uma única linha */
.hp-group {
  display: flex;
  align-items: center;
  padding: 0 2px;
  /* cresce quando há espaço sobrando, mas nunca encolhe abaixo do conteúdo */
  flex: 1 0 auto;

  .hp-group-body {
    display: flex;
    flex-direction: row;
    align-items: center;
    /* distribui as ferramentas dentro do grupo pela largura disponível */
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 100%;
  }
  /* rótulos ("Texto"/"Formas") não cabem na faixa de uma linha */
  .hp-group-label {
    display: none;
  }
}

/* as duas fileiras antigas viram uma única linha */
.hp-row {
  display: contents;
  white-space: nowrap;
}

/* divisor vertical entre grupos */
.hp-sep {
  align-self: center;
  width: 1px;
  height: 24px;
  margin: 0 4px;
  background-color: rgba(5, 5, 5, .08);
  flex-shrink: 0;
}

.hp-disabled {
  opacity: .45;
  pointer-events: none;
}

.hp-shape-props {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hp-font-name {
  width: 150px;
}
.hp-font-size {
  width: 84px;
}
.hp-outline-width {
  width: 172px;
}

.hp-btn-group {
  display: flex;
  align-items: center;

  /* arredonda só as pontas do grupo; o Popover envolve alguns botões,
     por isso usa as classes .first/.last e não :first-child/:last-child */
  ::v-deep(button.button) {
    border-radius: 0;
    border-left-width: 1px;
    border-right-width: 0;
    padding: 0 9px;

    &.first {
      border-top-left-radius: $borderRadiusSm;
      border-bottom-left-radius: $borderRadiusSm;
    }
    &.last {
      border-top-right-radius: $borderRadiusSm;
      border-bottom-right-radius: $borderRadiusSm;
      border-right-width: 1px;
    }
    &:not(.first):hover {
      position: relative;

      &::after {
        content: '';
        width: 1px;
        height: calc(100% + 2px);
        background-color: $themeColor;
        position: absolute;
        top: -1px;
        right: -1px;
      }
    }
  }
}

/* os Popover viram itens flex de largura própria */
.hp-color-pop {
  display: block;
}

.hp-btn-text {
  margin-left: 4px;
}

/* nome do grupo "Marcação" (os demais grupos têm o rótulo oculto na faixa) */
.hp-markup-label {
  display: flex;
  align-items: center;
  align-self: stretch;
  margin-right: 6px;
  padding-left: 6px;
  border-left: 3px solid $themeColor;
  font-size: 10.5px;
  font-weight: 600;
  color: $textSecondaryColor;
  white-space: nowrap;
}

/* amostra da cor atual da marcação */
.hp-markup-color {
  display: inline-block;
  width: 11px;
  height: 11px;
  border: 1px solid rgba(5, 5, 5, .25);
  border-radius: 2px;
}
.hp-arrow {
  margin-left: 2px;
  font-size: 11px;
}
</style>
