import Dexie, { type EntityTable } from 'dexie'
import { nanoid } from 'nanoid'
import type { Slide, SlideTheme } from '@/types/slides'
import type { CustomSlideTemplate } from '@/utils/slideTemplates'

/**
 * Banco de dados PERSISTENTE do sistema:
 * - `projects`: projetos salvos explicitamente pelo usuário
 * - `autosave`: sessão de trabalho atual (salvamento automático contínuo)
 * - `templates`: modelos de slide salvos pelo usuário ("Salvar como modelo")
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
  updatedAt: number
}

const db = new Dexie('SlideProjectsDB') as Dexie & {
  projects: EntityTable<StoredProject, 'id'>
  autosave: EntityTable<AutosaveRecord, 'id'>
  templates: EntityTable<CustomSlideTemplate, 'id'>
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
