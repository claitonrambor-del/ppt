import { defineStore } from 'pinia'
import { omit } from 'lodash'
import type { Slide, SlideTheme, PPTElement, SlideTemplate } from '@/types/slides'

interface RemovePropData {
  id: string
  propName: string | string[]
}

interface UpdateElementData {
  id: string | string[]
  props: Partial<PPTElement>
  slideId?: string
}

export interface SlidesState {
  title: string
  theme: SlideTheme
  slides: Slide[]
  slideIndex: number
  viewportSize: number
  viewportRatio: number
  templates: SlideTemplate[]
}

export const useSlidesStore = defineStore('slides', {
  state: (): SlidesState => ({
    title: 'Apresentação sem título', // Título dos slides
    theme: {
      themeColors: ['#5b9bd5', '#ed7d31', '#a5a5a5', '#ffc000', '#4472c4', '#70ad47'],
      fontColor: '#333',
      fontName: '',
      backgroundColor: '#fff',
      shadow: {
        h: 3,
        v: 3,
        blur: 2,
        color: '#808080',
      },
      outline: {
        width: 2,
        color: '#525252',
        style: 'solid',
      },
    }, // Estilo do tema
    slides: [], // Dados das páginas de slides
    slideIndex: 0, // Índice da página atual
    viewportSize: 1000, // Base da largura da área visível
    viewportRatio: 0.5625, // Proporção da área visível, padrão 16:9
    templates: [
      { name: 'Vermelho Montanhês', id: 'template_1', cover: './imgs/template_1.webp', origin: 'Feito oficialmente' },
      { name: 'Azul Urbano', id: 'template_2', cover: './imgs/template_2.webp', origin: 'Feito oficialmente' },
      { name: 'Geometria Tech', id: 'template_3', cover: './imgs/template_3.webp', origin: 'Feito oficialmente' },
      { name: 'Morandi Suave', id: 'template_4', cover: './imgs/template_4.webp', origin: 'Feito oficialmente' },
      { name: 'Verde Minimalista', id: 'template_5', cover: './imgs/template_5.webp', origin: 'Contribuição da comunidade + refinamento oficial' },
      { name: 'Retrô Quente', id: 'template_6', cover: './imgs/template_6.webp', origin: 'Contribuição da comunidade + refinamento oficial' },
      { name: 'Profundo e Sério', id: 'template_7', cover: './imgs/template_7.webp', origin: 'Contribuição da comunidade + refinamento oficial' },
      { name: 'Azul Fresco', id: 'template_8', cover: './imgs/template_8.webp', origin: 'Contribuição da comunidade + refinamento oficial' },
    ], // Modelo
  }),

  getters: {
    currentSlide(state) {
      return state.slides[state.slideIndex]
    },
  
  },

  actions: {
    setTitle(title: string) {
      if (!title) this.title = 'Apresentação sem título'
      else this.title = title
    },

    setTheme(themeProps: Partial<SlideTheme>) {
      this.theme = { ...this.theme, ...themeProps }
    },
  
    setViewportSize(size: number) {
      this.viewportSize = size
    },
  
    setViewportRatio(viewportRatio: number) {
      this.viewportRatio = viewportRatio
    },
  
    setSlides(slides: Slide[], themeProps?: Partial<SlideTheme>) {
      this.slides = slides
      if (themeProps) this.setTheme(themeProps)
    },
  
    setTemplates(templates: SlideTemplate[]) {
      this.templates = templates
    },
  
    addSlide(slide: Slide | Slide[]) {
      const slides = Array.isArray(slide) ? slide : [slide]
      for (const slide of slides) {
        if (slide.sectionTag) delete slide.sectionTag
      }

      const addIndex = this.slideIndex + 1
      this.slides.splice(addIndex, 0, ...slides)
      this.slideIndex = addIndex
    },
  
    updateSlide(props: Partial<Slide>, slideId?: string) {
      const slideIndex = slideId ? this.slides.findIndex(item => item.id === slideId) : this.slideIndex
      this.slides[slideIndex] = { ...this.slides[slideIndex], ...props }
    },
  
    removeSlideProps(data: RemovePropData) {
      const { id, propName } = data

      const slides = this.slides.map(slide => {
        return slide.id === id ? omit(slide, propName) : slide
      }) as Slide[]
      this.slides = slides
    },
  
    deleteSlide(slideId: string | string[]) {
      const slidesId = Array.isArray(slideId) ? slideId : [slideId]
      const slides: Slide[] = JSON.parse(JSON.stringify(this.slides))
  
      const deleteSlidesIndex = []
      for (const deletedId of slidesId) {
        const index = slides.findIndex(item => item.id === deletedId)
        deleteSlidesIndex.push(index)

        const deletedSlideSection = slides[index].sectionTag
        if (deletedSlideSection) {
          const handleSlideNext = slides[index + 1]
          if (handleSlideNext && !handleSlideNext.sectionTag) {
            delete slides[index].sectionTag
            slides[index + 1].sectionTag = deletedSlideSection
          }
        }

        slides.splice(index, 1)
      }
      let newIndex = Math.min(...deleteSlidesIndex)
  
      const maxIndex = slides.length - 1
      if (newIndex > maxIndex) newIndex = maxIndex
  
      this.slideIndex = newIndex
      this.slides = slides
    },
  
    updateSlideIndex(index: number) {
      this.slideIndex = index
    },
  
    addElement(element: PPTElement | PPTElement[]) {
      const elements = Array.isArray(element) ? element : [element]
      const currentSlideEls = this.slides[this.slideIndex].elements
      const newEls = [...currentSlideEls, ...elements]
      this.slides[this.slideIndex].elements = newEls
    },

    deleteElement(elementId: string | string[]) {
      const elementIdList = Array.isArray(elementId) ? elementId : [elementId]
      const currentSlideEls = this.slides[this.slideIndex].elements
      const newEls = currentSlideEls.filter(item => !elementIdList.includes(item.id))
      this.slides[this.slideIndex].elements = newEls
    },
  
    updateElement(data: UpdateElementData) {
      const { id, props, slideId } = data
      const elIdList = typeof id === 'string' ? [id] : id

      const slideIndex = slideId ? this.slides.findIndex(item => item.id === slideId) : this.slideIndex
      const slide = this.slides[slideIndex]
      const elements = slide.elements.map(el => {
        return elIdList.includes(el.id) ? { ...el, ...props } : el
      })
      this.slides[slideIndex].elements = (elements as PPTElement[])
    },
  
    removeElementProps(data: RemovePropData) {
      const { id, propName } = data
      const propsNames = typeof propName === 'string' ? [propName] : propName
  
      const slideIndex = this.slideIndex
      const slide = this.slides[slideIndex]
      const elements = slide.elements.map(el => {
        return el.id === id ? omit(el, propsNames) : el
      })
      this.slides[slideIndex].elements = (elements as PPTElement[])
    },
  },
})