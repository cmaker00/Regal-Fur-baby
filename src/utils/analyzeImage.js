// ─────────────────────────────────────────────────────────────
// 프론트엔드 → 서버리스 함수(/api/analyze) 호출 래퍼.
//
// 반환값:
//   { status: 'ok',         result }  → 분석 성공, result는 결과 객체
//   { status: 'unrecognized' }        → 동물 얼굴/발바닥 인식 실패 ("AI 기절")
//   { status: 'unsupported', message } → 사용자가 고칠 수 있는 입력 문제(예: HEIC 등
//                                          비전 미지원 형식). 메시지를 그대로 안내한다.
//   { status: 'unavailable', message? } → 인프라/네트워크/타임아웃 등
//                                          (App에서 mock 폴백으로 graceful 처리)
//
// 절대 throw 하지 않는다. 모든 실패는 위 status로 표현한다.
// ─────────────────────────────────────────────────────────────

// netlify.toml 의 리다이렉트(/api/* → /.netlify/functions/:splat) 기준 경로
const ANALYZE_ENDPOINT = '/api/analyze'

// 분석 최대 대기 시간 (이 시간을 넘기면 폴백)
const TIMEOUT_MS = 30000

/**
 * 이미지를 서버로 보내 AI 관상/족상 분석을 요청한다.
 * @param {string} dataUrl  이미지 base64 dataURL
 * @param {'face'|'paw'} mode
 * @returns {Promise<{status:'ok', result:object} | {status:'unrecognized'} | {status:'unavailable', message?:string}>}
 */
export async function analyzeImage(dataUrl, mode) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(ANALYZE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, mode }),
      signal: controller.signal,
    })

    // 함수가 없거나(순수 vite dev) 서버 오류 → 폴백
    if (!res.ok) {
      let message
      try {
        message = (await res.json())?.error
      } catch {
        /* 본문 파싱 실패는 무시 */
      }
      // 415: 비전 미지원 형식(HEIC 등) — 사용자가 형식만 바꾸면 해결되므로,
      // mock으로 숨기지 말고 안내 메시지를 그대로 노출한다.
      if (res.status === 415) {
        return {
          status: 'unsupported',
          message: message || 'AI가 읽을 수 없는 사진 형식이에요. JPG나 PNG로 다시 시도해 주세요 🙈',
        }
      }
      return { status: 'unavailable', message }
    }

    const data = await res.json()

    if (data?.recognized && data.result) {
      return { status: 'ok', result: data.result }
    }
    // recognized === false → 동물 인식 실패
    return { status: 'unrecognized' }
  } catch {
    // AbortError(타임아웃) / 네트워크 오류 등
    return { status: 'unavailable' }
  } finally {
    clearTimeout(timer)
  }
}

export default analyzeImage
