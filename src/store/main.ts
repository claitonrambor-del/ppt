import { customAlphabet } from 'nanoid'
import { defineStore } from 'pinia'
import { ToolbarStates } from '@/types/toolbar'
import type { CreatingElement, ShapeFormatPainter, TextFormatPainter } from '@/types/edit'
import type { DialogForExportTypes } from '@/types/export'
import { type TextAttrs, defaultRichTextAttrs } from '@/utils/prosemirror/utils'

import { useSlidesStore } from './slides'

export interface MainState {
  activeElementIdList: string[]
  handleElementId: string
  activeGroupElementId: string
  hiddenElementIdList: string[]
  canvasPercentage: number
  canvasScale: number
  canvasDragged: boolean
  thumbnailsFocus: boolean
  editorAreaFocus: boolean
  disableHotkeys: boolean
  gridLineSize: number
  showRuler: boolean
  showBubbleMenu: boolean
  creatingElement: CreatingElement | null
  creatingCustomShape: boolean
  toolbarState: ToolbarStates
  clipingImageElementId: string
  isScaling: boolean
  richTextAttrs: TextAttrs
  selectedTableCells: string[]
  selectedSlidesIndex: number[]
  dialogForExport: DialogForExportTypes
  databaseId: string
  textFormatPainter: TextFormatPainter | null
  shapeFormatPainter: ShapeFormatPainter | null
  showSelectPanel: boolean
  showSearchPanel: boolean
  showNotesPanel: boolean
  showSymbolPanel: boolean
  showMarkupPanel: boolean
  showImageLibPanel: boolean
  showAIPPTDialog: boolean | 'running'
  showMeasureRuler: boolean
  measureRulerMagnet: boolean
}

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
export const databaseId = nanoid(10)

export const useMainStore = defineStore('main', {
  state: (): MainState => ({
    activeElementIdList: [], // IDs dos elementos selecionados, incluindo handleElementId
    handleElementId: '', // ID do elemento em operação
    activeGroupElementId: '', // ID do membro do grupo selecionado para operação independente
    hiddenElementIdList: [], // IDs dos elementos ocultos
    canvasPercentage: 90, // percentual da área visível do canvas
    canvasScale: 1, // Escala do canvas (baseada na largura de {{slidesStore.viewportSize}} px)
    canvasDragged: false, // Canvas movido por arraste
    thumbnailsFocus: false, // Foco na área de miniaturas
    editorAreaFocus: false, //  Foco na área de edição
    disableHotkeys: false, // Atalhos desativados
    gridLineSize: 0, // Tamanho da grade (0 para ocultar)
    showRuler: false, // Mostrar régua
    showBubbleMenu: true, // Mostrar menu flutuante (toolbar dos elementos selecionados)
    creatingElement: null, // Informações do elemento sendo inserido, criado por desenho (texto, forma, linha)
    creatingCustomShape: false, // Desenhando polígono livre
    toolbarState: ToolbarStates.SLIDE_DESIGN, // Estado da barra lateral direita
    clipingImageElementId: '', // ID da imagem em recorte  
    richTextAttrs: defaultRichTextAttrs, // Estado do texto rico
    selectedTableCells: [], // Células de tabela selecionadas
    isScaling: false, // Redimensionamento de elemento em andamento
    selectedSlidesIndex: [], // Índices das páginas selecionadas
    dialogForExport: '', // painel de exportação
    databaseId, // ID do banco de dados indexedDB desta aplicação
    textFormatPainter: null, // Pincel de formato de texto
    shapeFormatPainter: null, // Pincel de formato de forma
    showSelectPanel: false, // Abrir painel de seleção
    showSearchPanel: false, // Abrir painel de localizar/substituir
    showNotesPanel: false, // Abrir painel de anotações
    showSymbolPanel: false, // Abrir painel de símbolos
    showMarkupPanel: false, // Abrir painel de marcação de tipo
    showImageLibPanel: false, // Abrir painel de biblioteca de imagens
    showAIPPTDialog: false, // Abrir janela de criação AIPPT
    showMeasureRuler: false, // Mostrar régua móvel de medição (300mm)
    measureRulerMagnet: true, // Imã de encaixe da régua móvel nas guias de margem
  }),

  getters: {
    activeElementList(state) {
      const slidesStore = useSlidesStore()
      const currentSlide = slidesStore.currentSlide
      if (!currentSlide || !currentSlide.elements) return []
      return currentSlide.elements.filter(element => state.activeElementIdList.includes(element.id))
    },
  
    handleElement(state) {
      const slidesStore = useSlidesStore()
      const currentSlide = slidesStore.currentSlide
      if (!currentSlide || !currentSlide.elements) return null
      return currentSlide.elements.find(element => state.handleElementId === element.id) || null
    },
  },

  actions: {
    setActiveElementIdList(activeElementIdList: string[]) {
      if (activeElementIdList.length === 1) this.handleElementId = activeElementIdList[0]
      else this.handleElementId = ''
      
      this.activeElementIdList = activeElementIdList
    },
    
    setHandleElementId(handleElementId: string) {
      this.handleElementId = handleElementId
    },
    
    setActiveGroupElementId(activeGroupElementId: string) {
      this.activeGroupElementId = activeGroupElementId
    },
    
    setHiddenElementIdList(hiddenElementIdList: string[]) {
      this.hiddenElementIdList = hiddenElementIdList
    },
  
    setCanvasPercentage(percentage: number) {
      this.canvasPercentage = percentage
    },
  
    setCanvasScale(scale: number) {
      this.canvasScale = scale
    },
  
    setCanvasDragged(isDragged: boolean) {
      this.canvasDragged = isDragged
    },
  
    setThumbnailsFocus(isFocus: boolean) {
      this.thumbnailsFocus = isFocus
    },
  
    setEditorareaFocus(isFocus: boolean) {
      this.editorAreaFocus = isFocus
    },
  
    setDisableHotkeysState(disable: boolean) {
      this.disableHotkeys = disable
    },
  
    setGridLineSize(size: number) {
      this.gridLineSize = size
    },
  
    setRulerState(show: boolean) {
      this.showRuler = show
    },

    setBubbleMenuState(show: boolean) {
      this.showBubbleMenu = show
    },
  
    setCreatingElement(element: CreatingElement | null) {
      this.creatingElement = element
    },
  
    setCreatingCustomShapeState(state: boolean) {
      this.creatingCustomShape = state
    },
  
    setToolbarState(toolbarState: ToolbarStates) {
      this.toolbarState = toolbarState
    },
  
    setClipingImageElementId(elId: string) {
      this.clipingImageElementId = elId
    },
  
    setRichtextAttrs(attrs: TextAttrs) {
      this.richTextAttrs = attrs
    },
  
    setSelectedTableCells(cells: string[]) {
      this.selectedTableCells = cells
    },
  
    setScalingState(isScaling: boolean) {
      this.isScaling = isScaling
    },
    
    updateSelectedSlidesIndex(selectedSlidesIndex: number[]) {
      this.selectedSlidesIndex = selectedSlidesIndex
    },

    setDialogForExport(type: DialogForExportTypes) {
      this.dialogForExport = type
    },

    setTextFormatPainter(textFormatPainter: TextFormatPainter | null) {
      this.textFormatPainter = textFormatPainter
    },

    setShapeFormatPainter(shapeFormatPainter: ShapeFormatPainter | null) {
      this.shapeFormatPainter = shapeFormatPainter
    },

    setSelectPanelState(show: boolean) {
      this.showSelectPanel = show
    },

    setSearchPanelState(show: boolean) {
      this.showSearchPanel = show
    },

    setNotesPanelState(show: boolean) {
      this.showNotesPanel = show
    },

    setSymbolPanelState(show: boolean) {
      this.showSymbolPanel = show
    },

    setMarkupPanelState(show: boolean) {
      this.showMarkupPanel = show
    },

    setImageLibPanelState(show: boolean) {
      this.showImageLibPanel = show
    },

    setAIPPTDialogState(show: boolean | 'running') {
      this.showAIPPTDialog = show
    },

    setMeasureRulerState(show: boolean) {
      this.showMeasureRuler = show
    },

    setMeasureRulerMagnet(value: boolean) {
      this.measureRulerMagnet = value
    },
  },
})
