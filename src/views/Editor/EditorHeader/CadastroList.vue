<template>
  <div class="cadastro-list">
    <!-- Adicionar novo item -->
    <div class="add-row">
      <Input
        class="add-input"
        v-model:value="newName"
        :placeholder="placeholder"
        @enter="add()"
      />
      <Button type="primary" size="small" :disabled="saving" @click="add()">
        <i-icon-park-outline:plus class="btn-icon" /> Adicionar
      </Button>
    </div>

    <!-- Itens cadastrados -->
    <div class="list" v-if="items.length">
      <div class="item" v-for="item in items" :key="item.id">
        <template v-if="editingId === item.id">
          <Input
            class="edit-input"
            v-model:value="editingName"
            @enter="saveEdit()"
          />
          <div class="actions">
            <Button type="primary" size="small" @click="saveEdit()">Salvar</Button>
            <Button size="small" @click="cancelEdit()">Cancelar</Button>
          </div>
        </template>
        <template v-else>
          <span class="name">{{ item.name }}</span>
          <div class="actions">
            <span class="action" v-tooltip="'Renomear'" @click="startEdit(item)">
              <i-icon-park-outline:edit />
            </span>
            <span class="action danger" v-tooltip="'Excluir'" @click="remove(item)">
              <i-icon-park-outline:delete />
            </span>
          </div>
        </template>
      </div>
    </div>

    <div class="empty" v-else-if="loaded">
      Nenhum {{ singular }} cadastrado ainda.
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import Button from '@/components/Button.vue'
import Input from '@/components/Input.vue'
import message from '@/utils/message'
import {
  addStoredCadastro,
  deleteStoredCadastro,
  getStoredCadastros,
  renameStoredCadastro,
  type CadastroKind,
  type StoredCadastro,
} from '@/utils/projectDatabase'

const props = defineProps<{
  /** qual cadastro esta lista representa */
  kind: CadastroKind
  /** nome no singular, usado nas mensagens ("setor", "tipo de defeito") */
  singular: string
  /** dica do campo de inclusão */
  placeholder: string
}>()

const items = ref<StoredCadastro[]>([])
const loaded = ref(false)
const saving = ref(false)

const newName = ref('')
const editingId = ref('')
const editingName = ref('')

const load = async () => {
  items.value = await getStoredCadastros(props.kind)
  loaded.value = true
}

/** Verifica se o nome já existe no cadastro (ignorando o item em edição) */
const nameExists = (name: string, ignoreId = '') => {
  const target = name.trim().toLowerCase()
  return items.value.some(item => item.id !== ignoreId && item.name.toLowerCase() === target)
}

const add = async () => {
  const name = newName.value.trim()
  if (!name || saving.value) return

  if (nameExists(name)) {
    message.warning(`Este ${props.singular} já está cadastrado`)
    return
  }

  saving.value = true
  try {
    await addStoredCadastro(props.kind, name)
    newName.value = ''
    await load()
    message.success(`${props.singular.charAt(0).toUpperCase() + props.singular.slice(1)} cadastrado`)
  }
  finally {
    saving.value = false
  }
}

const startEdit = (item: StoredCadastro) => {
  editingId.value = item.id
  editingName.value = item.name
}

const cancelEdit = () => {
  editingId.value = ''
  editingName.value = ''
}

const saveEdit = async () => {
  const name = editingName.value.trim()
  if (!editingId.value || !name) return

  if (nameExists(name, editingId.value)) {
    message.warning(`Este ${props.singular} já está cadastrado`)
    return
  }

  await renameStoredCadastro(editingId.value, name)
  cancelEdit()
  await load()
  message.success('Cadastro atualizado')
}

const remove = async (item: StoredCadastro) => {
  if (!window.confirm(`Excluir o ${props.singular} "${item.name}"?`)) return

  await deleteStoredCadastro(item.id)
  await load()
  message.success('Cadastro excluído')
}

onMounted(load)
</script>

<style lang="scss" scoped>
.add-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}
.add-input {
  flex: 1;
}
.list {
  max-height: 300px;
  overflow: auto;
  border: 1px solid $borderColor;
  border-radius: $borderRadius;
}
.item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  font-size: 13px;

  & + .item {
    border-top: 1px solid $borderColor;
  }

  &:hover {
    background-color: #fafafa;
  }

  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .edit-input {
    flex: 1;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    color: #666;
  }

  .action {
    cursor: pointer;

    &:hover {
      color: $themeColor;
    }

    &.danger:hover {
      color: #e03a3a;
    }
  }
}
.empty {
  padding: 40px 0;
  text-align: center;
  font-size: 13px;
  color: #999;
}
.btn-icon {
  margin-right: 4px;
}
</style>
