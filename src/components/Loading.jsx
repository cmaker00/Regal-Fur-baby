import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, PawPrint } from 'lucide-react';

const SUB_COPIES_FACE = [
  '눈빛에서 우주의 기운을 읽는 중...',
  '미간의 복(福)을 측정하는 중...',
  '간식 취향을 분석하는 중...',
  '전생을 거슬러 올라가는 중...',
  '귀여움 수치가 너무 높아 잠시 멈춤...',
];

const SUB_COPIES_PAW = [
  '젤리의 말랑도를 측정하는 중...',
  '발바닥 향기를 감별하는 중...',
  '꾹꾹이 횟수를 세어보는 중...',
  '족상에 깃든 재물운을 읽는 중...',
  '젤리가 너무 귀여워 잠시 멈춤...',
];

export default function Loading({ image, mode }) {
  const isPaw = mode === 'paw';
  const subCopies = isPaw ? SUB_COPIES_PAW : SUB_COPIES_FACE;
  const mainText = isPaw
    ? 'AI가 돋보기를 들고\n젤리를 분석하는 중...'
    : 'AI가 돋보기를 들고\n관상을 보는 중...';

  const [copyIndex, setCopyIndex] = useState(0);

  useEffect(() => {
    setCopyIndex(0);
    const id = setInterval(() => {
      setCopyIndex((prev) => (prev + 1) % subCopies.length);
    }, 1200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="flex w-full flex-col items-center justify-center px-5 py-10 text-center">
      {/* 이미지 미리보기 + 떠다니는 아이콘들 */}
      <div className="relative mb-10 flex items-center justify-center">
        {/* 빙글빙글 도는 반짝이 (뒤쪽 후광) */}
        <motion.div
          aria-hidden="true"
          className="absolute -inset-6 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
        >
          <Sparkles className="absolute left-1/2 top-0 h-7 w-7 -translate-x-1/2 text-rosy" />
          <Sparkles className="absolute bottom-0 left-1/2 h-6 w-6 -translate-x-1/2 text-sky" />
          <Sparkles className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-butter" />
          <Sparkles className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 text-mint" />
        </motion.div>

        {/* 원형 이미지 프레임 */}
        <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow-soft">
          {image ? (
            <img
              src={image}
              alt="분석 중인 반려동물 사진"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-peach text-6xl">
              <span role="img" aria-label="반려동물">
                {isPaw ? '🐾' : '🐶'}
              </span>
            </div>
          )}
        </div>

        {/* 통통 튀는 돋보기 */}
        <motion.div
          aria-hidden="true"
          className="absolute -right-2 -top-2 flex h-14 w-14 items-center justify-center rounded-full bg-butter shadow-pop"
          animate={{ y: [0, -10, 0], rotate: [-8, 8, -8] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
        >
          <Search className="h-7 w-7 text-cocoa" />
        </motion.div>

        {/* 위아래로 통통 튀는 PawPrint 아이콘들 */}
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-3 -left-3"
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
        >
          <PawPrint className="h-8 w-8 text-rosy" />
        </motion.div>
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-1 right-0"
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut', delay: 0.3 }}
        >
          <PawPrint className="h-6 w-6 text-sky" />
        </motion.div>
      </div>

      {/* 메인 텍스트 */}
      <h2 className="mb-4 whitespace-pre-line text-2xl font-bold leading-snug text-ink">
        {mainText}
      </h2>

      {/* 로테이션 서브 카피 */}
      <motion.p
        key={copyIndex}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-[1.5rem] text-base text-cocoa"
      >
        {subCopies[copyIndex]}
      </motion.p>

      {/* 통통 튀는 점 3개 인디케이터 */}
      <div className="mt-6 flex items-center justify-center gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-3 w-3 rounded-full bg-rosy"
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{
              repeat: Infinity,
              duration: 0.7,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        ))}
      </div>

      <span className="sr-only" role="status">
        결과를 분석하는 중입니다. 잠시만 기다려 주세요.
      </span>
    </div>
  );
}
