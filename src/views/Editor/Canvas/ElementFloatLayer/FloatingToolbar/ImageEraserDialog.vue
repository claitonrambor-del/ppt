<template>
  <div class="image-eraser-dialog">
    <div class="header">
      <div class="title">Borracha mágica</div>
      <div class="description">Pinte sobre a área que deseja remover e clique em Apagar. O conteúdo ao redor preenche o espaço automaticamente.</div>
    </div>

    <div
      class="canvas-wrap"
      @pointerdown="$event => handlePointerDown($event)"
      @pointermove="$event => handlePointerMove($event)"
      @pointerup="handlePointerUp()"
      @pointercancel="handlePointerUp()"
      @pointerleave="handlePointerLeave()"
    >
      <canvas ref="canvasRef"></canvas>
      <div class="loading-mask" v-if="erasing">
        <i-icon-park-outline:loading-four class="loading-icon" />
        <span>Apagando…</span>
      </div>
    </div>

    <div class="tools">
      <div class="tool-row">
        <span class="label">Tamanho:</span>
        <Slider
          class="slider"
          :min="5"
          :max="120"
          :step="1"
          :value="brushSize"
          unit="px"
          @update:value="value => brushSize = value as number"
        />
        <span class="size-value">{{ brushSize }}px</span>
      </div>
      <div class="tool-row">
        <Button size="small" @click="undoStroke()" :disabled="strokes.length === 0 || erasing">
          <i-icon-park-outline:undo class="icon" /> Desfazer
        </Button>
        <Button size="small" @click="clearStrokes()" :disabled="strokes.length === 0 || erasing">
          <i-icon-park-outline:clear class="icon" /> Limpar
        </Button>
      </div>
    </div>

    <div class="footer">
      <Button type="default" @click="emit('close')" :disabled="erasing">Cancelar</Button>
      <Button type="primary" @click="erase()" :disabled="strokes.length === 0 || erasing">Apagar</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import type { PPTImageElement } from '@/types/slides'
import message from '@/utils/message'

import Slider from '@/components/Slider.vue'
import Button from '@/components/Button.vue'

const props = defineProps<{
  elementInfo: PPTImageElement
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'erased', payload: { dataURL: string }): void
}>()

const BRUSH_COLOR = 'rgba(0, 140, 255, 0.55)'
const MAX_CANVAS_SIZE = 2048

/* ---------- referências / estado ---------- */
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

const brushSize = ref(40)
const isPainting = ref(false)
const erasing = ref(false)
const strokes = ref<{ size: number; points: { x: number; y: number }[] }[]>([])

let currentPoints: { x: number; y: number }[] = []
let originImage: HTMLImageElement | HTMLCanvasElement | null = null
let rafId = 0

/* ---------- carregamento da imagem original ---------- */
const loadImage = () => new Promise<void>((resolve, reject) => {
  const img = new Image()
  img.onload = () => {
    originImage = img
    resolve()
  }
  img.onerror = reject
  img.src = props.elementInfo.src
})

/* ---------- desenho ---------- */
const drawStrokeOn = (
  ctx: CanvasRenderingContext2D,
  size: number,
  points: { x: number; y: number }[],
  color: string,
) => {
  if (!points.length) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = size
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (points.length === 1) {
    ctx.beginPath()
    ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }
  else {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
    ctx.stroke()
  }
  ctx.restore()
}

const drawScene = () => {
  const canvas = canvasRef.value
  if (!canvas || !originImage) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(originImage, 0, 0, canvas.width, canvas.height)
  for (const stroke of strokes.value) {
    drawStrokeOn(ctx, stroke.size, stroke.points, BRUSH_COLOR)
  }
}

/* laço de renderização leve: redesenha no máximo uma vez por quadro */
const scheduleRender = () => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    drawScene()
    const ctx = canvasRef.value?.getContext('2d')
    if (ctx && currentPoints.length) drawStrokeOn(ctx, brushSize.value, currentPoints, BRUSH_COLOR)
    if (isPainting.value) scheduleRender()
  })
}

/* ---------- interação de pintura ---------- */
const getCanvasPoint = (e: PointerEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  }
}

const handlePointerDown = (e: PointerEvent) => {
  if (erasing.value) return
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  isPainting.value = true
  currentPoints = []
  const point = getCanvasPoint(e)
  if (point) currentPoints.push(point)
  scheduleRender()
}

const handlePointerMove = (e: PointerEvent) => {
  if (!isPainting.value) return
  const point = getCanvasPoint(e)
  if (point) currentPoints.push(point)
  scheduleRender()
}

const finishStroke = () => {
  if (currentPoints.length) {
    strokes.value.push({ size: brushSize.value, points: currentPoints })
    currentPoints = []
  }
  drawScene()
}

const handlePointerUp = () => {
  if (!isPainting.value) return
  isPainting.value = false
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  finishStroke()
}

const handlePointerLeave = () => {
  if (!isPainting.value) return
  handlePointerUp()
}

/* ---------- desfazer / limpar ---------- */
const undoStroke = () => {
  strokes.value.pop()
  drawScene()
}

const clearStrokes = () => {
  strokes.value = []
  drawScene()
}

/* ---------- apagar (preenchimento por difusão a partir das bordas) ---------- */
const erase = async () => {
  if (!strokes.value.length || erasing.value) return
  const canvas = canvasRef.value
  if (!canvas) return

  erasing.value = true

  try {
    await nextTick()

    const w = canvas.width
    const h = canvas.height
    const ctx = canvas.getContext('2d')!

    // máscara com os traços do usuário
    const mask = document.createElement('canvas')
    mask.width = w
    mask.height = h
    const maskCtx = mask.getContext('2d')!
    for (const stroke of strokes.value) {
      drawStrokeOn(maskCtx, stroke.size, stroke.points, '#000')
    }
    const maskData = maskCtx.getImageData(0, 0, w, h).data

    const imageData = ctx.getImageData(0, 0, w, h)
    const result = imageData.data

    const masked = new Uint8Array(w * h)
    const resolved = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) {
      if (maskData[i * 4 + 3] > 10) masked[i] = 1
      else resolved[i] = 1
    }

    // itera sobre os 8 vizinhos do pixel i (com checagem de bordas)
    const forEachNeighbor = (i: number, fn: (j: number) => void) => {
      const x = i % w
      const y = (i - x) / w
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= h) continue
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          if (nx < 0 || nx >= w) continue
          fn(ny * w + nx)
        }
      }
    }

    // preenchimento estilo "casca de cebola": partindo das bordas da máscara,
    // cada pixel assume a média dos vizinhos já resolvidos (difusão para dentro)
    const queue: number[] = []
    const enqueued = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) {
      if (!masked[i]) continue
      let hasResolvedNeighbor = false
      forEachNeighbor(i, j => {
        if (resolved[j]) hasResolvedNeighbor = true
      })
      if (hasResolvedNeighbor) {
        queue.push(i)
        enqueued[i] = 1
      }
    }

    let head = 0
    while (head < queue.length) {
      const i = queue[head++]

      let r = 0, g = 0, b = 0, a = 0, count = 0
      forEachNeighbor(i, j => {
        if (!resolved[j]) return
        const p = j * 4
        r += result[p]
        g += result[p + 1]
        b += result[p + 2]
        a += result[p + 3]
        count++
      })
      if (!count) continue

      const p = i * 4
      result[p] = r / count
      result[p + 1] = g / count
      result[p + 2] = b / count
      result[p + 3] = a / count
      resolved[i] = 1

      // vizinhos da área apagada elegíveis assim que ganham um vizinho resolvido
      forEachNeighbor(i, j => {
        if (masked[j] && !resolved[j] && !enqueued[j]) {
          queue.push(j)
          enqueued[j] = 1
        }
      })
    }

    ctx.putImageData(imageData, 0, 0)

    // atualiza a base com o resultado (permite apagar várias vezes na mesma sessão)
    const base = document.createElement('canvas')
    base.width = w
    base.height = h
    base.getContext('2d')!.drawImage(canvas, 0, 0)
    originImage = base

    strokes.value = []
    drawScene()

    emit('erased', { dataURL: canvas.toDataURL('image/png') })
    message.success('Área apagada com sucesso')
  }
  catch {
    message.error('Não foi possível apagar a área selecionada')
  }
  finally {
    erasing.value = false
  }
}

/* ---------- ciclo de vida ---------- */
onMounted(async () => {
  try {
    await loadImage()
  }
  catch {
    message.error('Não foi possível carregar a imagem')
    return
  }
  const canvas = canvasRef.value
  if (!canvas || !originImage) return
  const img = originImage as HTMLImageElement
  const scale = Math.min(1, MAX_CANVAS_SIZE / Math.max(img.naturalWidth, img.naturalHeight))
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  drawScene()
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style lang="scss" scoped>
.image-eraser-dialog {
  display: flex;
  flex-direction: column;
}
.header {
  .title {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .description {
    font-size: 12px;
    color: #999;
    margin-bottom: 12px;
  }
}
.canvas-wrap {
  position: relative;
  width: 100%;
  max-height: 55vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  border: 1px solid $borderColor;
  border-radius: $borderRadius;
  overflow: auto;
  background-color: #fff;
  touch-action: none;
  cursor: crosshair;

  canvas {
    max-width: 100%;
    height: auto;
    display: block;
  }
}
.loading-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  background-color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  color: $textColor;
}
.loading-icon {
  font-size: 24px;
  color: $themeColor;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.tools {
  margin-top: 12px;

  .tool-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    & + .tool-row {
      gap: 8px;
    }
  }
  .label {
    width: 70px;
    font-size: 12px;
    color: $textColor;
    flex-shrink: 0;
  }
  .slider {
    flex: 1;
  }
  .size-value {
    width: 48px;
    text-align: right;
    font-size: 12px;
    color: $textColor;
  }
  .icon {
    margin-right: 3px;
  }
}
.footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}
</style>
