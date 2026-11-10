import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useSlidesStore } from '@/store'
import type { DocumentHeader, DocumentHeaderField, PPTImageElement, PPTTextElement } from '@/types/slides'
import { getImageSize } from '@/utils/image'
import {
  DEFAULT_LOGO_RATIO,
  HEADER_ELEMENT_NAMES,
  buildFieldsContent,
  buildFieldsHeight,
  buildTitleContent,
  getHeaderArea,
  stripHeaderElements,
} from '@/utils/header'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

/** Partes do cabeçalho que podem ser sincronizadas */
export type HeaderSyncPart = 'logo' | 'title' | 'fields' | 'all'

interface SyncOptions {
  /** Recalcula a geometria derivada do conteúdo (altura da caixa, altura do logo) */
  resize?: boolean
}

/**
 * Operações reativas do cabeçalho automático.
 *
 * O conteúdo (logo, título, campos) é editado em um lugar só — o estado
 * `header` do store — e propagado para os elementos `header:*` de TODAS as
 * páginas, seguindo o mesmo padrão do "substituir tudo" da busca
 * (`useSearch.replaceAll`). O layout (posição/tamanho/estilo) nunca é
 * sobrescrito: ele continua 100% editável no canvas de cada página.
 */
export default () => {
  const slidesStore = useSlidesStore()
  const { slides, header, viewportSize, viewportRatio } = storeToRefs(slidesStore)

  const { addHistorySnapshot } = useHistorySnapshot()

  /**
   * Sincroniza o conteúdo do estado `header` para os elementos correspondentes
   * de todas as páginas.
   */
  const syncHeaderContent = (part: HeaderSyncPart, options: SyncOptions = {}) => {
    const currentHeader = header.value

    for (const slide of slides.value) {
      const areaWidth = getHeaderArea(viewportSize.value, viewportRatio.value, slide).width

      // cópia dos IDs antes de atualizar: updateElement troca o array de elementos
      const targets = slide.elements
        .filter(el => {
          if (el.name === HEADER_ELEMENT_NAMES.logo) return part === 'logo' || part === 'all'
          if (el.name === HEADER_ELEMENT_NAMES.title) return part === 'title' || part === 'all'
          if (el.name === HEADER_ELEMENT_NAMES.fields) return part === 'fields' || part === 'all'
          return false
        })
        .map(el => ({ id: el.id, name: el.name, type: el.type, width: el.width }))

      for (const target of targets) {
        if (target.name === HEADER_ELEMENT_NAMES.logo && target.type === 'image') {
          const props: Partial<PPTImageElement> = { src: currentHeader.logoSrc }
          if (options.resize) {
            props.height = Math.round(target.width * (currentHeader.logoRatio || DEFAULT_LOGO_RATIO))
          }
          slidesStore.updateElement({ id: target.id, slideId: slide.id, props })
        }
        else if (target.type === 'text' && target.name === HEADER_ELEMENT_NAMES.title) {
          const props: Partial<PPTTextElement> = {
            content: buildTitleContent(currentHeader.title, areaWidth),
          }
          slidesStore.updateElement({ id: target.id, slideId: slide.id, props })
        }
        else if (target.type === 'text' && target.name === HEADER_ELEMENT_NAMES.fields) {
          const props: Partial<PPTTextElement> = {
            content: buildFieldsContent(currentHeader, areaWidth),
          }
          if (options.resize) {
            // altura FIXA (sempre HEADER_FIELDS_FIXED_LINES linhas): adicionar
            // ou remover campos não altera o tamanho da caixa nem a posição da
            // borda. `fixedHeight` também migra blocos antigos criados com
            // altura automática.
            props.height = buildFieldsHeight(currentHeader, areaWidth)
            props.fixedHeight = true
            props.vAlign = 'top'
          }
          slidesStore.updateElement({ id: target.id, slideId: slide.id, props })
        }
      }
    }

    addHistorySnapshot()
  }

  /**
   * Liga/desliga o cabeçalho em todas as páginas.
   * Ao ligar, `setSlides` injeta o bloco nas páginas que não têm;
   * ao desligar, o bloco é removido de todas.
   */
  const setHeaderEnabled = (enabled: boolean) => {
    slidesStore.setHeader({ enabled })

    if (enabled) slidesStore.setSlides([...slides.value])
    else slidesStore.setSlides(slides.value.map(stripHeaderElements))

    addHistorySnapshot()
  }

  const updateHeaderTitle = (title: string) => {
    slidesStore.setHeader({ title })
    syncHeaderContent('title')
  }

  const updateHeaderField = (id: string, key: 'label' | 'value', value: string) => {
    const fields = header.value.fields.map(field => field.id === id ? { ...field, [key]: value } : field)
    slidesStore.setHeader({ fields })
    syncHeaderContent('fields')
  }

  const addHeaderField = () => {
    const newField: DocumentHeaderField = { id: nanoid(8), label: '', value: '' }
    slidesStore.setHeader({ fields: [...header.value.fields, newField] })
    syncHeaderContent('fields', { resize: true })
  }

  const removeHeaderField = (id: string) => {
    const fields = header.value.fields.filter(field => field.id !== id)
    slidesStore.setHeader({ fields })
    syncHeaderContent('fields', { resize: true })
  }

  /** Troca o logo (e recalcula a proporção para não distorcer a imagem) */
  const setHeaderLogo = async (src: string) => {
    let logoRatio = header.value.logoRatio || DEFAULT_LOGO_RATIO

    try {
      // getImageSize não resolve em caso de erro → limita a espera
      const size = await Promise.race([
        getImageSize(src),
        new Promise<{ width: number; height: number }>(resolve => {
          setTimeout(() => resolve({ width: 0, height: 0 }), 3000)
        }),
      ])
      if (size.width) logoRatio = size.height / size.width
    }
    catch {
      // mantém a proporção anterior se não for possível medir a imagem
    }

    slidesStore.setHeader({ logoSrc: src, logoRatio })
    syncHeaderContent('logo', { resize: true })
  }

  const resetHeaderLogo = () => setHeaderLogo('logo.png')

  /**
   * Recria o bloco do cabeçalho em todas as páginas com a geometria padrão
   * (posição dentro das margens, tamanhos proporcionais à folha atual).
   * Útil após trocar folha/orientação ou quando o bloco foi movido/excluído.
   */
  const reapplyHeader = () => {
    // strip + ensure em uma única passada: o setSlides remove e reinjeta o bloco
    slidesStore.setSlides(slides.value.map(stripHeaderElements))
    addHistorySnapshot()
  }

  return {
    syncHeaderContent,
    setHeaderEnabled,
    updateHeaderTitle,
    updateHeaderField,
    addHeaderField,
    removeHeaderField,
    setHeaderLogo,
    resetHeaderLogo,
    reapplyHeader,
  }
}
