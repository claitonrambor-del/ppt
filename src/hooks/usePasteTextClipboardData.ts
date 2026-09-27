import { storeToRefs } from 'pinia'
import { useKeyboardStore } from '@/store'
import { pasteCustomClipboardString } from '@/utils/clipboard'
import { parseText2Paragraphs } from '@/utils/textParser'
import { getImageDataURL, isSVGString, svg2File } from '@/utils/image'
import { isValidURL } from '@/utils/common'
import useCreateElement from '@/hooks/useCreateElement'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'

interface PasteTextClipboardDataOptions {
  onlySlide?: boolean
  onlyElements?: boolean
}

/**
 * verificarImagemURLstring
 * 
 * !!! atenção: defina quais origens de imagem podem ser aceitas e escreva sua própria expressão regular
 * !!! certifique-se de que as fontes das imagens sejam legítimas, confiáveis, controláveis e sem restrições de acesso
 */
const isValidImgURL = (url: string) => {
  const pexels = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*pexels\.com\/[^\s]+\.(?:jpg|jpeg|png|svg|webp)(?:\?.*)?$/i.test(url)
  const pptist = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*pptist\.cn\/[^\s]+\.(?:jpg|jpeg|png|svg|webp)(?:\?.*)?$/i.test(url)
  return pexels || pptist
}

export default () => {
  const { shiftKeyState } = storeToRefs(useKeyboardStore())

  const { createTextElement, createImageElement } = useCreateElement()
  const { addElementsFromData, addSlidesFromData } = useAddSlidesOrElements()

  /**
   * ColarnormalTexto: criarcomo novo Textoelemento
   * @param text Texto
   */
  const createTextElementFromClipboard = (text: string) => {
    createTextElement({
      left: 0,
      top: 0,
      width: 600,
      height: 50,
    }, { content: text })
  }

  /**
   * interpreta o conteúdo da área de transferência e escolhe o modo de colagem adequado
   * @param text área de transferênciaConteúdo
   * @param options configuraçãoitem: onlySlide -- somente processarpáginaColar; onlyElements -- somente processarelementoColar; 
   */
  const pasteTextClipboardData = (text: string, options?: PasteTextClipboardDataOptions) => {
    const onlySlide = options?.onlySlide || false
    const onlyElements = options?.onlyElements || false

    const clipboardData = pasteCustomClipboardString(text)

    // elemento oupágina
    if (typeof clipboardData === 'object') {
      const { type, data } = clipboardData

      if (type === 'elements' && !onlySlide) addElementsFromData(data)
      else if (type === 'slides' && !onlyElements) addSlidesFromData(data)
    }

    // normalTexto
    else if (!onlyElements && !onlySlide) {
      // normaltexto
      if (shiftKeyState.value) {
        const string = parseText2Paragraphs(clipboardData)
        createTextElementFromClipboard(string)
      }
      else {
        // tentarverificarse é Imagemendereçolink
        if (isValidImgURL(clipboardData)) {
          createImageElement(clipboardData)
        }
        // tentarverificarse é hiperlink
        else if (isValidURL(clipboardData)) {
          createTextElementFromClipboard(`<a href="${clipboardData}" title="${clipboardData}" target="_blank">${clipboardData}</a>`)
        }
        // tentarverificarse é SVGcódigo
        else if (isSVGString(clipboardData)) {
          const file = svg2File(clipboardData)
          getImageDataURL(file).then(dataURL => createImageElement(dataURL))
        }
        // normaltexto
        else {
          const string = parseText2Paragraphs(clipboardData)
          createTextElementFromClipboard(string)
        }
      }
    }
  }

  return {
    pasteTextClipboardData,
  }
}