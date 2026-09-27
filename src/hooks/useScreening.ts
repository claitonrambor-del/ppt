import { useScreenStore, useSlidesStore } from '@/store'
import { enterFullscreen, exitFullscreen, isFullscreen } from '@/utils/fullscreen'

export default () => {
  const screenStore = useScreenStore()
  const slidesStore = useSlidesStore()

  // entrar em apresentação (a partir da página atual)
  const enterScreening = () => {
    enterFullscreen()
    screenStore.setScreening(true)
  }

  // entrar em apresentação (a partir da primeira página)
  const enterScreeningFromStart = () => {
    slidesStore.updateSlideIndex(0)
    enterScreening()
  }

  // Sair da apresentaçãoestado
  const exitScreening = () => {
    screenStore.setScreening(false)
    if (isFullscreen()) exitFullscreen()
  }

  return {
    enterScreening,
    enterScreeningFromStart,
    exitScreening,
  }
}