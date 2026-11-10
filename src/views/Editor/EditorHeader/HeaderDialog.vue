<template>
  <div class="header-dialog">
    <div class="intro">
      Digite as informações do cabeçalho. O conteúdo é sincronizado em todas
      das páginas e a caixa no canvas permanece fixa.
    </div>

    <div class="switch-row">
      <div class="field-label">Ativar em todas as páginas</div>
      <Switch :value="docHeader.enabled" @update:value="value => setHeaderEnabled(value)" />
    </div>

    <template v-if="docHeader.enabled">
      <div class="field">
        <div class="field-label">Logo:</div>
        <div class="logo-row">
          <FileInput class="logo-preview" @change="files => handleLogoUpload(files)">
            <img v-if="docHeader.logoSrc" :src="docHeader.logoSrc" alt="Logo do cabeçalho" />
            <span v-else class="placeholder">Enviar logo</span>
          </FileInput>
          <Button @click="resetHeaderLogo()">Padrão</Button>
        </div>
      </div>

      <div class="field">
        <div class="field-label">Título:</div>
        <Input
          :value="docHeader.title"
          placeholder="RELATÓRIO DE PENDÊNCIAS"
          @update:value="onTitleInput"
        />
      </div>

      <div class="field">
        <div class="field-label">Campos:</div>
        <div class="fields">
          <div class="field-row" v-for="item in docHeader.fields" :key="item.id">
            <Input
              class="row-label"
              :value="item.label"
              placeholder="Rótulo"
              @update:value="value => onFieldLabel(item.id)(value)"
            />
            <Input
              class="row-value"
              :value="item.value"
              placeholder="Valor"
              @update:value="value => onFieldValue(item.id)(value)"
            />
            <span
              v-if="isAddressField(item)"
              class="row-location"
              :class="{ loading: locating }"
              v-tooltip="'Preencher com minha localização'"
              @click="fillAddressFromLocation()"
            >
              <i-icon-park-outline:gps />
            </span>
          </div>
          <div class="fields-empty" v-if="!docHeader.fields.length">Nenhum campo.</div>
        </div>
        <Button class="add-btn" size="small" @click="addHeaderField()">
          <i-icon-park-outline:plus /> Adicionar campo
        </Button>
      </div>

      <Button class="reapply-btn" @click="reapplyHeader()">
        <i-icon-park-outline:refresh /> Recriar cabeçalho em todas as páginas
      </Button>
    </template>

    <div class="btns">
      <Button type="primary" @click="emit('close')">Concluído</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useHeader from '@/hooks/useHeader'
import { getImageDataURL } from '@/utils/image'
import { DEFAULT_HEADER } from '@/utils/header'
import type { DocumentHeaderField } from '@/types/slides'

import message from '@/utils/message'

import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'
import Switch from '@/components/Switch.vue'
import FileInput from '@/components/FileInput.vue'

const emit = defineEmits<{
  (event: 'close'): void
}>()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { header: docHeader } = storeToRefs(slidesStore)

const {
  setHeaderEnabled,
  updateHeaderTitle,
  updateHeaderField,
  addHeaderField,
  setHeaderLogo,
  resetHeaderLogo,
  reapplyHeader,
} = useHeader()

// envia um novo logo (mede a proporção para não distorcer)
const handleLogoUpload = (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  getImageDataURL(imageFile).then(dataURL => setHeaderLogo(dataURL))
}

// handlers tipados para os inputs (evita parâmetro implícito no template)
const onTitleInput = (value: string) => updateHeaderTitle(value)
const onFieldLabel = (id: string) => (value: string) => updateHeaderField(id, 'label', value)
const onFieldValue = (id: string) => (value: string) => updateHeaderField(id, 'value', value)

// estado do botão de localização (evita cliques repetidos durante a busca)
const locating = ref(false)

// diálogos desativam atalhos globais (padrão do projeto)
onMounted(() => mainStore.setDisableHotkeysState(true))
onUnmounted(() => mainStore.setDisableHotkeysState(false))

// o campo de endereço é o que deve ser preenchido pela localização
// (id padrão "endereco" ou qualquer rótulo que mencione endereço)
const isAddressField = (field: DocumentHeaderField): boolean =>
  field.id === 'endereco' || /endere/i.test(field.label)

/**
 * Restaura o campo ENDEREÇO se ele tiver sido removido (inclusive sem
 * querer): o modal não oferece mais exclusão de campos, e este garante que
 * o endereço sempre volte com o valor padrão do sistema.
 */
const ensureAddressField = () => {
  if (docHeader.value.fields.some(isAddressField)) return

  const defaultField = DEFAULT_HEADER.fields.find(f => f.id === 'endereco')
  addHeaderField()
  const created = docHeader.value.fields[docHeader.value.fields.length - 1]
  updateHeaderField(created.id, 'label', defaultField?.label || 'ENDEREÇO')
  updateHeaderField(created.id, 'value', defaultField?.value || '')
}

// ao abrir o modal, garante que o endereço exista novamente
onMounted(ensureAddressField)

/** Endereço estruturado vindo de um provedor de geocodificação reversa */
interface AddressData {
  street?: string
  number?: string
  neigh?: string
  city?: string
  state?: string
  postcode?: string
  display?: string
}

/**
 * Pontuação de detalhe: rua + número são os indicadores de maior precisão.
 * O provedor com mais pontos é o escolhido.
 */
const scoreAddress = (a: AddressData): number =>
  (a.street ? 4 : 0) +
  (a.number ? 3 : 0) +
  (a.neigh ? 1 : 0) +
  (a.city ? 1 : 0) +
  (a.state ? 1 : 0) +
  (a.postcode ? 1 : 0)

/** Formata o endereço estruturado em texto legível (com CEP quando houver) */
const formatAddress = (a: AddressData): string => {
  const parts: string[] = []
  if (a.street) parts.push(a.number ? `${a.street}, ${a.number}` : a.street)
  if (a.neigh) parts.push(a.neigh)
  const cityUf = a.city && a.state && a.city !== a.state ? `${a.city} - ${a.state}` : a.city || a.state
  if (cityUf) parts.push(cityUf)

  let result = parts.join(' - ')
  if (!result) result = a.display || ''
  if (a.postcode && !result.includes(a.postcode)) {
    result = result ? `${result} - CEP: ${a.postcode}` : a.postcode
  }
  return result
}

/** Normaliza o nome de uma rua para comparação (sem acentos, maiúsculas e prefixos) */
const normStreet = (street: string): string =>
  street
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(rua|r\.|avenida|av\.|travessa|tv\.|alameda|al\.|rodovia|rod\.|estrada|est\.|praça|praca)\s+/, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** As duas rotas designam a mesma rua? */
const sameStreet = (a: string, b: string): boolean => {
  if (!a || !b) return false
  const na = normStreet(a)
  const nb = normStreet(b)
  if (!na || !nb) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

/** Preenche os campos que faltam no endereço com os demais provedores */
const mergeAddressData = (base: AddressData, others: AddressData[]): AddressData => {
  const out: AddressData = { ...base }
  for (const other of others) {
    if (other === base) continue
    if (!out.street && other.street) out.street = other.street
    if (!out.number && other.number && (!out.street || sameStreet(out.street, other.street || ''))) out.number = other.number
    if (!out.neigh && other.neigh) out.neigh = other.neigh
    if (!out.city && other.city) out.city = other.city
    if (!out.state && other.state) out.state = other.state
    if (!out.postcode && other.postcode) out.postcode = other.postcode
    if (!out.display && other.display) out.display = other.display
  }
  return out
}

/** Endereço com número mais próximo, vindo do Overpass (OSM) */
interface NearbyAddress {
  street: string
  number: string
  dist: number
}

/** Elemento bruto retornado pelo Overpass */
interface OverpassElement {
  tags?: Record<string, string>
  lat?: number
  lon?: number
  center?: { lat?: number; lon?: number }
}

/** Espelhos públicos do Overpass — o primeiro que responder decide */
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

/** Distância em metros entre duas coordenadas (haversine) */
const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Consulta um espelho do Overpass pelo endereço com número mais próximo
 * (raio 120 m). `null` = respondeu sem dados; `undefined` = falhou.
 */
const queryOverpass = async (endpoint: string, lat: number, lon: number): Promise<NearbyAddress | null | undefined> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const query = `[out:json][timeout:10];(node(around:120,${lat},${lon})["addr:housenumber"];way(around:120,${lat},${lon})["addr:housenumber"];);out center 20;`
    const res = await fetch(endpoint, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal,
    })
    if (!res.ok) return undefined
    const data = await res.json() as { elements?: OverpassElement[] }
    const items: NearbyAddress[] = (data.elements || [])
      .map(el => {
        const tags = el.tags || {}
        const elLat = el.lat ?? el.center?.lat
        const elLon = el.lon ?? el.center?.lon
        const number = tags['addr:housenumber']
        if (elLat === undefined || elLon === undefined || !number) return null
        return {
          street: tags['addr:street'] || '',
          number: String(number),
          dist: Math.round(distanceMeters(lat, lon, elLat, elLon)),
        }
      })
      .filter((item): item is NearbyAddress => item !== null)
      .sort((a, b) => a.dist - b.dist)
    if (!items.length) return null
    return items[0]
  }
  catch {
    return undefined
  }
  finally {
    clearTimeout(timer)
  }
}

/**
 * Procura o número da casa mais próximo: tenta todos os espelhos em paralelo
 * e aceita o primeiro que responder (com ou sem dados — os espelhos veem o
 * mesmo banco do OSM); se todos falharem, desiste.
 */
const findNearestHouseNumber = (lat: number, lon: number): Promise<NearbyAddress | null> =>
  new Promise(resolve => {
    let pending = OVERPASS_ENDPOINTS.length
    for (const endpoint of OVERPASS_ENDPOINTS) {
      queryOverpass(endpoint, lat, lon).then(result => {
        if (result !== undefined) {
          resolve(result)
          return
        }
        if (--pending === 0) resolve(null)
      })
    }
  })

/** Nominatim/OpenStreetMap — zoom=19 (nível de edifício/entrância) */
const fetchNominatim = async (lat: number, lon: number): Promise<AddressData> => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=19&addressdetails=1&accept-language=pt-BR`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Nominatim indisponível')
  const data = await res.json()
  const a = data.address || {}
  return {
    street: a.road || a.pedestrian || a.street || a.footway || a.path || '',
    number: a.house_number || '',
    neigh: a.suburb || a.neighbourhood || a.quarter || a.city_district || a.hamlet || '',
    city: a.city || a.town || a.village || a.municipality || '',
    state: a.state || '',
    postcode: a.postcode || '',
    display: data.display_name || '',
  }
}

/** Photon (Komoot) — serviço redundante para comparar e escolher o mais detalhado */
const fetchPhoton = async (lat: number, lon: number): Promise<AddressData> => {
  const url = `https://photon.komoot.io/reverse/?lat=${lat}&lon=${lon}&lang=pt`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Photon indisponível')
  const data = await res.json()
  const p = data.features?.[0]?.properties || {}
  return {
    street: p.street || '',
    number: p.housenumber || '',
    neigh: p.district || p.locality || '',
    city: p.city || p.place || '',
    state: p.state || '',
    postcode: p.postcode || '',
    display: [p.name, p.street, p.housenumber, p.city, p.state].filter(Boolean).join(', '),
  }
}

/**
 * Pega a localização atual do usuário (GPS de alta precisão, sem cache) e
 * preenche o campo ENDEREÇO com o endereço mais detalhado possível.
 * Consulta dois provedores em paralelo e escolhe o mais completo.
 * O campo continua editável: o usuário pode ajustar após a inserção.
 */
const fillAddressFromLocation = () => {
  if (locating.value) return

  if (!navigator.geolocation) {
    message.error('Geolocalização não suportada neste navegador')
    return
  }

  locating.value = true
  const loading = message.loading('Obtendo sua localização...')

  navigator.geolocation.getCurrentPosition(
    async position => {
      try {
        const { latitude, longitude, accuracy } = position.coords

        // dois provedores em paralelo: o mais detalhado (rua + número) vence
        const results = await Promise.all([
          fetchNominatim(latitude, longitude).catch(() => null),
          fetchPhoton(latitude, longitude).catch(() => null),
        ])
        const addresses = results.filter((a): a is AddressData => a !== null)

        let best = addresses.reduce<AddressData | null>(
          (top, cur) => (!top || scoreAddress(cur) > scoreAddress(top) ? cur : top),
          null,
        )

        // completa o que faltar com os demais provedores (ex.: número que só um tem)
        if (best) best = mergeAddressData(best, addresses)

        // o display_name do Nominatim às vezes já começa com o número do prédio
        if (best && !best.number) {
          const first = (best.display || '').split(',')[0].trim()
          if (/^\d+[a-z]?$/.test(first)) best.number = first
        }

        // nenhum provedor trouxe o número da casa: procura o endereço com
        // número mais próximo no Overpass e completa rua + número
        if (best && !best.number) {
          const near = await findNearestHouseNumber(latitude, longitude)
          if (near && near.street) {
            if (!best.street || sameStreet(best.street, near.street)) {
              best.street = best.street || near.street
              best.number = near.number
            }
            else if (near.dist <= 60) {
              // ponto caiu em outra via (parque, meio da rua): o endereço real
              // mais próximo é uma aproximação melhor que a rua sem número
              best.street = near.street
              best.number = near.number
            }
          }
        }

        // último recurso: coordenadas com 6 casas (~0,1 m) — sempre precisas
        const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        const address = (best && formatAddress(best)) || fallback

        const addressField = docHeader.value.fields.find(isAddressField)
        if (addressField) updateHeaderField(addressField.id, 'value', address)
        else {
          // não existe campo de endereço: cria um já preenchido
          addHeaderField()
          const created = docHeader.value.fields[docHeader.value.fields.length - 1]
          updateHeaderField(created.id, 'label', 'ENDEREÇO')
          updateHeaderField(created.id, 'value', address)
        }

        loading.close()
        const precision = Number.isFinite(accuracy) ? ` (precisão ≈ ${Math.round(accuracy)} m)` : ''
        message.success(`Endereço preenchido com a sua localização${precision}`)
      }
      catch {
        loading.close()
        message.error('Não foi possível obter o endereço da sua localização')
      }
      finally {
        locating.value = false
      }
    },
    () => {
      locating.value = false
      loading.close()
      message.error('Não foi possível obter sua localização')
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
  )
}
</script>

<style lang="scss" scoped>
.header-dialog {
  font-size: 13px;
  line-height: 1.675;
}
.intro {
  font-size: 12px;
  line-height: 1.5;
  color: $textSecondaryColor;
  margin-bottom: 14px;
}

.row-location {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: $textSecondaryColor;
  transition: color $transitionDelayFast;

  &:hover {
    color: $themeColor;
  }
  &.loading {
    opacity: 0.5;
    pointer-events: none;
  }
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 14px;
}
.field-label {
  font-size: 12px;
  line-height: 1.3;
  font-weight: 700;
}

/* ativar/desativar o cabeçalho em todas as páginas */
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  margin-bottom: 14px;
  background-color: $lightGray;
  border: 1px solid $borderColor;
  border-radius: $borderRadiusMd;

  .field-label {
    font-weight: 400;
  }
}

/* upload do logo + botão padrão */
.logo-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .logo-preview {
    flex: 1;
    min-width: 0;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed $borderColor;
    border-radius: $borderRadius;
    overflow: hidden;
    cursor: pointer;
    transition: border-color $transitionDelayFast;

    &:hover {
      border-color: $themeColor;
    }

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .placeholder {
      font-size: 12px;
      color: $textSecondaryColor;
    }
  }
}
.fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.field-row {
  display: flex;
  align-items: center;
  gap: 6px;

  .row-label {
    flex: none;
    width: 96px;
  }
  .row-value {
    flex: 1;
    min-width: 0;
  }
}
.fields-empty {
  font-size: 12px;
  color: $textSecondaryColor;
}
.add-btn {
  align-self: flex-start;
}

/* recria o bloco do cabeçalho com a geometria padrão em todas as páginas */
.reapply-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  margin-top: 2px;
}
.btns {
  margin-top: 4px;
  text-align: right;
}
</style>
