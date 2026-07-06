# 🐾 PetFace — 우리 댕냥이 관상·족상 테스트

반려동물(강아지·고양이)의 **얼굴 사진** 또는 **발바닥 젤리 사진**을 올리면,
AI가 유쾌한 관상/족상 결과를 스토리텔링으로 들려주는 엔터테인먼트 웹앱 MVP입니다.

> 핵심 바이럴 루프 검증용 MVP — **업로드 → 분석 → 결과 공유** 플로우의 완성도와,
> 어떤 예외에도 앱이 죽지 않는 **견고함**을 최우선으로 설계했습니다.

## 기술 스택

- **React 18 + Vite** — 빠른 빌드와 개발 경험
- **Tailwind CSS v3** — 둥글둥글한 파스텔 디자인 시스템
- **Framer Motion** — 화면 전환·로딩·결과 애니메이션
- **Lucide React** — 아이콘
- **html-to-image** — 결과 카드를 PNG로 캡처(저장·공유)
- **Claude (`claude-opus-4-8`) 비전 API** — Netlify 서버리스 함수에서 호출, 이미지로 관상/족상 분석

## 실행

```bash
npm install

# 1) AI 없이 UI만 (mock 결과로 동작)
npm run dev          # http://localhost:5173

# 2) AI 분석까지 (서버리스 함수 포함) — 권장
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env   # .env.example 참고
npm i -g netlify-cli
netlify dev          # 프론트 + /api/analyze 함수 동시 실행

npm run build        # 프로덕션 빌드 → dist/
npm run preview      # 빌드 결과 미리보기
```

> `npm run dev`(순수 Vite)로 띄우면 `/api/analyze` 함수가 없으므로 분석이 자동으로 **mock 결과 폴백**으로 동작합니다. 실제 AI 분석을 보려면 `netlify dev`로 실행하고 `ANTHROPIC_API_KEY`를 설정하세요.

## 구조

```
src/
├─ App.jsx                  # SSOT 상태 머신 (home → loading → result)
├─ main.jsx                 # 엔트리
├─ index.css                # Tailwind + 모바일 480px 앱 셸
├─ components/
│  ├─ Home.jsx              # 업로드 화면 (모드 토글 / 카메라·앨범 / 드래그앤드롭)
│  ├─ Loading.jsx           # "AI가 관상 보는 중" 애니메이션
│  ├─ Result.jsx            # 결과 카드 + 저장/공유/다시하기
│  └─ Toast.jsx             # 유쾌한 에러·안내 토스트
├─ data/
│  └─ mockResults.js        # 관상/족상 Mock 결과 (실제 결과와 동일 스키마, 폴백용)
└─ utils/
   ├─ validateImage.js      # 형식·용량·로드 검증 (절대 throw 안 함)
   ├─ analyzeImage.js       # /api/analyze 호출 래퍼 (ok / unrecognized / unavailable)
   └─ saveResult.js         # 캡처 / 다운로드 / Web Share API 공유

netlify/
└─ functions/
   └─ analyze.mjs           # Claude 비전 호출 (API 키 은닉 + 구조화 출력으로 결과 스키마 강제)
```

## 견고성 설계 (Non-Functional)

- **SSOT 상태 관리**: `status('home'|'loading'|'result')` 하나로 데이터 흐름을 단순화.
- **무한 로딩 방지**: 분석은 30초 타임아웃을 두고, 성공/인식실패/오류 모든 분기에서 화면을 반드시 전이시킵니다.
- **AI 장애에도 무중단**: API 키 미설정·타임아웃·서버 오류 등 인프라 문제는 **mock 결과로 자동 폴백**해 앱이 절대 빈 화면에 멈추지 않습니다.
- **인식 실패 폴백**: 동물 얼굴/발바닥을 못 찾으면 _"너무 귀여워서 AI가 기절했어요! 😵"_ 토스트로 재촬영을 유도합니다.
- **stale 결과 차단**: `analysisId`로 진행 중 분석을 추적해, 사용자가 도중에 다시 시작하면 늦게 도착한 이전 결과가 화면을 덮어쓰지 못하게 합니다.
- **입력 방어**: 미지원 형식·용량 초과·깨진 파일을 업로드 전에 걸러내고 친절한 메시지를 표시.
- **캡처/공유 방어**: 캡처 실패·공유 미지원·사용자 취소(AbortError)를 모두 안전하게 처리(앱이 죽지 않음).

## AI 분석 동작 방식 (멀티 프로바이더)

```
[브라우저] 이미지 dataURL + mode
      │  POST /api/analyze
      ▼
[Netlify 함수 analyze.mjs]  ← PROVIDER 환경변수로 백엔드 선택 (키는 서버에만 존재)
      │   ├─ gemini       : Google Gemini 비전                       [무료·한국어 우수·권장]
      │   ├─ claude       : Claude 비전 + 구조화 출력(json_schema)   [유료·최고 품질]
      │   ├─ pollinations : OpenAI 호환 무료 게이트웨이              [무료·키 불필요]
      │   └─ ollama       : 로컬 OpenAI 호환 서버(llava 등)          [무료·로컬 테스트]
      ▼
{ recognized, result }  →  [브라우저] 결과 렌더 / "AI 기절" / mock 폴백
```

- **백엔드 교체는 이 함수 한 파일만**: `/api/analyze` 계약과 결과 스키마는 프로바이더와 무관하게 동일해 프론트엔드는 손대지 않습니다. `PROVIDER` 환경변수로 전환합니다(기본 `gemini`). 설정 예시는 `.env.example` 참고.
  - **무료 권장: `PROVIDER=gemini`** — [Google AI Studio](https://aistudio.google.com/app/apikey)에서 무료 API 키 발급(1분) → `GEMINI_API_KEY` 설정. 무료 한도 넉넉하고 한국어·비전 품질 우수.
  - 키 없이 즉시: `PROVIDER=pollinations` (무료 게이트웨이, 레이트 리밋·안정성은 mock 폴백이 보완)
  - 로컬 무료 테스트: `PROVIDER=ollama` + `ollama pull llava:7b` (배포 불가, 한국어/품질은 약함)
  - 최고 품질(유료): `PROVIDER=claude` + `ANTHROPIC_API_KEY` (한국어 창작·구조화 출력·스케일 우수)
- **API 키 은닉**: 키는 서버리스 함수 런타임에만 존재하며 클라이언트 번들에 포함되지 않습니다(`VITE_` 접두사 없음).
- **출력 안전성**: Claude는 `json_schema`로 응답을 강제 고정, OpenAI 호환 프로바이더는 프롬프트로 형태를 지정하고 `extractJson`으로 방어 파싱. 함수와 `Result.jsx` 양쪽에서 `summary` 3줄·`stats` 0~100을 한 번 더 정규화합니다.
- **결과 스키마(단일 진실 공급원)**: `{ id, emoji, title, subtitle, summary[3], stats{wealth,snack,charm}, tags[], accent }` — mock과 모든 프로바이더 결과가 동일해 UI는 출처와 무관하게 동일하게 동작합니다.

## 배포 (Netlify)

`netlify.toml` 포함: 정적 호스팅 + `/api/*` 함수 리다이렉트 + SPA 폴백.

```bash
# 1) 환경변수 등록 (둘 중 하나)
netlify env:set ANTHROPIC_API_KEY "sk-ant-..."     # CLI
#  또는 대시보드 → Site settings → Environment variables

# 2) 배포
netlify deploy --build --prod
```

> 결과는 재미로만 봐주세요 🐾
