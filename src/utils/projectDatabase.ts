import Dexie, { type EntityTable } from 'dexie'
import { nanoid } from 'nanoid'
import type { Slide, SlideTheme, DocumentHeader } from '@/types/slides'
import type { CustomSlideTemplate } from '@/utils/slideTemplates'

/**
 * Banco de dados PERSISTENTE do sistema:
 * - `projects`: projetos salvos explicitamente pelo usuário
 * - `autosave`: sessão de trabalho atual (salvamento automático contínuo)
 * - `templates`: modelos de slide salvos pelo usuário ("Salvar como modelo")
 * - `cadastros`: cadastros de configuração (setores, tipos de defeito...)
 *
 * Diferente do banco de snapshots do editor (`PPTist_<id>_<timestamp>`,
 * efêmero — é excluído ao fechar o navegador), este banco persiste entre
 * sessões e projetos.
 *
 * Importante: o nome NÃO contém "PPTist" — `deleteDiscardedDB()`
 * (utils/database.ts) remove qualquer banco cujo nome case com o padrão
 * efêmero `PPTist_<id>_<timestamp>`.
 */

/** Dados completos de uma apresentação, prontos para restaurar no store */
export interface ProjectData {
  title: string
  theme: SlideTheme
  slides: Slide[]
  viewportSize: number
  viewportRatio: number
  /** Cabeçalho automático do documento (opcional em projetos antigos) */
  header?: DocumentHeader
  /** Setores selecionados (anotação de edição, não impressa) */
  sectors?: string[]
}

export interface StoredProject {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  data: ProjectData
}

/** Sessão de trabalho atual (autosave) — registro único, id fixo */
export interface AutosaveRecord {
  id: 'current'
  title: string
  theme: SlideTheme
  slides: Slide[]
  viewportSize: number
  viewportRatio: number
  slideIndex: number
  /** Cabeçalho automático do documento (opcional em sessões antigas) */
  header?: DocumentHeader
  /** Setores selecionados (anotação de edição, não impressa) */
  sectors?: string[]
  updatedAt: number
}

const db = new Dexie('SlideProjectsDB') as Dexie & {
  projects: EntityTable<StoredProject, 'id'>
  autosave: EntityTable<AutosaveRecord, 'id'>
  templates: EntityTable<CustomSlideTemplate, 'id'>
  cadastros: EntityTable<StoredCadastro, 'id'>
}

db.version(1).stores({
  projects: 'id, updatedAt',
})

// v2: adiciona autosave (sessão atual) e templates (modelos do usuário)
db.version(2).stores({
  projects: 'id, updatedAt',
  autosave: 'id',
  templates: 'id',
})

// v3: adiciona os cadastros de configuração (setores, tipos de defeito...)
db.version(3).stores({
  projects: 'id, updatedAt',
  autosave: 'id',
  templates: 'id',
  cadastros: 'id, kind',
})

/** Setores que já vêm cadastrados na primeira vez que o sistema abre */
const DEFAULT_SETORES = ['Logística', 'Extrusora', 'Laminação', 'Projeto']

// v4: cadastra os setores padrão (só quando ainda não houver nenhum cadastro)
db.version(4).stores({
  projects: 'id, updatedAt',
  autosave: 'id',
  templates: 'id',
  cadastros: 'id, kind',
}).upgrade(async tx => {
  const table = tx.table<StoredCadastro>('cadastros')
  const count = await table.count()
  if (count > 0) return

  const now = Date.now()
  await table.bulkAdd(DEFAULT_SETORES.map((name, index) => ({
    id: `cd_seed_${index + 1}`,
    kind: 'setor' as CadastroKind,
    name,
    createdAt: now + index,
  })))
})

/* ==================== Projetos salvos explicitamente ==================== */

/** Lista os projetos salvos, mais recentemente atualizados primeiro */
export const getStoredProjects = async (): Promise<StoredProject[]> => {
  return db.projects.orderBy('updatedAt').reverse().toArray()
}

/** Busca um projeto salvo por ID */
export const getStoredProject = async (id: string): Promise<StoredProject | undefined> => {
  return db.projects.get(id)
}

/** Salva (insere ou atualiza) um projeto completo */
export const addStoredProject = async (title: string, data: ProjectData): Promise<StoredProject> => {
  const now = Date.now()
  const project: StoredProject = {
    id: nanoid(10),
    title: title || 'Projeto sem título',
    createdAt: now,
    updatedAt: now,
    data: JSON.parse(JSON.stringify(data)),
  }
  await db.projects.put(project)
  return project
}

/** Atualiza um projeto existente (novo título e/ou dados) */
export const updateStoredProject = async (id: string, title: string, data: ProjectData): Promise<void> => {
  const existing = await db.projects.get(id)
  if (!existing) throw new Error('Projeto não encontrado')
  await db.projects.put({
    ...existing,
    title: title || existing.title,
    updatedAt: Date.now(),
    data: JSON.parse(JSON.stringify(data)),
  })
}

/** Exclui um projeto salvo */
export const deleteStoredProject = async (id: string): Promise<void> => {
  await db.projects.delete(id)
}

/* ==================== Autosave (sessão atual) ==================== */

export interface AutosavePayload {
  title: string
  theme: SlideTheme
  slides: Slide[]
  viewportSize: number
  viewportRatio: number
  slideIndex: number
  header: DocumentHeader
  sectors?: string[]
}

/** Grava a sessão de trabalho atual (registro único 'current') */
export const saveAutosave = async (payload: AutosavePayload): Promise<void> => {
  const record: AutosaveRecord = {
    id: 'current',
    updatedAt: Date.now(),
    ...JSON.parse(JSON.stringify(payload)),
  }
  await db.autosave.put(record)
}

/** Recupera a sessão de trabalho salva automaticamente (ou null) */
export const getAutosave = async (): Promise<AutosaveRecord | null> => {
  const record = await db.autosave.get('current')
  return record || null
}

/** Remove a sessão salva (ex.: ao "Redefinir apresentação") */
export const clearAutosave = async (): Promise<void> => {
  await db.autosave.clear()
}

/* ==================== Modelos de slide (do usuário) ==================== */

export const getStoredTemplates = async (): Promise<CustomSlideTemplate[]> => {
  const items = await db.templates.toArray()
  return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export const addStoredTemplate = async (name: string, slide: Slide): Promise<CustomSlideTemplate> => {
  const template: CustomSlideTemplate = {
    id: `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || 'Modelo sem título',
    createdAt: Date.now(),
    slide: JSON.parse(JSON.stringify(slide)),
  }
  await db.templates.put(template)
  return template
}

export const renameStoredTemplate = async (id: string, name: string): Promise<void> => {
  await db.templates.update(id, { name: name || 'Modelo sem título' })
}

export const deleteStoredTemplate = async (id: string): Promise<void> => {
  await db.templates.delete(id)
}

/* ==================== Cadastros de configuração ==================== */

/** Tipos de cadastro disponíveis em Configurações */
export type CadastroKind = 'setor' | 'defeito'

export interface StoredCadastro {
  id: string
  kind: CadastroKind
  name: string
  createdAt: number
}

/** Lista os itens de um cadastro, em ordem alfabética */
export const getStoredCadastros = async (kind: CadastroKind): Promise<StoredCadastro[]> => {
  const items = await db.cadastros.where('kind').equals(kind).toArray()
  return items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

/** Adiciona um item ao cadastro */
export const addStoredCadastro = async (kind: CadastroKind, name: string): Promise<StoredCadastro> => {
  const item: StoredCadastro = {
    id: `cd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    name: name.trim(),
    createdAt: Date.now(),
  }
  await db.cadastros.put(item)
  return item
}

/** Renomeia um item do cadastro */
export const renameStoredCadastro = async (id: string, name: string): Promise<void> => {
  await db.cadastros.update(id, { name: name.trim() })
}

/** Exclui um item do cadastro */
export const deleteStoredCadastro = async (id: string): Promise<void> => {
  await db.cadastros.delete(id)
}
