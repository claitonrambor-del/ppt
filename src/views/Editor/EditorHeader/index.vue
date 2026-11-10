<template>
  <div class="editor-header">
    <div class="left">
      <Popover trigger="click" placement="bottom-start" v-model:value="mainMenuVisible">
        <template #content>
          <div class="main-menu">
            <div class="ai-menu" @click="openAIPPTDialog(); mainMenuVisible = false">
              <div class="icon"><i-custom:click /></div>
              <div class="aippt-content">
                <div class="aippt"><span>AIPPT</span></div>
                <div class="aippt-subtitle">Digite uma frase e gere apresentações com IA</div>
              </div>
            </div>
          </div>
          <Divider :margin="10" />
          <div class="import-section">
            <div class="import-label">Importar arquivo</div>
            <div class="import-grid">
              <FileInput class="import-block" accept="application/vnd.openxmlformats-officedocument.presentationml.presentation" @change="files => {
                importPPTXFile(files)
                mainMenuVisible = false
              }">
                <span class="icon"><i-custom:file-ppt /></span>
                <span class="label">PPTX</span>
                <span class="sub-label">(somente para testes)</span>
              </FileInput>
              <FileInput class="import-block" accept=".json" @change="files => {
                importJSON(files)
                mainMenuVisible = false
              }">
                <span class="icon"><i-custom:file-jpg /></span>
                <span class="label">JSON</span>
                <span class="sub-label">(somente para testes)</span>
              </FileInput>
              <FileInput class="import-block" accept=".pptist" @change="files => {
                importSpecificFile(files)
                mainMenuVisible = false
              }">
                <span class="icon"><i-custom:file-pptist /></span>
                <span class="label">PPTIST</span>
                <span class="sub-label">(formato exclusivo)</span>
              </FileInput>
            </div>
          </div>
          <Divider :margin="10" />
          <PopoverMenuItem class="popover-menu-item" @click="openSaveProjectDialog(); mainMenuVisible = false"><i-icon-park-outline:save class="icon" /> Salvar no banco de dados</PopoverMenuItem>
          <PopoverMenuItem class="popover-menu-item" @click="openProjectsDialog(); mainMenuVisible = false"><i-icon-park-outline:database-download class="icon" /> Abrir relatório</PopoverMenuItem>
          <Divider :margin="10" />
          <PopoverMenuItem class="popover-menu-item" @click="setDialogForExport('pptx')"><i-icon-park-outline:download class="icon" /> Exportar arquivo</PopoverMenuItem>
          <PopoverMenuItem class="popover-menu-item" @click="setDialogForExport('pdf')"><i-icon-park-outline:file-pdf class="icon" /> Baixar PDF</PopoverMenuItem>
          <Divider :margin="10" />
          <PopoverMenuItem class="popover-menu-item" @click="openSettingsDialog(); mainMenuVisible = false"><i-icon-park-outline:setting-two class="icon" /> Configurações</PopoverMenuItem>
          <Divider :margin="10" />
          <div class="statement">Observação: este site é apenas para testes/demonstração e não fornece nenhum serviço</div>
        </template>
        <div class="menu-item"><i-icon-park-outline:hamburger-button class="icon" /></div>
      </Popover>

      <div class="title">
        <Input 
          class="title-input" 
          ref="titleInputRef"
          v-model:value="titleValue" 
          @blur="handleUpdateTitle()" 
          v-if="editingTitle" 
        ></Input>
        <div 
          class="title-text"
          @click="startEditTitle()"
          :title="title"
          v-else
        >{{ title }}</div>
      </div>
    </div>

    <!-- Ações do relatório: obras salvas, editar cabeçalho, salvar no banco e criar um novo -->
    <div class="report-actions">
      <Button size="small" @click="openProjectsDialog()">
        <i-icon-park-outline:folder-open class="icon" /> Obras salvas
      </Button>
      <Button size="small" @click="dashboardDialogVisible = true">
        <i-icon-park-outline:chart-histogram class="icon" /> Dashboard
      </Button>
      <Button size="small" @click="headerDialogVisible = true">
        <i-icon-park-outline:edit class="icon" /> Editar cabeçalho
      </Button>
      <Button size="small" @click="sectorsDialogVisible = true">
        <i-icon-park-outline:tag-one class="icon" /> Setores
      </Button>
      <Button size="small" type="primary" @click="openSaveProjectDialog()">
        <i-icon-park-outline:save class="icon" /> Salvar
      </Button>
      <Button size="small" @click="createNewReport()">
        <i-icon-park-outline:plus class="icon" /> Novo relatório
      </Button>
    </div>

    <!-- Relatórios: salvar/abrir no banco de dados persistente -->
    <Modal
      :visible="projectsDialogVisible"
      :width="projectsDialogMode === 'manage' ? 560 : 480"
      closeButton
      @update:visible="projectsDialogVisible = $event"
    >
      <ProjectsDialog
        :mode="projectsDialogMode"
        @close="projectsDialogVisible = false"
      />
    </Modal>

    <!-- Dashboard: quantidade de obras salvas por setor -->
    <Modal
      :visible="dashboardDialogVisible"
      :width="920"
      closeButton
      @update:visible="dashboardDialogVisible = $event"
    >
      <DashboardDialog @close="dashboardDialogVisible = false" />
    </Modal>

    <!-- Cabeçalho: modal para digitar título e campos (CLIENTE, ENDEREÇO...) -->
    <Modal
      :visible="headerDialogVisible"
      :width="480"
      closeButton
      @update:visible="headerDialogVisible = $event"
    >
      <HeaderDialog @close="headerDialogVisible = false" />
    </Modal>

    <!-- Setores: marcação exibida fora da folha, sem entrar na impressão -->
    <Modal
      :visible="sectorsDialogVisible"
      :width="420"
      closeButton
      @update:visible="sectorsDialogVisible = $event"
    >
      <SectorsDialog @close="sectorsDialogVisible = false" />
    </Modal>

    <!-- Configurações: cadastros do sistema -->
    <Modal
      :visible="settingsDialogVisible"
      :width="720"
      closeButton
      @update:visible="settingsDialogVisible = $event"
    >
      <SettingsDialog @close="settingsDialogVisible = false" />
    </Modal>

    <FullscreenSpin :loading="exporting" tip="Importando..." />
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useImport from '@/hooks/useImport'
import useSlideHandler from '@/hooks/useSlideHandler'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import message from '@/utils/message'
import type { DialogForExportTypes } from '@/types/export'

import ProjectsDialog from './ProjectsDialog.vue'
import DashboardDialog from './DashboardDialog.vue'
import HeaderDialog from './HeaderDialog.vue'
import SectorsDialog from './SectorsDialog.vue'
import SettingsDialog from './SettingsDialog.vue'
import FileInput from '@/components/FileInput.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import Modal from '@/components/Modal.vue'
import Input from '@/components/Input.vue'
import Popover from '@/components/Popover.vue'
import PopoverMenuItem from '@/components/PopoverMenuItem.vue'
import Divider from '@/components/Divider.vue'
import Button from '@/components/Button.vue'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { title, header } = storeToRefs(slidesStore)
const { importSpecificFile, importPPTXFile, importJSON, exporting } = useImport()
const { resetSlides } = useSlideHandler()
const { addHistorySnapshot } = useHistorySnapshot()

const mainMenuVisible = ref(false)

// relatórios no banco de dados (salvar/abrir)
const projectsDialogVisible = ref(false)
const projectsDialogMode = ref<'save' | 'manage'>('save')
const openSaveProjectDialog = () => {
  projectsDialogMode.value = 'save'
  projectsDialogVisible.value = true
}
const openProjectsDialog = () => {
  projectsDialogMode.value = 'manage'
  projectsDialogVisible.value = true
}

// dashboard de obras por setor
const dashboardDialogVisible = ref(false)

// modal de edição do cabeçalho (título e campos)
const headerDialogVisible = ref(false)

// modal de seleção dos setores do relatório (anotação fora da folha)
const sectorsDialogVisible = ref(false)

// modal de configurações (cadastros do sistema)
const settingsDialogVisible = ref(false)
const openSettingsDialog = () => {
  settingsDialogVisible.value = true
}

/**
 * Novo relatório: começa um documento em branco no banco de trabalho.
 * O cabeçalho é limpo ANTES do resetSlides: a injeção automática do
 * cabeçalho na nova página usa o estado atual do store.
 */
const createNewReport = () => {
  if (!window.confirm('Criar um novo relatório? O relatório atual (não salvo) será substituído.')) return

  slidesStore.setHeader({
    fields: header.value.fields.map(field => ({ ...field, value: '' })),
  })
  slidesStore.setSectors([])
  resetSlides()
  slidesStore.setTitle('')
  addHistorySnapshot()
  message.success('Novo relatório criado')
}

const editingTitle = ref(false)
const titleValue = ref('')
const titleInputRef = useTemplateRef<InstanceType<typeof Input>>('titleInputRef')

const startEditTitle = () => {
  titleValue.value = title.value
  editingTitle.value = true
  nextTick(() => titleInputRef.value?.focus())
}

const handleUpdateTitle = () => {
  slidesStore.setTitle(titleValue.value)
  editingTitle.value = false
}

const setDialogForExport = (type: DialogForExportTypes) => {
  mainStore.setDialogForExport(type)
  mainMenuVisible.value = false
}

const openAIPPTDialog = () => {
  mainStore.setAIPPTDialogState(true)
}
</script>

<style lang="scss" scoped>
.editor-header {
  background-color: #fff;
  user-select: none;
  border-bottom: 1px solid $borderColor;
  display: flex;
  justify-content: space-between;
  padding: 0 5px;
}
.left {
  display: flex;
  justify-content: center;
  align-items: center;
}
.menu-item {
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  padding: 0 10px;
  border-radius: $borderRadius;
  cursor: pointer;

  .icon {
    font-size: 18px;
    color: #666;
  }

  &:hover {
    background-color: #f1f1f1;
  }
}
.popover-menu-item {
  display: flex;
  padding: 8px 10px;

  .icon {
    font-size: 18px;
    margin-right: 10px;
  }
}
.statement {
  font-size: 12px;
  color: #999;
  padding: 8px 10px;
  font-style: italic;
}
.main-menu {
  width: 300px;
}
.ai-menu {
  background: linear-gradient(270deg, #f8edff, #d4f1ff);
  color: $themeColor;
  border-radius: $borderRadius;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;

  .icon {
    font-size: 22px;
    margin-right: 16px;
  }
  .aippt-content {
    display: flex;
    flex-direction: column;
  }
  .aippt {
    font-weight: 700;
    font-size: 16px;

    span {
      background: linear-gradient(270deg, #d897fd, #33bcfc);
      background-clip: text;
      color: transparent;
    }
  }
  .aippt-subtitle {
    font-size: 12px;
    color: #777;
    margin-top: 5px;
  }
}

.import-section {
  padding: 5px 0;

  .import-label {
    font-size: 12px;
    color: #999;
    margin-bottom: 6px;
  }
  .import-grid {
    display: flex;
    gap: 8px;
    justify-content: space-between;
  }
  .import-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 8px;
    border-radius: $borderRadius;
    border: 1px solid $borderColor;
    transition: background-color .2s;
    cursor: pointer;
  
    &:hover {
      background-color: #f1f1f1;
    }
    .icon {
      font-size: 24px;
      margin-bottom: 2px;
    }
    .label {
      font-size: 12px;
      text-align: center;
    }
    .sub-label {
      font-size: 10px;
      color: #999;
    }
  }
}

.report-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 5px;

  .icon {
    margin-right: 3px;
  }
}
.title {
  height: 30px;
  margin-left: 2px;
  font-size: 13px;

  .title-input {
    width: 200px;
    height: 100%;
    padding-left: 0;
    padding-right: 0;

    ::v-deep(input) {
      height: 28px;
      line-height: 28px;
    }
  }
  .title-text {
    min-width: 20px;
    max-width: 400px;
    line-height: 30px;
    padding: 0 6px;
    border-radius: $borderRadius;
    cursor: pointer;

    @include ellipsis-oneline();

    &:hover {
      background-color: #f1f1f1;
    }
  }
}
</style>