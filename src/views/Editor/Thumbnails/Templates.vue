<template>
  <div class="templates">
    <div class="catalogs">
      <div class="catalog" 
        :class="{ 'active': activeCatalog === item.id }" 
        v-for="item in catalogs" 
        :key="item.id"
        @click="changeCatalog(item.id)"
      >{{ item.name }}</div>
    </div>
    <div class="content" v-loading="{ state: loading, text: 'Carregando...' }">
      <div class="header">
        <div class="types">
          <div class="type" 
            :class="{ 'active': activeType === item.value }"
            v-for="item in types"
            :key="item.value"
            @click="activeType = item.value"
          >{{ item.label }}</div>
        </div>
        <div class="insert-all" @click="insertTemplates({ slides, theme })" v-if="!isCustomCatalog">Inserir todos</div>
      </div>
      <div class="list" ref="listRef">
        <template v-for="slide in slides" :key="slide.id">
          <div 
            class="slide-item"
            v-if="slide.type === activeType || activeType === 'all'"
          >
            <ThumbnailSlide class="thumbnail" :slide="slide" :size="180" />
    
            <div class="btns">
              <Button class="btn" type="primary" size="small" @click="insertTemplate(slide)">Inserir modelo</Button>
            </div>
          </div>
        </template>
        <div class="custom-empty" v-if="isCustomCatalog && !slides.length">
          Nenhum modelo salvo ainda.
          <br />Clique com o botão direito em uma página e escolha "Salvar como modelo".
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import type { Slide, SlideTheme } from '@/types/slides'
import { getCustomTemplates } from '@/utils/slideTemplates'
import api from '@/services'

import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import Button from '@/components/Button.vue'

const emit = defineEmits<{
  (event: 'select', payload: Slide): void
  (event: 'selectAll', payload: { slides: Slide[], theme: Partial<SlideTheme> }): void
}>()

const slidesStore = useSlidesStore()
const { templates } = storeToRefs(slidesStore)

const slides = ref<Slide[]>([])
const theme = ref<Partial<SlideTheme>>({})
const listRef = useTemplateRef<HTMLElement>('listRef')
const types = ref<{
  label: string
  value: string
}[]>([
  { label: 'Todos', value: 'all' },
  { label: 'Capa', value: 'cover' },
  { label: 'Sumário', value: 'contents' },
  { label: 'Transição', value: 'transition' },
  { label: 'Conteúdo', value: 'content' },
  { label: 'Encerramento', value: 'end' },
])
const activeType = ref('all')

const activeCatalog = ref('')
const loading = ref(false)

/** catálogo fixo de modelos salvos pelo usuário + catálogos remotos */
const catalogs = computed(() => [
  { id: 'custom', name: 'Meus modelos' },
  ...templates.value,
])
const isCustomCatalog = computed(() => activeCatalog.value === 'custom')

const insertTemplate = (slide: Slide) => {
  emit('select', slide)
}

const insertTemplates = ({ slides, theme }: { slides: Slide[], theme: Partial<SlideTheme> }) => {
  emit('selectAll', { slides, theme })
}

const changeCatalog = (id: string) => {
  activeCatalog.value = id

  // "Meus modelos": salvos automaticamente no banco de dados persistente
  if (id === 'custom') {
    loading.value = true
    getCustomTemplates().then(items => {
      slides.value = items.map(item => JSON.parse(JSON.stringify(item.slide)))
      loading.value = false
      if (listRef.value) listRef.value.scrollTo(0, 0)
    }).catch(() => {
      loading.value = false
    })
    return
  }

  loading.value = true
  api.getMockData(activeCatalog.value).then(ret => {
    slides.value = ret.slides
    if (ret.theme) theme.value = ret.theme

    loading.value = false

    if (listRef.value) listRef.value.scrollTo(0, 0) 
  }).catch(() => {
    loading.value = false
  })
}

onMounted(async () => {
  // abre em "Meus modelos" se houver modelos salvos; senão, no primeiro catálogo remoto
  const custom = await getCustomTemplates()
  const initialCatalog = custom.length ? 'custom' : templates.value[0].id
  changeCatalog(initialCatalog)
})
</script>

<style lang="scss" scoped>
.templates {
  width: 500px;
  height: 500px;
  display: flex;
  user-select: none;
}
.catalogs {
  width: 108px;
  margin-right: 10px;
  padding-right: 10px;
  border-right: 1px solid $borderColor;
  overflow: auto;

  .catalog {
    padding: 7px 8px;
    border-radius: $borderRadius;
    cursor: pointer;

    &:hover {
      background-color: #f5f5f5;
    }

    &.active {
      color: $themeColor;
      background-color: rgba($color: $themeColor, $alpha: .05);
      border-right: 2px solid $themeColor;
      font-weight: 700;
    }

    & + .catalog {
      margin-top: 3px; 
    }
  }
}
.content {
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-right: 4px;

  &:hover .insert-all {
    opacity: 1;
    transition: opacity $transitionDelay;
  }
}
.types {
  display: flex;

  .type {
    border-radius: $borderRadius;
    padding: 3px 8px;
    font-size: 12px;
    cursor: pointer;

    & +.type {
      margin-left: 4px;
    }

    &.active {
      color: $themeColor;
      background-color: rgba($color: $themeColor, $alpha:.05);
      font-weight: 700;
    }

    &:hover {
      background-color: #f5f5f5;
    }
  }
}
.insert-all {
  opacity: 0;
  font-size: 12px;
  color: $themeColor;
  text-decoration: underline;
  cursor: pointer;
}
.list {
  width: 392px;
  padding: 2px;
  margin-right: -10px;
  padding-right: 10px;
  overflow: auto;
  @include flex-grid-layout();
}
.slide-item {
  position: relative;
  @include flex-grid-layout-children(2, 48%);

  &:hover .btns {
    opacity: 1;
  }

  &:hover .thumbnail {
    outline-color: $themeColor;
  }

  .btns {
    @include absolute-0();

    flex-direction: column;
    justify-content: center;
    align-items: center;
    display: flex;
    background-color: rgba($color: #000, $alpha: .25);
    opacity: 0;
    transition: opacity $transitionDelay;
    border-radius: $borderRadius;
  }

  .thumbnail {
    outline: 2px solid $borderColor;
    transition: outline $transitionDelay;
    border-radius: $borderRadius;
    cursor: pointer;
  }
}
.custom-empty {
  padding: 40px 0;
  text-align: center;
  color: #999;
  font-size: 13px;
  line-height: 1.8;
}
</style>