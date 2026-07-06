// ─────────────────────────────────────────────────────────────
// Mock 관상/족상 결과 데이터 (SSOT)
// Vision API 연동 전, 결과 화면이 무작위로 불러오는 더미 데이터.
// 실제 분석 결과도 동일한 스키마(shape)를 따르도록 설계한다.
//
// Result shape:
//   {
//     id:          string   고유 키
//     emoji:       string   대표 이모지 (결과 헤더 장식)
//     title:       string   결과 타이틀 (예: "우주 대스타가 될 관상!")
//     subtitle:    string   한 줄 부제
//     summary:     string[] 3줄 요약 설명
//     stats: {              운세 게이지 (0~100)
//       wealth:    number   재물운
//       snack:     number   간식운
//       charm:     number   매력운
//     }
//     tags:        string[] 해시태그 (공유용)
//     tier:        '전설' | '희귀' | '우수' | '평범'  희귀 등급 (자랑·재도전 유도)
//     rarityPercent: number  이 상을 가진 비율 상위 N% (1~99, 낮을수록 희귀)
//     accent:      'butter' | 'blush' | 'mint' | 'sky' | 'peach'  테마 색상 키
//   }
// ─────────────────────────────────────────────────────────────

export const FACE_RESULTS = [
  {
    id: 'face-superstar',
    emoji: '🌟',
    title: '우주 대스타가 될 관상!',
    subtitle: '카메라만 들이대면 광채가 나는 타입',
    summary: [
      '눈빛에서 뿜어져 나오는 아우라가 예사롭지 않아요.',
      '한 번 보면 잊을 수 없는 명품 이목구비의 소유자!',
      '집사의 SNS를 떡상시킬 인플루언서 상입니다.',
    ],
    stats: { wealth: 88, snack: 72, charm: 99 },
    tags: ['#우주대스타', '#광채폭발', '#관상은과학'],
    tier: '전설',
    rarityPercent: 3,
    accent: 'butter',
  },
  {
    id: 'face-boss',
    emoji: '👑',
    title: '집안의 실세, 대왕님 관상!',
    subtitle: '집사를 부하로 거느린 위엄의 상',
    summary: [
      '근엄한 표정 속에 숨겨진 카리스마가 폭발합니다.',
      '밥그릇과 간식 창고의 결정권을 모두 쥐고 있어요.',
      '온 가족이 이 분의 심기를 살피게 되는 상입니다.',
    ],
    stats: { wealth: 95, snack: 90, charm: 80 },
    tags: ['#우리집실세', '#대왕님납시오', '#집사는부하'],
    tier: '희귀',
    rarityPercent: 11,
    accent: 'peach',
  },
  {
    id: 'face-lucky',
    emoji: '🍀',
    title: '굴러온 복덩이 관상!',
    subtitle: '있기만 해도 집안에 복이 들어오는 상',
    summary: [
      '둥글둥글 복스러운 얼굴에 행운이 가득 담겼어요.',
      '이 아이가 온 뒤로 집사에게 좋은 일만 생길 거예요.',
      '재물과 행운을 함께 몰고 다니는 귀한 상입니다.',
    ],
    stats: { wealth: 92, snack: 78, charm: 85 },
    tags: ['#복덩이', '#행운부적', '#키우면부자된다'],
    tier: '희귀',
    rarityPercent: 8,
    accent: 'mint',
  },
  {
    id: 'face-mischief',
    emoji: '😼',
    title: '천방지축 사고뭉치 관상!',
    subtitle: '심심한 건 1초도 못 참는 장난꾸러기',
    summary: [
      '초롱초롱한 눈에 장난기가 가득 차 있네요.',
      '집사가 한눈판 사이 대형 사고를 칠 잠재력이 보여요.',
      '하지만 미워할 수 없는 천하의 애교쟁이랍니다.',
    ],
    stats: { wealth: 60, snack: 88, charm: 94 },
    tags: ['#사고뭉치', '#개구쟁이', '#그래도귀여워'],
    tier: '우수',
    rarityPercent: 34,
    accent: 'sky',
  },
  {
    id: 'face-zen',
    emoji: '🧘',
    title: '도를 깨우친 현자 관상!',
    subtitle: '세상 모든 번뇌를 초월한 평온의 상',
    summary: [
      '무심한 듯 깊은 눈빛에서 도력이 느껴집니다.',
      '어떤 상황에도 흔들리지 않는 단단한 멘탈의 소유자.',
      '집사의 고민을 다 들어줄 것 같은 든든한 상입니다.',
    ],
    stats: { wealth: 75, snack: 65, charm: 82 },
    tags: ['#냥선생', '#멍도사', '#평온그자체'],
    tier: '우수',
    rarityPercent: 28,
    accent: 'blush',
  },
  {
    id: 'face-angel',
    emoji: '😇',
    title: '하늘에서 내려온 천사 관상!',
    subtitle: '보기만 해도 마음이 정화되는 순둥이 상',
    summary: [
      '맑고 동그란 눈에 티 없는 선함이 가득해요.',
      '화 한 번 낼 줄 모르는 천성 착한 마음씨가 보입니다.',
      '곁에 있는 것만으로 집사를 미소 짓게 하는 상이에요.',
    ],
    stats: { wealth: 80, snack: 76, charm: 96 },
    tags: ['#천사강림', '#순둥이', '#보기만해도힐링'],
    tier: '희귀',
    rarityPercent: 14,
    accent: 'sky',
  },
  {
    id: 'face-charisma',
    emoji: '🔥',
    title: '도시의 카리스마, 시크 관상!',
    subtitle: '눈빛 하나로 분위기를 평정하는 상',
    summary: [
      '서늘하고 또렷한 눈매에 도도함이 흘러넘쳐요.',
      '쉽게 곁을 주지 않지만 한번 마음 열면 끝까지 가는 의리파.',
      '사진만 찍으면 화보가 되는 타고난 모델 상입니다.',
    ],
    stats: { wealth: 84, snack: 62, charm: 92 },
    tags: ['#시크美', '#눈빛장인', '#알고보면츤데레'],
    tier: '우수',
    rarityPercent: 22,
    accent: 'blush',
  },
  {
    id: 'face-derp',
    emoji: '🤪',
    title: '4차원 허당, 천연 관상!',
    subtitle: '엉뚱함이 매력이 되는 행복 전도사',
    summary: [
      '어딘가 풀린 듯한 표정에 천진난만함이 가득해요.',
      '예측 불가능한 행동으로 매일 웃음을 선사합니다.',
      '함께 있으면 걱정이 사르르 녹는 행복 부적 같은 상.',
    ],
    stats: { wealth: 68, snack: 90, charm: 89 },
    tags: ['#4차원', '#천연기념물', '#웃음치료사'],
    tier: '평범',
    rarityPercent: 58,
    accent: 'butter',
  },
]

export const PAW_RESULTS = [
  {
    id: 'paw-snackraider',
    emoji: '🍪',
    title: '간식 창고를 거덜 낼 족상!',
    subtitle: '발바닥에 새겨진 먹보의 기운',
    summary: [
      '말랑한 젤리에서 끝없는 식탐의 기운이 느껴져요.',
      '간식 봉지 소리를 0.1초 만에 감지하는 능력자!',
      '집사의 지갑을 간식으로 거덜 낼 무시무시한 족상.',
    ],
    stats: { wealth: 70, snack: 99, charm: 86 },
    tags: ['#간식창고털이범', '#먹보젤리', '#족상은정직해'],
    tier: '우수',
    rarityPercent: 31,
    accent: 'peach',
  },
  {
    id: 'paw-goldenpad',
    emoji: '💰',
    title: '황금 젤리, 재물운 만렙 족상!',
    subtitle: '밟는 곳마다 금이 솟는 부자 발바닥',
    summary: [
      '도톰하고 탄력 있는 젤리에 재물운이 가득해요.',
      '이 발로 집사의 통장을 든든하게 지켜줄 거예요.',
      '복과 돈을 함께 밟고 다니는 황금 족상입니다.',
    ],
    stats: { wealth: 99, snack: 74, charm: 80 },
    tags: ['#황금젤리', '#재물운만렙', '#발바닥로또'],
    tier: '전설',
    rarityPercent: 4,
    accent: 'butter',
  },
  {
    id: 'paw-marshmallow',
    emoji: '☁️',
    title: '구름을 밟고 다니는 마시멜로 족상!',
    subtitle: '세상에서 가장 말랑한 행복의 상',
    summary: [
      '몽글몽글한 젤리가 마시멜로처럼 보드라워요.',
      '이 발로 꾹꾹이를 받으면 모든 스트레스가 녹습니다.',
      '집사에게 무한한 힐링을 선사할 천사의 족상.',
    ],
    stats: { wealth: 78, snack: 70, charm: 97 },
    tags: ['#말랑젤리', '#꾹꾹이장인', '#힐링발바닥'],
    tier: '희귀',
    rarityPercent: 13,
    accent: 'mint',
  },
  {
    id: 'paw-explorer',
    emoji: '🗺️',
    title: '온 집안을 정복할 탐험가 족상!',
    subtitle: '가만히 있는 법을 모르는 모험의 상',
    summary: [
      '단단한 젤리에 지칠 줄 모르는 활력이 가득해요.',
      '집안 구석구석 안 가본 곳이 없는 탐험왕입니다.',
      '높은 곳, 좁은 곳 어디든 정복하는 용감한 족상.',
    ],
    stats: { wealth: 66, snack: 80, charm: 90 },
    tags: ['#탐험왕', '#호기심대장', '#못말리는모험가'],
    tier: '우수',
    rarityPercent: 37,
    accent: 'sky',
  },
  {
    id: 'paw-lazyking',
    emoji: '🛋️',
    title: '소파와 한 몸이 될 잠만보 족상!',
    subtitle: '눕는 것이 곧 인생인 휴식의 달인',
    summary: [
      '느긋하게 늘어진 젤리에서 여유가 묻어나요.',
      '하루 20시간 숙면이 가능한 잠의 요정입니다.',
      '집사 옆에서 평생 뒹굴며 행복을 줄 족상이에요.',
    ],
    stats: { wealth: 82, snack: 85, charm: 88 },
    tags: ['#잠만보', '#소파지박령', '#휴식이곧삶'],
    tier: '평범',
    rarityPercent: 52,
    accent: 'blush',
  },
  {
    id: 'paw-pinkjelly',
    emoji: '🌸',
    title: '벚꽃빛 핑크젤리, 사랑둥이 족상!',
    subtitle: '보기만 해도 설레는 핑크빛 매력의 상',
    summary: [
      '여린 분홍빛 젤리에서 사랑스러움이 폭발해요.',
      '이 발로 톡톡 건드리면 누구든 무장해제됩니다.',
      '집사의 심장을 매일 저격하는 치명적 애교 족상.',
    ],
    stats: { wealth: 74, snack: 78, charm: 98 },
    tags: ['#핑크젤리', '#사랑둥이', '#심쿵유발자'],
    tier: '희귀',
    rarityPercent: 10,
    accent: 'blush',
  },
  {
    id: 'paw-warrior',
    emoji: '🐾',
    title: '백전백승, 츤데레 무사 족상!',
    subtitle: '겉은 까칠 속은 다정한 든든한 상',
    summary: [
      '야무지게 꽉 찬 젤리에 단단한 심지가 느껴져요.',
      '사냥 본능 만렙, 장난감 앞에선 천하무적입니다.',
      '평소엔 시크해도 집사 위기엔 달려오는 의리파 족상.',
    ],
    stats: { wealth: 81, snack: 72, charm: 87 },
    tags: ['#용맹무사', '#사냥왕', '#알고보면다정'],
    tier: '우수',
    rarityPercent: 26,
    accent: 'sky',
  },
  {
    id: 'paw-bean',
    emoji: '🫘',
    title: '오동통 콩젤리, 복 굴러오는 족상!',
    subtitle: '동글동글 야무진 복주머니 발바닥',
    summary: [
      '콩처럼 오동통한 젤리에 소박한 복이 가득해요.',
      '욕심내지 않아도 알아서 행운이 찾아오는 타입.',
      '집사에게 잔잔한 행복을 차곡차곡 쌓아줄 족상이에요.',
    ],
    stats: { wealth: 86, snack: 83, charm: 84 },
    tags: ['#콩젤리', '#소소한행복', '#복주머니발'],
    tier: '평범',
    rarityPercent: 49,
    accent: 'butter',
  },
]

// 모든 결과 (모드 무관 무작위 추출용 fallback)
export const ALL_RESULTS = [...FACE_RESULTS, ...PAW_RESULTS]

/**
 * 분석 모드에 맞는 무작위 결과 하나를 반환한다.
 * @param {'face' | 'paw' | undefined} mode
 * @returns {object} 결과 객체 (위 스키마)
 */
export function pickRandomResult(mode) {
  const pool =
    mode === 'face' ? FACE_RESULTS : mode === 'paw' ? PAW_RESULTS : ALL_RESULTS
  // 안전장치: 풀이 비어 있으면 전체에서 첫 항목 반환
  if (!pool || pool.length === 0) return ALL_RESULTS[0]
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}
