// 이미지 관련 헬퍼: URL→dataURL 변환, 썸네일 축소.
// 모두 절대 throw로 앱을 멈추지 않도록 사용처에서 try/catch 하거나, 실패 시 원본을 반환한다.

/** Blob을 dataURL 문자열로 변환 */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('파일을 읽지 못했어요'))
    reader.readAsDataURL(blob)
  })
}

/** dataURL/URL을 <img>로 로드 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이미지를 불러오지 못했어요'))
    img.src = src
  })
}

/**
 * 이미지 URL(예: /samples/dog-1.jpg)을 가져와 base64 dataURL로 변환한다.
 * 샘플 이미지를 업로드 흐름(onSelect)에 그대로 태우기 위해 사용.
 * @param {string} url
 * @returns {Promise<string>} dataURL
 */
export async function urlToDataUrl(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`이미지 요청 실패 (${res.status})`)
  const blob = await res.blob()
  return blobToDataUrl(blob)
}

/**
 * dataURL을 캔버스로 축소해 더 작은 JPEG dataURL로 만든다(localStorage 용량 절약용).
 * 실패하면 원본 dataURL을 그대로 반환한다(앱이 죽지 않도록).
 * @param {string} dataUrl
 * @param {number} [maxEdge=600] 긴 변 최대 픽셀
 * @param {number} [quality=0.72] JPEG 품질(0~1)
 * @returns {Promise<string>}
 */
export async function downscaleDataUrl(dataUrl, maxEdge = 600, quality = 0.72) {
  try {
    const img = await loadImage(dataUrl)
    const w0 = img.naturalWidth || img.width
    const h0 = img.naturalHeight || img.height
    if (!w0 || !h0) return dataUrl

    const scale = Math.min(1, maxEdge / Math.max(w0, h0))
    const w = Math.max(1, Math.round(w0 * scale))
    const h = Math.max(1, Math.round(h0 * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return dataUrl
  }
}
