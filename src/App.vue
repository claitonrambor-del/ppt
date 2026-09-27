<template>
  <template v-if="slides.length">
    <Screen v-if="screening" />
    <Editor v-else-if="_isPC" />
    <Mobile v-else />
  </template>
  <FullscreenSpin tip="Inicializando dados, aguarde ..." v-else loading :mask="false" />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useScreenStore, useMainStore, useSnapshotStore, useSlidesStore } from '@/store'
import { LOCALSTORAGE_KEY_DISCARDED_DB } from '@/configs/storage'
import { deleteDiscardedDB } from '@/utils/database'
import { getAutosave } from '@/utils/projectDatabase'
import { forceAutosave, scheduleAutosave } from '@/utils/autoSave'
import { isPC } from '@/utils/common'
import api from '@/services'

import Editor from './views/Editor/index.vue'
import Screen from './views/Screen/index.vue'
import Mobile from './views/Mobile/index.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'

const _isPC = isPC()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const snapshotStore = useSnapshotStore()
const screenStore = useScreenStore()
const { databaseId } = storeToRefs(mainStore)
const { slides } = storeToRefs(slidesStore)
const { screening } = storeToRefs(screenStore)

const isAudienceMode = new URLSearchParams(window.location.search).get('mode') === 'audience'

if (import.meta.env.MODE !== 'development') {
  window.onbeforeunload = () => false
}

onMounted(async () => {
  if (isAudienceMode) {
    slidesStore.setSlides([{
      id: nanoid(10),
      elements: [],
    }])
    screenStore.setScreening(true)
    return
  }

  // 1) tenta restaurar a sessão salva automaticamente (autosave do banco)
  //    para iniciar uma sessão limpa, abra com ?fresh=1
  const keepFresh = new URLSearchParams(window.location.search).has('fresh')
  let restored = false

  try {
    if (!keepFresh) {
      const autosave = await getAutosave()
      if (autosave && autosave.slides && autosave.slides.length) {
        slidesStore.setSlides(autosave.slides, autosave.theme)
        slidesStore.setTitle(autosave.title)
        slidesStore.setViewportSize(autosave.viewportSize || 1000)
        slidesStore.setViewportRatio(autosave.viewportRatio || 0.5625)
        slidesStore.updateSlideIndex(Math.min(autosave.slideIndex || 0, autosave.slides.length - 1))
        restored = true
      }
    }
  }
  catch {
    restored = false
  }

  // 2) sem sessão salva (ou ?fresh=1): apresentação padrão
  if (!restored) {
    const slides = await api.getMockData('slides')
    slidesStore.setSlides(slides)
  }

  await deleteDiscardedDB()
  await snapshotStore.initSnapshotDatabase()

  // 3) inicia o salvamento automático da sessão atual
  slidesStore.$subscribe(() => {
    scheduleAutosave()
  })
})

// ao desligar, grava o estado final e registra o ID do banco efêmero para limpeza
window.addEventListener('beforeunload', () => {
  forceAutosave()

  const discardedDB = localStorage.getItem(LOCALSTORAGE_KEY_DISCARDED_DB)
  const discardedDBList: string[] = discardedDB ? JSON.parse(discardedDB) : []

  discardedDBList.push(databaseId.value)

  const newDiscardedDB = JSON.stringify(discardedDBList)
  localStorage.setItem(LOCALSTORAGE_KEY_DISCARDED_DB, newDiscardedDB)
})
</script>

<style lang="scss">
#app {
  height: 100%;
}
</style>
