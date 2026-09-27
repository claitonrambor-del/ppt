<template>
  <div class="canvas-tool">
    <div class="left-handler">
      <span class="handler-item" :class="{ 'disable': !canUndo }" v-tooltip="'Desfazer (Ctrl + Z)'" @click="undo()">
        <i-icon-park-outline:back />
      </span>
      <span class="handler-item" :class="{ 'disable': !canRedo }" v-tooltip="'Refazer (Ctrl + Y)'" @click="redo()">
        <i-icon-park-outline:next />
      </span>
      <div class="more">
        <Divider type="vertical" style="height: 20px;" />
        <Popover class="more-icon" trigger="click" v-model:value="moreVisible" :offset="10">
          <template #content>
            <PopoverMenuItem class="popover-menu-item" center @click="toggleNotesPanel(); moreVisible = false"><i-icon-park-outline:comment class="icon" />Painel de anotações</PopoverMenuItem>
            <PopoverMenuItem class="popover-menu-item" center @click="toggleSelectPanel(); moreVisible = false"><i-icon-park-outline:move-one class="icon" />Painel de seleção</PopoverMenuItem>
            <PopoverMenuItem class="popover-menu-item" center @click="toggleSraechPanel(); moreVisible = false"><i-icon-park-outline:search class="icon" />Localizar e substituir</PopoverMenuItem>
          </template>
          <span class="handler-item">
            <i-icon-park-outline:more />
          </span>
        </Popover>
        <span class="handler-item" :class="{ 'active': showNotesPanel }" v-tooltip="'Painel de anotações'" @click="toggleNotesPanel()">
          <i-icon-park-outline:comment />
        </span>
        <span class="handler-item" :class="{ 'active': showSelectPanel }" v-tooltip="'Painel de seleção'" @click="toggleSelectPanel()">
          <i-icon-park-outline:move-one />
        </span>
        <span class="handler-item" :class="{ 'active': showSearchPanel }" v-tooltip="'Localizar/substituir (Ctrl + F)'" @click="toggleSraechPanel()">
          <i-icon-park-outline:search />
        </span>
      </div>
    </div>

    <div class="add-element-handler">
      <div class="insert-handler-item group-btn" :class="{ 'active': creatingElement?.type === 'text' }" v-tooltip="'Inserir texto'">
        <div class="group-btn-main" @click="drawText()"><i-icon-park-outline:font-size class="icon" /> <span class="text">Caixa de texto</span></div>
        
        <Popover trigger="click" v-model:value="textTypeSelectVisible" style="height: 100%;" :offset="10">
          <template #content>
            <PopoverMenuItem center @click="() => { drawText(); textTypeSelectVisible = false }"><i-icon-park-outline:text-rotation-none class="icon" /> Caixa de texto horizontal</PopoverMenuItem>
            <PopoverMenuItem center @click="() => { drawText(true); textTypeSelectVisible = false }"><i-icon-park-outline:text-rotation-down class="icon" /> Caixa de texto vertical</PopoverMenuItem>
          </template>
          <span class="arrow"><i-icon-park-outline:down /></span>
        </Popover>
      </div>
      <!-- Inserir logo do sistema ou emoji (lista suspensa LOGO / Emoji) -->
      <Popover trigger="click" v-model:value="insertAssetVisible" :offset="10">
        <template #content>
          <InsertAssetMenu @close="insertAssetVisible = false" />
        </template>
        <div class="insert-handler-item" v-tooltip="'Inserir logo ou emoji'">
          <i-icon-park-outline:game-emoji class="icon" /> <span class="text">LOGO / Emoji</span>
        </div>
      </Popover>

      <div class="insert-handler-item group-btn" :class="{ 'active': creatingCustomShape || creatingElement?.type === 'shape' }" v-tooltip="'Inserir forma'" :offset="10">
        <Popover trigger="click" style="height: 100%;" v-model:value="shapePoolVisible" :offset="10">
          <template #content>
            <ShapePool @select="shape => drawShape(shape)" />
          </template>
          <div class="group-btn-main"><i-icon-park-outline:graphic-design class="icon" /> <span class="text">Forma</span></div>
        </Popover>
        
        <Popover trigger="click" v-model:value="shapeMenuVisible" style="height: 100%;" :offset="10">
          <template #content>
            <PopoverMenuItem center @click="shapeMenuVisible = false; shapePoolVisible = true"><i-icon-park-outline:graphic-design class="icon" />Formas predefinidas</PopoverMenuItem>
            <PopoverMenuItem center @click="() => { shapeSizeDialogVisible = true; shapeMenuVisible = false }"><i-icon-park-outline:ruler class="icon" />Com tamanho (mm)</PopoverMenuItem>
            <PopoverMenuItem center @click="() => { svgPathEditorVisible = true; shapeMenuVisible = false }"><i-icon-park-outline:connection class="icon" />Desenho de caminho</PopoverMenuItem>
            <PopoverMenuItem center @click="() => { drawCustomShape(); shapeMenuVisible = false }"><i-icon-park-outline:writing-fluently class="icon" />Desenho livre</PopoverMenuItem>
          </template>
          <span class="arrow"><i-icon-park-outline:down /></span>
        </Popover>
      </div>
      <div class="insert-handler-item group-btn" v-tooltip="'Inserir imagem'">
        <FileInput style="height: 100%;" @change="files => insertImageElement(files)">
          <div class="group-btn-main"><i-icon-park-outline:picture class="icon" /> <span class="text">Imagem</span></div>
        </FileInput>
        
        <Popover trigger="click" v-model:value="imageMenuVisible" style="height: 100%;" :offset="10">
          <template #content>
            <FileInput @change="files => { insertImageElement(files); imageMenuVisible = false }">
              <PopoverMenuItem center><i-icon-park-outline:upload class="icon" /> Enviar imagem</PopoverMenuItem>
            </FileInput>
            <PopoverMenuItem center @click="openImageLibPanel(); imageMenuVisible = false"><i-icon-park-outline:picture class="icon" /> Biblioteca online</PopoverMenuItem>
          </template>
          <span class="arrow"><i-icon-park-outline:down /></span>
        </Popover>
      </div>
      <Popover trigger="click" v-model:value="linePoolVisible" :offset="10">
        <template #content>
          <LinePool @select="line => drawLine(line)" />
        </template>
        <div class="insert-handler-item" :class="{ 'active': creatingElement?.type === 'line' }" v-tooltip="'Inserir linha'">
          <i-icon-park-outline:connection class="icon" /> <span class="text">Linha</span>
        </div>
      </Popover>
      <Popover trigger="click" v-model:value="chartPoolVisible" :offset="10">
        <template #content>
          <ChartPool @select="chart => { createChartElement(chart); chartPoolVisible = false }" />
        </template>
        <div class="insert-handler-item" v-tooltip="'Inserir gráfico'">
          <i-icon-park-outline:chart-proportion class="icon" /> <span class="text">Gráfico</span>
        </div>
      </Popover>
      <Popover trigger="click" v-model:value="tableGeneratorVisible" :offset="10">
        <template #content>
          <TableGenerator
            @close="tableGeneratorVisible = false"
            @insert="({ row, col }) => { createTableElement(row, col); tableGeneratorVisible = false }"
          />
        </template>
        <div class="insert-handler-item" v-tooltip="'Inserir tabela'">
          <i-icon-park-outline:insert-table class="icon" /> <span class="text">Tabela</span>
        </div>
      </Popover>
      <div class="insert-handler-item" v-tooltip="'Inserir fórmula'" @click="latexEditorVisible = true">
        <i-icon-park-outline:formula class="icon" /> <span class="text">Fórmula</span>
      </div>
      <div class="insert-handler-item" :class="{ 'active': showSymbolPanel }" v-tooltip="'Inserir símbolo'" @click="toggleSymbolPanel()">
        <i-icon-park-outline:symbol class="icon" /> <span class="text">Símbolos</span>
      </div>
    </div>

    <div class="right-handler">
      <span class="handler-item viewport-size" v-tooltip="'Reduzir canvas (Ctrl + -)'" @click="scaleCanvas('-')">
        <i-icon-park-outline:minus />
      </span>
      <Popover trigger="click" v-model:value="canvasScaleVisible">
        <template #content>
          <PopoverMenuItem
            center
            v-for="item in canvasScalePresetList" 
            :key="item" 
            @click="applyCanvasPresetScale(item)"
          >{{item}}%</PopoverMenuItem>
          <PopoverMenuItem center @click="resetCanvas(); canvasScaleVisible = false">Ajustar à tela</PopoverMenuItem>
        </template>
        <span class="text">{{ canvasScalePercentage }}</span>
      </Popover>
      <span class="handler-item viewport-size" v-tooltip="'Ampliar canvas (Ctrl + =)'" @click="scaleCanvas('+')">
        <i-icon-park-outline:plus />
      </span>
      <span class="handler-item viewport-size-adaptation" v-tooltip="'Ajustar à tela (Ctrl + 0)'" @click="resetCanvas()">
        <i-icon-park-outline:full-screen />
      </span>
      <span class="handler-item" :class="{ 'active': showMeasureRuler }" v-tooltip="'Régua de medição móvel (300mm)'" @click="toggleMeasureRuler()">
        <i-icon-park-outline:ruler />
      </span>
    </div>

    <Modal
      v-model:visible="latexEditorVisible" 
      :width="880"
    >
      <LaTeXEditor 
        @close="latexEditorVisible = false"
        @update="data => { createLatexElement(data); latexEditorVisible = false }"
      />
    </Modal>

    <Modal
      v-model:visible="svgPathEditorVisible"
      :width="800"
    >
      <SVGPathEditor
        @close="svgPathEditorVisible = false"
        @insert="path => insertSvgPath(path)"
      />
    </Modal>

    <!-- Inserir forma com tamanho exato em milímetros -->
    <Modal
      v-model:visible="shapeSizeDialogVisible"
      :width="520"
      closeButton
    >
      <ShapeSizeDialog @close="shapeSizeDialogVisible = false" />
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore, useSnapshotStore } from '@/store'
import { getImageDataURL } from '@/utils/image'
import type { ShapePoolItem } from '@/configs/shapes'
import type { LinePoolItem } from '@/configs/lines'
import type { PPTShapeElement } from '@/types/slides'
import useScaleCanvas from '@/hooks/useScaleCanvas'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useCreateElement from '@/hooks/useCreateElement'

import ShapePool from './ShapePool.vue'
import ShapeSizeDialog from './ShapeSizeDialog.vue'
import InsertAssetMenu from '../Canvas/ElementFloatLayer/FloatingToolbar/InsertAssetButton.vue'
import LinePool from './LinePool.vue'
import ChartPool from './ChartPool.vue'
import TableGenerator from './TableGenerator.vue'
import SVGPathEditor from './SVGPathEditor.vue'
import LaTeXEditor from '@/components/LaTeXEditor/index.vue'
import FileInput from '@/components/FileInput.vue'
import Modal from '@/components/Modal.vue'
import Divider from '@/components/Divider.vue'
import Popover from '@/components/Popover.vue'
import PopoverMenuItem from '@/components/PopoverMenuItem.vue'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { creatingElement, creatingCustomShape, showSelectPanel, showSearchPanel, showNotesPanel, showSymbolPanel, showMeasureRuler } = storeToRefs(mainStore)
const { canUndo, canRedo } = storeToRefs(useSnapshotStore())
const { theme, viewportRatio, viewportSize } = storeToRefs(slidesStore)

const { redo, undo } = useHistorySnapshot()

// régua móvel de medição (300mm)
const toggleMeasureRuler = () => {
  mainStore.setMeasureRulerState(!showMeasureRuler.value)
}

const {
  scaleCanvas,
  setCanvasScalePercentage,
  resetCanvas,
  canvasScalePercentage,
} = useScaleCanvas()

const canvasScalePresetList = [200, 150, 125, 100, 75, 50]
const canvasScaleVisible = ref(false)

const applyCanvasPresetScale = (value: number) => {
  setCanvasScalePercentage(value)
  canvasScaleVisible.value = false
}

const {
  createImageElement,
  createChartElement,
  createTableElement,
  createLatexElement,
  createShapeElement,
} = useCreateElement()

const insertImageElement = (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  getImageDataURL(imageFile).then(dataURL => createImageElement(dataURL))
}

const shapePoolVisible = ref(false)
const shapeSizeDialogVisible = ref(false)
const linePoolVisible = ref(false)
const chartPoolVisible = ref(false)
const tableGeneratorVisible = ref(false)
const latexEditorVisible = ref(false)
const insertAssetVisible = ref(false)
const svgPathEditorVisible = ref(false)
const textTypeSelectVisible = ref(false)
const shapeMenuVisible = ref(false)
const imageMenuVisible = ref(false)
const moreVisible = ref(false)

// desenhartextofaixa
const drawText = (vertical = false) => {
  mainStore.setCreatingElement({
    type: 'text',
    vertical,
  })
}

// desenharFormafaixa
const drawShape = (shape: ShapePoolItem) => {
  mainStore.setCreatingElement({
    type: 'shape',
    data: shape,
  })
  shapePoolVisible.value = false
}
// desenharPersonalizadolivrepolígono
const drawCustomShape = () => {
  mainStore.setCreatingCustomShapeState(true)
  shapePoolVisible.value = false
}
// conforme caminhoInserir forma
const insertSvgPath = (path: string) => {
  const width = 400
  const height = 400
  const isClosedPath = /z\s*$/i.test(path)
  const position = {
    width,
    height,
    left: (viewportSize.value - width) / 2,
    top: (viewportSize.value * viewportRatio.value - height) / 2,
  }
  const supplement: Partial<PPTShapeElement> = isClosedPath
    ? { fill: theme.value.themeColors[0] }
    : {
      fill: 'rgba(0, 0, 0, 0)',
      outline: {
        width: 2,
        color: theme.value.themeColors[0],
        style: 'solid',
      },
    }

  createShapeElement(position, {
    path,
    viewBox: [width, height],
  }, supplement)
  svgPathEditorVisible.value = false
}

// desenharLinhacaminho
const drawLine = (line: LinePoolItem) => {
  mainStore.setCreatingElement({
    type: 'line',
    data: line,
  })
  linePoolVisible.value = false
}

// Abrir painel de seleção
const toggleSelectPanel = () => {
  mainStore.setSelectPanelState(!showSelectPanel.value)
}

// Abrir localizar/substituirpainel
const toggleSraechPanel = () => {
  mainStore.setSearchPanelState(!showSearchPanel.value)
}

// Abrir painel de anotações
const toggleNotesPanel = () => {
  mainStore.setNotesPanelState(!showNotesPanel.value)
}

// Abrir painel de símbolos
const toggleSymbolPanel = () => {
  mainStore.setSymbolPanelState(!showSymbolPanel.value)
}

// abrLigadobiblioteca de imagenspainel
const openImageLibPanel = () => {
  mainStore.setImageLibPanelState(true)
}
</script>

<style lang="scss" scoped>
.canvas-tool {
  position: relative;
  border-bottom: 1px solid $borderColor;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  font-size: 13px;
  user-select: none;
}
.left-handler, .more {
  display: flex;
  align-items: center;
}
.more-icon {
  display: none;
}
.popover-menu-item {
  display: flex;
  padding: 8px 10px;

  &.center {
    justify-content: center;
  }

  .icon {
    font-size: 18px;
    margin-right: 8px;
  }
}
.add-element-handler {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;

  & > div {
    flex-shrink: 0;
  }

  .insert-handler-item {
    height: 30px;
    font-size: 14px;
    margin: 0 2px;
    padding: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: $borderRadius;
    overflow: hidden;
    cursor: pointer;

    &:not(.group-btn):hover {
      background-color: #f1f1f1;
    }

    &.active {
      background-color: #f1f1f1;
    }

    .icon {
      margin-right: 4px;
    }

    &.group-btn {
      margin-right: 6px;
      padding: 0;

      &:hover {
        background-color: #f3f3f3;
      }

      .group-btn-main {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 5px;

        &:hover {
          background-color: #e9e9e9;
        }
      }

      .arrow {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 12px;
        padding: 0 1px;
  
        &:hover {
          background-color: #e9e9e9;
        }
      }
    }
  }
}
.handler-item {
  height: 30px;
  font-size: 14px;
  margin: 0 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: $borderRadius;
  overflow: hidden;
  cursor: pointer;

  &.disable {
    opacity: .5;
  }
}
.left-handler, .right-handler {
  .handler-item {
    padding: 0 8px;

    &.active,
    &:not(.disable):hover {
      background-color: #f1f1f1;
    }
  }
}
.right-handler {
  display: flex;
  align-items: center;

  .text {
    display: inline-block;
    width: 40px;
    text-align: center;
    cursor: pointer;
  }

  .viewport-size {
    font-size: 13px;
  }
}

@media screen and (width <= 1600px) {
  .add-element-handler {
    .insert-handler-item {
      .icon {
        margin-right: 0;
      }
      .text {
        display: none;
      }
    }
  }
}
@media screen and (width <= 1366px) {
  .add-element-handler {
    .insert-handler-item {
      padding: 0 6px;
    }
  }
}
@media screen and (width <= 1200px) {
  .right-handler .text {
    display: none;
  }
  .more > .handler-item {
    display: none;
  }
  .more-icon {
    display: block;
  }
}
@media screen and (width <= 1000px) {
  .left-handler, .right-handler {
    display: none;
  }
}
</style>