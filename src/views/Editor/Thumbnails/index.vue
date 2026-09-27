<template>
  <div 
    class="thumbnails"
    @mousedown="() => setThumbnailsFocus(true)"
    v-click-outside="() => setThumbnailsFocus(false)"
  >
    <div class="add-slide">
      <div class="btn" @click="createSlide()"><i-icon-park-outline:plus class="icon" />Adicionar slide</div>
      <Popover trigger="click" placement="bottom-start" v-model:value="presetLayoutPopoverVisible" center>
        <template #content>
          <Templates 
            @select="slide => { createSlideByTemplate(slide); presetLayoutPopoverVisible = false }"
            @selectAll="({ slides, theme }) => { insertAllTemplates({ slides, theme }); presetLayoutPopoverVisible = false }"
          />
        </template>
        <div class="select-btn"><i-icon-park-outline:down /></div>
      </Popover>
    </div>

    <Draggable 
      class="thumbnail-list"
      ref="thumbnailsRef"
      :modelValue="slides"
      :animation="200"
      :scroll="true"
      :scrollSensitivity="50"
      :disabled="editingSectionId"
      @end="handleDragEnd"
      itemKey="id"
      v-contextmenu="contextmenusThumbnails"
    >
      <template #item="{ element, index }">
        <div class="thumbnail-container">
          <div class="section-title"
            :data-section-id="element?.sectionTag?.id || ''"
            v-if="element.sectionTag || (hasSection && index === 0)" 
            v-contextmenu="contextmenusSection"
            @dblclick="() => editSection(element?.sectionTag?.id || '')"
          >
            <input 
              :id="`section-title-input-${element?.sectionTag?.id || 'default'}`" 
              type="text"
              :value="element?.sectionTag?.title || ''"
              placeholder="Digite o nome da seção"
              @blur="$event => saveSection($event)"
              @keydown.enter.stop="$event => saveSection($event)"
              v-if="editingSectionId === element?.sectionTag?.id || (index === 0 && editingSectionId === 'default')"
            >
            <span class="text" v-else>
              <div class="text-content">{{ element?.sectionTag ? (element?.sectionTag?.title || 'Seção sem título') : 'Seção padrão' }}</div>
            </span>
          </div>
          <div
            class="thumbnail-item"
            :class="{
              'active': slideIndex === index,
              'selected': selectedSlidesIndex.includes(index),
            }"
            @mousedown="$event => handleClickSlideThumbnail($event, index)"
            @dblclick="enterScreening()"
            v-contextmenu="contextmenusThumbnailItem"
          >
            <div class="label" :class="{ 'offset-left': index >= 99 }">{{ fillDigit(index + 1, 2) }}</div>
            <ThumbnailSlide class="thumbnail" :slide="element" :size="120" :visible="index < slidesLoadLimit" />
  
            <div class="note-flag" v-if="element.notes && element.notes.length" @click="openNotesPanel()">{{ element.notes.length }}</div>
          </div>
        </div>
      </template>
    </Draggable>

    <div class="page-number">
      <transition name="fade">
        <span class="autosave-flag" v-if="autosaveVisible">
          <i-icon-park-outline:check-one class="icon" /> Salvo automaticamente
        </span>
      </transition>
      <span>Slide {{slideIndex + 1}} / {{slides.length}}</span>
    </div>

    <!-- Modelos personalizados: salvar / gerenciar -->
    <Modal
      :visible="customTemplatesDialogVisible"
      :width="480"
      closeButton
      @update:visible="customTemplatesDialogVisible = $event"
    >
      <CustomTemplatesDialog
        :mode="customTemplatesDialogMode"
        :slide="currentSlide"
        @close="customTemplatesDialogVisible = false"
      />
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore, useKeyboardStore } from '@/store'
import type { Slide, SlideTheme } from '@/types/slides'
import { fillDigit } from '@/utils/common'
import { isElementInViewport } from '@/utils/element'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import useSlideHandler from '@/hooks/useSlideHandler'
import useSectionHandler from '@/hooks/useSectionHandler'
import useScreening from '@/hooks/useScreening'
import useLoadSlides from '@/hooks/useLoadSlides'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'

import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import Templates from './Templates.vue'
import CustomTemplatesDialog from './CustomTemplatesDialog.vue'
import Modal from '@/components/Modal.vue'
import Popover from '@/components/Popover.vue'
import Draggable from 'vuedraggable'
import { onMounted, onUnmounted } from 'vue'
import { AUTOSAVE_EVENT } from '@/utils/autoSave'

// indicador "Salvo automaticamente": pisca após cada gravação do autosave
const autosaveVisible = ref(false)
let autosaveTimer: number | undefined
const handleAutosaveEvent = () => {
  autosaveVisible.value = true
  window.clearTimeout(autosaveTimer)
  autosaveTimer = window.setTimeout(() => {
    autosaveVisible.value = false
  }, 1600)
}
onMounted(() => window.addEventListener(AUTOSAVE_EVENT, handleAutosaveEvent))
onUnmounted(() => {
  window.removeEventListener(AUTOSAVE_EVENT, handleAutosaveEvent)
  window.clearTimeout(autosaveTimer)
})

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const keyboardStore = useKeyboardStore()
const { selectedSlidesIndex: _selectedSlidesIndex, thumbnailsFocus } = storeToRefs(mainStore)
const { slides, slideIndex, currentSlide } = storeToRefs(slidesStore)
const { ctrlKeyState, shiftKeyState } = storeToRefs(keyboardStore)

const { slidesLoadLimit } = useLoadSlides()

// modelos personalizados de slide (salvos pelo usuário, persistem entre projetos)
const customTemplatesDialogVisible = ref(false)
const customTemplatesDialogMode = ref<'save' | 'manage'>('save')
const openSaveTemplateDialog = () => {
  customTemplatesDialogMode.value = 'save'
  customTemplatesDialogVisible.value = true
}
const openManageTemplatesDialog = () => {
  customTemplatesDialogMode.value = 'manage'
  customTemplatesDialogVisible.value = true
}

const selectedSlidesIndex = computed(() => [..._selectedSlidesIndex.value, slideIndex.value])

const presetLayoutPopoverVisible = ref(false)

const hasSection = computed(() => {
  return slides.value.some(item => item.sectionTag)
})

const { addSlidesFromData } = useAddSlidesOrElements()

const {
  copySlide,
  pasteSlide,
  createSlide,
  createSlideByTemplate,
  copyAndPasteSlide,
  deleteSlide,
  cutSlide,
  selectAllSlide,
  sortSlides,
  isEmptySlide,
} = useSlideHandler()

const {
  createSection,
  removeSection,
  removeAllSection,
  removeSectionSlides,
  updateSectionTitle,
} = useSectionHandler()

// quando a página é trocada
const thumbnailsRef = useTemplateRef<InstanceType<typeof Draggable>>('thumbnailsRef')
watch(() => slideIndex.value, () => {

  // limparMultiseleçãoestadodo Slide
  if (selectedSlidesIndex.value.length) {
    mainStore.updateSelectedSlidesIndex([])
  }

  // verifica se a miniatura atual está visível; senão, rola até ela
  nextTick(() => {
    const activeThumbnailRef: HTMLElement = thumbnailsRef.value?.$el?.querySelector('.thumbnail-item.active')
    if (thumbnailsRef.value && activeThumbnailRef && !isElementInViewport(activeThumbnailRef, thumbnailsRef.value.$el)) {
      setTimeout(() => {
        activeThumbnailRef.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  })
}, { immediate: true })

// trocar de página
const changeSlideIndex = (index: number) => {
  mainStore.setActiveElementIdList([])

  if (slideIndex.value === index) return
  slidesStore.updateSlideIndex(index)
}

// Pontoarminiatura
const handleClickSlideThumbnail = (e: MouseEvent, index: number) => {
  if (editingSectionId.value) return

  const isMultiSelected = selectedSlidesIndex.value.length > 1

  if (isMultiSelected && selectedSlidesIndex.value.includes(index) && e.button !== 0) return

  // com Ctrl, clicar num slide selecionado novamente o desmarca
  // se a página desmarcada era a ativa, a primeira das demais selecionadas torna-se ativa
  if (ctrlKeyState.value) {
    if (slideIndex.value === index) {
      if (!isMultiSelected) return

      const newSelectedSlidesIndex = selectedSlidesIndex.value.filter(item => item !== index)
      mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
      changeSlideIndex(selectedSlidesIndex.value[0])
    }
    else {
      if (selectedSlidesIndex.value.includes(index)) {
        const newSelectedSlidesIndex = selectedSlidesIndex.value.filter(item => item !== index)
        mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
      }
      else {
        const newSelectedSlidesIndex = [...selectedSlidesIndex.value, index]
        mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
      }
    }
  }
  // PressionesegurarShifttecla, Selecionarfaixadentrodo TodosSlide
  else if (shiftKeyState.value) {
    if (slideIndex.value === index && !isMultiSelected) return

    let minIndex = Math.min(...selectedSlidesIndex.value)
    let maxIndex = index

    if (index < minIndex) {
      maxIndex = Math.max(...selectedSlidesIndex.value)
      minIndex = index
    }

    const newSelectedSlidesIndex = []
    for (let i = minIndex; i <= maxIndex; i++) newSelectedSlidesIndex.push(i)
    mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
  }
  // troca de página normal
  else {
    mainStore.updateSelectedSlidesIndex([])
    changeSlideIndex(index)
  }
}

// define o foco da barra de miniaturas (os atalhos só funcionam com foco)
const setThumbnailsFocus = (focus: boolean) => {
  if (thumbnailsFocus.value === focus) return
  mainStore.setThumbnailsFocus(focus)

  if (!focus) mainStore.updateSelectedSlidesIndex([])
}

// arrastarajustarordemapós entrarlinhadadosdo sincronizar
const handleDragEnd = (eventData: { newIndex: number; oldIndex: number }) => {
  const { newIndex, oldIndex } = eventData
  if (newIndex === undefined || oldIndex === undefined || newIndex === oldIndex) return
  sortSlides(newIndex, oldIndex)
}

// Abrir painel de anotações
const openNotesPanel = () => {
  mainStore.setNotesPanelState(true)
}

const editingSectionId = ref('')

const editSection = (id: string) => {
  mainStore.setDisableHotkeysState(true)
  editingSectionId.value = id || 'default'

  nextTick(() => {
    const inputRef = document.querySelector(`#section-title-input-${id || 'default'}`) as HTMLInputElement
    inputRef.focus()
  })
}

const saveSection = (e: FocusEvent | KeyboardEvent) => {
  const title = (e.target as HTMLInputElement).value
  updateSectionTitle(editingSectionId.value, title)

  editingSectionId.value = ''
  mainStore.setDisableHotkeysState(false)
}

const insertAllTemplates = ({ slides, theme }: { slides: Slide[], theme: Partial<SlideTheme> }) => {
  if (isEmptySlide.value) slidesStore.setSlides(slides, theme)
  else addSlidesFromData(slides)
}

const contextmenusSection = (el: HTMLElement): ContextmenuItem[] => {
  const sectionId = el.dataset.sectionId!

  return [
    {
      text: 'Excluir seção',
      handler: () => removeSection(sectionId),
    },
    {
      text: 'Excluir seção e slides',
      handler: () => {
        mainStore.setActiveElementIdList([])
        removeSectionSlides(sectionId)
      },
    },
    {
      text: 'Excluir todas as seções',
      handler: removeAllSection,
    },
    {
      text: 'Renomear seção',
      handler: () => editSection(sectionId),
    },
  ]
}

const { enterScreening, enterScreeningFromStart } = useScreening()

const contextmenusThumbnails = (): ContextmenuItem[] => {
  return [
    {
      text: 'Colar',
      subText: 'Ctrl + V',
      handler: pasteSlide,
    },
    {
      text: 'Selecionar tudo',
      subText: 'Ctrl + A',
      handler: selectAllSlide,
    },
    {
      text: 'Nova página',
      subText: 'Enter',
      handler: createSlide,
    },
    {
      text: 'Meus modelos',
      handler: openManageTemplatesDialog,
    },
    {
      text: 'Apresentação de slides',
      subText: 'F5',
      handler: enterScreeningFromStart,
    },
  ]
}

const contextmenusThumbnailItem = (): ContextmenuItem[] => {
  return [
    {
      text: 'Recortar',
      subText: 'Ctrl + X',
      handler: cutSlide,
    },
    {
      text: 'Copiar',
      subText: 'Ctrl + C',
      handler: copySlide,
    },
    {
      text: 'Colar',
      subText: 'Ctrl + V',
      handler: pasteSlide,
    },
    {
      text: 'Selecionar tudo',
      subText: 'Ctrl + A',
      handler: selectAllSlide,
    },
    { divider: true },
    {
      text: 'Nova página',
      subText: 'Enter',
      handler: createSlide,
    },
    {
      text: 'Duplicar página',
      subText: 'Ctrl + D',
      handler: copyAndPasteSlide,
    },
    {
      text: 'Salvar como modelo',
      handler: openSaveTemplateDialog,
    },
    {
      text: 'Excluir página',
      subText: 'Delete',
      handler: () => deleteSlide(),
    },
    {
      text: 'Adicionar seção',
      handler: createSection,
      disable: !!currentSlide.value.sectionTag,
    },
    { divider: true },
    {
      text: 'Apresentar daqui',
      subText: 'Shift + F5',
      handler: enterScreening,
    },
  ]
}
</script>

<style lang="scss" scoped>
.thumbnails {
  border-right: solid 1px $borderColor;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  user-select: none;
}
.add-slide {
  height: 40px;
  font-size: 12px;
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid $borderColor;
  cursor: pointer;

  .btn {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      background-color: $lightGray;
    }
  }
  .select-btn {
    width: 30px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    border-left: 1px solid $borderColor;

    &:hover {
      background-color: $lightGray;
    }
  }

  .icon {
    margin-right: 3px;
    font-size: 12px;
  }
}
.thumbnail-list {
  padding: 5px 0;
  flex: 1;
  overflow: auto;
}
.thumbnail-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px 0;
  position: relative;

  .thumbnail {
    border-radius: $borderRadius;
    outline: 2px solid rgba($color: $themeColor, $alpha: .15);
  }

  &.active {
    .label {
      color: $themeColor;
    }
    .thumbnail {
      outline-color: $themeColor;
    }
  }
  &.selected {
    .thumbnail {
      outline-color: $themeColor;
    }
    .note-flag {
      background-color: $themeColor;

      &::after {
        border-top-color: $themeColor;
      }
    }
  }

  .note-flag {
    width: 16px;
    height: 12px;
    border-radius: 1px;
    position: absolute;
    left: 8px;
    top: 13px;
    font-size: 8px;
    background-color: rgba($color: $themeColor, $alpha: .75);
    color: #fff;
    text-align: center;
    line-height: 12px;
    cursor: pointer;

    &::after {
      content: '';
      width: 0;
      height: 0;
      position: absolute;
      top: 10px;
      left: 4px;
      border: 4px solid transparent;
      border-top-color: rgba($color: $themeColor, $alpha: .75);
    }
  }
}
.label {
  font-size: 12px;
  color: #999;
  width: 20px;
  cursor: grab;

  &.offset-left {
    position: relative;
    left: -4px;
  }

  &:active {
    cursor: grabbing;
  }
}
.page-number {
  height: 40px;
  font-size: 12px;
  border-top: 1px solid $borderColor;
  line-height: 40px;
  text-align: center;
  color: #666;
  position: relative;
}
.autosave-flag {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background-color: #fff;
  color: $themeColor;

  .icon {
    font-size: 14px;
  }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity $transitionDelay;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.section-title {
  height: 26px;
  font-size: 12px;
  padding: 6px 8px 2px 18px;
  color: #555;

  &.contextmenu-active {
    color: $themeColor;

    .text::before {
      border-bottom-color: $themeColor;
      border-right-color: $themeColor;
    }
  }

  .text {
    display: flex;
    align-items: center;
    position: relative;

    &::before {
      content: '';
      width: 0;
      height: 0;
      border-top: 3px solid transparent;
      border-left: 3px solid transparent;
      border-bottom: 3px solid #555;
      border-right: 3px solid #555;
      margin-right: 5px;
    }

    .text-content {
      display: inline-block;
      @include ellipsis-oneline();
    }
  }

  input {
    width: 100%;
    border: 0;
    outline: 0;
    padding: 0;
    font-size: 12px;
  }
}
</style>