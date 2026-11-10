<template>
  <div class="ribbon">
    <div class="ribbon-tabs">
      <div
        class="ribbon-tab"
        :class="{ 'active': tab.key === toolbarState }"
        v-for="tab in currentTabs"
        :key="tab.key"
        @click="setToolbarState(tab.key as ToolbarStates)"
      >{{ tab.label }}</div>
    </div>
    <div class="ribbon-body">
      <component :is="currentPanelComponent"></component>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { ToolbarStates } from '@/types/toolbar'

import HomePanel from './HomePanel.vue'
import ElementStylePanel from './ElementStylePanel/index.vue'
import ElementPositionPanel from './ElementPositionPanel.vue'
import SlideDesignPanel from './SlideDesignPanel/index.vue'
import MultiPositionPanel from './MultiPositionPanel.vue'
import MultiStylePanel from './MultiStylePanel.vue'

const mainStore = useMainStore()
const { activeElementIdList, activeElementList, activeGroupElementId, toolbarState } = storeToRefs(mainStore)

// Aba fixa sempre presente no início, como a "Página Inicial" do PowerPoint
const homeTab = { label: 'Página Inicial', key: ToolbarStates.HOME }

const elementTabs = [
  { label: 'Estilo', key: ToolbarStates.EL_STYLE },
  { label: 'Posição', key: ToolbarStates.EL_POSITION },
]
const slideTabs = [
  { label: 'Design', key: ToolbarStates.SLIDE_DESIGN },
]
const multiSelectTabs = [
  { label: 'Estilos (multiseleção)', key: ToolbarStates.MULTI_STYLE },
  { label: 'Posição (multiseleção)', key: ToolbarStates.MULTI_POSITION },
]

const setToolbarState = (value: ToolbarStates) => {
  mainStore.setToolbarState(value)
}

const currentTabs = computed(() => {
  let contextTabs = slideTabs

  if (!activeElementIdList.value.length) contextTabs = slideTabs
  else if (activeElementIdList.value.length > 1) {
    if (!activeGroupElementId.value) contextTabs = multiSelectTabs
    else {
      const activeGroupElement = activeElementList.value.find(item => item.id === activeGroupElementId.value)
      contextTabs = activeGroupElement ? elementTabs : multiSelectTabs
    }
  }
  else contextTabs = elementTabs

  return [homeTab, ...contextTabs]
})

watch(currentTabs, () => {
  const currentTabsValue: ToolbarStates[] = currentTabs.value.map(tab => tab.key)
  if (!currentTabsValue.includes(toolbarState.value)) {
    mainStore.setToolbarState(currentTabsValue[0])
  }
})

const currentPanelComponent = computed(() => {
  const panelMap = {
    [ToolbarStates.HOME]: HomePanel,
    [ToolbarStates.EL_STYLE]: ElementStylePanel,
    [ToolbarStates.EL_POSITION]: ElementPositionPanel,
    [ToolbarStates.SLIDE_DESIGN]: SlideDesignPanel,
    [ToolbarStates.MULTI_STYLE]: MultiStylePanel,
    [ToolbarStates.MULTI_POSITION]: MultiPositionPanel,
  }
  return panelMap[toolbarState.value] || null
})
</script>

<style lang="scss" scoped>
/*
  RIBBON NO TOPO (estilo PowerPoint)
  ----------------------------------------------------------------------------
  Faixa única e compacta: abas à esquerda, ferramentas distribuídas na mesma
  linha, fluindo da esquerda para a direita. O que não couber na largura rola
  na horizontal; nada quebra para baixo.

  Os painéis internos (Design, Estilo, Posição, multiseleção) mantêm o próprio
  template e lógica; apenas o CSS é reaproveitado aqui via :deep() para que os
  blocos "rótulo + controle" (`.field`) virem uma unidade horizontal.
*/
.ribbon {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  height: 36px;
  background-color: #fff;
  border-bottom: solid 1px $borderColor;
  user-select: none;
}

/* abas: à esquerda da mesma linha, com sublinhado de destaque */
.ribbon-tabs {
  display: flex;
  align-items: stretch;
  gap: 2px;
  height: 100%;
  padding: 0 8px;
  flex-shrink: 0;
}
.ribbon-tab {
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  color: $textSecondaryColor;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color $transitionDelayFast $easeOutCubic,
              border-color $transitionDelayFast $easeOutCubic;

  &:hover {
    color: $themeColor;
  }
  &.active {
    color: $themeColor;
    font-weight: 600;
    border-bottom-color: $themeColor;
  }
}

 /* área de conteúdo: uma única linha compacta */
.ribbon-body {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: stretch;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 10px;

  /* barra de rolagem fina: não rouba altura útil da faixa */
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(5, 5, 5, .25);
    border-radius: 2px;
  }
}

/*
  Reaproveita os painéis existentes em modo horizontal.
  Seletores por classe para cobrir todos os painéis sem alterar seus templates.
*/
.ribbon-body {

  /* raiz de cada painel vira uma linha horizontal */
  :deep(.slide-design-panel),
  :deep(.element-style-panel),
  :deep(.element-positopn-panel),
  :deep(.multi-style-panel),
  :deep(.multi-position-panel),
  /* sub-painéis de estilo (texto, imagem, forma, linha, gráfico, tabela, latex) */
  :deep(.text-style-panel),
  :deep(.image-style-panel),
  :deep(.shape-style-panel),
  :deep(.line-style-panel),
  :deep(.chart-style-panel),
  :deep(.table-style-panel),
  :deep(.latex-style-panel) {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    /* nunca quebra: tudo cabe numa única linha da faixa */
    flex-wrap: nowrap;
    flex-shrink: 0;
    height: 100%;
    width: max-content;
    min-width: 100%;
    padding: 0;
    /* distribui as ferramentas pela largura disponível */
    justify-content: space-between;
  }

  /* controles compactos na faixa: botões/selects/inputs mais baixos */
  :deep(button.button) {
    height: 22px;
    line-height: 22px;
    padding: 0 9px;
    font-size: 12px;
  }
  :deep(.select) {
    height: 22px;
  }
  :deep(.select .selector) {
    height: 20px;
    line-height: 20px;
    padding-left: 8px;
  }
  :deep(.select .icon) {
    height: 20px;
    transform: scale(.8);
  }
  :deep(.number-input) {
    height: 22px;
  }
  :deep(.number-input .input-wrap),
  :deep(.number-input .handlers),
  :deep(.number-input .prefix),
  :deep(.number-input .suffix) {
    height: 100%;
    line-height: 20px;
  }
  :deep(.number-input input) {
    height: 20px;
    line-height: 20px;
  }

  /* rótulo de grupo: marcador lateral + altura total, como grupos do PowerPoint */
  :deep(.title) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    align-self: stretch;
    flex-shrink: 0;
    margin: 0 8px 0 0;
    padding: 0 0 0 6px;
    border-left: 3px solid $themeColor;
    white-space: nowrap;
    font-size: 10.5px;

    .more {
      padding: 0 3px;
    }
  }

  /* bloco rótulo + controle: unidade horizontal da faixa */
  :deep(.field) {
    display: flex;
    flex-direction: row;
    align-items: center;
    align-self: center;
    flex-shrink: 0;
    width: auto;
    min-width: 0;
    margin: 0 8px 0 0;
    gap: 4px;
  }

  /* rótulos dos campos: fonte menor para caber na faixa curta */
  :deep(.field-label) {
    font-size: 10.5px;
    line-height: 1.1;
    white-space: nowrap;
  }

  /* linha simples (controles lado a lado) */
  :deep(.row) {
    align-self: center;
    flex-shrink: 0;
    width: auto;
    margin: 0 8px 0 0;
  }

  /* ações empilhadas viram uma fileira horizontal */
  :deep(.stack) {
    align-self: center;
    flex-shrink: 0;
    flex-direction: row;
    gap: 5px;
    margin: 0 8px 0 0;
  }

  /* botão de ação: largura conforme o conteúdo */
  :deep(.block-btn) {
    width: auto;
    align-self: center;
    padding: 0 9px;
  }

  /* divisores horizontais separam grupos na vertical => vira separador vertical */
  :deep(.divider.horizontal) {
    align-self: center;
    width: 1px;
    height: 22px;
    margin: 0 8px !important;
    border-block-start: none;
    border-inline-start: 1px solid rgba(5, 5, 5, .08);
  }

  /* texto de apoio: mantém largura controlada dentro da faixa */
  :deep(.tip-text) {
    align-self: center;
    flex-shrink: 0;
    max-width: 180px;
    font-size: 10px;
    line-height: 1.2;
    margin: 0 8px 0 0;
  }

  /* leitura de estado (tamanho do canvas) */
  :deep(.canvas-size) {
    white-space: nowrap;
  }

  /* lista de temas predefinidos: tira horizontal */
  :deep(.theme-list.theme-list) {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 6px;
    align-self: center;
    margin: 0 8px 0 0;
  }
  :deep(.theme-item.theme-item) {
    flex: none;
    width: 84px;
    /* altura fixa dentro da faixa curta (36px) */
    height: 26px;
    padding-bottom: 0;
    margin: 0;
  }
}
</style>
