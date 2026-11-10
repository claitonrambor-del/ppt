<template>
  <div class="sector-labels" v-if="sectors.length">
    <div class="sector-label" v-for="sector in sectors" :key="sector">
      {{ sector }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'

const { sectors } = storeToRefs(useSlidesStore())
</script>

<style lang="scss" scoped>
/*
  Anotação de trabalho: fica do lado de fora da folha (na área cinza do
  canvas) e nunca entra na exportação/impressão, pois não faz parte do
  slide nem do `viewport` capturado na impressão.
*/
.sector-labels {
  position: absolute;
  left: calc(100% + 14px);
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  max-width: 180px;
  pointer-events: none;
  user-select: none;
  z-index: 10;
}
.sector-label {
  max-width: 100%;
  padding: 3px 8px;
  background-color: #fff;
  border: 1px solid $borderColor;
  border-left: 3px solid $themeColor;
  border-radius: $borderRadius;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  font-size: 12px;
  line-height: 1.4;
  color: #444;
  white-space: normal;
  word-break: break-word;
}
</style>
