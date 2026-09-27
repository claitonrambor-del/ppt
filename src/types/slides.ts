export const enum ShapePathFormulasKeys {
  ROUND_RECT = 'roundRect',
  ROUND_RECT_DIAGONAL = 'roundRectDiagonal',
  ROUND_RECT_SINGLE = 'roundRectSingle',
  ROUND_RECT_SAMESIDE = 'roundRectSameSide',
  CUT_RECT_DIAGONAL = 'cutRectDiagonal',
  CUT_RECT_SINGLE = 'cutRectSingle',
  CUT_RECT_SAMESIDE = 'cutRectSameSide',
  CUT_ROUND_RECT = 'cutRoundRect',
  MESSAGE = 'message',
  ROUND_MESSAGE = 'roundMessage',
  L = 'L',
  RING_RECT = 'ringRect',
  PLUS = 'plus',
  TRIANGLE = 'triangle',
  PARALLELOGRAM_LEFT = 'parallelogramLeft',
  PARALLELOGRAM_RIGHT = 'parallelogramRight',
  TRAPEZOID = 'trapezoid',
  BULLET = 'bullet',
  INDICATOR = 'indicator',
  DONUT = 'donut',
  DIAGSTRIPE = 'diagStripe',
}

export const enum ElementTypes {
  TEXT = 'text',
  IMAGE = 'image',
  SHAPE = 'shape',
  LINE = 'line',
  CHART = 'chart',
  TABLE = 'table',
  LATEX = 'latex',
}

/**
 * gradiente
 * 
 * type: tipo de gradiente (radial ou linear)
 * 
 * colors: gradienteCorlista（pos: porcentagemPosição；color: Cor）
 * 
 * rotate: ângulo do gradiente（Gradiente linear）
 */
export type GradientType = 'linear' | 'radial'
export type GradientColor = {
  pos: number
  color: string
}
export interface Gradient {
  type: GradientType
  colors: GradientColor[]
  rotate: number
}

export type LineStyleType = 'solid' | 'dashed' | 'dotted'

/**
 * elementoSombra
 * 
 * h: Horizontaldeslocamento
 * 
 * v: Verticaldeslocamento
 * 
 * blur: intensidade do desfoque
 * 
 * color: SombraCor
 */
export interface PPTElementShadow {
  h: number
  v: number
  blur: number
  color: string
}

/**
 * elementoBorda
 * 
 * style?: BordaEstilo（sólido outracejado）
 * 
 * width?: Bordalargura
 * 
 * color?: BordaCor
 */
export interface PPTElementOutline {
  style?: LineStyleType
  width?: number
  color?: string
}

export type ElementLinkType = 'web' | 'slide'

/**
 * elementohiperlink
 * 
 * type: linkTipo（página web、Página do slide）
 * 
 * target: alvoendereço (Link da web, Página do slideID) 
 */
export interface PPTElementLink {
  type: ElementLinkType
  target: string
}

export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export type TextAlignVertical = 'top' | 'middle' | 'bottom' 


/**
 * elementoGeralpropriedade
 * 
 * id: ID do elemento
 * 
 * left: elementoHorizontaldireçãoPosição (distânciacanvasesquerda) 
 * 
 * top: elementoVerticaldireçãoPosição (distânciacanvastopo) 
 * 
 * lock?: Bloquearelemento
 * 
 * groupId?: ID do grupo (elementos com o mesmo ID pertencem ao mesmo grupo)
 * 
 * width: elementolargura
 * 
 * height: elementoaltura
 * 
 * rotate: Rotaçãoângulo
 * 
 * link?: hiperlink
 * 
 * name?: nome do elemento
 */
interface PPTBaseElement {
  id: string
  left: number
  top: number
  lock?: boolean
  groupId?: string
  width: number
  height: number
  rotate: number
  link?: PPTElementLink
  name?: string
}


export type TextType = 'title' | 'subtitle' | 'content' | 'item' | 'itemTitle' | 'notes' | 'header' | 'footer' | 'partNumber' | 'itemNumber'
export type TextInset = [number, number, number, number]

/**
 * Textoelemento
 * 
 * type: elementoTipo（text）
 * 
 * content: TextoConteúdo（HTMLstring）
 * 
 * defaultFontName: Fonte padrão (será TextoConteúdoMédiodo HTMLinlineEstilosubstituir) 
 * 
 * defaultColor: padrãoCor (será TextoConteúdoMédiodo HTMLinlineEstilosubstituir) 
 * 
 * outline?: Borda
 * 
 * fill?: Preenchimentocor
 * 
 * lineHeight?: Altura da linha（x），padrão1.5
 * 
 * wordSpace?: espaçamento entre letras，padrão0
 * 
 * opacity?: Opacidade，padrão1
 * 
 * shadow?: Sombra
 * 
 * paragraphSpace?: espaço entre parágrafos, padrão 5px
 * 
 * vertical?: texto na vertical
 * 
 * textType?: TextoTipo
 * 
 * inset?: espaçamento interno (topo, direita, base, esquerda), padrão [10, 10, 10, 10]
 *
 * fixedHeight?: eixo fixo da caixa de texto; horizontal fixa a altura, vertical fixa a largura
 *
 * vAlign?: alinhamento vertical dentro da caixa; válido apenas com fixedHeight, padrão top
 */
export interface PPTTextElement extends PPTBaseElement {
  type: 'text'
  content: string
  defaultFontName: string
  defaultColor: string
  outline?: PPTElementOutline
  fill?: string
  lineHeight?: number
  wordSpace?: number
  opacity?: number
  shadow?: PPTElementShadow
  paragraphSpace?: number
  vertical?: boolean
  textType?: TextType
  inset?: TextInset
  fixedHeight?: boolean
  vAlign?: TextAlignVertical
}


/**
 * ImagemEspelhar、FormaEspelhar
 * 
 * flipH?: Espelhar horizontalmente
 * 
 * flipV?: Espelhar verticalmente
 */
export interface ImageOrShapeFlip {
  flipH?: boolean
  flipV?: boolean
}

/**
 * Imagemfiltro
 * 
 * https://developer.mozilla.org/zh-CN/docs/Web/CSS/filter
 * 
 * 'blur'?: desfoque，padrão0（px）
 * 
 * 'brightness'?: brilho，padrão100（%）
 * 
 * 'contrast'?: contraste，padrão100（%）
 * 
 * 'grayscale'?: nível de cinza，padrão0（%）
 * 
 * 'saturate'?: saturação，padrão100（%）
 * 
 * 'hue-rotate'?: matizRotação，padrão0（deg）
 * 
 * 'opacity'?: Opacidade，padrão100（%）
 */
export type ImageElementFilterKeys = 'blur' | 'brightness' | 'contrast' | 'grayscale' | 'saturate' | 'hue-rotate' | 'opacity' | 'sepia' | 'invert'
export interface ImageElementFilters {
  'blur'?: string
  'brightness'?: string
  'contrast'?: string
  'grayscale'?: string
  'saturate'?: string
  'hue-rotate'?: string
  'sepia'?: string
  'invert'?: string
  'opacity'?: string
}

export type ImageClipDataRange = [[number, number], [number, number]]

/**
 * ImagemRecortar
 * 
 * range: faixa do recorte; ex.: [[10, 10], [90, 90]] recorta de 10%,10% a 90%,90% da imagem original
 * 
 * shape: forma do recorte; ver configs/imageClip.ts CLIPPATHS
 */
export interface ImageElementClip {
  range: ImageClipDataRange
  shape: string
}

export type ImageType = 'pageFigure' | 'itemFigure' | 'background'

/**
 * Imagemelemento
 * 
 * type: elementoTipo（image）
 * 
 * fixedRatio: fixoImagemlargura/alturaproporção
 * 
 * src: Imagemendereço
 * 
 * outline?: Borda
 * 
 * filters?: Imagemfiltro
 * 
 * clip?: Recortarinformação
 * 
 * flipH?: Espelhar horizontalmente
 * 
 * flipV?: Espelhar verticalmente
 * 
 * shadow?: Sombra
 * 
 * radius?: raio do canto
 * 
 * colorMask?: Cormáscara
 * 
 * imageType?: ImagemTipo
 */
export interface PPTImageElement extends PPTBaseElement {
  type: 'image'
  fixedRatio: boolean
  src: string
  outline?: PPTElementOutline
  filters?: ImageElementFilters
  clip?: ImageElementClip
  flipH?: boolean
  flipV?: boolean
  shadow?: PPTElementShadow
  radius?: number
  colorMask?: string
  imageType?: ImageType
}

/**
 * FormadentroTexto
 * 
 * content: TextoConteúdo（HTMLstring）
 * 
 * defaultFontName: Fonte padrão (será TextoConteúdoMédiodo HTMLinlineEstilosubstituir) 
 * 
 * defaultColor: padrãoCor (será TextoConteúdoMédiodo HTMLinlineEstilosubstituir) 
 * 
 * align: TextoAlinhardireção（Verticaldireção）
 * 
 * lineHeight?: Altura da linha（x），padrão1.5
 * 
 * wordSpace?: espaçamento entre letras，padrão0
 * 
 * paragraphSpace?: espaço entre parágrafos, padrão 5px
 * 
 * type: TextoTipo
 * 
 * inset?: espaçamento interno do texto (topo, direita, base, esquerda), padrão [10, 10, 10, 10]
 */
export interface ShapeText {
  content: string
  defaultFontName: string
  defaultColor: string
  align: TextAlignVertical
  lineHeight?: number
  wordSpace?: number
  paragraphSpace?: number
  inset?: TextInset
  type?: TextType
}

/**
 * Formaelemento
 * 
 * type: elementoTipo（shape）
 * 
 * viewBox: atributo viewBox do SVG; ex.: [1000, 1000] equivale a '0 0 1000 1000'
 * 
 * path: Formacaminho, SVG path do  d propriedade
 * 
 * fixedRatio: fixoFormalargura/alturaproporção
 * 
 * fill: preenchimento; usado quando não há gradiente
 * 
 * gradient?: gradiente, este propriedadeexistequando prioridadecomo Preenchimento
 * 
 * pattern?: padrão; quando presente tem prioridade como preenchimento
 * 
 * outline?: Borda
 * 
 * opacity?: Opacidade
 * 
 * flipH?: Espelhar horizontalmente
 * 
 * flipV?: Espelhar verticalmente
 * 
 * shadow?: Sombra
 * 
 * special?: forma especial (marca formas difíceis de interpretar, ex.: caminhos com tipos além de L Q C A; na exportação viram imagem)
 * 
 * text?: FormadentroTexto
 * 
 * pathFormula?: Formacaminhocalcularfórmula
 * normalmente, ao redimensionar uma forma, apenas a escala de largura/altura com base no viewBox é ajustada; o viewBox e o path em si não mudam,
 * mas algumas formas precisam de controle mais preciso de pontos-chave; nesses casos é necessário fornecer uma fórmula de cálculo do caminho, atualizando o viewBox ao redimensionar e recalculando o path para redesenhar a forma
 * 
 * keypoints?: DesligadoteclaPontoPosiçãoporcentagem
 */
export interface PPTShapeElement extends PPTBaseElement {
  type: 'shape'
  viewBox: [number, number]
  path: string
  fixedRatio: boolean
  fill: string
  gradient?: Gradient
  pattern?: string
  outline?: PPTElementOutline
  opacity?: number
  flipH?: boolean
  flipV?: boolean
  shadow?: PPTElementShadow
  special?: boolean
  text?: ShapeText
  pathFormula?: ShapePathFormulasKeys
  keypoints?: number[]
}


export type LinePoint = '' | 'arrow' | 'dot' 
export type Broken2LineDirection = 'horizontal' | 'vertical'

/**
 * Linhaelemento
 * 
 * type: elementoTipo（line）
 * 
 * start: inícioPontoPosição ([x, y]) 
 * 
 * end: finalPontoPosição ([x, y]) 
 * 
 * style: LinhaEstilo (sólido, tracejado, Pontolinha) 
 * 
 * color: LinhaCor
 * 
 * points: estilos das pontas ([início, fim]; opções: nenhuma, seta, ponto)
 * 
 * shadow?: Sombra
 * 
 * broken?: posição do ponto de controle da polilinha ([x, y])
 * 
 * broken2?: posição do ponto de controle da polilinha dupla ([x, y])
 * 
 * broken2Direction?: duplopolilinhadireção
 * 
 * curve?: posição do ponto de controle da curva quadrática ([x, y])
 * 
 * cubic?: pontos de controle da curva cúbica ([[x1, y1], [x2, y2]])
 */
export interface PPTLineElement extends Omit<PPTBaseElement, 'height' | 'rotate'> {
  type: 'line'
  start: [number, number]
  end: [number, number]
  style: LineStyleType
  color: string
  points: [LinePoint, LinePoint]
  shadow?: PPTElementShadow
  broken?: [number, number]
  broken2?: [number, number]
  broken2Direction?: Broken2LineDirection
  curve?: [number, number]
  cubic?: [[number, number], [number, number]]
}


export type ChartType = 'bar' | 'column' | 'line' | 'pie' | 'ring' | 'area' | 'radar' | 'scatter'

export interface ChartOptions {
  lineSmooth?: boolean
  stack?: boolean
}

export interface ChartData {
  labels: string[]
  legends: string[]
  series: number[][]
}

/**
 * Gráficoelemento
 * 
 * type: elementoTipo（chart）
 * 
 * fill?: Preenchimentocor
 * 
 * chartType: tipo base do gráfico (bar/line/pie); todos os demais tipos derivam destes
 * 
 * data: Gráficodados
 * 
 * options: opções avançadas
 * 
 * outline?: Borda
 * 
 * themeColors: Temacor
 * 
 * textColor?: Coordenadas e Cor do texto
 * 
 * lineColor?: gradeCor
 */
export interface PPTChartElement extends PPTBaseElement {
  type: 'chart'
  fill?: string
  chartType: ChartType
  data: ChartData
  options?: ChartOptions
  outline?: PPTElementOutline
  themeColors: string[]
  textColor?: string
  lineColor?: string
}


/**
 * TabelacélulaEstilo
 * 
 * bold?: Negrito
 * 
 * em?: Itálico
 * 
 * underline?: Sublinhado
 * 
 * strikethrough?: Tachado
 * 
 * color?: FonteCor
 * 
 * backcolor?: Preenchimentocor
 * 
 * fontsize?: FonteGrandePequeno
 * 
 * fontname?: Fonte
 * 
 * align?: Alinharmodo
 */
export interface TableCellStyle {
  bold?: boolean
  em?: boolean
  underline?: boolean
  strikethrough?: boolean
  color?: string
  backcolor?: string
  fontsize?: string
  fontname?: string
  align?: TextAlign
  vAlign?: TextAlignVertical
}


/**
 * Tabelacélula
 * 
 * id: célulaID
 * 
 * colspan: mesclarnúmero de colunas
 * 
 * rowspan: mesclarnúmero de linhas
 * 
 * text: textoConteúdo
 * 
 * style?: célulaEstilo
 */
export interface TableCell {
  id: string
  colspan: number
  rowspan: number
  text: string
  style?: TableCellStyle
}

/**
 * TabelaTema
 * 
 * color: Temacor
 * 
 * rowHeader: Linha de título
 * 
 * rowFooter: Linha de totais
 * 
 * colHeader: Primeira coluna
 * 
 * colFooter: Última coluna
 */
export interface TableTheme {
  color: string
  rowHeader: boolean
  rowFooter: boolean
  colHeader: boolean
  colFooter: boolean
}

/**
 * Tabelaelemento
 * 
 * type: elementoTipo（table）
 * 
 * outline: Borda
 * 
 * theme?: Tema
 * 
 * colWidths: array das larguras das colunas; ex.: [0.3, 0.5, 0.2] = 30%, 50%, 20% da largura total
 * 
 * cellMinHeight: célulamais Pequenoaltura
 * 
 * data: Tabeladados
 */
export interface PPTTableElement extends PPTBaseElement {
  type: 'table'
  outline: PPTElementOutline
  theme?: TableTheme
  colWidths: number[]
  cellMinHeight: number
  data: TableCell[][]
}


/**
 * LaTeXelemento（fórmula）
 * 
 * type: elementoTipo（latex）
 * 
 * latex: latexcódigo
 * 
 * path: svg path
 * 
 * color: Cor
 * 
 * strokeWidth: caminholargura
 * 
 * viewBox: SVGdo viewBoxpropriedade
 * 
 * fixedRatio: fixoFormalargura/alturaproporção
 */
export interface PPTLatexElement extends PPTBaseElement {
  type: 'latex'
  latex: string
  path: string
  color: string
  strokeWidth: number
  viewBox: [number, number]
  fixedRatio: boolean
}

export type PPTElement = PPTTextElement | PPTImageElement | PPTShapeElement | PPTLineElement | PPTChartElement | PPTTableElement | PPTLatexElement

export type SlideBackgroundType = 'solid' | 'image' | 'gradient'
export type SlideBackgroundImageSize = 'cover' | 'contain' | 'repeat'
export interface SlideBackgroundImage {
  src: string
  size: SlideBackgroundImageSize,
}

/**
 * Slidefundo
 * 
 * type: fundoTipo (cor sólida, Imagem, gradiente) 
 * 
 * color?: fundoCor (cor sólida) 
 * 
 * image?: Imagemfundo
 * 
 * gradientType?: gradientefundo
 */
export interface SlideBackground {
  type: SlideBackgroundType
  color?: string
  image?: SlideBackgroundImage
  gradient?: Gradient
}


export interface NoteReply {
  id: string
  content: string
  time: number
  user: string
}

export interface Note {
  id: string
  content: string
  time: number
  user: string
  elId?: string
  replies?: NoteReply[]
}

export interface SectionTag {
  id: string
  title?: string
}

export type SlideType = 'cover' | 'contents' | 'transition' | 'content' | 'end'

/**
 * Página do slide
 * 
 * id: páginaID
 * 
 * elements: elementocoleção
 * 
 * notes?: anotação
 * 
 * remark?: anotações
 * 
 * background?: páginafundo
 * 
 * slideType?: páginaTipo
 * 
 * marginL?: margem de trabalho padrão esquerda (px do canvas)
 * 
 * marginT?: margem de trabalho padrão superior (px do canvas)
 * 
 * marginR?: margem de trabalho padrão direita (px do canvas)
 * 
 * marginB?: margem de trabalho padrão inferior (px do canvas)
 */
export interface Slide {
  id: string
  elements: PPTElement[]
  notes?: Note[]
  remark?: string
  background?: SlideBackground
  sectionTag?: SectionTag
  type?: SlideType
  marginL?: number
  marginT?: number
  marginR?: number
  marginB?: number
}

/**
 * SlideTema
 * 
 * backgroundColor: páginafundoCor
 * 
 * themeColor: Temacor, usado para padrãocriardo FormaCorigual
 * 
 * fontColor: FonteCor
 * 
 * fontName: Fonte
 */
export interface SlideTheme {
  backgroundColor: string
  themeColors: string[]
  fontColor: string
  fontName: string
  outline: PPTElementOutline
  shadow: PPTElementShadow
}

export interface SlideTemplate {
  name: string
  id: string
  cover: string
  origin?: string
}
