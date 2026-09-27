import { defineStore } from 'pinia'

export interface ScreenState {
  screening: boolean
}

export const useScreenStore = defineStore('screen', {
  state: (): ScreenState => ({
    screening: false, // Se está em modo de apresentação
  }),

  actions: {
    setScreening(screening: boolean) {
      this.screening = screening
    },
  },
})