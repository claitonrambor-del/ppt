import { ref, watch, type Ref } from 'vue'
import type { TableTheme } from '@/types/slides'
import { getTableSubThemeColor } from '@/utils/element'

// calcula as cores de apoio a partir das cores do tema da tabela

export default (theme: Ref<TableTheme | undefined>) => {
  const subThemeColor = ref(['', ''])
  watch(() => theme.value, () => {
    if (theme.value) {
      subThemeColor.value = getTableSubThemeColor(theme.value.color)
    }
  }, { immediate: true })

  return {
    subThemeColor,
  }
}