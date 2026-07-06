import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Home from './components/Home'
import Loading from './components/Loading'
import Result from './components/Result'
import Toast from './components/Toast'
import History from './components/History'
import { pickRandomResult } from './data/mockResults'
import { analyzeImage } from './utils/analyzeImage'
import { loadHistory, saveToHistory, removeFromHistory, clearHistory } from './utils/history'
import { track } from './utils/analytics'

// ─────────────────────────────────────────────────────────────
// App: 단일 상태 머신(SSOT)
//
// status 흐름:
//   home    → 사진 선택 대기 (모드 토글 가능)
//     └ onSelect → image 저장 + status='loading' + AI 분석 요청
//   loading → 서버리스 함수(/api/analyze)가 Claude 비전으로 분석 (최소 표시시간 보장)
//     ├ 분석 성공            → result 설정 + status='result'
//     ├ 동물 인식 실패        → "AI 기절" 토스트 + status='home'
//     └ 인프라/타임아웃 오류  → mock 결과로 graceful 폴백 (앱은 절대 죽지 않음)
//   result  → 결과 표시 (성공 결과는 자동으로 로컬 보관함에 저장)
//     └ onRestart → status='home', image/result 초기화 (mode 유지)
//   history → 로컬 보관함 (저장된 결과 다시 보기/삭제)
//
// 견고성 원칙: 모든 비동기는 절대 throw로 화면을 멈추지 않게 처리하고,
// 진행 중 분석은 analysisId로 무효화해 stale 결과가 화면을 덮어쓰지 못하게 한다.
// ─────────────────────────────────────────────────────────────

const MIN_LOADING_MS = 1600 // 로딩 애니메이션이 너무 빨리 사라지지 않도록 최소 표시 시간

// 화면 전환 트랜지션 (부드러운 페이드 + 살짝 슬라이드)
const screenVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
}

export default function App() {
  // ── SSOT 상태 ──
  const [status, setStatus] = useState('home') // 'home' | 'loading' | 'result' | 'history'
  const [image, setImage] = useState(null) // 선택한 사진 dataURL
  const [mode, setMode] = useState('face') // 'face' | 'paw'
  const [result, setResult] = useState(null) // 결과 객체 | null
  const [toast, setToast] = useState(null) // { message, type } | null
  const [history, setHistory] = useState(() => loadHistory()) // 로컬 보관함 목록

  // 진행 중 분석 식별자 — 다시하기/새 분석 시 증가시켜 stale 결과를 무효화
  const analysisIdRef = useRef(0)

  // 성공 결과를 로컬 보관함에 저장(이미지는 썸네일로 축소). 실패해도 앱엔 영향 없음.
  const persistToHistory = useCallback((resultObj, imageDataUrl, usedMode) => {
    saveToHistory({ image: imageDataUrl, result: resultObj, mode: usedMode })
      .then(setHistory)
      .catch(() => {})
  }, [])

  // ── 토스트 헬퍼 ──
  const showToast = useCallback((message, type = 'info') => {
    if (!message) return
    setToast({ message, type })
  }, [])

  const clearToast = useCallback(() => setToast(null), [])

  // ── Home: 모드 변경 ──
  const handleModeChange = useCallback((nextMode) => {
    if (nextMode === 'face' || nextMode === 'paw') setMode(nextMode)
  }, [])

  // ── Home: 사진 선택 → 로딩 진입 → AI 분석 → 결과/폴백 ──
  const handleSelect = useCallback(
    ({ dataUrl } = {}) => {
      if (!dataUrl) {
        showToast('이런, 사진을 불러오지 못했어요 🙈', 'error')
        return
      }

      const runId = ++analysisIdRef.current
      setImage(dataUrl)
      setResult(null)
      setStatus('loading')
      track('upload_selected', { mode })

      // 분석과 최소 로딩 시간을 함께 기다림 → 애니메이션이 깜빡이지 않음
      const run = async () => {
        let outcome
        try {
          const [res] = await Promise.all([
            analyzeImage(dataUrl, mode),
            new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
          ])
          outcome = res
        } catch {
          // analyzeImage는 throw하지 않도록 설계됐지만 만일을 대비
          outcome = { status: 'unavailable' }
        }

        // 사용자가 그새 다시하기/새 분석을 시작했다면 이 결과는 폐기
        if (runId !== analysisIdRef.current) return

        if (outcome.status === 'ok' && outcome.result) {
          setResult(outcome.result)
          setStatus('result')
          persistToHistory(outcome.result, dataUrl, mode)
          track('result_shown', {
            mode,
            source: 'ai',
            tier: outcome.result.tier || 'unknown',
          })
        } else if (outcome.status === 'unrecognized') {
          // 동물 얼굴/발바닥 인식 실패 → 유쾌한 재촬영 안내 (무한 로딩 금지)
          setStatus('home')
          track('recognize_failed', { mode })
          showToast(
            '너무 귀여워서 AI가 기절했어요! 😵 밝은 곳에서 또렷한 사진으로 다시 찍어주세요',
            'error',
          )
        } else if (outcome.status === 'unsupported') {
          // 비전 미지원 형식(HEIC 등) → 사용자가 고칠 수 있으므로 안내 후 재시도 유도
          setStatus('home')
          showToast(outcome.message, 'error')
        } else {
          // 인프라/타임아웃 오류 → mock 결과로 graceful 폴백 (앱은 절대 죽지 않음)
          const mock = pickRandomResult(mode)
          if (mock) {
            setResult(mock)
            setStatus('result')
            persistToHistory(mock, dataUrl, mode)
            track('result_shown', { mode, source: 'mock', tier: mock.tier || 'unknown' })
            showToast('AI가 잠깐 쉬는 중이라 임시 결과를 보여드려요 🐾', 'info')
          } else {
            setStatus('home')
            showToast('앗, 분석에 실패했어요. 다시 시도해 주세요 🙈', 'error')
          }
        }
      }

      run()
    },
    [mode, showToast, persistToHistory],
  )

  // ── Home: 업로드/검증 단계 에러 (status는 home 유지) ──
  const handleError = useCallback(
    (message) => {
      showToast(message || '이런, 사진을 불러오지 못했어요 🙈', 'error')
    },
    [showToast],
  )

  // ── Result: 처음으로 (mode는 유지) ──
  const handleRestart = useCallback(() => {
    analysisIdRef.current++ // 진행 중 분석이 있으면 무효화
    setStatus('home')
    setImage(null)
    setResult(null)
  }, [])

  // ── Result: 반대 모드로 다시 (관상↔족상 교차 유도) ──
  const handleTryOther = useCallback(() => {
    analysisIdRef.current++ // 진행 중 분석 무효화
    track('try_other_mode')
    setMode((prev) => (prev === 'paw' ? 'face' : 'paw'))
    setStatus('home')
    setImage(null)
    setResult(null)
  }, [])

  // ── Result: 토스트 위임 ──
  const handleResultToast = useCallback(
    (message, type) => showToast(message, type),
    [showToast],
  )

  // ── 보관함 진입 ──
  const handleOpenHistory = useCallback(() => setStatus('history'), [])

  // ── 보관함: 저장된 결과 다시 보기 (재분석/재저장 없이 바로 결과 화면) ──
  const handleHistorySelect = useCallback((item) => {
    if (!item || !item.result) return
    analysisIdRef.current++ // 진행 중 분석 무효화
    setImage(item.thumb || null)
    setResult(item.result)
    setMode(item.mode === 'paw' ? 'paw' : 'face')
    setStatus('result')
  }, [])

  // ── 보관함: 개별 삭제 / 전체 삭제 ──
  const handleHistoryDelete = useCallback((id) => {
    setHistory(removeFromHistory(id))
  }, [])

  const handleHistoryClear = useCallback(() => {
    setHistory(clearHistory())
  }, [])

  // ── 공통: 홈으로 ──
  const handleGoHome = useCallback(() => setStatus('home'), [])

  return (
    // 모바일 480px 앱 셸
    <div className="app-shell relative min-h-screen w-full max-w-[480px] mx-auto bg-cream">
      {/* 토스트는 status와 무관하게 항상 마운트 */}
      <Toast toast={toast} onClose={clearToast} />

      {/* status에 따른 화면 전환 (한 번에 하나만) */}
      <AnimatePresence mode="wait">
        {status === 'home' && (
          <motion.main
            key="home"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="flex min-h-screen w-full flex-col items-center justify-center"
          >
            <Home
              mode={mode}
              onModeChange={handleModeChange}
              onSelect={handleSelect}
              onError={handleError}
              onOpenHistory={handleOpenHistory}
              historyCount={history.length}
            />
          </motion.main>
        )}

        {status === 'loading' && (
          <motion.main
            key="loading"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="flex min-h-screen w-full flex-col items-center justify-center"
          >
            <Loading image={image} mode={mode} />
          </motion.main>
        )}

        {status === 'result' && (
          <motion.main
            key="result"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="flex min-h-screen w-full flex-col items-center justify-center pt-8"
          >
            <Result
              image={image}
              result={result}
              mode={mode}
              onRestart={handleRestart}
              onTryOther={handleTryOther}
              onToast={handleResultToast}
            />
          </motion.main>
        )}

        {status === 'history' && (
          <motion.main
            key="history"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="flex min-h-screen w-full flex-col"
          >
            <History
              items={history}
              onSelect={handleHistorySelect}
              onDelete={handleHistoryDelete}
              onClear={handleHistoryClear}
              onBack={handleGoHome}
            />
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  )
}
