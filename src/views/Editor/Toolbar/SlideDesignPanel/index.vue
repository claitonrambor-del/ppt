<template>
  <div class="slide-design-panel">
    <div class="title">Fundo</div>

    <div class="field">
      <Select
        :value="background.type"
        @update:value="value => updateBackgroundType(value as 'gradient' | 'image' | 'solid')"
        :options="[
          { label: 'Preenchimento sólido', value: 'solid' },
          { label: 'Preenchimento de imagem', value: 'image' },
          { label: 'Preenchimento gradiente', value: 'gradient' },
        ]"
      />
    </div>

    <div class="field" v-if="background.type === 'solid'">
      <Popover trigger="click">
        <template #content>
          <ColorPicker
            :modelValue="background.color"
            @update:modelValue="color => updateBackground({ color })"
          />
        </template>
        <ColorButton :color="background.color || '#fff'" />
      </Popover>
    </div>

    <div class="field" v-else-if="background.type === 'image'">
      <Select
        :value="background.image?.size || 'cover'"
        @update:value="value => updateImageBackground({ size: value as SlideBackgroundImageSize })"
        :options="[
          { label: 'Ajustar', value: 'contain' },
          { label: 'Lado a lado', value: 'repeat' },
          { label: 'Preencher', value: 'cover' },
        ]"
      />
    </div>

    <div class="field" v-else>
      <Select
        :value="background.gradient?.type || ''"
        @update:value="value => updateGradientBackground({ type: value as GradientType })"
        :options="[
          { label: 'Gradiente linear', value: 'linear' },
          { label: 'Gradiente radial', value: 'radial' },
        ]"
      />
    </div>

    <div class="background-image-wrapper" v-if="background.type === 'image'">
      <FileInput @change="files => uploadBackgroundImage(files)">
        <div class="background-image">
          <div class="content" :style="{ backgroundImage: `url(${background.image?.src})` }">
            <i-icon-park-outline:plus />
          </div>
        </div>
      </FileInput>
    </div>

    <div class="background-gradient-wrapper" v-if="background.type === 'gradient'">
      <div class="row">
        <GradientBar
          :value="background.gradient?.colors || []"
          :index="currentGradientIndex"
          @update:value="value => updateGradientBackground({ colors: value })"
          @update:index="index => currentGradientIndex = index"
        />
      </div>
      <div class="field">
        <div class="field-label">Cor atual:</div>
        <Popover trigger="click">
          <template #content>
            <ColorPicker
              :modelValue="background.gradient!.colors[currentGradientIndex].color"
              @update:modelValue="value => updateGradientBackgroundColors(value)"
            />
          </template>
          <ColorButton :color="background.gradient!.colors[currentGradientIndex].color" />
        </Popover>
      </div>
      <div class="field" v-if="background.gradient?.type === 'linear'">
        <div class="field-label">Ângulo do gradiente:</div>
        <Slider
          :min="0"
          :max="360"
          :step="15"
          :value="background.gradient.rotate || 0"
          @update:value="value => updateGradientBackground({ rotate: value as number })"
        />
      </div>
    </div>

    <div class="field">
      <Button class="block-btn" @click="applyBackgroundAllSlide()"><i-icon-park-outline:check /> Aplicar fundo a todos</Button>
    </div>

    <Divider />

    <div class="field">
      <div class="field-label">Folha:</div>
      <Select
        defaultLabel="—"
        :value="paperSize"
        @update:value="value => updatePaperSize(value as PaperSize)"
        :options="paperSizeOptions"
      />
    </div>

    <div class="field">
      <div class="field-label">Orientação:</div>
      <Select
        defaultLabel="—"
        :value="paperOrientation"
        @update:value="value => updatePaperOrientation(value as PaperOrientation)"
        :options="paperOrientationOptions"
      />
    </div>

    <div class="row">
      <div class="canvas-size">Tamanho do canvas: {{ Math.round(PX_TO_MM(viewportSize)) }} × {{ Math.round(PX_TO_MM(viewportSize * viewportRatio)) }} mm</div>
    </div>

    <div class="field">
      <Button class="block-btn" @click="customViewportSizeVisible = true"><i-icon-park-outline:proportional-scaling /> Tamanho personalizado</Button>
    </div>

    <Divider />

    <div class="title">Trabalho padrão (margens)</div>
    <div class="field">
      <div class="field-label">Margem:</div>
      <Button class="block-btn" @click="marginsSettingVisible = true"><i-icon-park-outline:adjustment /> Configurar margens</Button>
    </div>
    <div class="tip-text">Padrão: 7mm por lado (escala proporcionalmente ao trocar a folha ou o tamanho do canvas)</div>

    <Divider />

    <div class="title">
      <span>Tema global</span>
      <span class="more" @click="moreThemeConfigsVisible = !moreThemeConfigsVisible">
        <span class="text">Mais</span>
        <i-icon-park-outline:down v-if="moreThemeConfigsVisible" />
        <i-icon-park-outline:right v-else />
      </span>
    </div>
    <div class="field">
      <div class="field-label">Fonte:</div>
      <Select
        :value="theme.fontName"
        search
        searchLabel="Buscar fonte"
        autofocus
        @update:value="value => updateTheme({ fontName: value as string })"
        :options="FONTS"
      />
    </div>
    <div class="field">
      <div class="field-label">FonteCor:</div>
      <Popover trigger="click">
        <template #content>
          <ColorPicker
            :modelValue="theme.fontColor"
            @update:modelValue="value => updateTheme({ fontColor: value })"
          />
        </template>
        <ColorButton :color="theme.fontColor" />
      </Popover>
    </div>
    <div class="field">
      <div class="field-label">Cor de fundo:</div>
      <Popover trigger="click">
        <template #content>
          <ColorPicker
            :modelValue="theme.backgroundColor"
            @update:modelValue="value => updateTheme({ backgroundColor: value })"
          />
        </template>
        <ColorButton :color="theme.backgroundColor" />
      </Popover>
    </div>
    <div class="field">
      <div class="field-label">Cor do tema:</div>
      <ColorListButton :colors="theme.themeColors" @click="themeColorsSettingVisible = true" />
    </div>

    <template v-if="moreThemeConfigsVisible">
      <div class="field">
        <div class="field-label">Estilo da borda:</div>
        <SelectCustom>
          <template #options>
            <div class="option" v-for="item in lineStyleOptions" :key="item" @click="updateTheme({ outline: { ...theme.outline, style: item } })">
              <SVGLine :type="item" />
            </div>
          </template>
          <template #label>
            <SVGLine :type="theme.outline.style" />
          </template>
        </SelectCustom>
      </div>
      <div class="field">
        <div class="field-label">Cor da borda:</div>
        <Popover trigger="click">
          <template #content>
            <ColorPicker
              :modelValue="theme.outline.color"
              @update:modelValue="value => updateTheme({ outline: { ...theme.outline, color: value } })"
            />
          </template>
          <ColorButton :color="theme.outline.color || '#000'" />
        </Popover>
      </div>
      <div class="field">
        <div class="field-label">Espessura da borda:</div>
        <NumberInput
          :step="PX_TO_MM(1)"
          :value="PX_TO_MM(theme.outline.width || 0)"
          @update:value="value => updateTheme({ outline: { ...theme.outline, width: MM_TO_PX(value) } })"
        >
          <template #suffix>mm</template>
        </NumberInput>
      </div>
      <div class="field">
        <div class="field-label">HorizontalSombra：</div>
        <Slider
          unit="mm"
          :min="PX_TO_MM(-20)"
          :max="PX_TO_MM(20)"
          :step="PX_TO_MM(1)"
          :value="PX_TO_MM(theme.shadow.h)"
          @update:value="value => updateTheme({ shadow: { ...theme.shadow, h: MM_TO_PX(value as number) } })"
        />
      </div>
      <div class="field">
        <div class="field-label">VerticalSombra：</div>
        <Slider
          unit="mm"
          :min="PX_TO_MM(-20)"
          :max="PX_TO_MM(20)"
          :step="PX_TO_MM(1)"
          :value="PX_TO_MM(theme.shadow.v)"
          @update:value="value => updateTheme({ shadow: { ...theme.shadow, v: MM_TO_PX(value as number) } })"
        />
      </div>
      <div class="field">
        <div class="field-label">Distância do desfoque:</div>
        <Slider
          unit="mm"
          :min="PX_TO_MM(1)"
          :max="PX_TO_MM(30)"
          :step="PX_TO_MM(1)"
          :value="PX_TO_MM(theme.shadow.blur)"
          @update:value="value => updateTheme({ shadow: { ...theme.shadow, blur: MM_TO_PX(value as number) } })"
        />
      </div>
      <div class="field">
        <div class="field-label">SombraCor:</div>
        <Popover trigger="click">
          <template #content>
            <ColorPicker
              :modelValue="theme.shadow.color"
              @update:modelValue="value => updateTheme({ shadow: { ...theme.shadow, color: value } })"
            />
          </template>
          <ColorButton :color="theme.shadow.color" />
        </Popover>
      </div>
    </template>

    <div class="stack">
      <Button class="block-btn" @click="applyThemeToAllSlides(moreThemeConfigsVisible)"><i-icon-park-outline:check /> Aplicar tema a todos</Button>
      <Button class="block-btn" @click="applyFontToAllSlides(theme.fontName)"><i-icon-park-outline:check /> Fonte global unificada</Button>
      <Button class="block-btn" @click="themeStylesExtractVisible = true"><i-icon-park-outline:platte /> Extrair tema dos slides</Button>
    </div>

    <Divider />

    <div class="title">Temas predefinidos</div>
    <div class="theme-list">
      <div
        class="theme-item"
        v-for="(item, index) in PRESET_THEMES"
        :key="index"
        :style="{
          backgroundColor: item.background,
          fontFamily: item.fontname,
        }"
      >
        <div class="theme-item-content">
          <div class="text" :style="{ color: item.fontColor }">Texto Aa</div>
          <div class="colors">
            <div class="color-block" v-for="(color, index) in item.colors" :key="index" :style="{ backgroundColor: color}"></div>
          </div>

          <div class="btns">
            <Button type="primary" size="small" @click="applyPresetTheme(item)">Aplicar</Button>
            <Button type="primary" size="small" style="margin-top: 3px;" @click="applyPresetTheme(item, true)">Aplicar</Button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Modal
    v-model:visible="themeStylesExtractVisible"
    :width="320"
    @closed="themeStylesExtractVisible = false"
  >
    <ThemeStylesExtract @close="themeStylesExtractVisible = false" />
  </Modal>

  <Modal
    v-model:visible="themeColorsSettingVisible"
    :width="310"
    @closed="themeColorsSettingVisible = false"
  >
    <ThemeColorsSetting @close="themeColorsSettingVisible = false" />
  </Modal>

  <Modal
    v-model:visible="customViewportSizeVisible"
    :width="300"
    @closed="customViewportSizeVisible = false"
  >
    <ViewportSizeSetting @close="customViewportSizeVisible = false" />
  </Modal>

  <Modal
    v-model:visible="marginsSettingVisible"
    :width="320"
    @closed="marginsSettingVisible = false"
  >
    <MarginsSetting @close="marginsSettingVisible = false" />
  </Modal>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import type { 
  Gradient,
  GradientType,
  SlideBackground,
  SlideBackgroundType,
  SlideTheme,
  SlideBackgroundImage,
  SlideBackgroundImageSize,
  LineStyleType,
} from '@/types/slides'
import { PRESET_THEMES } from '@/configs/theme'
import { FONTS } from '@/configs/font'
import {
  PAPER_SIZES_MM,
  PAPER_SIZE_LABELS,
  PAPER_ORIENTATION_LABELS,
  getPaperDimensionsPx,
  getPaperRatio,
  type PaperSize,
  type PaperOrientation,
} from '@/configs/paperSizes'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useSlideTheme from '@/hooks/useSlideTheme'
import { getImageDataURL } from '@/utils/image'
import { toFixed } from '@/utils/common'
import { MM_TO_PX, PX_TO_MM } from '@/configs/units'
import { resolveMargins, getScaledMarginProps } from '@/modules/margins'

import ThemeStylesExtract from './ThemeStylesExtract.vue'
import ThemeColorsSetting from './ThemeColorsSetting.vue'
import ViewportSizeSetting from './ViewportSizeSetting.vue'
import MarginsSetting from './MarginsSetting.vue'
import SVGLine from '../common/SVGLine.vue'
import ColorButton from '@/components/ColorButton.vue'
import ColorListButton from '@/components/ColorListButton.vue'
import FileInput from '@/components/FileInput.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Divider from '@/components/Divider.vue'
import Slider from '@/components/Slider.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import Popover from '@/components/Popover.vue'
import SelectCustom from '@/components/SelectCustom.vue'
import NumberInput from '@/components/NumberInput.vue'
import Modal from '@/components/Modal.vue'
import GradientBar from '@/components/GradientBar.vue'

const slidesStore = useSlidesStore()
const { slides, currentSlide, slideIndex, viewportRatio, viewportSize, theme } = storeToRefs(slidesStore)

const moreThemeConfigsVisible = ref(false)
const themeStylesExtractVisible = ref(false)
const themeColorsSettingVisible = ref(false)
const customViewportSizeVisible = ref(false)
const marginsSettingVisible = ref(false)
const currentGradientIndex = ref(0)
const lineStyleOptions = ref<LineStyleType[]>(['solid', 'dashed', 'dotted'])

const background = computed(() => {
  if (!currentSlide.value.background) {
    return {
      type: 'solid',
      value: '#fff',
    } as SlideBackground
  }
  return currentSlide.value.background
})

const { addHistorySnapshot } = useHistorySnapshot()
const {
  applyPresetTheme,
  applyThemeToAllSlides,
  applyFontToAllSlides,
} = useSlideTheme()

watch(slideIndex, () => {
  currentGradientIndex.value = 0
})

// Aplicarfundomodo: cor sólida, Imagem, gradientecor
const updateBackgroundType = (type: SlideBackgroundType) => {
  if (type === 'solid') {
    const newBackground: SlideBackground = {
      ...background.value,
      type: 'solid',
      color: background.value.color || '#fff',
    }
    slidesStore.updateSlide({ background: newBackground })
  }
  else if (type === 'image') {
    const newBackground: SlideBackground = {
      ...background.value,
      type: 'image',
      image: background.value.image || {
        src: '',
        size: 'cover',
      },
    }
    slidesStore.updateSlide({ background: newBackground })
  }
  else {
    const newBackground: SlideBackground = {
      ...background.value,
      type: 'gradient',
      gradient: background.value.gradient || {
        type: 'linear',
        colors: [
          { pos: 0, color: '#fff' },
          { pos: 100, color: '#fff' },
        ],
        rotate: 0,
      },
    }
    currentGradientIndex.value = 0
    slidesStore.updateSlide({ background: newBackground })
  }
  addHistorySnapshot()
}

// Aplicarfundo
const updateBackground = (props: Partial<SlideBackground>) => {
  slidesStore.updateSlide({ background: { ...background.value, ...props } })
  addHistorySnapshot()
}

// Aplicargradientefundo
const updateGradientBackground = (props: Partial<Gradient>) => {
  updateBackground({ gradient: { ...background.value.gradient!, ...props } })
}
const updateGradientBackgroundColors = (color: string) => {
  const colors = background.value.gradient!.colors.map((item, index) => {
    if (index === currentGradientIndex.value) return { ...item, color }
    return item
  })
  updateGradientBackground({ colors })
}

// AplicarImagemfundo
const updateImageBackground = (props: Partial<SlideBackgroundImage>) => {
  updateBackground({ image: { ...background.value.image!, ...props } })
}

// enviar imagem de fundo
const uploadBackgroundImage = (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  getImageDataURL(imageFile).then(dataURL => updateImageBackground({ src: dataURL }))
}

// aplicarSlide atualfundoaté Todospágina
const applyBackgroundAllSlide = () => {
  const newSlides = slides.value.map(slide => {
    return {
      ...slide,
      background: currentSlide.value.background,
    }
  })
  slidesStore.setSlides(newSlides)
  addHistorySnapshot()
}

// AplicarTema
const updateTheme = (themeProps: Partial<SlideTheme>) => {
  slidesStore.setTheme(themeProps)
}

// --- Folha (A4 / A3) e orientação (retrato / paisagem) ---

// Detecta a combinação folha + orientação a partir do tamanho atual do canvas
const paperSize = computed<PaperSize | ''>(() => {
  for (const size of Object.keys(PAPER_SIZES_MM) as PaperSize[]) {
    for (const orientation of ['portrait', 'landscape'] as PaperOrientation[]) {
      const dim = getPaperDimensionsPx(size, orientation)
      if (viewportSize.value === dim.width && toFixed(viewportSize.value * viewportRatio.value) === toFixed(dim.height)) return size
    }
  }
  return ''
})

const paperOrientation = computed<PaperOrientation | ''>(() => {
  for (const size of Object.keys(PAPER_SIZES_MM) as PaperSize[]) {
    for (const orientation of ['portrait', 'landscape'] as PaperOrientation[]) {
      const dim = getPaperDimensionsPx(size, orientation)
      if (viewportSize.value === dim.width && toFixed(viewportSize.value * viewportRatio.value) === toFixed(dim.height)) return orientation
    }
  }
  return ''
})

// Lista de folhas disponíveis (A4 / A3)
const paperSizeOptions = (Object.keys(PAPER_SIZES_MM) as PaperSize[]).map(size => ({
  label: PAPER_SIZE_LABELS[size],
  value: size,
}))

// Lista separada de orientações (retrato / paisagem)
const paperOrientationOptions = (['portrait', 'landscape'] as PaperOrientation[]).map(orientation => ({
  label: PAPER_ORIENTATION_LABELS[orientation],
  value: orientation,
}))

/**
 * Escala as margens de trabalho de todos os slides proporcionalmente à
 * mudança de tamanho da folha/canvas: margens horizontais (L/R) escalam pela
 * variação da largura e verticais (T/B) pela altura, preservando a proporção
 * de cada margem em relação à folha (ex.: 7mm em A4 → ~9,9mm em A3).
 */
const scaleAllSlidesMargins = (oldWidth: number, oldHeight: number, newWidth: number, newHeight: number) => {
  const scaleX = newWidth / oldWidth
  const scaleY = newHeight / oldHeight
  const newSlides = slides.value.map(slide => ({
    ...slide,
    ...getScaledMarginProps(resolveMargins(slide), scaleX, scaleY),
  }))
  slidesStore.setSlides(newSlides)
}

// Aplica as dimensões da folha selecionada mantendo a orientação atual
const updatePaperSize = (size: PaperSize) => {
  const orientation: PaperOrientation = paperOrientation.value || 'portrait'
  const dim = getPaperDimensionsPx(size, orientation)
  const oldWidth = viewportSize.value
  const oldHeight = oldWidth * viewportRatio.value
  slidesStore.setViewportSize(dim.width)
  slidesStore.setViewportRatio(getPaperRatio(size, orientation))
  scaleAllSlidesMargins(oldWidth, oldHeight, dim.width, dim.height)
  addHistorySnapshot()
}

// Aplica a orientação selecionada mantendo a folha atual
const updatePaperOrientation = (orientation: PaperOrientation) => {
  const size: PaperSize = paperSize.value || 'A4'
  const dim = getPaperDimensionsPx(size, orientation)
  const oldWidth = viewportSize.value
  const oldHeight = oldWidth * viewportRatio.value
  slidesStore.setViewportSize(dim.width)
  slidesStore.setViewportRatio(getPaperRatio(size, orientation))
  scaleAllSlidesMargins(oldWidth, oldHeight, dim.width, dim.height)
  addHistorySnapshot()
}
</script>

<style lang="scss" scoped>
/*
  Painel de design — layout baseado em neurodesign / neurociência visual:

  1. CHUNKING (Gestalt): cada controle vira um bloco "rótulo em cima +
     alvo embaixo". O rótulo fica sempre mais perto do próprio controle do
     que de qualquer outro → elimina ambiguidade de leitura.
  2. FITT'S LAW: alvos de largura total (selects, cores, botões) => menos
     erro de clique e varredura ocular em linha única (sem saltos 40%/60%).
  3. SEM SOBREPOSIÇÃO: `white-space: nowrap` + alvo full-width impedem que
     o texto quebre para uma segunda linha e invada o bloco vizinho.
  4. HIERARQUIA: título de seção com marcador (âncora pré-atentiva),
     rótulos em nível secundário e texto de apoio com contraste WCAG AA.
  5. RITMO ESPACIAL: base de 4–10px entre pares e 24px entre grupos →
     a distância sinaliza pertencimento sem esforço deliberado.
*/
.slide-design-panel {
  user-select: none;
}

/* linha simples (elemento full-width, sem rótulo) */
.row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

/* bloco rótulo + controle: unidade mínima de decisão do painel */
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  margin-bottom: 10px;
}
.field-label {
  font-size: 12px;
  line-height: 1.3;
  color: $textSecondaryColor;
}

/* botão de ação: largura total, nunca quebra a linha */
.block-btn {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
}

/* ações do tema: empilhadas, mesmo tamanho e alinhamento */
.stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
}

/* cabeçalho de seção: marcador de cor = ponto de entrada visual do grupo */
.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: $textColor;
  letter-spacing: .2px;
  padding-left: 8px;
  border-left: 3px solid $themeColor;
  margin: 2px 0 12px;

  .more {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    font-size: 12px;
    font-weight: 400;
    color: $textSecondaryColor;
    padding: 2px 6px;
    border-radius: $borderRadiusSm;
    transition: color $transitionDelayFast $easeOutCubic,
                background-color $transitionDelayFast $easeOutCubic;

    &:hover {
      color: $themeColor;
      background-color: rgba($color: $themeColor, $alpha: .07);
    }

    .text {
      font-size: 12px;
      margin-right: 3px;
    }
  }
}

.background-image-wrapper {
  margin-bottom: 10px;
}
.background-image {
  height: 0;
  padding-bottom: 56.25%;
  border: 1px dashed $borderColor;
  border-radius: $borderRadius;
  position: relative;
  transition: all $transitionDelay;

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
  }

  .content {
    @include absolute-0();

    display: flex;
    justify-content: center;
    align-items: center;
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    cursor: pointer;
  }
}

/* leitura de estado (dado, não ação): superfície suave + números tabulares */
.canvas-size {
  width: 100%;
  padding: 7px 8px;
  background-color: $lightGray;
  border: 1px solid $borderColor;
  border-radius: $borderRadiusMd;
  color: $textSecondaryColor;
  font-size: 12px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* texto de apoio: contraste AA (substitui #999) e entrelinha confortável */
.tip-text {
  font-size: 12px;
  line-height: 1.5;
  color: $textSecondaryColor;
  margin: 0 0 4px;
}

.theme-list {
  @include flex-grid-layout();
}
.theme-item {
  @include flex-grid-layout-children(2, 48%);

  padding-bottom: 27%;
  border-radius: $borderRadiusMd;
  position: relative;
  cursor: pointer;
  /* elevação no hover: profundidade = "este item responde ao seu gesto" */
  transition: transform $transitionDelay $easeOutCubic,
              box-shadow $transitionDelay $easeOutCubic;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $boxShadow;
  }

  .theme-item-content {
    @include absolute-0();

    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 8px;
    border: 1px solid $borderColor;
    border-radius: $borderRadiusMd;
    overflow: hidden;
  }

  .text {
    font-size: 15px;
  }
  .colors {
    display: flex;
    margin-top: 6px;
  }
  .color-block {
    width: 12px;
    height: 12px;
    margin-right: 2px;
  }

  &:hover .btns {
    opacity: 1;
  }

  .btns {
    @include absolute-0();

    flex-direction: column;
    justify-content: center;
    align-items: center;
    display: flex;
    background-color: rgba($color: #000, $alpha: .25);
    opacity: 0;
    transition: opacity $transitionDelay;
  }
}
.option {
  height: 32px;
  padding: 0 5px;
  border-radius: $borderRadius;

  &:not(.selected):hover {
    background-color: rgba($color: $themeColor, $alpha: .05);
    cursor: pointer;
  }

  &.selected {
    color: $themeColor;
    font-weight: 700;
  }
}
</style>
