import { onMounted, onUnmounted, ref, watch } from 'vue'
import { throttle } from 'lodash'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import { KEYS } from '@/configs/hotkey'
import message from '@/utils/message'
import type { Slide } from '@/types/slides'

const AUDIENCE_SYNC_CHANNEL = 'pptist-audience-sync'

type SyncMessage =
  | { type: 'EXEC_NEXT' }
  | { type: 'EXEC_PREV' }
  | { type: 'TURN_TO_INDEX'; index: number }
  | { type: 'TURN_TO_ID'; id: string }
  | { type: 'REQUEST_STATE' }
  | { type: 'INIT_STATE'; slideIndex: number; slides: Slide[]; viewportSize: number; viewportRatio: number }
  | { type: 'REQUEST_WRITING_BOARD' }
  | { type: 'WRITING_BOARD_UPDATE'; dataURL: string; blackboard: boolean }
  | { type: 'WRITING_BOARD_CLOSE' }
  | { type: 'LASER_PEN_MOVE'; x: number; y: number }
  | { type: 'LASER_PEN_OFF' }
  | { type: 'EXIT' }

export default () => {
  const slidesStore = useSlidesStore()
  const { slides, slideIndex, viewportSize, viewportRatio } = storeToRefs(slidesStore)

  const isAudienceMode = new URLSearchParams(window.location.search).get('mode') === 'audience'

  // fora do modo plateia: cria o canal de difusão, envia comandos e responde às solicitações de estado
  let syncChannel: BroadcastChannel | null = null
  if (!isAudienceMode) {
    syncChannel = new BroadcastChannel(AUDIENCE_SYNC_CHANNEL)
    syncChannel.onmessage = ({ data }: MessageEvent<SyncMessage>) => {
      if (data.type === 'REQUEST_STATE') {
        syncChannel!.postMessage({
          type: 'INIT_STATE',
          slideIndex: slideIndex.value,
          viewportSize: viewportSize.value,
          viewportRatio: viewportRatio.value,
          slides: JSON.parse(JSON.stringify(slides.value)),
        } as SyncMessage)
      }
    }
  }

  // FecharAutomáticoreproduzir
  const autoPlayTimer = ref(0)
  const closeAutoPlay = () => {
    if (autoPlayTimer.value) {
      clearInterval(autoPlayTimer.value)
      autoPlayTimer.value = 0
    }
  }
  onUnmounted(closeAutoPlay)

  // Reprodução em loop
  const loopPlay = ref(false)
  const setLoopPlay = (loop: boolean) => {
    loopPlay.value = loop
  }

  const throttleMassage = throttle(function(msg) {
    message.success(msg)
  }, 1000, { leading: true, trailing: false })

  // para acima/para sob reproduzir
  const execPrev = () => {
    syncChannel?.postMessage({ type: 'EXEC_PREV' } as SyncMessage)
    if (slideIndex.value > 0) {
      slidesStore.updateSlideIndex(slideIndex.value - 1)
    }
    else {
      if (loopPlay.value) turnSlideToIndex(slides.value.length - 1)
      else throttleMassage('Já é a primeira página')
    }
  }
  const execNext = () => {
    syncChannel?.postMessage({ type: 'EXEC_NEXT' } as SyncMessage)
    if (slideIndex.value < slides.value.length - 1) {
      slidesStore.updateSlideIndex(slideIndex.value + 1)
    }
    else {
      if (loopPlay.value) turnSlideToIndex(0)
      else {
        throttleMassage('Já é a última página')
        closeAutoPlay()
      }
    }
  }

  // Automáticoreproduzir
  const autoPlayInterval = ref(2500)
  const autoPlay = () => {
    closeAutoPlay()
    message.success('Reprodução automática iniciada')
    autoPlayTimer.value = setInterval(execNext, autoPlayInterval.value)
  }

  const setAutoPlayInterval = (interval: number) => {
    closeAutoPlay()
    autoPlayInterval.value = interval
    autoPlay()
  }

  // mouserolagemvirar a página
  const mousewheelListener = throttle(function(e: WheelEvent) {
    if (e.deltaY < 0) execPrev()
    else if (e.deltaY > 0) execNext()
  }, 500, { leading: true, trailing: false })

  // navegação por deslize vertical em telas de toque
  const touchInfo = ref<{ x: number; y: number; } | null>(null)

  const touchStartListener = (e: TouchEvent) => {
    touchInfo.value = {
      x: e.changedTouches[0].pageX,
      y: e.changedTouches[0].pageY,
    }
  }
  const touchEndListener = (e: TouchEvent) => {
    if (!touchInfo.value) return

    const offsetX = Math.abs(touchInfo.value.x - e.changedTouches[0].pageX)
    const offsetY = e.changedTouches[0].pageY - touchInfo.value.y

    if ( Math.abs(offsetY) > offsetX && Math.abs(offsetY) > 50 ) {
      touchInfo.value = null

      if (offsetY > 0) execPrev()
      else execNext()
    }
  }

  // atalhovirar a página
  const keydownListener = throttle(function(e: KeyboardEvent) {
    const key = e.key.toUpperCase()

    if (key === KEYS.UP || key === KEYS.LEFT || key === KEYS.PAGEUP) execPrev()
    else if (
      key === KEYS.DOWN || 
      key === KEYS.RIGHT ||
      key === KEYS.SPACE || 
      key === KEYS.ENTER ||
      key === KEYS.PAGEDOWN
    ) execNext()
  }, 500, { leading: true, trailing: false })

  onMounted(() => {
    if (!isAudienceMode) document.addEventListener('keydown', keydownListener)
  })
  onUnmounted(() => {
    if (!isAudienceMode) document.removeEventListener('keydown', keydownListener)
    syncChannel?.close()
  })

  // alternar para o slide anterior/próximo
  const turnPrevSlide = () => {
    slidesStore.updateSlideIndex(slideIndex.value - 1)
  }
  const turnNextSlide = () => {
    slidesStore.updateSlideIndex(slideIndex.value + 1)
  }

  // alternar para a página especificada
  const turnSlideToIndex = (index: number) => {
    syncChannel?.postMessage({ type: 'TURN_TO_INDEX', index } as SyncMessage)
    slidesStore.updateSlideIndex(index)
  }
  const turnSlideToId = (id: string) => {
    const index = slides.value.findIndex(slide => slide.id === id)
    if (index !== -1) {
      syncChannel?.postMessage({ type: 'TURN_TO_ID', id } as SyncMessage)
      slidesStore.updateSlideIndex(index)
    }
  }

  // transmissão do estado e posição da caneta laser
  const laserPen = ref(false)

  const handleLaserMove = (e: MouseEvent) => {
    const slideEl = document.querySelector('.screen-slide-list .slide-item.current .slide-content') as HTMLElement | null
    if (!slideEl) return
    const rect = slideEl.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    syncChannel?.postMessage({ type: 'LASER_PEN_MOVE', x, y } as SyncMessage)
  }

  // versão com throttle de handleLaserMove
  const throttledHandleLaserMove = throttle(handleLaserMove, 30, { leading: true, trailing: true })

  watch(laserPen, active => {
    if (active) {
      document.addEventListener('mousemove', throttledHandleLaserMove)
    }
    else {
      document.removeEventListener('mousemove', throttledHandleLaserMove)
      syncChannel?.postMessage({ type: 'LASER_PEN_OFF' } as SyncMessage)
    }
  })

  const broadcastExit = () => {
    syncChannel?.postMessage({ type: 'EXIT' } as SyncMessage)
  }

  return {
    autoPlayTimer,
    autoPlayInterval,
    setAutoPlayInterval,
    autoPlay,
    closeAutoPlay,
    loopPlay,
    setLoopPlay,
    mousewheelListener,
    touchStartListener,
    touchEndListener,
    turnPrevSlide,
    turnNextSlide,
    turnSlideToIndex,
    turnSlideToId,
    execPrev,
    execNext,
    laserPen,
    broadcastExit,
  }
}
