<template>
  <div class="custom-templates-dialog">
    <!-- Modo salvar: nome do modelo + pré-visualização -->
    <template v-if="mode === 'save' && slide">
      <div class="save-form">
        <Input
          ref="inputRef"
          v-model:value="templateName"
          placeholder="Nome do modelo (ex.: Capa padrão da empresa)"
          @enter="save()"
        />
        <div class="preview">
          <div class="preview-label">Pré-visualização:</div>
          <ThumbnailSlide class="thumbnail" :slide="slide" :size="400" />
        </div>
      </div>
      <div class="btns">
        <Button @click="emit('close')" style="margin-right: 10px;">Cancelar</Button>
        <Button type="primary" @click="save()">Salvar modelo</Button>
      </div>
    </template>

    <!-- Modo gerenciar: lista com renomear/excluir -->
    <template v-else>
      <div class="manage-list" v-if="templates.length">
        <div class="template-item" v-for="item in templates" :key="item.id">
          <ThumbnailSlide class="thumbnail" :slide="item.slide" :size="110" />
          <div class="info">
            <div class="name">{{ item.name }}</div>
            <div class="date">{{ formatDateTime(item.createdAt) }}</div>
          </div>
          <div class="actions">
            <span class="action" v-tooltip="'Renomear'" @click="rename(item)">
              <i-icon-park-outline:edit />
            </span>
            <span class="action danger" v-tooltip="'Excluir'" @click="remove(item)">
              <i-icon-park-outline:delete />
            </span>
          </div>
        </div>
      </div>
      <div class="empty" v-else>
        Você ainda não salvou nenhum modelo.
        <br />Use "Salvar como modelo" no menu de contexto de uma página.
      </div>
      <div class="btns">
        <Button @click="emit('close')">Fechar</Button>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useMainStore } from '@/store'
import type { Slide } from '@/types/slides'
import message from '@/utils/message'
import {
  addCustomTemplate,
  deleteCustomTemplate,
  getCustomTemplates,
  isSlideEmpty,
  renameCustomTemplate,
  type CustomSlideTemplate,
} from '@/utils/slideTemplates'

import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'

const props = defineProps<{
  mode: 'save' | 'manage'
  slide?: Slide
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const mainStore = useMainStore()
const inputRef = useTemplateRef<InstanceType<typeof Input>>('inputRef')

const templates = ref<CustomSlideTemplate[]>([])
const templateName = ref('')

const currentSlide = computed(() => props.slide || null)

onMounted(() => {
  // painéis/modais desativam atalhos globais para não conflitarem (padrão do projeto)
  mainStore.setDisableHotkeysState(true)

  getCustomTemplates().then(items => {
    templates.value = items
  })
  if (props.mode === 'save') {
    if (isSlideEmpty(props.slide!)) {
      message.warning('A página está vazia — adicione elementos antes de salvar como modelo')
      emit('close')
      return
    }
    nextTick(() => inputRef.value?.focus())
  }
})

onUnmounted(() => {
  mainStore.setDisableHotkeysState(false)
})

const save = async () => {
  if (!currentSlide.value) return
  try {
    await addCustomTemplate(templateName.value.trim(), currentSlide.value)
    message.success('Modelo salvo no banco de dados! Disponível em "Meus modelos"')
    emit('close')
  }
  catch (err) {
    message.error(err instanceof Error ? err.message : 'Erro ao salvar modelo')
  }
}

const rename = async (item: CustomSlideTemplate) => {
  const name = window.prompt('Novo nome do modelo:', item.name)
  if (name === null) return
  await renameCustomTemplate(item.id, name.trim())
  templates.value = await getCustomTemplates()
}

const remove = async (item: CustomSlideTemplate) => {
  if (!window.confirm(`Excluir o modelo "${item.name}"?`)) return
  await deleteCustomTemplate(item.id)
  templates.value = await getCustomTemplates()
  message.success('Modelo excluído')
}

const formatDateTime = (time: number) => {
  return new Date(time).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style lang="scss" scoped>
.custom-templates-dialog {
  font-size: 13px;
  line-height: 1.675;
}
.save-form {
  .preview {
    margin-top: 14px;
  }
  .preview-label {
    margin-bottom: 5px;
  }
  .thumbnail {
    border: 1px solid rgba($color: $themeColor, $alpha: .15);
    border-radius: $borderRadius;
  }
}
.manage-list {
  max-height: 420px;
  overflow: auto;
  @include flex-grid-layout();
}
.template-item {
  @include flex-grid-layout-children(2, 48%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border: 1px solid $borderColor;
  border-radius: $borderRadius;
  margin-bottom: 10px;

  .thumbnail {
    outline: 1px solid $borderColor;
    border-radius: $borderRadius;
    flex-shrink: 0;
  }
  .info {
    flex: 1;
    min-width: 0;

    .name {
      font-weight: 700;
      @include ellipsis-oneline();
    }
    .date {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }
  }
  .actions {
    display: flex;
    gap: 8px;

    .action {
      cursor: pointer;
      color: #666;

      &:hover {
        color: $themeColor;
      }
      &.danger:hover {
        color: $themeColor;
      }
    }
  }
}
.empty {
  text-align: center;
  color: #999;
  padding: 30px 0;
}
.btns {
  margin-top: 16px;
  text-align: right;
}
</style>
