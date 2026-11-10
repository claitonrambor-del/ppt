import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import message from '@/utils/message'
import {
  MODULES_PER_SHEET,
  buildModuleElements,
  getFirstFreeModuleSlot,
  getModuleSlot,
  type ReportModuleSize,
} from '@/utils/reportModule'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

/**
 * Inserção do MÓDULO DE VISTORIA (tabela de pendências + espaço para foto).
 *
 * Existem dois modelos:
 * - `half` (padrão): meia folha — a área abaixo do cabeçalho é dividida em
 *   `MODULES_PER_SHEET` partes iguais e o módulo entra no primeiro SLOT LIVRE,
 *   escolhido pela posição das tabelas já existentes — excluir um módulo
 *   devolve a vaga dele, sem empurrar os demais.
 * - `full`: folha inteira — um único módulo ocupa todo o espaço que sobra
 *   abaixo do cabeçalho (a foto vai até a margem inferior).
 *
 * O módulo nasce FIXO (`lock: true`), como o cabeçalho automático: não pode
 * ser movido nem editado enquanto estiver fixo. Para preencher a tabela ou
 * trocar a foto, clique com o botão direito sobre o módulo e escolha
 * "Desfixar" (depois, "Fixar" para travar de novo).
 */
export default () => {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const { currentSlide, theme, viewportSize, viewportRatio } = storeToRefs(slidesStore)

  const { addHistorySnapshot } = useHistorySnapshot()

  /** Insere um módulo de vistoria no primeiro slot livre da folha atual */
  const addReportModule = (size: ReportModuleSize = 'half') => {
    const slide = currentSlide.value
    if (!slide) return

    const slotIndex = getFirstFreeModuleSlot(viewportSize.value, viewportRatio.value, slide, size)

    if (slotIndex === -1) {
      if (size === 'full') {
        message.info('Esta folha já tem módulos. Crie uma nova página para inserir o módulo de folha inteira.')
      }
      else {
        message.info(`Esta folha não tem mais espaço para módulos (limite de ${MODULES_PER_SHEET} por página). Crie uma nova página ou exclua um módulo.`)
      }
      return
    }

    const slot = getModuleSlot(slotIndex, viewportSize.value, viewportRatio.value, slide, size)
    const elements = buildModuleElements(slot, theme.value, size)

    slidesStore.addElement(elements)
    // o módulo nasce fixo: não entra na seleção (a seleção múltipla exibiria
    // alças de mover/redimensionar sobre elementos fixos)
    mainStore.setActiveElementIdList([])
    addHistorySnapshot()
  }

  return {
    addReportModule,
  }
}
