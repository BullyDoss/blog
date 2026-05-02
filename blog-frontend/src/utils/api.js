const isDev = import.meta.env.DEV
const BASE_URL = isDev ? 'http://localhost:3000' : ''

export function api(url) {
  return BASE_URL + url
}

export function imgUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return (isDev ? 'http://localhost:3000' : '') + url
}
