<template>
  <div 
    class="measure-ruler-wrap"
    :style="{
      left: left + 'px',
      top: top + 'px',
      width: LENGTH_PX + 'px',
      transform: `rotate(${rotate}deg)`,
    }"
    @mousedown.stop="handleRulerDown"
    @touchstart.stop="handleRulerDown"
    @wheel.stop
  >
    <div class="ruler-body">
      <template v-for="n in 30" :key="`tick-${n}`">
        <div class="tick major" :style="tickStyle(n * 10)">
          <span class="tick-label">{{ n * 10 }}</span>
        </div>
        <div class="tick half" :style="tickStyle(n * 10 - 5)"></div>
        <div class="tick minor" :style="tickStyle(n * 10 - 1)"></div>
        <div class="tick minor" :style="tickStyle(n * 10 - 2)"></div>
        <div class="tick minor" :style="tickStyle(n * 10 - 3)"></div>
        <div class="tick minor" :style="tickStyle(n * 10 - 4)"></div>
        <div class="tick minor" :style="tickStyle(n * 10 - 6)"></div>
        <div class="tick minor" :style="tickStyle(n * 10 - 7)"></div>
        <div class="tick minor" :style="tickStyle(n * 10 - 8)"></div>
        <div class="tick minor" :style="tickStyle(n * 10 - 9)"></div>
      </template>

      <!-- marca final 300 -->
      <div class="tick major end">
        <span class="tick-label">300</span>
      </div>
    </div>

    <!-- âncora do pivô: elemento de tamanho zero usado para localizar a ponta A na tela -->
    <div class="pivot-anchor" ref="pivotAnchorRef"></div>

    <!-- zona de rotação: Shift+arraste = rotação livre; clique = +45° com imã em 0/90/180/270 -->
    <div 
      class="rotate-handle"
      :class="{ 'magnetized': magnetized }"
      v-tooltip="'Girar 45° · Shift + arraste = rotação livre'"
      @mousedown.stop="handleRotateDown"
      @touchstart.stop="handleRotateDown"
    >↻</div>

    <!-- leitura em tempo real das pontas, relativa à origem da folha (0,0) -->
    <div class="ruler-readout" :class="{ 'magnetized': magnetized || guideSnapped }">
      <span class="readout-item">A: {{ readoutA }} mm</span>
      <span class="readout-item">B: {{ readoutB }} mm</span>
      <span class="readout-item">∠: {{ Math.round(rotate) }}°{{ magnetized ? ' ⌐' : '' }}{{ guideSnapped ? ' ⌶' : '' }}</span>
    </div>

    <!-- indicador de imã ativo: nas guias de margem ou nas bordas da folha -->
    <div class="guide-magnet-badge" :class="{ 'edge': snappedOnEdge }" v-if="guideSnapped">
      {{ snappedOnEdge ? '⌶ borda' : '⌶ margem' }}
    </div>

    <!-- botão liga/desliga do imã de encaixe -->
    <div
      class="magnet-toggle"
      :class="{ 'off': !magnetEnabled }"
      v-tooltip="magnetEnabled ? 'Imã de margens: ativado · clique para desativar' : 'Imã de margens: desativado · clique para ativar'"
      @mousedown.stop
      @touchstart.stop
      @click="toggleMagnet"
    >🧲</div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import { MM_TO_PX, PX_TO_MM, MEASURE_RULER_LENGTH_MM, formatMM } from '@/configs/units'
import { resolveMargins, type Margins } from '@/modules/margins'
import useMeasureRulerGuides from './hooks/useMeasureRulerGuides'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { canvasScale } = storeToRefs(mainStore)
const { currentSlide, viewportSize, viewportRatio } = storeToRefs(slidesStore)
const { setSnappedGuides, clearSnappedGuides } = useMeasureRulerGuides()

// âncora do pivô: elemento de tamanho zero no canto A do wrap;
// seu getBoundingClientRect já inclui todas as transformações (escala + rotação),
// o que torna a localização do pivô na tela exata e trivial
const pivotAnchorRef = useTemplateRef<HTMLElement>('pivotAnchorRef')

// comprimento da régua em px lógicos do canvas (escala física: 1000px = 210mm).
// como o componente vive dentro da folha (.viewport), o zoom do canvas escala a
// régua proporcionalmente — ela mede sempre 300mm reais na folha configurada.
const LENGTH_PX = MM_TO_PX(MEASURE_RULER_LENGTH_MM)

// imã de encaixe ligado/desligado (persistente na store, sobrevive ao fechamento da régua)
const magnetEnabled = computed({
  get: () => mainStore.measureRulerMagnet,
  set: (value: boolean) => mainStore.setMeasureRulerMagnet(value),
})
const toggleMagnet = () => {
  magnetEnabled.value = !magnetEnabled.value
  // ao desligar, libera qualquer guia capturada
  if (!magnetEnabled.value) clearSnappedGuides()
}

// posição da ponta A em px lógicos do canvas (relativa à origem da folha)
const left = ref(MM_TO_PX(15))
const top = ref(MM_TO_PX(15))

// rotação em graus; pivô no canto A (transform-origin: 0 0)
const rotate = ref(0)

// ângulos com encaixe magnético (imã): horizontal e vertical
const MAGNET_ANGLES = [0, 90, 180, 270, 360]
const MAGNET_THRESHOLD_DEG = 5

// indica que a rotação está encaixada em um ângulo magnético (para feedback visual)
const magnetized = ref(false)

// normaliza o ângulo para o intervalo [0, 360)
const normalizeAngle = (deg: number) => ((deg % 360) + 360) % 360

// aplica o imã: se o ângulo estiver próximo de 0/90/180/270, encaixa nele
const applyMagnet = (deg: number): { angle: number; snapped: boolean } => {
  const norm = normalizeAngle(deg)
  for (const target of MAGNET_ANGLES) {
    const delta = Math.abs(norm - target)
    const deltaWrapped = Math.min(delta, 360 - delta)
    if (deltaWrapped <= MAGNET_THRESHOLD_DEG) return { angle: normalizeAngle(target), snapped: true }
  }
  return { angle: norm, snapped: false }
}

// coordenadas da ponta A em mm (relativas à origem da folha)
const readoutA = computed(() => `${formatMM(PX_TO_MM(left.value))}, ${formatMM(PX_TO_MM(top.value))}`)

// coordenadas da ponta B (fim dos 300mm) em mm, na direção da rotação
const readoutB = computed(() => `${formatMM(PX_TO_MM(pointB.value.x))}, ${formatMM(PX_TO_MM(pointB.value.y))}`)

const tickStyle = (mm: number) => {
  return { left: `${mm / MEASURE_RULER_LENGTH_MM * 100}%` }
}

// --- imã das pontas nas guias de margem e bordas da folha ---
// guias verticais: borda esquerda (0), margemL, largura - margemR e borda direita;
// guias horizontais: borda superior (0), margemT, altura - margemB e borda inferior
// (px lógicos do canvas, a partir do canto 0,0 da folha)
const marginGuidesX = computed(() => {
  const m: Margins = resolveMargins(currentSlide.value)
  return [0, m.left, viewportSize.value - m.right, viewportSize.value]
})
const marginGuidesY = computed(() => {
  const m: Margins = resolveMargins(currentSlide.value)
  const h = viewportSize.value * viewportRatio.value
  return [0, m.top, h - m.bottom, h]
})

/** limiar de encaixe em px de tela (imã percebível em qualquer zoom) */
const MAGNET_GUIDE_PX = 10

// ponta da régua (A ou B) em px lógicos, dada a rotação atual
const pointPos = (origin: { x: number; y: number }, rad: number, length: number) => ({
  x: origin.x + Math.cos(rad) * length,
  y: origin.y + Math.sin(rad) * length,
})

// posição da ponta B em px lógicos (fonte única para leitura e imã)
const pointB = computed(() => pointPos(
  { x: left.value, y: top.value },
  rotate.value * Math.PI / 180,
  LENGTH_PX,
))

// aplica o imã de margens: retorna o offset (dx, dy) a somar à posição.
// em cada eixo, escolhe sempre o alvo MAIS PRÓXIMO da ponta (não o primeiro
// da lista), evitando encaixes sorrateiros num alvo distante quando outro
// está mais perto.
const snapAxisToGuides = (value: number, guides: number[]): { delta: number; target: number } | null => {
  const threshold = MAGNET_GUIDE_PX / canvasScale.value
  let best: { delta: number; target: number } | null = null
  let bestDist = Infinity
  for (const g of guides) {
    const delta = g - value
    const dist = Math.abs(delta)
    if (dist <= threshold && dist < bestDist) {
      bestDist = dist
      best = { delta, target: g }
    }
  }
  return best
}

// captura de guias: coordenada capturada (null = nenhuma)
const snappedGuideX = ref<number | null>(null)
const snappedGuideY = ref<number | null>(null)
const guideSnapped = computed(() => snappedGuideX.value !== null || snappedGuideY.value !== null)

// true quando a captura ocorreu numa borda da folha (0 ou largura/altura),
// false quando foi numa guia de margem interna
const snappedOnEdge = computed(() => {
  const m = resolveMargins(currentSlide.value)
  const w = viewportSize.value
  const h = w * viewportRatio.value
  const isEdgeX = (x: number | null) => x !== null && (Math.abs(x) < 0.01 || Math.abs(x - w) < 0.01)
  const isEdgeY = (y: number | null) => y !== null && (Math.abs(y) < 0.01 || Math.abs(y - h) < 0.01)
  return isEdgeX(snappedGuideX.value) || isEdgeY(snappedGuideY.value)
})

// --- arrastar a régua inteira ---
// os deltas do mouse são em px de tela: dividir por canvasScale converte para
// px lógicos do canvas, mantendo a régua "colada" na folha em qualquer zoom
const dragState = ref<null | { startX: number; startY: number; originLeft: number; originTop: number }>(null)

const handleRulerDown = (e: MouseEvent | TouchEvent) => {
  const point = 'touches' in e ? e.touches[0] : e
  dragState.value = {
    startX: point.clientX,
    startY: point.clientY,
    originLeft: left.value,
    originTop: top.value,
  }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
  window.addEventListener('touchmove', onDragMove)
  window.addEventListener('touchend', onDragEnd)
}

const onDragMove = (e: MouseEvent | TouchEvent) => {
  if (!dragState.value) return
  const point = 'touches' in e ? e.touches[0] : e
  let nextLeft = dragState.value.originLeft + (point.clientX - dragState.value.startX) / canvasScale.value
  let nextTop = dragState.value.originTop + (point.clientY - dragState.value.startY) / canvasScale.value

  // imã de margens: avalia as duas pontas e encaixa na guia mais próxima de
  // cada eixo (X e Y são independentes); desligável pelo botão 🧲
  snappedGuideX.value = null
  snappedGuideY.value = null
  setSnappedGuides(null, null)

  if (magnetEnabled.value) {
    const rad = rotate.value * Math.PI / 180
    const a = { x: nextLeft, y: nextTop }
    const b = pointPos(a, rad, LENGTH_PX)

    const snapAX = snapAxisToGuides(a.x, marginGuidesX.value)
    const snapAY = snapAxisToGuides(a.y, marginGuidesY.value)
    const snapBX = snapAxisToGuides(b.x, marginGuidesX.value)
    const snapBY = snapAxisToGuides(b.y, marginGuidesY.value)

    // por eixo, vence a ponta com a distância de encaixe menor
    const chooseX = !snapAX || (snapBX && Math.abs(snapBX.delta) < Math.abs(snapAX.delta)) ? snapBX : snapAX
    const chooseY = !snapAY || (snapBY && Math.abs(snapBY.delta) < Math.abs(snapAY.delta)) ? snapBY : snapAY

    if (chooseX) {
      nextLeft += chooseX.delta
      snappedGuideX.value = chooseX.target
    }
    if (chooseY) {
      nextTop += chooseY.delta
      snappedGuideY.value = chooseY.target
    }
  }

  setSnappedGuides(snappedGuideX.value, snappedGuideY.value)

  left.value = nextLeft
  top.value = nextTop
}

const onDragEnd = () => {
  dragState.value = null
  snappedGuideX.value = null
  snappedGuideY.value = null
  clearSnappedGuides()
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('touchmove', onDragMove)
  window.removeEventListener('touchend', onDragEnd)
}

// --- rotação ---
// clique simples: gira +45° e aplica o imã em 0/90/180/270
// Shift + arraste: rotação livre seguindo o mouse ao redor do pivô (ponto A)
const handleRotateDown = (e: MouseEvent | TouchEvent) => {
  e.preventDefault()

  // Shift pressionado: inicia rotação livre
  if ('shiftKey' in e && e.shiftKey || (e as TouchEvent).touches) {
    startFreeRotate(e)
    return
  }

  const next = applyMagnet(rotate.value + 45)
  rotate.value = next.angle
  magnetized.value = next.snapped
}

const rotateState = ref<null | { centerX: number; centerY: number }>(null)

const startFreeRotate = (e: MouseEvent | TouchEvent) => {
  // pivô da rotação: a ponta A da régua em coordenadas de tela,
  // obtida diretamente da âncora (elemento de tamanho zero no canto A)
  const anchor = pivotAnchorRef.value
  if (!anchor) return
  const rect = anchor.getBoundingClientRect()
  rotateState.value = { centerX: rect.left, centerY: rect.top }

  const point = 'touches' in e ? e.touches[0] : e
  const startAngle = Math.atan2(point.clientY - rect.top, point.clientX - rect.left) * 180 / Math.PI
  rotateStateStart.value = { angle: startAngle, rotation: rotate.value }

  window.addEventListener('mousemove', onFreeRotateMove)
  window.addEventListener('mouseup', onFreeRotateEnd)
  window.addEventListener('touchmove', onFreeRotateMove)
  window.addEventListener('touchend', onFreeRotateEnd)
}

const rotateStateStart = ref<null | { angle: number; rotation: number }>(null)

const onFreeRotateMove = (e: MouseEvent | TouchEvent) => {
  if (!rotateState.value || !rotateStateStart.value) return
  const point = 'touches' in e ? e.touches[0] : e
  const currentAngle = Math.atan2(point.clientY - rotateState.value.centerY, point.clientX - rotateState.value.centerX) * 180 / Math.PI

  let next = rotateStateStart.value.rotation + (currentAngle - rotateStateStart.value.angle)

  // sem Shift (caso solto durante o arraste): aplica o imã
  const shiftPressed = 'shiftKey' in e && e.shiftKey
  if (!shiftPressed) {
    const snapped = applyMagnet(next)
    next = snapped.angle
    magnetized.value = snapped.snapped
  }
  else magnetized.value = false

  rotate.value = next
}

const onFreeRotateEnd = () => {
  // ao soltar, se estiver perto de um ângulo magnético, encaixa definitivamente
  const snapped = applyMagnet(rotate.value)
  rotate.value = snapped.angle
  magnetized.value = snapped.snapped

  rotateState.value = null
  rotateStateStart.value = null
  window.removeEventListener('mousemove', onFreeRotateMove)
  window.removeEventListener('mouseup', onFreeRotateEnd)
  window.removeEventListener('touchmove', onFreeRotateMove)
  window.removeEventListener('touchend', onFreeRotateEnd)
}
</script>

<style lang="scss" scoped>
.measure-ruler-wrap {
  position: absolute;
  height: 30px;
  z-index: 9999;
  cursor: grab;
  user-select: none;
  transform-origin: 0 0;

  &:active {
    cursor: grabbing;
  }
}

// corpo da régua: a aresta superior é a linha de medição (origem das marcas)
.ruler-body {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #fdfdfc 0%, #f2efe4 100%);
  border: 1px solid #b5ae97;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
}
.tick {
  position: absolute;
  top: 0;
  background: #4a463a;

  &.major {
    width: 1.5px;
    height: 14px;
  }
  &.half {
    width: 1px;
    height: 9px;
  }
  &.minor {
    width: 1px;
    height: 5px;
  }
  &.end {
    width: 2px;
    left: auto !important;
    right: 0;
  }

  .tick-label {
    position: absolute;
    top: 15px;
    left: 0;
    transform: translateX(-50%);
    font-size: 10px;
    font-weight: 700;
    color: #4a463a;
    white-space: nowrap;
  }
}

// âncora do pivô (tamanho zero, posicionada exatamente no canto A)
.pivot-anchor {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.rotate-handle {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #4a463a;
  color: #fff;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  // feedback visual do imã: verde quando encaixado em 0/90/180/270
  &.magnetized {
    background: #2e7d32;
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.35);
  }
}

.ruler-readout {
  position: absolute;
  top: 32px;
  left: 0;
  display: flex;
  gap: 8px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid $borderColor;
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
  pointer-events: none;

  .readout-item {
    font-weight: 700;
    color: $themeColor;
  }

  // feedback visual do imã na leitura do ângulo
  &.magnetized .readout-item:last-child {
    color: #2e7d32;
  }
}

// badge de captura: verde para margem, laranja para borda da folha
.guide-magnet-badge {
  position: absolute;
  top: 32px;
  right: 0;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #2e7d32;
  border-radius: 3px;
  padding: 1px 5px;
  pointer-events: none;
  white-space: nowrap;

  &.edge {
    background: #e07b00;
  }
}

// botão liga/desliga do imã de encaixe
.magnet-toggle {
  position: absolute;
  bottom: 1px;
  right: 16px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fff;
  font-size: 8px;
  line-height: 13px;
  text-align: center;
  cursor: pointer;
  filter: grayscale(0);
  transition: opacity 0.2s;

  // desligado: apagado e opaco, para deixar claro que não há encaixe ativo
  &.off {
    filter: grayscale(1);
    opacity: 0.45;
  }
}
</style>
