<template>
  <div class="settings-dialog">
    <div class="dialog-title">Configurações</div>

    <div class="settings-body">
      <!-- Menu lateral: um item por cadastro. Novos cadastros entram em `sections`. -->
      <div class="settings-nav" v-if="sections.length">
        <div
          class="nav-item"
          v-for="section in sections"
          :key="section.key"
          :class="{ active: activeKey === section.key }"
          @click="activeKey = section.key"
        >
          {{ section.label }}
        </div>
      </div>

      <div class="settings-content">
        <CadastroList
          v-if="activeKey === 'setores'"
          kind="setor"
          singular="setor"
          placeholder="Nome do setor"
        />
        <CadastroList
          v-else-if="activeKey === 'defeitos'"
          kind="defeito"
          singular="tipo de defeito"
          placeholder="Nome do tipo de defeito"
        />
        <div class="empty" v-else>
          Selecione um cadastro no menu ao lado.
        </div>
      </div>
    </div>

    <div class="btns">
      <Button @click="emit('close')">Fechar</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Button from '@/components/Button.vue'
import CadastroList from './CadastroList.vue'

const emit = defineEmits<{
  (event: 'close'): void
}>()

interface SettingsSection {
  /** identificador interno do cadastro */
  key: string
  /** nome exibido no menu lateral */
  label: string
}

// cadastros de configuração
const sections = ref<SettingsSection[]>([
  { key: 'setores', label: 'Setores' },
  { key: 'defeitos', label: 'Tipos de defeito' },
])
const activeKey = ref('setores')
</script>

<style lang="scss" scoped>
.settings-dialog {
  width: 100%;
}
.dialog-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 15px;
}
.settings-body {
  display: flex;
  min-height: 260px;
  border: 1px solid $borderColor;
  border-radius: $borderRadius;
  overflow: hidden;
}
.settings-nav {
  width: 160px;
  border-right: 1px solid $borderColor;
  background-color: #fafafa;
  padding: 8px;
  flex-shrink: 0;
}
.nav-item {
  font-size: 13px;
  padding: 8px 10px;
  border-radius: $borderRadius;
  cursor: pointer;
  color: #555;

  &:hover {
    background-color: #f1f1f1;
  }

  &.active {
    background-color: #fff;
    color: $themeColor;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .08);
  }
}
.settings-content {
  flex: 1;
  padding: 15px;
  overflow: auto;
}
.empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 13px;
  line-height: 1.8;
  color: #999;
}
.btns {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
</style>
