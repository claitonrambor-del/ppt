<template>
  <div class="screen-slide-list">
    <div 
      class="slide-item"
      :class="{
        'current': index === slideIndex,
        'before': index < slideIndex,
        'after': index > slideIndex,
        'last': index === slideIndex - 1,
        'next': index === slideIndex + 1,
      }"
      v-for="(slide, index) in slides" 
      :key="slide.id"
    >
      <div 
        class="slide-content" 
        :style="{
          width: slideWidth + 'px',
          height: slideHeight + 'px',
        }"
        v-if="Math.abs(slideIndex - index) < 2"
      >
        <ScreenSlide 
          :slide="slide" 
          :scale="scale"
          :turnSlideToId="turnSlideToId"
          :manualExitFullscreen="manualExitFullscreen"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, provide } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import { injectKeySlideScale } from '@/types/injectKey'

import ScreenSlide from './ScreenSlide.vue'

const props = defineProps<{
  slideWidth: number
  slideHeight: number
  turnSlideToId: (id: string) => void
  manualExitFullscreen: () => void
}>()

const { slides, slideIndex, viewportSize } = storeToRefs(useSlidesStore())

const scale = computed(() => props.slideWidth / viewportSize.value)
provide(injectKeySlideScale, scale)
</script>

<style lang="scss" scoped>
.screen-slide-list {
  background: #1d1d1d;
  position: relative;
  width: 100%;
  height: 100%;
}
.slide-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  &:not(.last, .next) {
    z-index: -1;
  }

  &.current {
    z-index: 2;
  }

  &.before {
    transform: translateY(-100%);
  }
  &.after {
    transform: translateY(100%);
  }
}
.slide-content {
  background-color: #fff;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
