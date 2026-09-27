import { padStart } from 'lodash'

/**
 * completa o número de dígitos
 * dígito
 * @param len posiçãonúmero
 */
export const fillDigit = (digit: number, len: number) => {
  return padStart('' + digit, len, '0')
}

/**
 * verificardispositivo
 */
export const isPC = () => {
  return !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|Mobile|BlackBerry|Symbian|Windows Phone)/i)
}

/**
 * verificarURLstring
 */
export const isValidURL = (url: string) => {
  return /^(https?:\/\/)([\w-]+\.)+[\w-]{2,}(\/[\w-./?%&=]*)?$/i.test(url)
}

/**
 * HTML para texto simples
 */
export const htmlToText = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

/**
 * comparação de ponto flutuante
 */
export const isFloatEqual = (a: number, b: number, epsilon = 1e-10) => {
  return Math.abs(a - b) < epsilon
}

/**
 * conversão com casas decimais
 */
export const toFixed = (num: number, fractionDigits = 1) => {
  if (num % 1 !== 0) {
    return parseFloat(num.toFixed(fractionDigits))
  } 
  return Math.floor(num)
}