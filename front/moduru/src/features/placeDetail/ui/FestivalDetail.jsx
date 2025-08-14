import React from "react";
import "./festivalDetail.css";

export default function FestivalDetail({ data = {} }) {
  const { address, period, organizer, homepage, sns } = data;

  // 추가 필드
  const { infoCenter, description } = data;

  const fixUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  // organizer가 배열/문자 모두 들어올 수 있어 통일
  const formatOrganizer = (org) =>
    Array.isArray(org) ? org.filter(Boolean).join(", ") : String(org ?? "");

  // 전화 링크 안전 처리
  const fixTel = (tel) => {
    if (!tel) return "";
    const s = String(tel).trim();
    const digits = s.replace(/[^\d+]/g, "");
    return digits || s;
  };

  return (
    <section className="festival-detail">
      {/* 주소 */}
      {address && (
        <div className="festival-row">
          <span className="festival-icon" aria-hidden>🏠</span>
          <span className="festival-text">{address}</span>
        </div>
      )}

      {/* 기간 */}
      {period && (
        <div className="festival-row">
          <span className="festival-icon" aria-hidden>📅</span>
          <span className="festival-text">{period}</span>
        </div>
      )}

      {/* 주최(별도 관리) */}
      {organizer && (
        <div className="festival-row">
          <span className="festival-icon" aria-hidden>🧑‍💼</span>
          <span
            className="festival-text festival-organizer"
            title={formatOrganizer(organizer)}
          >
            {formatOrganizer(organizer)}
          </span>
        </div>
      )}

      {/* 홈페이지 */}
      {homepage && (
        <div className="festival-row">
          <span className="festival-icon festival-icon--globe" aria-hidden>🌐</span>
          <a
            className="festival-link"
            href={fixUrl(homepage)}
            title={homepage}
            target="_blank"
            rel="noreferrer"
          >
            {homepage}
          </a>
        </div>
      )}

      {/* SNS */}
      {sns && (
        <div className="festival-row">
          <span className="festival-icon" aria-hidden>📷</span>
          <a
            className="festival-link"
            href={fixUrl(sns)}
            title={sns}
            target="_blank"
            rel="noreferrer"
          >
            {sns}
          </a>
        </div>
      )}

      {/* 전화(콜센터) */}
      {infoCenter && (
        <div className="festival-row">
          <span className="festival-icon" aria-hidden>📞</span>
          <a
            className="festival-tel"
            href={`tel:${fixTel(infoCenter)}`}
            title={infoCenter}
          >
            {infoCenter}
          </a>
        </div>
      )}

      {/* 구분선 */}
      {(infoCenter || description) && <div className="festival-sep" role="separator" />}

      {/* 설명 */}
      {description && (
        <div className="festival-desc">
          {description}
        </div>
      )}
    </section>
  );
}
