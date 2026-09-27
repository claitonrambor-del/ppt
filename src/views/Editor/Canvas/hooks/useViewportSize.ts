import { ref, computed, onMounted, onUnmounted, watch, type ShallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'

export default (canvasRef: ShallowRef<HTMLElement | null>) => {
  const viewportLeft = ref(0)
  const viewportTop = ref(0)
  const canvasSize = ref({ width: 0, height: 0 })

  const mainStore = useMainStore()
  const { canvasPercentage, canvasScale, canvasDragged } = storeToRefs(mainStore)
  const { viewportRatio, viewportSize } = storeToRefs(useSlidesStore())

  // inicializarcanvasárea visíveldo Posição
  const initViewportPosition = () => {
    if (!canvasRef.value) return
    const canvasWidth = canvasRef.value.clientWidth
    const canvasHeight = canvasRef.value.clientHeight
    canvasSize.value = { width: canvasWidth, height: canvasHeight }

    if (canvasHeight / canvasWidth > viewportRatio.value) {
      const viewportActualWidth = canvasWidth * (canvasPercentage.value / 100)
      mainStore.setCanvasScale(viewportActualWidth / viewportSize.value)
      viewportLeft.value = (canvasWidth - viewportActualWidth) / 2
      viewportTop.value = (canvasHeight - viewportActualWidth * viewportRatio.value) / 2
    }
    else {
      const viewportActualHeight = canvasHeight * (canvasPercentage.value / 100)
      mainStore.setCanvasScale(viewportActualHeight / (viewportSize.value * viewportRatio.value))
      viewportLeft.value = (canvasWidth - viewportActualHeight / viewportRatio.value) / 2
      viewportTop.value = (canvasHeight - viewportActualHeight) / 2
    }
  }

  // atualizarcanvasárea visíveldo Posição
  const setViewportPosition = (newValue: number, oldValue: number) => {
    if (!canvasRef.value) return
    const canvasWidth = canvasRef.value.clientWidth
    const canvasHeight = canvasRef.value.clientHeight

    if (canvasHeight / canvasWidth > viewportRatio.value) {      
      const newViewportActualWidth = canvasWidth * (newValue / 100)
      const oldViewportActualWidth = canvasWidth * (oldValue / 100)
      const newViewportActualHeight = newViewportActualWidth * viewportRatio.value
      const oldViewportActualHeight = oldViewportActualWidth * viewportRatio.value

      mainStore.setCanvasScale(newViewportActualWidth / viewportSize.value)

      viewportLeft.value = viewportLeft.value - (newViewportActualWidth - oldViewportActualWidth) / 2
      viewportTop.value = viewportTop.value - (newViewportActualHeight - oldViewportActualHeight) / 2
    }
    else {
      const newViewportActualHeight = canvasHeight * (newValue / 100)
      const oldViewportActualHeight = canvasHeight * (oldValue / 100)
      const newViewportActualWidth = newViewportActualHeight / viewportRatio.value
      const oldViewportActualWidth = oldViewportActualHeight / viewportRatio.value

      mainStore.setCanvasScale(newViewportActualHeight / (viewportSize.value * viewportRatio.value))

      viewportLeft.value = viewportLeft.value - (newViewportActualWidth - oldViewportActualWidth) / 2
      viewportTop.value = viewportTop.value - (newViewportActualHeight - oldViewportActualHeight) / 2
    }
  }

  // quando true, a mudança de canvasPercentage já foi aplicada manualmente
  // (zoom centrado no cursor) e não deve ser reencaixada pelo watch abaixo
  let skipNextPercentageWatch = false

  // área visívelescala ouproporçãoao mudar, Redefinir/atualizarárea visíveldo Posição
  watch(canvasPercentage, (newValue, oldValue) => {
    if (skipNextPercentageWatch) {
      skipNextPercentageWatch = false
      return
    }
    setViewportPosition(newValue, oldValue)
  })
  watch(viewportRatio, initViewportPosition)
  watch(viewportSize, initViewportPosition)

  // ao alternar (restaurar) o estado de arraste do canvas, redefine a área visível
  watch(canvasDragged, () => {
    if (!canvasDragged.value) initViewportPosition()
  })

  // canvasárea visívelPosição e GrandePequenodo Estilo
  const viewportStyles = computed(() => ({
    width: viewportSize.value,
    height: viewportSize.value * viewportRatio.value,
    left: viewportLeft.value,
    top: viewportTop.value,
  }))

  /**
   * Altera o percentual do zoom mantendo o ponto da folha sob a âncora de tela
   * (ex.: posição do cursor) fixo na tela — zoom centrado no mouse, como em
   * editores de desenho. Sem âncora, o comportamento é o padrão (centralizado).
   * @param deltaPercentage variação do percentual (ex.: +5, -5)
   * @param anchor ponto em px de tela relativo ao canvas (opcional)
   */
  const scaleCanvasAt = (deltaPercentage: number, anchor?: { x: number; y: number }) => {
    const percentageBefore = canvasPercentage.value
    const percentageAfter = Math.max(30, Math.min(200, percentageBefore + deltaPercentage))
    if (percentageAfter === percentageBefore) return

    // sem âncora: caminho padrão (zoom centralizado via watch)
    if (!anchor) {
      mainStore.setCanvasPercentage(percentageAfter)
      return
    }

    // a escala é proporcional ao percentual: calcula a nova escala diretamente
    // (canvasScale na store só é atualizado pelo watch, de forma assíncrona)
    const scaleBefore = canvasScale.value
    const scaleAfter = scaleBefore * (percentageAfter / percentageBefore)

    // aplica manualmente escala + posição, mantendo o ponto da folha sob o
    // cursor fixo na tela (zoom centrado no mouse)
    skipNextPercentageWatch = true
    mainStore.setCanvasPercentage(percentageAfter)
    mainStore.setCanvasScale(scaleAfter)

    const paperX = (anchor.x - viewportLeft.value) / scaleBefore
    const paperY = (anchor.y - viewportTop.value) / scaleBefore
    viewportLeft.value = anchor.x - paperX * scaleAfter
    viewportTop.value = anchor.y - paperY * scaleAfter
  }

  // ao mudar o tamanho do canvas, redefine a posição da área visível
  const resizeObserver = new ResizeObserver(initViewportPosition)

  onMounted(() => {
    if (canvasRef.value) resizeObserver.observe(canvasRef.value)
  })
  onUnmounted(() => {
    if (canvasRef.value) resizeObserver.unobserve(canvasRef.value)
  })

  // arrastarcanvas
  const dragViewport = (e: MouseEvent) => {
    let isMouseDown = true

    const startPageX = e.pageX
    const startPageY = e.pageY

    const originLeft = viewportLeft.value
    const originTop = viewportTop.value

    document.onmousemove = e => {
      if (!isMouseDown) return

      const currentPageX = e.pageX
      const currentPageY = e.pageY

      viewportLeft.value = originLeft + (currentPageX - startPageX)
      viewportTop.value = originTop + (currentPageY - startPageY)
    }

    document.onmouseup = () => {
      isMouseDown = false
      document.onmousemove = null
      document.onmouseup = null

      mainStore.setCanvasDragged(true)
    }
  }

  /**
   * A folha excede a área visível do canvas em algum eixo (zoom grande):
   * nesse estado o cursor vira mãozinha e o arraste no fundo move o canvas.
   */
  const isViewportOverflow = computed(() => {
    if (canvasSize.value.width <= 0 || canvasSize.value.height <= 0) return false
    const w = viewportSize.value * canvasScale.value
    const h = viewportSize.value * viewportRatio.value * canvasScale.value
    return w > canvasSize.value.width + 1 || h > canvasSize.value.height + 1
  })

  return {
    viewportStyles,
    dragViewport,
    scaleCanvasAt,
    isViewportOverflow,
  }
}