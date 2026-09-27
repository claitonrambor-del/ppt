import CryptoJS from 'crypto-js'

const CRYPTO_KEY = 'pptist'

/**
 * criptografar
 * @param msg aguardarcriptografarstring
 */
export const encrypt = (msg: string) => {
  return CryptoJS.AES.encrypt(msg, CRYPTO_KEY).toString()
}

/**
 * descriptografar
 * @param ciphertext aguardardescriptografarstring
 */
export const decrypt = (ciphertext: string) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, CRYPTO_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}