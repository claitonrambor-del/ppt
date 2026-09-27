/**
 * Assets inseríveis via botão "LOGO / Emoji" da barra de ferramentas.
 *
 * - Logos: `public/logo.png` — o logo oficial do sistema, gerado a partir
 *   de `Logo.jpeg` (raiz do projeto) com fundo transparente.
 * - Emojis: PNGs em `public/Emoji/`, expostos em `/Emoji/*.png`.
 *
 * A lista de emojis é DINÂMICA: o sistema lê o conteúdo da pasta em tempo de
 * execução, então o usuário pode adicionar ou deletar PNGs em `public/Emoji/`
 * (ou no `dist/Emoji/` do build) e a grade reflete a mudança sem rebuild —
 * basta reabrir a grade de emojis. Para manter o fallback estático do bundle
 * em sincronia, rode `npm run emoji:sync` (gera `public/Emoji/manifest.json`).
 */

export interface InsertAssetItem {
  /** URL pública do asset */
  src: string
  /** nome do arquivo sem extensão (tooltip na grade de emojis) */
  name: string
}

/** Emojis embutidos no bundle (fallback — atualize com `npm run emoji:sync`) */
const emojiModules = import.meta.glob('/public/Emoji/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const STATIC_EMOJI_ITEMS: InsertAssetItem[] = Object.entries(emojiModules)
  .map(([path, url]) => ({
    // em produção os arquivos públicos mantêm o caminho Emoji/<arquivo>
    // (relativo: compatível com deploy em subpasta, já que o app não usa rotas)
    src: url.replace(/^.*\/public\//, '').replace(/^\//, ''),
    name: path.split('/').pop()!.replace(/\.png$/i, ''),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

/** Cache da lista dinâmica de emojis (recarregada quando a grade é aberta) */
let cachedEmojiItems: InsertAssetItem[] | null = null

/** Marcador para não repetir tentativas de fetch que falharam na sessão */
const failedStrategies = new Set<string>()

/**
 * Estratégia 2 — manifest.json gerado por `npm run emoji:sync`.
 * Após carregar, cada entrada é validada por carregamento de imagem para
 * reconhecer exclusões feitas na pasta sem reexecutar o sync.
 */
async function loadFromManifest(): Promise<InsertAssetItem[] | null> {
  try {
    const res = await fetch(relativeBase('Emoji/manifest.json'))
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data)) return null
    return data
      .filter(item => item && typeof item.src === 'string')
      .map(item => ({
      src: item.src,
      name: typeof item.name === 'string' && item.name ? item.name : item.src.split('/').pop()!.replace(/\.png$/i, ''),
    }))
  }
  catch {
    return null
  }
}

/**
 * Estratégia 1 — listagem HTML do diretório (hosts com autoindex listam o
 * conteúdo da pasta, refletindo adições e exclusões em tempo real).
 */
async function loadFromDirectoryListing(): Promise<InsertAssetItem[]> {
  const res = await fetch(relativeBase('Emoji/'))
  if (!res.ok) throw new Error('listagem indisponível')
  const html = await res.text()
  const names = new Set<string>()
  const hrefRegex = /href="([^"]+\.(?:png|PNG))"/g
  let match: RegExpExecArray | null
  while ((match = hrefRegex.exec(html)) !== null) {
    const file = decodeURIComponent(match[1].split('/').pop()!)
    if (file.toLowerCase().endsWith('.png')) names.add(file)
  }
  return [...names].map(file => ({
    src: `Emoji/${file}`,
    name: file.replace(/\.png$/i, ''),
  }))
}

/**
 * Verifica se uma URL aponta para uma imagem real: arquivos deletados da
 * pasta costumam responder com página HTML (fallback de SPA) ou 404 — ambos
 * falham no decode da imagem, em dev e em produção.
 */
function checkImage(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth > 0)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/**
 * Valida uma lista carregando cada imagem: itens deletados da pasta são
 * removidos da grade. Com `lenient`, se NENHUM item carregar (ex.: sem
 * conexão), mantém a lista original para não esvaziar a grade injustamente.
 */
async function validateItems(items: InsertAssetItem[], lenient = false): Promise<InsertAssetItem[]> {
  const checks = await Promise.all(
    items.map(async item => ((await checkImage(item.src)) ? item : null)),
  )
  const valid = checks.filter((item): item is InsertAssetItem => item !== null)
  return lenient && !valid.length ? items : valid
}

/** Resolvedor de URL base relativa (o app usa base: '' e não possui rotas) */
function relativeBase(path: string): RequestInfo {
  const base = import.meta.env.BASE_URL || '/'
  return new URL(path, base).toString()
}

/**
 * Carrega a lista de emojis refletindo o conteúdo atual da pasta:
 * 1. listagem do diretório (autoindex) → 2. manifest.json com itens validados
 * → 3. lista estática do bundle com itens validados.
 *
 * @param force ignora o cache e relê da pasta (usado ao abrir a grade,
 *   para reconhecer emojis adicionados/deletados sem recarregar o app)
 */
export async function loadEmojiItems(force = false): Promise<InsertAssetItem[]> {
  if (!force && cachedEmojiItems) return cachedEmojiItems

  if (!failedStrategies.has('listing')) {
    try {
      const fromListing = await loadFromDirectoryListing()
      if (fromListing.length) {
        cachedEmojiItems = sortItems(fromListing)
        return cachedEmojiItems
      }
    }
    catch {
      failedStrategies.add('listing')
    }
  }

  if (!failedStrategies.has('manifest')) {
    const fromManifest = await loadFromManifest()
    if (fromManifest) {
      const valid = await validateItems(fromManifest)
      if (valid.length) {
        cachedEmojiItems = sortItems(valid)
        return cachedEmojiItems
      }
    }
    failedStrategies.add('manifest')
  }

  cachedEmojiItems = sortItems(await validateItems(STATIC_EMOJI_ITEMS, true))
  return cachedEmojiItems
}

function sortItems(items: InsertAssetItem[]): InsertAssetItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

/** Logos do sistema (public/logo.png — gerado a partir de Logo.jpeg) */
export const LOGO_ITEMS: InsertAssetItem[] = [
  { src: 'logo.png', name: 'Logo' },
]

/** Opções do dropdown do botão */
export const INSERT_ASSET_OPTIONS = [
  { key: 'logo', label: 'LOGO' },
  { key: 'emoji', label: 'Emoji' },
] as const

export type InsertAssetOptionKey = (typeof INSERT_ASSET_OPTIONS)[number]['key']
