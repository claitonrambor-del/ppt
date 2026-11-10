import { getStoredCadastros, getStoredProjects } from './projectDatabase'

export interface SectorStat {
  name: string
  count: number
}

export interface SectorStats {
  /** Total de obras salvas no banco */
  totalProjects: number
  /** Obras salvas sem nenhum setor atribuído */
  withoutSector: number
  /** Quantidade de obras por setor, incluindo setores cadastrados sem obras */
  sectors: SectorStat[]
}

/**
 * Monta as estatísticas do dashboard a partir das obras salvas.
 * Uma obra com vários setores conta em cada um deles.
 */
export const getSectorStats = async (): Promise<SectorStats> => {
  const [projects, registeredSectors] = await Promise.all([
    getStoredProjects(),
    getStoredCadastros('setor'),
  ])

  const counts = new Map<string, number>()
  for (const sector of registeredSectors) {
    counts.set(sector.name, 0)
  }

  let withoutSector = 0

  for (const project of projects) {
    const sectorNames = Array.from(new Set(project.data.sectors || []))
      .map(name => name.trim())
      .filter(Boolean)

    if (!sectorNames.length) {
      withoutSector += 1
      continue
    }

    for (const name of sectorNames) {
      counts.set(name, (counts.get(name) || 0) + 1)
    }
  }

  const sectors = Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'))

  return {
    totalProjects: projects.length,
    withoutSector,
    sectors,
  }
}
