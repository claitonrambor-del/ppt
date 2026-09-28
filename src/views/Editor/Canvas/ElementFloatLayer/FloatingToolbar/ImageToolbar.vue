<template>
  <div class="toolbar-content">
    <button class="toolbar-btn" @click="clipImage()">
      <i-icon-park-outline:tailoring class="icon" />
      <span>Recortar</span>
    </button>
    <FileInput @change="files => replaceImage(files)">
      <button class="toolbar-btn">
        <i-icon-park-outline:transform class="icon" />
        <span>Substituir</span>
      </button>
    </FileInput>
    <button class="toolbar-btn" @click="eraserDialogVisible = true">
      <i-icon-park-outline:magic class="icon" />
      <span>Borracha mágica</span>
    </button>
    <SizeControl :elementInfo="elementInfo" />

    <Modal
      v-model:visible="eraserDialogVisible"
      :width="720"
      closeButton
    >
      <ImageEraserDialog
        v-if="eraserDialogVisible"
        :elementInfo="elementInfo"
        @close="eraserDialogVisible = false"
        @erased="data => replaceErasedImage(data.dataURL)"
      />
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTImageElement } from '@/types/slides'
import useImageHandler from '@/hooks/useImageHandler'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import SizeControl from './SizeControl.vue'
import ImageEraserDialog from './ImageEraserDialog.vue'
import FileInput from '@/components/FileInput.vue'
import Modal from '@/components/Modal.vue'

const props = defineProps<{
  elementInfo: PPTImageElement
}>()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { handleElementId } = storeToRefs(mainStore)
const { replaceImage } = useImageHandler()
const { addHistorySnapshot } = useHistorySnapshot()

const eraserDialogVisible = ref(false)

const clipImage = () => {
  mainStore.setClipingImageElementId(handleElementId.value)
}

// aplica a imagem resultante da borracha mágica no elemento
const replaceErasedImage = (dataURL: string) => {
  const id = handleElementId.value
  if (!id) return
  if (props.elementInfo.clip) {
    slidesStore.removeElementProps({ id, propName: 'clip' })
  }
  slidesStore.updateElement({
    id,
    props: { src: dataURL },
  })
  addHistorySnapshot()
  eraserDialogVisible.value = false
}

</script>

<style lang="scss" scoped>
.toolbar-content {
  width: max-content;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  gap: 4px;
}
.toolbar-btn {
  min-width: 30px;
  height: 30px;
  flex-shrink: 0;
  padding: 0 5px;
  border: 0;
  color: $textColor;
  background-color: transparent;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  border-radius: $borderRadius;
  cursor: pointer;

  &:hover {
    background-color: $lightGray;
  }

  .icon {
    flex-shrink: 0;
    font-size: 16px;
  }
  span {
    flex-shrink: 0;
    font-size: 12px;
    margin-left: 5px;
  }
}
</style>
