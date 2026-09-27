import { debounce } from 'lodash'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import { saveAutosave, clearAutosave } from '@/utils/projectDatabase'

/**
 * Salvamento automático da sessão de trabalho atual no banco de dados
 * persistente (`SlideProjectsDB.autosave`).
 *
 * Estratégia:
 * - Debounce de 800ms após a última alteração (evita escrita a cada pixel
 *   arrastado, mas nunca perde o estado final de uma rajada de ações)
 * - Gravação adicional no `beforeunload` (fechar aba/navegador não perde nada)
 * - Após cada gravação bem-sucedida, emite evento global `autosave:saved`
 *   para a UI exibir "Salvo automaticamente"
 */

const AUTOSAVE_DEBOUNCE_MS = 800

export const AUTOSAVE_EVENT = 'autosave:saved'

const persistNow = async () => {
  try {
    const slidesStore = useSlidesStore()
    const { title, theme, slides, viewportSize, viewportRatio, slideIndex } = storeToRefs(slidesStore)

    if (!slides.value.length) return

    await saveAutosave({
      title: title.value,
      theme: theme.value,
      slides: slides.value,
      viewportSize: viewportSize.value,
      viewportRatio: viewportRatio.value,
      slideIndex: slideIndex.value,
    })

    window.dispatchEvent(new CustomEvent(AUTOSAVE_EVENT))
  }
  catch {
    // falha de gravação (ex.: cota cheia) não deve interromper o editor
  }
}

/** Agenda a gravação (debounce): chame a cada alteração relevante */
export const scheduleAutosave = debounce(persistNow, AUTOSAVE_DEBOUNCE_MS, { trailing: true })

/** Grava imediatamente, sem debounce (beforeunload, ações críticas) */
export const forceAutosave = persistNow

/** Descarta a sessão salva (usado ao "Redefinir apresentação") */
export const discardAutosave = clearAutosave
