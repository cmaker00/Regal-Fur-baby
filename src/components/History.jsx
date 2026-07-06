import { motion } from 'framer-motion'
import { ArrowLeft, X, Trash2, PawPrint } from 'lucide-react'

const ACCENT_BG = {
  butter: 'bg-butter/50',
  blush: 'bg-blush/60',
  mint: 'bg-mint/60',
  sky: 'bg-sky/60',
  peach: 'bg-peach/60',
}

const TIER_BADGE = {
  전설: { icon: '👑', cls: 'bg-gradient-to-r from-[#D9B45A] to-[#C28A3C] text-white' },
  희귀: { icon: '💎', cls: 'bg-rosy text-white' },
  우수: { icon: '✨', cls: 'bg-white/90 text-ink' },
  평범: { icon: '🍀', cls: 'bg-white/90 text-ink/60' },
}

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

/**
 * 로컬 보관함 화면.
 * props: { items, onSelect(item), onDelete(id), onClear(), onBack() }
 */
export default function History({ items = [], onSelect, onDelete, onClear, onBack }) {
  return (
    <div className="flex w-full flex-col px-5 pb-12 pt-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={onBack}
          aria-label="뒤로 가기"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-cocoa shadow-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>

        <h2 className="text-xl font-round text-cocoa">내 보관함 🧺</h2>

        {items.length > 0 ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onClear}
            aria-label="보관함 전체 삭제"
            className="flex h-10 items-center gap-1 rounded-full bg-white/80 px-3 text-xs text-rosy shadow-soft"
          >
            <Trash2 className="h-4 w-4" />
            전체삭제
          </motion.button>
        ) : (
          <span className="h-10 w-10" aria-hidden="true" />
        )}
      </div>

      {/* 비어있을 때 */}
      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="text-6xl" aria-hidden="true">
            🐾
          </div>
          <p className="mt-4 text-lg font-round text-cocoa">아직 보관한 결과가 없어요</p>
          <p className="mt-1 text-sm text-ink/70">
            관상/족상을 본 결과가 여기에 자동으로 저장돼요.
          </p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onBack}
            className="mt-6 rounded-full bg-rosy px-6 py-3 font-round text-white shadow-pop"
          >
            테스트 하러 가기
          </motion.button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map((item) => {
            const r = item.result || {}
            const accent = ACCENT_BG[r.accent] || ACCENT_BG.butter
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative overflow-hidden rounded-3xl ${accent} shadow-soft`}
              >
                {/* 삭제 버튼 */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete && onDelete(item.id)}
                  aria-label="이 결과 삭제"
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
                >
                  <X className="h-4 w-4" />
                </motion.button>

                {/* 카드 본문 (탭하면 결과 다시 보기) */}
                <button
                  type="button"
                  onClick={() => onSelect && onSelect(item)}
                  aria-label={`${r.title || '결과'} 다시 보기`}
                  className="flex w-full flex-col text-left active:scale-[0.98] transition-transform"
                >
                  <div className="relative aspect-square w-full overflow-hidden">
                    {item.thumb ? (
                      <img
                        src={item.thumb}
                        alt={r.title || '저장된 반려동물 사진'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/50 text-4xl">
                        {r.emoji || '🐾'}
                      </div>
                    )}
                    <span
                      className="absolute -bottom-1 right-1 text-2xl drop-shadow"
                      aria-hidden="true"
                    >
                      {r.emoji || '🐾'}
                    </span>
                    {TIER_BADGE[r.tier] && (
                      <span
                        className={`absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] shadow-soft ${TIER_BADGE[r.tier].cls}`}
                      >
                        <span aria-hidden="true">{TIER_BADGE[r.tier].icon}</span>
                        {r.tier}
                      </span>
                    )}
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="line-clamp-2 text-sm font-round leading-snug text-cocoa">
                      {r.title || '신비로운 결과'}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-ink/55">
                      <PawPrint className="h-3 w-3" aria-hidden="true" />
                      {item.mode === 'paw' ? '족상' : '관상'} · {formatDate(item.ts)}
                    </p>
                  </div>
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
