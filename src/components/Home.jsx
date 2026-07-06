import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, ImageUp, PawPrint, Sparkles, Images, Bookmark } from 'lucide-react'
import validateImage from '../utils/validateImage'
import { urlToDataUrl } from '../utils/imageTools'
import { SAMPLE_IMAGES } from '../data/samples'

const MODES = [
  { key: 'face', label: '얼굴 관상', emoji: '😺' },
  { key: 'paw', label: '발바닥 족상', emoji: '🐾' },
]

export default function Home({
  mode = 'face',
  onModeChange,
  onSelect,
  onError,
  onOpenHistory,
  historyCount = 0,
}) {
  const albumInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [sampleLoading, setSampleLoading] = useState(null)

  async function handleFile(file) {
    if (!file) return
    try {
      const res = await validateImage(file)
      if (res && res.ok) {
        onSelect && onSelect({ dataUrl: res.dataUrl, file })
      } else {
        onError && onError((res && res.error) || '이런, 사진을 불러오지 못했어요 🙈')
      }
    } catch (e) {
      onError && onError('이런, 사진을 불러오지 못했어요 🙈')
    }
  }

  function handleInputChange(e) {
    const file = e.target.files && e.target.files[0]
    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = ''
    handleFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    try {
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
      handleFile(file)
    } catch (err) {
      onError && onError('이런, 사진을 불러오지 못했어요 🙈')
    }
  }

  // 샘플 이미지를 dataURL로 변환해 일반 업로드 흐름(onSelect)에 태운다
  async function handleSample(src) {
    if (sampleLoading) return
    setSampleLoading(src)
    try {
      const dataUrl = await urlToDataUrl(src)
      onSelect && onSelect({ dataUrl })
    } catch {
      onError && onError('샘플을 불러오지 못했어요, 잠시 후 다시 시도해 주세요 🙈')
    } finally {
      setSampleLoading(null)
    }
  }

  const openAlbum = () => albumInputRef.current && albumInputRef.current.click()
  const openCamera = () => cameraInputRef.current && cameraInputRef.current.click()

  const dropzoneHint =
    mode === 'paw' ? '말랑 젤리가 잘 보이게! 🐾' : '얼굴이 정면으로 잘 보이게! 😸'

  return (
    <div className="flex w-full flex-col items-center px-5 pb-10 pt-8">
      {/* 1) 타이틀 영역 */}
      <header className="flex flex-col items-center text-center">
        <motion.div
          aria-hidden="true"
          className="text-5xl"
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          🐶👑🐱
        </motion.div>
        <h1 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-tight text-cocoa">
          내 새꾸가
          <br />
          <span className="text-rosy">왕이 될 상</span>인가?
        </h1>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-ink/60">
          <Sparkles className="h-4 w-4 text-rosy" aria-hidden="true" />
          AI 관상가의 내 새꾸 자랑 타임 🐾
        </p>
      </header>

      {/* 2) 모드 토글 */}
      <div
        role="tablist"
        aria-label="테스트 종류 선택"
        className="mt-8 flex w-full gap-2 rounded-full bg-cream p-1.5 shadow-soft"
      >
        {MODES.map((m) => {
          const active = mode === m.key
          return (
            <motion.button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={m.label}
              onClick={() => onModeChange && onModeChange(m.key)}
              whileTap={{ scale: 0.95 }}
              className={[
                'flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-base font-round transition-colors',
                active ? 'bg-rosy text-white shadow-pop' : 'bg-transparent text-cocoa/70',
              ].join(' ')}
            >
              <span aria-hidden="true">{m.emoji}</span>
              {m.label}
            </motion.button>
          )
        })}
      </div>

      {/* 3) 업로드 드롭존 (드래그앤드롭 + 탭하면 앨범) */}
      <motion.div
        onClick={openAlbum}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        whileTap={{ scale: 0.99 }}
        role="button"
        tabIndex={0}
        aria-label="사진 업로드 영역, 탭하여 앨범에서 선택"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openAlbum()
          }
        }}
        className={[
          'mt-8 flex w-full cursor-pointer flex-col items-center rounded-blob border-2 border-dashed p-6 text-center transition-colors',
          isDragging ? 'border-rosy bg-blush/60' : 'border-peach bg-butter/40',
        ].join(' ')}
      >
        <motion.div
          aria-hidden="true"
          className="text-4xl"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          {mode === 'paw' ? '🐾' : '📸'}
        </motion.div>

        <p className="mt-3 text-lg font-round text-cocoa">{dropzoneHint}</p>
        <p className="mt-1 text-xs text-ink/70">얼굴이나 발바닥 젤리가 잘 보이게 찍어주세요!</p>

        <div className="mt-5 flex w-full flex-col gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={(e) => {
              e.stopPropagation()
              openAlbum()
            }}
            aria-label="앨범에서 사진 선택"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rosy py-4 text-base font-semibold text-white shadow-pop"
          >
            <ImageUp className="h-5 w-5" aria-hidden="true" />
            앨범에서 선택
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={(e) => {
              e.stopPropagation()
              openCamera()
            }}
            aria-label="카메라로 사진 촬영"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-medium text-ink ring-1 ring-black/5 shadow-soft"
          >
            <Camera className="h-5 w-5" aria-hidden="true" />
            카메라로 촬영
          </motion.button>
        </div>
      </motion.div>

      {/* 4) 샘플로 미리보기 */}
      <div className="mt-8 w-full">
        <p className="flex items-center justify-center gap-1.5 text-sm text-ink/70">
          <Images className="h-4 w-4 text-rosy" aria-hidden="true" />
          사진이 없다면? 샘플로 미리보기
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {SAMPLE_IMAGES.map((s) => {
            const loading = sampleLoading === s.src
            const disabled = sampleLoading !== null
            return (
              <motion.button
                key={s.src}
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => handleSample(s.src)}
                disabled={disabled}
                aria-label={`${s.label} 샘플로 결과 미리보기`}
                className={[
                  'relative aspect-square overflow-hidden rounded-2xl border-2 border-white shadow-soft transition-opacity',
                  disabled && !loading ? 'opacity-40' : 'opacity-100',
                ].join(' ')}
              >
                <img
                  src={s.src}
                  alt={`${s.label} 샘플`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span
                  className="absolute bottom-0.5 right-0.5 text-sm drop-shadow"
                  aria-hidden="true"
                >
                  {s.emoji}
                </span>
                {loading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-lg">
                    <motion.span
                      aria-hidden="true"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                    >
                      🐾
                    </motion.span>
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* 5) 내 보관함 진입 */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => onOpenHistory && onOpenHistory()}
        aria-label="내 보관함 열기"
        className="mt-7 flex items-center gap-2 rounded-full bg-white/80 px-5 py-3 text-sm font-round text-cocoa shadow-soft"
      >
        <Bookmark className="h-4 w-4 text-rosy" aria-hidden="true" />
        내 보관함
        {historyCount > 0 && (
          <span className="rounded-full bg-rosy px-2 py-0.5 text-xs text-white">
            {historyCount}
          </span>
        )}
      </motion.button>

      {/* 6) 하단 disclaimer */}
      <p className="mt-6 flex items-center gap-1 text-xs text-ink/60">
        <PawPrint className="h-3.5 w-3.5 text-rosy" aria-hidden="true" />
        결과는 재미로만 봐주세요 🐾
      </p>

      {/* 숨겨진 파일 input — 드롭존 밖(컴포넌트 루트)에 두어
          input.click()의 클릭 이벤트가 드롭존 onClick으로 버블링되어
          파일 대화상자가 재진입(이중 호출)되던 버그를 방지한다.
          추가로 onClick stopPropagation으로 이중 안전장치를 둔다. */}
      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={handleInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={handleInputChange}
      />
    </div>
  )
}
