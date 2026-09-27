import Dexie, { type EntityTable } from 'dexie'
import { databaseId } from '@/store/main'
import type { Slide } from '@/types/slides'
import { LOCALSTORAGE_KEY_DISCARDED_DB } from '@/configs/storage'

export interface writingBoardImg {
  id: string
  dataURL: string
}

export interface Snapshot {
  id: number
  index: number
  slides: Slide[]
}

const databaseNamePrefix = 'PPTist'

// excluir bancos de dados inválidos/expirados
// ao fechar o app (fechar ou recarregar o navegador), registra o ID do banco no localStorage indicando que ficou inválido
// na inicialização, verifica todos os bancos e exclui os registrados como inválidos
// além disso, bancos criados há mais de 12 horas também são excluídos (evita bancos não removidos por falhas)
export const deleteDiscardedDB = async () => {
  const now = new Date().getTime()

  const localStorageDiscardedDB = localStorage.getItem(LOCALSTORAGE_KEY_DISCARDED_DB)
  const localStorageDiscardedDBList: string[] = localStorageDiscardedDB ? JSON.parse(localStorageDiscardedDB) : []

  const databaseNames = await Dexie.getDatabaseNames()
  const discardedDBNames = databaseNames.filter(name => {
    if (name.indexOf(databaseNamePrefix) === -1) return false
    
    const [prefix, id, time] = name.split('_')
    if (prefix !== databaseNamePrefix || !id || !time) return true
    if (localStorageDiscardedDBList.includes(id)) return true
    if (now - (+time) >= 1000 * 60 * 60 * 12) return true

    return false
  })

  for (const name of discardedDBNames) Dexie.delete(name)
  localStorage.removeItem(LOCALSTORAGE_KEY_DISCARDED_DB)
}

const db = new Dexie(`${databaseNamePrefix}_${databaseId}_${new Date().getTime()}`) as Dexie & {
  snapshots: EntityTable<Snapshot, 'id'>,
  writingBoardImgs: EntityTable<writingBoardImg, 'id'>,
}

db.version(1).stores({
  snapshots: '++id',
  writingBoardImgs: 'id',
})

export { db }