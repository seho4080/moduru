// src/features/tripPlan/lib/exportScheduleImage.js
// html-to-image를 사용해 특정 DOM 노드를 PNG로 저장
export async function exportScheduleAsImage(
  rootEl,
  {
    filename = "schedule.png",
    pixelRatio = Math.max(2, window.devicePixelRatio || 1),
    backgroundColor = "#ffffff",
  } = {}
) {
  if (!rootEl) throw new Error("exportScheduleAsImage: rootEl is null");

  // 라이브러리 동적 임포트 (Vite 환경에서 안전)
  const { toPng } = await import("html-to-image");

  // 스크롤 영역까지 모두 캡처되도록 실제 렌더 사이즈로 일시 확장
  const prev = {
    width: rootEl.style.width,
    height: rootEl.style.height,
  };
  const width = rootEl.scrollWidth;
  const height = rootEl.scrollHeight;
  rootEl.style.width = width + "px";
  rootEl.style.height = height + "px";

  try {
    const dataUrl = await toPng(rootEl, {
      cacheBust: true,
      pixelRatio,
      backgroundColor,
      // 내보내기에서 빼고 싶은 요소에 .no-export 클래스를 달면 제외됩니다.
      filter: (node) => {
        const cl = node?.classList;
        if (!cl) return true;
        return !cl.contains("no-export");
      },
      // 폰트/이미지 CORS 문제를 줄이기 위한 옵션들
      skipFonts: false,
      preferCSSPageSize: true,
      // foreignObjectRendering: true, // 필요시 사용
    });

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    // Firefox 대응
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // 원래 사이즈 복구
    rootEl.style.width = prev.width;
    rootEl.style.height = prev.height;
  }
}
