<template>
  <div class="popover-menu-item" :class="{ 'center': center }" @click="emit('click')">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  center?: boolean
}>(), {
  center: false,
})

const emit = defineEmits<{
  (event: 'click'): void
}>()
</script>

<style lang="scss" scoped>
.popover-menu-item {
  min-width: 80px;
  padding: 7px 10px;
  border-radius: $borderRadiusSm;
  font-size: 13px;
  cursor: pointer;
  transition: background-color $transitionDelayFast;

  &.center {
    text-align: center;
  }

  &:hover {
    background-color: $hoverBg;
  }
  & + .popover-menu-item {
    margin-top: 2px;
  }
}
</style>