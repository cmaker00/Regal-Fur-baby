// src/utils/validateImage.js
// 업로드된 이미지 파일을 안전하게 검증하고 dataURL로 변환한다.
// 어떤 예외 상황에서도 절대 throw 하지 않고, 항상 결과 객체를 resolve 한다.

/** 허용하는 이미지 MIME 타입 목록 */
const ALLOWED_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

/** 최대 허용 용량 (10MB) */
const MAX_SIZE = 10 * 1024 * 1024;

/** 확장자 기반 보조 검증 (일부 기기에서 MIME이 비어있을 때 대비) */
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];

/**
 * 파일이 허용된 이미지 형식인지 판별한다.
 * MIME 우선, 비어있으면 확장자로 보조 판정.
 * @param {File} file
 * @returns {boolean}
 */
function isAllowedImage(file) {
  const type = (file.type || '').toLowerCase();
  if (type) {
    return ALLOWED_MIME.includes(type) || type.startsWith('image/');
  }
  // MIME이 비어있는 경우(특히 HEIC) 확장자로 판단
  const name = (file.name || '').toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() : '';
  return ALLOWED_EXT.includes(ext);
}

/**
 * 파일을 dataURL 문자열로 읽는다.
 * @param {File} file
 * @returns {Promise<string|null>} 성공 시 dataURL, 실패 시 null
 */
function readAsDataUrl(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        resolve(typeof result === 'string' ? result : null);
      };
      reader.onerror = () => resolve(null);
      reader.onabort = () => resolve(null);
      reader.readAsDataURL(file);
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * dataURL이 실제로 이미지로 로드 가능한지 확인한다(깨진 파일 거름).
 * 단, HEIC/HEIF는 브라우저가 <img>로 못 그리는 경우가 많아 로드 검증을 건너뛴다.
 * @param {string} dataUrl
 * @param {File} file
 * @returns {Promise<boolean>}
 */
function canLoadImage(dataUrl, file) {
  // HEIC/HEIF는 디코딩 미지원 브라우저가 많으므로 로드 검증 생략(통과 처리)
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (
    type.includes('heic') ||
    type.includes('heif') ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  ) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      img.onload = () => {
        // 폭/높이가 0이면 깨진 것으로 간주
        done((img.naturalWidth || img.width || 0) > 0);
      };
      img.onerror = () => done(false);
      // 안전장치: 너무 오래 걸리면 실패 처리(앱이 멈추지 않도록)
      setTimeout(() => done(false), 8000);
      img.src = dataUrl;
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * 업로드된 이미지 파일을 검증한다.
 *
 * 검증 순서:
 *  1) 파일 존재 여부
 *  2) 이미지 MIME/확장자 허용 여부
 *  3) 용량(10MB 이하)
 *  4) dataURL 변환 가능 여부
 *  5) 실제 이미지 로드(디코딩) 가능 여부 — 깨진 파일 거름
 *
 * 절대 throw 하지 않으며, 항상 결과 객체를 resolve 한다.
 *
 * @param {File} file - 사용자가 선택/드롭한 파일
 * @returns {Promise<{ok:true, dataUrl:string} | {ok:false, error:string}>}
 */
export default async function validateImage(file) {
  try {
    // 1) 파일 존재
    if (!file) {
      return { ok: false, error: '어라, 사진이 없네요! 다시 한 번 골라줄래요? 🐾' };
    }

    // 2) 이미지 형식
    if (!isAllowedImage(file)) {
      return { ok: false, error: '앗, 사진 파일만 올려줄 수 있어요! 🖼️' };
    }

    // 3) 용량
    if (typeof file.size === 'number' && file.size > MAX_SIZE) {
      return { ok: false, error: '사진이 너무 커요! 10MB 이하로 부탁해요 🐘' };
    }
    if (typeof file.size === 'number' && file.size === 0) {
      return { ok: false, error: '이 사진은 열 수가 없어요... 다른 사진으로 다시! 🙈' };
    }

    // 4) dataURL 변환
    const dataUrl = await readAsDataUrl(file);
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return { ok: false, error: '사진을 읽는 데 실패했어요... 다른 사진으로 다시! 🙈' };
    }

    // 5) 실제 로드 가능 여부
    const loadable = await canLoadImage(dataUrl, file);
    if (!loadable) {
      return { ok: false, error: '이 사진은 열 수가 없어요... 다른 사진으로 다시! 🙈' };
    }

    return { ok: true, dataUrl };
  } catch (e) {
    // 예상치 못한 모든 예외도 유쾌하게 graceful 처리
    return { ok: false, error: '으앙, 사진 처리 중에 문제가 생겼어요... 다시 시도해 주세요 🐶' };
  }
}

// named export
export { validateImage };
