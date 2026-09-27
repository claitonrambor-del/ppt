import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useMainStore, useSlidesStore } from '@/store'
import { getImageSize } from '@/utils/image'
import type { PPTLineElement, PPTElement, TableCell, TableCellStyle, PPTShapeElement, ChartType } from '@/types/slides'
import { type ShapePoolItem, SHAPE_PATH_FORMULAS } from '@/configs/shapes'
import type { LinePoolItem } from '@/configs/lines'
import { CHART_DEFAULT_DATA } from '@/configs/chart'
import { resolveMargins, getWorkArea, fitBoxIntoWorkArea, fitLinePointsIntoWorkArea } from '@/modules/margins'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

interface CommonElementPosition {
  top: number
  left: number
  width: number
  height: number
}

interface LineElementPosition {
  top: number
  left: number
  start: [number, number]
  end: [number, number]
}

interface CreateTextData {
  content?: string
  vertical?: boolean
}

export default () => {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const { creatingElement } = storeToRefs(mainStore)
  const { theme, viewportRatio, viewportSize } = storeToRefs(slidesStore)

  const { addHistorySnapshot } = useHistorySnapshot()

  /**
   * Encaixa a posição inicial de um elemento dentro das margens de trabalho
   * (o novo elemento nunca nasce fora da área útil). Matemática delegada ao
   * módulo reutilizável `src/modules/margins`.
   */
  const fitInitialPositionToMargins = (position: { left: number; top: number; width?: number; height?: number; start?: [number, number]; end?: [number, number] }) => {
    const margins = resolveMargins(slidesStore.currentSlide)
    const area = getWorkArea(viewportSize.value, viewportSize.value * viewportRatio.value, margins)

    fitBoxIntoWorkArea(position, area)

    // Encaixa também as pontas da linha dentro da área útil
    if (position.start && position.end) fitLinePointsIntoWorkArea(position as { start: [number, number]; end: [number, number] }, area)

    return position as { left: number; top: number; width: number; height: number }
  }

  // criar (Inserir) um elemento e seu Aplicarser elemento selecionado
  const createElement = (element: PPTElement, callback?: () => void) => {
    slidesStore.addElement(element)
    mainStore.setActiveElementIdList([element.id])

    if (creatingElement.value) mainStore.setCreatingElement(null)

    setTimeout(() => {
      mainStore.setEditorareaFocus(true)
    }, 0)

    if (callback) callback()

    addHistorySnapshot()
  }

  /**
   * criarImagemelemento
   * @param src Imagemendereço
   */
  const createImageElement = (src: string) => {
    getImageSize(src).then(({ width, height }) => {
      const scale = height / width
  
      if (scale < viewportRatio.value && width > viewportSize.value) {
        width = viewportSize.value
        height = width * scale
      }
      else if (height > viewportSize.value * viewportRatio.value) {
        height = viewportSize.value * viewportRatio.value
        width = height / scale
      }

      createElement({
        type: 'image',
        id: nanoid(10),
        src,
        width,
        height,
        left: (viewportSize.value - width) / 2,
        top: (viewportSize.value * viewportRatio.value - height) / 2,
        fixedRatio: true,
        rotate: 0,
      })
    })
  }
  
  /**
   * criarGráficoelemento
   * @param chartType GráficoTipo
   */
  const createChartElement = (type: ChartType) => {
    createElement({
      type: 'chart',
      id: nanoid(10),
      chartType: type,
      left: 300,
      top: 81.25,
      width: 400,
      height: 400,
      rotate: 0,
      themeColors: theme.value.themeColors,
      textColor: theme.value.fontColor,
      data: CHART_DEFAULT_DATA[type],
    })
  }
  
  /**
   * criarTabelaelemento
   * @param row número de linhas
   * @param col número de colunas
   */
  const createTableElement = (row: number, col: number) => {
    const style: TableCellStyle = {
      fontname: theme.value.fontName,
      color: theme.value.fontColor,
    }
    const data: TableCell[][] = []
    for (let i = 0; i < row; i++) {
      const rowCells: TableCell[] = []
      for (let j = 0; j < col; j++) {
        rowCells.push({ id: nanoid(10), colspan: 1, rowspan: 1, text: '', style })
      }
      data.push(rowCells)
    }

    const DEFAULT_CELL_WIDTH = 100
    const DEFAULT_CELL_HEIGHT = 36

    const colWidths: number[] = new Array(col).fill(1 / col)

    const width = col * DEFAULT_CELL_WIDTH
    const height = row * DEFAULT_CELL_HEIGHT

    createElement({
      type: 'table',
      id: nanoid(10),
      width,
      height,
      colWidths,
      rotate: 0,
      data,
      left: (viewportSize.value - width) / 2,
      top: (viewportSize.value * viewportRatio.value - height) / 2,
      outline: {
        width: 2,
        style: 'solid',
        color: '#eeece1',
      },
      theme: {
        color: theme.value.themeColors[0],
        rowHeader: true,
        rowFooter: false,
        colHeader: false,
        colFooter: false,
      },
      cellMinHeight: 36,
    })
  }
  
  /**
   * criarTextoelemento
   * @param position PosiçãoGrandePequenoinformação
   * @param content TextoConteúdo
   */
  const createTextElement = (position: CommonElementPosition, data?: CreateTextData) => {
    const { left, top, width, height } = fitInitialPositionToMargins(position)
    const content = data?.content || ''
    const vertical = data?.vertical || false

    const id = nanoid(10)
    createElement({
      type: 'text',
      id,
      left, 
      top, 
      width, 
      height,
      content,
      rotate: 0,
      defaultFontName: theme.value.fontName,
      defaultColor: theme.value.fontColor,
      vertical,
    }, () => {
      setTimeout(() => {
        const editorRef: HTMLElement | null = document.querySelector(`#editable-element-${id} .ProseMirror`)
        if (editorRef) editorRef.focus()
      }, 0)
    })
  }
  
  /**
   * criarFormaelemento
   * @param position PosiçãoGrandePequenoinformação
   * @param data Formacaminhoinformação
   */
  const createShapeElement = (position: CommonElementPosition, data: ShapePoolItem, supplement: Partial<PPTShapeElement> = {}) => {
    const { left, top, width, height } = fitInitialPositionToMargins(position)
    const newElement: PPTShapeElement = {
      type: 'shape',
      id: nanoid(10),
      left, 
      top, 
      width, 
      height,
      viewBox: data.viewBox,
      path: data.path,
      fill: theme.value.themeColors[0],
      fixedRatio: false,
      rotate: 0,
      ...supplement,
    }
    if (data.withborder) newElement.outline = theme.value.outline
    if (data.special) newElement.special = true
    if (data.pathFormula) {
      newElement.pathFormula = data.pathFormula
      newElement.viewBox = [width, height]

      const pathFormula = SHAPE_PATH_FORMULAS[data.pathFormula]
      if ('editable' in pathFormula && pathFormula.editable) {
        newElement.path = pathFormula.formula(width, height, pathFormula.defaultValue!)
        newElement.keypoints = pathFormula.defaultValue
      }
      else newElement.path = pathFormula.formula(width, height)
    }
    createElement(newElement)
  }
  
  /**
   * criarLinhaelemento
   * @param position PosiçãoGrandePequenoinformação
   * @param data Linhado caminho e Estilo
   */
  const createLineElement = (position: LineElementPosition, data: LinePoolItem) => {
    const fitted = fitInitialPositionToMargins(position)
    const { left, top, start, end } = fitted as unknown as LineElementPosition

    const newElement: PPTLineElement = {
      type: 'line',
      id: nanoid(10),
      left, 
      top, 
      start,
      end,
      points: data.points,
      color: theme.value.themeColors[0],
      style: data.style,
      width: 2,
    }
    if (data.isBroken) newElement.broken = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
    if (data.isBroken2) newElement.broken2 = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
    if (data.isCurve) newElement.curve = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
    if (data.isCubic) newElement.cubic = [[(start[0] + end[0]) / 2, (start[1] + end[1]) / 2], [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]]
    createElement(newElement)
  }
  
  /**
   * criarLaTeXelemento
   * @param svg SVGcódigo
   */
  const createLatexElement = (data: { path: string; latex: string; w: number; h: number; }) => {
    createElement({
      type: 'latex',
      id: nanoid(10),
      width: data.w,
      height: data.h,
      rotate: 0,
      left: (viewportSize.value - data.w) / 2,
      top: (viewportSize.value * viewportRatio.value - data.h) / 2,
      path: data.path,
      latex: data.latex,
      color: theme.value.fontColor,
      strokeWidth: 2,
      viewBox: [data.w, data.h],
      fixedRatio: true,
    })
  }
  
  return {
    createImageElement,
    createChartElement,
    createTableElement,
    createTextElement,
    createShapeElement,
    createLineElement,
    createLatexElement,
  }
}