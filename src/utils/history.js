// ─────────────────────────────────────────────────────────────
// 로컬 보관함 — 분석 결과를 브라우저 localStorage에 저장/조회/삭제한다.
//
// - 사진 원본은 용량이 크므로 썸네일로 축소해 저장(localStorage ~5MB 한도 보호).
// - 최근 MAX_ITEMS개만 보관(FIFO).
// - 어떤 경우에도 throw하지 않는다(저장 실패해도 앱은 정상 동작).
// ─────────────────────────────────────────────────────────────

import { downscaleDataUrl } from './imageTools'

const KEY = 'petface:history:v1'
const MAX_ITEMS = 12

/** 저장된 보관함 목록을 반환(최신순). 실패 시 빈 배열. */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/** 목록을 저장. 용량 초과 시 오래된 항목부터 줄여가며 재시도. 성공 여부 반환. */
function persist(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    return true
  } catch {
    let trimmed = list.slice()
    for (let i = 0; i < 6 && trimmed.length > 0; i++) {
      trimmed = trimmed.slice(0, -1)
      try {
        localStorage.setItem(KEY, JSON.stringify(trimmed))
        return true
      } catch {
        /* 계속 줄여서 재시도 */
      }
    }
    return false
  }
}

/**
 * 새 결과를 보관함에 저장한다(이미지는 썸네일로 축소).
 * @param {{image:string, result:object, mode:'face'|'paw', ts?:number}} args
 * @returns {Promise<Array>} 갱신된 보관함 목록
 */
export async function saveToHistory({ image, result, mode, ts }) {
  try {
    if (!result) return loadHistory()
    const thumb = image ? await downscaleDataUrl(image) : null
    const stamp = ts || Date.now()
    const entry = {
      // 보관함 엔트리 id는 항상 고유하게 — mock 결과는 id가 고정이라
      // result.id를 그대로 쓰면 같은 항목으로 합쳐져 누적되지 않는다.
      id: `${result.id || 'r'}-${stamp}`,
      ts: stamp,
      mode: mode === 'paw' ? 'paw' : 'face',
      result,
      thumb,
    }
    // 같은 id가 있으면 교체(중복 방지) 후 최신순 맨 앞에
    const current = loadHistory().filter((e) => e.id !== entry.id)
    const next = [entry, ...current].slice(0, MAX_ITEMS)
    persist(next)
    return next
  } catch {
    return loadHistory()
  }
}

/** id 항목 삭제 후 갱신된 목록 반환 */
export function removeFromHistory(id) {
  const next = loadHistory().filter((e) => e.id !== id)
  persist(next)
  return next
}

/** 전체 삭제 */
export function clearHistory() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* 무시 */
  }
  return []
}
