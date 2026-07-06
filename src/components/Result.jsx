import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Share2,
  RotateCcw,
  Sparkles,
  Heart,
  Coins,
  Cookie,
  Check,
  PawPrint,
} from 'lucide-react';
import { captureNode, downloadImage, shareImage } from '../utils/saveResult';
import { track } from '../utils/analytics';

// accent 키 -> 정적 Tailwind 클래스 매핑
// (Tailwind는 동적 문자열 클래스를 purge하므로 반드시 정적으로 나열)
// 모던 뉴트럴: 카드 배경만 은은한 톤으로 구분하고, 강조색은 코랄(rosy) 하나로 통일.
const ACCENT = {
  butter: { cardBg: 'bg-butter/40', badgeBg: 'bg-butter', title: 'text-cocoa', titleGlow: 'text-cocoa', bar: 'bg-rosy', pill: 'bg-white text-ink/70', ring: 'ring-black/5' },
  blush:  { cardBg: 'bg-blush/40', badgeBg: 'bg-blush',  title: 'text-cocoa', titleGlow: 'text-cocoa', bar: 'bg-rosy', pill: 'bg-white text-ink/70', ring: 'ring-black/5' },
  mint:   { cardBg: 'bg-mint/45',  badgeBg: 'bg-mint',   title: 'text-cocoa', titleGlow: 'text-cocoa', bar: 'bg-rosy', pill: 'bg-white text-ink/70', ring: 'ring-black/5' },
  sky:    { cardBg: 'bg-sky/45',   badgeBg: 'bg-sky',    title: 'text-cocoa', titleGlow: 'text-cocoa', bar: 'bg-rosy', pill: 'bg-white text-ink/70', ring: 'ring-black/5' },
  peach:  { cardBg: 'bg-peach/40', badgeBg: 'bg-peach',  title: 'text-cocoa', titleGlow: 'text-cocoa', bar: 'bg-rosy', pill: 'bg-white text-ink/70', ring: 'ring-black/5' },
};

const STAT_META = [
  { key: 'wealth', label: '재물운', Icon: Coins },
  { key: 'snack', label: '간식운', Icon: Cookie },
  { key: 'charm', label: '매력운', Icon: Heart },
];

// 희귀 등급별 배지 스타일 (자랑·재도전 유도)
const TIER_META = {
  전설: { icon: '👑', badge: 'bg-gradient-to-r from-[#D9B45A] to-[#C28A3C] text-white', shimmer: true },
  희귀: { icon: '💎', badge: 'bg-rosy text-white', shimmer: true },
  우수: { icon: '✨', badge: 'bg-white text-ink ring-1 ring-black/10', shimmer: false },
  평범: { icon: '🍀', badge: 'bg-white text-ink/60 ring-1 ring-black/10', shimmer: false },
};

// 공유/저장 시 앱으로 되돌아오는 링크 (공유받은 사람이 바로 따라 할 수 있도록)
const APP_URL =
  (typeof window !== 'undefined' && window.location && window.location.origin) || '';
// 캡처 이미지 워터마크에 표시할 호스트 (프로토콜 제거)
const APP_HOST = APP_URL.replace(/^https?:\/\//, '');

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22 },
  },
};

export default function Result({ image, result, mode, onRestart, onTryOther, onToast }) {
  const captureRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // ── 방어 코드: 결과나 이미지가 없으면 다시하기로 유도 ──
  if (!result || !image) {
    return (
      <div className="w-full px-5 py-12 flex flex-col items-center gap-5 text-center">
        <div className="text-6xl" aria-hidden="true">
          🙀
        </div>
        <h2 className="text-xl text-cocoa">
          앗, 결과를 불러오지 못했어요!
        </h2>
        <p className="text-ink/70 leading-relaxed">
          사진을 다시 올리면 우리 댕냥이의 관상을 새로 봐드릴게요.
        </p>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onRestart?.()}
          className="mt-2 w-full max-w-xs py-4 rounded-full bg-rosy text-white text-lg shadow-pop flex items-center justify-center gap-2"
          aria-label="처음으로 돌아가 다시 테스트하기"
        >
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
          다시 하기
        </motion.button>
      </div>
    );
  }

  const accentKey = ACCENT[result.accent] ? result.accent : 'butter';
  const a = ACCENT[accentKey];

  const summary = Array.isArray(result.summary) ? result.summary.slice(0, 3) : [];
  const tags = Array.isArray(result.tags) ? result.tags : [];
  const stats = result.stats || {};
  const isPaw = mode === 'paw';
  const Bullet = isPaw ? PawPrint : Check;

  // 희귀 등급 / 상위 N% (자랑·재도전 요소)
  const tier = TIER_META[result.tier] ? result.tier : '우수';
  const tierMeta = TIER_META[tier];
  const rarityPercent = Math.max(1, Math.min(99, Math.round(Number(result.rarityPercent) || 30)));

  const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));

  // ── 결과 이미지 저장 ──
  const handleSave = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    track('save_click', { mode, tier });
    try {
      const node = captureRef.current;
      if (!node) throw new Error('capture node missing');
      const dataUrl = await captureNode(node);
      downloadImage(dataUrl, `petface-${result.id || 'result'}.png`);
      onToast?.('갤러리에 저장했어요! 🎉', 'success');
    } catch (err) {
      onToast?.('저장에 실패했어요, 다시 시도해 주세요 🙈', 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  // ── 공유하기 ──
  const handleShare = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    track('share_click', { mode, tier });
    try {
      const node = captureRef.current;
      if (!node) throw new Error('capture node missing');
      const dataUrl = await captureNode(node);
      const bragText = [
        `우리 댕냥이는 「${result.title}」`,
        `${tierMeta.icon} ${tier} 등급 · 상위 ${rarityPercent}%!`,
        tags.join(' '),
        APP_URL && `나도 우리 아이 관상 보기 👉 ${APP_URL}`,
      ]
        .filter(Boolean)
        .join('\n');
      const res = await shareImage(dataUrl, {
        title: result.title || '우리 댕냥이 관상 결과',
        text: bragText,
      });
      if (res && res.shared) {
        track('share_done', { mode, tier, method: 'web_share' });
        onToast?.('공유 준비 완료! 🐾', 'success');
      } else {
        track('share_done', { mode, tier, method: 'download_fallback' });
        onToast?.('이미지를 저장했어요. SNS에 올려보세요! 📲', 'info');
      }
    } catch (err) {
      onToast?.('공유에 실패했어요, 다시 시도해 주세요 🙈', 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="w-full px-5 pb-10 flex flex-col items-center">
      {/* ── 캡처 대상 카드 ── */}
      <motion.div
        ref={captureRef}
        variants={container}
        initial="hidden"
        animate="show"
        className={`relative w-full ${a.cardBg} rounded-blob shadow-soft px-5 pt-7 pb-5 flex flex-col items-center gap-4`}
      >
        {/* 희귀 등급 장식 (전설/희귀일 때만 은은한 반짝이) */}
        {tierMeta.shimmer && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <Sparkles className="absolute left-3 top-3 w-4 h-4 text-rosy/25" />
            <Sparkles className="absolute right-4 top-6 w-3 h-3 text-rosy/20" />
            <Sparkles className="absolute right-6 bottom-5 w-4 h-4 text-rosy/20" />
            <Sparkles className="absolute left-5 bottom-8 w-3 h-3 text-rosy/15" />
          </div>
        )}

        {/* 왕 프레임: 후광 + 왕관 + 골드 프레임 + 카툰풍 사진 (캐리커처 강조) */}
        <motion.div variants={item} className="relative mt-3">
          {/* 뒤쪽 후광 */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -m-3 rounded-full bg-gradient-to-br from-[#F3DFA0]/60 to-rosy/20 blur-lg"
          />
          {/* 양옆 반짝이 */}
          <span aria-hidden="true" className="absolute -left-3 top-6 text-lg [filter:drop-shadow(0_1px_1px_rgba(0,0,0,0.15))]">✨</span>
          <span aria-hidden="true" className="absolute -right-2 top-2 text-base [filter:drop-shadow(0_1px_1px_rgba(0,0,0,0.15))]">✨</span>

          {/* 왕관 (사진 위로 살짝 솟음) */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 -top-6 -translate-x-1/2 -rotate-6 z-20 text-[44px] leading-none [filter:drop-shadow(0_3px_2px_rgba(0,0,0,0.22))]"
          >
            👑
          </div>

          {/* 골드 프레임 + 카툰 필터 사진 */}
          <div className="relative z-10 p-[5px] rounded-full bg-gradient-to-br from-[#EBD083] via-[#D9B45A] to-[#C28A3C] shadow-pop">
            <div className="w-44 h-44 rounded-full overflow-hidden border-[3px] border-white bg-white">
              <img
                src={image}
                alt="분석한 반려동물 사진"
                className="w-full h-full object-cover"
                style={{ filter: 'contrast(1.18) saturate(1.5) brightness(1.03)' }}
                crossOrigin="anonymous"
              />
            </div>
          </div>

          {/* 결과 대표 이모지 뱃지 */}
          <div
            className={`absolute -bottom-1 -right-1 z-20 ${a.badgeBg} w-14 h-14 rounded-full shadow-pop flex items-center justify-center text-3xl border-4 border-white`}
            aria-hidden="true"
          >
            {result.emoji || '🐾'}
          </div>
        </motion.div>

        {/* 희귀 등급 배지 (자랑 포인트) */}
        <motion.div variants={item} className="flex items-center gap-2">
          <span
            className={`relative overflow-hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm shadow-pop ${tierMeta.badge}`}
          >
            <span aria-hidden="true">{tierMeta.icon}</span>
            <span>{tier} 등급</span>
            {tierMeta.shimmer && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/40 skew-x-12"
                animate={{ x: ['0%', '450%'] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', repeatDelay: 0.6 }}
              />
            )}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-white/80 text-cocoa ring-1 ring-cocoa/10">
            상위 <strong className="mx-1">{rarityPercent}%</strong>
          </span>
        </motion.div>

        {/* 타이틀 / 부제 */}
        <motion.div variants={item} className="relative text-center px-1">
          <h2 className={`text-[26px] font-round leading-snug tracking-tight ${a.title}`}>
            <span className={a.titleGlow}>{result.title}</span>
          </h2>
          {result.subtitle && (
            <p className="mt-1 text-ink/70 text-sm leading-relaxed">
              {result.subtitle}
            </p>
          )}
        </motion.div>

        {/* 요약 3줄 */}
        {summary.length > 0 && (
          <motion.ul
            variants={item}
            className="w-full bg-white/70 rounded-3xl px-4 py-3 flex flex-col gap-2"
          >
            {summary.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-ink/80 text-sm leading-relaxed">
                <span className={`mt-0.5 ${a.titleGlow} shrink-0`} aria-hidden="true">
                  <Bullet className="w-4 h-4" />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </motion.ul>
        )}

        {/* 운세 스탯 게이지 */}
        <motion.div variants={item} className="w-full flex flex-col gap-3 px-1">
          {STAT_META.map(({ key, label, Icon }) => {
            const value = clamp(stats[key]);
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-16 shrink-0 flex items-center gap-1 text-ink/80 text-sm">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </span>
                <div
                  className="flex-1 h-3.5 bg-white/80 rounded-full overflow-hidden ring-1 ring-cocoa/10"
                  role="progressbar"
                  aria-label={`${label} ${value}점`}
                  aria-valuenow={value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full ${a.bar} rounded-full transition-[width] duration-700 ease-out`}
                    style={{
                      width: `${value}%`,
                      minWidth: value > 0 ? '0.5rem' : 0,
                    }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-sm text-cocoa">
                  {value}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* 해시태그 pill */}
        {tags.length > 0 && (
          <motion.div variants={item} className="w-full flex flex-wrap justify-center gap-2">
            {tags.map((tag, i) => (
              <span
                key={i}
                className={`${a.pill} px-3 py-1 rounded-full text-xs shadow-soft`}
              >
                {tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* 워터마크 — 공유된 이미지만 봐도 따라 할 수 있도록 앱 주소 노출 */}
        <motion.div
          variants={item}
          className="pt-1 flex flex-col items-center gap-0.5 text-center"
        >
          <span className="text-[11px] text-ink/45">우리 댕냥이 관상·족상 테스트 🐾</span>
          {APP_HOST && (
            <span className="text-[11px] text-rosy/70">👉 {APP_HOST}</span>
          )}
        </motion.div>
      </motion.div>

      {/* ── 액션 버튼 (캡처 영역 밖) — 코랄 위계: 공유=주, 저장=보조, 나머지=서브 ── */}
      <div className="w-full mt-6 flex flex-col gap-2.5">
        {/* 주 액션: 공유 (바이럴) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={handleShare}
          disabled={isCapturing}
          aria-label="결과를 인스타 스토리나 X에 공유하기"
          className="w-full py-4 rounded-2xl bg-rosy text-white text-lg font-semibold shadow-pop flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Share2 className="w-5 h-5" aria-hidden="true" />
          자랑하기 <span className="text-xs font-normal text-white/80">(스토리 · X)</span>
        </motion.button>

        {/* 보조 액션: 저장 (코랄 아웃라인) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          disabled={isCapturing}
          aria-label="결과 이미지를 갤러리에 저장하기"
          className="w-full py-4 rounded-2xl bg-white text-rosy text-lg font-semibold ring-1 ring-rosy/40 shadow-soft flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isCapturing ? (
            <>
              <Sparkles className="w-5 h-5 animate-wiggle" aria-hidden="true" />
              저장 중...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" aria-hidden="true" />
              이미지 저장
            </>
          )}
        </motion.button>

        {/* 서브 액션: 교차 모드 + 다시하기 (한 줄에 나란히) */}
        <div className="mt-1 flex gap-2.5">
          {onTryOther && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onTryOther()}
              disabled={isCapturing}
              aria-label={isPaw ? '얼굴 관상도 보러 가기' : '발바닥 족상도 보러 가기'}
              className="flex-1 py-3.5 rounded-2xl bg-white/70 text-ink text-sm ring-1 ring-black/5 flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <PawPrint className="w-4 h-4 text-sage" aria-hidden="true" />
              {isPaw ? '얼굴 관상도' : '발바닥 족상도'}
            </motion.button>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onRestart?.()}
            disabled={isCapturing}
            aria-label="처음으로 돌아가 다시 테스트하기"
            className="flex-1 py-3.5 rounded-2xl bg-white/70 text-ink/70 text-sm ring-1 ring-black/5 flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            다시 하기
          </motion.button>
        </div>
      </div>
    </div>
  );
}
