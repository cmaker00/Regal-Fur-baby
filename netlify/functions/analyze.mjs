// ─────────────────────────────────────────────────────────────
// Netlify Serverless Function: 반려동물 관상/족상 AI 분석 (멀티 프로바이더)
//
// 클라이언트가 보낸 이미지(base64 dataURL)와 모드(face/paw)를 받아
// 비전 모델로 분석하고, 프론트엔드가 그대로 렌더링할 수 있는
// 결과 객체(src/data/mockResults.js와 동일 스키마)를 반환한다.
//
// PROVIDER 환경변수로 백엔드를 선택한다 (기본: gemini):
//   - gemini       : Google Gemini 비전 (무료 한도 넉넉·한국어 우수)    — 무료 권장
//   - claude       : Anthropic Claude 비전 + 구조화 출력 (유료, 최고 품질·안정성)
//   - pollinations : OpenAI 호환 무료 게이트웨이 (무료, 키 선택)        — 키 없이 동작
//   - ollama       : 로컬 OpenAI 호환 서버(llava/llama3.2-vision 등)    — 무료 로컬 테스트용
//
// /api/analyze 계약과 결과 스키마는 프로바이더와 무관하게 동일하다.
//
// 핵심 원칙:
//  - 비밀키(ANTHROPIC_API_KEY 등)는 이 서버 함수 안에만 존재(클라이언트 은닉).
//  - 반려동물 얼굴/발바닥을 못 찾으면 recognized:false → "AI 기절" 폴백 신호.
//  - 어떤 예외에도 항상 JSON 본문을 반환(프론트가 graceful 처리).
//  - 결과는 함수와 Result.jsx 양쪽에서 정규화(summary 3줄·stats 0~100).
// ─────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'

const PROVIDER = (process.env.PROVIDER || 'gemini').toLowerCase()

// 비전이 지원하는 이미지 포맷 (HEIC 등은 미지원 — 모든 프로바이더 공통으로 안전한 집합)
const SUPPORTED_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

const ACCENTS = ['butter', 'blush', 'mint', 'sky', 'peach']

// 희귀 등급 (자랑·재도전 유도용) — 낮은 비율일수록 희귀하게.
const TIERS = ['전설', '희귀', '우수', '평범']

// 상위 모델 호출 타임아웃 (프론트의 30초 abort보다 짧게).
// 로컬 ollama 콜드 스타트 등 느린 백엔드를 위해 ANALYZE_TIMEOUT_MS로 조정 가능.
const UPSTREAM_TIMEOUT_MS = Number(process.env.ANALYZE_TIMEOUT_MS) || 25000

// 구조화 출력 스키마 (Claude 전용) — 프론트엔드 결과 객체와 동일한 모양.
const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    recognized: {
      type: 'boolean',
      description:
        '사진에서 강아지/고양이의 얼굴 또는 발바닥 젤리를 명확히 식별했으면 true, 아니면(사람/사물/너무 어두움/흐림) false',
    },
    emoji: { type: 'string', description: '결과를 대표하는 이모지 1개' },
    title: { type: 'string', description: '유쾌한 관상/족상 결과 타이틀' },
    subtitle: { type: 'string', description: '한 줄 부제' },
    summary: {
      type: 'array',
      items: { type: 'string' },
      description: '정확히 3개의 문장. 각 문장은 사진에서 관찰한 특징에 근거한 유쾌한 해석.',
    },
    stats: {
      type: 'object',
      additionalProperties: false,
      properties: {
        wealth: { type: 'integer', description: '재물운 0~100' },
        snack: { type: 'integer', description: '간식운 0~100' },
        charm: { type: 'integer', description: '매력운 0~100' },
      },
      required: ['wealth', 'snack', 'charm'],
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: "SNS 공유용 해시태그 3개. 각 항목은 '#'으로 시작.",
    },
    tier: {
      type: 'string',
      enum: TIERS,
      description:
        "결과의 희귀 등급. 사진 속 특징이 특별할수록 높게: '전설'(아주 드묾)·'희귀'·'우수'·'평범'. 대부분은 '우수'나 '희귀'로, '전설'은 정말 인상적일 때만.",
    },
    rarityPercent: {
      type: 'integer',
      description:
        '이런 관상/족상을 가진 반려동물의 비율(상위 N%). 1~99 정수, 낮을수록 희귀(전설은 1~5, 희귀는 6~20, 우수는 21~50, 평범은 51~99).',
    },
    accent: { type: 'string', enum: ACCENTS, description: '결과 카드 테마 색상 키' },
  },
  required: [
    'recognized', 'emoji', 'title', 'subtitle', 'summary',
    'stats', 'tags', 'tier', 'rarityPercent', 'accent',
  ],
}

const SYSTEM_PROMPT = `당신은 반려동물(강아지·고양이) 전문 '관상가'이자 따뜻한 카피라이터입니다.
업로드된 사진 속 동물의 실제 시각적 특징을 근거로, 유쾌하고 귀여운 관상/족상 결과를 한국어로 만들어 줍니다.

규칙:
- 사진에서 실제로 관찰되는 특징(눈 크기·모양, 귀 모양, 표정, 털 색, 발바닥 젤리의 모양·도톰함·색 등)을 근거로 삼아 해석하세요.
- 사진에 강아지/고양이의 얼굴 또는 발바닥 젤리가 명확히 보이지 않으면(사람·사물·풍경이거나, 너무 어둡거나 흐릿하면) recognized를 false로 설정하세요. 이 경우 나머지 필드는 적당한 기본값으로 채우되 절대 분석을 지어내지 마세요.
- recognized가 true일 때: summary는 정확히 3문장, stats(재물운/간식운/매력운)는 0~100 사이 정수, tags는 '#'으로 시작하는 해시태그 정확히 3개.
- tier(희귀 등급)와 rarityPercent(상위 N%)는 사진 속 특징의 인상도에 따라 정직하게 매겨, 자랑하고 또 도전하고 싶게 만드세요. '전설'은 정말 특별할 때만 아껴서 부여하세요.
- 톤은 밝고 유쾌하며 다정하게. 사주/운세를 진지하게 단정하지 말고 재미 위주로.
- 실제 의학적/혈통적 단정은 피하세요. 어디까지나 엔터테인먼트입니다.`

// OpenAI 호환 프로바이더(ollama/pollinations)는 스키마 강제가 약하므로
// 출력 JSON 형태를 시스템 프롬프트에 명시한다.
const JSON_INSTRUCTION = `

반드시 아래 형태의 JSON 객체 "하나만" 출력하세요. 마크다운 코드펜스(\`\`\`)나 설명 문장 없이 순수 JSON만 출력합니다.
{
  "recognized": true 또는 false,
  "emoji": "이모지 1개",
  "title": "결과 타이틀",
  "subtitle": "한 줄 부제",
  "summary": ["문장1", "문장2", "문장3"],
  "stats": { "wealth": 0~100 정수, "snack": 0~100 정수, "charm": 0~100 정수 },
  "tags": ["#태그1", "#태그2", "#태그3"],
  "tier": "전설 | 희귀 | 우수 | 평범 중 하나",
  "rarityPercent": 1~99 정수,
  "accent": "butter | blush | mint | sky | peach 중 하나"
}`

function userPrompt(mode) {
  if (mode === 'paw') {
    return '이 사진은 반려동물의 발바닥(젤리)입니다. 젤리의 모양·도톰함·색·배치를 보고 "족상"을 봐주세요. 발바닥이 보이지 않으면 recognized=false.'
  }
  return '이 사진은 반려동물의 얼굴입니다. 눈·귀·표정·털을 보고 "관상"을 봐주세요. 동물 얼굴이 보이지 않으면 recognized=false.'
}

// dataURL("data:image/png;base64,....")에서 media_type과 base64 본문을 추출
function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl || '')
  if (!match) return null
  return { mediaType: match[1].toLowerCase(), data: match[2] }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  }
}

// 모델 응답 텍스트에서 JSON 객체를 안전하게 추출 (코드펜스/잡텍스트 방어)
function extractJson(text) {
  if (!text || typeof text !== 'string') return null
  // ```json ... ``` 펜스 제거
  let s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  try {
    return JSON.parse(s)
  } catch {
    // 본문 어딘가에 들어있는 첫 번째 { ... } 블록을 시도
    const start = s.indexOf('{')
    const end = s.lastIndexOf('}')
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(s.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

// ── 프로바이더 1: Claude (Anthropic SDK + 구조화 출력) ──
async function callClaude({ system, user, mediaType, data }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-opus-4-8',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          { type: 'text', text: user },
        ],
      },
    ],
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: RESULT_SCHEMA },
    },
  })
  if (message.stop_reason === 'refusal') {
    return { recognized: false }
  }
  const textBlock = message.content.find((b) => b.type === 'text')
  return extractJson(textBlock?.text)
}

// ── 프로바이더 2·3·4: OpenAI 호환 (gemini / ollama / pollinations 공용) ──
// maxTokens: 추론(thinking) 모델은 출력이 잘리지 않도록 여유가 필요하다.
// extraBody: 프로바이더별 추가 파라미터(예: gemini의 reasoning_effort).
async function callOpenAICompatible({
  url, model, apiKey, system, user, mediaType, data,
  maxTokens = 1024, extraBody = {},
}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.85,
        response_format: { type: 'json_object' },
        ...extraBody,
        messages: [
          { role: 'system', content: system + JSON_INSTRUCTION },
          {
            role: 'user',
            content: [
              { type: 'text', text: user },
              { type: 'image_url', image_url: { url: `data:${mediaType};base64,${data}` } },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`upstream ${res.status}: ${detail.slice(0, 200)}`)
    }

    const body = await res.json()
    const content = body?.choices?.[0]?.message?.content
    return extractJson(typeof content === 'string' ? content : '')
  } finally {
    clearTimeout(timer)
  }
}

// 프로바이더별 사전 점검 (설정 누락 시 친절한 503)
function preflight() {
  if (PROVIDER === 'claude' && !process.env.ANTHROPIC_API_KEY) {
    return 'AI가 아직 연결되지 않았어요. (ANTHROPIC_API_KEY 미설정)'
  }
  if (PROVIDER === 'gemini' && !process.env.GEMINI_API_KEY) {
    return 'AI가 아직 연결되지 않았어요. (GEMINI_API_KEY 미설정)'
  }
  // pollinations/ollama는 키가 선택적이거나 로컬이라 사전 점검 없이 호출 단계에서 처리
  return null
}

async function runProvider({ mediaType, data, mode }) {
  const system = SYSTEM_PROMPT
  const user = userPrompt(mode)

  if (PROVIDER === 'ollama') {
    const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    return callOpenAICompatible({
      url: `${base.replace(/\/$/, '')}/v1/chat/completions`,
      model: process.env.OLLAMA_MODEL || 'llama3.2-vision',
      apiKey: undefined, // 로컬은 인증 불필요
      system,
      user,
      mediaType,
      data,
    })
  }

  if (PROVIDER === 'gemini') {
    // Gemini의 OpenAI 호환 엔드포인트 재사용 (무료 한도·한국어 우수)
    return callOpenAICompatible({
      url:
        process.env.GEMINI_URL ||
        'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY,
      system,
      user,
      mediaType,
      data,
      // 2.5 계열은 thinking 모델 — 추론 토큰이 본문을 잘라먹지 않도록 여유 + 추론 최소화
      maxTokens: 2048,
      extraBody: { reasoning_effort: 'low' },
    })
  }

  if (PROVIDER === 'pollinations') {
    return callOpenAICompatible({
      url: process.env.POLLINATIONS_URL || 'https://text.pollinations.ai/openai',
      model: process.env.POLLINATIONS_MODEL || 'openai',
      apiKey: process.env.POLLINATIONS_API_KEY, // 무료 티어는 없어도 동작(레이트 리밋)
      system,
      user,
      mediaType,
      data,
    })
  }

  // 기본: claude
  return callClaude({ system, user, mediaType, data })
}

export async function handler(event) {
  // 1) 메서드 검증
  if (event.httpMethod !== 'POST') {
    return json(405, { recognized: false, error: 'POST만 지원합니다.' })
  }

  // 2) 프로바이더 사전 점검
  const preErr = preflight()
  if (preErr) {
    return json(503, { recognized: false, error: preErr })
  }

  // 3) 입력 파싱
  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { recognized: false, error: '요청 형식이 올바르지 않아요.' })
  }

  const { image, mode } = payload
  const normalizedMode = mode === 'paw' ? 'paw' : 'face'

  const parsed = parseDataUrl(image)
  if (!parsed) {
    return json(400, { recognized: false, error: '이미지 데이터가 올바르지 않아요.' })
  }
  if (!SUPPORTED_MEDIA_TYPES.has(parsed.mediaType)) {
    return json(415, {
      recognized: false,
      error: 'AI가 읽을 수 없는 사진 형식이에요. JPG나 PNG로 다시 시도해 주세요 🙈',
    })
  }

  // 4) 프로바이더 호출
  try {
    const result = await runProvider({
      mediaType: parsed.mediaType,
      data: parsed.data,
      mode: normalizedMode,
    })

    if (!result || typeof result !== 'object') {
      return json(502, { recognized: false, error: 'AI 응답을 이해하지 못했어요.' })
    }

    // 인식 실패면 결과 없이 신호만 반환 → 프론트에서 "AI 기절" 폴백
    if (!result.recognized) {
      return json(200, { recognized: false })
    }

    // 결과 정규화/방어 — 스키마가 막지 못하는 길이/범위를 서버에서도 한 번 더 정리
    const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))
    const normalized = {
      id: `ai-${normalizedMode}-${Date.now()}`,
      emoji: String(result.emoji || '🐾').slice(0, 4),
      title: String(result.title || '신비로운 우리 아이 관상!'),
      subtitle: String(result.subtitle || ''),
      summary: (Array.isArray(result.summary) ? result.summary : [])
        .map((s) => String(s))
        .slice(0, 3),
      stats: {
        wealth: clamp(result.stats?.wealth),
        snack: clamp(result.stats?.snack),
        charm: clamp(result.stats?.charm),
      },
      tags: (Array.isArray(result.tags) ? result.tags : [])
        .map((t) => String(t))
        .slice(0, 4),
      tier: TIERS.includes(result.tier) ? result.tier : '우수',
      rarityPercent: Math.max(1, Math.min(99, Math.round(Number(result.rarityPercent) || 30))),
      accent: ACCENTS.includes(result.accent) ? result.accent : 'butter',
    }

    return json(200, { recognized: true, result: normalized })
  } catch (err) {
    // API/네트워크 오류(타임아웃·로컬 서버 다운·레이트 리밋 등)
    const status = err?.status || 502
    return json(status >= 400 && status < 600 ? status : 502, {
      recognized: false,
      error: '지금은 AI가 잠시 쉬고 있어요. 잠시 후 다시 시도해 주세요 😴',
    })
  }
}
