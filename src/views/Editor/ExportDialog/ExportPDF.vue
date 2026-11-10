<template>
  <div class="export-pdf-dialog">
    <div class="thumbnails-view">
      <div class="thumbnails" ref="pdfThumbnailsRef">
        <ThumbnailSlide 
          class="thumbnail" 
          :slide="currentSlide" 
          :size="1600" 
          v-if="rangeType === 'current'"
        />
        <template v-else>
          <ThumbnailSlide 
            class="thumbnail" 
            :class="{ 'break-page': (index + 1) % count === 0 }"
            v-for="(slide, index) in slides" 
            :key="slide.id" 
            :slide="slide" 
            :size="1600" 
          />
        </template>
      </div>
    </div>
    <div class="configs">
      <div class="row">
        <div class="title">Intervalo de exportação:</div>
        <RadioGroup
          class="config-item"
          v-model:value="rangeType"
        >
          <RadioButton style="width: 50%;" value="all">Todos</RadioButton>
          <RadioButton style="width: 50%;" value="current">Slide atual</RadioButton>
        </RadioGroup>
      </div>
      <div class="row">
        <div class="title">Quantidade por página:</div>
        <Select 
          class="config-item"
          v-model:value="count"
          :options="[
            { label: '1', value: 1 },
            { label: '2', value: 2 },
            { label: '3', value: 3 },
          ]"
        />
      </div>
      <div class="row">
        <div class="title">Margem da borda:</div>
        <div class="config-item">
          <Switch v-model:value="padding" />
        </div>
      </div>
      <div class="tip">
        O download gera um arquivo PDF em A4. Para imprimir, na janela de impressão marque "Gráficos de plano de fundo" e selecione margens "Padrão".
      </div>
    </div>

    <div class="btns">
      <Button class="btn export" type="primary" :disabled="downloading" @click="downloadPDF()"><i-icon-park-outline:download /> Baixar PDF</Button>
      <Button class="btn print" :disabled="downloading" @click="expPDF()"><i-icon-park-outline:printer /> Imprimir</Button>
      <Button class="btn close" @click="emit('close')">Fechar</Button>
    </div>

    <FullscreenSpin :loading="downloading" tip="Gerando PDF..." />
  </div>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { toPng } from 'html-to-image'
import { useSlidesStore } from '@/store'
import { print } from '@/utils/print'
import message from '@/utils/message'

import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import Switch from '@/components/Switch.vue'
import Button from '@/components/Button.vue'
import RadioButton from '@/components/RadioButton.vue'
import RadioGroup from '@/components/RadioGroup.vue'
import Select from '@/components/Select.vue'

const emit = defineEmits<{
  (event: 'close'): void
}>()

const { slides, currentSlide, viewportRatio, title } = storeToRefs(useSlidesStore())

const pdfThumbnailsRef = useTemplateRef<HTMLElement>('pdfThumbnailsRef')
const rangeType = ref<'all' | 'current'>('all')
const count = ref(1)
const padding = ref(true)
const downloading = ref(false)

const expPDF = () => {
  if (!pdfThumbnailsRef.value) return
  const pageSize = {
    width: 1600,
    height: rangeType.value === 'all' ? 1600 * viewportRatio.value * count.value : 1600 * viewportRatio.value,
    margin: padding.value ? 50 : 0,
  }
  print(pdfThumbnailsRef.value, pageSize)
}

/**
 * Gera e baixa um PDF diretamente, sem passar pela janela de impressão.
 * Cada página do editor vira uma página A4; a opção de quantidade por página
 * distribui mais de uma página por folha.
 */
const downloadPDF = async () => {
  if (!pdfThumbnailsRef.value || downloading.value) return

  const nodes = Array.from(pdfThumbnailsRef.value.querySelectorAll<HTMLElement>('.thumbnail'))
  if (!nodes.length) return

  downloading.value = true
  try {
    await document.fonts.ready

    const { jsPDF } = await import('jspdf')
    const isPortrait = viewportRatio.value >= 1
    const pdf = new jsPDF({
      orientation: isPortrait ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = padding.value ? 8 : 0
    const maxWidth = pageWidth - margin * 2
    const maxHeight = pageHeight - margin * 2
    const perPage = Math.max(1, count.value)
    const slotHeight = maxHeight / perPage
    const slideRatio = 1 / viewportRatio.value

    // imagens capturadas na resolução de renderização das miniaturas (1600 px)
    const images: string[] = []
    for (const node of nodes) {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: '#fff',
        cacheBust: true,
      })
      images.push(dataUrl)
    }

    for (let i = 0; i < images.length; i++) {
      const pageIndex = Math.floor(i / perPage)
      const slotIndex = i % perPage

      if (pageIndex > 0 && slotIndex === 0) pdf.addPage()

      let drawWidth = maxWidth
      let drawHeight = drawWidth / slideRatio
      if (drawHeight > slotHeight) {
        drawHeight = slotHeight
        drawWidth = drawHeight * slideRatio
      }

      const x = margin + (maxWidth - drawWidth) / 2
      const y = margin + slotIndex * slotHeight + (slotHeight - drawHeight) / 2

      pdf.addImage(images[i], 'PNG', x, y, drawWidth, drawHeight, undefined, 'FAST')
    }

    const fileName = (title.value || 'relatorio').replace(/[\\/:*?"<>|]/g, '-')
    pdf.save(`${fileName}.pdf`)
    message.success('PDF gerado com sucesso')
  }
  catch {
    message.error('Falha ao gerar o PDF')
  }
  finally {
    downloading.value = false
  }
}
</script>

<style lang="scss" scoped>
.export-pdf-dialog {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.thumbnails-view {
  @include absolute-0();

  &::after {
    content: '';
    background-color: #fff;
    @include absolute-0();
  }
}
.thumbnail {
  &.break-page {
    break-after: page;
  }
}
.configs {
  width: 300px;
  height: calc(100% - 80px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 1;

  .row {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 25px;
  }

  .title {
    width: 100px;
  }
  .config-item {
    flex: 1;
  }

  .tip {
    font-size: 12px;
    color: #aaa;
    line-height: 1.8;
    margin-top: 25px;
  }
}
.btns {
  width: 420px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;

  .btn + .btn {
    margin-left: 8px;
  }
  .export {
    flex: 1.2;
  }
  .print {
    flex: 1;
  }
  .close {
    width: 80px;
  }
}
</style>