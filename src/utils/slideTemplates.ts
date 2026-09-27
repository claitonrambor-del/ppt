import type { Slide } from '@/types/slides'
import {
  addStoredTemplate,
  deleteStoredTemplate,
  getStoredTemplates,
  renameStoredTemplate,
} from '@/utils/projectDatabase'

/**
 * Modelos personalizados de slide, salvos pelo usuário ("Salvar como modelo").
 *
 * Persistem no banco de dados persistente (IndexedDB `SlideProjectsDB`,
 * tabela `templates`), diferente do banco de slides da apresentação atual
 * (IndexedDB efêmero, excluído ao fechar o navegador). Assim, os modelos
 * ficam disponíveis nos próximos projetos, com salvamento automático no banco.
 *
 * Migração: modelos criados antes desta versão (guardados em localStorage,
 * chave `PPTIST_CUSTOM_TEMPLATES`) são transferidos para o banco na primeira
 * leitura e removidos do localStorage.
 */

const LEGACY_STORAGE_KEY = 'PPTIST_CUSTOM_TEMPLATES'

export interface CustomSlideTemplate {
  id: string
  name: string
  /** data de criação (ms desde epoch) */
  createdAt: number
  slide: Slide
}

/** Migra modelos antigos (localStorage) para o banco, uma única vez */
const migrateLegacyTemplates = async (): Promise<void> => {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!raw) return

  try {
    const legacy: CustomSlideTemplate[] = JSON.parse(raw)
    if (Array.isArray(legacy) && legacy.length) {
      for (const item of legacy) {
        if (item && item.id && item.slide) {
          await addStoredTemplate(item.name, item.slide)
        }
      }
    }
  }
  catch {
    // dados corrompidos: apenas descarta
  }
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export const getCustomTemplates = async (): Promise<CustomSlideTemplate[]> => {
  await migrateLegacyTemplates()
  return getStoredTemplates()
}

export const addCustomTemplate = async (name: string, slide: Slide): Promise<CustomSlideTemplate> => {
  return addStoredTemplate(name, slide)
}

export const renameCustomTemplate = async (id: string, name: string): Promise<void> => {
  await renameStoredTemplate(id, name)
}

export const deleteCustomTemplate = async (id: string): Promise<void> => {
  await deleteStoredTemplate(id)
}

export const isSlideEmpty = (slide: Slide): boolean => {
  return !slide.elements || slide.elements.length === 0
}
