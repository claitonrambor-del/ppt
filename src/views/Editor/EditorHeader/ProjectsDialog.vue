<template>
  <div class="projects-dialog">
    <!-- Modo salvar: nome + destino (novo relatório ou atualizar existente) -->
    <template v-if="mode === 'save'">
      <div class="save-form">
        <div class="field-label">Salvar relatório no banco de dados</div>
        <Input
          ref="inputRef"
          v-model:value="projectName"
          placeholder="Nome do relatório"
          @enter="save()"
        />

        <template v-if="projects.length">
          <div class="field-label existing-label">Ou atualize um relatório existente:</div>
          <div class="existing-list">
            <div
              class="existing-item"
              v-for="item in projects"
              :key="item.id"
              :class="{ 'active': selectedProjectId === item.id }"
              @click="selectExisting(item)"
            >
              <span class="name">{{ item.title }}</span>
              <span class="date">{{ formatDateTime(item.updatedAt) }}</span>
            </div>
          </div>
        </template>
      </div>
      <div class="btns">
        <Button @click="emit('close')" style="margin-right: 10px;">Cancelar</Button>
        <Button type="primary" @click="save()">
          {{ selectedProjectId ? 'Atualizar relatório' : 'Salvar novo relatório' }}
        </Button>
      </div>
    </template>

    <!-- Modo abrir/gerenciar: lista com abrir, renomear e excluir -->
    <template v-else>
      <div class="dialog-title">Obras salvas</div>
      <div class="manage-list" v-if="projects.length">
        <div class="project-item" v-for="item in projects" :key="item.id">
          <div class="info">
            <div class="name">{{ item.title }}</div>
            <div class="meta">
              <span>{{ formatDateTime(item.updatedAt) }}</span>
              <span class="dot">·</span>
              <span>{{ item.data.slides.length }} slide(s)</span>
            </div>
          </div>
          <div class="actions">
            <Button type="primary" size="small" @click="open(item)">Abrir</Button>
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
        Nenhuma obra salva ainda.
        <br />Use "Salvar obra atual" para guardar a apresentação que está em edição.
      </div>
      <div class="btns manage-btns">
        <Button @click="emit('close')">Fechar</Button>
        <Button type="primary" :disabled="savingCurrent" @click="saveCurrent()">
          <i-icon-park-outline:save class="btn-icon" /> Salvar obra atual
        </Button>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import message from '@/utils/message'
import {
  addStoredProject,
  deleteStoredProject,
  getStoredProjects,
  updateStoredProject,
  type StoredProject,
} from '@/utils/projectDatabase'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'

const props = defineProps<{
  mode: 'save' | 'manage'
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { title, theme, slides, viewportSize, viewportRatio, header, sectors } = storeToRefs(slidesStore)
const inputRef = useTemplateRef<InstanceType<typeof Input>>('inputRef')
const { addHistorySnapshot } = useHistorySnapshot()

const projects = ref<StoredProject[]>([])
const projectName = ref('')
const selectedProjectId = ref('')
const savingCurrent = ref(false)

onMounted(async () => {
  // diálogos desativam atalhos globais (padrão do projeto)
  mainStore.setDisableHotkeysState(true)
  projects.value = await getStoredProjects()
  if (props.mode === 'save') {
    projectName.value = title.value
    nextTick(() => inputRef.value?.focus())
  }
})

onUnmounted(() => {
  mainStore.setDisableHotkeysState(false)
})

const currentProjectData = computed(() => ({
  title: title.value,
  theme: theme.value,
  slides: slides.value,
  viewportSize: viewportSize.value,
  viewportRatio: viewportRatio.value,
  header: header.value,
  sectors: sectors.value,
}))

const selectExisting = (item: StoredProject) => {
  // clicar de novo desmarca (volta a salvar como novo)
  if (selectedProjectId.value === item.id) {
    selectedProjectId.value = ''
    projectName.value = title.value
  }
  else {
    selectedProjectId.value = item.id
    projectName.value = item.title
  }
}

const save = async () => {
  try {
    if (selectedProjectId.value) {
      await updateStoredProject(selectedProjectId.value, projectName.value.trim(), currentProjectData.value)
      message.success('Relatório atualizado no banco de dados')
    }
    else {
      await addStoredProject(projectName.value.trim(), currentProjectData.value)
      message.success('Relatório salvo no banco de dados! Use "Abrir relatório" para recuperá-lo')
    }
    emit('close')
  }
  catch (err) {
    message.error(err instanceof Error ? err.message : 'Erro ao salvar relatório')
  }
}

/** Abre um relatório salvo: substitui o relatório atual no editor */
const open = async (item: StoredProject) => {
  if (!window.confirm(`Abrir relatório "${item.title}"? O relatório atual (não salvo) será substituído.`)) return

  const { data } = item
  mainStore.setActiveElementIdList([])
  // cabeçalho e dimensões antes do setSlides: a injeção automática do
  // cabeçalho usa o tamanho atual da folha para calcular a geometria
  if (data.header) slidesStore.setHeader(data.header)
  slidesStore.setViewportSize(data.viewportSize || 1000)
  slidesStore.setViewportRatio(data.viewportRatio || 0.5625)
  slidesStore.setSlides(JSON.parse(JSON.stringify(data.slides)), data.theme)
  slidesStore.setSectors(data.sectors || [])
  slidesStore.setTitle(data.title)
  slidesStore.updateSlideIndex(0)

  // reinicia o histórico (undo) para o estado recém-aberto
  await useSnapshotStoreFresh()

  message.success(`Relatório "${item.title}" aberto`)
  emit('close')
}

/** Limpa o histórico de snapshots e cria o estado inicial do relatório aberto */
const useSnapshotStoreFresh = async () => {
  const { db } = await import('@/utils/database')
  await db.snapshots.clear()
  const snapshotStore = (await import('@/store')).useSnapshotStore()
  snapshotStore.setSnapshotCursor(-1)
  snapshotStore.setSnapshotLength(0)
  await snapshotStore.initSnapshotDatabase()
  addHistorySnapshot()
}

/**
 * Salva a obra que está em edição no momento (sem fechar a lista) e
 * recarrega a lista, para ela já aparecer entre as obras salvas.
 */
const saveCurrent = async () => {
  if (savingCurrent.value) return
  savingCurrent.value = true
  try {
    const saved = await addStoredProject(title.value.trim(), currentProjectData.value)
    projects.value = await getStoredProjects()
    message.success(`Obra "${saved.title}" salva em Obras salvas`)
  }
  catch (err) {
    message.error(err instanceof Error ? err.message : 'Erro ao salvar a obra atual')
  }
  finally {
    savingCurrent.value = false
  }
}

const rename = async (item: StoredProject) => {
  const name = window.prompt('Novo nome do relatório:', item.title)
  if (name === null) return
  await updateStoredProject(item.id, name.trim(), item.data)
  projects.value = await getStoredProjects()
  message.success('Relatório renomeado')
}

const remove = async (item: StoredProject) => {
  if (!window.confirm(`Excluir o relatório "${item.title}"? Esta ação não pode ser desfeita.`)) return
  await deleteStoredProject(item.id)
  projects.value = await getStoredProjects()
  message.success('Relatório excluído')
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
.projects-dialog {
  font-size: 13px;
  line-height: 1.675;
}
.dialog-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
}
.field-label {
  font-weight: 700;
  margin-bottom: 8px;

  &.existing-label {
    margin-top: 16px;
  }
}
.existing-list {
  max-height: 180px;
  overflow: auto;
  border: 1px solid $borderColor;
  border-radius: $borderRadiusMd;
}
.existing-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  cursor: pointer;
  transition: background-color $transitionDelayFast;

  &:hover {
    background-color: $hoverBg;
  }
  &.active {
    background-color: rgba($color: $themeColor, $alpha: .1);
    color: $themeColor;
  }
  & + .existing-item {
    border-top: 1px solid $borderColor;
  }

  .date {
    font-size: 12px;
    color: $textSecondaryColor;
  }
}
.manage-list {
  max-height: 420px;
  overflow: auto;
}
.project-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid $borderColor;
  border-radius: $borderRadiusMd;
  margin-bottom: 10px;
  transition: border-color $transitionDelayFast;

  &:hover {
    border-color: $borderColorStrong;
  }

  .info {
    flex: 1;
    min-width: 0;

    .name {
      font-weight: 700;
      @include ellipsis-oneline();
    }
    .meta {
      font-size: 12px;
      color: $textSecondaryColor;
      margin-top: 2px;

      .dot {
        margin: 0 4px;
      }
    }
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 10px;

    .action {
      cursor: pointer;
      color: $textSecondaryColor;
      transition: color $transitionDelayFast;

      &:hover {
        color: $themeColor;
      }
    }
  }
}
.empty {
  text-align: center;
  color: $textSecondaryColor;
  padding: 30px 0;
}
.btns {
  margin-top: 16px;
  text-align: right;
}
.manage-btns {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  .btn-icon {
    margin-right: 3px;
  }
}
</style>
