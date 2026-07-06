import { toPng } from 'html-to-image';

/**
 * 결과 카드 DOM 노드를 PNG dataURL로 캡처한다.
 * 폰트 로딩이 끝난 뒤 캡처해 둥근 한글 폰트가 깨지지 않도록 한다.
 *
 * @param {HTMLElement} node 캡처할 DOM 엘리먼트
 * @returns {Promise<string>} PNG 형식의 dataURL (data:image/png;base64,...)
 * @throws 캡처 실패 시 에러를 throw (상위에서 catch 하여 graceful 처리)
 */
export async function captureNode(node) {
  if (!node) {
    throw new Error('캡처할 화면을 찾지 못했어요 🥲');
  }

  // 폰트 로딩 안정화: 지원 브라우저에서만 await (없으면 그냥 진행)
  try {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch {
    // 폰트 준비 단계 실패는 치명적이지 않으니 무시하고 캡처 진행
  }

  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#FAF8F5',
  });

  return dataUrl;
}

/**
 * dataURL 이미지를 a 태그 download 트릭으로 사용자의 기기에 저장한다.
 *
 * @param {string} dataUrl 저장할 이미지의 dataURL
 * @param {string} [filename='petface.png'] 저장될 파일 이름
 * @returns {void}
 */
export function downloadImage(dataUrl, filename = 'petface.png') {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    // 저장 트릭 실패 시에도 앱이 죽지 않도록 조용히 무시
  }
}

/**
 * 결과 이미지를 OS 공유 시트로 공유한다.
 * Web Share API(파일 공유) 지원 시 시도하고, 미지원/실패 시 다운로드로 폴백한다.
 * 사용자가 공유를 취소(AbortError)한 경우는 조용히 처리한다.
 *
 * @param {string} dataUrl 공유할 이미지의 dataURL
 * @param {{title?: string, text?: string}} [options] 공유 메타데이터
 * @returns {Promise<{shared: boolean}>} 공유 성공 시 {shared:true}, 폴백/취소 시 {shared:false}
 */
export async function shareImage(dataUrl, { title, text } = {}) {
  try {
    // dataURL -> Blob -> File 변환
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'petface.png', { type: 'image/png' });

    // 파일 공유 지원 여부 확인
    const canShareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      typeof navigator.share === 'function' &&
      navigator.canShare({ files: [file] });

    if (canShareFiles) {
      await navigator.share({ files: [file], title, text });
      return { shared: true };
    }

    // 파일 공유 미지원 → 다운로드 폴백
    downloadImage(dataUrl, 'petface.png');
    return { shared: false };
  } catch (err) {
    // 사용자가 공유 시트를 닫은 경우(AbortError)는 조용히 종료
    if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
      return { shared: false };
    }

    // 그 외 예외는 다운로드로 graceful 폴백 (앱은 절대 죽지 않음)
    try {
      downloadImage(dataUrl, 'petface.png');
    } catch {
      // 폴백마저 실패해도 조용히 무시
    }
    return { shared: false };
  }
}
