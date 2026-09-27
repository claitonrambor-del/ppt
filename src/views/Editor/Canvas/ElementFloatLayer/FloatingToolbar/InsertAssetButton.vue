<template>
  <!-- Conteúdo do dropdown: raiz com LOGO / Emoji; Emoji abre a grade -->
  <div class="insert-asset-menu">
    <div class="menu-root" v-if="!showEmojiGrid">
      <button
        class="menu-item"
        v-for="opt in INSERT_ASSET_OPTIONS"
        :key="opt.key"
        @click="handleSelectOption(opt.key)"
      >
        <span class="menu-item-label">{{ opt.label }}</span>
        <i-icon-park-outline:right class="menu-item-arrow" />
      </button>
    </div>

    <!-- Grade de emojis -->
    <div class="emoji-grid-wrap" v-else>
      <div class="grid-header">
        <button class="back-btn" @click="showEmojiGrid = false">
          <i-icon-park-outline:left />
          <span>Voltar</span>
        </button>
        <span class="grid-title">Emoji</span>
      </div>
      <div class="emoji-grid" v-if="!loadingEmojis">
        <button
          class="emoji-item"
          v-for="item in EMOJI_ITEMS"
          :key="item.src"
          v-tooltip="item.name"
          @click="insertImageAsset(item.src)"
        >
          <img :src="item.src" :alt="item.name" draggable="false" />
        </button>
      </div>
      <div class="grid-empty" v-if="!loadingEmojis && !EMOJI_ITEMS.length">Nenhum emoji encontrado</div>
      <div class="grid-empty" v-else-if="loadingEmojis">Carregando emojis...</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useSlidesStore } from '@/store'
import { loadEmojiItems, INSERT_ASSET_OPTIONS, LOGO_ITEMS, type InsertAssetItem, type InsertAssetOptionKey } from '@/configs/insertAssets'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import type { PPTImageElement } from '@/types/slides'

const emit = defineEmits<{
  (event: 'close'): void
}>()

const slidesStore = useSlidesStore()
const { viewportSize, viewportRatio } = storeToRefs(slidesStore)
const { addElementsFromData } = useAddSlidesOrElements()

const showEmojiGrid = ref(false)

/** Lista de emojis lida da pasta em tempo de execução (reflete adições/exclusões) */
const EMOJI_ITEMS = ref<InsertAssetItem[]>([])
const loadingEmojis = ref(false)

/** Recarrega a lista da pasta sempre que a grade é aberta */
const refreshEmojiItems = async () => {
  loadingEmojis.value = true
  try {
    EMOJI_ITEMS.value = await loadEmojiItems(true)
  }
  finally {
    loadingEmojis.value = false
  }
}

const handleSelectOption = (key: InsertAssetOptionKey) => {
  if (key === 'logo') insertLogo()
  else if (key === 'emoji') {
    showEmojiGrid.value = true
    refreshEmojiItems()
  }
}

/**
 * Cria o elemento de imagem centralizado na folha (centro geométrico).
 */
const createCenteredImageElement = (src: string, width: number, height: number): PPTImageElement => {
  const w = viewportSize.value
  const h = w * viewportRatio.value
  return {
    type: 'image',
    id: nanoid(10),
    src,
    width,
    height,
    left: (w - width) / 2,
    top: (h - height) / 2,
    fixedRatio: true,
    rotate: 0,
  }
}

/** Insere o logo do projeto (public/logo.png) no centro da folha (20% da largura, proporção preservada) */
const insertLogo = () => {
  const src = LOGO_ITEMS[0].src
  const img = new Image()
  img.onload = () => {
    const width = viewportSize.value * 0.2
    const scale = width / img.width
    const height = img.height * scale
    addElementsFromData([createCenteredImageElement(src, width, height)])
    emit('close')
  }
  img.src = src
}

/** Insere um emoji como elemento de imagem no centro da folha (~8% da largura) */
const insertImageAsset = (src: string) => {
  const img = new Image()
  img.onload = () => {
    const size = viewportSize.value * 0.08
    const scale = size / Math.max(img.width, 1)
    const width = img.width * scale
    const height = img.height * scale
    addElementsFromData([createCenteredImageElement(src, width, height)])
    emit('close')
  }
  img.src = src
}
</script>

<style lang="scss" scoped>
.insert-asset-menu {
  width: 260px;
  max-height: 300px;
  overflow-y: auto;
}
.menu-root {
  display: flex;
  flex-direction: column;
}
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  border-radius: $borderRadius;
  font-size: 13px;
  color: $textColor;
  cursor: pointer;

  &:hover {
    background-color: $lightGray;
  }

  .menu-item-arrow {
    color: #999;
  }
}
.grid-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;

  .back-btn {
    display: flex;
    align-items: center;
    gap: 2px;
    border: 0;
    background: transparent;
    font-size: 12px;
    color: $themeColor;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: $borderRadius;

    &:hover {
      background-color: $lightGray;
    }
  }
  .grid-title {
    font-size: 13px;
    font-weight: 700;
    color: $textColor;
  }
}
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}
.emoji-item {
  aspect-ratio: 1;
  border: 0;
  background: transparent;
  border-radius: $borderRadius;
  padding: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: $lightGray;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }
}
.grid-empty {
  font-size: 12px;
  color: #999;
  text-align: center;
  padding: 16px 0;
}
</style>
