// src/features/placeDetail/ui/SpotDetail.jsx
import { useMemo, useState } from "react";
import "./restaurantDetail.css";

/*
NOTE: homepage는 문자열 전제로 처리하며, http 접두가 없으면 보정한다.
NOTE: businessHours, parking은 토글로 상세 내용을 펼침.
*/

export default function SpotDetail({ data = {}, address: addressProp = "" }) {
  const { address, businessHours, restDate, homepage, parking, description } = data;

  const mergedAddress = address || addressProp;

  const [openHoursOpen, setOpenHoursOpen] = useState(false);
  const [parkingOpen, setParkingOpen] = useState(false);

  // 영업시간 가독성
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

  // 상태 텍스트
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

  // 주차 문구 보정
  const parkingText = useMemo(() => {
    if (!parking) return "";
    let s = String(parking).trim();
    s = s.replace(/^(가능)(?=\S)/, "$1 ");
    s = s.replace(/^(불가능)(?=\S)/, "$1 ");
    return s;
  }, [parking]);

  return (
    <section className="restaurant-detail">
      {/* 1) address */}
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
          <span className="rd-ico" aria-hidden>📍</span>
          <span style={{ lineHeight: 1.4 }}>{mergedAddress}</span>
        </div>
      )}

      {/* 2) businessHours */}
      {businessHours && (
        <>
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
        </>
      )}

      {/* 3) restDate */}
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

      {/* 4) homepage */}
      {homepageText && (
        <ul className="rd-list" style={{ marginTop: 0 }}>
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
        </ul>
      )}

      {/* 5) parking */}
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

      {/* 6) description */}
      {description && (
        <p className="rd-desc" style={{ marginTop: 12 }}>
          {description}
        </p>
      )}
    </section>
  );
}
