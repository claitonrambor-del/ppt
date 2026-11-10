/**
 * ============================================================================
 * CABEÇALHO AUTOMÁTICO DO DOCUMENTO — construção pura dos elementos
 * ============================================================================
 *
 * O cabeçalho é um bloco de elementos COMUNS do canvas (imagem do logo +
 * caixas de texto), identificados pelo prefixo `header:` no campo `name`.
 * Por serem elementos comuns, funcionam em todas as superfícies (editor,
 * miniaturas, apresentação, mobile) e em todas as exportações (PNG/JPEG/PDF,
 * PPTX, JSON) sem nenhum código extra.
 *
 * Este módulo é puro (sem Pinia/Vue): recebe tudo por parâmetro. As
 * operações reativas (sincronizar conteúdo, ativar/desativar) ficam em
 * `src/hooks/useHeader.ts`; a injeção automática acontece nas actions
 * `setSlides`/`addSlide` do store (`src/store/slides.ts`).
 *
 * Divisão de responsabilidades:
 * - CONTEÚDO (logo, título, campos) → estado `header` do store + sync
 * - LAYOUT (posição, tamanho, estilo) → elementos do slide, livre no canvas
 * ============================================================================
 */
import { nanoid } from 'nanoid'
import type {
  DocumentHeader,
  PPTElement,
  PPTImageElement,
  PPTTextElement,
  Slide,
} from '@/types/slides'
import { resolveMargins, getWorkArea, type WorkArea } from '@/modules/margins'

/** Prefixo dos nomes dos elementos que compõem o cabeçalho automático */
export const HEADER_NAME_PREFIX = 'header:'

/** Nomes canônicos dos elementos do cabeçalho (marcadores estáveis de sync) */
export const HEADER_ELEMENT_NAMES = {
  logo: 'header:logo',
  title: 'header:title',
  fields: 'header:fields',
} as const

/** Proporção padrão altura/largura do logo do sistema (public/logo.png: 1052×246) */
export const DEFAULT_LOGO_RATIO = 246 / 1052

/**
 * Número de linhas sempre reservado para a caixa de campos do cabeçalho.
 * A altura é FIXA: adicionar/remover campos ou quebrar linhas não altera a
 * altura da caixa (nem a posição da borda) — o conteúdo simplesmente flui
 * dentro do espaço reservado, como no cabeçalho de um documento impresso.
 */
export const HEADER_FIELDS_FIXED_LINES = 4

/** Cabeçalho padrão do sistema (modelo RELATÓRIO DE PENDÊNCIAS) */
export const DEFAULT_HEADER: DocumentHeader = {
  enabled: true,
  logoSrc: 'logo.png',
  logoRatio: DEFAULT_LOGO_RATIO,
  title: 'RELATÓRIO DE PENDÊNCIAS',
  fields: [
    { id: 'cliente', label: 'CLIENTE', value: 'FM DIAS' },
    { id: 'endereco', label: 'ENDEREÇO', value: 'Condomínio Monte Carlo - CASA PÁTIO (Em frente ao clube)' },
    { id: 'op', label: 'OP', value: '47241' },
    { id: 'vistoria', label: 'Data da vistoria', value: '29/09/2026' },
  ],
}

/** Este elemento pertence ao bloco de cabeçalho automático? */
export const isHeaderElement = (element: PPTElement): boolean =>
  !!element.name && element.name.startsWith(HEADER_NAME_PREFIX)

/** A página já possui o bloco de cabeçalho? */
export const hasHeaderElement = (slide: Slide): boolean =>
  slide.elements.some(isHeaderElement)

/** Remove o bloco de cabeçalho da página (retorna o mesmo objeto se não há o que remover) */
export const stripHeaderElements = (slide: Slide): Slide => {
  if (!hasHeaderElement(slide)) return slide
  return { ...slide, elements: slide.elements.filter(item => !isHeaderElement(item)) }
}

/** Escape mínimo para montar HTML de conteúdo com segurança */
const escapeHTML = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Área útil (folha menos margens) usada para posicionar o cabeçalho */
export const getHeaderArea = (
  viewportSize: number,
  viewportRatio: number,
  slide: Slide,
): WorkArea => getWorkArea(viewportSize, viewportSize * viewportRatio, resolveMargins(slide))

/**
 * Tamanhos de fonte proporcionais à largura da folha, para o cabeçalho
 * manter a mesma aparência em A4, A3 ou qualquer tamanho de canvas.
 */
export const getTitleFontSize = (areaWidth: number): number => Math.max(18, Math.round(areaWidth * 0.032))
export const getBodyFontSize = (areaWidth: number): number => Math.max(12, Math.round(areaWidth * 0.019))

/** Conteúdo HTML do título (negrito, centralizado, tamanho proporcional) */
export const buildTitleContent = (title: string, areaWidth: number): string => {
  const fontSize = getTitleFontSize(areaWidth)
  return `<p style="text-align: center;"><strong><span style="font-size: ${fontSize}px;">${escapeHTML(title)}</span></strong></p>`
}

/** Conteúdo HTML dos campos de metadados (uma linha por campo) */
export const buildFieldsContent = (header: DocumentHeader, areaWidth: number): string => {
  const fontSize = getBodyFontSize(areaWidth)
  return header.fields.map(field => {
    const text = field.label ? `${field.label}: ${field.value}` : field.value
    return `<p><span style="font-size: ${fontSize}px;">${escapeHTML(text)}</span></p>`
  }).join('')
}

/**
 * Altura da caixa de campos — FIXA, equivalente a `HEADER_FIELDS_FIXED_LINES`
 * linhas, independentemente da quantidade de campos ou de quebras de texto.
 * Espelha o render real: line-height 1.5 + espaçamento entre parágrafos +
 * margem interna (inset) do elemento de texto.
 */
export const buildFieldsHeight = (header: DocumentHeader, areaWidth: number): number => {
  const fontSize = getBodyFontSize(areaWidth)
  const lines = HEADER_FIELDS_FIXED_LINES
  const paragraphSpace = 2
  const insetVertical = 8 * 2
  return Math.ceil(lines * fontSize * 1.5 + (lines - 1) * paragraphSpace + insetVertical)
}

/**
 * Monta o bloco do cabeçalho (logo + título + caixa de campos) para uma página.
 * As dimensões são proporcionais à área útil, então o bloco nasce dentro das
 * margens de trabalho de qualquer folha.
 */
export const buildHeaderElements = (
  header: DocumentHeader,
  viewportSize: number,
  viewportRatio: number,
  slide: Slide,
): PPTElement[] => {
  const area = getHeaderArea(viewportSize, viewportRatio, slide)
  const width = area.width

  const gap = Math.round(width * 0.015)
  const logoWidth = Math.round(width * 0.22)
  const logoHeight = Math.round(logoWidth * (header.logoRatio || DEFAULT_LOGO_RATIO))

  const logo: PPTImageElement = {
    type: 'image',
    id: nanoid(10),
    name: HEADER_ELEMENT_NAMES.logo,
    src: header.logoSrc,
    left: area.left,
    top: area.top,
    width: logoWidth,
    height: logoHeight,
    fixedRatio: true,
    rotate: 0,
  }

  const title: PPTTextElement = {
    type: 'text',
    id: nanoid(10),
    name: HEADER_ELEMENT_NAMES.title,
    content: buildTitleContent(header.title, width),
    left: area.left + logoWidth + gap,
    top: area.top,
    width: Math.max(1, width - logoWidth - gap),
    height: logoHeight,
    rotate: 0,
    defaultFontName: '',
    defaultColor: '#262626',
    lineHeight: 1.3,
    inset: [0, 0, 0, 0],
    fixedHeight: true,
    vAlign: 'middle',
  }

  const fields: PPTTextElement = {
    type: 'text',
    id: nanoid(10),
    name: HEADER_ELEMENT_NAMES.fields,
    content: buildFieldsContent(header, width),
    left: area.left,
    top: area.top + logoHeight + gap,
    width,
    height: buildFieldsHeight(header, width),
    rotate: 0,
    defaultFontName: '',
    defaultColor: '#262626',
    lineHeight: 1.5,
    paragraphSpace: 2,
    inset: [8, 10, 8, 10],
    fixedHeight: true,
    vAlign: 'top',
    outline: {
      width: 1,
      style: 'solid',
      color: '#8c8c8c',
    },
    // caixa FIXA: não pode ser movida nem redimensionada no canvas
    lock: true,
  }

  return [logo, title, fields]
}

/**
 * Bloqueia a caixa de campos em páginas já existentes (migração de
 * documentos criados antes de a caixa ser fixa). Retorna a mesma página
 * quando já está bloqueada, para não gerar novas cópias do array.
 */
const lockHeaderFields = (slide: Slide): Slide => {
  const fields = slide.elements.find(el => el.name === HEADER_ELEMENT_NAMES.fields)
  if (!fields || fields.lock) return slide
  return {
    ...slide,
    elements: slide.elements.map(el => (
      el.name === HEADER_ELEMENT_NAMES.fields ? { ...el, lock: true } : el
    )),
  }
}

/**
 * Garante que a página tenha o cabeçalho (injeta se estiver ativado e ausente).
 * Idempotente: chamada em `setSlides`/`addSlide`, cobrindo criação de páginas,
 * duplicação, colagem, importação e restauração de sessão.
 */
export const ensureHeaderInSlide = (
  slide: Slide,
  header: DocumentHeader | undefined | null,
  viewportSize: number,
  viewportRatio: number,
): Slide => {
  if (!header || !header.enabled) return slide
  if (hasHeaderElement(slide)) return lockHeaderFields(slide)
  return {
    ...slide,
    elements: [
      ...slide.elements,
      ...buildHeaderElements(header, viewportSize, viewportRatio, slide),
    ],
  }
}
