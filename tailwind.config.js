/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 모던 뉴트럴 테마 — 채도 낮은 웜 뉴트럴 + 코랄 포인트
        cream: '#FAF8F5', // 배경 (온화한 오프화이트)
        butter: '#EFE7D6', // 뮤트 샌드
        peach: '#F0DDD2', // 뮤트 클레이
        blush: '#EFDFDC', // 더스티 베이지로즈
        rosy: '#E8745C', // 포인트 (딥 코랄) — CTA/강조 단일색
        sage: '#6B7B6E', // 서브 포인트 (세이지)
        sky: '#DDE6E8', // 뮤트 쿨그레이
        mint: '#E0E8E1', // 세이지 틴트
        cocoa: '#2B2724', // 제목/진한 텍스트
        ink: '#2B2724', // 본문 텍스트
      },
      fontFamily: {
        round: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        blob: '1.5rem',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(43, 39, 36, 0.07)',
        pop: '0 6px 18px rgba(43, 39, 36, 0.12)',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        wiggle: 'wiggle 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
