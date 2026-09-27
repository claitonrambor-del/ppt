<template>
  <button 
    class="button"
    :class="{
      'disabled': disabled,
      'checked': !disabled && checked,
      'default': !disabled && type === 'default',
      'primary': !disabled && type === 'primary',
      'checkbox': !disabled && type === 'checkbox',
      'radio': !disabled && type === 'radio',
      'small': size === 'small',
      'first': first,
      'last': last,
    }"
    @click="handleClick()"
  >
    <slot></slot>
  </button>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  checked?: boolean
  disabled?: boolean
  type?: 'default' | 'primary' | 'checkbox' | 'radio'
  size?: 'small' | 'normal'
  first?: boolean
  last?: boolean
}>(), {
  checked: false,
  disabled: false,
  type: 'default',
  size: 'normal',
  first: false,
  last: false,
})

const emit = defineEmits<{
  (event: 'click'): void
}>()

const handleClick = () => {
  if (props.disabled) return
  emit('click')
}
</script>

<style lang="scss" scoped>
.button {
  height: 32px;
  line-height: 32px;
  outline: 0;
  font-size: 13px;
  padding: 0 15px;
  text-align: center;
  color: $textColor;
  border-radius: $borderRadiusSm;
  user-select: none;
  letter-spacing: .3px;
  cursor: pointer;
  /* micro-feedback: resposta imediata ao toque/click (contingência de ação) */
  transition: background-color $transitionDelayFast $easeOutCubic,
              border-color $transitionDelayFast $easeOutCubic,
              color $transitionDelayFast $easeOutCubic,
              box-shadow $transitionDelayFast $easeOutCubic,
              transform $transitionDelayFast $easeOutCubic;

  &:active:not(.disabled) {
    /* compressão sutil: o botão "cede" sob o clique (affordance física) */
    transform: scale(.97);
  }

  &.small {
    height: 24px;
    line-height: 24px;
    padding: 0 7px;
    letter-spacing: 0;
    font-size: 12px;
  }

  &.default {
    background-color: #fff;
    border: 1px solid #d9d9d9;
    color: $textColor;

    &:hover {
      color: $themeColor;
      border-color: $themeColor;
      background-color: rgba($color: $themeColor, $alpha: .04);
    }
  }
  &.primary {
    background-color: $themeColor;
    border: 1px solid $themeColor;
    color: #fff;

    &:hover {
      background-color: $themeHoverColor;
      border-color: $themeHoverColor;
      /* elevação momentânea reforça "isto é clicável" (pista de profundidade) */
      box-shadow: 0 2px 6px -1px rgba($color: $themeColor, $alpha: .45);
    }
    &:active:not(.disabled) {
      background-color: $themeActiveColor;
      border-color: $themeActiveColor;
    }
  }
  &.checkbox, &.radio {
    background-color: #fff;
    border: 1px solid #d9d9d9;
    color: $textColor;

    &:not(.checked):hover {
      color: $themeColor;
      border-color: $themeColor;
    }
  }
  &.checked {
    color: #fff;
    background-color: $themeColor;
    border-color: $themeColor;

    &:hover {
      background-color: $themeHoverColor;
      border-color: $themeHoverColor;
    }
  }
  &.disabled {
    background-color: #f5f5f5;
    border: 1px solid #d9d9d9;
    color: $textDisabledColor;
    cursor: default;
  }
}
</style>