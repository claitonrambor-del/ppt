<template>
  <div class="sectors-dialog">
    <div class="intro">
      Selecione os setores deste relatório. Eles aparecem ao lado da folha,
      apenas no editor: não são incluídos na impressão nem na exportação.
    </div>

    <div class="list" v-if="items.length">
      <Checkbox
        v-for="item in items"
        :key="item.id"
        :value="selected.includes(item.name)"
        @update:value="value => toggle(item.name, value)"
      >
        {{ item.name }}
      </Checkbox>
    </div>

    <div class="empty" v-else-if="loaded">
      Nenhum setor cadastrado.
      <br />
      Cadastre os setores em <strong>Configurações</strong> para poder selecioná-los.
    </div>

    <div class="btns">
      <Button v-if="selected.length" size="small" @click="clear()">Limpar seleção</Button>
      <Button type="primary" @click="emit('close')">Concluído</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useMainStore, useSlidesStore } from '@/store'
import {
  getStoredCadastros,
  type StoredCadastro,
} from '@/utils/projectDatabase'

import Checkbox from '@/components/Checkbox.vue'
import Button from '@/components/Button.vue'

const emit = defineEmits<{
  (event: 'close'): void
}>()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()

const items = ref<StoredCadastro[]>([])
const loaded = ref(false)
const selected = ref<string[]>([...slidesStore.sectors])

const load = async () => {
  items.value = await getStoredCadastros('setor')
  loaded.value = true
}

const toggle = (name: string, checked: boolean) => {
  selected.value = checked
    ? [...selected.value, name]
    : selected.value.filter(item => item !== name)
  slidesStore.setSectors(selected.value)
}

const clear = () => {
  selected.value = []
  slidesStore.setSectors([])
}

// diálogos desativam atalhos globais (padrão do projeto)
onMounted(() => {
  mainStore.setDisableHotkeysState(true)
  load()
})
onUnmounted(() => mainStore.setDisableHotkeysState(false))
</script>

<style lang="scss" scoped>
.sectors-dialog {
  font-size: 13px;
  line-height: 1.675;
}
.intro {
  font-size: 12px;
  line-height: 1.5;
  color: $textSecondaryColor;
  margin-bottom: 14px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 300px;
  overflow: auto;
  padding: 10px;
  border: 1px solid $borderColor;
  border-radius: $borderRadius;
}
.empty {
  padding: 30px 10px;
  text-align: center;
  font-size: 12px;
  line-height: 1.8;
  color: #999;
}
.btns {
  margin-top: 15px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
</style>
