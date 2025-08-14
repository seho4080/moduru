// src/features/placeDetail/ui/RestaurantDetail.jsx
import { useMemo, useState } from "react";
import "./restaurantDetail.css";

/*
NOTE: 주소는 상위에서 보강될 수 있으므로 prop과 병합한다.
NOTE: homepage는 문자열로 가정하고 http 접두가 없으면 보정한다.
NOTE: 메뉴는 문자열/객체 혼용을 지원하며 ' 등' 제거와 쉼표 분할로 줄바꿈 가독성을 확보한다.
*/

export default function RestaurantDetail({ data = {}, address: addressProp = "" }) {
  const {
    description,
    tel,
    homepage,
    businessHours,
    restDate,
    parking,
    address, // 있을 수도 없음
    menus = [],
  } = data;

  const mergedAddress = address || addressProp;

  const [openHoursOpen, setOpenHoursOpen] = useState(false);
  const [parkingOpen, setParkingOpen] = useState(false);

  // 영업시간 가독성: 첫 하이픈 제거, 두 번째 하이픈부터 줄바꿈
  const formatBusinessHours = (raw) => {
    if (!raw) return "";
    let s = String(raw).trim();
    s = s.replace(/[-–—]\s*/, "");
    s = s.replace(/[-–—]\s*/, "\n");
    return s.replace(/\s{2,}/g, " ");
  };
  const hoursFormatted = useMemo(
    () => formatBusinessHours(businessHours),
    [businessHours]
  );

  // 단일 구간(HH:MM~HH:MM) 기준 간단 상태
  const statusText = useMemo(() => {
    if (!businessHours) return "영업 시작 전";
    const m = String(businessHours).match(/(\d{1,2}):(\d{2})\s*~\s*(\d{1,2}):(\d{2})/);
    if (!m) return "영업 시작 전";
    const [, oh, om, ch, cm] = m.map(Number);
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const openMin = oh * 60 + om;
    const closeMin = ch * 60 + cm;
    if (minutesNow >= openMin && minutesNow < closeMin) return "영업중";
    if (minutesNow >= openMin - 60 && minutesNow < openMin) return "곧 영업 시작";
    return "영업 시작 전";
  }, [businessHours]);

  // 홈페이지 보정
  const homepageText = homepage?.trim() || "";
  const homepageHref = homepageText.startsWith("http")
    ? homepageText
    : homepageText
    ? `https://${homepageText}`
    : "";

  // 메뉴 정규화: 문자열/객체 → 문자열로, ' 등' 제거, 쉼표 기준 분할
  const normMenus = useMemo(() => {
    if (!Array.isArray(menus)) return [];
    return menus.flatMap((m) => {
      const name = typeof m === "string" ? m : (m?.menuName ?? "");
      const cleaned = String(name).replace(/\s+등$/, "");
      return cleaned
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((menuName) => ({ menuName }));
    });
  }, [menus]);

  // 주차 문구 보정: "가능요금" → "가능 요금", "불가능추가" → "불가능 추가"
  const parkingText = useMemo(() => {
    if (!parking) return "";
    let s = String(parking).trim();
    s = s.replace(/^(가능)(?=\S)/, "$1 ");
    s = s.replace(/^(불가능)(?=\S)/, "$1 ");
    return s;
  }, [parking]);

  return (
    <section className="restaurant-detail">
      {/* 주소: 상단 고정 */}
      {mergedAddress && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
            color: "#374151",
          }}
          aria-label="주소"
        >
          <span className="rd-ico" aria-hidden>🏠</span>
          <span style={{ lineHeight: 1.4 }}>{mergedAddress}</span>
        </div>
      )}

      {/* 영업 상태 (토글) */}
      <div
        onClick={() => setOpenHoursOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          userSelect: "none",
          padding: "6px 0",
        }}
        aria-expanded={openHoursOpen}
        aria-label="영업 상태"
      >
        <span className="rd-ico" aria-hidden>🕒</span>
        <span style={{ color: "#4b5563", fontWeight: 500 }}>{statusText}</span>
        <span style={{ marginLeft: "auto" }}>{openHoursOpen ? "▴" : "▾"}</span>
      </div>

      {/* 상세 영업시간 (펼침) */}
      {openHoursOpen && hoursFormatted && (
        <div
          style={{
            margin: "2px 0 10px",
            padding: "8px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            whiteSpace: "pre-line",
            lineHeight: 1.5,
          }}
        >
          {hoursFormatted}
        </div>
      )}

      {/* 휴무일 */}
      {restDate && (
        <div
          style={{
            margin: "4px 0 8px 0",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          aria-label="휴무일"
        >
          <span className="rd-ico" aria-hidden>🚫</span>
          <span>{restDate}</span>
        </div>
      )}

      {/* 연락처/홈페이지 */}
      <ul className="rd-list" style={{ marginTop: 0 }}>
        {tel && (
          <li className="rd-item rd-tel">
            <span className="rd-ico" aria-hidden>📞</span>
            <span className="rd-val">{tel}</span>
          </li>
        )}

        {homepageText && (
          <li className="rd-item">
            <span className="rd-ico" aria-hidden>🌐</span>
            <a
              className="rd-link"
              style={{ flex: 1, minWidth: 0, wordBreak: "break-all" }}
              href={homepageHref}
              target="_blank"
              rel="noreferrer"
              title={homepageText}
            >
              {homepageText}
            </a>
          </li>
        )}
      </ul>

      {/* 주차 여부 (토글) */}
      {parkingText && (
        <>
          <div
            onClick={() => setParkingOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              userSelect: "none",
              padding: "4px 0 2px",
            }}
            aria-expanded={parkingOpen}
            aria-label="주차 여부"
          >
            <span className="rd-ico" aria-hidden>🅿️</span>
            <span style={{ fontWeight: 500, color: "#374151" }}>주차 여부</span>
            <span style={{ marginLeft: "auto" }}>{parkingOpen ? "▴" : "▾"}</span>
          </div>

          {parkingOpen && (
            <div
              style={{
                margin: "2px 0 10px",
                padding: "8px 10px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                lineHeight: 1.5,
              }}
            >
              {parkingText}
            </div>
          )}
        </>
      )}

      {/* 구분선: 주차 여부와 대표 메뉴 사이 */}
      {normMenus.length > 0 && (
        <div
          style={{
            height: 1,
            background: "#e5e7eb",
            margin: "12px 0",
          }}
        />
      )}

      {/* 상세 설명 */}
      {description && (
        <p className="rd-desc" style={{ marginTop: 12 }}>
          {description}
        </p>
      )}

      {/* 대표 메뉴: 쉼표 분할 후 줄바꿈 표시 */}
      {normMenus.length > 0 && (
        <div className="rd-menus">
          <div className="rd-subtitle">대표 메뉴</div>
          <ul className="rd-menu-list">
            {normMenus.map((m, i) => (
              <li key={i} className="rd-menu">
                <span className="rd-menu-name">{m.menuName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      
    </section>
  );
}
